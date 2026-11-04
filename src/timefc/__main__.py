"""CLI do projeto.  Uso: python -m timefc <comando>

  canais                 lista canais do Buffer (para achar o ID do Instagram)
  coletar                seguidores + métricas de todos os posts -> dados/metricas/AAAA-MM-DD.json
  apurar                 lê comentários dos posts com votação aberta e atualiza o estado do time
  postar VIDEO_URL LEGENDA [--agendar ISO] [--comentario TXT] [--rascunho]
  renovar-token          renova o token do Instagram (rodar a cada ~50 dias)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date
from pathlib import Path

from dotenv import load_dotenv

from . import estado as est
from .buffer_client import BufferClient
from .instagram_client import InstagramClient
from .votacao import apurar

RAIZ = Path(__file__).resolve().parents[2]
load_dotenv(RAIZ / ".env")


def buffer() -> BufferClient:
    return BufferClient(os.environ.get("BUFFER_API_KEY", ""), os.environ.get("BUFFER_ORGANIZATION_ID"))


def instagram() -> InstagramClient:
    return InstagramClient(os.environ.get("INSTAGRAM_ACCESS_TOKEN", ""),
                           os.environ.get("INSTAGRAM_API_VERSION", "v23.0"))


def canal_ig() -> str:
    ch = os.environ.get("BUFFER_INSTAGRAM_CHANNEL_ID")
    if ch:
        return ch
    for c in buffer().canais():
        if c["service"] == "instagram":
            return c["id"]
    sys.exit("Nenhum canal Instagram no Buffer; defina BUFFER_INSTAGRAM_CHANNEL_ID")


def cmd_canais(_):
    for c in buffer().canais():
        print(f"{c['id']}  {c['service']:<10} {c['displayName'] or c['name']}  {c.get('externalLink') or ''}")


def cmd_coletar(_):
    ig = instagram()
    perfil = ig.perfil()
    midias = ig.midias(limite=50)
    try:
        posts_buffer = buffer().posts_com_metricas(canal_ig(), limite=50)
    except Exception as e:  # Buffer é complemento; não derruba a coleta
        print(f"[aviso] Buffer indisponível: {e}")
        posts_buffer = []
    por_link = {p.get("externalLink"): p for p in posts_buffer if p.get("externalLink")}
    for m in midias:
        b = por_link.get(m["permalink"])
        m["buffer"] = {"id": b["id"], "metricas": b["metricas"],
                       "atualizado": b["metricsUpdatedAt"]} if b else None

    snapshot = {"data": est.agora(), "perfil": perfil, "midias": midias}
    pasta = RAIZ / "dados" / "metricas"
    pasta.mkdir(parents=True, exist_ok=True)
    (pasta / f"{date.today().isoformat()}.json").write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")

    estado = est.carregar()
    estado["seguidores"]["historico"].append(
        {"data": snapshot["data"], "seguidores": perfil.get("followers_count")})
    est.salvar(estado)
    print(f"@{perfil.get('username')}: {perfil.get('followers_count')} seguidores, {len(midias)} posts coletados")


def cmd_apurar(args):
    ig = instagram()
    estado = est.carregar()
    abertas = [v for v in estado["votacoes"] if v["status"] == "aberta"]
    if not abertas:
        print("Nenhuma votação aberta.")
        return
    midias = {m["permalink"]: m for m in ig.midias(limite=50)}
    usuario_proprio = ig.perfil().get("username", "")
    for v in abertas:
        m = midias.get(v["post_permalink"])
        if not m:
            print(f"[{v['id']}] post não encontrado: {v['post_permalink']}")
            continue
        comentarios = ig.comentarios(m["id"])
        res = apurar(comentarios, v["opcoes"], v.get("peso_curtidas", 0), {usuario_proprio})
        print(f"[{v['id']}] {v['pergunta']}\n  {res['percentual']}  votantes={res['votantes']}"
              f"  vencedor={res['vencedor'] or '-'}{'  (EMPATE)' if res['empate'] else ''}")
        if args.encerrar:
            est.aplicar_resultado(estado, v, res)
        else:
            v["parcial"] = res
    est.salvar(estado)


def cmd_postar(args):
    post = buffer().postar_reel(canal_ig(), args.video_url, args.legenda,
                                agendar_para=args.agendar, primeiro_comentario=args.comentario,
                                rascunho=args.rascunho)
    print(json.dumps(post, ensure_ascii=False, indent=2))


def cmd_renovar(_):
    r = instagram().renovar_token()
    print(f"Novo token (expira em {r.get('expires_in')}s). Atualize o segredo INSTAGRAM_ACCESS_TOKEN:")
    print(r.get("access_token"))


def main():
    p = argparse.ArgumentParser(prog="timefc")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("canais").set_defaults(f=cmd_canais)
    sub.add_parser("coletar").set_defaults(f=cmd_coletar)
    a = sub.add_parser("apurar")
    a.add_argument("--encerrar", action="store_true", help="grava o vencedor no estado do time")
    a.set_defaults(f=cmd_apurar)
    po = sub.add_parser("postar")
    po.add_argument("video_url")
    po.add_argument("legenda")
    po.add_argument("--agendar")
    po.add_argument("--comentario")
    po.add_argument("--rascunho", action="store_true")
    po.set_defaults(f=cmd_postar)
    sub.add_parser("renovar-token").set_defaults(f=cmd_renovar)
    args = p.parse_args()
    args.f(args)


if __name__ == "__main__":
    main()
