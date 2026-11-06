"""Instagram API com Login do Instagram (graph.instagram.com).

Necessário porque o Buffer não expõe o TEXTO dos comentários (só a contagem),
e é o texto que decide as votações do time. Também traz seguidores em tempo real.

Pré-requisitos:
  * Conta do Instagram Profissional (Business ou Criador).
  * App no developers.facebook.com com o produto "Instagram" -> "API setup with
    Instagram login", permissões instagram_business_basic e
    instagram_business_manage_comments. Para uso só na própria conta, o modo
    de desenvolvimento basta (sem App Review).
  * Token de longa duração (60 dias) — renove com `renovar_token()`.
"""
from __future__ import annotations

from typing import Any, Iterator

import requests


class InstagramClient:
    """Aceita os dois tipos de token da Meta:
    * "IG…"  (login do Instagram)        -> graph.instagram.com, conta = "me"
    * "EAA…" (login do Facebook/unificado) -> graph.facebook.com, conta = ID da conta do Instagram
    """

    def __init__(self, access_token: str, version: str = "v23.0", ig_user_id: str | None = None):
        if not access_token:
            raise RuntimeError("INSTAGRAM_ACCESS_TOKEN não definido")
        self.token = access_token
        self.facebook = access_token.startswith("EAA")
        if self.facebook:
            if not ig_user_id:
                raise RuntimeError("token do tipo Facebook (EAA…) precisa do ID da conta do Instagram (clube.instagram_id)")
            self.base = f"https://graph.facebook.com/{version}"
            self.conta = ig_user_id
        else:
            self.base = f"https://graph.instagram.com/{version}"
            self.conta = "me"

    def _get(self, path: str, **params: Any) -> dict:
        params["access_token"] = self.token
        url = path if path.startswith("http") else f"{self.base}/{path}"
        r = requests.get(url, params=params, timeout=60)
        if r.status_code >= 400:
            raise RuntimeError(f"Instagram API {r.status_code}: {r.text}")
        return r.json()

    def _paginar(self, path: str, **params: Any) -> Iterator[dict]:
        data = self._get(path, **params)
        while True:
            yield from data.get("data", [])
            nxt = data.get("paging", {}).get("next")
            if not nxt:
                return
            r = requests.get(nxt, timeout=60)
            r.raise_for_status()
            data = r.json()

    # ---------------------------------------------------------------- dados
    def perfil(self) -> dict:
        campos = "id,username,followers_count,follows_count,media_count" + ("" if self.facebook else ",user_id")
        return self._get(self.conta, fields=campos)

    def midias(self, limite: int = 25) -> list[dict]:
        campos = "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count"
        out = []
        for m in self._paginar(f"{self.conta}/media", fields=campos, limit=min(limite, 50)):
            out.append(m)
            if len(out) >= limite:
                break
        return out

    def comentarios(self, media_id: str, com_respostas: bool = False) -> list[dict]:
        campos = "id,text,username,timestamp,like_count"
        if com_respostas:
            campos += ",replies{id,text,username,timestamp,like_count}"
        return list(self._paginar(f"{media_id}/comments", fields=campos, limit=50))

    def responder(self, comment_id: str, texto: str) -> dict:
        r = requests.post(f"{self.base}/{comment_id}/replies",
                          params={"message": texto, "access_token": self.token}, timeout=60)
        r.raise_for_status()
        return r.json()

    def renovar_token(self) -> dict:
        """Renova o token de longa duração (válido por mais 60 dias). Só para tokens "IG…"."""
        if self.facebook:
            raise RuntimeError("Token do tipo Facebook (EAA…): gere um novo no painel do app da Meta "
                               "(Casos de uso → API setup with Unified login → Gerar token).")
        return self._get("https://graph.instagram.com/refresh_access_token",
                         grant_type="ig_refresh_token")
