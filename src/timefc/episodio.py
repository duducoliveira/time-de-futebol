"""Ciclo diário de um episódio.

  1. preparar(): lê seguidores, curtidas e comentários do episódio de ontem, escolhe
     o COMENTÁRIO VIÁVEL MAIS CURTIDO (catalogo.py) e gera o briefing.
  2. (opcional) Uma pessoa revisa o briefing: pode trocar a decisão, por exemplo
     para um pedido criativo fora do catálogo.
  3. fechar(): aplica tudo, simula a rodada, calcula a bilheteria e gera o
     roteiro do vídeo de hoje (cenas tipadas, que o renderizador transforma em vídeo).

Regras do formato:
  * 1 seguidor = 1 torcedor (limitado pela capacidade do estádio no dia do jogo)
  * 1 curtida no episódio anterior = +R$1 no caixa
  * O comentário viável mais curtido decide o que o clube faz
"""
from __future__ import annotations

import copy
import json
from pathlib import Path
import random
import re
from typing import Any

from . import catalogo
from . import estado as est
from .comentarios import ranking
from .liga import calendario, simular, tabela
from .votacao import apurar


def _moeda(estado: dict, v: float) -> str:
    s = f"{abs(v):,.0f}".replace(",", ".")
    return f"{'-' if v < 0 else ''}{estado.get('moeda', 'R$')} {s}"


def _n(v: int) -> str:
    return f"{int(v):,}".replace(",", ".")


# --------------------------------------------------------------------- etapa 1
def preparar(estado: dict, seguidores: int, post_anterior: dict | None,
             comentarios: list[dict], usuario_proprio: str = "") -> dict:
    """`post_anterior`: {"id","permalink","like_count"} do último episódio (ou None no dia 1)."""
    curtidas = int((post_anterior or {}).get("like_count") or 0)
    receita = curtidas * estado["regras"]["por_curtida"]
    caixa_hoje = estado["caixa"] + receita
    dia = estado["dia"] + 1
    top = ranking(comentarios, n=10, ignorar_usuarios={usuario_proprio})
    decisao, avaliacoes = catalogo.escolher(estado, top, caixa_hoje, dia)

    enquetes = []
    for e in estado.get("enquetes", []):
        if e.get("status") == "aberta":
            enquetes.append({"id": e["id"], "pergunta": e["pergunta"],
                             "parcial": apurar(comentarios, e["opcoes"], e.get("peso_curtidas", 0),
                                               {usuario_proprio})})
    caixa_previsto = caixa_hoje - (decisao or {}).get("custo", 0)
    pergunta = ("Primeira decisão: o que a gente faz com o dinheiro?" if dia == 1
                else "O que a gente faz agora?")
    return {
        "dia": dia,
        "seguidores_ontem": estado["torcida"]["seguidores"],
        "seguidores_hoje": seguidores,
        "post_anterior": post_anterior,
        "curtidas": curtidas,
        "receita_curtidas": receita,
        "caixa_atual": estado["caixa"],
        "caixa_com_curtidas": caixa_hoje,
        "top_comentarios": top,
        "avaliacao_comentarios": avaliacoes,
        "enquetes": enquetes,
        # Decisão automática (comentário viável mais curtido). Pode ser editada.
        "decisao": decisao,
        # Enquetes abertas há 1+ dia são encerradas automaticamente.
        "encerrar_enquetes": [q["id"] for q in enquetes],
        "nova_enquete": None,
        "proxima_decisao": {
            "pergunta": pergunta,
            "opcoes": catalogo.sugerir_opcoes(estado, caixa_previsto + 3000) + ["Outra ideia?"],
        },
    }


# --------------------------------------------------------------------- etapa 2
def _artilheiro(e: dict, rng: random.Random) -> dict:
    pesos = {"CA": 6, "PD": 3, "PE": 3, "MEI": 3, "VOL": 1, "LD": 1, "LE": 1, "ZAG": 1, "GOL": 0}
    jogadores = [(n, j) for n, j in e["elenco"].items() if pesos.get(j["posicao"], 1)]
    n, j = rng.choices(jogadores, weights=[pesos.get(j["posicao"], 1) for _, j in jogadores])[0]
    return {"numero": n, **j}


# Torcida desenhada: cada boneco vale ~ (n/9)^0.5 torcedores; quem não cabe na
# arquibancada vai para a beira do campo, o muro, as árvores e as lajes do morro.
# O renderizador (video/cenas.js: niveisTorcida) usa exatamente as mesmas faixas.
FAIXAS = [("beira", 60), ("muro", 40), ("arvore", 40), ("laje", 200)]


def bonecos(n: int) -> int:
    return round(3 * (max(n, 0) ** 0.5))


def nivel_torcida(torcida: int, capacidade: int) -> str:
    if torcida == 0:
        return "vazio"
    if torcida <= capacidade:
        return "enchendo" if torcida < capacidade * 0.7 else "quase"
    sobra = bonecos(torcida) - bonecos(capacidade)
    for nome, tam in FAIXAS:
        if sobra <= tam:
            return nome
        sobra -= tam
    return "tudo"


# Variações da fala da torcida (escolhida pelo dia, para não repetir a do vídeo anterior)
FALAS_TORCIDA_VARIAS = {
    "enchendo": [
        "Atrás do gol já tá ficando apertado: tem gente dividindo banco!",
        "Chegou torcedor de tudo quanto é canto do bairro!",
        "A arquibancada tá ganhando cor: é vinho pra todo lado!",
        "Já tem fila pra sentar no banco de madeira!",
        "Tem torcedor novo que nem sabe o nome dos jogadores. Mas já grita!",
    ],
}
FALAS_TORCIDA = {
    "vazio": "A arquibancada continua vazia. Chama os amigos!",
    "enchendo": "Olha a arquibancada começando a encher!",
    "quase": "A arquibancada está quase lotada!",
    "beira": "Lotou! Já tem gente em pé na beira do campo.",
    "muro": "Lotou tanto que tem torcedor sentado em cima do muro.",
    "arvore": "Não cabe mais ninguém! Tem gente assistindo de cima da árvore!",
    "laje": "O estádio não comporta! O pessoal do morro está assistindo da laje!",
    "tudo": "Tem torcedor na árvore, no muro, na laje e no poste. O bairro inteiro parou!",
}
ROTULO_NIVEL = {"beira": "LOTADO", "muro": "GENTE NO MURO", "arvore": "TEM GENTE NA ÁRVORE",
                "laje": "TORCIDA NA LAJE", "tudo": "O BAIRRO PAROU"}

# Gritos de gol (narrados com o eleven_v3; [tags] não aparecem na legenda)
GRITOS_GOL = [
    "[shouting] GOOOOOOOOOL! GOL! GOL! [excited] É DO {N}! {A}, aos {m} minutos! Que golaço!",
    "[shouting] É GOOOOOOOOL! [excited] Olha o que ele fez! {A}, aos {m}! O {N} não para!",
    "[shouting] GOOOOOOOOL DO {N}! [excited] {A}! Aos {m} minutos! Pode comemorar, torcida!",
    "[shouting] ENTROOOOU! [excited] GOL DO {N}! {A}, aos {m}! Que pintura!",
    "[shouting] GOOOOOOOOOL! [excited] Chora, goleiro! {A} manda pra rede aos {m}! É DO {N}!",
]

PIADAS_GOL_CONTRA = [
    "O Baixinho pulou. Pulou bonito. Mas pulou pro lado errado.",
    "A zaga parou pra ver. Literalmente parou.",
    "O Professor disse que estava se posicionando.",
    "Ninguém marcou ninguém. Foi democrático.",
]
PIADAS_ADVERSARIO = {
    "Veteranos do Bairro": "média de idade: sessenta e oito anos.",
    "Atlético Padaria": "o time inteiro trabalha na mesma padaria. Chegam cheirando a pão.",
    "Amigos do Churrasco FC": "o jogo só começa depois que a picanha sai.",
    "Juventude do Asfalto": "o time mais forte da divisão. Nunca pisaram em terra.",
    "Leões do Brejo": "jogam no brejo. Literalmente.",
    "Ferro-Velho EC": "o uniforme é feito de lona de caminhão.",
    "Real Laje": "treinam em cima de uma laje. Ninguém sabe como.",
    "Estrela da Feira": "patrocinados pela banca de pastel.",
    "Grêmio Vila Barro": "o único campo pior que o nosso.",
}


POSICOES = {"GOL": "goleiro", "ZAG": "zagueiro", "LD": "lateral", "LE": "lateral", "VOL": "volante",
            "MEI": "meia", "CA": "atacante", "PD": "ponta", "PE": "ponta"}
ARQ_APELIDOS = Path(__file__).resolve().parents[2] / "dados" / "apelidos.json"


def piada_do_dia(e: dict, briefing: dict, adv: str, rng: random.Random) -> dict | None:
    """Uma brincadeira de nome/apelido por episódio (a partir do dia 3), no formato
    "posição + apelido + piada" (ex: lateral Caxumba: quando desce é um perigo).

    briefing["piada"] pode trazer uma piada pronta (ex: com um seguidor):
      {"alvo": "seguidor", "narracao": "...", "texto_tela": [...], "nome": ..., "apelido": ..., "piada": ..., "instagram": ...}
    ou fixar o alvo/apelido: {"alvo": "nosso"|"adversario", "apelido": "Caxumba"}; {"pular": true} desliga.
    Sem nada, alterna: dia ímpar = jogador nosso (o apelido fica), dia par = jogador do adversário."""
    pedido = briefing.get("piada") or {}
    if pedido.get("pular") or (e["dia"] < 3 and not pedido):
        return None
    e.setdefault("piadas_usadas", [])
    if pedido.get("alvo") == "seguidor" or pedido.get("narracao"):
        if pedido.get("apelido"):
            e["piadas_usadas"].append(pedido["apelido"])
            if pedido.get("alvo") == "nosso" and pedido.get("numero") in e["elenco"]:  # apelido novo fica no elenco
                e["elenco"][pedido["numero"]]["apelido"] = pedido["apelido"]
                est.evento(e, f"{e['elenco'][pedido['numero']]['nome']} ganhou o apelido {pedido['apelido']}")
        return {"alvo": pedido.get("alvo", "seguidor"), **{k: v for k, v in pedido.items() if k != "alvo"}}
    banco = json.loads(ARQ_APELIDOS.read_text(encoding="utf-8"))["apelidos"]
    livres = [a for a in banco if a["apelido"] not in e["piadas_usadas"]] or banco
    alvo = pedido.get("alvo") or ("nosso" if e["dia"] % 2 else "adversario")
    if pedido.get("apelido"):
        livres = [a for a in banco if a["apelido"] == pedido["apelido"]] or livres
    if alvo == "nosso":
        sem_apelido = [(n, j) for n, j in e["elenco"].items() if not j.get("apelido")]
        opcoes = [(a, n, j) for a in livres if not a.get("so_adversario")
                  for n, j in sem_apelido if POSICOES.get(j["posicao"]) == a["posicao"]]
        if not opcoes:
            return None
        a, n, j = rng.choice(opcoes)
        j["apelido"] = a["apelido"]
        e["piadas_usadas"].append(a["apelido"])
        est.evento(e, f"{j['nome']} ganhou o apelido {a['apelido']}")
        return {"alvo": "nosso", "numero": n, "nome": j["nome"], "posicao": a["posicao"], "apelido": a["apelido"],
                "piada": a["piada"], "narracao": f"E o {j['nome']} ganhou apelido novo: {a['posicao']} "
                f"{a['apelido']}. {a['piada'].capitalize()}!", "texto_tela": [f"#{n} {j['nome'].upper()}"]}
    a = rng.choice(livres)
    e["piadas_usadas"].append(a["apelido"])
    return {"alvo": "adversario", "time": adv, "posicao": a["posicao"], "apelido": a["apelido"], "piada": a["piada"],
            "numero": str(rng.randint(2, 11)),
            "narracao": f"Fica de olho no {a['posicao']} do {adv}, o {a['apelido']}: {a['piada']}!",
            "texto_tela": [f"DE OLHO NO {adv.upper()}"]}


def tema_do_dia(e: dict, briefing: dict, cal: list) -> str:
    """Texto da capa do vídeo (abaixo do "DIA N"): briefing["tema"] ou o jogo do dia."""
    if briefing.get("tema"):
        return briefing["tema"]
    liga, nome = e["liga"], e["clube"]["nome"]
    if briefing.get("sem_jogo") or liga["rodada"] >= len(cal):
        return ""
    m, v = next(j for j in cal[liga["rodada"]] if nome in j)
    adv = v if m == nome else m
    if (liga.get("rival") or {}).get("time") == adv:
        return "CLÁSSICO!"
    if liga["rodada"] == 0:
        return "ESTREIA"
    return f"RODADA {liga['rodada'] + 1}"


def calendario_do_clube(e: dict) -> list[list[tuple[str, str]]]:
    """Calendário com os mandos roteirizados: liga.roteiro[N].mando = "casa" ou "fora".
    Ao inverter o mando da rodada N, inverte também o jogo espelho do returno."""
    nome = e["clube"]["nome"]
    cal = [list(r) for r in calendario(list(e["liga"]["times"]))]
    turno = len(cal) // 2
    for n, regra in (e["liga"].get("roteiro") or {}).items():
        mando = regra.get("mando")
        if not mando:
            continue
        k = int(n) - 1
        for idx in (k, k + turno if k < turno else k - turno):
            for j, (m, v) in enumerate(cal[idx]):
                if nome in (m, v):
                    em_casa = m == nome
                    quer_casa = (mando == "casa") if idx == k else (mando != "casa")
                    if em_casa != quer_casa:
                        cal[idx][j] = (v, m)
    return cal


def _placar_nosso(gols: list[dict], nome: str) -> int:
    """Saldo do Poeira depois desses gols (negativo = perdendo)."""
    return sum(1 if g["time"] == nome else -1 for g in gols)


def _sigla(nome: str) -> str:
    """Mesma regra de sigla() em video/arte.js."""
    ign = {"do", "da", "de", "dos", "das", "fc", "ec"}
    p = [w for w in re.split(r"[\s-]+", nome) if w.lower() not in ign]
    s = "".join(w[0] for w in p[:3]) if len(p) >= 3 else (p[0][0] + p[1][:2] if len(p) == 2 else p[0][:3])
    return s.upper()


def _desfecho(r: dict, nome: str) -> str:
    nossos = r["gols_mandante"] if r["mandante"] == nome else r["gols_visitante"]
    deles = r["gols_visitante"] if r["mandante"] == nome else r["gols_mandante"]
    return "vitória" if nossos > deles else "empate" if nossos == deles else "derrota"


def _simular_com_desfecho(m: str, v: str, forca: dict, semente: str, nome: str, regra: dict) -> dict:
    """Simula até sair o desfecho combinado (ex: perder a estreia), de forma determinística.
    regra: {"resultado": "derrota", "max_gols_sofridos": 3, "marca_gol": true,
            "gols_nossos_a_partir_do_minuto": 46}"""
    if regra.get("sequencia"):  # placar todo roteirizado: monta o jogo direto (minutos sorteados, de forma fixa)
        seq, rng = regra["sequencia"], random.Random(f"{semente}-seq")
        gap, fim = regra.get("intervalo_minimo_gols", 5), regra.get("ultimo_gol_a_partir_do_minuto", 0)
        adv = v if m == nome else m
        for _ in range(5000):
            mins = sorted(rng.sample(range(3, 91), len(seq)))
            if all(b - a >= gap for a, b in zip(mins, mins[1:])) and mins[-1] >= fim and \
                    not (regra.get("gols_nossos_a_partir_do_minuto") and any(
                        x < regra["gols_nossos_a_partir_do_minuto"] for x, c in zip(mins, seq) if c == "N")):
                gols = [{"minuto": x, "time": nome if c == "N" else adv} for x, c in zip(mins, seq)]
                return {"mandante": m, "visitante": v, "gols": gols,
                        "gols_mandante": sum(g["time"] == m for g in gols),
                        "gols_visitante": sum(g["time"] == v for g in gols)}
    for i in range(20000):
        r = simular(m, v, forca, semente=f"{semente}-{i}")
        if _desfecho(r, nome) != regra.get("resultado", _desfecho(r, nome)):
            continue
        deles = r["gols_visitante"] if m == nome else r["gols_mandante"]
        nossos = r["gols_mandante"] if m == nome else r["gols_visitante"]
        if deles > regra.get("max_gols_sofridos", 99) or (regra.get("marca_gol") and not nossos):
            continue
        # ex: os gols do Poeira só no 2º tempo (quando os reservas descansados entram)
        minimo = regra.get("gols_nossos_a_partir_do_minuto")
        if minimo and any(g["minuto"] < minimo for g in r["gols"] if g["time"] == nome):
            continue
        if nossos > regra.get("max_gols_nossos", 99):
            continue
        # gols muito colados (43' e 44') parecem repetidos na narração
        # ex: "NNA" = Poeira, Poeira, adversário (nessa ordem)
        seq = regra.get("sequencia")
        if seq and "".join("N" if g["time"] == nome else "A" for g in r["gols"]) != seq:
            continue
        fim = regra.get("ultimo_gol_a_partir_do_minuto")
        if fim and (not r["gols"] or r["gols"][-1]["minuto"] < fim):
            continue
        gap = regra.get("intervalo_minimo_gols")
        if gap and any(b["minuto"] - a["minuto"] < gap for a, b in zip(r["gols"], r["gols"][1:])):
            continue
        # virada: o adversário abre o placar e o gol da vitória sai no fim
        if regra.get("virada") and (not r["gols"] or r["gols"][0]["time"] == nome or r["gols"][-1]["time"] != nome):
            continue
        return r
    return simular(m, v, forca, semente=semente)


def fechar(estado: dict, briefing: dict) -> tuple[dict, dict]:
    """Aplica o briefing ao estado. Retorna (novo_estado, roteiro)."""
    e = copy.deepcopy(estado)
    e["dia"] = dia = briefing["dia"]
    e.setdefault("decisoes", [])
    nome = e["clube"]["nome"]
    rng = random.Random(f"roteiro-{dia}")
    cenas: list[dict] = []

    falado = e["clube"].get("nome_falado") or nome  # na narração o time pode ter um nome mais curto

    local_jogo: dict = {}

    def cena(tipo: str, narracao: str, tela: list[str] | None = None, **dados: Any) -> None:
        narracao = narracao.replace(nome, falado).replace(nome.upper(), falado.upper())
        dados.setdefault("hud", {"torcida": e["torcida"]["seguidores"], "caixa": e["caixa"]})
        dados.setdefault("estrutura", copy.deepcopy(e["estrutura"]))  # o clube como está NESTA cena
        if local_jogo and "local" not in dados:  # cenas do jogo fora: cenário do dono da casa
            dados = {**dados, "local": dict(local_jogo)}
        cenas.append({"id": f"{len(cenas) + 1:02d}-{tipo}", "tipo": tipo, "narracao": narracao,
                      "texto_tela": [t for t in (tela or []) if t], "dados": dados})

    antes, hoje = briefing["seguidores_ontem"], briefing["seguidores_hoje"]
    e["torcida"]["seguidores"] = hoje  # (o HUD das cenas já mostra a torcida de hoje)
    e["torcida"]["historico"].append({"dia": dia, "seguidores": hoje, "data": est.agora()})
    cal = calendario_do_clube(e)

    caixa_ontem = e["caixa"]
    pres = e["personagens"]["presidente"]["nome"]
    estadio = e["clube"].get("estadio") or f"Campo do {nome}"

    # ================================================================ DIA 1
    if dia == 1:
        cena("abertura", f"Dia um do {nome}: um time de várzea que vai crescer com você!",
             ["DIA 1", "CLUBE FUNDADO"])
        cena("regras", "Funciona assim: cada seguidor vira um torcedor no nosso estádio. Cada curtida vira "
             "um real no caixa do clube. E o comentário mais curtido decide o que a gente faz com o dinheiro.",
             ["COMO FUNCIONA"], torcida=0, caixa=0)
        cena("estadio", f"Hoje a gente tem zero torcedores e zero reais. O estádio é isso aqui: um campo de "
             "terra e dois bancos de madeira. Vazios. " + e["clube"].get("piada_estadio", ""),
             [estadio.upper()],
             antes=0, torcida=0, nivel=nivel_torcida(0, e["estrutura"]["capacidade"]))
        cena("presidente", f"Eu sou o {e['personagens']['narrador']['nome']}, o locutor. E essa é a {pres}. Dona do bar da esquina, presidente, tesoureira e roupeira "
             "do clube. Tudo ao mesmo tempo.", [pres.upper(), "PRESIDENTE · TESOUREIRA · ROUPEIRA"])
        cena("elenco", "E esse é o elenco. Vamos dizer que... é o que tem.", ["O ELENCO"])
        for num in ("1", "9", "10"):
            j = e["elenco"][num]
            cena("jogador", f"O camisa {num}, {j['nome']}: {j['traco']}.",
                 [f"#{num} {j['nome'].upper()}", j["traco"].upper()], numero=num)
        primeiro = next(j for j in cal[0] if nome in j)
        adv = primeiro[1] if primeiro[0] == nome else primeiro[0]
        cena("liga", f"A gente vai disputar a {e['liga']['nome']}. Dez times, e a estreia é amanhã, "
             f"contra o {adv}.", [e["liga"]["nome"].upper(), "ESTREIA AMANHÃ"], adversario=adv,
             tabela=tabela(list(e["liga"]["times"]), []))
        est.evento(e, f"Fundação do {nome}")

    # ================================================================ DIA 2+
    else:
        if briefing["receita_curtidas"]:
            est.lancar(e, briefing["receita_curtidas"], f"curtidas do dia {dia - 1}")
        tema = tema_do_dia(e, briefing, cal)
        fala_tema = briefing.get("tema_falado") or (tema.capitalize().rstrip("!") if tema else "")
        cena("capa", f"Dia {dia}{': ' + fala_tema if fala_tema else ''}!", [f"DIA {dia}"], tema=tema, antes=antes)
        cena("evolucao", f"Lembrando: cada seguidor é um torcedor, cada curtida é um real no caixa. "
             f"Ontem, {_n(antes)} torcedores. Hoje: {_n(hoje)}! E o caixa saiu de {_moeda(e, caixa_ontem)} "
             f"pra {_n(e['caixa'])}!", [f"DIA {dia}"], antes=antes, torcida=hoje,
             caixa_antes=caixa_ontem, caixa=e["caixa"], curtidas=briefing["curtidas"])
        nivel = nivel_torcida(hoje, e["estrutura"]["capacidade"])
        nivel_ontem = nivel_torcida(antes, e["estrutura"]["capacidade"])
        variacoes = FALAS_TORCIDA_VARIAS.get(nivel) or [FALAS_TORCIDA[nivel]]
        fala_torcida = briefing.get("fala_torcida") or variacoes[(dia - 1) % len(variacoes)]
        cena("estadio", fala_torcida + (" Isso é novidade!" if nivel != nivel_ontem and nivel in
             ("arvore", "laje", "tudo") else ""), [f"{_n(hoje)} TORCEDORES", ROTULO_NIVEL.get(nivel, "")],
             antes=antes, torcida=hoje, nivel=nivel)

        d = briefing.get("decisao")
        hist = briefing.get("historia") or {}
        # comentários roteirizados: cenas com vários comentários e carimbos (inviável/aprovado...)
        for cc in hist.get("comentarios", []):
            cena("comentarios", cc["narracao"], cc.get("texto_tela", []), comentarios=cc["comentarios"])
        if d and (d.get("comentario") is not None or d.get("acoes")):
            c = (briefing["top_comentarios"][d["comentario"]] if d.get("comentario") is not None
                 else {"usuario": d.get("autor", ""), "texto": d.get("titulo", ""), "curtidas": 0})
            custo = float(d.get("custo") or 0)
            if d.get("comentario") is not None and not hist.get("comentarios"):
                cena("comentario", f"O comentário mais curtido de ontem foi do @{c['usuario']}: "
                     f"\"{c['texto']}\"", ["COMENTÁRIO MAIS CURTIDO"], comentario=c)
            antes_obra = copy.deepcopy(e["estrutura"])
            if custo:
                est.lancar(e, -custo, d.get("titulo") or "decisão da torcida")
            for caminho, valor in (d.get("efeitos") or {}).items():
                est.definir(e, caminho, valor)
            e["liga"]["times"][nome] = e["clube"]["forca"]
            for acao in d.get("acoes") or [None]:
                e["decisoes"].append({"dia": dia, "acao": acao, "autor": c["usuario"],
                                      "curtidas": c["curtidas"], "texto": c["texto"]})
            est.evento(e, d.get("interpretacao") or c["texto"], autor=c["usuario"])
            novos = [v for k, v in (d.get("efeitos") or {}).items() if k.startswith("elenco.")]
            cena("obra", d.get("narracao_obra") or f"Pedido aceito! {d.get('interpretacao', '')}",
                 [(d.get("titulo") or "").upper(), f"-{_moeda(e, custo)}" if custo else ""],
                 acoes=d.get("acoes") or [], custo=custo, caixa=e["caixa"], antes=antes_obra,
                 depois=copy.deepcopy(e["estrutura"]), novos_jogadores=novos,
                 autor=c["usuario"])
        # reforços vindos dos comentários (entram no elenco e ganham cena própria)
        if hist.get("reforcos"):
            r = hist["reforcos"]
            for num, j in r["jogadores"].items():
                e["elenco"][num] = j
            for chave, pers in (r.get("personagens") or {}).items():
                e["personagens"][chave] = pers
            est.evento(e, "Reforços vindos dos comentários: " + ", ".join(
                f"{j['nome']} (@{j.get('instagram', '')})" for j in r["jogadores"].values()))
            cena("reforcos", r["narracao"], r.get("texto_tela", ["REFORÇOS DA TORCIDA"]),
                 jogadores=r["jogadores"], personagens=r.get("personagens") or {})
        for x in hist.get("antes_jogo", []):
            cena(x["tipo"], x["narracao"], x.get("texto_tela", []), **x.get("dados", {}))
            for caminho, valor in (x.get("efeitos") or {}).items():  # ex: renomear jogador
                est.definir(e, caminho, valor)
            dd = x.get("dados", {})
            if x["tipo"] == "apelido" and dd.get("apelido"):
                e.setdefault("piadas_usadas", []).append(dd["apelido"])
                if dd.get("alvo") == "nosso" and dd.get("numero") in e["elenco"]:
                    e["elenco"][dd["numero"]]["apelido"] = dd["apelido"]

        for eid in briefing.get("encerrar_enquetes", []):
            enq = next(x for x in e["enquetes"] if x["id"] == eid)
            parc = next(x["parcial"] for x in briefing["enquetes"] if x["id"] == eid)
            est.aplicar_enquete(e, enq, parc)
            if enq["status"] == "encerrada":
                v = enq["valores"][parc["vencedor"]]
                cena("enquete_resultado", f"E a votação de ontem: {enq['pergunta']} Deu {v}, com "
                     f"{round(parc['percentual'][parc['vencedor']])} por cento.",
                     [enq["pergunta"].upper(), str(v).upper()], resultado=parc, valores=enq["valores"])

    # ================================================================ RODADA
    liga = e["liga"]
    times = list(liga["times"])
    partida = None
    sem_jogo = bool(briefing.get("sem_jogo"))  # ex: dia da peneira; a rodada fica adiada
    if dia > 1 and not sem_jogo and liga["rodada"] < len(cal):
        rodada = []
        for m, v in cal[liga["rodada"]]:
            r = simular(m, v, liga["times"], semente=f"{dia}-{m}-{v}")
            roteiro_jogo = liga.get("roteiro", {}).get(str(liga["rodada"] + 1))
            if roteiro_jogo and nome in (m, v):
                r = _simular_com_desfecho(m, v, liga["times"], f"{dia}-{m}-{v}", nome, roteiro_jogo)
            r["rodada"] = liga["rodada"] + 1
            rodada.append(r)
            if nome in (m, v):
                partida = r
        liga["resultados"] += rodada
        liga["rodada"] += 1

    if partida:
        casa = partida["mandante"] == nome
        adv = partida["visitante"] if casa else partida["mandante"]
        nossos = partida["gols_mandante"] if casa else partida["gols_visitante"]
        deles = partida["gols_visitante"] if casa else partida["gols_mandante"]
        placar_completo = f"{partida['mandante']} {partida['gols_mandante']} x {partida['gols_visitante']} {partida['visitante']}"
        piada = PIADAS_ADVERSARIO.get(adv, "ninguém sabe nada sobre eles.")
        rival = (liga.get("rival") or {}).get("time") == adv
        if not casa:  # jogo fora: o cenário (muro, torcida, decoração) é do dono da casa
            local_jogo.update(nome=adv, sigla=_sigla(adv), torcida=briefing.get("torcida_adversario", 320),
                              tema="feira" if "Feira" in adv else "churrasco" if "Churrasco" in adv else "")
        fala_pre = (f"É clássico! Rodada {liga['rodada']}, {'em casa, ' if casa else 'na casa do '}"
                    f"{'contra o ' if casa else ''}maior rival do Poeira: o {adv}. "
                    f"{liga['rival']['historia'].capitalize()}." if rival else
                    f"Rodada {liga['rodada']}{', em casa' if casa else ', fora de casa'}, contra o {adv}. Detalhe: {piada}")
        cena("pre_jogo", fala_pre, [f"RODADA {liga['rodada']}", "CLÁSSICO!" if rival else ("EM CASA" if casa else "FORA DE CASA")],
             mandante=partida["mandante"], visitante=partida["visitante"])
        p = piada_do_dia(e, briefing, adv, rng)
        if p:
            cena("apelido", p.pop("narracao"), p.pop("texto_tela", []), **p)
        gm = gv = 0
        usados: list[str] = []
        gols = partida["gols"]
        regra_jogo = liga.get("roteiro", {}).get(str(liga["rodada"])) or {}
        decisivo = regra_jogo.get("gol_decisivo") or {}
        ultimo_nosso = max((k for k, x in enumerate(gols) if x["time"] == nome), default=None)
        primeiro_nosso = next((k for k, x in enumerate(gols) if x["time"] == nome), None)
        for i, g in enumerate(gols):
            nosso = g["time"] == nome
            if g["time"] == partida["mandante"]:
                gm += 1
            else:
                gv += 1
            ns, ds = (gm, gv) if partida["mandante"] == nome else (gv, gm)
            # Jogos com 4+ gols: narra só o 1º gol do Poeira (empolgado) e o último gol do jogo.
            # Os do meio aparecem no placar. Até 3 gols: narra todos.
            if regra_jogo.get("narrar_gols"):  # ex: [2, 3] = só o 2º e o 3º gol
                if i + 1 not in regra_jogo["narrar_gols"]:
                    continue
            elif len(gols) > 3 and i not in (primeiro_nosso, len(gols) - 1):
                continue
            fixo = (regra_jogo.get("textos_gol") or {}).get(str(i + 1))
            ultimo = i == len(gols) - 1 and len(gols) > 1
            if nosso:
                art = _artilheiro(e, rng)
                for _ in range(20):  # o autor do gol decisivo marca só esse
                    if not decisivo or i == ultimo_nosso or art["nome"] != decisivo.get("artilheiro"):
                        break
                    art = _artilheiro(e, rng)
                quem = decisivo.get("artilheiro") if decisivo and i == ultimo_nosso else regra_jogo.get("artilheiro")
                if quem:  # gol roteirizado (ex: o Saci, de bicicleta; o Benício, que prometeu o gol)
                    art = next(({"numero": n, **j} for n, j in e["elenco"].items() if j["nome"] == quem), art)
                g["autor"] = art["nome"]
                gritos = [x for x in GRITOS_GOL if x not in usados] or GRITOS_GOL
                if fixo:
                    grito = fixo
                elif decisivo and i == ultimo_nosso:
                    grito = decisivo["grito"]
                else:
                    grito = regra_jogo.get("grito_gol") or rng.choice(gritos)
                usados.append(grito)
                txt = grito.format(N=nome.upper(), A=art["nome"].upper(), m=g["minuto"], ns=_n(ns), ds=_n(ds))
                roteirizado = grito in (decisivo.get("grito"), regra_jogo.get("grito_gol"), fixo)
                if not roteirizado:
                    limpo = txt.replace("Que golaço!", "").replace("Que pintura!", "").rstrip()
                    if ns == ds:
                        txt = limpo + f" Tudo igual: {_n(ns)} a {_n(ds)}!"
                    elif ns == ds + 1 and i and min(_placar_nosso(gols[:k + 1], nome) for k in range(i)) < 0:
                        txt = limpo + f" Virou: {_n(ns)} a {_n(ds)}!"
                    elif ns == ds + 1 and i and ns > 1:
                        txt = limpo + f" Desempatou: {_n(ns)} a {_n(ds)}!"
                    elif ns > ds + 1:
                        txt = limpo + f" Ampliou: {_n(ns)} a {_n(ds)}!"
            else:
                # piada do gol contra: nunca repete (quando acabarem, só o gol)
                usadas = e.setdefault("piadas_gol_usadas", [])
                livres = [x for x in PIADAS_GOL_CONTRA if x not in usadas]
                fecha_historia = ultimo and (ns == ds or (ns < ds and any(x["time"] == nome for x in gols[:i])))
                piada_gol = rng.choice(livres) if livres and not fecha_historia else ""
                if piada_gol:
                    usadas.append(piada_gol)
                txt = f"Gol do {adv}, aos {g['minuto']}. {piada_gol}".strip()
                if fixo:
                    if piada_gol:
                        usadas.remove(piada_gol)
                    txt = fixo.format(adv=adv, m=g["minuto"], ns=_n(ns), ds=_n(ds))
                elif ultimo and ns < ds and any(x["time"] == nome for x in gols[:i]):
                    txt = (f"Ah, não... Gol do {adv}, aos {g['minuto']}. Eles viraram o jogo: "
                           f"{_n(ds)} a {_n(ns)}. {'A torcida ficou em silêncio.' if casa else 'A casa deles veio abaixo.'}")
                elif ultimo and ns == ds:
                    txt = f"Ah, não... Gol do {adv}, aos {g['minuto']}. Empatou: {_n(ds)} a {_n(ns)}."
            culpado = None
            ap = regra_jogo.get("apelido_no_gol")  # ex: o gol sofrido é culpa do lateral "Salário do Mês"
            if ap and str(i + 1) == str(ap.get("gol")) and ap["numero"] in e["elenco"]:
                j = e["elenco"][ap["numero"]]
                j["apelido"] = ap["apelido"]
                e.setdefault("piadas_usadas", []).append(ap["apelido"])
                culpado = {"numero": ap["numero"], "nome": j["nome"], "apelido": ap["apelido"], "posicao": ap.get("posicao", "")}
                est.evento(e, f"{j['nome']} ganhou o apelido {ap['apelido']}")
            cena("gol", txt, [f"{g['minuto']}'", "GOOOOL!" if nosso else f"GOL DO {adv.upper()}"], culpado=culpado,
                 minuto=g["minuto"], nosso=nosso, estilo_voz="grito" if nosso else "normal", autor=g.get("autor"), placar=[gm, gv],
                 mandante=partida["mandante"], visitante=partida["visitante"])
        if not gols:
            cena("gol", "Noventa minutos de muita vontade e nenhuma pontaria.", ["0 x 0"], minuto=90,
                 nosso=None, placar=[0, 0], mandante=partida["mandante"], visitante=partida["visitante"])
        resultado = "vitória" if nossos > deles else "empate" if nossos == deles else "derrota"
        frase = {"vitória": f"Vitória do {nome}, {nossos} a {deles}!",
                 "empate": f"Empate em {nossos} a {deles}. " + [
                     "Um ponto é um ponto.", "Ninguém ganhou, ninguém perdeu, e todo mundo saiu reclamando do juiz.",
                     "Cada um leva um pontinho pra casa.", "Ficou tudo igual, menos o joelho do Bujão.",
                     "Um ponto na conta, e segue o campeonato."][(dia + nossos + 1) % 5],
                 "derrota": f"Derrota por {deles} a {nossos}. Faz parte."}[resultado]
        if resultado == "vitória" and not any(r for r in e["linha_do_tempo"] if "vitória" in r.get("evento", "")):
            frase = f"Primeira vitória da história do {nome}! {nossos} a {deles}!"
        cena("fim_de_jogo", f"Apita o árbitro! {frase}", ["FIM DE JOGO", placar_completo],
             resultado=resultado, placar=[partida["gols_mandante"], partida["gols_visitante"]],
             mandante=partida["mandante"], visitante=partida["visitante"])
        est.evento(e, f"Rodada {liga['rodada']}: {placar_completo} ({resultado})")
        regra = liga.get("roteiro", {}).get(str(liga["rodada"])) or {}
        if regra.get("cena_depois"):
            x = regra["cena_depois"]
            cena(x["tipo"], x["narracao"], x.get("texto_tela", []), **x.get("dados", {}))
        for x in (briefing.get("historia") or {}).get("depois_jogo", []):
            cena(x["tipo"], x["narracao"], x.get("texto_tela", []), **x.get("dados", {}))
            for caminho, valor in (x.get("efeitos") or {}).items():
                est.definir(e, caminho, valor)

        local_jogo.clear()
        if casa:
            publico = min(hoje, e["estrutura"]["capacidade"])
            bilheteria = publico * e["regras"]["ingresso"]
            lanche = publico * e["regras"].get("gasto_lanchonete_por_torcedor", 0)
            if bilheteria:
                est.lancar(e, bilheteria, f"bilheteria rodada {liga['rodada']} ({publico} pagantes)")
            if lanche:
                est.lancar(e, lanche, f"lanchonete rodada {liga['rodada']}")
            camisas = venda = 0
            if e["estrutura"].get("varal_camisas") and publico:
                camisas = round(publico * e["regras"].get("camisas_pct_torcida", 3) / 100)
                venda = camisas * e["regras"].get("preco_camisa", 25)
                if venda:
                    est.lancar(e, venda, f"varal de camisas rodada {liga['rodada']} ({camisas} camisas)")
            placas = e["regras"].get("placas_por_jogo", 0) if e["estrutura"].get("placas") else 0
            if placas:
                est.lancar(e, placas, f"placas de publicidade rodada {liga['rodada']}")
            if publico:
                extra = (f" Mais {_n(lanche)} da {e['estrutura'].get('lanchonete') or 'lanchonete'}." if lanche else "")
                if venda:
                    extra += f" E no varal, {_n(camisas)} camisas vendidas: mais {_n(venda)}."
                if placas:
                    extra += f" E as placas de publicidade: mais {_n(placas)}."
                if lanche or venda or placas:
                    extra += f" Somando tudo: {_n(bilheteria + lanche + venda + placas)} reais, e o caixa foi pra {_n(e['caixa'])}!"
                cena("bilheteria", f"Na bilheteria: {_n(publico)} pagantes, a {e['regras']['ingresso']} reais "
                     f"cada. {_n(bilheteria)} reais pro clube!{extra}",
                     [f"{_n(publico)} × R$ {e['regras']['ingresso']} = {_moeda(e, bilheteria)}"],
                     publico=publico, ingresso=e["regras"]["ingresso"], receita=bilheteria + lanche + venda + placas, camisas=camisas, placas=placas, bilheteria=bilheteria, lanche=lanche, venda=venda,
                     barraca=e["estrutura"].get("lanchonete") or "", preco_camisa=e["regras"].get("preco_camisa", 25),
                     caixa=e["caixa"])

        tab = tabela(times, liga["resultados"])
        liga["tabela"] = tab
        pos = next(l["pos"] for l in tab if l["time"] == nome)
        comentario_pos = ("Lanterna. Mas lanterna também ilumina." if pos == len(tab)
                          else "Zona de classificação!" if pos <= 2 else "")
        cena("tabela", f"Na tabela, o {nome} está em {pos}º lugar. {comentario_pos}".strip(),
             [e["liga"]["nome"].upper(), f"{pos}º LUGAR"], tabela=tab, posicao=pos)
    else:
        tab = tabela(times, liga["resultados"])
        pos = next(l["pos"] for l in tab if l["time"] == nome)

    # ================================================================ FECHAMENTO
    if briefing.get("nova_enquete"):
        nova = dict(briefing["nova_enquete"], status="aberta", aberta_no_dia=dia)
        e["enquetes"].append(nova)
        cena("enquete_nova", f"E tem votação: {nova['pergunta']} "
             + " ou ".join(f"{k}, {v}" for k, v in nova["valores"].items()) + "? Comenta aí.",
             [nova["pergunta"].upper()], valores=nova["valores"])

    prox = briefing["proxima_decisao"]
    chamada = briefing.get("chamada")  # ex: {"tipo": "peneira", "narracao": ..., ...}
    if chamada:
        cena(chamada.get("tipo", "peneira"), chamada["narracao"], chamada.get("texto_tela", []),
             **chamada.get("dados", {}))
    elif dia == 1:
        txt = ("E quem manda no clube é você. O comentário viável mais curtido decide o que a gente faz. "
               f"{prox['pergunta']}")
    else:
        txt = (f"No caixa, {_n(e['caixa'])} reais. " if e["caixa"] > 0 else
               "Caixa zerado! Agora é com as curtidas de vocês. ") + f"{prox['pergunta']} O comentário mais curtido decide."
    if not chamada:
        if briefing.get("decisao_fala"):
            txt = briefing["decisao_fala"].replace("{caixa}", _n(e["caixa"]))
        cena("decisao", txt, [f"DECISÃO #{dia}", "COMENTÁRIO MAIS CURTIDO DECIDE"],
             opcoes=prox["opcoes"], caixa=e["caixa"])

    prox_jogo = None
    if liga["rodada"] < len(cal):
        prox_jogo = next(j for j in cal[liga["rodada"]] if nome in j)
    fala = ("Então já sabe: segue pra virar torcedor, curte pra encher o caixa, e comenta o que a gente faz. "
            + ("Amanhã tem estreia!" if dia == 1 else "Até amanhã!"))
    if prox_jogo and dia > 1:
        advp = prox_jogo[1] if prox_jogo[0] == nome else prox_jogo[0]
        if (liga.get("rival") or {}).get("time") == advp:
            fala = f"E amanhã é clássico: {nome} contra o {advp}, o nosso maior rival! " + fala
        else:
            fala = f"Amanhã tem {nome} contra o {advp}. " + fala
    fala = briefing.get("encerramento") or fala
    cena("encerramento", fala, [e["clube"]["instagram"]],
         proximo=list(prox_jogo) if prox_jogo and dia > 1 else None)

    roteiro = {"dia": dia, "clube": nome, "caixa": e["caixa"], "torcida": hoje, "posicao": pos,
               "partida": partida, "cenas": cenas, "estado": _resumo_visual(e),
               "legenda": briefing.get("legenda") or legenda(e, prox),
               "primeiro_comentario": prox["pergunta"] + " 👇"}
    e["episodios"].append({"dia": dia, "data": est.agora(), "proxima_decisao": prox, "post": None})
    return e, roteiro


def _resumo_visual(e: dict) -> dict:
    """O que o renderizador precisa saber para desenhar o clube como ele está hoje."""
    return {"clube": e["clube"], "estrutura": e["estrutura"], "elenco": e["elenco"],
            "personagens": e["personagens"], "liga": e["liga"]["nome"], "moeda": e["moeda"]}


def legenda(estado: dict, prox: dict) -> str:
    return (f"DIA {estado['dia']} do {estado['clube']['nome']} ⚽\n\n"
            f"{prox['pergunta']} O comentário viável mais curtido decide.\n\n"
            f"1 seguidor = 1 torcedor no estádio\n1 curtida = +{_moeda(estado, estado['regras']['por_curtida'])} no caixa\n\n"
            "#futebol #varzea #futebolamador #futebolraiz")


def roteiro_markdown(r: dict) -> str:
    linhas = [f"# Roteiro do dia {r['dia']}: {r['clube']}", "",
              f"Torcida: {_n(r['torcida'])} · Caixa: R$ {_n(r['caixa'])} · Posição: {r['posicao']}º", ""]
    for c in r["cenas"]:
        linhas += [f"## {c['id']}", f"**Na tela:** {' | '.join(c['texto_tela'])}", "",
                   f"> {c['narracao']}", ""]
    linhas += ["---", "**Legenda do post:**", "", r["legenda"], "",
               f"**Primeiro comentário:** {r['primeiro_comentario']}"]
    return "\n".join(linhas) + "\n"


def dados_offline(arquivo: dict[str, Any]) -> tuple[int, dict | None, list[dict], str]:
    """Para testar sem API: {"seguidores":..,"post":{..},"comentarios":[..],"usuario":".."}"""
    return (arquivo["seguidores"], arquivo.get("post"), arquivo.get("comentarios", []),
            arquivo.get("usuario", ""))
