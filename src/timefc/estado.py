"""Estado do clube (dados/estado_time.json), versionado no git.

O histórico de commits vira a "linha do tempo" do clube. Caminhos de atributo
usam pontos a partir da raiz do estado, ex: "estrutura.gramado",
"elenco.1.apelido", "clube.forca".
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ARQUIVO = Path(__file__).resolve().parents[2] / "dados" / "estado_time.json"


def agora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def carregar(caminho: Path = ARQUIVO) -> dict:
    return json.loads(caminho.read_text(encoding="utf-8"))


def salvar(estado: dict, caminho: Path = ARQUIVO) -> None:
    estado["atualizado_em"] = agora()
    caminho.write_text(json.dumps(estado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def ler(estado: dict, caminho: str, padrao: Any = None) -> Any:
    alvo: Any = estado
    for parte in caminho.split("."):
        if not isinstance(alvo, dict) or parte not in alvo:
            return padrao
        alvo = alvo[parte]
    return alvo


def definir(estado: dict, caminho: str, valor: Any) -> Any:
    """Define um valor. Strings "+N"/"-N" somam ao valor numérico atual."""
    *partes, chave = caminho.split(".")
    alvo = estado
    for p in partes:
        alvo = alvo.setdefault(p, {})
    if isinstance(valor, str) and valor[:1] in "+-" and valor[1:].replace(".", "", 1).isdigit():
        valor = (alvo.get(chave) or 0) + float(valor)
        valor = int(valor) if float(valor).is_integer() else valor
    alvo[chave] = valor
    return valor


def lancar(estado: dict, valor: float, descricao: str) -> None:
    """Movimenta o caixa e registra no extrato."""
    estado["caixa"] = round(estado.get("caixa", 0) + valor, 2)
    estado.setdefault("extrato", []).append(
        {"dia": estado["dia"], "valor": valor, "descricao": descricao, "saldo": estado["caixa"]})


def evento(estado: dict, texto: str, **extra: Any) -> None:
    estado.setdefault("linha_do_tempo", []).append({"dia": estado["dia"], "evento": texto, **extra})


def aplicar_enquete(estado: dict, enquete: dict, resultado: dict) -> None:
    """Enquete A/B (ex: apelido do goleiro): grava o vencedor no atributo."""
    enquete["resultado"] = resultado
    if not resultado["vencedor"]:
        return
    enquete["status"] = "encerrada"
    valor = enquete["valores"][resultado["vencedor"]]
    definir(estado, enquete["atributo"], valor)
    evento(estado, f"{enquete['pergunta']} → {valor}", votos=resultado["votantes"])
