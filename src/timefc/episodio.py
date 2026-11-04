"""Ciclo diário de um episódio.

  1. preparar(): lê seguidores, curtidas e comentários do episódio de ontem e gera
     o briefing (ranking dos comentários + campos de decisão a preencher).
  2. Uma pessoa (ou o Claude) preenche a "decisao" do briefing: como o comentário
     vencedor vira ação no clube, quanto custa e o que muda.
  3. fechar(): aplica tudo, simula a rodada, calcula a bilheteria e gera o
     roteiro do vídeo de hoje.

Regras do formato:
  * 1 seguidor = 1 torcedor (limitado pela capacidade do estádio no dia do jogo)
  * 1 curtida no episódio anterior = +R$1 no caixa
  * O comentário mais curtido do episódio anterior decide o que o clube faz
"""
from __future__ import annotations

import copy
from typing import Any

from . import estado as est
from .comentarios import ranking
from .liga import calendario, simular, tabela
from .votacao import apurar


def _moeda(estado: dict, v: float) -> str:
    s = f"{abs(v):,.0f}".replace(",", ".")
    return f"{'-' if v < 0 else ''}{estado.get('moeda', 'R$')} {s}"


def _n(v: int) -> str:
    return f"{v:,}".replace(",", ".")


# --------------------------------------------------------------------- etapa 1
def preparar(estado: dict, seguidores: int, post_anterior: dict | None,
             comentarios: list[dict], usuario_proprio: str = "") -> dict:
    """`post_anterior`: {"id","permalink","like_count"} do último episódio (ou None no dia 1)."""
    curtidas = int((post_anterior or {}).get("like_count") or 0)
    top = ranking(comentarios, n=5, ignorar_usuarios={usuario_proprio})
    enquetes = []
    for e in estado.get("enquetes", []):
        if e.get("status") == "aberta":
            enquetes.append({"id": e["id"], "pergunta": e["pergunta"],
                             "parcial": apurar(comentarios, e["opcoes"], e.get("peso_curtidas", 0),
                                               {usuario_proprio})})
    ultima = estado["episodios"][-1] if estado["episodios"] else None
    return {
        "dia": estado["dia"] + 1,
        "seguidores_ontem": estado["torcida"]["seguidores"],
        "seguidores_hoje": seguidores,
        "post_anterior": post_anterior,
        "curtidas": curtidas,
        "receita_curtidas": curtidas * estado["regras"]["por_curtida"],
        "caixa_atual": estado["caixa"],
        "opcoes_ontem": (ultima or {}).get("proxima_decisao", {}).get("opcoes"),
        "top_comentarios": top,
        "enquetes": enquetes,
        # ---- PREENCHER antes de fechar o dia ----
        "decisao": {
            "comentario": 0 if top else None,  # índice em top_comentarios (o 1º é o mais curtido)
            "titulo": "",            # texto curto na tela, ex: "LANCHONETE DO @fulano"
            "interpretacao": "",     # o que o clube fez de fato
            "custo": 0,
            "efeitos": {},           # ex: {"estrutura.gramado": "grama", "clube.forca": "+4"}
        },
        "encerrar_enquetes": [],     # ids das enquetes a encerrar hoje
        "nova_enquete": None,        # {"id","pergunta","atributo","opcoes":{"A":[..]},"valores":{"A":..}}
        "proxima_decisao": {
            "pergunta": "O que a gente faz com o dinheiro?",
            "opcoes": ["Opção 1", "Opção 2", "Outra ideia?"],
        },
    }


# --------------------------------------------------------------------- etapa 2
def fechar(estado: dict, briefing: dict) -> tuple[dict, dict]:
    """Aplica o briefing ao estado. Retorna (novo_estado, roteiro)."""
    e = copy.deepcopy(estado)
    e["dia"] = briefing["dia"]
    nome = e["clube"]["nome"]
    cenas: list[dict] = []

    def cena(cid, narracao, tela=(), cenario="campo", personagens=(), **extra):
        cenas.append({"id": cid, "cenario": cenario, "personagens": list(personagens),
                      "texto_tela": list(tela), "narracao": narracao, **extra})

    # --- abertura / torcida
    antes, hoje = briefing["seguidores_ontem"], briefing["seguidores_hoje"]
    e["torcida"]["seguidores"] = hoje
    e["torcida"]["historico"].append({"dia": e["dia"], "seguidores": hoje, "data": est.agora()})
    if e["dia"] == 1:
        cena("abertura", f"Dia 1. A gente acabou de fundar o {nome}. Zero torcedores, campo de terra "
             "e um sonho. Aqui funciona assim: cada pessoa que seguir vira um torcedor de verdade, "
             "no nosso estádio.", ["DIA 1", "CLUBE FUNDADO", "1 SEGUIDOR = 1 TORCEDOR"],
             personagens=["narrador"])
    else:
        cena("abertura", f"Dia {e['dia']}. Ontem o {nome} tinha {_n(antes)} torcedores. "
             f"Hoje? {_n(hoje)}!", [f"DIA {e['dia']}", f"ONTEM: {_n(antes)}", f"{_n(hoje)} TORCEDORES"],
             cenario="estadio_torcida", personagens=["narrador"], torcida=hoje)

    # --- caixa pelas curtidas
    if briefing["receita_curtidas"]:
        est.lancar(e, briefing["receita_curtidas"], f"curtidas do dia {e['dia'] - 1}")
        cena("caixa", f"{_n(briefing['curtidas'])} curtidas viraram {_moeda(e, briefing['receita_curtidas'])} "
             f"no caixa. A Dona Cida contou nota por nota.",
             ["1 CURTIDA = +" + _moeda(e, e['regras']['por_curtida']),
              f"{_n(briefing['curtidas'])} CURTIDAS", f"CAIXA: {_moeda(e, e['caixa'])}"],
             cenario="sede", personagens=["presidente"], caixa=e["caixa"])

    # --- comentário vencedor
    d = briefing.get("decisao") or {}
    idx = d.get("comentario")
    if idx is not None and briefing["top_comentarios"]:
        c = briefing["top_comentarios"][idx]
        custo = float(d.get("custo") or 0)
        if custo:
            est.lancar(e, -custo, d.get("titulo") or "decisão da torcida")
        for caminho, valor in (d.get("efeitos") or {}).items():
            est.definir(e, caminho, valor)
        e["liga"]["times"][nome] = e["clube"]["forca"]
        est.evento(e, d.get("interpretacao") or c["texto"], autor=c["usuario"], curtidas=c["curtidas"])
        cena("comentario", f"O comentário mais curtido de ontem foi do @{c['usuario']}: \"{c['texto']}\". "
             f"{d.get('interpretacao', '')}".strip(),
             ["COMENTÁRIO MAIS CURTIDO", f"@{c['usuario']} · ♥ {_n(c['curtidas'])}", c["texto"],
              d.get("titulo", "").upper()] + ([f"-{_moeda(e, custo)}"] if custo else []),
             cenario="sede", comentario=c)

    # --- enquetes
    for eid in briefing.get("encerrar_enquetes", []):
        enq = next(x for x in e["enquetes"] if x["id"] == eid)
        parc = next(x["parcial"] for x in briefing["enquetes"] if x["id"] == eid)
        est.aplicar_enquete(e, enq, parc)
        if enq["status"] == "encerrada":
            cena(f"enquete_{eid}", f"E a votação de ontem: {enq['pergunta']} Venceu "
                 f"{enq['valores'][parc['vencedor']]}, com {parc['percentual'][parc['vencedor']]}%.",
                 [enq["pergunta"].upper(), str(enq["valores"][parc["vencedor"]]).upper()])

    # --- rodada
    liga = e["liga"]
    times = list(liga["times"])
    cal = calendario(times)
    partida = None
    if e["dia"] > 1 and liga["rodada"] < len(cal):  # dia 1 é só a fundação; estreia no dia 2
        resultados_rodada = []
        for m, v in cal[liga["rodada"]]:
            r = simular(m, v, liga["times"], semente=f"{e['dia']}-{m}-{v}")
            r["rodada"] = liga["rodada"] + 1
            resultados_rodada.append(r)
            if nome in (m, v):
                partida = r
        liga["resultados"] += resultados_rodada
        liga["rodada"] += 1

    if partida:
        casa = partida["mandante"] == nome
        adv = partida["visitante"] if casa else partida["mandante"]
        nossos = partida["gols_mandante"] if casa else partida["gols_visitante"]
        deles = partida["gols_visitante"] if casa else partida["gols_mandante"]
        placar = f"{partida['gols_mandante']} x {partida['gols_visitante']}"
        placar_completo = f"{partida['mandante']} {placar} {partida['visitante']}"
        cena("pre_jogo", f"Rodada {liga['rodada']}: {nome} contra o {adv}"
             f"{', em casa' if casa else ', fora de casa'}.",
             [f"RODADA {liga['rodada']}", f"{partida['mandante']} x {partida['visitante']}"],
             cenario="campo_dia_de_jogo")
        for g in partida["gols"]:
            nosso = g["time"] == nome
            cena(f"gol_{g['minuto']}", ("GOOOOOL DO " + nome.upper() + "!") if nosso
                 else f"Gol do {adv}. Não dá pra explicar.",
                 [f"{g['minuto']}'", "GOOOOL!" if nosso else f"GOL DO {adv.upper()}"],
                 cenario="gol", minuto=g["minuto"], nosso=nosso)
        resultado = "vitória" if nossos > deles else "empate" if nossos == deles else "derrota"
        frase = {"vitória": f"Vitória do {nome} por {nossos} a {deles}!",
                 "empate": f"Empate em {nossos} a {deles}.",
                 "derrota": f"Derrota por {deles} a {nossos}."}[resultado]
        cena("fim_de_jogo", f"Fim de jogo. {frase}",
             ["FIM DE JOGO", placar_completo], cenario="campo_dia_de_jogo", resultado=resultado)
        est.evento(e, f"Rodada {liga['rodada']}: {placar_completo}")

        if casa:
            publico = min(hoje, e["estrutura"]["capacidade"])
            bilheteria = publico * e["regras"]["ingresso"]
            lanche = publico * e["regras"].get("gasto_lanchonete_por_torcedor", 0)
            if bilheteria:
                est.lancar(e, bilheteria, f"bilheteria rodada {liga['rodada']} ({publico} pagantes)")
            if lanche:
                est.lancar(e, lanche, f"lanchonete rodada {liga['rodada']}")
            lotado = hoje > e["estrutura"]["capacidade"]
            if publico:
                cena("bilheteria", f"{_n(publico)} pagantes a {_moeda(e, e['regras']['ingresso'])}: "
                 f"{_moeda(e, bilheteria + lanche)} pro clube."
                     + (f" E ficou gente de fora: o estádio só cabe {_n(e['estrutura']['capacidade'])}." if lotado else ""),
                     [f"{_n(publico)} × {_moeda(e, e['regras']['ingresso'])} = {_moeda(e, bilheteria)}"]
                     + (["LOTADO"] if lotado else []), cenario="estadio_torcida", torcida=publico)

    tab = tabela(times, liga["resultados"])
    liga["tabela"] = tab
    pos = next(l["pos"] for l in tab if l["time"] == nome)
    if partida:
        cena("tabela", f"Na tabela, o {nome} está em {pos}º.", [liga["nome"].upper(), f"{pos}º LUGAR"],
             cenario="tabela", tabela=tab)

    # --- nova enquete e próxima decisão
    if briefing.get("nova_enquete"):
        nova = dict(briefing["nova_enquete"], status="aberta", aberta_no_dia=e["dia"])
        e["enquetes"].append(nova)
        cena("enquete_nova", f"E tem votação: {nova['pergunta']} "
             + " ou ".join(f"{k}, {v}" for k, v in nova["valores"].items()) + "? Comenta aí.",
             [nova["pergunta"].upper()] + [f"{k}: {v}" for k, v in nova["valores"].items()])
    prox = briefing["proxima_decisao"]
    cena("decisao", f"Sobrou {_moeda(e, e['caixa'])} no caixa. {prox['pergunta']} "
         "O comentário mais curtido decide.",
         [f"CAIXA: {_moeda(e, e['caixa'])}", *[o.upper() for o in prox["opcoes"]],
          f"DECISÃO #{e['dia']}", "COMENTÁRIO MAIS CURTIDO DECIDE"],
         cenario="sede", personagens=["narrador", "presidente"])

    if liga["rodada"] < len(cal):
        m, v = next(j for j in cal[liga["rodada"]] if nome in j)
        adv = v if m == nome else m
        cena("proximo", f"Amanhã: {nome} contra o {adv}. Segue pra entrar no estádio, curte pra encher o caixa.",
             ["PRÓXIMO JOGO", f"{m} x {v}", e["clube"]["instagram"]], cenario="sede")

    roteiro = {"dia": e["dia"], "clube": nome, "caixa": e["caixa"], "torcida": hoje,
               "posicao": pos, "partida": partida, "cenas": cenas,
               "legenda": legenda(e, prox), "primeiro_comentario": prox["pergunta"] + " 👇"}
    e["episodios"].append({"dia": e["dia"], "data": est.agora(), "proxima_decisao": prox,
                           "post": None})
    return e, roteiro


def legenda(estado: dict, prox: dict) -> str:
    return (f"DIA {estado['dia']} do {estado['clube']['nome']} ⚽\n\n"
            f"{prox['pergunta']} O comentário mais curtido decide.\n\n"
            f"1 seguidor = 1 torcedor no estádio\n1 curtida = +{_moeda(estado, estado['regras']['por_curtida'])} no caixa\n\n"
            "#futebol #varzea #futebolamador")


def roteiro_markdown(r: dict) -> str:
    linhas = [f"# Roteiro do dia {r['dia']}: {r['clube']}", "",
              f"Torcida: {_n(r['torcida'])} · Caixa: R$ {_n(int(r['caixa']))} · Posição: {r['posicao']}º", ""]
    for i, c in enumerate(r["cenas"], 1):
        linhas += [f"## {i}. {c['id']}  ·  cenário: `{c['cenario']}`",
                   f"**Na tela:** {' | '.join(t for t in c['texto_tela'] if t)}", "",
                   f"> {c['narracao']}", ""]
    linhas += ["---", "**Legenda do post:**", "", r["legenda"], "",
               f"**Primeiro comentário:** {r['primeiro_comentario']}"]
    return "\n".join(linhas) + "\n"


def dados_offline(arquivo: dict[str, Any]) -> tuple[int, dict | None, list[dict], str]:
    """Para testar sem API: {"seguidores":..,"post":{..},"comentarios":[..],"usuario":".."}"""
    return (arquivo["seguidores"], arquivo.get("post"), arquivo.get("comentarios", []),
            arquivo.get("usuario", ""))
