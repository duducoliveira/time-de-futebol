"""Hospedagem dos vídeos num repositório público do GitHub só para vídeos.

Repositório: `clube.repo_videos` em dados/estado_time.json (ex: duducoliveira/poeirafc-videos).
O MP4 vai para dia-NNN.mp4 na raiz desse repositório e é servido por
raw.githubusercontent.com (com content-type de vídeo), que é a URL pública que o
Buffer baixa para postar. Limite do GitHub: 100 MB por arquivo (um episódio tem ~28 MB).

O clone local fica ao lado deste projeto (../<nome-do-repo>); se não existir, é clonado.
"""
from __future__ import annotations

import shutil
import subprocess
import time
from pathlib import Path

import requests

RAIZ = Path(__file__).resolve().parents[2]


def _git(pasta: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=pasta, check=check, capture_output=True, text=True)


def clone_local(repo: str) -> Path:
    pasta = RAIZ.parent / repo.split("/")[1]
    if not (pasta / ".git").exists():
        subprocess.run(["git", "clone", "--depth", "1", f"https://github.com/{repo}", str(pasta)], check=True)
    return pasta


def publicar_video(mp4: Path, dia: int, repo: str, branch: str = "main") -> str:
    pasta = clone_local(repo)
    tem_historico = _git(pasta, "rev-parse", "HEAD", check=False).returncode == 0
    if tem_historico:
        _git(pasta, "fetch", "origin", branch, check=False)
        _git(pasta, "checkout", "-B", branch, f"origin/{branch}", check=False)
    else:
        _git(pasta, "checkout", "-B", branch)
    destino = pasta / f"dia-{dia:03d}.mp4"
    shutil.copyfile(mp4, destino)
    _git(pasta, "add", destino.name)
    if _git(pasta, "diff", "--cached", "--quiet", check=False).returncode:
        _git(pasta, "commit", "-m", f"Dia {dia}")
    for espera in (0, 2, 4, 8, 16):
        time.sleep(espera)
        if _git(pasta, "push", "-u", "origin", branch, check=False).returncode == 0:
            break
    else:
        raise RuntimeError("git push do vídeo falhou")
    url = f"https://raw.githubusercontent.com/{repo}/{branch}/{destino.name}"
    for _ in range(15):  # o raw pode levar alguns segundos para refletir o push
        r = requests.head(url, timeout=30, allow_redirects=True)
        if r.status_code == 200:
            return url
        time.sleep(3)
    raise RuntimeError(f"vídeo não ficou acessível em {url}")
