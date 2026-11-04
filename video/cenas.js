// Composição das cenas. Cada tipo de cena do roteiro tem uma função
// (t, dur, cena, E) -> SVG, onde t é o tempo local em segundos e E é o estado visual.

const NOME = E => E.clube.nome;
const nossoEscudo = E => escudo(NOME(E), { nosso: true, sg: E.clube.sigla });

function camera(t, dur, conteudo, { z0 = 1, z1 = 1.06, cx = W / 2, cy = H / 2 } = {}) {
  const z = z0 + (z1 - z0) * easeOut(clamp(t / Math.max(dur, 0.1)));
  return `<g transform="translate(${cx} ${cy}) scale(${z}) translate(${-cx} ${-cy})">${conteudo}</g>`;
}

function narrador(t, E, x = 300, y = 1720, s = 1.45, extra = {}) { return pessoa({ ...PERSONAGENS.narrador, ...extra }, t, { x, y, s }); }
function presidente(t, E, x = 780, y = 1720, s = 1.45, extra = {}) { return pessoa({ ...PERSONAGENS.presidente, ...extra }, t, { x, y, s, fase: 1.3 }); }

function elencoLinha(t, E, y = 1500, s = 0.9, numeros = null) {
  const nums = numeros || Object.keys(E.elenco).sort((a, b) => a - b).slice(0, 11);
  const tras = nums.filter((_, i) => i % 2 === 0), frente = nums.filter((_, i) => i % 2 === 1);
  let out = '';
  [[tras, y, 0.92], [frente, y + 150, 1.05]].forEach(([fila, yy, k], f) => {
    fila.forEach((n, i) => {
      const x = W / 2 + (i - (fila.length - 1) / 2) * (f ? 205 : 180);
      out += pop(t, 0.15 + (i * 2 + f) * 0.07, x, yy, pessoa(jogador(n, E), t, { s: s * k, fase: i + f }));
    });
  });
  return out;
}

const TIPOS = {
  abertura(t, d, c, E) {
    const dia = (c.texto_tela[0] || '').replace('DIA ', '');
    let s = camera(t, d, campo(E.estrutura, { t, torcida: c.dados.antes ?? 0, nome: NOME(E) }));
    s += narrador(t, E, 540, 1870, 1.8, { pose: 'acena' });
    s += pop(t, 0.1, W / 2, 470, tituloGrande(`DIA ${dia}`, { tam: 230 }));
    if (c.texto_tela[1]) s += pop(t, 0.5, W / 2, 640, pilula(c.texto_tela[1], { tam: 54, rot: 2 }));
    return s;
  },
  campo(t, d, c, E) {
    let s = camera(t, d, campo(E.estrutura, { t, torcida: 0, nome: NOME(E) }), { z0: 1.25, z1: 1.0, cy: 1000 });
    s += pop(t, 0.3, W / 2, 420, pilula(c.texto_tela[0], { tam: 60, bg: CORES.laranja, cor: OUT, rot: -2 }));
    return s;
  },
  presidente(t, d, c, E) {
    let s = camera(t, d, sede(E.estrutura, { t }));
    s += presidente(t, E, 540, 1900, 2.0, { pose: 'caixa', expr: 'serio' });
    s += pop(t, 0.2, W / 2, 330, pilula(c.texto_tela[0], { tam: 64, bg: CORES.vinho }));
    if (c.texto_tela[1]) s += pop(t, 0.7, W / 2, 440, pilula(c.texto_tela[1], { tam: 34, bg: CORES.amarelo, cor: OUT, rot: 1 }));
    return s;
  },
  elenco(t, d, c, E) {
    let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E) }), { z0: 1.05, z1: 1.12 });
    s += elencoLinha(t, E, 1560, 1.05);
    s += pop(t, 0.1, W / 2, 420, tituloGrande(c.texto_tela[0], { tam: 150, rot: -3 }));
    return s;
  },
  jogador(t, d, c, E) {
    const n = c.dados.numero;
    let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E) }), { z0: 1.15, z1: 1.2 });
    s += pessoa(jogador(n, E, { pose: n === '9' ? 'normal' : n === '1' ? 'comemora' : 'normal' }), t, { x: 540, y: 1960, s: 2.3 });
    s += pop(t, 0.1, W / 2, 330, pilula(c.texto_tela[0], { tam: 70, bg: CORES.laranja, cor: OUT, rot: -3 }));
    if (c.texto_tela[1]) {
      const linhas = quebrar(c.texto_tela[1], 40, 760, 'Anton');
      s += pop(t, 0.5, W / 2, 450, linhas.map((l, i) => `<g transform="translate(0 ${i * 62})">${pilula(l, { tam: 40, rot: 1 })}</g>`).join(''));
    }
    return s;
  },
  regra_torcida(t, d, c, E) {
    const tor = c.dados.torcida || 0;
    let s = camera(t, d, campo(E.estrutura, { t, torcida: tor, nome: NOME(E) }), { z0: 1.35, z1: 1.3, cy: 820 });
    s += pop(t, 0.1, W / 2, 470, cartaoPerfil(NOME(E), E.clube.instagram, tor, nossoEscudo(E)));
    s += pop(t, 1.4, W / 2, 820, pilula(c.texto_tela[1] || '', { tam: 64, bg: CORES.laranja, cor: OUT, rot: -3 }));
    s += narrador(t, E, 820, 1760, 1.3, { expr: tor ? 'feliz' : 'triste', pose: 'normal', microfone: false });
    return s;
  },
  torcida(t, d, c, E) {
    let s = camera(t, d, campo(E.estrutura, { t, torcida: c.dados.torcida, nome: NOME(E) }), { z0: 1.3, z1: 1.18, cy: 800 });
    s += pop(t, 0.1, W / 2, 330, pilula(c.texto_tela[0], { tam: 72, bg: CORES.laranja, cor: OUT, rot: -2 }));
    if (c.texto_tela[1]) s += pop(t, 0.8, 780, 450, pilula(c.texto_tela[1], { tam: 60, bg: '#e63946', rot: 6 }));
    return s;
  },
  regra_caixa(t, d, c, E) { return TIPOS.caixa(t, d, { ...c, dados: { de: 0, caixa: c.dados.caixa || 0 } }, E, true); },
  caixa(t, d, c, E, regra = false) {
    const p = easeOut(prog(t, 0.6, Math.min(2.2, d * 0.6)));
    const v = (c.dados.de || 0) + ((c.dados.caixa || 0) - (c.dados.de || 0)) * p;
    let s = camera(t, d, sede(E.estrutura, { t }));
    s += presidente(t, E, 760, 1760, 1.5, { pose: 'caixa' });
    s += pop(t, 0.1, W / 2, 380, painelCaixa(v, E.moeda));
    s += pop(t, regra ? 1.2 : 0.4, W / 2, 580, pilula(regra ? c.texto_tela[1] : c.texto_tela[0], { tam: 60, bg: '#e63946', rot: -3 }));
    if (!regra && c.texto_tela[1]) s += pop(t, 0.9, W / 2, 690, pilula(c.texto_tela[1], { tam: 40, bg: CORES.creme, cor: '#e63946', rot: 2 }));
    for (let i = 0; i < 7; i++) {
      const tt = (t * 0.9 + i * 0.37) % 2.2;
      if (t > (regra ? 1.4 : 0.5)) s += `<text x="${180 + i * 110}" y="${1500 - tt * 380}" font-size="70" fill="#e63946" opacity="${clamp(1 - tt / 2.2)}">♥</text>`;
    }
    return s;
  },
  liga(t, d, c, E) {
    let s = fundoEscuro();
    const tab = (c.dados.tabela || []).map((l, i) => ({ ...l, pos: i + 1 }));
    s += pop(t, 0.1, W / 2, 640, tabelaCard(tab, NOME(E), c.texto_tela[0] || 'Liga'));
    s += pop(t, 1.0, W / 2, 1400, pilula(c.texto_tela[1] || '', { tam: 60, bg: CORES.laranja, cor: OUT, rot: -2 }));
    if (c.dados.adversario) s += pop(t, 1.6, W / 2, 1640, `<g transform="translate(-200 0) scale(.75)">${nossoEscudo(E)}</g>
      ${texto('X', { tam: 110 })}<g transform="translate(200 0) scale(.75)">${escudo(c.dados.adversario)}</g>`);
    return s;
  },
  comentario(t, d, c, E) {
    let s = camera(t, d, sede(E.estrutura, { t }));
    s += narrador(t, E, 280, 1760, 1.35, { pose: 'microfone' });
    s += presidente(t, E, 800, 1760, 1.35);
    s += pop(t, 0.1, W / 2, 330, pilula(c.texto_tela[0], { tam: 50, bg: '#2e8b57', rot: -2 }));
    const cm = c.dados.comentario;
    s += pop(t, 0.4, W / 2, 620, cartaoComentario(cm.usuario, cm.texto, cm.curtidas));
    return s;
  },
  obra(t, d, c, E) {
    const virada = Math.min(1.6, d * 0.35);
    const est = t < virada ? c.dados.antes : c.dados.depois;
    const acoes = c.dados.acoes || [];
    const noCampo = acoes.some(a => ['grama', 'arquibancada', 'refletores', 'rede'].includes(a));
    let s = camera(t, d, noCampo ? campo(est, { t, nome: NOME(E), torcida: 0 }) : sede(est, { t }));
    if (t >= virada && t < virada + 0.5) {
      const p = (t - virada) / 0.5;
      for (let i = 0; i < 10; i++) s += `<circle cx="${100 + i * 95}" cy="${1000 + Math.sin(i) * 180}" r="${60 + p * 120}" fill="#fff" opacity="${0.8 * (1 - p)}"/>`;
    }
    (c.dados.novos_jogadores || []).forEach((j, i) => {
      const num = Object.keys(E.elenco).find(k => E.elenco[k].nome === j.nome) || '12';
      s += pop(t, virada + 0.2, 540 + i * 200, 1880, pessoa(jogador(num, E, { pose: 'comemora' }), t, { s: 1.9 }));
    });
    s += pop(t, 0.1, W / 2, 330, pilula(c.texto_tela[0] || '', { tam: 52, bg: '#2e8b57', rot: -2 }));
    if (c.texto_tela[1]) s += pop(t, virada + 0.1, 760, 470, texto(c.texto_tela[1], { tam: 110, cor: '#e63946', bw: 16 }));
    s += pop(t, virada + 0.6, 260, 1830, `<g transform="scale(.55)">${painelCaixa(c.dados.caixa, E.moeda, 'SOBROU')}</g>`);
    return s;
  },
  enquete_resultado(t, d, c, E) {
    let s = fundoEscuro();
    s += pop(t, 0.1, W / 2, 420, pilula(c.texto_tela[0], { tam: 46, bg: CORES.laranja, cor: OUT }));
    s += pop(t, 0.6, W / 2, 800, tituloGrande(c.texto_tela[1], { tam: 150, cor: CORES.amarelo }));
    return s;
  },
  pre_jogo(t, d, c, E) {
    let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E), torcida: E._torcida }));
    s += pop(t, 0.1, W / 2, 330, pilula(c.texto_tela[0], { tam: 66, bg: CORES.marinho, rot: -2 }));
    s += pop(t, 0.4, W / 2, 440, pilula(c.texto_tela[1] || '', { tam: 40, bg: CORES.amarelo, cor: OUT, rot: 2 }));
    const m = c.dados.mandante, v = c.dados.visitante;
    s += pop(t, 0.7, 250, 800, `<g transform="scale(.9)">${m === NOME(E) ? nossoEscudo(E) : escudo(m)}</g>`);
    s += pop(t, 0.9, 830, 800, `<g transform="scale(.9)">${v === NOME(E) ? nossoEscudo(E) : escudo(v)}</g>`);
    s += pop(t, 1.1, W / 2, 840, texto('X', { tam: 140 }));
    s += pop(t, 1.0, 250, 1010, texto(m, { tam: 40, bw: 10 })) + pop(t, 1.0, 830, 1010, texto(v, { tam: 40, bw: 10 }));
    s += elencoLinha(t, E, 1560, 0.7, ['1', '3', '4', '5', '8', '9', '10']);
    return s;
  },
  gol(t, d, c, E) {
    const nosso = c.dados.nosso;
    const dd = c.dados;
    let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E), torcida: E._torcida }), { z0: 1.5, z1: 1.6, cy: 960 });
    // bola entrando no gol
    const p = easeOut(prog(t, 0.2, 0.7));
    const bx = 540 + (nosso === false ? -1 : 1) * 60 * p, by = 1650 - p * 700, br = 46 - p * 20;
    if (nosso !== null) s += `<circle cx="${bx}" cy="${by}" r="${br}" fill="#fff" stroke="${OUT}" stroke-width="6"/><path d="M${bx - 10},${by - 8} l10,-8 l10,8 l-4,12 h-12z" fill="${OUT}"/>`;
    if (nosso) {
      const num = Object.keys(E.elenco).find(k => E.elenco[k].nome === dd.autor) || '9';
      s += pop(t, 0.6, 540, 1900, pessoa(jogador(num, E, { pose: 'comemora', expr: 'feliz' }), t, { s: 1.9 }));
      s += pop(t, 0.5, W / 2, 470, tituloGrande('GOOOOL!', { tam: 200, cor: CORES.amarelo, rot: -5 }));
    } else if (nosso === false) {
      s += pessoa(jogador('1', E, { pose: 'comemora', expr: 'surpreso' }), t, { x: 330 - p * 80, y: 1720, s: 1.6 });
      s += pop(t, 0.6, W / 2, 470, pilula(c.texto_tela[1] || 'GOL DELES', { tam: 56, bg: '#6c757d', rot: 3 }));
    }
    const sg = n => n === NOME(E) ? E.clube.sigla : sigla(n);
    s += placarCanto(sg(dd.mandante), sg(dd.visitante), dd.placar[0], dd.placar[1], dd.minuto);
    return s;
  },
  fim_de_jogo(t, d, c, E) {
    const dd = c.dados;
    let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E), torcida: E._torcida }));
    const exp = dd.resultado === 'vitória' ? 'feliz' : dd.resultado === 'empate' ? 'serio' : 'triste';
    s += narrador(t, E, 540, 1760, 1.6, { expr: exp, pose: dd.resultado === 'vitória' ? 'comemora' : 'microfone' });
    s += pop(t, 0.1, W / 2, 360, pilula('FIM DE JOGO', { tam: 56, bg: CORES.marinho, rot: -2 }));
    s += pop(t, 0.4, W / 2, 600, tituloGrande(`${dd.placar[0]} x ${dd.placar[1]}`, { tam: 220, cor: '#fff', rot: 0 }));
    s += pop(t, 0.6, W / 2, 700, texto(`${dd.mandante}  ·  ${dd.visitante}`, { tam: 40, bw: 10 }));
    if (dd.resultado === 'vitória') s += pop(t, 1.0, W / 2, 860, tituloGrande('VITÓRIA!', { tam: 120, cor: CORES.amarelo, rot: -6 }));
    return s;
  },
  bilheteria(t, d, c, E) {
    let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E), torcida: c.dados.publico }), { z0: 1.3, z1: 1.22, cy: 800 });
    s += pop(t, 0.2, W / 2, 400, pilula('BILHETERIA', { tam: 54, bg: CORES.marinho }));
    s += pop(t, 0.6, W / 2, 530, pilula(c.texto_tela[0] || '', { tam: 58, bg: '#2e8b57', rot: -2 }));
    return s;
  },
  tabela(t, d, c, E) {
    let s = fundoEscuro();
    s += pop(t, 0.1, W / 2, 640, tabelaCard(c.dados.tabela, NOME(E), c.texto_tela[0] || 'Liga'));
    s += pop(t, 0.9, W / 2, 1480, tituloGrande(c.texto_tela[1] || '', { tam: 150, cor: CORES.laranja }));
    return s;
  },
  enquete_nova(t, d, c, E) {
    let s = fundoEscuro();
    s += pop(t, 0.1, W / 2, 400, pilula(c.texto_tela[0], { tam: 44, bg: CORES.laranja, cor: OUT }));
    Object.entries(c.dados.valores || {}).forEach(([k, v], i) =>
      s += pop(t, 0.5 + i * 0.25, 300 + i * 480, 800, cartaoOpcao(`${k}: ${v}`, k === 'A' ? '🅰️' : '🅱️', i ? '#3a86ff' : '#e63946', 400, 360)));
    return s;
  },
  decisao(t, d, c, E) {
    let s = camera(t, d, sede(E.estrutura, { t }));
    s += narrador(t, E, 280, 1770, 1.35, { pose: 'aponta' });
    s += presidente(t, E, 800, 1770, 1.35);
    const ops = c.dados.opcoes || [];
    const cores = ['#e63946', '#3a86ff', '#2e8b57'];
    ops.forEach((o, i) => s += pop(t, 0.3 + i * 0.25, 210 + i * 330, 560, `<g transform="rotate(${[-4, 2, 5][i] || 0})">${cartaoOpcao(o, iconeOpcao(o), cores[i % 3])}</g>`));
    s += pop(t, 1.2, W / 2, 860, cartaoComentario('voce', 'sua ideia aqui...', 0, { selo: 'COMENTÁRIO MAIS CURTIDO DECIDE', w: 820 }));
    s += pop(t, 0.1, W / 2, 300, pilula(c.texto_tela[0] || '', { tam: 56, bg: '#2e8b57', rot: -3 }));
    return s;
  },
  encerramento(t, d, c, E) {
    let s = camera(t, d, sede(E.estrutura, { t }));
    s += narrador(t, E, 300, 1760, 1.4, { pose: 'acena' });
    s += presidente(t, E, 790, 1760, 1.4, { expr: 'feliz' });
    if (c.dados.proximo) {
      const [m, v] = c.dados.proximo;
      s += pop(t, 0.2, W / 2, 330, pilula('PRÓXIMO JOGO', { tam: 54, bg: '#2e8b57' }));
      s += pop(t, 0.4, 330, 600, `<g transform="scale(.75)">${m === NOME(E) ? nossoEscudo(E) : escudo(m)}</g>`);
      s += pop(t, 0.5, 750, 600, `<g transform="scale(.75)">${v === NOME(E) ? nossoEscudo(E) : escudo(v)}</g>`);
      s += pop(t, 0.6, W / 2, 630, texto('X', { tam: 110 }));
    } else {
      s += pop(t, 0.2, W / 2, 560, `<g transform="scale(1.1)">${nossoEscudo(E)}</g>`);
    }
    // fade final com @ do perfil
    const f = prog(t, d - 1.6, 1.0);
    if (f > 0) s += `<rect width="${W}" height="${H}" fill="${CORES.marinho}" opacity="${f * 0.85}"/>
      <g opacity="${f}" transform="translate(${W / 2} 900)">
        <rect x="-90" y="-90" width="180" height="180" rx="50" fill="none" stroke="#fff" stroke-width="16"/>
        <circle r="44" fill="none" stroke="#fff" stroke-width="16"/><circle cx="52" cy="-52" r="12" fill="#fff"/>
        <g transform="translate(0 190)">${texto(E.clube.instagram, { tam: 70, cor: '#fff', bw: 0 })}</g>
        <g transform="translate(0 280)">${texto('SEGUE · CURTE · COMENTA', { tam: 50, cor: CORES.amarelo, bw: 0 })}</g></g>`;
    return s;
  },
};

// ------------------------------------------------------------ legenda karaokê
function blocos(palavras) {
  const out = []; let atual = [];
  palavras.forEach((p, i) => {
    atual.push({ ...p, i });
    const chars = atual.map(q => q.texto).join(' ').length;
    if (/[.!?:;,…]$/.test(p.texto) || atual.length >= 4 || chars > 20) { out.push(atual); atual = []; }
  });
  if (atual.length) out.push(atual);
  return out;
}

function legenda(t, cena) {
  const ws = cena.palavras || [];
  if (!ws.length) return '';
  const bl = cena._blocos || (cena._blocos = blocos(ws));
  let atual = bl.find(b => t >= b[0].t0 - 0.05 && t <= b[b.length - 1].t1 + 0.25);
  if (!atual) atual = [...bl].reverse().find(b => t >= b[0].t0);
  if (!atual || t > atual[atual.length - 1].t1 + 0.6) return '';
  const tam = 84;
  const pals = atual.map(p => p.texto.toUpperCase());
  const larguras = pals.map(p => medir(p, tam));
  const esp = 22, total = larguras.reduce((a, b) => a + b, 0) + esp * (pals.length - 1);
  const escala = Math.min(1, 980 / total);
  let x = -total / 2, s = '';
  atual.forEach((p, k) => {
    const ativo = t >= p.t0 - 0.03;
    const cor = ativo && t <= p.t1 + 0.12 ? CORES.amarelo : ativo ? '#fff' : '#ffffffaa';
    s += `<text x="${x}" y="0" font-family="Anton" font-size="${tam}" fill="${cor}" stroke="${OUT}" stroke-width="16"
      stroke-linejoin="round" paint-order="stroke">${esc(pals[k])}</text>`;
    x += larguras[k] + esp;
  });
  const entrada = easeOutBack(prog(t, atual[0].t0 - 0.05, 0.18));
  return `<g transform="translate(${W / 2} 1165) scale(${escala * (0.85 + 0.15 * entrada)})">${s}</g>`;
}

function marcaDagua(E) {
  return `<g transform="translate(${W - 50} 110)" opacity=".85">
    <text text-anchor="end" font-family="Anton" font-size="30" fill="#fff" stroke="${OUT}" stroke-width="6" paint-order="stroke">${esc(E.clube.instagram)}</text></g>`;
}

// ------------------------------------------------------------ API para o render.mjs
let DADOS = null;
window.preparar = dados => {
  DADOS = dados;
  DADOS.estado._torcida = dados.torcida;
  let t = 0;
  for (const c of DADOS.cenas) { c.inicio = t; t += c.duracao; }
  DADOS.total = t;
  return t;
};

window.quadro = tGlobal => {
  const cenas = DADOS.cenas;
  let i = cenas.findIndex(c => tGlobal < c.inicio + c.duracao);
  if (i < 0) i = cenas.length - 1;
  const c = cenas[i], t = tGlobal - c.inicio, E = DADOS.estado;
  const fn = TIPOS[c.tipo] || TIPOS.abertura;
  let svg = fn(t, c.duracao, c, E);
  svg += marcaDagua(E) + legenda(t, c);
  // corte com "flash" curto entre cenas
  if (t < 0.12 && i > 0) svg += `<rect width="${W}" height="${H}" fill="#fff" opacity="${(0.12 - t) / 0.12 * 0.5}"/>`;
  document.getElementById('palco').innerHTML = svg;
};
