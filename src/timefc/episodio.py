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
import random
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
    "Grêmio Vila Poeira": "o único campo pior que o nosso.",
}


def fechar(estado: dict, briefing: dict) -> tuple[dict, dict]:
    """Aplica o briefing ao estado. Retorna (novo_estado, roteiro)."""
    e = copy.deepcopy(estado)
    e["dia"] = dia = briefing["dia"]
    e.setdefault("decisoes", [])
    nome = e["clube"]["nome"]
    rng = random.Random(f"roteiro-{dia}")
    cenas: list[dict] = []

    def cena(tipo: str, narracao: str, tela: list[str] | None = None, **dados: Any) -> None:
        dados.setdefault("hud", {"torcida": e["torcida"]["seguidores"], "caixa": e["caixa"]})
        dados.setdefault("estrutura", copy.deepcopy(e["estrutura"]))  # o clube como está NESTA cena
        cenas.append({"id": f"{len(cenas) + 1:02d}-{tipo}", "tipo": tipo, "narracao": narracao,
                      "texto_tela": [t for t in (tela or []) if t], "dados": dados})

    antes, hoje = briefing["seguidores_ontem"], briefing["seguidores_hoje"]
    e["torcida"]["seguidores"] = hoje  # (o HUD das cenas já mostra a torcida de hoje)
    e["torcida"]["historico"].append({"dia": dia, "seguidores": hoje, "data": est.agora()})
    cal = calendario(list(e["liga"]["times"]))

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
             "terra e dois bancos de madeira. Vazios.", [estadio.upper(), "0 TORCEDORES"],
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
        cena("evolucao", f"Dia {dia}! Lembrando: cada seguidor é um torcedor, cada curtida é um real no caixa. "
             f"Ontem, {_n(antes)} torcedores. Hoje: {_n(hoje)}! E o caixa saiu de {_moeda(e, caixa_ontem)} "
             f"pra {_moeda(e, e['caixa'])}!", [f"DIA {dia}"], antes=antes, torcida=hoje,
             caixa_antes=caixa_ontem, caixa=e["caixa"], curtidas=briefing["curtidas"])
        nivel = nivel_torcida(hoje, e["estrutura"]["capacidade"])
        nivel_ontem = nivel_torcida(antes, e["estrutura"]["capacidade"])
        cena("estadio", FALAS_TORCIDA[nivel] + (" Isso é novidade!" if nivel != nivel_ontem and nivel in
             ("arvore", "laje", "tudo") else ""), [f"{_n(hoje)} TORCEDORES", ROTULO_NIVEL.get(nivel, "")],
             antes=antes, torcida=hoje, nivel=nivel)

        d = briefing.get("decisao")
        if d and d.get("comentario") is not None:
            c = briefing["top_comentarios"][d["comentario"]]
            custo = float(d.get("custo") or 0)
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
            cena("obra", f"Pedido aceito! {d.get('interpretacao', '')}",
                 [(d.get("titulo") or "").upper(), f"-{_moeda(e, custo)}" if custo else ""],
                 acoes=d.get("acoes") or [], custo=custo, caixa=e["caixa"], antes=antes_obra,
                 depois=copy.deepcopy(e["estrutura"]), novos_jogadores=novos,
                 autor=c["usuario"])

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
    if dia > 1 and liga["rodada"] < len(cal):
        rodada = []
        for m, v in cal[liga["rodada"]]:
            r = simular(m, v, liga["times"], semente=f"{dia}-{m}-{v}")
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
        cena("pre_jogo", f"Rodada {liga['rodada']}{', em casa' if casa else ', fora de casa'}, contra o "
             f"{adv}. Detalhe: {piada}", [f"RODADA {liga['rodada']}", "EM CASA" if casa else "FORA DE CASA"],
             mandante=partida["mandante"], visitante=partida["visitante"])
        gm = gv = 0
        gols = partida["gols"]
        for i, g in enumerate(gols):
            nosso = g["time"] == nome
            if g["time"] == partida["mandante"]:
                gm += 1
            else:
                gv += 1
            if len(gols) > 4 and 0 < i < len(gols) - 1:
                continue  # jogo com muitos gols: narra o primeiro e o último
            if nosso:
                art = _artilheiro(e, rng)
                g["autor"] = art["nome"]
                txt = f"GOOOOOL! É do {nome}! {art['nome']}, aos {g['minuto']} minutos!"
            else:
                txt = f"Gol do {adv}, aos {g['minuto']}. {rng.choice(PIADAS_GOL_CONTRA)}"
            cena("gol", txt, [f"{g['minuto']}'", "GOOOOL!" if nosso else f"GOL DO {adv.upper()}"],
                 minuto=g["minuto"], nosso=nosso, autor=g.get("autor"), placar=[gm, gv],
                 mandante=partida["mandante"], visitante=partida["visitante"])
        if not gols:
            cena("gol", "Noventa minutos de muita vontade e nenhuma pontaria.", ["0 x 0"], minuto=90,
                 nosso=None, placar=[0, 0], mandante=partida["mandante"], visitante=partida["visitante"])
        resultado = "vitória" if nossos > deles else "empate" if nossos == deles else "derrota"
        frase = {"vitória": f"Vitória do {nome}, {nossos} a {deles}!",
                 "empate": f"Empate em {nossos} a {deles}. Um ponto é um ponto.",
                 "derrota": f"Derrota por {deles} a {nossos}. Faz parte."}[resultado]
        if resultado == "vitória" and not any(r for r in e["linha_do_tempo"] if "vitória" in r.get("evento", "")):
            frase = f"Primeira vitória da história do {nome}! {nossos} a {deles}!"
        cena("fim_de_jogo", f"Apita o árbitro! {frase}", ["FIM DE JOGO", placar_completo],
             resultado=resultado, placar=[partida["gols_mandante"], partida["gols_visitante"]],
             mandante=partida["mandante"], visitante=partida["visitante"])
        est.evento(e, f"Rodada {liga['rodada']}: {placar_completo} ({resultado})")

        if casa:
            publico = min(hoje, e["estrutura"]["capacidade"])
            bilheteria = publico * e["regras"]["ingresso"]
            lanche = publico * e["regras"].get("gasto_lanchonete_por_torcedor", 0)
            if bilheteria:
                est.lancar(e, bilheteria, f"bilheteria rodada {liga['rodada']} ({publico} pagantes)")
            if lanche:
                est.lancar(e, lanche, f"lanchonete rodada {liga['rodada']}")
            if publico:
                extra = f" Mais {_n(lanche)} da lanchonete." if lanche else ""
                cena("bilheteria", f"Na bilheteria: {_n(publico)} pagantes, a {e['regras']['ingresso']} reais "
                     f"cada. {_n(bilheteria)} reais pro clube!{extra}",
                     [f"{_n(publico)} × R$ {e['regras']['ingresso']} = {_moeda(e, bilheteria)}"],
                     publico=publico, ingresso=e["regras"]["ingresso"], receita=bilheteria + lanche,
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
    if dia == 1:
        txt = ("E quem manda no clube é você. O comentário viável mais curtido decide o que a gente faz. "
               f"{prox['pergunta']}")
    else:
        txt = f"No caixa, {_n(e['caixa'])} reais. {prox['pergunta']} O comentário mais curtido decide."
    cena("decisao", txt, [f"DECISÃO #{dia}", "COMENTÁRIO MAIS CURTIDO DECIDE"],
         opcoes=prox["opcoes"], caixa=e["caixa"])

    prox_jogo = None
    if liga["rodada"] < len(cal):
        prox_jogo = next(j for j in cal[liga["rodada"]] if nome in j)
    fala = ("Então já sabe: segue pra virar torcedor, curte pra encher o caixa, e comenta o que a gente faz. "
            + ("Amanhã tem estreia!" if dia == 1 else "Até amanhã!"))
    if prox_jogo and dia > 1:
        advp = prox_jogo[1] if prox_jogo[0] == nome else prox_jogo[0]
        fala = f"Amanhã tem {nome} contra o {advp}. " + fala
    cena("encerramento", fala, [e["clube"]["instagram"]],
         proximo=list(prox_jogo) if prox_jogo and dia > 1 else None)

    roteiro = {"dia": dia, "clube": nome, "caixa": e["caixa"], "torcida": hoje, "posicao": pos,
               "partida": partida, "cenas": cenas, "estado": _resumo_visual(e),
               "legenda": legenda(e, prox), "primeiro_comentario": prox["pergunta"] + " 👇"}
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
