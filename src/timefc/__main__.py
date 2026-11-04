"""CLI do projeto.  Uso: python -m timefc <comando>

  canais                 lista canais do Buffer (para achar o ID do Instagram)
  coletar                seguidores + métricas de todos os posts -> dados/metricas/AAAA-MM-DD.json
  preparar [--offline ARQ]   lê o episódio de ontem e gera episodios/dia-NNN/briefing.json
  fechar                     aplica o briefing, simula a rodada e gera o roteiro do vídeo
  postar VIDEO_URL [--legenda TXT] [--agendar ISO] [--comentario TXT] [--rascunho]
                             sem --legenda, usa a legenda/1º comentário do último roteiro
  video [--dia N] [--preview]  narra (ElevenLabs) e renderiza o MP4 do episódio
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
from . import episodio as ep

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

    print(f"@{perfil.get('username')}: {perfil.get('followers_count')} seguidores, {len(midias)} posts coletados")


EPISODIOS = RAIZ / "episodios"


def _pasta_dia(dia: int) -> Path:
    p = EPISODIOS / f"dia-{dia:03d}"
    p.mkdir(parents=True, exist_ok=True)
    return p


def cmd_preparar(args):
    estado = est.carregar()
    if args.offline:
        seguidores, post, comentarios, usuario = ep.dados_offline(json.loads(Path(args.offline).read_text()))
    else:
        ig = instagram()
        perfil = ig.perfil()
        seguidores, usuario = perfil.get("followers_count", 0), perfil.get("username", "")
        reels = [m for m in ig.midias(limite=10) if m.get("media_product_type") == "REELS"]
        post = reels[0] if reels and estado["episodios"] else None
        comentarios = ig.comentarios(post["id"]) if post else []
        if post and estado["episodios"]:
            estado["episodios"][-1]["post"] = {"id": post["id"], "permalink": post["permalink"]}
            est.salvar(estado)
    b = ep.preparar(estado, seguidores, post, comentarios, usuario)
    arq = _pasta_dia(b["dia"]) / "briefing.json"
    arq.write_text(json.dumps(b, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Dia {b['dia']}: {b['seguidores_ontem']} → {b['seguidores_hoje']} seguidores, "
          f"{b['curtidas']} curtidas (+R$ {b['receita_curtidas']})")
    for c, av in zip(b["top_comentarios"], b["avaliacao_comentarios"]):
        marca = "✔" if av["viavel"] else "✘"
        print(f"  {marca} ♥{c['curtidas']:>5}  @{c['usuario']}: {c['texto']}"
              + ("" if av["viavel"] else f"   ({av['motivo']})"))
    d = b["decisao"]
    print(f"\nDecisão automática: {d['titulo']} (R$ {d['custo']})" if d else "\nNenhum comentário viável.")
    for q in b["enquetes"]:
        print(f"  enquete {q['id']}: {q['parcial']['percentual']}")
    print(f"Revise (opcional) {arq.relative_to(RAIZ)} e rode: fechar")


def cmd_fechar(_):
    estado = est.carregar()
    pasta = _pasta_dia(estado["dia"] + 1)
    b = json.loads((pasta / "briefing.json").read_text(encoding="utf-8"))
    d = b.get("decisao")
    if d and not d.get("interpretacao"):
        sys.exit("Preencha decisao.interpretacao no briefing antes de fechar o dia.")
    novo, roteiro = ep.fechar(estado, b)
    (pasta / "roteiro.json").write_text(json.dumps(roteiro, ensure_ascii=False, indent=2), encoding="utf-8")
    (pasta / "roteiro.md").write_text(ep.roteiro_markdown(roteiro), encoding="utf-8")
    est.salvar(novo)
    print(f"Dia {novo['dia']} fechado. Caixa: R$ {novo['caixa']}. Roteiro: {(pasta / 'roteiro.md').relative_to(RAIZ)}")


def cmd_postar(args):
    legenda, comentario = args.legenda, args.comentario
    if not legenda:
        estado = est.carregar()
        r = json.loads((_pasta_dia(estado["dia"]) / "roteiro.json").read_text(encoding="utf-8"))
        legenda, comentario = r["legenda"], comentario or r["primeiro_comentario"]
    post = buffer().postar_reel(canal_ig(), args.video_url, legenda,
                                agendar_para=args.agendar, primeiro_comentario=comentario,
                                rascunho=args.rascunho)
    print(json.dumps(post, ensure_ascii=False, indent=2))


def cmd_video(args):
    from .video import gerar
    estado = est.carregar()
    dia = args.dia or estado["dia"]
    pasta = _pasta_dia(dia)
    saida = pasta / f"dia-{dia:03d}.mp4"
    gerar(pasta / "roteiro.json", saida, preview=args.preview)
    print(f"Vídeo: {saida.relative_to(RAIZ)}")


def cmd_renovar(_):
    r = instagram().renovar_token()
    print(f"Novo token (expira em {r.get('expires_in')}s). Atualize o segredo INSTAGRAM_ACCESS_TOKEN:")
    print(r.get("access_token"))


def main():
    p = argparse.ArgumentParser(prog="timefc")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("canais").set_defaults(f=cmd_canais)
    sub.add_parser("coletar").set_defaults(f=cmd_coletar)
    pr = sub.add_parser("preparar")
    pr.add_argument("--offline", help="JSON com seguidores/post/comentarios (teste sem API)")
    pr.set_defaults(f=cmd_preparar)
    sub.add_parser("fechar").set_defaults(f=cmd_fechar)
    po = sub.add_parser("postar")
    po.add_argument("video_url")
    po.add_argument("--legenda")
    po.add_argument("--agendar")
    po.add_argument("--comentario")
    po.add_argument("--rascunho", action="store_true")
    po.set_defaults(f=cmd_postar)
    vi = sub.add_parser("video", help="gera o MP4 do episódio a partir do roteiro")
    vi.add_argument("--dia", type=int)
    vi.add_argument("--preview", action="store_true", help="só quadros PNG de cada cena")
    vi.set_defaults(f=cmd_video)
    sub.add_parser("renovar-token").set_defaults(f=cmd_renovar)
    args = p.parse_args()
    args.f(args)


if __name__ == "__main__":
    main()
