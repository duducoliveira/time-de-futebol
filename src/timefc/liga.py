"""Liga fictícia: calendário (turno e returno), simulação de partidas e tabela.

A simulação é determinística por (dia, mandante, visitante): rodar de novo dá o
mesmo resultado, o que facilita refazer um episódio.
"""
from __future__ import annotations

import math
import random


def calendario(times: list[str]) -> list[list[tuple[str, str]]]:
    """Round-robin (método do círculo). Retorna lista de rodadas [(mandante, visitante)]."""
    ts = list(times)
    if len(ts) % 2:
        ts.append(None)  # folga
    n = len(ts)
    rodadas = []
    for r in range(n - 1):
        jogos = []
        for i in range(n // 2):
            a, b = ts[i], ts[n - 1 - i]
            if a and b:
                jogos.append((a, b) if r % 2 == 0 else (b, a))
        rodadas.append(jogos)
        ts = [ts[0]] + [ts[-1]] + ts[1:-1]
    returno = [[(b, a) for a, b in rod] for rod in rodadas]
    return rodadas + returno


def _poisson(rng: random.Random, lam: float) -> int:
    L, k, p = math.exp(-lam), 0, 1.0
    while True:
        p *= rng.random()
        if p <= L:
            return k
        k += 1


def simular(mandante: str, visitante: str, forca: dict[str, float], semente: str,
            vantagem_casa: float = 0.25) -> dict:
    """Gols ~ Poisson, média puxada pela diferença de força (escala 0–100)."""
    rng = random.Random(semente)
    diff = (forca[mandante] - forca[visitante]) / 25.0
    lam_m = max(0.2, 1.3 * math.exp(0.45 * diff) + vantagem_casa)
    lam_v = max(0.2, 1.1 * math.exp(-0.45 * diff))
    gm, gv = _poisson(rng, lam_m), _poisson(rng, lam_v)
    gols = sorted(
        [{"minuto": rng.randint(1, 90), "time": mandante} for _ in range(gm)]
        + [{"minuto": rng.randint(1, 90), "time": visitante} for _ in range(gv)],
        key=lambda g: g["minuto"],
    )
    return {"mandante": mandante, "visitante": visitante, "gols_mandante": gm,
            "gols_visitante": gv, "gols": gols}


def tabela(times: list[str], resultados: list[dict]) -> list[dict]:
    t = {n: {"time": n, "j": 0, "v": 0, "e": 0, "d": 0, "gp": 0, "gc": 0, "pts": 0} for n in times}
    for r in resultados:
        m, v = t[r["mandante"]], t[r["visitante"]]
        gm, gv = r["gols_mandante"], r["gols_visitante"]
        for lado, gp, gc in ((m, gm, gv), (v, gv, gm)):
            lado["j"] += 1
            lado["gp"] += gp
            lado["gc"] += gc
            if gp > gc:
                lado["v"] += 1
                lado["pts"] += 3
            elif gp == gc:
                lado["e"] += 1
                lado["pts"] += 1
            else:
                lado["d"] += 1
    linhas = sorted(t.values(), key=lambda x: (-x["pts"], -(x["gp"] - x["gc"]), -x["gp"], x["time"]))
    for i, l in enumerate(linhas, 1):
        l["pos"] = i
        l["sg"] = l["gp"] - l["gc"]
    return linhas
