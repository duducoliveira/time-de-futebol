"""Hospedagem dos vídeos no próprio repositório público do GitHub.

O MP4 é versionado em videos/dia-NNN.mp4 e servido por raw.githubusercontent.com
(com content-type de vídeo), que é a URL pública que o Buffer baixa para postar.
Limite do GitHub: 100 MB por arquivo; um episódio de 90 s tem uns 28 MB.
"""
from __future__ import annotations

import re
import shutil
import subprocess
import time
from pathlib import Path

import requests

RAIZ = Path(__file__).resolve().parents[2]


def _git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=RAIZ, check=True, capture_output=True, text=True).stdout.strip()


def repo_slug() -> str:
    url = _git("remote", "get-url", "origin")
    m = re.search(r"github\.com[/:]([^/]+/[^/.]+)", url) or re.search(r"/git/([^/]+/[^/.]+)", url)
    if not m:
        raise RuntimeError(f"não consegui descobrir o repositório GitHub a partir de {url}")
    return m.group(1)


def publicar_video(mp4: Path, dia: int, branch: str | None = None) -> str:
    destino = RAIZ / "videos" / f"dia-{dia:03d}.mp4"
    destino.parent.mkdir(exist_ok=True)
    if mp4.resolve() != destino.resolve():
        shutil.copyfile(mp4, destino)
    branch = branch or _git("rev-parse", "--abbrev-ref", "HEAD")
    _git("add", "-f", str(destino.relative_to(RAIZ)))
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=RAIZ).returncode:
        _git("commit", "-m", f"vídeo: dia {dia}")
    for espera in (0, 2, 4, 8, 16):
        time.sleep(espera)
        if subprocess.run(["git", "push", "-u", "origin", branch], cwd=RAIZ).returncode == 0:
            break
    else:
        raise RuntimeError("git push falhou")
    url = f"https://raw.githubusercontent.com/{repo_slug()}/{branch}/videos/{destino.name}"
    for _ in range(10):  # o raw pode levar alguns segundos para refletir o push
        r = requests.head(url, timeout=30, allow_redirects=True)
        if r.status_code == 200:
            return url
        time.sleep(3)
    raise RuntimeError(f"vídeo não ficou acessível em {url}")
