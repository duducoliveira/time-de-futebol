"""Catálogo de ações que um comentário pode pedir, e a regra do COMENTÁRIO VIÁVEL.

Um comentário é viável quando pede algo do catálogo que:
  * o caixa consegue pagar (caixa de hoje, já com as curtidas de ontem), e
  * ainda não foi feito (melhorias únicas, como gramado e refletores).

O vencedor é o comentário viável mais curtido. Pedidos criativos fora do
catálogo ficam marcados como "revisar", e uma pessoa pode escolhê-los
editando o briefing.
"""
from __future__ import annotations

import random
import re

from .votacao import normalizar

# chave -> definição. "efeitos" usa a sintaxe de estado.definir ("+N" soma).
# "{autor}" é trocado pelo @ de quem comentou (homenagem).
# Preços calibrados em 07/11/2026 com os números reais do Dia 1 (256 curtidas): ÷5 dos originais.
CATALOGO: dict[str, dict] = {
    "banco_reservas": {"titulo": "Banco de reservas", "custo": 50, "unico": True,
                       "palavras": ["banco de reserva", "bancos de reserva", "banco de reservas", "bancos de reservas", "banco pros reservas"],
                       "efeitos": {"estrutura.banco_reservas": True},
                       "frase": "Banco de reservas: um banquinho de madeira na lateral do campo."},
    "rede": {"titulo": "Rede nova no gol", "custo": 60, "unico": True,
             "palavras": ["rede", "redes"],
             "efeitos": {"estrutura.rede": True},
             "frase": "Rede no gol, das simples. Agora dá pra saber se foi gol mesmo."},
    "bolas": {"titulo": "Bolas novas", "custo": 80, "unico": True,
              "palavras": ["bola", "bolas"],
              "efeitos": {"estrutura.bolas": True, "clube.forca": "+1"},
              "frase": "Compramos bolas novas. A antiga era mais remendo do que bola."},
    "uniforme": {"titulo": "Uniforme novo", "custo": 300, "unico": True,
                 "palavras": ["uniforme", "camisa", "camisas", "fardamento", "meiao", "chuteira", "chuteiras"],
                 "efeitos": {"estrutura.uniforme": "novo", "clube.forca": "+1"},
                 "frase": "Uniforme novo! Pela primeira vez, todo mundo com a mesma cor."},
    "lanchonete": {"titulo": "Lanchonete do {autor}", "custo": 500, "unico": True,
                   "palavras": ["lanchonete", "barraca", "pastel", "churrasquinho", "cantina", "espetinho", "lanche"],
                   "efeitos": {"estrutura.lanchonete": "Lanchonete do {autor}",
                               "regras.gasto_lanchonete_por_torcedor": "+1"},
                   "frase": "Construímos a Lanchonete do {autor}. Cada torcedor gasta um real por jogo, e tudo vai pro caixa."},
    "telhado": {"titulo": "Telhado novo no vestiário", "custo": 600, "unico": True,
                "palavras": ["telhado", "teto", "goteira", "goteiras", "telha", "telhas"],
                "efeitos": {"estrutura.telhado": True, "clube.forca": "+1"},
                "frase": "Telhado novo no vestiário. Acabou a goteira na cabeça do Professor."},
    "goleiro": {"titulo": "Goleiro novo", "custo": 800, "unico": False, "posicao": "GOL",
                "palavras": ["goleiro", "goleira", "arqueiro", "paredao"],
                "efeitos": {"clube.forca": "+4"},
                "frase": "Contratamos um goleiro de verdade."},
    "zagueiro": {"titulo": "Zagueiro novo", "custo": 800, "unico": False, "posicao": "ZAG",
                 "palavras": ["zagueiro", "zaga", "defensor", "defesa", "beque"],
                 "efeitos": {"clube.forca": "+3"},
                 "frase": "Chegou reforço pra zaga."},
    "meia": {"titulo": "Meia novo", "custo": 900, "unico": False, "posicao": "MEI",
             "palavras": ["meia", "meio campo", "meio-campo", "armador", "camisa 10"],
             "efeitos": {"clube.forca": "+3"},
             "frase": "Contratamos um meia que sabe dar passe."},
    "atacante": {"titulo": "Atacante novo", "custo": 1000, "unico": False, "posicao": "CA",
                 "palavras": ["atacante", "centroavante", "artilheiro", "camisa 9", "ataque", "matador"],
                 "efeitos": {"clube.forca": "+4"},
                 "frase": "Contratamos um atacante que corre."},
    "arquibancada": {"titulo": "Arquibancada nova", "custo": 1200, "unico": False,
                     "palavras": ["arquibancada", "arquibancadas", "estadio", "lugares", "assentos", "cadeiras"],
                     "efeitos": {"estrutura.capacidade": "+1500", "estrutura.arquibancada": "arquibancada de madeira"},
                     "frase": "Arquibancada nova: mais mil e quinhentos lugares pra torcida."},
    "tecnico": {"titulo": "Técnico de verdade", "custo": 1200, "unico": True,
                "palavras": ["tecnico", "treinador", "professor novo", "comissao"],
                "efeitos": {"estrutura.tecnico": True, "clube.forca": "+5"},
                "frase": "Contratamos um técnico de verdade, com prancheta e tudo."},
    "kombi": {"titulo": "Kombi do time", "custo": 1400, "unico": True,
              "palavras": ["kombi", "onibus", "van", "transporte", "busao"],
              "efeitos": {"estrutura.kombi": True, "clube.forca": "+1"},
              "frase": "O time agora tem Kombi. Acabou a carona na moto do Zé Marmita."},
    "vestiario": {"titulo": "Vestiário reformado", "custo": 1600, "unico": True, "requer": "telhado",
                  "palavras": ["vestiario", "chuveiro", "banheiro"],
                  "efeitos": {"estrutura.vestiario": "vestiário com chuveiro quente", "clube.forca": "+2"},
                  "frase": "Vestiário reformado, com chuveiro quente!"},
    "grama": {"titulo": "Grama no campo", "custo": 2400, "unico": True,
              "palavras": ["grama", "gramado", "campo novo", "arrumar o campo", "plantar"],
              "efeitos": {"estrutura.gramado": "grama", "clube.forca": "+4"},
              "frase": "Acabou o terrão: plantamos grama de verdade!"},
    "refletores": {"titulo": "Refletores", "custo": 3000, "unico": True,
                   "palavras": ["refletor", "refletores", "iluminacao", "luz", "luzes", "jogo a noite"],
                   "efeitos": {"estrutura.iluminacao": True, "regras.ingresso": "+1"},
                   "frase": "Refletores! Agora tem jogo à noite, e o ingresso sobe um real."},
}

APELIDOS = ["Paredão", "Bigode", "Canela", "Tiziu", "Brucutu", "Pezão", "Sabiá", "Ligeirinho",
            "Tanque", "Marreta", "Formiga", "Juninho", "Neném", "Gaúcho", "Pernambuco", "Coruja"]

TRACOS = {
    "GOL": ["pega tudo pelo alto, nada por baixo", "grita mais do que defende", "ex-goleiro de futsal"],
    "ZAG": ["chuta tudo pra frente", "nunca levou cartão (nunca jogou)", "dá carrinho até na sombra"],
    "MEI": ["passe certo, perna lenta", "só joga de calcanhar", "já foi gandula num jogo da Série A"],
    "CA": ["corre muito, finaliza pouco", "comemora antes de chutar", "artilheiro do campeonato da firma"],
}


def _ja_feito(estado: dict, chave: str) -> bool:
    return chave in {d.get("acao") for d in estado.get("decisoes", [])}


def acoes_no_texto(texto: str) -> list[str]:
    """Chaves do catálogo citadas no comentário, na ordem em que aparecem."""
    t = normalizar(texto)
    achadas = []
    for chave, item in CATALOGO.items():
        pos = [m.start() for p in item["palavras"]
               for m in [re.search(rf"\b{re.escape(normalizar(p))}\b", t)] if m]
        if pos:
            achadas.append((min(pos), chave))
    return [c for _, c in sorted(achadas)]


def avaliar(estado: dict, comentario: dict, caixa: float) -> dict:
    """Decide o que dá para fazer com um comentário dentro do caixa."""
    pedidas = acoes_no_texto(comentario["texto"])
    feitas, motivo, gasto = [], None, 0.0
    for chave in pedidas:
        item = CATALOGO[chave]
        if item["unico"] and _ja_feito(estado, chave):
            motivo = motivo or f"{item['titulo']} já foi feito"
            continue
        if item.get("requer") and not _ja_feito(estado, item["requer"]) and item["requer"] not in feitas:
            motivo = motivo or f"{item['titulo']} precisa de {CATALOGO[item['requer']]['titulo']} antes"
            continue
        if gasto + item["custo"] > caixa:
            motivo = motivo or f"{item['titulo']} custa R$ {item['custo']} e o caixa não cobre"
            continue
        feitas.append(chave)
        gasto += item["custo"]
    if not pedidas:
        motivo = "não pede nada do catálogo (revisar manualmente se for uma boa ideia)"
    return {"viavel": bool(feitas), "acoes": feitas, "custo": gasto,
            "motivo": None if feitas else motivo, "revisar": not pedidas}


def montar_decisao(estado: dict, comentario: dict, idx: int, acoes: list[str], dia: int) -> dict:
    autor = "@" + comentario["usuario"]
    efeitos: dict = {}
    frases, titulos = [], []
    custo = 0
    rng = random.Random(f"{dia}-{comentario['usuario']}")
    novos = []
    for chave in acoes:
        item = CATALOGO[chave]
        custo += item["custo"]
        titulos.append(item["titulo"].replace("{autor}", autor))
        frases.append(item["frase"].replace("{autor}", autor))
        for k, v in item["efeitos"].items():
            v = v.replace("{autor}", autor) if isinstance(v, str) else v
            if isinstance(v, str) and v.startswith("+") and k in efeitos:
                v = f"+{float(efeitos[k][1:]) + float(v[1:]):g}"
            efeitos[k] = v
        if item.get("posicao"):
            usados = {j.get("nome") for j in estado["elenco"].values()}
            nome = next(a for a in rng.sample(APELIDOS, len(APELIDOS)) if a not in usados)
            numero = str(max(int(n) for n in estado["elenco"]) + 1 + len(novos))
            novos.append(numero)
            efeitos[f"elenco.{numero}"] = {"nome": nome, "posicao": item["posicao"],
                                           "traco": rng.choice(TRACOS[item["posicao"]]),
                                           "chegou_no_dia": dia}
            frases[-1] += f" O nome dele é {nome}."
    return {"comentario": idx, "acoes": acoes, "titulo": " + ".join(titulos),
            "interpretacao": " ".join(frases), "custo": custo, "efeitos": efeitos,
            "automatica": True}


def escolher(estado: dict, top: list[dict], caixa: float, dia: int) -> tuple[dict | None, list[dict]]:
    """Retorna (decisão do comentário viável mais curtido, avaliação de cada comentário)."""
    avaliacoes = []
    decisao = None
    for i, c in enumerate(top):
        av = avaliar(estado, c, caixa)
        avaliacoes.append({"indice": i, "usuario": c["usuario"], "curtidas": c["curtidas"], **av})
        if decisao is None and av["viavel"]:
            decisao = montar_decisao(estado, c, i, av["acoes"], dia)
    return decisao, avaliacoes


def sugerir_opcoes(estado: dict, caixa_previsto: float, n: int = 2) -> list[str]:
    """Opções para a próxima decisão: o que cabe no caixa e ainda não foi feito."""
    candidatos = [(k, v) for k, v in CATALOGO.items()
                  if not (v["unico"] and _ja_feito(estado, k))
                  and (not v.get("requer") or _ja_feito(estado, v["requer"]))
                  # arquibancada nova só quando a torcida não couber mais
                  and (k != "arquibancada" or estado["torcida"]["seguidores"] > estado["estrutura"]["capacidade"])]
    cabem = [c for c in candidatos if c[1]["custo"] <= max(caixa_previsto, 3000)]
    pool = sorted(cabem or candidatos, key=lambda kv: -kv[1]["custo"])[:5]
    rng = random.Random(f"opcoes-{estado['dia']}")
    escolhidas = rng.sample(pool, min(n, len(pool)))
    return [v["titulo"].replace(" do {autor}", "") + "?" for _, v in escolhidas]
