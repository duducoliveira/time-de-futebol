"""Peneira do Poeira: comentários com NOME + POSIÇÃO; os mais curtidos viram jogadores.

Regras:
  * um candidato por perfil (vale o comentário mais curtido dele);
  * precisa citar uma posição reconhecível (goleiro, zagueiro, lateral, volante, meia, ponta, atacante...);
  * nome: o que vier escrito antes/depois da posição; se não houver, usa o @ (sem números/pontos);
  * desempate: quem comentou primeiro;
  * o perfil do clube e quem já está no elenco ficam de fora.
"""
from __future__ import annotations

import re
import unicodedata

# (padrão, código da posição no elenco). A ordem importa: o mais específico primeiro.
POSICOES = [
    (r"\btecnic[oa]\b|\btreinador[a]?\b", "TEC"),
    (r"\bgoleir[oa]\b|\bgk\b|\bgol\b|\barqueiro\b", "GOL"),
    (r"\blateral direit[oa]\b|\bld\b", "LD"),
    (r"\blateral esquerd[oa]\b|\ble\b", "LE"),
    (r"\blateral\b|\bala\b", "LD"),
    (r"\bzagueir[oa]\b|\bzaga\b|\bbeque\b|\bzag\b", "ZAG"),
    (r"\bvolante\b|\bprimeiro volante\b|\bsegundo volante\b|\bvol\b", "VOL"),
    (r"\bmeia\b|\bmeio campo\b|\bmeio-campo\b|\barmador\b|\bmei\b|\bcamisa 10\b|\bmat\b", "MEI"),
    (r"\bponta direit[oa]\b|\bpd\b", "PD"),
    (r"\bponta esquerd[oa]\b|\bpe\b", "PE"),
    (r"\bponta\b|\bextremo\b", "PD"),
    (r"\bcentroavante\b|\batacante\b|\bata\b|\bca\b|\bcamisa 9\b|\bcentro avante\b", "CA"),
]
NOMES_POSICAO = {"TEC": "técnico", "GOL": "goleiro", "LD": "lateral direito", "LE": "lateral esquerdo", "ZAG": "zagueiro",
                 "VOL": "volante", "MEI": "meia", "PD": "ponta direita", "PE": "ponta esquerda", "CA": "atacante"}
LIXO = {"me", "coloca", "eu", "de", "sou", "pode", "posso", "ser", "o", "a", "contrata", "aqui", "estou", "na",
        "no", "do", "da", "chama", "pra", "para", "convocação", "convocacao", "precisar", "precisa", "kkk", "kkkk",
        "kkkkk", "ai", "aí", "bota", "ja", "já", "quero", "jogar", "sou", "um", "uma", "time", "central", "raiz",
        "reserva", "segundo", "primeiro", "amador", "armador", "direito", "direita", "esquerdo", "esquerda", "mat"}


def _sem_acento(t: str) -> str:
    return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()


def posicao(texto: str) -> str | None:
    t = _sem_acento(texto)
    melhor = None
    for padrao, cod in POSICOES:
        m = re.search(padrao, t)
        if m and (melhor is None or m.start() < melhor[0]):
            melhor = (m.start(), cod)
    return melhor[1] if melhor else None


def nome(texto: str, usuario: str) -> str:
    """Nome = até 3 palavras logo antes da posição ("Kaique Dias goleiro"); senão, o @."""
    t = _sem_acento(texto)
    inicio = min((m.start() for padrao, _ in POSICOES for m in [re.search(padrao, t)] if m), default=0)
    antes = re.sub(r"[^\wÀ-ÿ\s]", " ", texto[:inicio]).replace("-", " ").split()
    palavras = [w for w in antes if _sem_acento(w) not in LIXO and not w.isdigit() and len(w) > 1]
    if antes and len(antes) <= 3 and palavras:
        return " ".join(w.capitalize() for w in palavras[:2])
    base = re.sub(r"[\d_.]+", " ", usuario).strip().split()
    return base[0].capitalize() if base else usuario


def selecionar(comentarios: list[dict], vagas: int = 5, ignorar: set[str] | None = None) -> list[dict]:
    ignorar = {u.lower() for u in (ignorar or set())}
    melhores: dict[str, dict] = {}
    for c in comentarios:
        u = (c.get("username") or "").lower()
        if not u or u in ignorar:
            continue
        pos = posicao(c.get("text") or "")
        if not pos:
            continue
        cand = {"usuario": c.get("username"), "texto": c.get("text"), "curtidas": int(c.get("like_count") or 0),
                "timestamp": c.get("timestamp", ""), "posicao": pos, "posicao_nome": NOMES_POSICAO[pos],
                "nome": nome(c.get("text") or "", c.get("username") or "")}
        atual = melhores.get(u)
        if not atual or cand["curtidas"] > atual["curtidas"]:
            melhores[u] = cand
    ordem = sorted(melhores.values(), key=lambda x: (-x["curtidas"], x["timestamp"]))
    return ordem[:vagas]


def selecionar_peneira(comentarios: list[dict], vagas: int = 5, ignorar: set[str] | None = None) -> dict:
    """5 jogadores + 1 técnico: os comentários mais curtidos em cada grupo (uma vaga por perfil)."""
    todos = selecionar(comentarios, vagas=10_000, ignorar=ignorar)
    tecnico = next((c for c in todos if c["posicao"] == "TEC"), None)
    jogadores = [c for c in todos if c["posicao"] != "TEC" and c is not tecnico][:vagas]
    return {"jogadores": jogadores, "tecnico": tecnico}
