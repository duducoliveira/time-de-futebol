"""Estado do time: tudo que os seguidores já decidiram e as votações abertas.

Fica em dados/estado_time.json, versionado no git — o histórico de commits vira
a "linha do tempo" do clube.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ARQUIVO = Path(__file__).resolve().parents[2] / "dados" / "estado_time.json"


def agora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def carregar(caminho: Path = ARQUIVO) -> dict:
    return json.loads(caminho.read_text(encoding="utf-8"))


def salvar(estado: dict, caminho: Path = ARQUIVO) -> None:
    estado["atualizado_em"] = agora()
    caminho.write_text(json.dumps(estado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def votacao_aberta(estado: dict, permalink: str) -> dict | None:
    for v in estado["votacoes"]:
        if v["status"] == "aberta" and v.get("post_permalink") == permalink:
            return v
    return None


def aplicar_resultado(estado: dict, votacao: dict, resultado: dict) -> None:
    """Grava o vencedor no atributo do time que a votação decide."""
    votacao["resultado"] = resultado
    if not resultado["vencedor"]:
        return  # empate/sem votos: continua aberta para desempate manual
    votacao["status"] = "encerrada"
    votacao["encerrada_em"] = agora()
    valor = votacao["valores"][resultado["vencedor"]]
    alvo = estado["time"]
    *caminho, chave = votacao["atributo"].split(".")  # ex: "identidade.mascote"
    for parte in caminho:
        alvo = alvo.setdefault(parte, {})
    alvo[chave] = valor
    estado["linha_do_tempo"].append(
        {"data": agora(), "evento": f"{votacao['pergunta']} → {valor}",
         "votos": resultado["votantes"]}
    )
