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
    <line class="brilho3d" x1="${dx - 4}" y1="${quadril - 2}" x2="${dx + ang - 4}" y2="-40" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0"/>
    <line x1="${dx + ang * 0.6}" y1="-38" x2="${dx + ang}" y2="-12" stroke="${OUT}" stroke-width="30" stroke-linecap="round"/>
    <line x1="${dx + ang * 0.6}" y1="-38" x2="${dx + ang}" y2="-12" stroke="${p.meiao || '#fff'}" stroke-width="18" stroke-linecap="round"/>
    <ellipse data-v="Esfera" cx="${dx + ang + (dx < 0 ? -6 : 6)}" cy="-4" rx="24" ry="13" fill="${p.chinelo ? '#3a86ff' : '#222'}" stroke="${OUT}" stroke-width="5"/>`;
  const chute = pose === 'chute';
  s1 += p.umaPerna ? pe(2, 0) : pe(-tw * 0.22, chute ? -10 : 0) + pe(tw * 0.22, chute ? 46 : 0);  // o Saci tem uma perna só

  // calção
  s1 += `<path d="M${-tw / 2 + 4},${topoCalcao} H${tw / 2 - 4} L${tw / 2 + 2},${quadril + 10} H6 L0,${quadril - 4} L-6,${quadril + 10} H${-tw / 2 - 2} Z"
    data-v="Vert" fill="${p.calcao || '#1d3557'}" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>`;

  // braços (atrás do tronco quando "normal")
  const ombroY = topo + 26, ox = tw / 2 - 6;
  const braco = (lado, mx, my) => {
    const sx = lado * ox;
    return `<path d="M${sx},${ombroY} Q${sx + lado * 18},${(ombroY + my) / 2} ${mx},${my}" fill="none" stroke="${OUT}" stroke-width="30" stroke-linecap="round"/>
      <path d="M${sx},${ombroY} Q${sx + lado * 18},${(ombroY + my) / 2} ${mx},${my}" fill="none" stroke="${pele}" stroke-width="18" stroke-linecap="round"/>
      <path class="brilho3d" d="M${sx - 4},${ombroY - 2} Q${sx + lado * 18 - 4},${(ombroY + my) / 2 - 2} ${mx - 4},${my - 2}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0"/>
      <circle data-v="Esfera" cx="${mx}" cy="${my}" r="${p.luvas ? 20 : 14}" fill="${p.luvas ? (p.corLuva || '#f1c40f') : pele}" stroke="${OUT}" stroke-width="5"/>`;
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
    aviao: [[-ox - 95, topo + 20], [ox + 95, topo + 20]],
  }[pose] || [[-ox - 22, topo + tronco - 16], [ox + 22, topo + tronco - 16]];
  s1 += braco(-1, ...maos[0]);
  s1 += braco(1, ...maos[1]);

  // tronco / camisa
  s1 += `<rect x="${-tw / 2}" y="${topo}" width="${tw}" height="${tronco}" rx="${28 * lf}" fill="${p.camisa || '#e63946'}" stroke="${OUT}" stroke-width="6"/>`;
  if (p.listra) s1 += `<rect x="${-tw / 2 + 3}" y="${topo + tronco * 0.38}" width="${tw - 6}" height="${tronco * 0.2}" fill="${p.listra}"/>`;
  // uniforme feito pela costureira do bairro: remendos e costura de outra cor (cada um num lugar)
  if (p.remendos) {
    const r = rng('remendo' + (p.numero || ''));
    const px = (r() - 0.5) * tw * 0.5, py = topo + 14 + r() * tronco * 0.18, pw = 18 + r() * 10;
    s1 += `<rect x="${px - pw / 2}" y="${py}" width="${pw}" height="${pw * 0.85}" rx="3" fill="${r() > 0.5 ? '#a8324a' : '#c9a227'}" stroke="${OUT}" stroke-width="2.5" transform="rotate(${(r() - 0.5) * 30} ${px} ${py})"/>
      <path d="M${-tw / 2 + 10},${topo + tronco * 0.82} l${tw * 0.32},${-6}" stroke="#3a86ff" stroke-width="3" stroke-dasharray="5 4"/>`;
  }
  s1 += `<rect class="vol3d" x="${-tw / 2}" y="${topo}" width="${tw}" height="${tronco}" rx="${28 * lf}" fill="url(#g3dCorpo)" opacity="0"/>`;  // volume do tronco (só no estilo 3D)
  if (p.avental) s1 += `<path d="M${-tw * 0.34},${topo + 14} H${tw * 0.34} V${topo + tronco + 22} Q0,${topo + tronco + 34} ${-tw * 0.34},${topo + tronco + 22} Z" fill="${p.avental}" stroke="${OUT}" stroke-width="5"/>
      <text y="${topo + tronco * 0.62}" text-anchor="middle" font-family="Anton" font-size="26" fill="${OUT}">${esc(p.aventalTxt || '')}</text>`;
  if (p.bandeira) {  // bandeirão no mastro, balançando
    const [mx, my] = maos[1], w = Math.sin(t * 5) * 14;
    s1 += `<path d="M${mx},${my + 30} V${my - 230}" stroke="${OUT}" stroke-width="10" stroke-linecap="round"/><path d="M${mx},${my + 30} V${my - 230}" stroke="#b08968" stroke-width="5"/>
      <path d="M${mx},${my - 226} q60,${-14 + w} 130,0 t130,0 v110 q-65,${14 - w} -130,0 t-130,0Z" fill="${p.bandeira}" stroke="${OUT}" stroke-width="5"/>
      <path d="M${mx},${my - 190} q60,${-14 + w} 130,0 t130,0 v34 q-65,${14 - w} -130,0 t-130,0Z" fill="${CORES.amarelo}"/>`;
  }
  if (p.fita) s1 += `<path d="M${-tw * 0.3},${topo + 4} Q0,${topo + 40} ${tw * 0.3},${topo + 4} M${-tw * 0.3},${topo + 4} l-8,${tronco * 0.7} M${tw * 0.3},${topo + 4} l8,${tronco * 0.6}"
      fill="none" stroke="#ffd60a" stroke-width="10" stroke-linecap="round"/><path d="M${-tw * 0.3 - 6},${topo + 30} h10 M${-tw * 0.3 - 6},${topo + 50} h10 M${tw * 0.3 + 2},${topo + 30} h10" stroke="${OUT}" stroke-width="2"/>`;
  if (p.numero) s1 += `<text y="${topo + tronco * 0.66}" text-anchor="middle" font-family="Anton" font-size="${44 * Math.min(lf, 1.3)}" fill="#fff" stroke="${OUT}" stroke-width="5" paint-order="stroke">${p.numero}</text>`;
  // patrocínio: faixa branca logo abaixo do número, sempre dentro da camisa (o texto se ajusta à largura)
  if (p.patrocinio) { const pw = tw * 0.7, py = topo + tronco * 0.71;
    s1 += `<rect x="${-pw / 2}" y="${py}" width="${pw}" height="17" rx="4" fill="#fff" stroke="${OUT}" stroke-width="2.5"/>
    <text y="${py + 13}" text-anchor="middle" font-family="Anton" font-size="12" textLength="${pw - 8}" lengthAdjust="spacingAndGlyphs" fill="${OUT}">${esc(p.patrocinio)}</text>`; }
  if (p.barriga) s1 += `<path d="M${-tw * 0.42},${topo + tronco * 0.5} Q0,${topo + tronco + 6} ${tw * 0.42},${topo + tronco * 0.5}" fill="none" stroke="${OUT}" stroke-width="4" opacity=".4"/>`;

  // pomponetes: pompom em cada mão
  if (p.pompons) for (const [mx, my] of maos) {
    for (let i = 0; i < 9; i++) { const a = i * 0.7; s1 += `<circle cx="${(mx + Math.cos(a) * 16).toFixed(1)}" cy="${(my + Math.sin(a) * 16).toFixed(1)}" r="15" fill="${OUT}"/>`; }
    for (let i = 0; i < 9; i++) { const a = i * 0.7; s1 += `<circle cx="${(mx + Math.cos(a) * 16).toFixed(1)}" cy="${(my + Math.sin(a) * 16).toFixed(1)}" r="11" fill="${i % 2 ? p.pompons : '#fff'}"/>`; }
  }
  // charanga: bumbo/surdo na frente da barriga, pandeiro na mão
  if (p.instrumento === 'bumbo' || p.instrumento === 'surdo') {
    const r = p.instrumento === 'bumbo' ? 50 : 40, cy = topo + tronco * 0.62;
    s1 += `<path d="M${-tw * 0.4},${topo + 8} L${r * 0.6},${cy - r}" stroke="#e63946" stroke-width="7"/>
      <rect x="${-r}" y="${cy - r * 0.8}" width="${r * 2}" height="${r * 1.6}" rx="10" fill="${p.instrumento === 'bumbo' ? CORES.vinho : '#adb5bd'}" stroke="${OUT}" stroke-width="6"/>
      <path d="M${-r},${cy - r * 0.8} l${r * 0.5},${r * 1.6} l${r * 0.5},${-r * 1.6} l${r * 0.5},${r * 1.6} l${r * 0.5},${-r * 1.6}" fill="none" stroke="${CORES.amarelo}" stroke-width="4"/>
      <ellipse cx="0" cy="${cy - r * 0.8}" rx="${r}" ry="${r * 0.28}" fill="#fff4dc" stroke="${OUT}" stroke-width="5"/>`;
    const [mx, my] = maos[1];
    s1 += `<path d="M${mx},${my} l${-20 + Math.sin(t * 14) * 8},${-30}" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><circle cx="${mx - 20 + Math.sin(t * 14) * 8}" cy="${my - 32}" r="9" fill="#fff4dc" stroke="${OUT}" stroke-width="4"/>`;
  }
  if (p.instrumento === 'pandeiro') {  // na mão, do lado do corpo (fora do tronco e longe do rosto)
    const [mx, my] = [ox + 40, topo + tronco * 0.45];
    s1 += `<g transform="translate(${mx} ${my}) rotate(${Math.sin(t * 12) * 18})"><circle r="34" fill="#f4e3c1" stroke="${OUT}" stroke-width="6"/>
      ${[0, 1, 2, 3, 4].map(i => `<circle cx="${Math.cos(i * 1.257) * 34}" cy="${Math.sin(i * 1.257) * 34}" r="7" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="3"/>`).join('')}</g>`;
  }

  // microfone de rádio
  if (p.microfone) {
    const [mx, my] = maos[1];
    s1 += `<g transform="translate(${mx} ${my}) rotate(-25)"><rect x="-9" y="-12" width="18" height="60" rx="8" fill="#444" stroke="${OUT}" stroke-width="5"/>
      <circle data-v="Esfera" cy="-26" r="24" fill="#9aa5b1" stroke="${OUT}" stroke-width="6"/><path d="M-16,-30 h32 M-16,-20 h32" stroke="${OUT}" stroke-width="3"/>
      <rect x="-20" y="10" width="40" height="22" rx="4" fill="${CORES.laranja}" stroke="${OUT}" stroke-width="4"/>
      <text y="27" text-anchor="middle" font-family="Anton" font-size="15" fill="${OUT}">RÁDIO</text></g>`;
    s1 += braco(1, ...maos[1]).split('<circle')[0];
  }

  // cabeça
  const hy = cab + bob * 0.3;
  // black power fica atrás da cabeça (não cobre os olhos)
  let c = (p.cabelo === 'black' ? `<ellipse data-v="Esfera" cx="0" cy="${hy - 22}" rx="${R + 22}" ry="${R * 0.95}" fill="${p.corCabelo || '#2b1d14'}" stroke="${OUT}" stroke-width="5"/>` : '') + `<circle data-v="Esfera" cx="${-R + 4}" cy="${hy + 8}" r="15" fill="${pele}" stroke="${OUT}" stroke-width="5"/>
    <circle data-v="Esfera" cx="${R - 4}" cy="${hy + 8}" r="15" fill="${pele}" stroke="${OUT}" stroke-width="5"/>
    <circle data-v="Esfera" class="rosto" cx="0" cy="${hy}" r="${R}" fill="${pele}" stroke="${OUT}" stroke-width="6"/>`;
  const cc = p.corCabelo || '#2b1d14';
  const cabelos = {
    curto: `<path data-v="Cabelo" d="M${-R + 2},${hy - 4} C${-R + 4},${hy - R - 22} ${R - 4},${hy - R - 22} ${R - 2},${hy - 4} C${R * 0.5},${hy - R * 0.55} ${-R * 0.3},${hy - R * 0.75} ${-R + 2},${hy - 4} Z" fill="${cc}" stroke="${OUT}" stroke-width="5"/>`,
    cacheado: Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1.05 + i * 0.112); return `<circle data-v="Esfera" cx="${Math.cos(a) * R * 0.92}" cy="${hy + Math.sin(a) * R * 0.92}" r="22" fill="${cc}" stroke="${OUT}" stroke-width="4"/>`; }).join(''),
    black: `<path d="M${-R + 6},${hy - 18} Q0,${hy - R - 14} ${R - 6},${hy - 18}" fill="none" stroke="${p.corCabelo || '#2b1d14'}" stroke-width="14" stroke-linecap="round"/>`,
    raspado: `<path d="M${-R + 4},${hy - 10} A${R - 4},${R - 4} 0 0 1 ${R - 4},${hy - 10} Q0,${hy - R * 0.6} ${-R + 4},${hy - 10}Z" fill="${cc}" opacity=".85"/>`,
    careca: `<ellipse cx="-18" cy="${hy - R * 0.62}" rx="16" ry="8" fill="#fff" opacity=".5"/>`,
    grisalho: `<path d="M${-R + 2},${hy + 4} Q${-R - 6},${hy - 36} ${-R * 0.45},${hy - R * 0.72}" stroke="${cc}" stroke-width="18" fill="none" stroke-linecap="round"/>
      <path d="M${R - 2},${hy + 4} Q${R + 6},${hy - 36} ${R * 0.45},${hy - R * 0.72}" stroke="${cc}" stroke-width="18" fill="none" stroke-linecap="round"/>
      <ellipse cx="-14" cy="${hy - R * 0.66}" rx="14" ry="7" fill="#fff" opacity=".5"/>`,
    coque: `<circle data-v="Esfera" cx="0" cy="${hy - R - 18}" r="30" fill="${cc}" stroke="${OUT}" stroke-width="5"/>` +
      Array.from({ length: 7 }, (_, i) => { const a = Math.PI * (1.08 + i * 0.14); return `<circle data-v="Esfera" cx="${Math.cos(a) * R * 0.9}" cy="${hy + Math.sin(a) * R * 0.9}" r="20" fill="${cc}" stroke="${OUT}" stroke-width="4"/>`; }).join(''),
  };
  c += cabelos[p.cabelo || 'curto'] || '';
  if (p.gorro) c += `<path data-v="Cabelo" d="M${-R + 2},${hy - 18} Q${-R * 0.2},${hy - R - 30} ${R * 0.9},${hy - R - 70} Q${R * 0.55},${hy - R * 0.5} ${R - 2},${hy - 18} Z"
      fill="${p.gorro}" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="${R * 0.9}" cy="${hy - R - 70}" r="13" fill="#fff" stroke="${OUT}" stroke-width="5"/>`;  // gorro de saci

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
  if (p.bone) c += `<path data-v="Cabelo" d="M${-R - 2},${hy - 14} A${R + 2},${R + 2} 0 0 1 ${R + 2},${hy - 14} Z" fill="${p.bone}" stroke="${OUT}" stroke-width="6"/>
    <path d="M${R - 6},${hy - 16} Q${R + 52},${hy - 22} ${R + 58},${hy - 6} Q${R + 20},${hy - 2} ${R - 6},${hy - 6}Z" fill="${p.bone}" stroke="${OUT}" stroke-width="6"/>
    ${p.boneTxt ? `<text x="-4" y="${hy - 30}" text-anchor="middle" font-family="Anton" font-size="24" fill="#fff">${esc(p.boneTxt)}</text>` : ''}`;
  if (p.fone) c += `<path d="M${-R - 4},${hy} A${R + 6},${R + 10} 0 0 1 ${R + 4},${hy}" stroke="#333" stroke-width="12" fill="none"/>
    <rect x="${-R - 22}" y="${hy - 20}" width="26" height="46" rx="10" fill="#e63946" stroke="${OUT}" stroke-width="5"/>
    <rect x="${R - 4}" y="${hy - 20}" width="26" height="46" rx="10" fill="#e63946" stroke="${OUT}" stroke-width="5"/>`;
  if (p.brinco) c += `<circle cx="${-R + 2}" cy="${hy + 30}" r="7" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="3"/><circle cx="${R - 2}" cy="${hy + 30}" r="7" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="3"/>`;

  const sombra = window.ESTILO3D
    ? `<ellipse cx="${tw * 0.25}" cy="4" rx="${tw * 1.25}" ry="26" fill="url(#g3dSombra)"/>`
    : `<ellipse cx="0" cy="0" rx="${tw * 0.85}" ry="16" fill="#000" opacity=".22"/>`;
  // espelhado: os textos (número, patrocínio, boné) são desvirados para continuarem legíveis
  const corpo = espelho ? (s1 + c).replace(/<text /g, '<text transform="scale(-1 1)" ') : s1 + c;
  return `<g transform="translate(${x} ${y}) scale(${espelho ? -s : s} ${s})">${sombra}<g transform="translate(0 ${bob})">${corpo}</g></g>`;
}

// ---- elenco e personagens fixos
const PELES = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#6b4226', '#d9a066', '#a0673e'];
const CAMISAS_SORTIDAS = ['#e63946', '#3a86ff', '#ffbe0b', '#8338ec', '#06d6a0', '#ff006e', '#fb5607', '#adb5bd', '#2a9d8f', '#f4a261', '#ffffff'];

const PERSONAGENS = {
  narrador: { pele: '#d9a066', cabelo: 'curto', corCabelo: '#3b2a1e', bigode: true, bone: '#e63946', boneTxt: 'TIÃO', fone: true,
    microfone: true, camisa: '#ffd166', listra: '#f4a261', calcao: '#495057', meiao: '#fff', pose: 'microfone', larg: 1.15, barriga: true },
  costureira: { pele: '#c68642', cabelo: 'coque', corCabelo: '#d0d0d0', oculos: true, camisa: '#9d4edd', avental: '#ffd6e0',
    aventalTxt: 'NEIDE', calcao: '#5a189a', meiao: '#9d4edd', chinelo: true, expr: 'feliz', larg: 1.05, alt: 0.9, idade: true, fita: true },
  tecnico: { pele: '#e0ac69', cabelo: 'curto', corCabelo: '#2b1d14', oculos: true, camisa: '#f1faee', listra: CORES.vinho, calcao: '#343a40', meiao: '#343a40', expr: 'serio', apito: true },
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
  // reforços da peneira (Dia 4): visual próprio para cada um
  '15': { pele: '#c68642', cabelo: 'raspado', corCabelo: '#1b1b1b', camisa: '#3a86ff', expr: 'feliz' },
  '16': { pele: '#f1c27d', cabelo: 'curto', corCabelo: '#6b4226', bigode: true, camisa: '#6c757d', listra: '#495057', expr: 'serio' },
  '17': { pele: '#e0ac69', cabelo: 'cacheado', corCabelo: '#4a3426', camisa: '#ffbe0b', expr: 'feliz' },
  '18': { pele: '#6b4226', cabelo: 'raspado', corCabelo: '#1b1b1b', gorro: '#e63946', umaPerna: true, camisa: '#e63946', listra: '#fff', expr: 'feliz' },
  '19': { pele: '#8d5524', cabelo: 'black', corCabelo: '#1b1b1b', camisa: '#06d6a0', expr: 'feliz', larg: 0.9 },
};

// visual fixo por jogador (vale mesmo se ele trocar de número): Benício era o 17, Foguete era o 7
const VISUAL_POR_NOME = { 'Benício': '17', 'Foguete': '7' };
function jogador(numero, estado, extra = {}) {
  const nomeJ = (estado.elenco[numero] || {}).nome;
  const base = (VISUAL_POR_NOME[nomeJ] && JOGADORES[VISUAL_POR_NOME[nomeJ]]) || JOGADORES[numero] || (() => {
    const r = rng('jog' + numero);
    return { pele: PELES[Math.floor(r() * PELES.length)], cabelo: ['curto', 'raspado', 'cacheado', 'black'][Math.floor(r() * 4)],
      corCabelo: '#1b1b1b', camisa: CAMISAS_SORTIDAS[Math.floor(r() * CAMISAS_SORTIDAS.length)],
      luvas: (estado.elenco[numero] || {}).posicao === 'GOL', bigode: r() > 0.7 };
  })();
  const uniforme = estado.estrutura.uniforme === 'novo';
  const remendos = uniforme && !!estado.estrutura.uniforme_remendado;
  return { ...base, numero, ...(uniforme ? { camisa: CORES.vinho, listra: CORES.amarelo, calcao: '#fff', meiao: CORES.vinho, remendos } : {}),
    ...(uniforme && estado.estrutura.patrocinio ? { patrocinio: estado.estrutura.patrocinio } : {}),
    ...(base.luvas && uniforme ? { camisa: CORES.amarelo, listra: CORES.vinho, calcao: CORES.vinho, meiao: CORES.amarelo, corLuva: '#fff' } : {}), ...extra };
}

// ------------------------------------------------------------ cenários
function ceu(t) {
  if (window._noite) {   // jogo à noite: céu escuro, lua e estrelas (sem nuvens)
    const r = rng('estrelas');
    return `<defs><linearGradient id="gceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b132b"/><stop offset="1" stop-color="#25324f"/></linearGradient>
      <linearGradient id="gterra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CORES.terra2}"/><stop offset="1" stop-color="${CORES.terra1}"/></linearGradient>
      <radialGradient id="gluz"><stop offset="0" stop-color="#fff8dc" stop-opacity=".9"/><stop offset=".35" stop-color="#ffe9a8" stop-opacity=".35"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient></defs>
      <rect x="-700" y="-900" width="${W + 1400}" height="${H + 1800}" fill="url(#gceu)"/>
      ${Array.from({ length: 70 }, () => `<circle cx="${(r() * (W + 400) - 200).toFixed(0)}" cy="${(r() * 700 - 100).toFixed(0)}" r="${(1 + r() * 2.2).toFixed(1)}" fill="#fff" opacity="${(0.35 + r() * 0.5 + Math.sin(t * 3 + r() * 9) * 0.15).toFixed(2)}"/>`).join('')}
      <circle cx="850" cy="150" r="46" fill="#fff4cc"/><circle cx="872" cy="136" r="40" fill="#101a33"/><circle cx="850" cy="150" r="90" fill="#fff4cc" opacity=".08"/>`;
  }
  const nuvens = [[180, 150, 1], [700, 90, 0.8], [980, 230, 1.1]].map(([x, y, s], i) =>
    `<g transform="translate(${(x + t * 8 * (i + 1)) % 1300 - 110} ${y}) scale(${s})" opacity=".95">
      <ellipse cx="0" cy="0" rx="90" ry="38" fill="#fff"/><ellipse cx="-50" cy="12" rx="60" ry="30" fill="#fff"/><ellipse cx="55" cy="10" rx="65" ry="30" fill="#fff"/></g>`).join('');
  return `<defs><linearGradient id="gceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CORES.ceu1}"/><stop offset="1" stop-color="${CORES.ceu2}"/></linearGradient>
    <linearGradient id="gterra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CORES.terra2}"/><stop offset="1" stop-color="${CORES.terra1}"/></linearGradient></defs>
    <rect x="-700" y="-900" width="${W + 1400}" height="${H + 1800}" fill="url(#gceu)"/>${nuvens}`;
}

// morro com casinhas e caixas d'água: o "bairro" atrás do campo
// Copa de árvore com volume: vários círculos com UM contorno só (contorno embaixo, preenchimento por cima),
// sombra na parte de baixo e luz em cima à esquerda.
const VERDES = [['#2f6b3a', '#3f8a4a', '#6fbf6a'], ['#2b5f3f', '#3a7d44', '#79c06f'], ['#356b2d', '#4f9d55', '#8fd17f']];
function copas(lista, seed = 'copa') {
  // lista: [[cx, cy, r, paleta?], ...]
  const r = rng(seed);
  const bolhas = lista.map(([cx, cy, R, k]) => {
    const n = 5, pal = VERDES[(k ?? Math.floor(r() * 3)) % 3], bs = [];
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (0.9 + i * 0.3) + r() * 0.3, d = R * (0.42 + r() * 0.12);
      bs.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, R * (0.55 + r() * 0.15)]);
    }
    bs.push([cx, cy - R * 0.1, R * 0.7]);
    return { bs, pal, cx, cy, R };
  });
  let s = bolhas.map(({ bs }) => bs.map(([x, y, rr]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr + 4).toFixed(1)}" fill="${OUT}"/>`).join('')).join('');
  s += bolhas.map(({ bs, pal }) => bs.map(([x, y, rr]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${pal[0]}"/>`).join('')).join('');
  s += bolhas.map(({ bs, pal }) => bs.map(([x, y, rr]) => `<circle cx="${(x - rr * 0.12).toFixed(1)}" cy="${(y - rr * 0.16).toFixed(1)}" r="${(rr * 0.8).toFixed(1)}" fill="${pal[1]}"/>`).join('')).join('');
  s += bolhas.map(({ bs, pal }) => bs.filter((_, i) => i % 2 === 0).map(([x, y, rr]) => `<circle cx="${(x - rr * 0.3).toFixed(1)}" cy="${(y - rr * 0.36).toFixed(1)}" r="${(rr * 0.32).toFixed(1)}" fill="${pal[2]}" opacity=".85"/>`).join('')).join('');
  return s;
}
// árvore inteira (tronco + copa), com sombra no chão
function arvore(x, yChao, R = 60, seed = 'arv', k) {
  return `<ellipse cx="${x + R * 0.25}" cy="${yChao}" rx="${R * 0.95}" ry="${R * 0.2}" fill="#000" opacity=".2"/>
    <path d="M${x - R * 0.12},${yChao} L${x - R * 0.07},${yChao - R * 1.3} H${x + R * 0.07} L${x + R * 0.12},${yChao}Z" fill="#7f5539" stroke="${OUT}" stroke-width="4"/>
    ${copas([[x, yChao - R * 1.55, R, k]], seed)}`;
}

function bairro(yBase = 780, { xMin = -50, xMax = 1130 } = {}) {
  const r = rng('bairro');
  let s = `<path d="M${xMin},${yBase} ${xMin < -50 ? `L${xMin},${yBase - 200} C-200,${yBase - 330} -100,${yBase - 360} -50,${yBase - 300}` : ''} C150,${yBase - 380} 420,${yBase - 470} 640,${yBase - 380} C820,${yBase - 300} 1000,${yBase - 360} 1130,${yBase - 280} ${xMax > 1130 ? `C1200,${yBase - 250} 1300,${yBase - 300} ${xMax},${yBase - 220}` : ''} V${yBase + 40} H${xMin}Z" data-v="Morro" fill="#7fb069" stroke="${OUT}" stroke-width="5"/>`;
  const cores = ['#f4a259', '#f7d488', '#e76f51', '#90be6d', '#f1faee', '#a8dadc', '#e9c46a', '#d4a373', '#cdb4db', '#ffafcc'];
  const casas = [];
  for (let fila = 0; fila < 6; fila++) {
    const y = yBase - 40 - fila * 62;
    for (let x = xMin + 20 + (fila % 2) * 40; x < xMax - 20; x += 70 + r() * 50) {
      const cume = yBase - 380 + Math.abs(x - 560) * 0.32 - (x > 820 ? 60 : 0);
      if (y - 60 < cume) continue;
      const w = 60 + r() * 55, h = 55 + r() * 40;
      casas.push([x, y, w, h, cores[Math.floor(r() * cores.length)], r() > 0.55, r()]);
    }
  }
  casas.sort((a, b) => a[1] - b[1]);
  window._lajes = casas.map(([x, y, w, h]) => [x, y - h, w]);
  const noite = !!window._noite;
  for (const [x, y, w, h, cor, caixa, q] of casas) {
    const jan = k => noite && ((q * 10 + k) % 1) > 0.45 ? '#ffd166' : '#264653';
    if (window.ESTILO3D) s += `<path d="M${x + w},${y - h} l12,-9 v${h} l-12,9z" fill="${cor}"/><path d="M${x + w},${y - h} l12,-9 v${h} l-12,9z" fill="#000" opacity=".38"/>
      <path d="M${x},${y - h} l12,-9 h${w} l-12,9z" fill="${cor}"/><path d="M${x},${y - h} l12,-9 h${w} l-12,9z" fill="#fff" opacity=".35"/>`;
    s += `<rect data-v="Casa" x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${cor}" stroke="${OUT}" stroke-width="4"/>
      <rect x="${x + w * 0.2}" y="${y - h * 0.7}" width="${w * 0.22}" height="${h * 0.28}" fill="${jan(0.1)}" stroke="${OUT}" stroke-width="3"/>
      ${w > 80 ? `<rect x="${x + w * 0.58}" y="${y - h * 0.7}" width="${w * 0.22}" height="${h * 0.28}" fill="${jan(0.6)}" stroke="${OUT}" stroke-width="3"/>` : ''}
      ${q > 0.6 ? `<rect x="${x - 2}" y="${y - h - 8}" width="${w + 4}" height="8" fill="#bcb8b1" stroke="${OUT}" stroke-width="3"/>` : ''}
      ${caixa ? `<rect x="${x + w * 0.6}" y="${y - h - 26}" width="26" height="22" fill="#3a86ff" stroke="${OUT}" stroke-width="3"/>` : ''}`;
  }
  // fileira de árvores na frente do morro: copas que se juntam numa mata só, com volume
  const fila = [];
  for (let x = xMin + 10; x < xMax - 10; x += 62 + r() * 20) fila.push([x, yBase - 14 + r() * 12, 36 + r() * 20]);
  s += copas(fila, 'mata' + yBase);
  return s;
}

function muro(y, nome) {
  const L = window._local;  // jogo fora: o muro é do dono da casa
  const corMuro = L ? coresTime(L.nome)[0] : CORES.vinho, sgMuro = L ? L.sigla : (window._sigla || '');
  if (L) nome = L.nome;
  return (window.ESTILO3D ? `<rect x="-10" y="${y - 14}" width="${W + 20}" height="16" fill="#fbf6ea"/><rect x="-10" y="${y + 88}" width="${W + 20}" height="60" fill="url(#g3dSombraChao)"/>` : '') + `<rect data-v="Vert" x="-10" y="${y}" width="${W + 20}" height="90" fill="#e9e1d1" stroke="${OUT}" stroke-width="5"/>
    <path d="M60,${y + 18} q40,-12 90,0 t90,0" stroke="#e76f51" stroke-width="10" fill="none" opacity=".7"/>
    <path d="M820,${y + 70} q40,-14 90,0 t90,0" stroke="#3a86ff" stroke-width="10" fill="none" opacity=".7"/>
    <text class="${window._closeGol ? '' : 'rotulo'}" x="265" y="${y + 62}" text-anchor="middle" font-family="Anton" font-size="${Math.min(46, 270 / Math.max(1, medir(nome.toUpperCase(), 1)))}" fill="${corMuro}" opacity=".9">${esc(nome.toUpperCase())}</text>
    <text class="${window._closeGol ? '' : 'rotulo'}" x="835" y="${y + 64}" text-anchor="middle" font-family="Anton" font-size="52" fill="${corMuro}" opacity=".85" letter-spacing="6">${esc(sgMuro)}</text>` + (!L && window._placas ? placasMuro(y) : '');
}
// placa de publicidade atrás do gol: os anúncios dos comerciantes do bairro vão trocando (como placa giratória)
function placasMuro(y) {
  const anuncios = [['#ffd166', OUT, 'BORRACHARIA DO ZÉ'], ['#3a86ff', '#fff', 'SALÃO DA KEKA'], ['#e63946', '#fff', 'AÇOUGUE BOI GORDO']];
  const [bg, cor, txt] = anuncios[Math.floor((window._tQuadro || 0) / 2.2) % anuncios.length];
  const cx = 540, w = 250, tam = Math.min(30, (w - 20) / Math.max(1, medir(txt, 1)));
  return `<rect x="${cx - w / 2 + 4}" y="${y + 14}" width="${w}" height="56" rx="6" fill="#000" opacity=".18"/>
    <rect x="${cx - w / 2}" y="${y + 10}" width="${w}" height="56" rx="6" fill="${bg}" stroke="${OUT}" stroke-width="4"/>
    <circle cx="${cx - w / 2 + 8}" cy="${y + 18}" r="3" fill="${OUT}"/><circle cx="${cx + w / 2 - 8}" cy="${y + 18}" r="3" fill="${OUT}"/>
    <text x="${cx}" y="${y + 38 + tam * 0.36}" text-anchor="middle" font-family="Anton" font-size="${tam}" fill="${cor}">${esc(txt)}</text>`;
}

// cor da camisa da torcida: a nossa (vinho) ou, no jogo fora, a do dono da casa (com uns poucos do Poeira)
function corTorcida(r) {
  const L = window._local;
  if (!L) return CORES.vinho;
  return r() > 0.12 ? coresTime(L.nome)[0] : CORES.vinho;
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
      const camisa = r() > 0.4 ? corTorcida(r) : CAMISAS_SORTIDAS[Math.floor(r() * CAMISAS_SORTIDAS.length)];
      s += `<rect data-v="Vert" x="${x - 14}" y="${y + 6}" width="28" height="34" rx="10" fill="${camisa}" stroke="${OUT}" stroke-width="3"/>
        <circle data-v="Esfera" cx="${x}" cy="${y}" r="13" fill="${PELES[Math.floor(r() * PELES.length)]}" stroke="${OUT}" stroke-width="3"/>`;
    }
  }
  return s;
}

const ARQ_BLOCOS = [[52, 478], [602, 1028]], ARQ_DEGRAUS = 3, ARQ_POR_FILA = 13;
function arquibancada(estrutura, torcida, y = 850, t = 0) {
  const cap = estrutura.capacidade || 500;
  const ocup = clamp(torcida / cap);
  const grande = cap > 500;
  let s = '';
  if (grande) {
    const altura = 200;
    for (let i = 0; i < 4; i++) s += `<rect x="-10" y="${y - altura + i * 50}" width="${W + 20}" height="14" fill="#b08968" stroke="${OUT}" stroke-width="4"/>`;
    s += `<rect x="-10" y="${y - altura}" width="${W + 20}" height="${altura}" fill="#00000010"/>`;
    const n = Math.round(260 * ocup);
    if (n) s += `<g transform="translate(0 ${Math.sin(t * 6) * 2})">${torcedores(n, y - altura - 10, y - 30, 'arq' + cap)}</g>`;
    if (torcida > cap) s += `<g opacity=".9">${torcedores(Math.min(80, Math.round(30 + Math.log10(torcida) * 8)), y - altura - 140, y - altura - 60, 'fora')}</g>`;
    return s;
  }
  // quem senta onde: sorteio fixo dos lugares, enchendo conforme a ocupação
  const total = ARQ_BLOCOS.length * ARQ_DEGRAUS * ARQ_POR_FILA, n = Math.round(total * ocup);
  const r = rng('arq-lugares'), ordem = Array.from({ length: total }, (_, i) => [r(), i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const ocupado = new Set(ordem.slice(0, n));
  const passo = 52, yTopo = y - ARQ_DEGRAUS * passo;       // o degrau de trás é o mais alto
  ARQ_BLOCOS.forEach(([xa, xb], b) => {
    // estrutura: pés, travessas e corrimão de trás
    s += `<path d="M${xa + 8},${y + 20} V${yTopo - 74} M${xb - 8},${y + 20} V${yTopo - 74} M${(xa + xb) / 2},${y + 20} V${yTopo - 74}" stroke="${OUT}" stroke-width="13" stroke-linecap="round"/>
      <path d="M${xa + 8},${y + 20} V${yTopo - 74} M${xb - 8},${y + 20} V${yTopo - 74} M${(xa + xb) / 2},${y + 20} V${yTopo - 74}" stroke="#7f5539" stroke-width="7" stroke-linecap="round"/>
      <rect x="${xa - 4}" y="${yTopo - 70}" width="${xb - xa + 8}" height="12" rx="4" fill="#9c6644" stroke="${OUT}" stroke-width="4"/>`;
    for (let d = 0; d < ARQ_DEGRAUS; d++) {
      const py = yTopo + d * passo;                          // tábua do assento deste degrau
      // espelho do degrau (tábuas escuras) + assento
      s += `<rect x="${xa}" y="${py + 12}" width="${xb - xa}" height="${passo}" fill="#8a5a3c" stroke="${OUT}" stroke-width="4"/>
        <path d="M${xa + 4},${py + 12 + passo / 2} H${xb - 4}" stroke="#6f472e" stroke-width="3"/>
        <rect x="${xa - 10}" y="${py}" width="${xb - xa + 20}" height="14" rx="4" fill="#c79a6b" stroke="${OUT}" stroke-width="4"/>`;
      // torcedores sentados neste degrau (o corpo encosta na tábua)
      const rr = rng(`arq-${b}-${d}`);
      for (let i = 0; i < ARQ_POR_FILA; i++) {
        const cor = rr() > 0.4 ? corTorcida(rr) : CAMISAS_SORTIDAS[Math.floor(rr() * CAMISAS_SORTIDAS.length)], pele = PELES[Math.floor(rr() * PELES.length)];
        if (!ocupado.has((b * ARQ_DEGRAUS + d) * ARQ_POR_FILA + i)) continue;
        const x = xa + 20 + (i + 0.5) * ((xb - xa - 40) / ARQ_POR_FILA) + (rr() - 0.5) * 6;
        const pulo = Math.abs(Math.sin(t * 6 + i * 1.7 + d + b)) * 5;
        s += `<g transform="translate(0 ${-pulo.toFixed(1)})"><rect data-v="Vert" x="${x - 14}" y="${py - 32}" width="28" height="34" rx="10" fill="${cor}" stroke="${OUT}" stroke-width="3"/>
          <circle data-v="Esfera" cx="${x}" cy="${py - 40}" r="13" fill="${pele}" stroke="${OUT}" stroke-width="3"/></g>`;
      }
    }
  });
  // torcida organizada (Poeira Levantada): bandeirões e fumaça vinho/amarela atrás dos degraus, só em casa
  if (estrutura.organizada && !window._local) {
    let o = '';
    for (const [x, k] of [[150, 0], [430, 1], [700, 2], [960, 3]]) {
      for (let i = 0; i < 4; i++) { const f = (t * 0.4 + i * 0.25 + k * 0.11) % 1;
        o += `<circle cx="${(x + Math.sin(f * 5 + k) * 30).toFixed(1)}" cy="${(yTopo - 60 - f * 200).toFixed(1)}" r="${(26 + f * 46).toFixed(1)}" fill="${k % 2 ? CORES.amarelo : CORES.vinho}" opacity="${(0.55 * (1 - f)).toFixed(2)}"/>`; }
    }
    for (const [x, k] of [[260, 0], [820, 1]]) { const w = Math.sin(t * 4 + k * 2) * 12;
      o += `<path d="M${x},${yTopo - 20} V${yTopo - 200}" stroke="${OUT}" stroke-width="9"/>
        <path d="M${x},${yTopo - 196} q50,${-12 + w} 110,0 t110,0 v86 q-55,${12 - w} -110,0 t-110,0Z" fill="${CORES.vinho}" stroke="${OUT}" stroke-width="5"/>
        <path d="M${x},${yTopo - 166} q50,${-12 + w} 110,0 t110,0 v26 q-55,${12 - w} -110,0 t-110,0Z" fill="${CORES.amarelo}"/>`; }
    s = o + s;
  }
  // gente de fora (lotado): em pé atrás do corrimão
  if (torcida > cap) s = `<g opacity=".95">${torcedores(Math.min(60, Math.round(20 + Math.log10(torcida) * 8)), yTopo - 118, yTopo - 76, 'fora')}</g>` + s;
  return s;
}

// trave em tamanho real (7,32 × 2,44 m) em s = 1; na cena, use a escala de uma pessoa na mesma profundidade
function trave(x, y, s = 1, torta = true, rede = false) {
  const a = m(7.32) / 2, h = m(2.44), e = Math.max(14, 0.12 * PX_M);   // poste de 12 cm
  const malha = rede ? Array.from({ length: 25 }, (_, i) => `<path d="M${-a + i * a / 12},${-h} V0" stroke="#fff" stroke-width="5" opacity=".7"/>`).join('')
    + Array.from({ length: 8 }, (_, i) => `<path d="M${-a},${-h + i * h / 8} H${a}" stroke="#fff" stroke-width="5" opacity=".7"/>`).join('') : '';
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${torta ? -1.5 : 0})">
    <rect x="${-a}" y="${-h}" width="${2 * a}" height="${h}" fill="#ffffff22"/>${malha}
    <path d="M${-a},0 V${-h} H${a} V0" fill="none" stroke="${OUT}" stroke-width="${e + 10}" stroke-linejoin="round"/>
    <path d="M${-a},0 V${-h} H${a} V0" fill="none" stroke="#fff" stroke-width="${e}" stroke-linejoin="round"/></g>`;
}

// banco de reservas real: 3 m de comprimento, assento a 45 cm, encosto até 85 cm
function bancoReservas(x, y, s = 1) {
  const a = m(3) / 2, as = m(0.45), en = m(0.85);
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M${-a + 20},${-as + 10} V0 M${a - 20},${-as + 10} V0 M0,${-as + 10} V0 M${-a + 26},${-en} V${-as} M${a - 26},${-en} V${-as}" stroke="${OUT}" stroke-width="12"/>
    <rect x="${-a}" y="${-as - 6}" width="${2 * a}" height="22" rx="5" fill="#b08968" stroke="${OUT}" stroke-width="6"/>
    <rect x="${-a}" y="${-en}" width="${2 * a}" height="20" rx="5" fill="#9c6644" stroke="${OUT}" stroke-width="5"/>
    <rect x="${-a}" y="${-en + 34}" width="${2 * a}" height="16" rx="5" fill="#9c6644" stroke="${OUT}" stroke-width="5"/></g>`;
}

// Vista da linha lateral: o campo à direita da linha branca, a área de fora à esquerda,
// com o banco de reservas (e um isopor) do lado de fora.
function lateral(estrutura, { t = 0, nome = '', torcida = 0 } = {}) {
  const grama = String(estrutura.gramado || '').startsWith('grama'), ruim = estrutura.gramado === 'grama_ruim';
  let s = ceu(t) + bairro(760) + arquibancada(estrutura, torcida, 860, t) + muro(860, nome);
  s += `<rect x="-10" y="950" width="${W + 20}" height="${H - 950}" fill="#d9b382"/>`;            // área de fora
  const r = rng('lateral');
  for (let i = 0; i < 14; i++) s += `<ellipse cx="${r() * 520}" cy="${1000 + r() * 880}" rx="${8 + r() * 18}" ry="${3 + r() * 5}" fill="#a47148" opacity=".45"/>`;
  s += `<path d="M560,950 L1090,950 L1090,1930 L860,1930Z" fill="${ruim ? '#8fa94a' : grama ? CORES.grama1 : CORES.terra1}" stroke="${OUT}" stroke-width="4"/>`; // campo
  if (ruim) s += carecas(i => { const r = rng('careca-lat' + i), y = 990 + r() * 900, f = (y - 950) / 980; return [560 + 300 * f + 40 + r() * (480 - 300 * f), y, 0.15 + f * 0.25]; }, 10);
  s += `<path d="M560,950 L860,1930" stroke="#fff" stroke-width="16" opacity=".9"/>`;                  // linha lateral
  s += `<g transform="translate(330 1560) scale(1.9)">${bancoReservasFrente()}</g>`;
  s += `<g transform="translate(110 1640)"><rect x="-55" y="-60" width="110" height="70" rx="10" fill="#3a86ff" stroke="${OUT}" stroke-width="6"/>
    <rect x="-60" y="-74" width="120" height="20" rx="8" fill="#fff" stroke="${OUT}" stroke-width="5"/></g>`;                   // isopor
  return s;
}

// banco de reservas visto de frente, em tamanho real (3 m, assento a 45 cm, encosto a 85 cm); pé no y = 0
function bancoReservasFrente() {
  const a = m(3) / 2, as = m(0.45), en = m(0.85);
  return `<ellipse cy="4" rx="${a + 20}" ry="14" fill="#000" opacity=".18"/>
    <path d="M${-a + 34},${-as} V0 M${a - 34},${-as} V0 M0,${-as} V0 M${-a + 40},${-en} V${-as} M${a - 40},${-en} V${-as}" stroke="${OUT}" stroke-width="14" stroke-linecap="round"/>
    <rect x="${-a}" y="${-en}" width="${2 * a}" height="22" rx="6" fill="#9c6644" stroke="${OUT}" stroke-width="6"/>
    <rect x="${-a}" y="${-en + 36}" width="${2 * a}" height="18" rx="6" fill="#9c6644" stroke="${OUT}" stroke-width="5"/>
    <rect x="${-a}" y="${-as - 10}" width="${2 * a}" height="26" rx="6" fill="#b08968" stroke="${OUT}" stroke-width="6"/>`;
}

// ------------------------------------------------------------ campo (vista de frente, atrás do meio-campo)
// Geometria única: o campo é um trapézio em perspectiva com as linhas laterais visíveis. Fora delas:
// lateral ESQUERDA = obra / arquibancada nova; lateral DIREITA = banco de reservas, pomponetes e o Caramelo.
// a câmera fica atrás do gol, um pouco à esquerda do centro: a lateral esquerda (obra / arquibancada nova) entra no quadro
const CF = { y0: 950, y1: 1920, xl0: 330, xr0: 900, xl1: 60, xr1: 1300 };
const cfX = (y, lado) => { const k = (y - CF.y0) / (CF.y1 - CF.y0); return lado < 0 ? CF.xl0 + (CF.xl1 - CF.xl0) * k : CF.xr0 + (CF.xr1 - CF.xr0) * k; };
const cfC = y => (cfX(y, -1) + cfX(y, 1)) / 2;   // meio do campo nessa profundidade
const cfF = (y, f) => cfX(y, -1) + (cfX(y, 1) - cfX(y, -1)) * f;   // fração f da largura (0 = lateral esquerda)
const CAMPO_LARG = 60;   // largura real do campo (m)
const cfK = y => (cfX(y, 1) - cfX(y, -1)) / m(CAMPO_LARG);   // escala de uma pessoa nessa profundidade (s = 1 → 1,75 m = 300 px)

function campo(estrutura, { t = 0, torcida = 0, nome = '', camera = 1 } = {}) {
  const grama = String(estrutura.gramado || '').startsWith('grama'), ruim = estrutura.gramado === 'grama_ruim', fora = !!window._local;
  const dx = cfC(CF.y0) - W / 2;   // a arquibancada atrás do gol acompanha o gol
  let s = ceu(t) + bairro(760, { xMin: -200, xMax: 1280 }) + (window._local?.tema === 'feira' ? feira(760, t) : '') + (window._local?.tema === 'churrasco' ? churrasco(760, t) : '') + (window._local?.tema === 'padaria' ? padaria(760, t) : '') + `<g transform="translate(${dx} 0)">${arquibancada(estrutura, torcida, 860, t)}</g>` + muro(860, nome);
  // chão de fora do campo (terra batida com capim) e o campo por cima, com as linhas laterais
  s += `<rect x="-10" y="${CF.y0 - 2}" width="${W + 20}" height="${H - CF.y0 + 4}" fill="#b98b57"/>`;
  { const r = rng('fora-campo'); for (let i = 0; i < 40; i++) { const y = CF.y0 + 10 + r() * (H - CF.y0), lado = r() > 0.5 ? 1 : -1, x = lado < 0 ? r() * (cfX(y, -1) - 10) : cfX(y, 1) + 10 + r() * (W - cfX(y, 1));
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} l-5,-12 M${x.toFixed(0)},${y.toFixed(0)} l1,-15 M${x.toFixed(0)},${y.toFixed(0)} l6,-11" stroke="#6f8c45" stroke-width="3" stroke-linecap="round"/>`; } }
  s += `<path d="M${CF.xl0},${CF.y0} H${CF.xr0} L${CF.xr1},${CF.y1} H${CF.xl1}Z" fill="${ruim ? '#8fa94a' : grama ? CORES.grama1 : 'url(#gterra)'}"/>`;
  if (grama) for (let i = 0; i < 6; i++) { const a = CF.y0 + i * 170, b = a + 85; s += `<path d="M${cfX(a, -1)},${a} H${cfX(a, 1)} L${cfX(b, 1)},${b} H${cfX(b, -1)}Z" fill="${CORES.grama2}" opacity=".8"/>`; }
  if (ruim) { const r = rng('carecas-campo'); s += carecas(() => { const y = 975 + r() * 900; return [cfF(y, 0.06 + r() * 0.88), y, cfK(y)]; }, 42); }
  else {
    const r = rng('pedras');
    for (let i = 0; i < 26; i++) { const y = 980 + r() * 900, x = cfX(y, -1) + 30 + r() * (cfX(y, 1) - cfX(y, -1) - 60); s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(10 + r() * 30).toFixed(0)}" ry="${(4 + r() * 8).toFixed(0)}" fill="#8b4a22" opacity=".45"/>`; }
    s += `<ellipse cx="${cfF(1500, 0.18)}" cy="1500" rx="90" ry="22" fill="#7a9cc6" opacity=".5"/><ellipse cx="${cfF(1180, 0.75)}" cy="1180" rx="60" ry="14" fill="#7a9cc6" opacity=".45"/>`;
  }
  const linha = grama ? '#ffffffdd' : '#ffffff88', ym = 1260;
  s += `<path d="M${CF.xl0},${CF.y0} L${CF.xl1},${CF.y1} M${CF.xr0},${CF.y0} L${CF.xr1},${CF.y1} M${CF.xl0},${CF.y0} H${CF.xr0}" stroke="${linha}" stroke-width="7" fill="none"/>
    <path d="M${cfX(ym, -1)},${ym} H${cfX(ym, 1)}" stroke="${linha}" stroke-width="7"/>
    <ellipse cx="${cfC(ym)}" cy="${ym}" rx="${(cfX(ym, 1) - cfX(ym, -1)) * 9.15 / CAMPO_LARG}" ry="56" fill="none" stroke="${linha}" stroke-width="7"/>
    <path d="M${cfF(CF.y0, 0.164)},${CF.y0} L${cfF(1040, 0.164)},1040 H${cfF(1040, 0.836)} L${cfF(CF.y0, 0.836)},${CF.y0}" fill="none" stroke="${linha}" stroke-width="6"/>
    <path d="M${cfF(CF.y0, 0.3475)},${CF.y0} L${cfF(985, 0.3475)},985 H${cfF(985, 0.6525)} L${cfF(CF.y0, 0.6525)},${CF.y0}" fill="none" stroke="${linha}" stroke-width="5"/>
    <ellipse cx="${cfC(1012)}" cy="1012" rx="4" ry="2" fill="${linha}"/>`;   // grande área 40,3 × 16,5 m, pequena 18,3 × 5,5 m, pênalti a 11 m
  s += trave(cfC(CF.y0), CF.y0 + 3, cfK(CF.y0), !grama, !!estrutura.rede);
  // ---- lateral esquerda: obra (ou arquibancada nova pronta), só no nosso campo
  if (!fora && (estrutura.obra_arquibancada || estrutura.arquibancada_lateral)) s += lateralEsquerdaFrente(estrutura, t, torcida);
  // ---- lateral direita: banco de reservas, pomponetes e o Caramelo (as pomponetes viajam com o time)
  s += lateralDireitaFrente(estrutura, t, fora);
  // noite: tudo em volta escurece; o campo (iluminado pelos refletores) fica claro
  if (window._noite) s += `<path d="M-2000,-2000 H${W + 2000} V${H + 2000} H-2000Z M${CF.xl0},${CF.y0} L${CF.xl1},${CF.y1} H${CF.xr1} L${CF.xr0},${CF.y0}Z" fill="#0b132b" fill-rule="evenodd" opacity=".5"/>
    <path d="M${CF.xl0},${CF.y0} H${CF.xr0} L${CF.xr1},${CF.y1} H${CF.xl1}Z" fill="#fff3c4" opacity=".08"/>`;
  // refletores: quatro torres de 15 m, fora das laterais (à esquerda, atrás da obra / arquibancada nova)
  if (estrutura.iluminacao && !fora) {
    const temLateral = estrutura.obra_arquibancada || estrutura.arquibancada_lateral;
    for (const y of [1060, 1430]) for (const lado of [-1, 1]) {
      const k = cfK(y), x = lado < 0 ? cfX(y, -1) - m(temLateral ? 11 : 4) * k : cfX(y, 1) + m(6) * k;
      s += refletorTorre(x, y, k, -lado);
    }
  }
  return s;
}

// torre de refletor (15 m) com o painel de 6 lâmpadas virado para o campo; à noite as lâmpadas acendem
function refletorTorre(x, yChao, k, vira = 1) {
  const h = m(15) * k, pw = m(2.6) * k, ph = m(1.3) * k, noite = !!window._noite, e = Math.max(2, m(0.35) * k);
  let s = `<path d="M${x},${yChao} V${yChao - h}" stroke="${OUT}" stroke-width="${e + 3}"/><path d="M${x},${yChao} V${yChao - h}" stroke="#868e96" stroke-width="${e}"/>
    <g transform="translate(${x} ${yChao - h}) skewY(${vira * 6})"><rect x="${-pw / 2}" y="${-ph}" width="${pw}" height="${ph}" fill="#495057" stroke="${OUT}" stroke-width="${Math.max(1.5, e / 2)}"/>`;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++)
    s += `<circle cx="${(-pw / 2 + pw * (i + 0.5) / 3).toFixed(1)}" cy="${(-ph + ph * (j + 0.5) / 2).toFixed(1)}" r="${(ph * 0.2).toFixed(1)}" fill="${noite ? '#fffbe6' : '#dee2e6'}"/>`;
  s += '</g>';
  if (noite) s += `<ellipse cx="${x}" cy="${yChao - h - ph / 2}" rx="${pw * 2.2}" ry="${pw * 1.6}" fill="url(#gluz)"/>`;
  return s;
}

// Obra / arquibancada nova ao longo da lateral esquerda, em perspectiva (degraus sobem para fora do campo).
function lateralEsquerdaFrente(estrutura, t = 0, torcida = 0) {
  const obra = estrutura.obra_arquibancada, prog = obra ? Math.min(1, ((obra.feitos || 0) + 1) / ((obra.jogos || 3) + 1)) : 1;
  const ys = [1040, 1080, 1130, 1190, 1260, 1350, 1470, 1640, 1900];   // mourões, do fundo para a frente (60 m centrados no meio-campo, y = 1260)
  // medidas reais: começa 1,5 m fora da linha; 10 degraus de 45 cm (4,5 m de altura) em 8 m de profundidade
  const pe = y => cfX(y, -1) - m(1.5) * cfK(y);
  const larg = y => m(8) * cfK(y), alt = y => m(4.5) * cfK(y);
  let s = `<path d="M${pe(ys[0])},${ys[0]} L${pe(1920)},1920 L${pe(1920) - larg(1920)},1920 L${pe(ys[0]) - larg(ys[0])},${ys[0]}Z" fill="#000" opacity=".12"/>`;
  const nDeg = 10, prontos = obra ? Math.max(1, Math.round(nDeg * prog)) : nDeg;
  // degraus: faixas paralelas à linha, cada uma mais alta e mais para fora
  for (let d = nDeg - 1; d >= 0; d--) {
    const f = (d + 1) / nDeg, pronto = d < prontos;
    const pts = ys.map(y => [pe(y) - larg(y) * f, y - alt(y) * f]);
    const frente = ys.map(y => [pe(y) - larg(y) * (d / nDeg), y - alt(y) * f]).reverse();
    if (pronto) s += `<path d="M${[...pts, ...frente].map(p => p.map(v => v.toFixed(1)).join(',')).join(' L')}Z" fill="${obra ? '#c79a6b' : '#b08968'}" stroke="${OUT}" stroke-width="3"/>`;
    else s += `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L')}" fill="none" stroke="#7f5539" stroke-width="${3 + d}"/>`;
  }
  // mourões (pilares) de madeira e travessas em X
  ys.forEach((y, i) => { const x = pe(y), k = cfK(y);
    s += `<path d="M${x - larg(y)},${y} V${y - alt(y)} M${x},${y} V${y - alt(y) * 0.25}" stroke="${OUT}" stroke-width="${m(0.3) * k + 3}" stroke-linecap="round"/>
      <path d="M${x - larg(y)},${y} V${y - alt(y)} M${x},${y} V${y - alt(y) * 0.25}" stroke="#9c6644" stroke-width="${m(0.3) * k}" stroke-linecap="round"/>`;
    if (obra && i < ys.length - 1) { const y2 = ys[i + 1]; s += `<path d="M${x - larg(y)},${y - alt(y)} L${pe(y2) - larg(y2)},${y2} M${x - larg(y)},${y} L${pe(y2) - larg(y2)},${y2 - alt(y2)}" stroke="#7f5539" stroke-width="${m(0.12) * k + 1}" opacity=".85"/>`; }
  });
  if (obra) {
    // faixa zebrada na linha lateral, material no chão e dois pedreiros na escala certa
    s += `<path d="M${pe(980) + m(0.7) * cfK(980)},980 L${pe(1920) + m(0.7) * cfK(1920)},1920" stroke="${OUT}" stroke-width="7"/><path d="M${pe(980) + m(0.7) * cfK(980)},980 L${pe(1920) + m(0.7) * cfK(1920)},1920" stroke="#ffd60a" stroke-width="4" stroke-dasharray="10 9"/>`;
    s += [[1180, 0], [1400, 1], [1560, 0]].map(([y, i]) => pessoa({ pele: i ? '#e0ac69' : '#a0673e', cabelo: 'curto', corCabelo: '#2b1d14', bone: '#ffd60a', camisa: '#f77f00', calcao: '#495057', meiao: '#343a40',
      pose: i ? 'aponta' : 'caixa', expr: i ? 'feliz' : 'serio', bigode: !!i }, t, { x: pe(y) - larg(y) * (i ? 0.25 : 0.12), y: y + 4, s: cfK(y), fase: i }).replace(/class="rosto" /g, '')).join('');
    const yb = 1600; s += [0, 1, 2].map(i => `<rect x="${pe(yb) - larg(yb) * 0.9 + i * 6}" y="${yb + 6 - i * 10}" width="${larg(yb) * 0.3}" height="${m(0.2) * cfK(yb)}" fill="#b08968" stroke="${OUT}" stroke-width="2.5"/>`).join('');
  } else if (torcida > 0) {
    // arquibancada pronta: torcedores sentados nos degraus
    const r = rng('lat-esq'); let n = Math.min(160, Math.round(torcida / 10));
    for (let d = 0; d < nDeg && n > 0; d++) for (let i = 1; i < ys.length && n > 0; i++, n--) {
      const y = ys[i] + (ys[i - 1] - ys[i]) * r(), f = (d + 0.6) / nDeg, k = cfK(y);   // torcedor sentado: ~0,9 m de altura
      s += `<g transform="translate(${(pe(y) - larg(y) * f).toFixed(1)} ${(y - alt(y) * f).toFixed(1)})"><rect x="${-m(0.22) * k}" y="${-m(0.55) * k}" width="${m(0.44) * k}" height="${m(0.55) * k}" rx="${m(0.12) * k}" fill="${r() > 0.3 ? CORES.vinho : CORES.amarelo}" stroke="${OUT}" stroke-width="1.5"/><circle cy="${-m(0.7) * k}" r="${m(0.13) * k}" fill="${PELES[Math.floor(r() * PELES.length)]}" stroke="${OUT}" stroke-width="1.5"/></g>`;
    }
  }
  return s;
}

// Lateral direita: banco de reservas, pomponetes e o Caramelo, todos fora da linha e na escala da profundidade.
function lateralDireitaFrente(estrutura, t = 0, fora = false) {
  let s = '';
  const fx = (y, d) => cfX(y, 1) + d * cfK(y);
  if (estrutura.banco_reservas && !fora) { const y = 1120, k = cfK(y);
    s += `<g transform="translate(${fx(y, m(2.5))} ${y}) scale(${k})">${bancoReservasFrente()}</g>`; }
  if (estrutura.pomponetes) [[1150, 160], [1185, 260]].forEach(([y, d], i) => {
    s += pessoa({ pele: PELES[(i * 2 + 1) % PELES.length], cabelo: 'coque', corCabelo: i % 2 ? '#7a4b2a' : '#1b1b1b', camisa: CORES.amarelo, listra: CORES.vinho,
      calcao: CORES.vinho, meiao: '#fff', pompons: CORES.vinho, pose: Math.sin(t * 4 + i) > 0 ? 'comemora' : 'acena', expr: 'feliz' }, t, { x: fx(y, d), y, s: cfK(y), fase: i }).replace(/class="rosto" /g, '');
  });
  if (estrutura.mascote && !fora) { const y = 1225; s += `<g transform="translate(${fx(y, 150)} ${y}) scale(${cfK(y)})">${caramelo(t, { espelho: true })}</g>`; }
  return s;
}

// Caramelo, o mascote: vira-lata caramelo com coleira vinho e plaquinha do escudo. Origem: chão (patas).
// Proporção: ~45% da altura de uma pessoa (cachorro médio).
// vista aérea: a obra ocupa a faixa à esquerda do campo, entre a linha e a cerca
function obraArquibancadaAerea(prog = 0.3) {
  const y0 = 860, y1 = 1560, dx = y => xBorda(y, -1);
  const ext = (y, k) => dx(y) - 26 - k * (y - 640) * 0.13;
  let s = `<path d="M${ext(y0, 0)},${y0} L${ext(y1, 0)},${y1} L${ext(y1, 1)},${y1} L${ext(y0, 1)},${y0}Z" fill="#c4935f" stroke="${OUT}" stroke-width="4"/>`;
  const yf = y0 + (y1 - y0) * prog;   // parte pronta (degraus)
  for (let k = 0; k < 4; k++) { const kk = 0.15 + k * 0.23;
    s += `<path d="M${ext(y0, kk)},${y0} L${ext(yf, kk)},${yf}" stroke="#c79a6b" stroke-width="${9 - k}" stroke-linecap="round"/>
      <path d="M${ext(yf, kk)},${yf} L${ext(y1, kk)},${y1}" stroke="#fff" stroke-width="2" stroke-dasharray="8 7" opacity=".8"/>`; }
  for (let y = y0; y <= y1; y += 70) s += `<circle cx="${ext(y, 1)}" cy="${y}" r="5" fill="#9c6644" stroke="${OUT}" stroke-width="2"/>`;
  s += `<path d="M${ext(y0, -0.05)},${y0} L${ext(y1, -0.05)},${y1}" stroke="#ffd60a" stroke-width="5" stroke-dasharray="12 10"/>`;
  return s;
}

function cone(x, y, k = 1) {
  return `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cy="2" rx="30" ry="7" fill="#000" opacity=".2"/><path d="M-28,0 h56 l-6,-8 h-44z" fill="#f77f00" stroke="${OUT}" stroke-width="4"/>
    <path d="M-20,-8 L-5,-64 h10 L20,-8Z" fill="#f77f00" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/><path d="M-14,-28 h28 l-3,-12 h-22z" fill="#fff"/></g>`;
}
function caramelo(t = 0, { espelho = false } = {}) {
  const rabo = Math.sin(t * 14) * 18;
  return `<g transform="scale(${espelho ? -0.72 : 0.72} 0.72)"><ellipse cx="0" cy="0" rx="78" ry="10" fill="#000" opacity=".2"/>
    <path d="M-62,-62 q-30,${-20 + rabo * 0.3} -34,${-56 + rabo}" fill="none" stroke="${OUT}" stroke-width="18" stroke-linecap="round"/>
    <path d="M-62,-62 q-30,${-20 + rabo * 0.3} -34,${-56 + rabo}" fill="none" stroke="#d4893f" stroke-width="10" stroke-linecap="round"/>
    ${[-46, -22, 30, 52].map((x, i) => `<path d="M${x},-40 v38" stroke="${OUT}" stroke-width="20" stroke-linecap="round"/><path d="M${x},-40 v38" stroke="${i % 2 ? '#d4893f' : '#c47a33'}" stroke-width="12" stroke-linecap="round"/>`).join('')}
    <ellipse cx="0" cy="-66" rx="72" ry="36" fill="#d4893f" stroke="${OUT}" stroke-width="6"/>
    <ellipse cx="6" cy="-52" rx="44" ry="16" fill="#f1c27d" opacity=".8"/>
    <g transform="translate(66 -104)">
      <path d="M-20,-30 l-14,-30 l26,18Z M16,-34 l14,-30 l-2,32Z" fill="#a8622a" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
      <circle r="38" fill="#d4893f" stroke="${OUT}" stroke-width="6"/>
      <ellipse cx="26" cy="12" rx="22" ry="16" fill="#f1c27d" stroke="${OUT}" stroke-width="5"/>
      <ellipse cx="42" cy="6" rx="8" ry="6" fill="${OUT}"/>
      <circle cx="-2" cy="-8" r="6" fill="${OUT}"/><circle cx="20" cy="-10" r="6" fill="${OUT}"/>
      <path d="M22,24 q8,16 18,4" fill="#e63946" stroke="${OUT}" stroke-width="3"/></g>
    <path d="M42,-96 q20,14 42,6" fill="none" stroke="${CORES.vinho}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="60" cy="-80" r="11" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="4"/></g>`;
}

// casa do Atlético Padaria: forno de lenha de tijolo com fumaça e pães na pá
function padaria(yBase, t = 0) {
  let s = '';
  for (const [x, k] of [[150, 0], [930, 1]]) {
    const y = yBase - 40;
    for (let i = 0; i < 5; i++) { const fase = (t * 0.3 + i * 0.2 + k * 0.17) % 1;
      s += `<circle cx="${(x + 30 + Math.sin(fase * 6 + k) * 22).toFixed(1)}" cy="${(y - 190 - fase * 220).toFixed(1)}" r="${(20 + fase * 36).toFixed(1)}" fill="#e9ecef" opacity="${(0.7 * (1 - fase)).toFixed(2)}"/>`; }
    s += `<rect x="${x + 14}" y="${y - 200}" width="34" height="80" fill="#b5523b" stroke="${OUT}" stroke-width="5"/>
      <path d="M${x - 90},${y} V${y - 60} a90,80 0 0 1 180,0 V${y}Z" fill="#c8664c" stroke="${OUT}" stroke-width="6"/>
      ${[0, 1, 2].map(r => `<path d="M${x - 84},${y - 18 - r * 26} H${x + 84}" stroke="#a34b36" stroke-width="3"/>`).join('')}
      <path d="M${x - 40},${y} V${y - 40} a40,34 0 0 1 80,0 V${y}Z" fill="#2b1d14" stroke="${OUT}" stroke-width="5"/>
      <path d="M${x - 28},${y - 6} q28,-28 56,0" fill="#ff8c42" opacity=".85"/>
      ${[0, 1, 2].map(i => `<ellipse cx="${x - 20 + i * 20}" cy="${y - 10}" rx="12" ry="7" fill="#e9b872" stroke="${OUT}" stroke-width="3"/>`).join('')}`;
  }
  return s;
}

// casa do Amigos do Churrasco: churrasqueiras de tambor atrás da arquibancada, com fumaça subindo
function churrasco(yBase, t = 0) {
  let s = '';
  for (const [x, k] of [[90, 0], [300, 1], [780, 2], [990, 3]]) {
    const y = yBase - 60;
    for (let i = 0; i < 5; i++) {  // fumaça
      const fase = (t * 0.35 + i * 0.2 + k * 0.13) % 1, fy = y - 60 - fase * 260, fx = x + Math.sin(fase * 6 + k) * 26;
      s += `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="${(22 + fase * 40).toFixed(1)}" fill="#dee2e6" opacity="${(0.75 * (1 - fase)).toFixed(2)}"/>`;
    }
    s += `<path d="M${x - 46},${y + 70} l12,-40 M${x + 46},${y + 70} l-12,-40" stroke="${OUT}" stroke-width="8"/>
      <path d="M${x - 58},${y - 20} h116 a58,40 0 0 1 -116,0Z" fill="#495057" stroke="${OUT}" stroke-width="6"/>
      <path d="M${x - 62},${y - 20} h124" stroke="${OUT}" stroke-width="8"/><path d="M${x - 50},${y - 30} h100" stroke="#e63946" stroke-width="7" opacity=".8"/>`;
  }
  return s;
}

// casa do Estrela da Feira: barracas de feira atrás do campo e bandeirolas nas cores do time
function feira(yBase, t = 0) {
  const L = window._local, [c1, c2] = coresTime(L.nome);
  const lonas = [[c1, '#fff'], ['#e63946', '#fff'], [c2, c1], ['#2a9d8f', '#fff'], ['#ffbe0b', '#e76f51'], [c1, c2]];
  const frutas = ['#e63946', '#ffbe0b', '#6a994e', '#f77f00', '#8338ec'];
  let s = '';
  for (let i = 0; i < 6; i++) {
    const x = 20 + i * 180, y = yBase - 150 + (i % 2) * 18, [a, b] = lonas[i];
    s += `<g transform="translate(${x} ${y})">
      <path d="M8,40 V150 M152,40 V150" stroke="${OUT}" stroke-width="7"/>
      <rect x="0" y="105" width="160" height="40" fill="#b08968" stroke="${OUT}" stroke-width="5"/>
      ${[0, 1, 2, 3, 4, 5].map(k => `<circle cx="${20 + k * 24}" cy="100" r="11" fill="${frutas[(k + i) % 5]}" stroke="${OUT}" stroke-width="3"/>`).join('')}
      <path d="M-10,40 L20,0 H140 L170,40Z" fill="${a}" stroke="${OUT}" stroke-width="5"/>
      ${[0, 1, 2].map(k => `<path d="M${30 + k * 40},0 h20 l${8 + k * 4},40 h-20z" fill="${b}"/>`).join('')}
      <path d="M-10,40 L20,0 H140 L170,40Z" fill="none" stroke="${OUT}" stroke-width="5"/></g>`;
  }
  // varal de bandeirolas no céu, balançando
  let band = `<path d="M-20,250 Q540,${330 + Math.sin(t * 2) * 6} 1100,250" fill="none" stroke="${OUT}" stroke-width="4"/>`;
  for (let k = 0; k < 18; k++) {
    const x = k * 64 + 12, u = x / 1080, y = 250 + 4 * u * (1 - u) * 80 - 4;
    band += `<path d="M${x},${y} l30,0 l-15,${34 + Math.sin(t * 4 + k) * 4}z" fill="${k % 2 ? c1 : c2}" stroke="${OUT}" stroke-width="3"/>`;
  }
  return s + band;
}

// Kombi do Poeira (vista de lado, frente para a direita). Origem: chão, no meio.
function kombi({ t = 0, andando = false } = {}) {
  const roda = x => `<g transform="translate(${x} -46) rotate(${andando ? t * 720 : 0})"><circle r="46" fill="#222" stroke="${OUT}" stroke-width="6"/>
    <circle r="22" fill="#e9ecef" stroke="${OUT}" stroke-width="4"/><path d="M-14,0 H14 M0,-14 V14" stroke="${OUT}" stroke-width="4"/></g>`;
  const pula = andando ? Math.abs(Math.sin(t * 9)) * 6 : 0;
  return `<g transform="scale(1.15)"><ellipse cx="0" cy="0" rx="300" ry="22" fill="#00000033"/>
    <g transform="translate(0 ${-pula})">
    <path d="M-290,-60 V-250 Q-290,-300 -240,-300 H210 Q262,-300 280,-250 L300,-150 V-60 Q300,-40 280,-40 H-270 Q-290,-40 -290,-60Z" fill="${CORES.vinho}" stroke="${OUT}" stroke-width="8"/>
    <path d="M-290,-150 V-250 Q-290,-300 -240,-300 H210 Q262,-300 280,-250 L300,-150Z" fill="#fff4dc" stroke="${OUT}" stroke-width="8"/>
    <path d="M300,-150 L250,-110 L300,-70" fill="#fff4dc" stroke="${OUT}" stroke-width="6"/>
    ${[-260, -150, -40, 70].map(x => `<rect x="${x}" y="-280" width="94" height="80" rx="12" fill="#8ecae6" stroke="${OUT}" stroke-width="6"/>`).join('')}
    <path d="M185,-280 H235 Q262,-280 270,-250 L280,-200 H185Z" fill="#8ecae6" stroke="${OUT}" stroke-width="6"/>
    <path d="M-80,-140 V-50 M60,-140 V-50" stroke="${OUT}" stroke-width="5" opacity=".6"/>
    <text x="-20" y="-82" text-anchor="middle" font-family="Anton" font-size="52" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="7" paint-order="stroke">POEIRA FC</text>
    <circle cx="288" cy="-120" r="14" fill="#ffe066" stroke="${OUT}" stroke-width="4"/>
    <rect x="-250" y="-330" width="420" height="16" rx="6" fill="#6c757d" stroke="${OUT}" stroke-width="5"/>
    <rect x="-220" y="-372" width="110" height="44" rx="10" fill="#3a86ff" stroke="${OUT}" stroke-width="5"/>
    <circle cx="-40" cy="-354" r="26" fill="#fff" stroke="${OUT}" stroke-width="5"/><path d="M-50,-362 l10,-7 l10,7 l-4,12 h-12z" fill="${OUT}"/>
    <rect x="20" y="-366" width="120" height="36" rx="8" fill="#ffbe0b" stroke="${OUT}" stroke-width="5"/>
    ${roda(-170)}${roda(180)}</g></g>`;
}

// ------------------------------------------------------------ sede (Bar da Cida)
// Tudo na MESMA escala (1 pessoa ≈ 300 px de altura em s = 1): porta do bar ≈ 290, barraca ≈ 330, varal ≈ 310.
// Planos, de trás pra frente: morro → muro dos vizinhos → calçada (vai do muro até o meio-fio, passando ao
// lado do bar) → bar, varal e barraca EM CIMA da calçada → rua de terra, onde ficam o Tião e a Dona Cida.
const SEDE = { fundo: 1668, base: 1740, calcada: 1822, x0: 272, x1: 808, topo: 1160, pe: 1898 };
function sombraChao(cx, cy, rx, ry = 14, op = 0.22) { return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${op}"/>`; }

function sede(estrutura, { t = 0 } = {}) {
  const novo = estrutura.telhado;
  const { fundo, base, calcada, x0, x1, topo } = SEDE, lw = x1 - x0, cx = (x0 + x1) / 2;
  const px = 52, py = base - fundo - 14;                     // profundidade do prédio (parede lateral)
  const predio = !!estrutura.vestiario_predio;
  let s = `<g opacity=".93">${bairro(1450, { xMin: -420, xMax: 1500 })}</g>`;
  // muro dos vizinhos (plano de fundo), com sombra no pé
  s += `<rect x="-420" y="1452" width="${W + 840}" height="${fundo - 1452}" fill="#e3d5b8" stroke="${OUT}" stroke-width="4"/>
    <rect x="-420" y="1444" width="${W + 840}" height="12" fill="#cbb994" stroke="${OUT}" stroke-width="3"/>
    ${Array.from({ length: 21 }, (_, i) => `<path d="M${i * 95 - 400},1458 v${fundo - 1462}" stroke="#d3c3a0" stroke-width="3"/>`).join('')}
    <path d="M70,1520 q40,-12 90,0 t90,0" stroke="#e76f51" stroke-width="9" fill="none" opacity=".5"/>
    <path d="M860,1570 q40,-12 90,0 t90,0" stroke="#3a86ff" stroke-width="9" fill="none" opacity=".45"/>`;
  // calçada: do pé do muro até o meio-fio (lajotas convergindo = profundidade); depois a rua de terra
  s += `<path d="M-420,${fundo} H${W + 420} V${calcada} H-420Z" fill="#d2c9bd" stroke="${OUT}" stroke-width="4"/>
    <rect x="-420" y="${fundo}" width="${W + 840}" height="14" fill="#000" opacity=".1"/>
    ${Array.from({ length: 25 }, (_, i) => { const xa = W / 2 + (i - 12) * 78, xb = W / 2 + (i - 12) * 104; return `<path d="M${xa},${fundo} L${xb},${calcada}" stroke="#b8ad9f" stroke-width="3"/>`; }).join('')}
    <path d="M-420,${fundo + 42} H${W + 420} M-420,${fundo + 96} H${W + 420}" stroke="#b8ad9f" stroke-width="3"/>
    <rect x="-420" y="${calcada}" width="${W + 840}" height="18" fill="#a59a8c" stroke="${OUT}" stroke-width="4"/>
    <rect x="-420" y="${calcada + 18}" width="${W + 840}" height="${H - calcada + 400}" fill="url(#gterra)"/>
    <rect x="-420" y="${calcada + 18}" width="${W + 840}" height="16" fill="#000" opacity=".12"/>`;
  { const r = rng('rua-sede'); for (let i = 0; i < 9; i++) s += `<ellipse cx="${(r() * W).toFixed(0)}" cy="${(calcada + 40 + r() * 60).toFixed(0)}" rx="${(14 + r() * 26).toFixed(0)}" ry="${(4 + r() * 5).toFixed(0)}" fill="#8b4a22" opacity=".35"/>`; }
  // ---- o bar: sombra no chão, parede lateral (vai até o fundo da calçada) e fachada
  s += `<path d="M${x0 + 10},${base} L${x1},${base} L${x1 + px},${base - py} L${x1 + px + 46},${base - py + 16} L${x1 + 40},${base + 22} L${x0 + 30},${base + 22}Z" fill="#000" opacity=".2"/>`;
  s += `<path d="M${x1},${topo} l${px},${-py} V${base - py} L${x1},${base}Z" fill="#c9b48e" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M${x1 + 6},${topo + 60} l${px - 12},${-py * 0.9} M${x1 + 6},${topo + 250} l${px - 12},${-py * 0.9} M${x1 + 6},${topo + 440} l${px - 12},${-py * 0.9}" stroke="#b39d75" stroke-width="3"/>
    <rect data-v="Casa" x="${x0}" y="${topo}" width="${lw}" height="${base - topo}" fill="#f2e2c4" stroke="${OUT}" stroke-width="7"/>
    <rect x="${x0 + 4}" y="${base - 46}" width="${lw - 8}" height="42" fill="#d9c7a3"/>
    <path d="M${x0 + 4},${base - 46} H${x1 - 4}" stroke="#c4b08a" stroke-width="3"/>`;
  if (novo) s += `<path d="M${x0 - 36},${topo + 14} L${cx},${topo - 150} L${x1 + px + 30},${topo - py + 14} L${x1 + 36},${topo + 14}Z" fill="#d1495b" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M${x0 + 40},${topo - 30} H${x1 - 30} M${x0 + 140},${topo - 72} H${x1 - 120} M${x0 + 230},${topo - 112} H${x1 - 210}" stroke="#a23b4a" stroke-width="6"/>`;
  else s += `<path d="M${x0 - 22},${topo + 20} L${x0 - 12},${topo - 14} L${x1 + px + 22},${topo - py - 22} L${x1 + px + 22},${topo - py + 6} L${x1 + 18},${topo + 20}Z" fill="#9aa5b1" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${x0 + 30 + i * 62},${topo + 16} l8,${-30 - i * 0.6}" stroke="#7d8892" stroke-width="3"/>`).join('')}
    <rect x="${cx - 80}" y="${topo - 34}" width="92" height="30" fill="#6c757d" stroke="${OUT}" stroke-width="4" transform="rotate(-4 ${cx - 34} ${topo - 19})"/>
    <circle cx="${x1 - 70}" cy="${topo - 14}" r="9" fill="${OUT}"/>`;
  s += `<g class="rotulo"><rect data-v="Vert" x="${cx - 240}" y="${topo + 72}" width="480" height="96" rx="14" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="7"/>
    <text x="${cx}" y="${topo + 146}" text-anchor="middle" font-family="Anton" font-size="66" fill="${CORES.vinho}">BAR DA CIDA</text>
    <text x="${cx}" y="${topo + 210}" text-anchor="middle" font-family="Anton" font-size="32" fill="${OUT}" letter-spacing="4">SEDE SOCIAL · ${esc(window._sigla || '')}</text></g>`;
  // toldo listrado (avança sobre a calçada) e a sombra dele na fachada
  const ty = topo + 228;
  s += `<rect x="${x0 + 6}" y="${ty + 56}" width="${lw - 12}" height="34" fill="#000" opacity=".13"/>
    <path d="M${x0 - 4},${ty} H${x1 + 4} L${x1 + 22},${ty + 58} H${x0 - 22}Z" fill="#e63946" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
    ${Array.from({ length: 6 }, (_, i) => { const a = x0 - 4 + (i + 0.5) * ((lw + 8) / 6), b = x0 - 22 + (i + 0.5) * ((lw + 44) / 6), w = lw / 12; return `<path d="M${a - w / 2 + w / 2},${ty + 3} h${w / 2} L${b + w * 0.55},${ty + 55} h${-w * 0.55}Z" fill="#fff"/>`; }).join('')}
    <path d="M${x0 - 22},${ty + 58} H${x1 + 22} v10 q-${(lw + 44) / 12},14 -${(lw + 44) / 6},0 q-${(lw + 44) / 12},14 -${(lw + 44) / 6},0 q-${(lw + 44) / 12},14 -${(lw + 44) / 6},0 q-${(lw + 44) / 12},14 -${(lw + 44) / 6},0 q-${(lw + 44) / 12},14 -${(lw + 44) / 6},0 q-${(lw + 44) / 12},14 -${(lw + 44) / 6},0Z" fill="#c1121f" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>`;
  // porta (da altura de uma pessoa) e janelas com peitoril
  const dTop = base - 290, jTop = base - 268;
  s += `<rect x="${cx - 78}" y="${dTop - 8}" width="156" height="${base - dTop + 8}" fill="#4a2e12" stroke="${OUT}" stroke-width="6"/>
    <rect data-v="Casa" x="${cx - 66}" y="${dTop + 4}" width="132" height="${base - dTop - 4}" fill="#7a4d1f" stroke="${OUT}" stroke-width="4"/>
    <rect x="${cx - 50}" y="${dTop + 22}" width="100" height="100" rx="4" fill="none" stroke="#5c3812" stroke-width="5"/>
    <rect x="${cx - 50}" y="${dTop + 140}" width="100" height="120" rx="4" fill="none" stroke="#5c3812" stroke-width="5"/>
    <circle cx="${cx + 46}" cy="${base - 140}" r="8" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="3"/>
    <rect x="${cx - 92}" y="${base - 10}" width="184" height="16" fill="#b8ad9f" stroke="${OUT}" stroke-width="4"/>
    ${[x0 + 26, x1 - 26 - 148].map(x => `<rect x="${x - 6}" y="${jTop - 6}" width="160" height="150" fill="#fff4dc" stroke="${OUT}" stroke-width="5"/>
      <rect data-v="Vidro" x="${x + 4}" y="${jTop + 4}" width="140" height="130" fill="#8ecae6" stroke="${OUT}" stroke-width="4"/>
      <path d="M${x + 74},${jTop + 4} V${jTop + 134} M${x + 4},${jTop + 68} H${x + 144}" stroke="${OUT}" stroke-width="5"/>
      <path d="M${x + 14},${jTop + 14} l36,0 l-28,36z" fill="#fff" opacity=".5"/>
      <rect x="${x - 14}" y="${jTop + 144}" width="176" height="14" fill="#c97a40" stroke="${OUT}" stroke-width="4"/>`).join('')}`;
  // ---- varal (à esquerda) e barraca (à direita): em cima da calçada, ao lado do bar
  if (predio) s += vestiarioPredio(t, estrutura);
  if (estrutura.varal_camisas) s += varalCamisas(t, predio ? 1076 : 34);
  if (estrutura.lanchonete) s += lanchonete(estrutura.lanchonete, 836, base + 40);
  // ---- na rua (primeiro plano): mesa de plástico e engradado, na escala das pessoas
  const my = calcada + 62, mx = 122;
  s += sombraChao(mx, my + 86, 92, 11) + `<path d="M${mx - 64},${my + 16} l-12,68 M${mx + 64},${my + 16} l12,68" stroke="${OUT}" stroke-width="15" stroke-linecap="round"/>
    <path d="M${mx - 64},${my + 16} l-12,68 M${mx + 64},${my + 16} l12,68" stroke="#e9a800" stroke-width="8" stroke-linecap="round"/>
    <path d="M${mx - 88},${my} h176 l-10,18 h-156z" fill="#ffbe0b" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="${mx - 30}" y="${my - 40}" width="17" height="40" rx="5" fill="#6a994e" stroke="${OUT}" stroke-width="3"/><rect x="${mx - 27}" y="${my - 52}" width="11" height="14" rx="3" fill="#6a994e" stroke="${OUT}" stroke-width="3"/>
    <path d="M${mx + 8},${my - 30} h26 l-4,30 h-18z" fill="#fff" stroke="${OUT}" stroke-width="3"/>`;
  const ex = 942, ey = calcada + 76;
  s += sombraChao(ex + 58, ey + 72, 80, 10) + `<rect x="${ex}" y="${ey}" width="116" height="70" rx="4" fill="#e63946" stroke="${OUT}" stroke-width="5"/>
    <path d="M${ex},${ey + 24} h116 M${ex + 39},${ey + 24} v46 M${ex + 78},${ey + 24} v46" stroke="${OUT}" stroke-width="3"/>
    ${[0, 1, 2].map(i => `<rect x="${ex + 12 + i * 36}" y="${ey - 22}" width="18" height="38" rx="6" fill="#6a994e" stroke="${OUT}" stroke-width="3"/>`).join('')}`;
  // à noite a rua escurece (quem está na rua continua visível: tem poste de luz)
  return ceu(t) + s + (window._noite ? `<rect x="-2000" y="-2000" width="${W + 4000}" height="${H + 4000}" fill="#0b132b" opacity=".38"/>` : '');
}

// Prédio do vestiário (à esquerda do bar, na calçada): térreo, porta da altura de uma pessoa, basculante
// soltando vapor do chuveiro quente. Mesma perspectiva do bar (parede lateral à direita).
function vestiarioPredio(t = 0, estrutura = {}) {
  const x0 = -165, x1 = 150, base = SEDE.base, topo = base - 360, px = 36, py = 22, cx = (x0 + x1) / 2;
  let s = `<path d="M${x0 + 10},${base} H${x1} l${px + 30},${-py + 8} l-20,30 H${x0 + 20}Z" fill="#000" opacity=".18"/>
    <path d="M${x1},${topo} l${px},${-py} V${base - py} L${x1},${base}Z" fill="#b9c4cc" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="${x0}" y="${topo}" width="${x1 - x0}" height="${base - topo}" fill="#dfe7ec" stroke="${OUT}" stroke-width="7"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${x0 + 4},${topo + 40 + i * 52} H${x1 - 4}" stroke="#c8d3da" stroke-width="3"/>`).join('')}
    <path d="M${x0 - 20},${topo + 12} L${x0 - 8},${topo - 34} L${x1 + px + 14},${topo - py - 40} L${x1 + px + 14},${topo - py - 8} L${x1 + 16},${topo + 12}Z" fill="${estrutura.telhado ? '#d1495b' : '#9aa5b1'}" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
    <g class="rotulo"><rect x="${cx - 118}" y="${topo + 26}" width="236" height="58" rx="10" fill="${CORES.vinho}" stroke="${OUT}" stroke-width="6"/>
    <text x="${cx}" y="${topo + 68}" text-anchor="middle" font-family="Anton" font-size="38" fill="${CORES.amarelo}" letter-spacing="2">VESTIÁRIO</text></g>
    <rect x="${cx - 60}" y="${topo + 104}" width="120" height="34" rx="4" fill="#8ecae6" stroke="${OUT}" stroke-width="5"/>
    <path d="M${cx - 60},${topo + 121} H${cx + 60}" stroke="${OUT}" stroke-width="3"/>
    <rect x="${cx - 62}" y="${base - 286}" width="124" height="286" fill="#3a86ff" stroke="${OUT}" stroke-width="6"/>
    <rect x="${cx - 48}" y="${base - 270}" width="96" height="110" rx="4" fill="none" stroke="#2a6fd6" stroke-width="5"/>
    <circle cx="${cx + 40}" cy="${base - 140}" r="7" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="3"/>
    <rect x="${cx - 74}" y="${base - 10}" width="148" height="14" fill="#b8ad9f" stroke="${OUT}" stroke-width="4"/>`;
  for (let i = 0; i < 4; i++) { const f = (t * 0.35 + i * 0.25) % 1;   // vapor do chuveiro quente
    s += `<circle cx="${(cx - 30 + i * 20 + Math.sin(f * 6 + i) * 12).toFixed(1)}" cy="${(topo + 100 - f * 150).toFixed(1)}" r="${(12 + f * 22).toFixed(1)}" fill="#fff" opacity="${(0.75 * (1 - f)).toFixed(2)}"/>`; }
  return s;
}

// varal com as camisas do Poeira à venda (R$ 25): dois postes de madeira na calçada, à esquerda do bar
function varalCamisas(t = 0, x0 = 34) {
  const b = SEDE.base + 44, xa = x0, xb = x0 + 202, topo = b - 318, mx = (xa + xb) / 2;
  const camisa = (x, y, k) => `<g transform="translate(${x} ${y}) rotate(${Math.sin(t * 2 + k) * 4}) scale(1.12)">
      <path d="M-26,0 L-12,-6 Q0,4 12,-6 L26,0 L36,18 L24,24 L22,58 H-22 L-24,24 L-36,18Z" fill="${CORES.vinho}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="-22" y="26" width="44" height="10" fill="${CORES.amarelo}"/>
      <rect x="${k % 2 ? 4 : -16}" y="40" width="12" height="11" rx="2" fill="#c9a227" stroke="${OUT}" stroke-width="2"/>
      <path d="M-5,-5 v-9 M5,-5 v-9" stroke="#f1faee" stroke-width="3.5" stroke-linecap="round"/></g>`;
  let s = sombraChao(mx + 16, b + 4, 118, 9, 0.18);
  s += `<path d="M${xa},${b} V${topo} M${xb},${b} V${topo}" stroke="${OUT}" stroke-width="18" stroke-linecap="round"/>
    <path d="M${xa},${b} V${topo} M${xb},${b} V${topo}" stroke="#9c6644" stroke-width="10" stroke-linecap="round"/>
    <path d="M${xa - 3},${b - 60} v-150 M${xb - 3},${b - 90} v-120" stroke="#b98a62" stroke-width="3" stroke-linecap="round"/>
    <path d="M${xa},${topo + 12} Q${mx},${topo + 44} ${xb},${topo + 12}" fill="none" stroke="${OUT}" stroke-width="6"/>
    <path d="M${xa},${topo + 12} Q${mx},${topo + 44} ${xb},${topo + 12}" fill="none" stroke="#f1faee" stroke-width="3"/>`;
  s += camisa(mx - 62, topo + 36, 0) + camisa(mx, topo + 44, 1) + camisa(mx + 62, topo + 36, 2);
  // plaquinha de preço num cavalete, no chão
  s += `<path d="M${mx - 44},${b} l14,-96 M${mx + 44},${b} l-14,-96" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/>
    <g class="rotulo"><rect x="${mx - 78}" y="${b - 158}" width="156" height="92" rx="8" fill="#fff4dc" stroke="${OUT}" stroke-width="5"/>
    <text x="${mx}" y="${b - 124}" text-anchor="middle" font-family="Anton" font-size="23" fill="${OUT}">CAMISA DO POEIRA</text>
    <text x="${mx}" y="${b - 82}" text-anchor="middle" font-family="Anton" font-size="38" fill="${CORES.vinho}">R$ 25</text></g>`;
  return s;
}

// barraca de lanche: do tamanho de uma barraca de verdade (um pouco mais alta que uma pessoa).
// (x, yChao) = canto de baixo à esquerda; k = escala.
function lanchonete(nome, x = 836, yChao = SEDE.base + 40, k = 1) {
  k *= 1.4;   // barraca de 2,4 m de frente
  const txt = nome.length > 22 ? nome.replace('Lanchonete', 'Lanch.') : nome;
  const w = 226, tam = Math.min(30, 196 / Math.max(1, medir(txt, 1)));   // cabe sempre na placa
  return `<g transform="translate(${x} ${yChao}) scale(${k})">
    <path d="M10,0 H${w} l34,-20 l0,12 l-30,22 H24Z" fill="#000" opacity=".2"/>
    <path d="M${w},-150 l22,-14 V-14 L${w},0Z" fill="#a9825a" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="0" y="-150" width="${w}" height="150" fill="#d4a373" stroke="${OUT}" stroke-width="6"/>
    <path d="M10,-100 H${w - 10} M10,-50 H${w - 10}" stroke="#b98a62" stroke-width="3"/>
    <rect x="-10" y="-166" width="${w + 20}" height="20" fill="#f4e3c1" stroke="${OUT}" stroke-width="5"/>
    <path d="M8,-166 V-292 M${w - 8},-166 V-292" stroke="${OUT}" stroke-width="13" stroke-linecap="round"/>
    <path d="M8,-166 V-292 M${w - 8},-166 V-292" stroke="#9c6644" stroke-width="7" stroke-linecap="round"/>
    <rect x="16" y="-280" width="${w - 32}" height="112" fill="#3d2b1f"/>
    <text x="${w / 2}" y="-196" text-anchor="middle" font-size="58">🌭🥤</text>
    <path d="M-18,-292 H${w + 18} L${w + 32},-248 H-32Z" fill="#e63946" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    ${[0, 1, 2].map(i => `<path d="M${-18 + (w + 36) * (i * 2 + 1) / 6 - 2},-290 h${(w + 36) / 6} l${4 + i * 3},40 h${-(w + 64) / 6}Z" fill="#fff"/>`).join('')}
    <path d="M-18,-292 H${w + 18} L${w + 32},-248 H-32Z" fill="none" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <g class="rotulo"><rect x="${w / 2 - 108}" y="-346" width="216" height="50" rx="9" fill="#fff4dc" stroke="${OUT}" stroke-width="5"/>
    <text x="${w / 2}" y="${-321 + tam * 0.36}" text-anchor="middle" font-family="Anton" font-size="${tam}" fill="${CORES.vinho}">${esc(txt)}</text></g></g>`;
}

function fundoEscuro() {
  return `<rect width="${W}" height="${H}" fill="${CORES.marinho}"/>
    ${Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 173) % W}" cy="${(i * 311) % H}" r="${80 + (i % 4) * 40}" fill="#ffffff08"/>`).join('')}`;
}

Object.assign(window, { popPessoa, W, H, OUT, CORES, rng, clamp, easeOut, easeOutBack, prog, esc, medir, quebrar, pop, texto, pilula,
  tituloGrande, cartao, painelCaixa, cartaoPerfil, cartaoComentario, cartaoOpcao, iconeOpcao, tabelaCard, placarCanto,
  escudo, sigla, pessoa, PERSONAGENS, jogador, campo, cfX, cfK, cfC, cfF, refletorTorre, kombi, feira, caramelo, cone, varalCamisas, sombraChao, sede, arquibancada, trave, fundoEscuro, lanchonete, torcedores });

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
    <rect data-v="Vert" x="${-12 * k}" y="${-6 * k}" width="${24 * k}" height="${26 * k}" rx="${8 * k}" fill="${camisa}" stroke="${OUT}" stroke-width="${2.5 * k}"/>
    <circle data-v="Esfera" cy="${-14 * k}" r="${11 * k}" fill="${pele}" stroke="${OUT}" stroke-width="${2.5 * k}"/></g>`;
}

// arquibancadinha de madeira na vista aérea: 2 blocos de 3 degraus, um de cada lado do gol
const AEREO_BLOCOS = [[196, 462], [618, 884]], AEREO_FILAS = [738, 712, 686];   // enche da frente pra trás
// posições de assento conforme a capacidade (dois bancos -> arquibancada em volta)
function assentos(cap) {
  const pos = [];
  if (cap <= 500) {  // dois bancos de madeira atrás do gol
    // 4 fileiras por banco (sentados nos bancos e em pé atrás/na frente): atrás do gol fica cheio
    for (const y of AEREO_FILAS) for (const [x0, x1] of AEREO_BLOCOS) for (let i = 0; i < 18; i++)
      pos.push([x0 + 8 + (i + 0.5) * (x1 - x0 - 16) / 18, y]);
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
// copas das árvores em volta do campo (o tronco fica atrás do muro); a torcida sobe nelas quando lota
const ARVORES_ESTADIO = [[60, 548], [185, 566], [895, 566], [1020, 548], [540, 540]];
let LAJES = [];

function estadioAereo(estrutura, torcida, { t = 0, revelar = 1, torcidaAntes = 0, nome = '' } = {}) {
  const cap = estrutura.capacidade || 500;
  const grama = String(estrutura.gramado || '').startsWith('grama'), ruim = estrutura.gramado === 'grama_ruim';
  let s = ceu(t);
  // morro ao fundo (as lajes viram arquibancada quando lota)
  // o morro desce até o muro: a fileira de árvores do pé do morro fica logo atrás dele (sem faixa de chão no meio)
  s += `<g transform="translate(0 -176)">${bairro(780)}</g>`;
  LAJES = (window._lajes || []).map(([x, y, w]) => [x, y - 176, w]).filter(([, y]) => y > 200 && y < 580).sort((a, b) => b[1] - a[1]);
  // névoa leve no morro (está longe) e a mata escura de onde saem as árvores; o muro passa NA FRENTE delas
  s += copas(ARVORES_ESTADIO.map(([x, y], i) => [x, y, 58 + (i % 2) * 10, i % 3]), 'arv-estadio');
  s += chaoEstadio(estrutura);
  s += `<rect x="-10" y="644" width="${W + 20}" height="20" fill="#000" opacity=".18"/>
    <rect x="-10" y="610" width="${W + 20}" height="34" fill="#e9e1d1" stroke="${OUT}" stroke-width="5"/>
    <rect x="-10" y="604" width="${W + 20}" height="9" fill="#cfc6ba" stroke="${OUT}" stroke-width="3"/>
    <path d="M40,624 h120 M900,632 h130" stroke="#e76f51" stroke-width="8" opacity=".6"/><path d="M60,636 h80 M930,620 h80" stroke="#3a86ff" stroke-width="7" opacity=".55"/>
    <text x="${W / 2}" y="638" text-anchor="middle" font-family="Anton" font-size="26" fill="${CORES.vinho}" letter-spacing="6">${esc(nome.toUpperCase())}</text>`;
  // arquibancada
  if (cap <= 500) s += AEREO_BLOCOS.map(([a, b]) => `<path d="M${a + 6},760 H${b + 18} l14,-10 V690 H${a + 20}Z" fill="#000" opacity=".16"/>
      <rect x="${a}" y="676" width="${b - a}" height="82" fill="#8a5a3c" stroke="${OUT}" stroke-width="4"/>
      <path d="M${a + 6},676 V758 M${b - 6},676 V758 M${(a + b) / 2},676 V758" stroke="#6f472e" stroke-width="4"/>
      ${AEREO_FILAS.map(y => `<rect x="${a - 5}" y="${y + 8}" width="${b - a + 10}" height="9" rx="3" fill="#c79a6b" stroke="${OUT}" stroke-width="3"/>`).join('')}
      <rect x="${a - 3}" y="668" width="${b - a + 6}" height="8" rx="3" fill="#9c6644" stroke="${OUT}" stroke-width="3"/>`).join('');
  else {
    s += `<path d="M230,${cap > 2000 ? 620 : 680} H850 L840,750 H240Z" fill="${cap > 2000 ? '#adb5bd' : '#b08968'}" stroke="${OUT}" stroke-width="5"/>`;
    for (const lado of [-1, 1]) s += `<path d="M${xBorda(790, lado) + lado * 30},790 L${xBorda(790, lado) + lado * (cap > 2000 ? 150 : 110)},790 L${xBorda(1680, lado) + lado * (cap > 2000 ? 190 : 140)},1680 L${xBorda(1680, lado) + lado * 30},1680Z" fill="${cap > 2000 ? '#adb5bd' : '#b08968'}" stroke="${OUT}" stroke-width="5"/>`;
  }
  // campo (com sombra projetada nas bordas, para descolar do chão)
  const { yTopo, yBase, xTopo, xBase } = CAMPO;
  s += `<path d="M${xTopo[0] + 6},${yTopo + 10} H${xTopo[1] + 14} L${xBase[1] + 22},${yBase + 14} H${xBase[0] + 8}Z" fill="#000" opacity=".16"/>`;
  s += `<path d="M${xTopo[0]},${yTopo} H${xTopo[1]} L${xBase[1]},${yBase} H${xBase[0]}Z" fill="${ruim ? '#8fa94a' : grama ? CORES.grama1 : CORES.terra1}" stroke="${OUT}" stroke-width="6"/>`;
  if (grama) for (let i = 0; i < 6; i++) { const y0 = yTopo + i * (yBase - yTopo) / 6, y1 = y0 + (yBase - yTopo) / 12; s += `<path d="M${xBorda(y0, -1)},${y0} H${xBorda(y0, 1)} L${xBorda(y1, 1)},${y1} H${xBorda(y1, -1)}Z" fill="${CORES.grama2}"/>`; }
  if (ruim) { const r = rng('carecas-aereo'); s += carecas(() => { const y = yTopo + 20 + r() * (yBase - yTopo - 40); return [xBorda(y, -1) + 20 + r() * (xBorda(y, 1) - xBorda(y, -1) - 40), y, (xBorda(y, 1) - xBorda(y, -1)) / m(60)]; }, 26); }
  else { const r = rng('aereo'); for (let i = 0; i < 18; i++) s += `<ellipse cx="${200 + r() * 680}" cy="${800 + r() * 850}" rx="${12 + r() * 26}" ry="${4 + r() * 7}" fill="#8b4a22" opacity=".45"/>`; }
  const wT = xTopo[1] - xTopo[0], wB = xBase[1] - xBase[0];
  const lc = grama ? '#ffffffdd' : '#ffffff77', ym = yTopo + (yBase - yTopo) * wT / (wT + wB);  // meio do campo em perspectiva
  s += `<path d="M${xBorda(ym, -1)},${ym} H${xBorda(ym, 1)}" stroke="${lc}" stroke-width="6"/>
    <ellipse cx="${W / 2}" cy="${ym}" rx="104" ry="40" fill="none" stroke="${lc}" stroke-width="6"/><circle cx="${W / 2}" cy="${ym}" r="6" fill="${lc}"/>
    <path d="M420,${yTopo} L408,${yTopo + 62} H672 L660,${yTopo}" fill="none" stroke="${lc}" stroke-width="5"/>
    <path d="M300,${yBase} L346,${yBase - 215} H734 L780,${yBase}" fill="none" stroke="${lc}" stroke-width="6"/>
    <path d="M490,${yTopo} V${yTopo - 40} H590 V${yTopo}" fill="none" stroke="#fff" stroke-width="7"/>`;
  if (estrutura.rede) s += Array.from({ length: 6 }, (_, i) => `<path d="M${492 + i * 19},${yTopo - 38} V${yTopo}" stroke="#fff" stroke-width="2" opacity=".8"/>`).join('');
  if (estrutura.banco_reservas) { const k = (xBorda(1050, 1) - xBorda(1050, -1)) / m(CAMPO_LARG);   // 3 m na escala do campo (60 m de largura)
    s += `<g transform="translate(${xBorda(1050, 1) + 26} 1050) rotate(66) scale(${k.toFixed(3)})">${bancoReservas(0, 0)}</g>`; }
  s += entornoAereo(estrutura);
  // torcida desenhada: assentos primeiro, depois as faixas de "não cabe mais"
  const seats = assentos(cap), lugares = seats.length;
  // até lotar: proporcional aos lugares (a arquibancada enche de verdade); depois, as faixas de "não cabe mais"
  const vis = n => n <= cap ? Math.round(lugares * n / cap) : lugares + bonecos(n) - bonecos(cap);
  const total = vis(Math.min(torcida, 1e7));
  const visiveis = Math.round(vis(torcidaAntes) + (total - vis(torcidaAntes)) * revelar);
  const ex = posicoesExtras();
  const ordem = [...seats.slice(0, Math.min(seats.length, lugares)).map(p => [...p, 'arq'])];
  for (const [faixa, tam] of FAIXAS_TORCIDA) ordem.push(...ex[faixa].slice(0, tam).map(p => [...p, faixa]));
  const r = rng('povo');
  const pessoas = ordem.slice(0, visiveis).map((p, i) => ({ x: p[0], y: p[1], i, faixa: p[2], rr: rng('p' + i) }));
  pessoas.sort((a, b) => a.y - b.y);
  s += pessoas.map(p => boneco(p.x, p.y, p.rr, { torcendo: true, t, i: p.i, zoom: { arvore: 1.35, laje: 1.5, muro: 1.15 }[p.faixa] || 1 })).join('');
  // gol da ponta de cá (visto por trás, maior porque está perto da câmera)
  { const gx = W / 2, gy = yBase, gw = 91, gh = 74;
    s += `<ellipse cx="${gx}" cy="${gy + 30}" rx="${gw + 6}" ry="9" fill="#000" opacity=".15"/>`;
    if (estrutura.rede) s += `<path d="M${gx - gw},${gy - gh} L${gx - gw - 8},${gy + 28} H${gx + gw + 8} L${gx + gw},${gy - gh}Z" fill="#ffffff22"/>`
      + Array.from({ length: 10 }, (_, i) => { const u = (i + 0.5) / 10, xa = gx - gw + u * 2 * gw, xb = gx - gw - 8 + u * (2 * gw + 16); return `<path d="M${xa},${gy - gh} L${xb},${gy + 28}" stroke="#fff" stroke-width="2" opacity=".75"/>`; }).join('')
      + [0.25, 0.5, 0.75].map(u => `<path d="M${gx - gw - 8 * u},${gy - gh + u * (gh + 28)} H${gx + gw + 8 * u}" stroke="#fff" stroke-width="2" opacity=".75"/>`).join('')
      + `<path d="M${gx - gw - 8},${gy + 28} H${gx + gw + 8}" stroke="#fff" stroke-width="3" opacity=".8"/>`;
    s += `<path d="M${gx - gw},${gy} V${gy - gh} H${gx + gw} V${gy}" fill="none" stroke="${OUT}" stroke-width="15" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M${gx - gw},${gy} V${gy - gh} H${gx + gw} V${gy}" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>`; }
  s += alambrado(1790);
  return s;
}
// chão em volta do campo: grama com manchas, trilha de terra até o portão e alambrado no primeiro plano
function chaoEstadio(estrutura) {
  let s = `<defs><linearGradient id="gchaoAereo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d9b4e"/><stop offset="1" stop-color="#93ad5c"/></linearGradient></defs>
    <rect x="-10" y="600" width="${W + 20}" height="${H - 600}" fill="url(#gchaoAereo)"/>`;
  const r = rng('chao-aereo');
  for (let i = 0; i < 26; i++) {
    const x = r() * W, y = 680 + r() * 1220;
    if (x > xBorda(y, -1) - 30 && x < xBorda(y, 1) + 30) continue;  // fora do campo
    s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(30 + r() * 60).toFixed(0)}" ry="${(8 + r() * 14).toFixed(0)}" fill="${r() > 0.5 ? '#6f8c45' : '#a3bb6a'}" opacity=".7"/>`;
  }
  for (let i = 0; i < 40; i++) {  // tufos de capim
    const x = r() * W, y = 700 + r() * 1200;
    if (x > xBorda(y, -1) - 20 && x < xBorda(y, 1) + 20) continue;
    s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} l-6,-14 M${x.toFixed(0)},${y.toFixed(0)} l1,-17 M${x.toFixed(0)},${y.toFixed(0)} l7,-13" stroke="#4f6f2f" stroke-width="3" stroke-linecap="round"/>`;
  }
  // trilha de terra do pé do morro até o campo
  s += `<path d="M${W / 2 - 60},${H} C${W / 2 - 40},1850 ${W / 2 + 20},1800 ${W / 2 + 10},1712 L${W / 2 + 70},1712 C${W / 2 + 90},1800 ${W / 2 + 40},1850 ${W / 2 + 60},${H}Z" fill="#c9a26b" opacity=".85"/>`;
  return s;
}
// profundidade na vista aérea: cerca de madeira e árvores dos dois lados, crescendo conforme chegam perto da câmera
function entornoAereo(estrutura = {}) {
  let s = '';
  const obra = estrutura.obra_arquibancada;
  if (obra) s += obraArquibancadaAerea(Math.min(1, ((obra.feitos || 0) + 1) / ((obra.jogos || 3) + 1)));
  for (const lado of obra ? [1] : [-1, 1]) {
    const xf = y => xBorda(y, lado) + lado * (58 + (y - 760) * 0.085);
    const ys = []; for (let y = 700, passo = 46; y < 1760; y += passo, passo *= 1.13) ys.push(y);
    // travessas (duas) e mourões
    s += `<path d="M${xf(ys[0])},${ys[0] - 22} L${xf(1760)},${1760 - 62}" stroke="${OUT}" stroke-width="7"/><path d="M${xf(ys[0])},${ys[0] - 22} L${xf(1760)},${1760 - 62}" stroke="#b08968" stroke-width="3.5"/>
      <path d="M${xf(ys[0])},${ys[0] - 10} L${xf(1760)},${1760 - 28}" stroke="${OUT}" stroke-width="7"/><path d="M${xf(ys[0])},${ys[0] - 10} L${xf(1760)},${1760 - 28}" stroke="#b08968" stroke-width="3.5"/>`;
    for (const y of ys) { const k = escalaY(y), x = xf(y); s += `<ellipse cx="${x + 8 * k}" cy="${y}" rx="${14 * k}" ry="${4 * k}" fill="#000" opacity=".2"/>
      <path d="M${x},${y} v${-58 * k}" stroke="${OUT}" stroke-width="${11 * k}" stroke-linecap="round"/><path d="M${x},${y} v${-58 * k}" stroke="#9c6644" stroke-width="${6 * k}" stroke-linecap="round"/>`; }
  }
  // árvores fora da cerca: pequenas lá no fundo, grandes aqui perto
  for (const [x, y, R, k] of [[118, 838, 34, 0], [972, 846, 36, 1], [64, 1010, 48, 2], [1030, 1040, 50, 0], [18, 1300, 70, 1], [1068, 1340, 72, 2]])
    if (!(obra && x < 540)) s += arvore(x, y, R, 'lado' + x, k);
  return s;
}
function alambrado(y = 1780) {
  let s = `<path d="M-10,${y} H${W + 10}" stroke="${OUT}" stroke-width="7"/><path d="M-10,${y} H${W + 10}" stroke="#adb5bd" stroke-width="3"/>`;
  for (let x = 20; x < W; x += 120) s += `<path d="M${x},${y + 120} V${y - 6}" stroke="${OUT}" stroke-width="10" stroke-linecap="round"/><path d="M${x},${y + 120} V${y - 6}" stroke="#ced4da" stroke-width="5" stroke-linecap="round"/>`;
  for (let x = -20; x < W + 20; x += 22) s += `<path d="M${x},${y} l22,22 M${x + 22},${y} l-22,22" stroke="#adb5bd" stroke-width="2" opacity=".7"/>`;
  return s;
}
Object.assign(window, { estadioAereo, bonecos, FAIXAS_TORCIDA, copas, arvore, alambrado });

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
    <circle class="vol3d" r="${r}" fill="url(#g3dEsfera)" opacity="0"/><circle r="${r}" fill="none" stroke="${OUT}" stroke-width="${r * 0.09}"/>`;
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
    <path data-v="Corpo" d="${forma}" fill="${vinho}" stroke="${OUT}" stroke-width="12" stroke-linejoin="round"/>
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

// gramado ruim ("grama de segunda divisão"): falhas de terra no meio da grama, tufos e areia na pequena área.
// pos(i) → [x, y, escala da profundidade]
function carecas(pos, n = 24) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y, k] = pos(i), r = rng('careca-f' + i), rx = m(1.2 + r() * 2.8) * k, ry = rx * (0.22 + r() * 0.12);   // falha de 2,5 a 8 m
    s += `<path d="M${(x - rx).toFixed(1)},${y.toFixed(1)} q${(rx * 0.3).toFixed(1)},${(-ry * 1.3).toFixed(1)} ${rx.toFixed(1)},${(-ry).toFixed(1)} q${(rx * 0.8).toFixed(1)},${(-ry * 0.2).toFixed(1)} ${rx.toFixed(1)},${(ry * 0.9).toFixed(1)} q${(-rx * 0.5).toFixed(1)},${(ry * 1.1).toFixed(1)} ${(-rx * 1.1).toFixed(1)},${(ry * 0.9).toFixed(1)} q${(-rx * 0.8).toFixed(1)},${(-ry * 0.1).toFixed(1)} ${(-rx * 0.9).toFixed(1)},${(-ry * 0.8).toFixed(1)}z" fill="#a9743f" opacity=".95"/>
      <path d="M${(x - rx * 0.4).toFixed(1)},${(y - ry * 0.2).toFixed(1)} l${(-m(0.05) * k).toFixed(1)},${(-m(0.15) * k).toFixed(1)} M${(x + rx * 0.3).toFixed(1)},${y.toFixed(1)} l${(m(0.04) * k).toFixed(1)},${(-m(0.18) * k).toFixed(1)}" stroke="#4f6f2f" stroke-width="${Math.max(1, m(0.03) * k).toFixed(1)}" stroke-linecap="round"/>`;
  }
  return s;
}

// ônibus velho do Poeira (Segunda Divisão: viagens mais longas): 11 m × 3,2 m, vinho e amarelo, amassado e com
// ferrugem; o letreiro diz "POEIRA FC" e o destino "2ª DIVISÃO". Pé no y = 0, frente à direita.
function onibus({ t = 0, andando = false } = {}) {
  const L = m(11), A = m(3.2), rr = m(0.5), pula = andando ? Math.abs(Math.sin(t * 8)) * 6 : 0;
  const roda = x => `<g transform="translate(${x} ${-rr}) rotate(${andando ? t * 600 : 0})"><circle r="${rr}" fill="#222" stroke="${OUT}" stroke-width="8"/><circle r="${rr * 0.45}" fill="#adb5bd" stroke="${OUT}" stroke-width="5"/><path d="M${-rr * 0.3},0 H${rr * 0.3} M0,${-rr * 0.3} V${rr * 0.3}" stroke="${OUT}" stroke-width="5"/></g>`;
  const x0 = -L / 2, x1 = L / 2, yT = -A, yJ = -A * 0.78, yJb = -A * 0.5;
  let s = `<ellipse cx="0" cy="0" rx="${L * 0.55}" ry="26" fill="#000" opacity=".22"/><g transform="translate(0 ${-pula})">
    <path d="M${x0},${-rr * 0.9} V${yT + 40} Q${x0},${yT} ${x0 + 40},${yT} H${x1 - 70} Q${x1 - 10},${yT} ${x1},${yT + 80} V${-rr * 0.9} Z" fill="${CORES.vinho}" stroke="${OUT}" stroke-width="10"/>
    <rect x="${x0}" y="${yJb + 10}" width="${L}" height="${m(0.45)}" fill="${CORES.amarelo}" stroke="${OUT}" stroke-width="6"/>`;
  for (let i = 0; i < 7; i++) { const wx = x0 + 60 + i * (L - 330) / 7; s += `<rect x="${wx}" y="${yJ}" width="${(L - 330) / 7 - 18}" height="${yJb - yJ - 20}" rx="10" fill="#8ecae6" stroke="${OUT}" stroke-width="7"/>`; }
  s += `<path d="M${x1 - 230},${yJ} H${x1 - 60} Q${x1 - 20},${yJ} ${x1 - 14},${yJ + 50} V${yJb - 20} H${x1 - 230}Z" fill="#8ecae6" stroke="${OUT}" stroke-width="7"/>
    <rect x="${x1 - 210}" y="${yJb + 10}" width="110" height="${-yJb - rr * 0.9 - 10}" fill="#6c757d" stroke="${OUT}" stroke-width="6"/>
    <rect x="${x0 + 80}" y="${yT + 14}" width="${L * 0.46}" height="58" rx="8" fill="#111" stroke="${OUT}" stroke-width="6"/>
    <text x="${x0 + 80 + L * 0.23}" y="${yT + 60}" text-anchor="middle" font-family="Anton" font-size="44" fill="#ffd166" letter-spacing="3">2ª DIVISÃO · VÁRZEA</text>
    <text x="${(x0 + x1) / 2 - 80}" y="${yJb + m(0.42)}" text-anchor="middle" font-family="Anton" font-size="${m(0.38)}" fill="${CORES.vinho}">POEIRA FC</text>
    <ellipse cx="${x0 + 300}" cy="${-rr * 1.6}" rx="70" ry="26" fill="#8b4a22" opacity=".55"/><ellipse cx="${x0 + 900}" cy="${yJb + 120}" rx="40" ry="16" fill="#8b4a22" opacity=".45"/>
    <path d="M${x0 + 1300},${yJb + 60} q30,30 10,70" stroke="${OUT}" stroke-width="5" fill="none" opacity=".6"/>
    <circle cx="${x1 - 12}" cy="${-rr * 1.6}" r="20" fill="#ffe066" stroke="${OUT}" stroke-width="5"/>
    ${roda(x0 + m(2.2))}${roda(x1 - m(2.4))}</g>`;
  if (andando) for (let i = 0; i < 4; i++) { const f = (t * 1.5 + i / 4) % 1; s += `<circle cx="${x0 - 40 - f * 160}" cy="${-30 - f * 80}" r="${20 + f * 50}" fill="#adb5bd" opacity="${(0.5 * (1 - f)).toFixed(2)}"/>`; }
  return s;
}

// ------------------------------------------------------------ escala real (como no detetive: tudo em metros)
// 1 pessoa (1,75 m) = 300 px em s = 1 → PX_M ≈ 171 px por metro. Todo objeto é desenhado em s = 1 nessa
// escala e, na cena, recebe o MESMO fator de escala de uma pessoa na mesma profundidade.
const PX_M = 300 / 1.75;
const m = v => v * PX_M;
// [nome, medida real (m), eixo ('h' altura / 'w' largura), desenho em s = 1] — conferido por video/regua.mjs
function MEDIDAS_REAIS(E) {
  return [
    ['pessoa (jogador)', 1.75, 'h', pessoa({ camisa: '#fff' }, 0, {}).replace(/<text[^>]*>[^<]*<\/text>/g, '')],
    ['trave: largura', 7.32, 'w', trave(0, 0, 1, false)],
    ['trave: altura', 2.44, 'h', trave(0, 0, 1, false)],
    ['banco de reservas: comprimento', 3.0, 'w', bancoReservas(0, 0, 1)],
    ['banco (de frente): comprimento', 3.0, 'w', bancoReservasFrente().replace(/<ellipse[^>]*\/>/, '')],
    ['banco (de frente): encosto', 0.85, 'h', bancoReservasFrente().replace(/<ellipse[^>]*\/>/, '')],
    ['ônibus: comprimento', 11.0, 'w', onibus({}).replace(/<ellipse cx="0"[^>]*\/>/, '')],
    ['ônibus: altura', 3.2, 'h', onibus({}).replace(/<ellipse cx="0"[^>]*\/>/, '')],
    ['Kombi: comprimento', 4.3, 'w', kombi({}).replace(/<ellipse[^>]*\/>/, '')],
    ['Kombi: altura com bagageiro', 2.45, 'h', kombi({}).replace(/<ellipse[^>]*\/>/, '')],
    ['Caramelo (vira-lata): altura', 0.7, 'h', caramelo(0).replace(/<ellipse[^>]*\/>/, '')],
    ['cone de treino', 0.38, 'h', cone(0, 0, 1)],
    ['barraca: largura', 2.4, 'w', lanchonete('Barraca', 0, 0, 1)],
  ];
}
Object.assign(window, { PX_M, m, MEDIDAS_REAIS, onibus, carecas });
