"""Apuração de votos a partir dos comentários.

Cada post de votação declara opções no estado (dados/estado_time.json), ex:
    {"post_permalink": "...", "pergunta": "Qual o mascote?",
     "opcoes": {"A": ["leão", "leao"], "B": ["águia", "aguia"], "C": ["lobo"]}}

Regras:
  * 1 voto por usuário (vale o comentário mais recente).
  * Voto explícito por letra: "A", "#A", "voto A", "opção b".
  * Ou por palavra-chave da opção (sem acento, case-insensitive).
  * Comentário com 2+ opções diferentes é ignorado (ambíguo).
  * Opcional: curtidas no comentário viram peso (peso_curtidas).
"""
from __future__ import annotations

import re
import unicodedata
from collections import Counter


def normalizar(txt: str) -> str:
    txt = unicodedata.normalize("NFKD", txt or "").encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", txt.lower()).strip()


def detectar_opcao(texto: str, opcoes: dict[str, list[str]]) -> str | None:
    t = normalizar(texto)
    achadas: set[str] = set()
    letras = "".join(re.escape(k.lower()) for k in opcoes)
    # letra isolada / com prefixo: "a", "#a", "voto a", "opcao a", "time a"
    for m in re.finditer(rf"(?:^|[\s#]|voto |opcao |time )([{letras}])(?=$|[\s!.,?])", t):
        achadas.add(m.group(1).upper())
    for chave, palavras in opcoes.items():
        for p in palavras:
            if re.search(rf"\b{re.escape(normalizar(p))}\b", t):
                achadas.add(chave.upper())
    return achadas.pop() if len(achadas) == 1 else None


def apurar(comentarios: list[dict], opcoes: dict[str, list[str]],
           peso_curtidas: float = 0.0, ignorar_usuarios: set[str] | None = None) -> dict:
    ignorar = {u.lower() for u in (ignorar_usuarios or set())}
    opcoes = {k.upper(): v for k, v in opcoes.items()}
    por_usuario: dict[str, tuple[str, str, int]] = {}  # user -> (timestamp, opcao, likes)
    invalidos = 0
    for c in comentarios:
        user = (c.get("username") or c.get("id") or "").lower()
        if user in ignorar:
            continue
        op = detectar_opcao(c.get("text", ""), opcoes)
        if not op:
            invalidos += 1
            continue
        ts = c.get("timestamp", "")
        if user not in por_usuario or ts > por_usuario[user][0]:
            por_usuario[user] = (ts, op, int(c.get("like_count") or 0))

    placar: Counter = Counter({k: 0.0 for k in opcoes})
    for _, op, likes in por_usuario.values():
        placar[op] += 1 + peso_curtidas * likes
    total = sum(placar.values()) or 1
    ranking = placar.most_common()
    empate = len(ranking) > 1 and ranking[0][1] == ranking[1][1]
    return {
        "placar": dict(placar),
        "percentual": {k: round(100 * v / total, 1) for k, v in placar.items()},
        "vencedor": None if empate or ranking[0][1] == 0 else ranking[0][0],
        "empate": empate,
        "votantes": len(por_usuario),
        "comentarios_invalidos": invalidos,
    }
