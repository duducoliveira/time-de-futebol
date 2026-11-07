"""Cliente mínimo da API GraphQL do Buffer (https://developers.buffer.com).

O Buffer cobre: postar Reels/vídeos no Instagram e ler métricas por post
(reactions = curtidas, comments, saves, follows). Ele NÃO devolve o texto dos
comentários nem o número de seguidores — para isso usamos instagram_client.py.
Métricas no Buffer são atualizadas 1x por dia (atraso de até ~24h).
"""
from __future__ import annotations

import time
from typing import Any

import requests

ENDPOINT = "https://api.buffer.com"


class BufferError(RuntimeError):
    pass


class BufferClient:
    def __init__(self, api_key: str, organization_id: str | None = None):
        if not api_key:
            raise BufferError("BUFFER_API_KEY não definido")
        self.session = requests.Session()
        self.session.headers.update(
            {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        )
        self._org_id = organization_id or None

    # ------------------------------------------------------------------ core
    def gql(self, query: str, variables: dict[str, Any] | None = None) -> dict:
        for tentativa in range(4):
            r = self.session.post(
                ENDPOINT, json={"query": query, "variables": variables or {}}, timeout=60
            )
            if r.status_code == 429:  # rate limit: respeita Retry-After
                time.sleep(int(r.headers.get("Retry-After", 2 ** tentativa * 5)))
                continue
            r.raise_for_status()
            body = r.json()
            if body.get("errors"):
                raise BufferError(body["errors"])
            return body["data"]
        raise BufferError("rate limit do Buffer excedido")

    @property
    def organization_id(self) -> str:
        if not self._org_id:
            data = self.gql("query { account { organizations { id name } } }")
            orgs = data["account"]["organizations"]
            if not orgs:
                raise BufferError("nenhuma organização na conta Buffer")
            self._org_id = orgs[0]["id"]
        return self._org_id

    # -------------------------------------------------------------- leitura
    def canais(self) -> list[dict]:
        q = """query($org: OrganizationId!) {
          channels(input: { organizationId: $org }) {
            id name displayName service externalLink isQueuePaused
          }
        }"""
        return self.gql(q, {"org": self.organization_id})["channels"]

    def posts_com_metricas(self, channel_id: str, limite: int = 50) -> list[dict]:
        """Posts enviados do canal com métricas (paginado)."""
        q = """query($org: OrganizationId!, $ch: [ChannelId!], $first: Int, $after: String) {
          posts(first: $first, after: $after, input: {
            organizationId: $org
            filter: { status: [sent], channelIds: $ch }
          }) {
            edges { node {
              id text sentAt externalLink
              metrics { type name value unit }
              metricsUpdatedAt
            } }
            pageInfo { endCursor hasNextPage }
          }
        }"""
        posts: list[dict] = []
        after = None
        while len(posts) < limite:
            data = self.gql(
                q,
                {"org": self.organization_id, "ch": [channel_id],
                 "first": min(50, limite - len(posts)), "after": after},
            )["posts"]
            posts += [e["node"] for e in data["edges"]]
            if not data["pageInfo"]["hasNextPage"]:
                break
            after = data["pageInfo"]["endCursor"]
        for p in posts:  # achata métricas: {"reactions": 120, "comments": 34, ...}
            p["metricas"] = {m["type"]: m["value"] for m in (p.get("metrics") or [])}
        return posts

    # ------------------------------------------------------------- postagem
    def postar_reel(
        self,
        channel_id: str,
        video_url: str,
        legenda: str,
        *,
        agendar_para: str | None = None,  # ISO 8601, ex: 2026-11-10T21:00:00Z
        primeiro_comentario: str | None = None,
        thumbnail_ms: int = 500,  # capa: o quadro "DIA N + tema" do começo do vídeo
        rascunho: bool = False,
    ) -> dict:
        """Cria um Reel. `video_url` precisa ser público (ex: R2, S3, GCS)."""
        q = """mutation($input: CreatePostInput!) {
          createPost(input: $input) {
            ... on PostActionSuccess { post { id text dueAt status } }
            ... on MutationError { message }
          }
        }"""
        instagram: dict[str, Any] = {"type": "reel", "shouldShareToFeed": True}
        if primeiro_comentario:
            instagram["firstComment"] = primeiro_comentario
        entrada: dict[str, Any] = {
            "channelId": channel_id,
            "text": legenda,
            "schedulingType": "automatic",
            "mode": "customScheduled" if agendar_para else "addToQueue",
            "assets": [{"video": {"url": video_url,
                                   "metadata": {"thumbnailOffset": thumbnail_ms}}}],
            "metadata": {"instagram": instagram},
        }
        if agendar_para:
            entrada["dueAt"] = agendar_para
        if rascunho:
            entrada["saveToDraft"] = True
        res = self.gql(q, {"input": entrada})["createPost"]
        if "message" in res:
            raise BufferError(res["message"])
        return res["post"]
