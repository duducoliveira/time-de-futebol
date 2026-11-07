"""Narração com ElevenLabs + tempo de cada palavra (para a legenda karaokê).

A legenda mostra o texto como foi escrito ("R$ 4.732", "1,63 m"), mas o TTS
recebe a forma falada ("quatro mil setecentos e trinta e dois reais"). Cada
palavra da legenda é mapeada para o trecho falado correspondente, e o tempo
dela vem do alinhamento por caractere que a ElevenLabs devolve.

O áudio fica em cache por hash do texto, então rodar de novo não gasta créditos.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

import requests

UNID = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez",
        "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
DEZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
CEM = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos",
       "setecentos", "oitocentos", "novecentos"]
ORD_U = ["", "primeiro", "segundo", "terceiro", "quarto", "quinto", "sexto", "sétimo", "oitavo", "nono"]
ORD_D = ["", "décimo", "vigésimo", "trigésimo"]


def _ate_mil(n: int) -> str:
    if n < 20:
        return UNID[n]
    if n < 100:
        d, u = divmod(n, 10)
        return DEZ[d] + (f" e {UNID[u]}" if u else "")
    if n == 100:
        return "cem"
    c, r = divmod(n, 100)
    return CEM[c] + (f" e {_ate_mil(r)}" if r else "")


def extenso(n: int) -> str:
    if n < 1000:
        return _ate_mil(n)
    if n < 1_000_000:
        m, r = divmod(n, 1000)
        pre = "mil" if m == 1 else f"{_ate_mil(m)} mil"
        if not r:
            return pre
        return pre + (" e " if r < 100 or r % 100 == 0 else " ") + _ate_mil(r)
    mi, r = divmod(n, 1_000_000)
    pre = "um milhão" if mi == 1 else f"{extenso(mi)} milhões"
    return pre + ((" e " if r < 1000 else " ") + extenso(r) if r else "")


def ordinal(n: int) -> str:
    if n < 10:
        return ORD_U[n]
    d, u = divmod(n, 10)
    return ORD_D[d] + (f" {ORD_U[u]}" if u else "")


def falar_token(tok: str, anterior: str = "", proximo: str = "") -> str:
    """Forma falada de um token da legenda ('' = não falar)."""
    if re.fullmatch(r"\[[^\]]*\]", tok):
        return tok  # marcação de emoção do eleven_v3, ex: [shouting]
    m = re.fullmatch(r"([(\"“]*)(.*?)([.,;:!?)\"”…]*)", tok)
    pre, nucleo, pos = m.groups()
    if nucleo in ("R$",):
        return ""
    if nucleo in ("m", "kg") and re.search(r"\d", anterior):
        return pos.replace(";", ".")  # só a pontuação, que vai grudar na palavra anterior
    unidade = re.sub(r"[.,;:!?]+$", "", proximo)
    sufixo = ""
    if re.match(r"^R\$", anterior):
        sufixo = " reais"
    elif unidade == "kg":
        sufixo = " quilos"
    pos = pos.replace(";", ".")
    if re.fullmatch(r"\d+º", nucleo):
        return pre + ordinal(int(nucleo[:-1])) + pos
    if re.fullmatch(r"\d+,\d+", nucleo) and unidade == "m":
        inteiro, dec = nucleo.split(",")
        return f"{pre}{extenso(int(inteiro))} metro{'s' if int(inteiro) > 1 else ''} e {extenso(int(dec))}{pos}"
    if re.fullmatch(r"\d{1,3}(\.\d{3})+|\d+", nucleo):
        return pre + extenso(int(nucleo.replace(".", ""))) + sufixo + pos
    if re.fullmatch(r"\d+'", nucleo):
        return f"{pre}{extenso(int(nucleo[:-1]))} minutos{pos}"
    if re.search(r"[#%*@$&!]{2,}|#.*[%*]", nucleo) and not nucleo.startswith("@"):
        return pre + "piii" + pos  # palavrão censurado ("p#%*"): marca o tempo; o vídeo troca por um bipe de TV
    if nucleo == "FC":
        return pre + "éfe cê" + pos
    if nucleo.startswith("@"):
        return pre + "arroba " + nucleo[1:].replace("_", " ").replace(".", " ponto ") + pos
    return tok.replace(";", ".")


def preparar_texto(texto: str) -> tuple[list[str], str, list[tuple[int, int]]]:
    """Retorna (tokens da legenda, texto falado, [ (ini, fim) no texto falado por token ])."""
    toks = texto.split()
    falado, spans, cursor = [], [], 0
    for i, t in enumerate(toks):
        f = falar_token(t, toks[i - 1] if i else "", toks[i + 1] if i + 1 < len(toks) else "")
        if f and re.fullmatch(r"[.,:!?]+", f) and falado:
            falado[-1] += f
            cursor += len(f)
            spans.append(spans[-1])
        elif f:
            if falado:
                cursor += 1
            spans.append((cursor, cursor + len(f)))
            falado.append(f)
            cursor += len(f)
        else:
            spans.append((-1, -1))
    return toks, " ".join(falado), spans


# Estilos de narração. "grito" usa o eleven_v3, que entende marcações como [shouting].
ESTILOS = {
    "normal": ("eleven_multilingual_v2", {"stability": 0.32, "similarity_boost": 0.8, "style": 0.55,
                                          "use_speaker_boost": True, "speed": 1.08}),
    "grito": ("eleven_v3", {"stability": 0.0, "similarity_boost": 0.8}),
}


def tts(texto: str, cache: Path, voz: str | None = None, estilo: str = "normal") -> tuple[Path, dict]:
    """Gera (ou reaproveita) o MP3 e o alinhamento de um texto."""
    voz = voz or os.environ["ELEVENLABS_VOICE_ID"]
    modelo, ajustes = ESTILOS[estilo]
    if estilo == "normal":
        modelo = os.environ.get("ELEVENLABS_MODEL", modelo)
    chave = hashlib.sha1(json.dumps([texto, voz, modelo, ajustes]).encode()).hexdigest()[:16]
    mp3, alin = cache / f"{chave}.mp3", cache / f"{chave}.json"
    if not mp3.exists():
        cache.mkdir(parents=True, exist_ok=True)
        r = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voz}/with-timestamps",
            params={"output_format": "mp3_44100_128"},
            headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]},
            json={"text": texto, "model_id": modelo, "language_code": "pt", "voice_settings": ajustes},
            timeout=180)
        if r.status_code >= 400:
            raise RuntimeError(f"ElevenLabs {r.status_code}: {r.text[:300]}")
        d = r.json()
        mp3.write_bytes(base64.b64decode(d["audio_base64"]))
        alin.write_text(json.dumps(d["alignment"]), encoding="utf-8")
    return mp3, json.loads(alin.read_text(encoding="utf-8"))


def duracao(mp3: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(mp3)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def narrar(texto: str, cache: Path, voz: str | None = None, estilo: str = "normal") -> dict:
    toks, falado, spans = preparar_texto(texto)
    mp3, a = tts(falado, cache, voz, estilo)
    ini, fim = a["character_start_times_seconds"], a["character_end_times_seconds"]
    palavras = []
    for t, (s, e) in zip(toks, spans):
        if s < 0:
            palavras.append({"texto": t, "t0": None, "t1": None})
            continue
        s, e = min(s, len(ini) - 1), min(max(e - 1, s), len(fim) - 1)
        palavras.append({"texto": t, "t0": round(ini[s], 3), "t1": round(fim[e], 3)})
    for i, p in enumerate(palavras):  # tokens não falados herdam o tempo do vizinho
        if p["t0"] is None:
            viz = next((q for q in palavras[i + 1:] if q["t0"] is not None), None) or \
                  next((q for q in reversed(palavras[:i]) if q["t0"] is not None), {"t0": 0, "t1": 0})
            p["t0"], p["t1"] = viz["t0"], viz["t1"]
    palavras = [p for p in palavras if not re.fullmatch(r"\[[^\]]*\]", p["texto"])]
    return {"audio": str(mp3), "duracao": duracao(mp3), "palavras": palavras, "falado": falado}
