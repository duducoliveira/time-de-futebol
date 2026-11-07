"""Gera o MP4 de um episódio a partir do roteiro.json.

  1. Narra cada cena (ElevenLabs, com cache) e mede a duração.
  2. Monta a faixa de áudio: as narrações em sequência, com pausas, e uma trilha
     de fundo opcional (video/audio/trilha.mp3, em volume baixo e em loop).
  3. Chama o renderizador (video/render.mjs: Chromium + SVG -> quadros -> ffmpeg).
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from .narracao import narrar

RAIZ = Path(__file__).resolve().parents[2]
CACHE = RAIZ / ".cache" / "tts"
# efeitos sonoros (video/audio/), tocados no início da cena: (arquivo, volume, atraso em s)
EFEITOS = {"gol": ("torcida_gol.mp3", 0.55, 0.1), "fim_de_jogo": ("apito_final.mp3", 0.6, 0.0)}
CENSURA = re.compile(r"[#%*@$&!]{2,}|#.*[%*]")  # mesma regra de narracao.falar_token
PAUSA = {"gol": 1.0, "fim_de_jogo": 0.5, "encerramento": 1.8, "abertura": 0.4, "obra": 0.5}


def montar_audio(cenas: list[dict], saida: Path, trilha: Path | None = None) -> None:
    args = ["ffmpeg", "-y", "-loglevel", "error"]
    filtros, rotulos = [], []
    for i, c in enumerate(cenas):
        args += ["-i", c["audio"]]
        filtros.append(f"[{i}:a]aresample=44100,apad,atrim=0:{c['duracao']:.3f},asetpts=N/SR/TB[a{i}]")
        rotulos.append(f"[a{i}]")
    filtros.append(f"{''.join(rotulos)}concat=n={len(cenas)}:v=0:a=1[voz0]")
    n_in = len(cenas)
    inicio, efeitos = 0.0, []
    # bipe de TV: a palavra censurada ("p#%*") fica muda na voz e ganha um bipe de 1 kHz no lugar
    bipes, ini_cena = [], 0.0
    for c in cenas:
        for p in c.get("palavras", []):
            if CENSURA.search(p["texto"]):
                bipes.append((ini_cena + p["t0"] - 0.03, ini_cena + p["t1"] + 0.05))
        ini_cena += c["duracao"]
    if bipes:
        mudo = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in bipes)
        filtros.append(f"[voz0]volume=0:enable='{mudo}'[voz]")
        for a, b in bipes:
            args += ["-f", "lavfi", "-i", f"sine=frequency=1000:sample_rate=44100:duration={b - a:.3f}"]
            ms = int(a * 1000)
            filtros.append(f"[{n_in}:a]volume=1.6,adelay={ms}|{ms}[ef{n_in}]")
            efeitos.append(f"[ef{n_in}]")
            n_in += 1
    else:
        filtros.append("[voz0]anull[voz]")
    saida_rot = "[voz]"
    for c in cenas:
        ef = EFEITOS.get(c["tipo"])
        if ef and (c["tipo"] != "gol" or c["dados"].get("nosso")):
            arq = RAIZ / "video" / "audio" / ef[0]
            if arq.exists():
                args += ["-i", str(arq)]
                ms = int((inicio + ef[2]) * 1000)
                filtros.append(f"[{n_in}:a]aresample=44100,volume={ef[1]},adelay={ms}|{ms}[ef{n_in}]")
                efeitos.append(f"[ef{n_in}]")
                n_in += 1
        inicio += c["duracao"]
    if efeitos:
        filtros.append(f"[voz]{''.join(efeitos)}amix=inputs={len(efeitos) + 1}:duration=first:normalize=0[vozef]")
        saida_rot = "[vozef]"
    if trilha and trilha.exists():
        args += ["-stream_loop", "-1", "-i", str(trilha)]
        total = sum(c["duracao"] for c in cenas)
        filtros.append(f"[{n_in}:a]volume=0.12,atrim=0:{total:.3f},afade=t=out:st={total - 2:.3f}:d=2[bg]")
        filtros.append(f"{saida_rot}[bg]amix=inputs=2:duration=first:normalize=0[mix]")
        saida_rot = "[mix]"
    filtros.append(f"{saida_rot}loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100[final]")  # volume padrão de Reels
    args += ["-filter_complex", ";".join(filtros), "-map", "[final]", "-c:a", "libmp3lame", "-b:a", "192k", str(saida)]
    subprocess.run(args, check=True)


def gerar(roteiro_path: Path, saida: Path, preview: bool = False, forcar: bool = False) -> Path:
    r = json.loads(roteiro_path.read_text(encoding="utf-8"))
    pasta = saida.parent
    cenas = []
    for c in r["cenas"]:
        n = narrar(c["narracao"], CACHE, r["estado"]["personagens"]["narrador"].get("voz"),
                   c["dados"].get("estilo_voz", "normal"))
        cenas.append({**c, "audio": n["audio"], "palavras": n["palavras"],
                      "duracao": round(n["duracao"] + PAUSA.get(c["tipo"], 0.3), 3)})
        print(f"  {c['id']:<22} {cenas[-1]['duracao']:5.1f}s")
    total = sum(c["duracao"] for c in cenas)
    print(f"  total: {total:.1f}s")
    audio = pasta / "narracao.mp3"
    montar_audio(cenas, audio, RAIZ / "video" / "audio" / "trilha.mp3")
    entrada = pasta / "render.json"
    entrada.write_text(json.dumps({"cenas": cenas, "estado": r["estado"], "torcida": r["torcida"],
                                   "audio": str(audio)}, ensure_ascii=False), encoding="utf-8")
    cmd = ["node", str(RAIZ / "video" / "render.mjs"), str(entrada), str(saida)]
    qa = subprocess.run(cmd + ["--qa"], capture_output=True, text=True)
    print(qa.stdout.strip())
    if qa.returncode and not (forcar or preview):
        raise SystemExit("Checagem visual encontrou problemas (acima). Corrija ou rode com --forcar.")
    if preview:
        cmd.append("--preview")
    subprocess.run(cmd, check=True)
    return saida
