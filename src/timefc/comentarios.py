"""Ranking de comentários: no formato, quem decide é o COMENTÁRIO MAIS CURTIDO."""
from __future__ import annotations

from .votacao import normalizar

# Comentários que não podem ganhar mesmo sendo os mais curtidos.
BLOQUEADOS = ("sorteio", "segue de volta", "sigam", "link na bio", "pix", "http")


def ranking(comentarios: list[dict], n: int = 5, ignorar_usuarios: set[str] | None = None,
            minimo_caracteres: int = 4) -> list[dict]:
    """Top N por curtidas (desempate: quem comentou primeiro). Um por usuário."""
    ignorar = {u.lower() for u in (ignorar_usuarios or set())}
    melhores: dict[str, dict] = {}
    for c in comentarios:
        user = (c.get("username") or "").lower()
        texto = (c.get("text") or "").strip()
        if not user or user in ignorar or len(texto) < minimo_caracteres:
            continue
        if any(b in normalizar(texto) for b in BLOQUEADOS):
            continue
        atual = melhores.get(user)
        if not atual or int(c.get("like_count") or 0) > int(atual.get("like_count") or 0):
            melhores[user] = c
    ordenados = sorted(melhores.values(),
                       key=lambda c: (-int(c.get("like_count") or 0), c.get("timestamp", "")))
    return [{"usuario": c.get("username"), "texto": c.get("text"),
             "curtidas": int(c.get("like_count") or 0), "id": c.get("id"),
             "timestamp": c.get("timestamp")} for c in ordenados[:n]]
