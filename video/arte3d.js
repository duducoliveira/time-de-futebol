// Estilo 3D: uma camada por cima da arte vetorial (arte.js).
// Em vez de redesenhar tudo, cada quadro passa por `cena3d()`, que:
//   1. dá volume: todo elemento marcado com data-v="X" ganha por cima uma cópia com luz e sombra (#g3dX);
//   2. troca o contorno preto grosso de desenho por um contorno fino e suave;
//   3. acende brilhos e volumes que ficam invisíveis no estilo 2D (class vol3d / brilho3d);
//   4. aplica a luz geral da cena (sol no alto à esquerda + vinheta).
// Além disso, céu, trave, cartões e títulos são redefinidos aqui com profundidade (extrusão e sombra suave).
// EXPERIMENTAL e desligado por padrão: os episódios continuam no estilo 2D aprovado.
// Para testar: ESTILO3D=1 node video/render.mjs ...

window.ESTILO3D = false;

const DEFS3D = `<defs>
  <radialGradient id="g3dEsfera" cx=".33" cy=".27" r=".9">
    <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".3" stop-color="#fff" stop-opacity=".1"/>
    <stop offset=".62" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".46"/></radialGradient>
  <linearGradient id="g3dCorpo" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
  <linearGradient id="g3dVert" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
  <linearGradient id="g3dCabelo" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
  <linearGradient id="g3dCasa" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".6" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
  <linearGradient id="g3dMorro" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".55" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
  <linearGradient id="g3dVidro" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".65"/><stop offset=".32" stop-color="#fff" stop-opacity=".05"/>
    <stop offset=".5" stop-color="#fff" stop-opacity=".3"/><stop offset=".56" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
  <linearGradient id="g3dBrilho" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="g3dTexto" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
  <radialGradient id="g3dSombra"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".6" stop-color="#000" stop-opacity=".2"/>
    <stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <linearGradient id="g3dSombraChao" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="g3dChao" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
  <radialGradient id="g3dSol" cx=".12" cy=".06" r=".75"><stop offset="0" stop-color="#fff3c4" stop-opacity=".5"/>
    <stop offset=".5" stop-color="#ffe9a8" stop-opacity=".08"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
  <radialGradient id="g3dVinheta" cx=".5" cy=".46" r=".8"><stop offset=".55" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#1a0f08" stop-opacity=".4"/></radialGradient>
  <radialGradient id="g3dHolofote" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="#5b7fb5" stop-opacity=".55"/>
    <stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
  <filter id="f3dFundo" x="-2%" y="-2%" width="104%" height="104%"><feGaussianBlur stdDeviation="1.4"/></filter>
</defs>`;

function escurecer(hex, f = 0.62) {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return OUT;
  const n = parseInt(h, 16), c = v => Math.round(((n >> v) & 255) * f).toString(16).padStart(2, '0');
  return `#${c(16)}${c(8)}${c(0)}`;
}

const _RE_FORMA = /<(rect|circle|ellipse|path|line|polygon)\b[^>]*\/>/g;
const _RE_LIMPA = /\s(fill|stroke|stroke-width|stroke-opacity|stroke-linejoin|stroke-linecap|class|data-v|opacity)="[^"]*"/g;

// passo 3D aplicado ao SVG de uma cena inteira
function cena3d(svg) {
  const out = svg.replace(_RE_FORMA, tag => {
    let extra = '';
    const v = tag.match(/data-v="(\w+)"/);
    if (v) extra = tag.replace(_RE_LIMPA, '').replace(/\/>$/, ` fill="url(#g3d${v[1]})"/>`);
    if (tag.includes('class="vol3d"')) return tag.replace('opacity="0"', 'opacity="1"');
    if (tag.includes('class="brilho3d"')) return tag.replace('opacity="0"', 'opacity=".3"');
    if (tag.includes(`stroke="${OUT}"`)) {
      const m = tag.match(/stroke-width="([\d.]+)"/);
      if (m) {
        const w = +m[1], linha = tag.startsWith('<line') || /fill="none"/.test(tag);
        if (!linha) tag = tag.replace(m[0], `stroke-width="${(w * 0.42).toFixed(2)}"`).replace(`stroke="${OUT}"`, `stroke="${OUT}" stroke-opacity=".62"`);
        else if (w >= 28) tag = tag.replace(m[0], `stroke-width="${w - 7}"`).replace(`stroke="${OUT}"`, `stroke="${OUT}" stroke-opacity=".8"`);
      }
    }
    return tag + extra;
  });
  return DEFS3D + out + `<rect width="${W}" height="${H}" fill="url(#g3dVinheta)"/>`;
}

// ------------------------------------------------------------ cenário
const _ceu2d = ceu, _trave2d = trave, _campo2d = campo, _fundoEscuro2d = fundoEscuro, _bairro2d = bairro,
  _lateral2d = lateral, _estadio2d = estadioAereo;

ceu = function (t) {
  if (!window.ESTILO3D) return _ceu2d(t);
  const nuvens = [[180, 170, 1], [700, 100, 0.8], [980, 250, 1.1], [420, 330, 0.6]].map(([x, y, s], i) =>
    `<g transform="translate(${(x + t * 8 * (i + 1)) % 1300 - 110} ${y}) scale(${s})">
      <ellipse cx="6" cy="22" rx="118" ry="30" fill="#7fa8c9" opacity=".35"/>
      <ellipse data-v="Esfera" cx="0" cy="0" rx="90" ry="40" fill="#fff"/><ellipse data-v="Esfera" cx="-52" cy="14" rx="60" ry="30" fill="#fff"/>
      <ellipse data-v="Esfera" cx="56" cy="12" rx="66" ry="31" fill="#fff"/><ellipse cx="-6" cy="-10" rx="70" ry="24" fill="#fff"/></g>`).join('');
  return `<defs><linearGradient id="gceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8fe0"/><stop offset=".55" stop-color="#8fd0f7"/>
      <stop offset="1" stop-color="#e6f6ff"/></linearGradient>
    <linearGradient id="gterra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CORES.terra2}"/><stop offset="1" stop-color="${CORES.terra1}"/></linearGradient>
    <radialGradient id="gsol"><stop offset="0" stop-color="#fffbe0"/><stop offset=".35" stop-color="#ffe58a" stop-opacity=".9"/>
      <stop offset="1" stop-color="#ffe58a" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#gceu)"/><circle cx="150" cy="150" r="230" fill="url(#gsol)"/>${nuvens}`;
};

// o bairro fica levemente desfocado: dá profundidade (o que está perto fica nítido)
bairro = function (yBase) {
  const s = _bairro2d(yBase);
  return window.ESTILO3D && window.DESFOQUE3D !== false ? `<g filter="url(#f3dFundo)">${s}</g>` : s;
};

trave = function (x, y, s = 1, torta = true, rede = false) {
  if (!window.ESTILO3D) return _trave2d(x, y, s, torta, rede);
  const fio = (d, o = .7) => `<path d="${d}" stroke="#fff" stroke-width="2" opacity="${o}" fill="none"/>`;
  let malha = '';
  if (rede) {
    for (let i = 0; i <= 12; i++) malha += fio(`M${-150 + i * 25},-110 L${-128 + i * 21.3},-92 V-26`, .55);   // teto + fundo
    for (let i = 0; i <= 3; i++) malha += fio(`M-128,${-92 + i * 22} H128`, .55);
    for (let i = 1; i <= 4; i++) malha += fio(`M-150,${-110 + i * 22} L-128,${-92 + i * 16.5} M150,${-110 + i * 22} L128,${-92 + i * 16.5}`, .5);
  }
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${torta ? -3 : 0})">
    <ellipse cx="14" cy="6" rx="190" ry="20" fill="url(#g3dSombra)"/>
    <path d="M-150,-110 L-128,-92 H128 L150,-110Z" fill="#fff" opacity=".16"/>
    <path d="M-128,-92 H128 V-26 H-128Z" fill="#000" opacity=".12"/>${malha}
    <path d="M-128,-26 V-92 H128 V-26 M-150,0 L-128,-26 M150,0 L128,-26 M-150,-110 L-128,-92 M150,-110 L128,-92" fill="none" stroke="#dfe6ea" stroke-width="5" stroke-linejoin="round" opacity=".85"/>
    <path d="M-150,0 V-110 H150 V0" fill="none" stroke="#8d99a3" stroke-width="15" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M-150,0 V-110 H150 V0" fill="none" stroke="#ffffff" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M-147,2 V-107 H153" fill="none" stroke="#b8c2c9" stroke-width="3.5" stroke-linejoin="round" opacity=".9"/></g>`;
};

// luz do chão: mais claro no fundo (névoa), mais escuro perto da câmera
const _luzChao = (y0 = 950) => `<rect x="0" y="${y0}" width="${W}" height="${H - y0}" fill="url(#g3dChao)"/>`;
campo = function (estrutura, o = {}) { return _campo2d(estrutura, o) + (window.ESTILO3D ? _luzChao(950) : ''); };
lateral = function (estrutura, o = {}) { return _lateral2d(estrutura, o) + (window.ESTILO3D ? _luzChao(950) : ''); };
estadioAereo = function (estrutura, torcida, o = {}) { return _estadio2d(estrutura, torcida, o) + (window.ESTILO3D ? _luzChao(650) : ''); };
fundoEscuro = function () { return _fundoEscuro2d() + (window.ESTILO3D ? `<rect width="${W}" height="${H}" fill="url(#g3dHolofote)"/>` : ''); };

// ------------------------------------------------------------ UI em relevo
const _pilula2d = pilula, _cartao2d = cartao, _titulo2d = tituloGrande;

pilula = function (txt, o = {}) {
  if (!window.ESTILO3D) return _pilula2d(txt, o);
  const { tam = 46, bg = CORES.marinho, cor = '#fff', rot = 0, px = 30, py = 18 } = o;
  const w = medir(txt, tam) + px * 2, h = tam + py * 2, rx = h * 0.28, e = Math.max(6, h * 0.12);
  return `<g transform="rotate(${rot})">
    <ellipse cx="6" cy="${h / 2 + e + 8}" rx="${w * 0.52}" ry="${h * 0.26}" fill="url(#g3dSombra)"/>
    <rect x="${-w / 2}" y="${-h / 2 + e}" width="${w}" height="${h}" rx="${rx}" fill="${escurecer(bg, .55)}" stroke="${OUT}" stroke-width="6"/>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${rx}" fill="${bg}" stroke="${OUT}" stroke-width="6"/>
    <rect x="${-w / 2 + 5}" y="${-h / 2 + 4}" width="${w - 10}" height="${h * 0.5}" rx="${rx * 0.85}" fill="url(#g3dBrilho)"/>
    <text y="${tam * 0.36 + 2}" text-anchor="middle" font-family="Anton" font-size="${tam}" fill="#000" opacity=".3">${esc(txt)}</text>
    <text y="${tam * 0.36}" text-anchor="middle" font-family="Anton" font-size="${tam}" fill="${cor}">${esc(txt)}</text></g>`;
};

cartao = function (w, h, conteudo, o = {}) {
  if (!window.ESTILO3D) return _cartao2d(w, h, conteudo, o);
  const { bg = '#fff', rx = 34 } = o, e = 14;
  return `<rect x="${-w / 2 - 6}" y="${-h / 2 + 22}" width="${w + 24}" height="${h + 14}" rx="${rx + 10}" fill="#000" opacity=".1"/>
    <rect x="${-w / 2 + 2}" y="${-h / 2 + 20}" width="${w + 8}" height="${h + 6}" rx="${rx + 4}" fill="#000" opacity=".16"/>
    <rect x="${-w / 2}" y="${-h / 2 + e}" width="${w}" height="${h}" rx="${rx}" fill="${escurecer(bg, .62)}" stroke="${OUT}" stroke-width="7"/>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${rx}" fill="${bg}" stroke="${OUT}" stroke-width="7"/>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${rx}" fill="url(#g3dCasa)" opacity=".55"/>${conteudo}`;
};

tituloGrande = function (txt, o = {}) {
  if (!window.ESTILO3D) return _titulo2d(txt, o);
  const { tam = 190, cor = CORES.laranja, rot = -4 } = o;
  const base = `text-anchor="middle" font-family="Anton" font-size="${tam}"`, t = esc(txt);
  const prof = Math.max(8, Math.round(tam * 0.075)), lado = escurecer(cor, .5);
  let camadas = '';
  for (let i = prof; i >= 1; i -= 2) camadas += `<text ${base} x="${i * 0.45}" y="${i}" fill="${lado}" stroke="${lado}" stroke-width="5" stroke-linejoin="round">${t}</text>`;
  return `<g transform="rotate(${rot})">
    <text ${base} x="${prof * 0.45 + 6}" y="${prof + 12}" fill="#000" stroke="#000" stroke-width="26" stroke-linejoin="round" opacity=".28">${t}</text>
    <text ${base} x="${prof * 0.45}" y="${prof}" fill="${OUT}" stroke="${OUT}" stroke-width="20" stroke-linejoin="round">${t}</text>
    <text ${base} fill="${OUT}" stroke="${OUT}" stroke-width="16" stroke-linejoin="round">${t}</text>${camadas}
    <text ${base} fill="${cor}">${t}</text><text ${base} fill="url(#g3dTexto)">${t}</text></g>`;
};

Object.assign(window, { cena3d, escurecer, DEFS3D });
