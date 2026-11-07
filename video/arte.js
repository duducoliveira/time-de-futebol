// Biblioteca de arte vetorial do clube: personagens, cenários e componentes de UI.
// Tudo é SVG gerado por código, então o visual muda conforme o estado do clube
// (gramado, telhado, lanchonete, torcida…) e os personagens são sempre iguais.

const W = 1080, H = 1920;
const OUT = '#2b1d14';
const CORES = {
  laranja: '#ff8a1f', amarelo: '#ffc93c', creme: '#fff4dc', vinho: '#7a1f2b', azul: '#1f4e79',
  verde: '#2e8b57', ceu1: '#6ec3f4', ceu2: '#d8f0ff', terra1: '#c97a40', terra2: '#ad5f2c',
  grama1: '#4caf50', grama2: '#43a047', marinho: '#16263d',
};

// ------------------------------------------------------------ utilidades
function rng(seed) {
  let s = 0;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOutBack = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const easeOut = x => 1 - Math.pow(1 - x, 3);
const prog = (t, ini, dur) => clamp((t - ini) / dur);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const _ctx = document.createElement('canvas').getContext('2d');
function medir(txt, tam, fonte = 'Anton') { _ctx.font = `${tam}px ${fonte}`; return _ctx.measureText(txt).width; }

function quebrar(txt, tam, larg, fonte = 'Nunito') {
  const linhas = []; let atual = '';
  for (const p of String(txt).split(/\s+/)) {
    const teste = atual ? atual + ' ' + p : p;
    if (medir(teste, tam, fonte) > larg && atual) { linhas.push(atual); atual = p; } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

// "pop": escala com overshoot a partir do instante `ini`
function pop(t, ini, x, y, conteudo, dur = 0.45, ui = true) {
  const p = prog(t, ini, dur);
  if (p <= 0) return '';
  const s = easeOutBack(p);
  return `<g ${ui ? 'class="ui" ' : ''}transform="translate(${x} ${y}) scale(${s})" opacity="${clamp(p * 3)}">${conteudo}</g>`;
}
// personagens também "pulam" na tela, mas não são elementos de interface
const popPessoa = (t, ini, x, y, conteudo) => pop(t, ini, x, y, conteudo, 0.45, false);

// ------------------------------------------------------------ texto e UI
function texto(txt, { tam = 80, cor = '#fff', borda = OUT, bw = 14, fonte = 'Anton', anchor = 'middle', peso = 400 } = {}) {
  return `<text text-anchor="${anchor}" font-family="${fonte}" font-weight="${peso}" font-size="${tam}" fill="${cor}"
    stroke="${borda}" stroke-width="${bw}" stroke-linejoin="round" paint-order="stroke">${esc(txt)}</text>`;
}

function pilula(txt, { tam = 46, bg = CORES.marinho, cor = '#fff', rot = 0, px = 30, py = 18 } = {}) {
  const w = medir(txt, tam) + px * 2, h = tam + py * 2;
  return `<g transform="rotate(${rot})">
    <rect x="${-w / 2 + 6}" y="${-h / 2 + 8}" width="${w}" height="${h}" rx="${h * 0.28}" fill="${OUT}" opacity=".9"/>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h * 0.28}" fill="${bg}" stroke="${OUT}" stroke-width="6"/>
    <text y="${tam * 0.36}" text-anchor="middle" font-family="Anton" font-size="${tam}" fill="${cor}">${esc(txt)}</text></g>`;
}

function tituloGrande(txt, { tam = 190, cor = CORES.laranja, rot = -4 } = {}) {
  return `<g transform="rotate(${rot})">
    <text y="14" text-anchor="middle" font-family="Anton" font-size="${tam}" fill="${OUT}" stroke="${OUT}" stroke-width="30" stroke-linejoin="round">${esc(txt)}</text>
    <text text-anchor="middle" font-family="Anton" font-size="${tam}" fill="${cor}" stroke="${OUT}" stroke-width="16" stroke-linejoin="round" paint-order="stroke">${esc(txt)}</text></g>`;
}

function cartao(w, h, conteudo, { bg = '#fff', rx = 34 } = {}) {
  return `<rect x="${-w / 2 + 10}" y="${-h / 2 + 14}" width="${w}" height="${h}" rx="${rx}" fill="${OUT}" opacity=".85"/>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${rx}" fill="${bg}" stroke="${OUT}" stroke-width="7"/>${conteudo}`;
}

function painelCaixa(valor, moeda = 'R$', rotulo = 'CAIXA DO CLUBE') {
  const txt = `${moeda} ${Math.round(valor).toLocaleString('pt-BR')}`;
  return cartao(560, 230, `
    <rect x="-280" y="-115" width="560" height="64" rx="30" fill="${CORES.marinho}"/>
    <rect x="-280" y="-80" width="560" height="30" fill="${CORES.marinho}"/>
    <text y="-70" text-anchor="middle" font-family="Anton" font-size="38" fill="#fff" letter-spacing="3">${rotulo}</text>
    <text y="72" text-anchor="middle" font-family="Anton" font-size="118" fill="${CORES.verde}" stroke="${OUT}" stroke-width="6" paint-order="stroke">${esc(txt)}</text>`, { bg: CORES.creme });
}

function cartaoPerfil(nome, handle, seguidores, escudoSvg) {
  return cartao(640, 470, `
    <g transform="translate(0 -135) scale(.62)">${escudoSvg}</g>
    <text y="0" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="44" fill="${OUT}">${esc(nome)}</text>
    <text y="44" text-anchor="middle" font-family="Nunito" font-weight="600" font-size="32" fill="#777">${esc(handle)}</text>
    <text y="170" text-anchor="middle" font-family="Anton" font-size="130" fill="${CORES.laranja}" stroke="${OUT}" stroke-width="7" paint-order="stroke">${Math.round(seguidores).toLocaleString('pt-BR')}</text>
    <text y="215" text-anchor="middle" font-family="Anton" font-size="32" fill="${OUT}" letter-spacing="2">SEGUIDORES = TORCEDORES</text>`);
}

function cartaoComentario(usuario, txt, curtidas, { selo = 'COMENTÁRIO MAIS CURTIDO', w = 900 } = {}) {
  const linhas = quebrar(txt, 44, w - 200).slice(0, 4);
  const h = 150 + linhas.length * 54;
  const r = rng(usuario);
  const av = ['#e76f51', '#2a9d8f', '#e9c46a', '#8e7dbe', '#f4a261'][Math.floor(r() * 5)];
  return cartao(w, h, `
    <circle cx="${-w / 2 + 80}" cy="${-h / 2 + 80}" r="44" fill="${av}" stroke="${OUT}" stroke-width="6"/>
    <text x="${-w / 2 + 80}" y="${-h / 2 + 96}" text-anchor="middle" font-family="Anton" font-size="46" fill="#fff">${esc(usuario[0].toUpperCase())}</text>
    <text x="${-w / 2 + 145}" y="${-h / 2 + 68}" font-family="Nunito" font-weight="900" font-size="36" fill="${OUT}">@${esc(usuario)}</text>
    <text x="${-w / 2 + 145}" y="${-h / 2 + 106}" font-family="Anton" font-size="28" fill="${CORES.laranja}" letter-spacing="2">${esc(selo)}</text>
    ${linhas.map((l, i) => `<text x="${-w / 2 + 145}" y="${-h / 2 + 166 + i * 54}" font-family="Nunito" font-weight="700" font-size="42" fill="#222">${esc(l)}</text>`).join('')}
    <text x="${w / 2 - 60}" y="${-h / 2 + 80}" text-anchor="middle" font-size="52" fill="#e63946">♥</text>
    <text x="${w / 2 - 60}" y="${-h / 2 + 122}" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="30" fill="#e63946">${Number(curtidas).toLocaleString('pt-BR')}</text>`);
}

function cartaoOpcao(txt, icone, cor, w = 300, h = 340) {
  const linhas = quebrar(txt.toUpperCase(), 40, w - 40, 'Anton');
  return cartao(w, h, `
    <circle cy="-70" r="62" fill="${cor}" stroke="${OUT}" stroke-width="6"/>
    <text y="-48" text-anchor="middle" font-size="62">${icone}</text>
    ${linhas.map((l, i) => `<text y="${40 + i * 46}" text-anchor="middle" font-family="Anton" font-size="40" fill="${OUT}">${esc(l)}</text>`).join('')}`,
    { bg: CORES.creme, rx: 28 });
}

function iconeOpcao(txt) {
  const t = txt.toLowerCase();
  const mapa = [['goleiro', '🧤'], ['zag', '🛡️'], ['atacante', '⚽'], ['meia', '🎯'], ['grama', '🌱'], ['refletor', '💡'],
    ['arquibancada', '🏟️'], ['telhado', '🏠'], ['vestiário', '🚿'], ['uniforme', '👕'], ['lanchonete', '🌭'], ['kombi', '🚐'],
    ['técnico', '📋'], ['bola', '⚽'], ['rede', '🥅'], ['outra', '❓']];
  return (mapa.find(([k]) => t.includes(k)) || ['', '⭐'])[1];
}

function tabelaCard(linhas, destaque, titulo, { rodada = null } = {}) {
  const w = 900, lh = 66, h = 130 + linhas.length * lh;
  let s = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="96" rx="34" fill="${CORES.marinho}"/>
    <rect x="${-w / 2}" y="${-h / 2 + 50}" width="${w}" height="46" fill="${CORES.marinho}"/>
    <text x="${-w / 2 + 36}" y="${-h / 2 + 64}" font-family="Anton" font-size="40" fill="#fff" letter-spacing="2">${esc(titulo.toUpperCase())}</text>
    <text x="${w / 2 - 150}" y="${-h / 2 + 64}" text-anchor="middle" font-family="Anton" font-size="32" fill="#9fb3c8">SG</text>
    <text x="${w / 2 - 60}" y="${-h / 2 + 64}" text-anchor="middle" font-family="Anton" font-size="32" fill="#9fb3c8">PTS</text>`;
  linhas.forEach((l, i) => {
    const y = -h / 2 + 110 + i * lh, nosso = l.time === destaque;
    if (nosso) s += `<rect x="${-w / 2 + 12}" y="${y}" width="${w - 24}" height="${lh - 6}" rx="14" fill="${CORES.laranja}" stroke="${OUT}" stroke-width="4"/>`;
    else if (i % 2) s += `<rect x="${-w / 2 + 12}" y="${y}" width="${w - 24}" height="${lh - 6}" rx="14" fill="#00000010"/>`;
    s += `<text x="${-w / 2 + 50}" y="${y + 44}" text-anchor="middle" font-family="Anton" font-size="34" fill="${OUT}">${l.pos}</text>
      <text x="${-w / 2 + 96}" y="${y + 44}" font-family="Nunito" font-weight="${nosso ? 900 : 700}" font-size="34" fill="${OUT}">${esc(l.time)}</text>
      <text x="${w / 2 - 150}" y="${y + 44}" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="32" fill="${OUT}">${l.sg > 0 ? '+' : ''}${l.sg}</text>
      <text x="${w / 2 - 60}" y="${y + 44}" text-anchor="middle" font-family="Anton" font-size="36" fill="${OUT}">${l.pts}</text>`;
  });
  return cartao(w, h, s, { bg: CORES.creme });
}

function placarCanto(sm, sv, gm, gv, minuto) {
  return `<g class="ui" transform="translate(40 150)">
    <rect width="360" height="84" rx="18" fill="${CORES.marinho}" stroke="${OUT}" stroke-width="5"/>
    <text x="70" y="58" text-anchor="middle" font-family="Anton" font-size="40" fill="#fff">${esc(sm)}</text>
    <rect x="128" y="10" width="104" height="64" rx="12" fill="#fff"/>
    <text x="180" y="60" text-anchor="middle" font-family="Anton" font-size="48" fill="${OUT}">${gm}:${gv}</text>
    <text x="290" y="58" text-anchor="middle" font-family="Anton" font-size="40" fill="#fff">${esc(sv)}</text>
    <rect x="0" y="92" width="110" height="50" rx="12" fill="${CORES.laranja}" stroke="${OUT}" stroke-width="4"/>
    <text x="55" y="130" text-anchor="middle" font-family="Anton" font-size="34" fill="${OUT}">${minuto}'</text></g>`;
}

// ------------------------------------------------------------ escudos
function sigla(nome) {
  const ign = new Set(['do', 'da', 'de', 'dos', 'das', 'fc', 'ec']);
  const p = nome.split(/[\s-]+/).filter(w => !ign.has(w.toLowerCase()));
  return (p.length >= 3 ? p.slice(0, 3).map(w => w[0]).join('') : p.length === 2 ? p[0][0] + p[1].slice(0, 2) : p[0].slice(0, 3)).toUpperCase();
}
function coresTime(nome) {
  // sem vinho/vermelho: são as cores do Poeira
  const pal = [['#1d3557', '#fdf0d5'], ['#2a9d8f', '#e9c46a'], ['#6a4c93', '#f1faee'], ['#264653', '#f4a261'],
    ['#f77f00', '#264653'], ['#3a86ff', '#ffbe0b'], ['#588157', '#dad7cd'], ['#000000', '#ffffff'], ['#023047', '#8ecae6']];
  const r = rng(nome); return pal[Math.floor(r() * pal.length)];
}
function escudo(nome, { nosso = false, sg: siglaFixa = null } = {}) {
  const [c1, c2] = nosso ? [CORES.vinho, CORES.amarelo] : coresTime(nome);
  const sg = siglaFixa || sigla(nome);
  return `<path d="M-120,-150 H120 V-20 C120,90 40,140 0,165 C-40,140 -120,90 -120,-20 Z" fill="${OUT}" transform="translate(8 10)"/>
    <path d="M-120,-150 H120 V-20 C120,90 40,140 0,165 C-40,140 -120,90 -120,-20 Z" fill="${c1}" stroke="${OUT}" stroke-width="9"/>
    <path d="M-90,-120 H90 V-30 C90,60 30,100 0,122 C-30,100 -90,60 -90,-30 Z" fill="none" stroke="${c2}" stroke-width="10"/>
    <text y="10" text-anchor="middle" font-family="Anton" font-size="${sg.length > 3 ? 64 : 82}" fill="${c2}" stroke="${OUT}" stroke-width="6" paint-order="stroke">${sg}</text>
    ${nosso ? `<circle cy="78" r="26" fill="#fff" stroke="${OUT}" stroke-width="5"/><path d="M-10,68 l10,-7 l10,7 l-4,12 h-12z" fill="${OUT}"/>` : ''}`;
}

// ------------------------------------------------------------ personagens
// p: {pele, cabelo, corCabelo, bigode, barba, oculos, bone, fone, microfone, avental, camisa, listra,
//     calcao, meiao, numero, larg, alt, luvas, expr, pose, idade}
function pessoa(p, t = 0, { x = 0, y = 0, s = 1, espelho = false, fase = 0 } = {}) {
  const lf = p.larg || 1, hf = p.alt || 1;
  const R = 62, perna = 68 * hf, tronco = 96 * hf, tw = 86 * lf;
  const quadril = -perna, topoCalcao = quadril - 26, topo = topoCalcao - tronco + 14;
  const cab = topo - R + 10;
  const bob = Math.sin(t * 3.2 + fase) * 4;
  const piscando = ((t + fase * 0.7) % 3.4) < 0.12;
  const pele = p.pele || '#d9a066';
  const pose = p.pose || 'normal';
  let s1 = '';

  // pernas e chuteiras
  const pe = (dx, ang = 0) => `
    <line x1="${dx}" y1="${quadril - 6}" x2="${dx + ang}" y2="-10" stroke="${OUT}" stroke-width="30" stroke-linecap="round"/>
    <line x1="${dx}" y1="${quadril - 6}" x2="${dx + ang}" y2="-10" stroke="${pele}" stroke-width="18" stroke-linecap="round"/>
    <line x1="${dx + ang * 0.6}" y1="-38" x2="${dx + ang}" y2="-12" stroke="${OUT}" stroke-width="30" stroke-linecap="round"/>
    <line x1="${dx + ang * 0.6}" y1="-38" x2="${dx + ang}" y2="-12" stroke="${p.meiao || '#fff'}" stroke-width="18" stroke-linecap="round"/>
    <ellipse cx="${dx + ang + (dx < 0 ? -6 : 6)}" cy="-4" rx="24" ry="13" fill="${p.chinelo ? '#3a86ff' : '#222'}" stroke="${OUT}" stroke-width="5"/>`;
  const chute = pose === 'chute';
  s1 += pe(-tw * 0.22, chute ? -10 : 0) + pe(tw * 0.22, chute ? 46 : 0);

  // calção
  s1 += `<path d="M${-tw / 2 + 4},${topoCalcao} H${tw / 2 - 4} L${tw / 2 + 2},${quadril + 10} H6 L0,${quadril - 4} L-6,${quadril + 10} H${-tw / 2 - 2} Z"
    fill="${p.calcao || '#1d3557'}" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>`;

  // braços (atrás do tronco quando "normal")
  const ombroY = topo + 26, ox = tw / 2 - 6;
  const braco = (lado, mx, my) => {
    const sx = lado * ox;
    return `<path d="M${sx},${ombroY} Q${sx + lado * 18},${(ombroY + my) / 2} ${mx},${my}" fill="none" stroke="${OUT}" stroke-width="30" stroke-linecap="round"/>
      <path d="M${sx},${ombroY} Q${sx + lado * 18},${(ombroY + my) / 2} ${mx},${my}" fill="none" stroke="${pele}" stroke-width="18" stroke-linecap="round"/>
      <circle cx="${mx}" cy="${my}" r="${p.luvas ? 20 : 14}" fill="${p.luvas ? '#f1c40f' : pele}" stroke="${OUT}" stroke-width="5"/>`;
  };
  const aceno = Math.sin(t * 9) * 16;
  const maos = {
    normal: [[-ox - 22, topo + tronco - 16], [ox + 22, topo + tronco - 16]],
    comemora: [[-ox - 50, topo - 70 + aceno * 0.3], [ox + 50, topo - 70 - aceno * 0.3]],
    acena: [[-ox - 22, topo + tronco - 16], [ox + 56 + aceno, topo - 60]],
    aponta: [[-ox - 22, topo + tronco - 16], [ox + 105, topo + 18]],
    microfone: [[-ox - 22, topo + tronco - 16], [ox - 6, topo - 4]],
    chute: [[-ox - 60, topo + 10], [ox + 50, topo + 30]],
    caixa: [[-ox + 4, topo + 66], [ox - 4, topo + 66]],
  }[pose] || [[-ox - 22, topo + tronco - 16], [ox + 22, topo + tronco - 16]];
  s1 += braco(-1, ...maos[0]);
  s1 += braco(1, ...maos[1]);

  // tronco / camisa
  s1 += `<rect x="${-tw / 2}" y="${topo}" width="${tw}" height="${tronco}" rx="${28 * lf}" fill="${p.camisa || '#e63946'}" stroke="${OUT}" stroke-width="6"/>`;
  if (p.listra) s1 += `<rect x="${-tw / 2 + 3}" y="${topo + tronco * 0.38}" width="${tw - 6}" height="${tronco * 0.2}" fill="${p.listra}"/>`;
  if (p.avental) s1 += `<path d="M${-tw * 0.34},${topo + 14} H${tw * 0.34} V${topo + tronco + 22} Q0,${topo + tronco + 34} ${-tw * 0.34},${topo + tronco + 22} Z" fill="${p.avental}" stroke="${OUT}" stroke-width="5"/>
      <text y="${topo + tronco * 0.62}" text-anchor="middle" font-family="Anton" font-size="26" fill="${OUT}">${esc(p.aventalTxt || '')}</text>`;
  if (p.numero) s1 += `<text y="${topo + tronco * 0.66}" text-anchor="middle" font-family="Anton" font-size="${44 * Math.min(lf, 1.3)}" fill="#fff" stroke="${OUT}" stroke-width="5" paint-order="stroke">${p.numero}</text>`;
  if (p.barriga) s1 += `<path d="M${-tw * 0.42},${topo + tronco * 0.5} Q0,${topo + tronco + 6} ${tw * 0.42},${topo + tronco * 0.5}" fill="none" stroke="${OUT}" stroke-width="4" opacity=".4"/>`;

  // microfone de rádio
  if (p.microfone) {
    const [mx, my] = maos[1];
    s1 += `<g transform="translate(${mx} ${my}) rotate(-25)"><rect x="-9" y="-12" width="18" height="60" rx="8" fill="#444" stroke="${OUT}" stroke-width="5"/>
      <circle cy="-26" r="24" fill="#9aa5b1" stroke="${OUT}" stroke-width="6"/><path d="M-16,-30 h32 M-16,-20 h32" stroke="${OUT}" stroke-width="3"/>
      <rect x="-20" y="10" width="40" height="22" rx="4" fill="${CORES.laranja}" stroke="${OUT}" stroke-width="4"/>
      <text y="27" text-anchor="middle" font-family="Anton" font-size="15" fill="${OUT}">RÁDIO</text></g>`;
    s1 += braco(1, ...maos[1]).split('<circle')[0];
  }

  // cabeça
  const hy = cab + bob * 0.3;
  let c = `<circle cx="${-R + 4}" cy="${hy + 8}" r="15" fill="${pele}" stroke="${OUT}" stroke-width="5"/>
    <circle cx="${R - 4}" cy="${hy + 8}" r="15" fill="${pele}" stroke="${OUT}" stroke-width="5"/>
    <circle class="rosto" cx="0" cy="${hy}" r="${R}" fill="${pele}" stroke="${OUT}" stroke-width="6"/>`;
  const cc = p.corCabelo || '#2b1d14';
  const cabelos = {
    curto: `<path d="M${-R + 2},${hy - 4} C${-R + 4},${hy - R - 22} ${R - 4},${hy - R - 22} ${R - 2},${hy - 4} C${R * 0.5},${hy - R * 0.55} ${-R * 0.3},${hy - R * 0.75} ${-R + 2},${hy - 4} Z" fill="${cc}" stroke="${OUT}" stroke-width="5"/>`,
    cacheado: Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1.05 + i * 0.112); return `<circle cx="${Math.cos(a) * R * 0.92}" cy="${hy + Math.sin(a) * R * 0.92}" r="22" fill="${cc}" stroke="${OUT}" stroke-width="4"/>`; }).join(''),
    black: `<ellipse cx="0" cy="${hy - 30}" rx="${R + 18}" ry="${R * 0.78}" fill="${cc}" stroke="${OUT}" stroke-width="5"/>`,
    raspado: `<path d="M${-R + 4},${hy - 10} A${R - 4},${R - 4} 0 0 1 ${R - 4},${hy - 10} Q0,${hy - R * 0.6} ${-R + 4},${hy - 10}Z" fill="${cc}" opacity=".85"/>`,
    careca: `<ellipse cx="-18" cy="${hy - R * 0.62}" rx="16" ry="8" fill="#fff" opacity=".5"/>`,
    grisalho: `<path d="M${-R + 2},${hy + 4} Q${-R - 6},${hy - 36} ${-R * 0.45},${hy - R * 0.72}" stroke="${cc}" stroke-width="18" fill="none" stroke-linecap="round"/>
      <path d="M${R - 2},${hy + 4} Q${R + 6},${hy - 36} ${R * 0.45},${hy - R * 0.72}" stroke="${cc}" stroke-width="18" fill="none" stroke-linecap="round"/>
      <ellipse cx="-14" cy="${hy - R * 0.66}" rx="14" ry="7" fill="#fff" opacity=".5"/>`,
    coque: `<circle cx="0" cy="${hy - R - 18}" r="30" fill="${cc}" stroke="${OUT}" stroke-width="5"/>` +
      Array.from({ length: 7 }, (_, i) => { const a = Math.PI * (1.08 + i * 0.14); return `<circle cx="${Math.cos(a) * R * 0.9}" cy="${hy + Math.sin(a) * R * 0.9}" r="20" fill="${cc}" stroke="${OUT}" stroke-width="4"/>`; }).join(''),
  };
  c += cabelos[p.cabelo || 'curto'] || '';

  // rosto
  const ex = R * 0.36, ey = hy + 2;
  const ry = piscando ? 2 : 17;
  const olhar = Math.sin(t * 0.9 + fase) * 3;
  c += `<ellipse cx="${-ex}" cy="${ey}" rx="15" ry="${ry}" fill="#fff" stroke="${OUT}" stroke-width="4"/>
    <ellipse cx="${ex}" cy="${ey}" rx="15" ry="${ry}" fill="#fff" stroke="${OUT}" stroke-width="4"/>`;
  if (!piscando) c += `<circle cx="${-ex + 2 + olhar}" cy="${ey + 3}" r="8" fill="${OUT}"/><circle cx="${ex + 2 + olhar}" cy="${ey + 3}" r="8" fill="${OUT}"/>
    <circle cx="${-ex + 5 + olhar}" cy="${ey}" r="3" fill="#fff"/><circle cx="${ex + 5 + olhar}" cy="${ey}" r="3" fill="#fff"/>`;
  const expr = p.expr || 'feliz';
  const sob = { feliz: -6, serio: 4, bravo: 10, surpreso: -14, triste: -2 }[expr] || 0;
  c += `<path d="M${-ex - 16},${ey - 26 + (expr === 'triste' ? 6 : 0)} L${-ex + 14},${ey - 26 - sob * 0.4}" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>
    <path d="M${ex + 16},${ey - 26 + (expr === 'triste' ? 6 : 0)} L${ex - 14},${ey - 26 - sob * 0.4}" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>
    <path d="M-6,${hy + 16} q8,10 14,0" stroke="${OUT}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="${-R * 0.6}" cy="${hy + 26}" r="11" fill="#ff6b6b" opacity=".3"/><circle cx="${R * 0.6}" cy="${hy + 26}" r="11" fill="#ff6b6b" opacity=".3"/>`;
  const my = hy + 36;
  const bocas = {
    feliz: `<path d="M-22,${my} Q0,${my + 30} 22,${my} Z" fill="#7a1f2b" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>`,
    serio: `<path d="M-16,${my + 6} H16" stroke="${OUT}" stroke-width="6" stroke-linecap="round"/>`,
    bravo: `<path d="M-18,${my + 10} Q0,${my - 2} 18,${my + 10}" stroke="${OUT}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    surpreso: `<ellipse cx="0" cy="${my + 6}" rx="12" ry="15" fill="#7a1f2b" stroke="${OUT}" stroke-width="5"/>`,
    triste: `<path d="M-16,${my + 12} Q0,${my} 16,${my + 12}" stroke="${OUT}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  };
  c += bocas[expr] || bocas.feliz;
  if (p.bigode) c += `<path d="M-30,${my - 2} Q-16,${my - 16} 0,${my - 6} Q16,${my - 16} 30,${my - 2} Q16,${my + 4} 0,${my - 2} Q-16,${my + 4} -30,${my - 2}Z" fill="${p.corBigode || cc}" stroke="${OUT}" stroke-width="4"/>`;
  if (p.barba) c += `<path d="M${-R + 8},${hy + 14} Q${-R + 10},${hy + R + 14} 0,${hy + R + 10} Q${R - 10},${hy + R + 14} ${R - 8},${hy + 14} Q${R * 0.5},${hy + R * 0.85} 0,${hy + R * 0.75} Q${-R * 0.5},${hy + R * 0.85} ${-R + 8},${hy + 14}Z" fill="${cc}" opacity=".9"/>`;
  if (p.idade) c += `<path d="M${-ex - 28},${ey + 4} q-6,8 0,14 M${ex + 28},${ey + 4} q6,8 0,14" stroke="${OUT}" stroke-width="3" fill="none" opacity=".6"/>`;
  if (p.oculos) c += `<circle cx="${-ex}" cy="${ey}" r="24" fill="#ffffff22" stroke="${OUT}" stroke-width="6"/><circle cx="${ex}" cy="${ey}" r="24" fill="#ffffff22" stroke="${OUT}" stroke-width="6"/><path d="M${-ex + 24},${ey} H${ex - 24}" stroke="${OUT}" stroke-width="6"/>`;
  if (p.bone) c += `<path d="M${-R - 2},${hy - 14} A${R + 2},${R + 2} 0 0 1 ${R + 2},${hy - 14} Z" fill="${p.bone}" stroke="${OUT}" stroke-width="6"/>
    <path d="M${R - 6},${hy - 16} Q${R + 52},${hy - 22} ${R + 58},${hy - 6} Q${R + 20},${hy - 2} ${R - 6},${hy - 6}Z" fill="${p.bone}" stroke="${OUT}" stroke-width="6"/>
    ${p.boneTxt ? `<text x="-4" y="${hy - 30}" text-anchor="middle" font-family="Anton" font-size="24" fill="#fff">${esc(p.boneTxt)}</text>` : ''}`;
  if (p.fone) c += `<path d="M${-R - 4},${hy} A${R + 6},${R + 10} 0 0 1 ${R + 4},${hy}" stroke="#333" stroke-width="12" fill="none"/>
    <rect x="${-R - 22}" y="${hy - 20}" width="26" height="46" rx="10" fill="#e63946" stroke="${OUT}" stroke-width="5"/>
    <rect x="${R - 4}" y="${hy - 20}" width="26" height="46" rx="10" fill="#e63946" stroke="${OUT}" stroke-width="5"/>`;
  if (p.brinco) c += `<circle cx="${-R + 2}" cy="${hy + 30}" r="7" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="3"/><circle cx="${R - 2}" cy="${hy + 30}" r="7" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="3"/>`;

  const sombra = `<ellipse cx="0" cy="0" rx="${tw * 0.85}" ry="16" fill="#000" opacity=".22"/>`;
  return `<g transform="translate(${x} ${y}) scale(${espelho ? -s : s} ${s})">${sombra}<g transform="translate(0 ${bob})">${s1}${c}</g></g>`;
}

// ---- elenco e personagens fixos
const PELES = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#6b4226', '#d9a066', '#a0673e'];
const CAMISAS_SORTIDAS = ['#e63946', '#3a86ff', '#ffbe0b', '#8338ec', '#06d6a0', '#ff006e', '#fb5607', '#adb5bd', '#2a9d8f', '#f4a261', '#ffffff'];

const PERSONAGENS = {
  narrador: { pele: '#d9a066', cabelo: 'curto', corCabelo: '#3b2a1e', bigode: true, bone: '#e63946', boneTxt: 'TIÃO', fone: true,
    microfone: true, camisa: '#ffd166', listra: '#f4a261', calcao: '#495057', meiao: '#fff', pose: 'microfone', larg: 1.15, barriga: true },
  presidente: { pele: '#8d5524', cabelo: 'coque', corCabelo: '#5a5a5a', oculos: true, brinco: true, camisa: '#e76f51',
    avental: '#fff4dc', aventalTxt: 'CIDA', calcao: '#6d597a', meiao: '#e76f51', chinelo: true, expr: 'serio', larg: 1.1, alt: 0.95, idade: true },
};

const JOGADORES = {
  '1': { pele: '#e0ac69', cabelo: 'raspado', alt: 0.78, luvas: true, camisa: '#06d6a0', expr: 'surpreso' },
  '2': { pele: '#c68642', cabelo: 'curto', bone: '#ff006e', camisa: '#3a86ff' },
  '3': { pele: '#8d5524', cabelo: 'careca', larg: 1.3, camisa: '#adb5bd', expr: 'bravo', bigode: true },
  '4': { pele: '#f1c27d', cabelo: 'grisalho', corCabelo: '#d0d0d0', oculos: true, idade: true, camisa: '#ffffff', expr: 'serio' },
  '5': { pele: '#a0673e', cabelo: 'curto', corCabelo: '#111', barba: true, camisa: '#ffbe0b' },
  '6': { pele: '#6b4226', cabelo: 'black', corCabelo: '#1b1b1b', camisa: '#e63946', alt: 0.92 },
  '7': { pele: '#c68642', cabelo: 'raspado', corCabelo: '#f4d35e', camisa: '#8338ec', larg: 0.85, alt: 1.08 },
  '8': { pele: '#8d5524', cabelo: 'cacheado', corCabelo: '#1b1b1b', camisa: '#2a9d8f', alt: 0.9, expr: 'feliz' },
  '9': { pele: '#e0ac69', cabelo: 'curto', corCabelo: '#4a3426', larg: 1.75, barriga: true, camisa: '#fb5607', bigode: true },
  '10': { pele: '#d9a066', cabelo: 'grisalho', corCabelo: '#555', barba: true, idade: true, camisa: '#f4a261', larg: 1.1 },
  '11': { pele: '#f1c27d', cabelo: 'cacheado', corCabelo: '#7a4b2a', camisa: '#ff006e', expr: 'serio' },
};

function jogador(numero, estado, extra = {}) {
  const base = JOGADORES[numero] || (() => {
    const r = rng('jog' + numero);
    return { pele: PELES[Math.floor(r() * PELES.length)], cabelo: ['curto', 'raspado', 'cacheado', 'black'][Math.floor(r() * 4)],
      corCabelo: '#1b1b1b', camisa: CAMISAS_SORTIDAS[Math.floor(r() * CAMISAS_SORTIDAS.length)],
      luvas: (estado.elenco[numero] || {}).posicao === 'GOL', bigode: r() > 0.7 };
  })();
  const uniforme = estado.estrutura.uniforme === 'novo';
  return { ...base, numero, ...(uniforme ? { camisa: CORES.vinho, listra: CORES.amarelo, calcao: '#fff', meiao: CORES.vinho } : {}),
    ...(base.luvas && uniforme ? { camisa: '#06d6a0', listra: null } : {}), ...extra };
}

// ------------------------------------------------------------ cenários
function ceu(t) {
  const nuvens = [[180, 150, 1], [700, 90, 0.8], [980, 230, 1.1]].map(([x, y, s], i) =>
    `<g transform="translate(${(x + t * 8 * (i + 1)) % 1300 - 110} ${y}) scale(${s})" opacity=".95">
      <ellipse cx="0" cy="0" rx="90" ry="38" fill="#fff"/><ellipse cx="-50" cy="12" rx="60" ry="30" fill="#fff"/><ellipse cx="55" cy="10" rx="65" ry="30" fill="#fff"/></g>`).join('');
  return `<defs><linearGradient id="gceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CORES.ceu1}"/><stop offset="1" stop-color="${CORES.ceu2}"/></linearGradient>
    <linearGradient id="gterra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CORES.terra2}"/><stop offset="1" stop-color="${CORES.terra1}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#gceu)"/>${nuvens}`;
}

// morro com casinhas e caixas d'água: o "bairro" atrás do campo
function bairro(yBase = 780) {
  const r = rng('bairro');
  let s = `<path d="M-50,${yBase} C150,${yBase - 380} 420,${yBase - 470} 640,${yBase - 380} C820,${yBase - 300} 1000,${yBase - 360} 1130,${yBase - 280} V${yBase + 40} H-50Z" fill="#7fb069" stroke="${OUT}" stroke-width="5"/>`;
  const cores = ['#f4a259', '#f7d488', '#e76f51', '#90be6d', '#f1faee', '#a8dadc', '#e9c46a', '#d4a373', '#cdb4db', '#ffafcc'];
  const casas = [];
  for (let fila = 0; fila < 6; fila++) {
    const y = yBase - 40 - fila * 62;
    for (let x = -30 + (fila % 2) * 40; x < 1110; x += 70 + r() * 50) {
      const cume = yBase - 380 + Math.abs(x - 560) * 0.32 - (x > 820 ? 60 : 0);
      if (y - 60 < cume) continue;
      const w = 60 + r() * 55, h = 55 + r() * 40;
      casas.push([x, y, w, h, cores[Math.floor(r() * cores.length)], r() > 0.55, r()]);
    }
  }
  casas.sort((a, b) => a[1] - b[1]);
  window._lajes = casas.map(([x, y, w, h]) => [x, y - h, w]);
  for (const [x, y, w, h, cor, caixa, q] of casas) {
    s += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${cor}" stroke="${OUT}" stroke-width="4"/>
      <rect x="${x + w * 0.2}" y="${y - h * 0.7}" width="${w * 0.22}" height="${h * 0.28}" fill="#264653" stroke="${OUT}" stroke-width="3"/>
      ${w > 80 ? `<rect x="${x + w * 0.58}" y="${y - h * 0.7}" width="${w * 0.22}" height="${h * 0.28}" fill="#264653" stroke="${OUT}" stroke-width="3"/>` : ''}
      ${q > 0.6 ? `<rect x="${x - 2}" y="${y - h - 8}" width="${w + 4}" height="8" fill="#bcb8b1" stroke="${OUT}" stroke-width="3"/>` : ''}
      ${caixa ? `<rect x="${x + w * 0.6}" y="${y - h - 26}" width="26" height="22" fill="#3a86ff" stroke="${OUT}" stroke-width="3"/>` : ''}`;
  }
  // árvores na frente do morro
  for (let x = -40; x < 1120; x += 70) {
    const rr = 40 + r() * 26;
    s += `<circle cx="${x}" cy="${yBase - 10 + r() * 10}" r="${rr}" fill="${r() > 0.5 ? '#3a7d44' : '#4f9d55'}" stroke="${OUT}" stroke-width="4"/>`;
  }
  return s;
}

function muro(y, nome) {
  return `<rect x="-10" y="${y}" width="${W + 20}" height="90" fill="#e9e1d1" stroke="${OUT}" stroke-width="5"/>
    <path d="M60,${y + 18} q40,-12 90,0 t90,0" stroke="#e76f51" stroke-width="10" fill="none" opacity=".7"/>
    <path d="M820,${y + 70} q40,-14 90,0 t90,0" stroke="#3a86ff" stroke-width="10" fill="none" opacity=".7"/>
    <text class="rotulo" x="265" y="${y + 62}" text-anchor="middle" font-family="Anton" font-size="${Math.min(46, 270 / Math.max(1, medir(nome.toUpperCase(), 1)))}" fill="${CORES.vinho}" opacity=".9">${esc(nome.toUpperCase())}</text>
    <text class="rotulo" x="835" y="${y + 64}" text-anchor="middle" font-family="Anton" font-size="52" fill="${CORES.vinho}" opacity=".85" letter-spacing="6">${esc(window._sigla || '')}</text>`;
}

function torcedores(n, y0, y1, seed = 'torcida') {
  const r = rng(seed);
  let s = '';
  const fileiras = Math.max(1, Math.round((y1 - y0) / 42));
  const porFila = Math.ceil(n / fileiras);
  let k = 0;
  for (let f = 0; f < fileiras && k < n; f++) {
    const y = y0 + f * 42;
    for (let i = 0; i < porFila && k < n; i++, k++) {
      const x = 30 + (i + (f % 2) * 0.5) * ((W - 60) / porFila) + (r() - 0.5) * 8;
      const camisa = r() > 0.4 ? CORES.vinho : CAMISAS_SORTIDAS[Math.floor(r() * CAMISAS_SORTIDAS.length)];
      s += `<rect x="${x - 14}" y="${y + 6}" width="28" height="34" rx="10" fill="${camisa}" stroke="${OUT}" stroke-width="3"/>
        <circle cx="${x}" cy="${y}" r="13" fill="${PELES[Math.floor(r() * PELES.length)]}" stroke="${OUT}" stroke-width="3"/>`;
    }
  }
  return s;
}

function arquibancada(estrutura, torcida, y = 850, t = 0) {
  const cap = estrutura.capacidade || 500;
  const ocup = clamp(torcida / cap);
  const grande = cap > 500;
  let s = '';
  const altura = grande ? 200 : 90;
  if (grande) {
    for (let i = 0; i < 4; i++) s += `<rect x="-10" y="${y - altura + i * 50}" width="${W + 20}" height="14" fill="#b08968" stroke="${OUT}" stroke-width="4"/>`;
    s += `<rect x="-10" y="${y - altura}" width="${W + 20}" height="${altura}" fill="#00000010"/>`;
  } else {
    s += `<rect x="80" y="${y - 20}" width="380" height="18" fill="#b08968" stroke="${OUT}" stroke-width="4"/><rect x="110" y="${y - 2}" width="12" height="30" fill="#7f5539"/><rect x="420" y="${y - 2}" width="12" height="30" fill="#7f5539"/>
      <rect x="620" y="${y - 20}" width="380" height="18" fill="#b08968" stroke="${OUT}" stroke-width="4"/><rect x="650" y="${y - 2}" width="12" height="30" fill="#7f5539"/><rect x="960" y="${y - 2}" width="12" height="30" fill="#7f5539"/>`;
  }
  const slots = grande ? 260 : 60;
  const n = Math.round(slots * ocup);
  if (n) s += `<g transform="translate(0 ${Math.sin(t * 6) * 2})">${torcedores(n, y - altura - 10, y - 30, 'arq' + cap)}</g>`;
  // gente de fora (lotado)
  if (torcida > cap) s += `<g opacity=".9">${torcedores(Math.min(80, Math.round(30 + Math.log10(torcida) * 8)), y - altura - 140, y - altura - 60, 'fora')}</g>`;
  return s;
}

function trave(x, y, s = 1, torta = true, rede = false) {
  const malha = rede ? Array.from({ length: 13 }, (_, i) => `<path d="M${-150 + i * 25},-110 V0" stroke="#fff" stroke-width="2" opacity=".75"/>`).join('')
    + Array.from({ length: 5 }, (_, i) => `<path d="M-150,${-110 + i * 22} H150" stroke="#fff" stroke-width="2" opacity=".75"/>`).join('') : '';
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${torta ? -3 : 0})">
    <rect x="-150" y="-110" width="300" height="110" fill="#ffffff22"/>${malha}
    <path d="M-150,0 V-110 H150 V0" fill="none" stroke="#fff" stroke-width="12" stroke-linejoin="round"/>
    <path d="M-150,0 V-110 H150 V0" fill="none" stroke="${OUT}" stroke-width="3"/></g>`;
}

function bancoReservas(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-80" y="-34" width="160" height="16" rx="4" fill="#b08968" stroke="${OUT}" stroke-width="5"/>
    <rect x="-80" y="-62" width="160" height="12" rx="4" fill="#9c6644" stroke="${OUT}" stroke-width="4"/>
    <path d="M-66,-18 v26 M66,-18 v26 M-70,-50 v32 M70,-50 v32" stroke="${OUT}" stroke-width="7"/></g>`;
}

// Vista da linha lateral: o campo à direita da linha branca, a área de fora à esquerda,
// com o banco de reservas (e um isopor) do lado de fora.
function lateral(estrutura, { t = 0, nome = '', torcida = 0 } = {}) {
  const grama = estrutura.gramado === 'grama';
  let s = ceu(t) + bairro(760) + arquibancada(estrutura, torcida, 860, t) + muro(860, nome);
  s += `<rect x="-10" y="950" width="${W + 20}" height="${H - 950}" fill="#d9b382"/>`;            // área de fora
  const r = rng('lateral');
  for (let i = 0; i < 14; i++) s += `<ellipse cx="${r() * 520}" cy="${1000 + r() * 880}" rx="${8 + r() * 18}" ry="${3 + r() * 5}" fill="#a47148" opacity=".45"/>`;
  s += `<path d="M560,950 L1090,950 L1090,1930 L860,1930Z" fill="${grama ? CORES.grama1 : CORES.terra1}" stroke="${OUT}" stroke-width="4"/>`; // campo
  s += `<path d="M560,950 L860,1930" stroke="#fff" stroke-width="16" opacity=".9"/>`;                  // linha lateral
  s += `<g transform="translate(330 1560) scale(1.9)">${bancoReservasFrente()}</g>`;
  s += `<g transform="translate(110 1640)"><rect x="-55" y="-60" width="110" height="70" rx="10" fill="#3a86ff" stroke="${OUT}" stroke-width="6"/>
    <rect x="-60" y="-74" width="120" height="20" rx="8" fill="#fff" stroke="${OUT}" stroke-width="5"/></g>`;                   // isopor
  return s;
}

function bancoReservasFrente() {
  return `<rect x="-120" y="-40" width="240" height="22" rx="6" fill="#b08968" stroke="${OUT}" stroke-width="5"/>
    <rect x="-120" y="-84" width="240" height="18" rx="6" fill="#9c6644" stroke="${OUT}" stroke-width="5"/>
    <path d="M-100,-18 v40 M100,-18 v40 M-106,-66 v48 M106,-66 v48" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/>`;
}

function campo(estrutura, { t = 0, torcida = 0, nome = '', camera = 1 } = {}) {
  const grama = estrutura.gramado === 'grama';
  let s = ceu(t) + bairro(760) + arquibancada(estrutura, torcida, 860, t) + muro(860, nome);
  s += `<path d="M-200,950 H1280 L1500,${H} H-420Z" fill="${grama ? CORES.grama1 : 'url(#gterra)'}" stroke="${OUT}" stroke-width="5"/>`;
  if (grama) for (let i = 0; i < 8; i++) s += `<path d="M${-200 + i * 185},950 h92 l${120 + i * 4},${H - 950} h-150z" fill="${CORES.grama2}" opacity=".8"/>`;
  else {
    const r = rng('pedras');
    for (let i = 0; i < 26; i++) s += `<ellipse cx="${r() * W}" cy="${980 + r() * 900}" rx="${10 + r() * 30}" ry="${4 + r() * 8}" fill="#8b4a22" opacity=".45"/>`;
    s += `<ellipse cx="260" cy="1500" rx="110" ry="26" fill="#7a9cc6" opacity=".55"/><ellipse cx="820" cy="1180" rx="70" ry="16" fill="#7a9cc6" opacity=".5"/>`;
  }
  const linha = grama ? '#ffffffcc' : '#ffffff66';
  s += `<path d="M-100,1260 H1180" stroke="${linha}" stroke-width="8"/>
    <ellipse cx="${W / 2}" cy="1260" rx="240" ry="70" fill="none" stroke="${linha}" stroke-width="8"/>
    <path d="M330,950 L300,1060 H780 L750,950" fill="none" stroke="${linha}" stroke-width="7"/>`;
  s += trave(W / 2, 955, 0.8, !grama, !!estrutura.rede);
  // o banco de reservas aparece na imagem própria da lateral (lateral()), não aqui
  if (estrutura.iluminacao) for (const x of [70, 1010]) s += `<rect x="${x - 8}" y="430" width="16" height="430" fill="#6c757d" stroke="${OUT}" stroke-width="4"/>
    <rect x="${x - 60}" y="400" width="120" height="60" rx="8" fill="#ffe066" stroke="${OUT}" stroke-width="5"/>`;
  return s;
}

// dy > 0 "abaixa a câmera": o bar vai para a parte de baixo e libera o céu para os cartões
function sede(estrutura, { t = 0, dy = 0 } = {}) {
  const novo = estrutura.telhado;
  let s = '';
  s += bairro(820);
  s += `<rect x="-10" y="820" width="${W + 20}" height="${H - 820}" fill="#cfc2a8"/><rect x="-10" y="1180" width="${W + 20}" height="${H - 1180}" fill="url(#gterra)"/>`;
  // prédio do bar / sede
  s += `<rect x="170" y="640" width="740" height="560" fill="#f2e2c4" stroke="${OUT}" stroke-width="7"/>
    ${[0, 1, 2, 3, 4].map(i => `<rect x="${220 + i * 120}" y="${900 + (i % 2) * 40}" width="60" height="26" fill="#c97a40" stroke="${OUT}" stroke-width="3" opacity=".7"/>`).join('')}`;
  if (novo) s += `<path d="M130,650 L540,500 L950,650Z" fill="#d1495b" stroke="${OUT}" stroke-width="7"/>
    ${[0, 1, 2, 3].map(i => `<path d="M${200 + i * 30},${640 - i * 11} L540,${510 + i * 25}" stroke="#a23b4a" stroke-width="5" opacity=".0"/>`).join('')}
    <path d="M230,615 H850 M330,578 H750 M430,541 H650" stroke="#a23b4a" stroke-width="6"/>`;
  else s += `<path d="M140,660 L940,620 L930,660 L150,680Z" fill="#9aa5b1" stroke="${OUT}" stroke-width="6"/>
    <rect x="420" y="628" width="90" height="34" fill="#6c757d" stroke="${OUT}" stroke-width="4" transform="rotate(-5 465 645)"/>
    <circle cx="700" cy="640" r="10" fill="${OUT}"/><circle cx="300" cy="655" r="8" fill="${OUT}"/>`;
  s += `<g class="rotulo"><rect x="260" y="700" width="560" height="110" rx="14" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="7"/>
    <text x="540" y="785" text-anchor="middle" font-family="Anton" font-size="74" fill="${CORES.vinho}">BAR DA CIDA</text>
    <text x="540" y="860" text-anchor="middle" font-family="Anton" font-size="36" fill="${OUT}" letter-spacing="4">SEDE SOCIAL · ${esc(window._sigla || '')}</text></g>
    <path d="M200,880 H880 L860,940 H220Z" fill="#e63946" stroke="${OUT}" stroke-width="6"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${215 + i * 113},882 h56 l-6,56 h-46z" fill="#fff"/>`).join('')}
    <rect x="460" y="960" width="160" height="240" fill="#6f4518" stroke="${OUT}" stroke-width="6"/>
    <rect x="230" y="980" width="180" height="140" fill="#8ecae6" stroke="${OUT}" stroke-width="6"/><path d="M320,980 V1120 M230,1050 H410" stroke="${OUT}" stroke-width="5"/>
    <rect x="670" y="980" width="180" height="140" fill="#8ecae6" stroke="${OUT}" stroke-width="6"/><path d="M760,980 V1120 M670,1050 H850" stroke="${OUT}" stroke-width="5"/>`;
  // mesas de plástico e engradado
  const mesa = (x, cor) => `<rect x="${x - 70}" y="1250" width="140" height="18" rx="6" fill="${cor}" stroke="${OUT}" stroke-width="5"/>
    <path d="M${x - 55},1268 l-10,70 M${x + 55},1268 l10,70" stroke="${cor}" stroke-width="10"/>`;
  s += mesa(150, '#ffbe0b') + mesa(930, '#e63946') + `<rect x="840" y="1150" width="110" height="70" fill="#e63946" stroke="${OUT}" stroke-width="5"/>
    ${[0, 1, 2].map(i => `<rect x="${852 + i * 32}" y="1132" width="18" height="36" rx="6" fill="#6a994e" stroke="${OUT}" stroke-width="3"/>`).join('')}`;
  if (estrutura.lanchonete) s += lanchonete(estrutura.lanchonete);
  return ceu(t) + (dy ? `<g transform="translate(0 ${dy})">${s}</g><rect x="-10" y="${H}" width="${W + 20}" height="${dy}" fill="url(#gterra)"/>` : s);
}

function lanchonete(nome, x = 44, y = 1010) {
  const txt = nome.length > 22 ? nome.replace('Lanchonete', 'Lanch.') : nome;
  const tam = Math.min(30, 250 / Math.max(1, medir(txt, 1)));   // cabe sempre na placa
  return `<g transform="translate(${x} ${y}) scale(.68)">
    <rect x="0" y="0" width="240" height="220" fill="#d4a373" stroke="${OUT}" stroke-width="6"/>
    <g class="rotulo"><rect x="-20" y="-40" width="280" height="56" rx="10" fill="#fff4dc" stroke="${OUT}" stroke-width="6"/>
    <text x="120" y="${-12 + tam * 0.36}" text-anchor="middle" font-family="Anton" font-size="${tam}" fill="${CORES.vinho}">${esc(txt)}</text></g>
    <rect x="20" y="40" width="200" height="90" fill="#3d2b1f" stroke="${OUT}" stroke-width="5"/>
    <text x="120" y="100" text-anchor="middle" font-size="44">🌭🥤</text>
    <rect x="-10" y="130" width="260" height="22" fill="#e63946" stroke="${OUT}" stroke-width="5"/></g>`;
}

function fundoEscuro() {
  return `<rect width="${W}" height="${H}" fill="${CORES.marinho}"/>
    ${Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 173) % W}" cy="${(i * 311) % H}" r="${80 + (i % 4) * 40}" fill="#ffffff08"/>`).join('')}`;
}

Object.assign(window, { popPessoa, W, H, OUT, CORES, rng, clamp, easeOut, easeOutBack, prog, esc, medir, quebrar, pop, texto, pilula,
  tituloGrande, cartao, painelCaixa, cartaoPerfil, cartaoComentario, cartaoOpcao, iconeOpcao, tabelaCard, placarCanto,
  escudo, sigla, pessoa, PERSONAGENS, jogador, campo, sede, arquibancada, trave, fundoEscuro, lanchonete, torcedores });

// ------------------------------------------------------------ estádio visto de cima (torcida crescendo)
// Mesmas faixas de src/timefc/episodio.py (FAIXAS / bonecos).
const FAIXAS_TORCIDA = [['beira', 60], ['muro', 40], ['arvore', 40], ['laje', 200]];
const bonecos = n => Math.round(3 * Math.sqrt(Math.max(n, 0)));

// geometria do campo em perspectiva
const CAMPO = { yTopo: 760, yBase: 1700, xTopo: [330, 750], xBase: [70, 1010] };
const xBorda = (y, lado) => {
  const k = (y - CAMPO.yTopo) / (CAMPO.yBase - CAMPO.yTopo);
  return lado < 0 ? CAMPO.xTopo[0] + (CAMPO.xBase[0] - CAMPO.xTopo[0]) * k : CAMPO.xTopo[1] + (CAMPO.xBase[1] - CAMPO.xTopo[1]) * k;
};
const escalaY = y => 0.55 + (y - 560) / 1300 * 0.75;

function boneco(x, y, r, { torcendo = false, t = 0, i = 0, zoom = 1 } = {}) {
  const k = escalaY(y) * zoom;
  const pele = PELES[Math.floor(r() * PELES.length)];
  const camisa = r() > 0.35 ? CORES.vinho : CAMISAS_SORTIDAS[Math.floor(r() * CAMISAS_SORTIDAS.length)];
  const pulo = torcendo ? Math.abs(Math.sin(t * 7 + i)) * 6 * k : 0;
  const bracos = torcendo && i % 3 === 0 ? `<path d="M${-11 * k},${-4 * k} l${-7 * k},${-16 * k} M${11 * k},${-4 * k} l${7 * k},${-16 * k}" stroke="${pele}" stroke-width="${6 * k}" stroke-linecap="round"/>` : '';
  return `<g transform="translate(${x.toFixed(1)} ${(y - pulo).toFixed(1)})">${bracos}
    <rect x="${-12 * k}" y="${-6 * k}" width="${24 * k}" height="${26 * k}" rx="${8 * k}" fill="${camisa}" stroke="${OUT}" stroke-width="${2.5 * k}"/>
    <circle cy="${-14 * k}" r="${11 * k}" fill="${pele}" stroke="${OUT}" stroke-width="${2.5 * k}"/></g>`;
}

// posições de assento conforme a capacidade (dois bancos -> arquibancada em volta)
function assentos(cap) {
  const pos = [];
  if (cap <= 500) {  // dois bancos de madeira atrás do gol
    for (const [x0, x1] of [[250, 500], [580, 830]]) for (let i = 0; i < 17; i++) for (const y of [700, 728]) pos.push([x0 + (i + 0.5) * (x1 - x0) / 17, y]);
    return pos;
  }
  const filasFundo = cap > 2000 ? 4 : 2;
  for (let f = 0; f < filasFundo; f++) for (let i = 0; i < 30; i++) pos.push([240 + (i + 0.5) * 600 / 30, 725 - f * 30]);
  for (const lado of [-1, 1]) for (let f = 0; f < (cap > 2000 ? 3 : 2); f++)
    for (let y = 800; y < 1650; y += 46) pos.push([xBorda(y, lado) + lado * (55 + f * 36 * escalaY(y)), y]);
  return pos;
}

function posicoesExtras() {
  const r = rng('extras'), beira = [], muro = [], arvore = [], laje = [];
  for (let y = 820; y < 1680; y += 30) for (const lado of [-1, 1]) beira.push([xBorda(y, lado) + lado * 18, y + r() * 6]);
  for (let x = 20; x < 1060; x += 26) muro.push([x, 618]);
  for (const [cx, cy] of ARVORES_ESTADIO) for (let i = 0; i < 7; i++) { const a = r() * Math.PI * 2, d = r() * 45; arvore.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7]); }
  for (const [x, y, w] of LAJES) for (let i = 0; i < Math.max(1, Math.floor(w / 28)); i++) laje.push([x + 12 + i * 26, y - 2]);
  return { beira, muro, arvore, laje };
}
const ARVORES_ESTADIO = [[70, 560], [190, 600], [890, 600], [1010, 560], [520, 540]];
let LAJES = [];

function estadioAereo(estrutura, torcida, { t = 0, revelar = 1, torcidaAntes = 0, nome = '' } = {}) {
  const cap = estrutura.capacidade || 500;
  const grama = estrutura.gramado === 'grama';
  let s = ceu(t);
  // morro ao fundo (as lajes viram arquibancada quando lota)
  s += `<g transform="translate(0 -230)">${bairro(780)}</g>`;
  LAJES = (window._lajes || []).map(([x, y, w]) => [x, y - 230, w]).filter(([, y]) => y > 150 && y < 540).sort((a, b) => b[1] - a[1]);
  s += `<rect x="-10" y="560" width="${W + 20}" height="${H - 560}" fill="#8a9a5b"/>`;
  s += ARVORES_ESTADIO.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${62 + (i % 2) * 10}" fill="${i % 2 ? '#3a7d44' : '#4f9d55'}" stroke="${OUT}" stroke-width="5"/>`).join('');
  s += `<rect x="-10" y="610" width="${W + 20}" height="34" fill="#e9e1d1" stroke="${OUT}" stroke-width="5"/>
    <text x="${W / 2}" y="638" text-anchor="middle" font-family="Anton" font-size="26" fill="${CORES.vinho}" letter-spacing="6">${esc(nome.toUpperCase())}</text>`;
  // arquibancada
  if (cap <= 500) s += [[250, 500], [580, 830]].map(([a, b]) => `<rect x="${a}" y="712" width="${b - a}" height="12" fill="#b08968" stroke="${OUT}" stroke-width="4"/><rect x="${a}" y="740" width="${b - a}" height="12" fill="#b08968" stroke="${OUT}" stroke-width="4"/>`).join('');
  else {
    s += `<path d="M230,${cap > 2000 ? 620 : 680} H850 L840,750 H240Z" fill="${cap > 2000 ? '#adb5bd' : '#b08968'}" stroke="${OUT}" stroke-width="5"/>`;
    for (const lado of [-1, 1]) s += `<path d="M${xBorda(790, lado) + lado * 30},790 L${xBorda(790, lado) + lado * (cap > 2000 ? 150 : 110)},790 L${xBorda(1680, lado) + lado * (cap > 2000 ? 190 : 140)},1680 L${xBorda(1680, lado) + lado * 30},1680Z" fill="${cap > 2000 ? '#adb5bd' : '#b08968'}" stroke="${OUT}" stroke-width="5"/>`;
  }
  // campo
  const { yTopo, yBase, xTopo, xBase } = CAMPO;
  s += `<path d="M${xTopo[0]},${yTopo} H${xTopo[1]} L${xBase[1]},${yBase} H${xBase[0]}Z" fill="${grama ? CORES.grama1 : CORES.terra1}" stroke="${OUT}" stroke-width="6"/>`;
  if (grama) for (let i = 0; i < 6; i++) { const y0 = yTopo + i * (yBase - yTopo) / 6, y1 = y0 + (yBase - yTopo) / 12; s += `<path d="M${xBorda(y0, -1)},${y0} H${xBorda(y0, 1)} L${xBorda(y1, 1)},${y1} H${xBorda(y1, -1)}Z" fill="${CORES.grama2}"/>`; }
  else { const r = rng('aereo'); for (let i = 0; i < 18; i++) s += `<ellipse cx="${200 + r() * 680}" cy="${800 + r() * 850}" rx="${12 + r() * 26}" ry="${4 + r() * 7}" fill="#8b4a22" opacity=".45"/>`; }
  const lc = grama ? '#ffffffdd' : '#ffffff77', ym = (yTopo + yBase) / 2 + 40;
  s += `<path d="M${xBorda(ym, -1)},${ym} H${xBorda(ym, 1)}" stroke="${lc}" stroke-width="6"/>
    <ellipse cx="${W / 2}" cy="${ym}" rx="150" ry="60" fill="none" stroke="${lc}" stroke-width="6"/>
    <path d="M420,${yTopo} L405,${yTopo + 90} H675 L660,${yTopo}" fill="none" stroke="${lc}" stroke-width="5"/>
    <path d="M300,${yBase} L330,${yBase - 160} H750 L780,${yBase}" fill="none" stroke="${lc}" stroke-width="6"/>
    <path d="M490,${yTopo} V${yTopo - 40} H590 V${yTopo}" fill="none" stroke="#fff" stroke-width="7"/>`;
  if (estrutura.rede) s += Array.from({ length: 6 }, (_, i) => `<path d="M${492 + i * 19},${yTopo - 38} V${yTopo}" stroke="#fff" stroke-width="2" opacity=".8"/>`).join('');
  if (estrutura.banco_reservas) s += `<g transform="translate(${xBorda(1230, 1) + 30} 1230) rotate(66) scale(.55)">${bancoReservas(0, 0)}</g>`;
  // torcida desenhada: assentos primeiro, depois as faixas de "não cabe mais"
  const total = bonecos(Math.min(torcida, 1e7));
  const visiveis = Math.round(bonecos(torcidaAntes) + (total - bonecos(torcidaAntes)) * revelar);
  const seats = assentos(cap), lugares = bonecos(cap);
  const ex = posicoesExtras();
  const ordem = [...seats.slice(0, Math.min(seats.length, lugares)).map(p => [...p, 'arq'])];
  for (const [faixa, tam] of FAIXAS_TORCIDA) ordem.push(...ex[faixa].slice(0, tam).map(p => [...p, faixa]));
  const r = rng('povo');
  const pessoas = ordem.slice(0, visiveis).map((p, i) => ({ x: p[0], y: p[1], i, faixa: p[2], rr: rng('p' + i) }));
  pessoas.sort((a, b) => a.y - b.y);
  s += pessoas.map(p => boneco(p.x, p.y, p.rr, { torcendo: true, t, i: p.i, zoom: { arvore: 1.35, laje: 1.5, muro: 1.15 }[p.faixa] || 1 })).join('');
  return s;
}
Object.assign(window, { estadioAereo, bonecos, FAIXAS_TORCIDA });

// ------------------------------------------------------------ escudo oficial do Poeira FC
// Usado na foto de perfil (video/logo.mjs) e no escudo dentro dos vídeos.
// Centro em (0,0), cabe em ~[-200,200] x [-230,240]. "estrelas" = títulos conquistados.
function bola(r) {
  const pent = (cx, cy, rr, rot = -90) => 'M' + Array.from({ length: 5 }, (_, i) => {
    const a = (rot + i * 72) * Math.PI / 180; return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`; }).join(' L') + 'Z';
  let s = `<circle r="${r}" fill="#fff" stroke="${OUT}" stroke-width="${r * 0.09}"/><path d="${pent(0, 0, r * 0.34)}" fill="${OUT}"/>`;
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 72) * Math.PI / 180, x1 = Math.cos(a) * r * 0.34, y1 = Math.sin(a) * r * 0.34;
    const x2 = Math.cos(a) * r * 0.72, y2 = Math.sin(a) * r * 0.72;
    s += `<path d="M${x1},${y1} L${x2},${y2}" stroke="${OUT}" stroke-width="${r * 0.06}"/>`;
    s += `<path d="${pent(Math.cos(a) * r * 0.93, Math.sin(a) * r * 0.93, r * 0.2, -90 + i * 72 + 180)}" fill="${OUT}"/>`;
  }
  const id = 'cb' + (_idEscudo++);
  return `<g clip-path="url(#${id})">${s}</g><defs><clipPath id="${id}"><circle r="${r}"/></clipPath></defs>
    <circle r="${r}" fill="none" stroke="${OUT}" stroke-width="${r * 0.09}"/>`;
}

let _idEscudo = 0;
function escudoPoeira({ estrelas = 0, nome = 'POEIRA FC' } = {}) {
  const id = 'ep' + (_idEscudo++);
  const vinho = CORES.vinho, ouro = CORES.amarelo, creme = CORES.creme;
  const forma = 'M-190,-200 Q0,-245 190,-200 L190,10 C190,140 90,205 0,245 C-90,205 -190,140 -190,10 Z';
  const interna = 'M-160,-178 Q0,-214 160,-178 L160,8 C160,118 78,174 0,210 C-78,174 -160,118 -160,8 Z';
  // poeira levantando do chão, sempre dentro do escudo
  const poeira = [[-120, 150, 52], [-62, 168, 60], [0, 176, 64], [62, 166, 58], [118, 148, 50], [-150, 112, 34], [150, 108, 32]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e9d5b3" stroke="${OUT}" stroke-width="6"/>`).join('');
  const est = Array.from({ length: estrelas }, (_, i) => {
    const x = (i - (estrelas - 1) / 2) * 46;
    return `<path transform="translate(${x} -268) scale(1.1)" d="M0,-18 L5,-6 L18,-6 L8,2 L12,15 L0,7 L-12,15 L-8,2 L-18,-6 L-5,-6Z" fill="${ouro}" stroke="${OUT}" stroke-width="4"/>`; }).join('');
  const tamNome = Math.min(64, 300 / Math.max(1, medir(nome, 1) + 0.04 * nome.length));
  return `<g><defs><clipPath id="${id}"><path d="${interna}"/></clipPath></defs>
    <path d="${forma}" fill="${OUT}" transform="translate(10 14)"/>
    <path d="${forma}" fill="${vinho}" stroke="${OUT}" stroke-width="12" stroke-linejoin="round"/>
    <g clip-path="url(#${id})">
      <rect x="-200" y="-132" width="400" height="92" fill="${ouro}" stroke="${OUT}" stroke-width="7"/>
      ${poeira}
      <path d="M-150,150 q-20,-10 -40,-4 M150,140 q20,-10 40,-3" stroke="#e9d5b3" stroke-width="10" fill="none" stroke-linecap="round"/>
    </g>
    <path d="${interna}" fill="none" stroke="${ouro}" stroke-width="10"/>
    <text y="${-86 + tamNome * 0.36}" text-anchor="middle" font-family="Anton" font-size="${tamNome}" fill="${vinho}" letter-spacing="4">${esc(nome)}</text>
    <g transform="translate(0 66) rotate(-12)">${bola(78)}</g>
    ${est}</g>`;
}

function cabare(estrutura, { t = 0 } = {}) {
  let s = ceu(t) + bairro(820);
  s += `<rect x="-10" y="820" width="${W + 20}" height="${H - 820}" fill="#cfc2a8"/><rect x="-10" y="1700" width="${W + 20}" height="${H - 1700}" fill="url(#gterra)"/>`;
  const pisca = Math.floor(t * 3) % 2;
  s += `<rect x="230" y="1240" width="620" height="460" fill="#ff8fab" stroke="${OUT}" stroke-width="7"/>
    <path d="M200,1250 L540,1130 L880,1250Z" fill="#9d4edd" stroke="${OUT}" stroke-width="7"/>
    <g class="rotulo"><rect x="330" y="1290" width="420" height="96" rx="16" fill="#3c096c" stroke="${OUT}" stroke-width="6"/>
    <text x="540" y="1362" text-anchor="middle" font-family="Anton" font-size="66" fill="${pisca ? '#ffd6ff' : '#ff4d6d'}" letter-spacing="8">CABARÉ</text></g>
    ${Array.from({ length: 9 }, (_, i) => `<circle cx="${345 + i * 49}" cy="1404" r="9" fill="${(i + pisca) % 2 ? '#ffd166' : '#ff4d6d'}" stroke="${OUT}" stroke-width="3"/>`).join('')}
    <rect x="480" y="1500" width="120" height="200" rx="8" fill="#5a189a" stroke="${OUT}" stroke-width="6"/>
    <rect x="280" y="1450" width="150" height="120" fill="#ffccd5" stroke="${OUT}" stroke-width="6"/><path d="M280,1450 q75,60 150,0" fill="#c9184a" opacity=".85"/>
    <rect x="650" y="1450" width="150" height="120" fill="#ffccd5" stroke="${OUT}" stroke-width="6"/><path d="M650,1450 q75,60 150,0" fill="#c9184a" opacity=".85"/>`;
  return s;
}

function zzz(x, y, t, fase = 0) {
  return [0, 1, 2].map(i => { const k = ((t * 0.8 + fase + i * 0.33) % 1);
    return `<text x="${x + i * 18 + k * 20}" y="${y - k * 70 - i * 22}" font-family="Anton" font-size="${30 + i * 8}" fill="#fff" stroke="${OUT}" stroke-width="5" paint-order="stroke" opacity="${1 - k}">Z</text>`; }).join('');
}

function carimbo(txt, cor = '#e63946', rot = -10, tam = 54) {
  const w = medir(txt, tam) + 50;
  return `<g transform="rotate(${rot})" opacity=".92"><rect x="${-w / 2}" y="${-tam * 0.85}" width="${w}" height="${tam * 1.4}" rx="10" fill="none" stroke="${cor}" stroke-width="9"/>
    <text y="${tam * 0.32}" text-anchor="middle" font-family="Anton" font-size="${tam}" fill="${cor}" letter-spacing="2">${esc(txt)}</text></g>`;
}
Object.assign(window, { escudoPoeira, bola, bancoReservas, cabare, zzz, carimbo, lateral });
