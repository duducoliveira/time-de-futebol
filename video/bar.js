// ============================================================ bar.js
// Bar da Dona Cida por dentro, em perspectiva de um ponto e em MEDIDAS REAIS (como no detetive).
// Um boteco de 4 m de largura, 3 m de pé-direito e 6 m de fundo. A câmera fica a 1,6 m do chão, na porta,
// olhando para a parede do fundo. Um ponto (X, h, d) — X: metros para a direita do meio; h: altura;
// d: distância da câmera — vai para a tela em bP(). Na distância d, 1 metro = f/d px.
//
// Parede do fundo: três quadros de tamanho real, sempre no cenário, e a câmera dá zoom no que precisa:
//   tabela  = quadro-negro (giz)        · caixa = quadro branco do caixa (pincel) · recados = cortiça (comentários)
// Entre eles: TV no alto e a prateleira de bebidas atrás do balcão. Lateral esquerda: janela e flâmula;
// lateral direita: porta da rua (com a luz entrando), relógio e calendário.

const BARP = { f: 1100, hz: 1007, D: 6, X: 2, H: 3 };
const bP = (X, h, d) => [540 + X * BARP.f / d, BARP.hz - (h - 1.6) * BARP.f / d];
const bK = d => BARP.f / d / PX_M;                       // escala de uma pessoa (1,75 m) a d metros
const BAR_ATRAS = 5.4, BAR_FRENTE = 3.9;                  // atrás do balcão / no salão (cliente)
const bPts = pts => pts.map(p => bP(...p).map(v => v.toFixed(1)).join(',')).join(' ');
const bQuad = (pts, fill, extra = '') => `<polygon points="${bPts(pts)}" fill="${fill}" ${extra}/>`;

// quadros da parede do fundo (metros) e o tamanho da "lousa" onde o conteúdo é escrito (unidades da lousa)
const QUADROS = {
  tabela: { X0: -1.72, X1: -0.66, h0: 1.86, h1: 2.64, cw: 1000, ch: 736 },
  caixa: { X0: -0.42, X1: 0.42, h0: 1.74, h1: 2.26, cw: 1000, ch: 620 },
  recados: { X0: 0.66, X1: 1.72, h0: 1.86, h1: 2.64, cw: 1000, ch: 736 },
};
// retângulo do quadro na tela (antes da câmera) e a transformação lousa → tela
function quadroRet(qual) {
  const q = QUADROS[qual], [x0, y0] = bP(q.X0, q.h1, BARP.D), [x1, y1] = bP(q.X1, q.h0, BARP.D);
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, k: (x1 - x0) / q.cw };
}
// chave de câmera (formato de camChaves) para a vista geral e para o zoom num quadro: o quadro ocupa ~86% da
// largura da tela e fica na parte de cima (a legenda, em y ≈ 1165, fica livre)
const BAR_GERAL = [540, 1075, 1.0, 1000];
const barZoom = qual => { const r = quadroRet(qual); return [r.cx, r.cy, 930 / r.w, 560]; };

// ---- molduras e lousas (em unidades da lousa: 0..cw × 0..ch)
function lousaGiz(q, conteudo) {
  return `<rect x="-38" y="-38" width="${q.cw + 76}" height="${q.ch + 76}" rx="10" fill="#8d5a2b" stroke="${OUT}" stroke-width="12"/>
    <rect width="${q.cw}" height="${q.ch}" fill="#2f4f3a"/><rect x="18" y="18" width="${q.cw - 36}" height="${q.ch - 36}" fill="#fff" opacity=".03"/>
    <path d="M60,${q.ch - 70} q200,-30 420,-10 M560,90 q160,20 330,-6" stroke="#fff" stroke-width="16" opacity=".05" fill="none"/>
    <rect x="${q.cw * 0.12}" y="${q.ch + 30}" width="${q.cw * 0.76}" height="26" fill="#6f4518" stroke="${OUT}" stroke-width="6"/>
    <rect x="${q.cw * 0.2}" y="${q.ch + 18}" width="60" height="16" rx="4" fill="#f8f9fa"/><rect x="${q.cw * 0.7}" y="${q.ch + 20}" width="70" height="14" rx="4" fill="#ffd8a8"/>${conteudo}`;
}
function lousaBranca(q, conteudo) {
  return `<rect x="-26" y="-26" width="${q.cw + 52}" height="${q.ch + 52}" rx="12" fill="#adb5bd" stroke="${OUT}" stroke-width="12"/>
    <rect width="${q.cw}" height="${q.ch}" fill="#f8f9fa"/><path d="M40,${q.ch - 40} L${q.cw - 300},40" stroke="#dee2e6" stroke-width="30" opacity=".5"/>
    <rect x="${q.cw * 0.3}" y="${q.ch + 26}" width="${q.cw * 0.4}" height="22" fill="#868e96" stroke="${OUT}" stroke-width="5"/>
    <rect x="${q.cw * 0.36}" y="${q.ch + 10}" width="90" height="20" rx="6" fill="#1971c2"/><rect x="${q.cw * 0.52}" y="${q.ch + 10}" width="90" height="20" rx="6" fill="#e03131"/>${conteudo}`;
}
function lousaCortica(q, conteudo) {
  const r = rng('cortica-recados');
  return `<rect x="-34" y="-34" width="${q.cw + 68}" height="${q.ch + 68}" rx="10" fill="#8d5a2b" stroke="${OUT}" stroke-width="12"/>
    <rect width="${q.cw}" height="${q.ch}" fill="#c9965e"/>
    ${Array.from({ length: 140 }, () => `<circle cx="${(r() * q.cw).toFixed(0)}" cy="${(r() * q.ch).toFixed(0)}" r="${(3 + r() * 6).toFixed(1)}" fill="#a87543" opacity=".6"/>`).join('')}${conteudo}`;
}
// conteúdo de sempre (quando ninguém está mostrando o quadro)
function giz(txt, x, y, tam, { cor = CHALK, anchor = 'middle', op = 1, peso = 800 } = {}) {
  return op > 0 ? `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Nunito" font-weight="${peso}" font-size="${tam}" fill="${cor}" opacity="${(op * 0.92).toFixed(3)}">${esc(txt)}</text>` : '';
}
function pincel(txt, x, y, tam, { cor = '#1d3557', anchor = 'middle', op = 1 } = {}) {
  return op > 0 ? `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Anton" font-size="${tam}" fill="${cor}" opacity="${op.toFixed(3)}" letter-spacing="1">${esc(txt)}</text>` : '';
}
const padraoTabela = () => giz('HOJE TEM JOGO!', 500, 210, 92) + giz('pastel · caldo · refri', 500, 360, 64, { peso: 700 }) + giz('FIADO SÓ AMANHÃ', 500, 560, 62, { cor: '#ffd8a8' });
const padraoCaixa = caixa => pincel('CAIXA DO POEIRA', 500, 130, 96, { cor: CORES.vinho }) + (caixa != null ? pincel(`R$ ${Math.round(caixa).toLocaleString('pt-BR')}`, 500, 380, 190, { cor: '#2b8a3e' }) : '')
  + `<path d="M160,470 q340,30 680,0" stroke="#1971c2" stroke-width="10" fill="none" stroke-linecap="round"/>`;
function padraoRecados() {
  const r = rng('recados-padrao');
  return [[150, 120], [430, 150], [740, 110], [260, 430], [620, 450]].map(([x, y], i) => {
    const w = 210, h = 170, rot = (r() - 0.5) * 12;
    return `<g transform="rotate(${rot.toFixed(1)} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${PAPEL[i % PAPEL.length]}" stroke="${OUT}" stroke-width="4"/>
      ${[0, 1, 2].map(k => `<path d="M${x + 24},${y + 62 + k * 34} h${w - 60 - (k === 2 ? 50 : 0)}" stroke="#adb5bd" stroke-width="7" stroke-linecap="round"/>`).join('')}
      <circle cx="${x + w / 2}" cy="${y + 18}" r="13" fill="#e63946" stroke="${OUT}" stroke-width="3"/></g>`;
  }).join('');
}

// ---- pessoas no bar: atrás do balcão (d = 5,4 m; o balcão esconde da cintura pra baixo) ou no salão (d ≈ 3,4 m)
// item: { quem: 'tiao' | 'cida', X, d, pose, expr, rosto }
function pessoaBar(t, E, it) {
  const d = it.d ?? BAR_ATRAS, [x, y] = bP(it.X, 0, d), s = bK(d);
  const svg = it.quem === 'cida' ? presidente(t, E, x, y, s, { pose: it.pose || 'normal', expr: it.expr || 'feliz' })
    : narrador(t, E, x, y, s, { pose: it.pose || 'microfone', expr: it.expr || 'feliz' });
  return it.rosto === false ? svg.replace(/class="rosto" /g, '') : svg;
}

// ---- a sala
// opções: atras / frente = listas de pessoas; conteudo = { tabela, caixa, recados } (SVG em unidades da lousa);
// caixa = valor para o quadro do caixa quando ele está no "padrão"
function barDentro(t = 0, E = {}, { atras = [], frente = [], conteudo = {}, caixa = null } = {}) {
  const { D, X: L, H: A } = BARP, perto = 1.0;
  let s = `<rect x="-3000" y="-3000" width="${W + 6000}" height="${H + 6000}" fill="#3d2b1f"/>`;
  // teto: forro de madeira (tábuas no sentido do fundo) e vigas atravessadas
  s += bQuad([[-L, A, D], [L, A, D], [L, A, perto], [-L, A, perto]], '#a47148');
  for (let X = -L; X <= L + 0.01; X += 0.4) s += `<path d="M${bP(X, A, D).join(',')} L${bP(X, A, perto).join(',')}" stroke="#8a5a36" stroke-width="3"/>`;
  for (const d of [5.2, 4.2, 3.2, 2.2]) s += bQuad([[-L, A, d], [L, A, d], [L, A, d - 0.14], [-L, A, d - 0.14]], '#6f4518', `stroke="${OUT}" stroke-width="2"`);
  // paredes laterais com lambri de madeira até 1,1 m
  for (const lado of [-1, 1]) {
    const X = lado * L, cor = lado < 0 ? '#ecc994' : '#e0b680';
    s += bQuad([[X, 0, D], [X, A, D], [X, A, perto], [X, 0, perto]], cor, `stroke="${OUT}" stroke-width="3"`);
    s += bQuad([[X, 0, D], [X, 1.1, D], [X, 1.1, perto], [X, 0, perto]], lado < 0 ? '#c98a52' : '#bd7f48');
    for (let d = D; d > perto; d -= 0.3) s += `<path d="M${bP(X, 0, d).join(',')} L${bP(X, 1.1, d).join(',')}" stroke="#a96d3b" stroke-width="2.5"/>`;
    s += `<path d="M${bP(X, 1.1, D).join(',')} L${bP(X, 1.1, perto).join(',')}" stroke="#6f4518" stroke-width="8"/>`;
  }
  // piso de ladrilho hidráulico (quadrados de 40 cm alternados)
  s += bQuad([[-L, 0, D], [L, 0, D], [L, 0, perto], [-L, 0, perto]], '#efe3cf');
  for (let i = 0; i < 10; i++) for (let j = 0; j < 13; j++) if ((i + j) % 2) {
    const X0 = -L + i * 0.4, d0 = D - j * 0.4; if (d0 - 0.4 < perto) continue;
    s += bQuad([[X0, 0, d0], [X0 + 0.4, 0, d0], [X0 + 0.4, 0, d0 - 0.4], [X0, 0, d0 - 0.4]], '#d9c3a0');
  }
  // parede do fundo: reboco pintado, lambri e rodapé
  const [bx0, by0] = bP(-L, A, D), [bx1, by1] = bP(L, 0, D);
  s += `<rect x="${bx0}" y="${by0}" width="${bx1 - bx0}" height="${by1 - by0}" fill="#f3d9b1" stroke="${OUT}" stroke-width="3"/>`;
  { const [, yl] = bP(0, 1.1, D); s += `<rect x="${bx0}" y="${yl}" width="${bx1 - bx0}" height="${by1 - yl}" fill="#c98a52"/>
    ${Array.from({ length: 16 }, (_, i) => `<path d="M${bx0 + (i + 1) * (bx1 - bx0) / 17},${yl} V${by1}" stroke="#a96d3b" stroke-width="2.5"/>`).join('')}
    <rect x="${bx0}" y="${yl - 4}" width="${bx1 - bx0}" height="8" fill="#6f4518"/>`; }
  // TV no alto, no suporte de parede, passando o escudo do Poeira
  { const [x0, y0] = bP(-0.36, 2.8, D), [x1, y1] = bP(0.36, 2.34, D);
    s += `<path d="M${(x0 + x1) / 2},${bP(0, A, D)[1]} V${y0}" stroke="${OUT}" stroke-width="4"/>
      <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="4" fill="#212529" stroke="${OUT}" stroke-width="3"/>
      <rect x="${x0 + 5}" y="${y0 + 5}" width="${x1 - x0 - 10}" height="${y1 - y0 - 10}" fill="#1d3557"/>
      <g transform="translate(${(x0 + x1) / 2} ${(y0 + y1) / 2}) scale(${((y1 - y0) / 360).toFixed(3)})">${escudoPoeira({})}</g>
      <rect x="${x0 + 8}" y="${y0 + 8}" width="26" height="10" rx="2" fill="#e63946"/><text x="${x0 + 21}" y="${y0 + 16}" text-anchor="middle" font-family="Anton" font-size="7" fill="#fff">AO VIVO</text>`; }
  // os três quadros
  const lousa = { tabela: lousaGiz, caixa: lousaBranca, recados: lousaCortica };
  const padrao = { tabela: padraoTabela, caixa: () => padraoCaixa(caixa), recados: padraoRecados };
  for (const qual of ['tabela', 'caixa', 'recados']) {
    const r = quadroRet(qual), q = QUADROS[qual];
    s += `<g transform="translate(${r.x0.toFixed(2)} ${r.y0.toFixed(2)}) scale(${r.k.toFixed(5)})">${lousa[qual](q, conteudo[qual] ?? padrao[qual]())}</g>`;
  }
  // prateleira de bebidas atrás do balcão (duas tábuas) e as garrafas
  { const r = rng('garrafas-bar2');
    for (const h of [1.08, 1.45]) {
      const [x0, y] = bP(-1.32, h, D), [x1] = bP(1.32, h, D);
      for (let X = -1.26; X < 1.24; X += 0.085 + r() * 0.05) {
        const hg = 0.22 + r() * 0.08, cor = ['#2d6a4f', '#9d0208', '#e9c46a', '#6d597a', '#c97a40', '#1d3557'][Math.floor(r() * 6)];
        const [gx, gy] = bP(X, h, D), [, gt] = bP(X, h + hg, D), [, gp] = bP(X, h + hg * 0.62, D), lw = 0.06 * BARP.f / D;
        s += `<rect x="${(gx - lw / 2).toFixed(1)}" y="${gp.toFixed(1)}" width="${lw.toFixed(1)}" height="${(gy - gp).toFixed(1)}" rx="2" fill="${cor}" stroke="${OUT}" stroke-width="1.5"/>
          <rect x="${(gx - lw / 5).toFixed(1)}" y="${gt.toFixed(1)}" width="${(lw / 2.5).toFixed(1)}" height="${(gp - gt).toFixed(1)}" fill="${cor}" stroke="${OUT}" stroke-width="1.2"/>
          <rect x="${(gx - lw / 2 + 1).toFixed(1)}" y="${((gp + gy) / 2 - 3).toFixed(1)}" width="${(lw - 2).toFixed(1)}" height="6" fill="#fff" opacity=".7"/>`;
      }
      s += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="7" fill="#8d5a2b" stroke="${OUT}" stroke-width="2"/>
        ${[-1.2, 0, 1.2].map(X => { const [xm, ym] = bP(X, h, D); return `<path d="M${xm},${ym + 6} l-8,14" stroke="${OUT}" stroke-width="3"/>`; }).join('')}`;
    } }
  // geladeira de bebidas (porta de vidro) no canto do fundo à direita: 0,55 m × 1,75 m, 0,6 m de fundo
  { const X0 = 1.4, X1 = 1.95, hT = 1.75, d0 = 5.4;
    s += bQuad([[X0, 0, d0], [X0, hT, d0], [X0, hT, D], [X0, 0, D]], '#ced4da', `stroke="${OUT}" stroke-width="2.5"`);
    const [fx0, fy0] = bP(X0, hT, d0), [fx1, fy1] = bP(X1, 0, d0);
    s += `<rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}" rx="5" fill="#e9ecef" stroke="${OUT}" stroke-width="3"/>
      <rect x="${fx0 + 8}" y="${fy0 + 26}" width="${fx1 - fx0 - 16}" height="${(fy1 - fy0) * 0.8}" rx="3" fill="#a5d8ff" opacity=".85"/>
      <rect x="${fx0 + 8}" y="${fy0 + 6}" width="${fx1 - fx0 - 16}" height="16" fill="${CORES.vinho}"/><text x="${(fx0 + fx1) / 2}" y="${fy0 + 18}" text-anchor="middle" font-family="Anton" font-size="12" fill="#fff">GELADA</text>
      ${[0.2, 0.42, 0.64].map(k => { const yy = fy0 + 26 + (fy1 - fy0) * 0.8 * k; return `<path d="M${fx0 + 8},${yy} h${fx1 - fx0 - 16}" stroke="#74c0fc" stroke-width="2"/>` + Array.from({ length: 5 }, (_, i) => `<rect x="${fx0 + 14 + i * (fx1 - fx0 - 28) / 5}" y="${yy - 26}" width="9" height="26" rx="3" fill="${['#2d6a4f', '#9d0208', '#e9c46a'][i % 3]}"/>`).join(''); }).join('')}`; }
  // lateral esquerda: janela basculante (luz do dia) e a flâmula do Poeira
  s += bQuad([[-L, 1.05, 5.5], [-L, 2.1, 5.5], [-L, 2.1, 4.3], [-L, 1.05, 4.3]], '#a8dadc', `stroke="${OUT}" stroke-width="4"`);
  for (const d of [5.1, 4.7]) s += `<path d="M${bP(-L, 1.05, d).join(',')} L${bP(-L, 2.1, d).join(',')}" stroke="${OUT}" stroke-width="3"/>`;
  s += `<path d="M${bP(-L, 1.58, 5.5).join(',')} L${bP(-L, 1.58, 4.3).join(',')}" stroke="${OUT}" stroke-width="3"/>`;
  s += bQuad([[-L, 2.62, 5.85], [-L, 2.62, 5.62], [-L, 2.2, 5.74]], CORES.vinho, `stroke="${OUT}" stroke-width="2"`);
  // lateral direita: porta da rua aberta (luz entrando), relógio e calendário
  s += bQuad([[L, 0, 5.15], [L, 2.1, 5.15], [L, 2.1, 4.25], [L, 0, 4.25]], '#fff4cc', `stroke="${OUT}" stroke-width="4"`);
  s += bQuad([[L, 0, 5.15], [L * 0.55, 0, 4.9], [L * 0.45, 0, 3.7], [L, 0, 4.25]], '#fff4cc', 'opacity=".45"');
  s += bQuad([[L, 2.1, 5.15], [L, 2.1, 4.25], [L, 2.22, 4.25], [L, 2.22, 5.15]], '#8d5a2b');
  { const [cx, cy] = bP(L, 2.5, 5.7), rr = 0.17 * BARP.f / 5.7;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${(rr * 0.35).toFixed(1)}" ry="${rr.toFixed(1)}" fill="#fff" stroke="${OUT}" stroke-width="3"/>
      <path d="M${cx},${cy} l0,${-rr * 0.7} M${cx},${cy} l${(Math.cos(t * 0.5) * rr * 0.2).toFixed(1)},${(Math.sin(t * 0.5) * rr * 0.6).toFixed(1)}" stroke="${OUT}" stroke-width="2.5"/>`; }
  s += bQuad([[L, 1.35, 5.75], [L, 1.95, 5.75], [L, 1.95, 5.4], [L, 1.35, 5.4]], '#fff', `stroke="${OUT}" stroke-width="2.5"`)
    + bQuad([[L, 1.8, 5.75], [L, 1.95, 5.75], [L, 1.95, 5.4], [L, 1.8, 5.4]], '#e63946');
  // lâmpadas penduradas e bandeirinhas do Poeira atravessando o salão
  // (cordão curto: as lâmpadas ficam acima dos quadros, nunca na frente deles quando a câmera entra num quadro)
  for (const X of [-1.2, 1.2]) {
    const d = 4.4, [x0, y0] = bP(X, A, d), [x1, y1] = bP(X, 2.84, d), k = BARP.f / d;
    s += `<path d="M${x0},${y0} V${y1}" stroke="${OUT}" stroke-width="2.5"/><ellipse cx="${x1}" cy="${y1 + 0.12 * k}" rx="${0.3 * k}" ry="${0.12 * k}" fill="#ffe8a3" opacity=".25"/>
      <path d="M${x1 - 0.13 * k},${y1 + 0.12 * k} q${0.13 * k},${-0.17 * k} ${0.26 * k},0z" fill="#495057" stroke="${OUT}" stroke-width="2.5"/><circle cx="${x1}" cy="${y1 + 0.13 * k}" r="${0.035 * k}" fill="#fff3bf"/>`;
  }
  { const d = 3.5, n = 13, pts = Array.from({ length: n + 1 }, (_, i) => { const u = i / n, X = -L + u * 2 * L, h = 2.78 - Math.sin(u * Math.PI) * 0.16; return [X, h]; });
    s += `<path d="M${pts.map(([X, h]) => bP(X, h, d).join(',')).join(' L')}" stroke="${OUT}" stroke-width="2" fill="none"/>`;
    for (let i = 0; i < n; i++) { const [Xa, ha] = pts[i], [Xb, hb] = pts[i + 1], Xm = (Xa + Xb) / 2;
      s += bQuad([[Xa + 0.03, ha, d], [Xb - 0.03, hb, d], [Xm, (ha + hb) / 2 - 0.2, d]], i % 2 ? CORES.amarelo : CORES.vinho, `stroke="${OUT}" stroke-width="1.5"`); } }
  // ventilador de teto
  { const d = 3.0, [vx, vy] = bP(0, 2.82, d), k = BARP.f / d;
    s += `<path d="M${bP(0, A, d).join(',')} L${vx},${vy}" stroke="${OUT}" stroke-width="4"/>
      ${[0, 1, 2].map(i => { const a = t * 6 + i * 2.094; return `<ellipse cx="${(vx + Math.cos(a) * 0.32 * k).toFixed(1)}" cy="${(vy + Math.sin(a) * 0.05 * k).toFixed(1)}" rx="${0.32 * k}" ry="${0.045 * k}" fill="#8d5a2b" stroke="${OUT}" stroke-width="2"/>`; }).join('')}
      <circle cx="${vx}" cy="${vy}" r="${0.06 * k}" fill="#495057" stroke="${OUT}" stroke-width="2.5"/>`; }
  // quem está atrás do balcão
  s += atras.map(it => pessoaBar(t, E, it)).join('');
  // balcão de parede a parede (1,05 m de altura, 55 cm de tampo) com a portinhola à direita
  { const d0 = 4.6, d1 = 5.15, hB = 1.05;
    s += bQuad([[-L, hB, d0], [L, hB, d0], [L, hB, d1], [-L, hB, d1]], '#6f4518', `stroke="${OUT}" stroke-width="4"`);
    s += bQuad([[-L, 0, d0], [L, 0, d0], [L, hB, d0], [-L, hB, d0]], '#a0673e', `stroke="${OUT}" stroke-width="4"`);
    for (let X = -L + 0.4; X < L; X += 0.4) s += `<path d="M${bP(X, 0.05, d0).join(',')} L${bP(X, hB - 0.06, d0).join(',')}" stroke="#8d5a2b" stroke-width="4"/>`;
    s += bQuad([[-L, hB - 0.05, d0], [L, hB - 0.05, d0], [L, hB, d0], [-L, hB, d0]], '#5c3a17');
    s += bQuad([[-L, 0, d0], [L, 0, d0], [L, 0.08, d0], [-L, 0.08, d0]], '#000', 'opacity=".18"');
    // em cima do balcão: um copo de cerveja e a garrafa (objetos que todo mundo reconhece)
    { const X = 0.5, dd = 4.85, k = BARP.f / dd, [gx, gy] = bP(X, hB, dd);
      s += `<rect x="${gx - 0.035 * k}" y="${gy - 0.27 * k}" width="${0.07 * k}" height="${0.27 * k}" rx="3" fill="#7f4f24" stroke="${OUT}" stroke-width="2"/>
        <rect x="${gx - 0.014 * k}" y="${gy - 0.36 * k}" width="${0.028 * k}" height="${0.1 * k}" fill="#7f4f24" stroke="${OUT}" stroke-width="2"/>
        <rect x="${gx - 0.032 * k}" y="${gy - 0.19 * k}" width="${0.064 * k}" height="${0.07 * k}" fill="#ffd166" stroke="${OUT}" stroke-width="1.5"/>
        <path d="M${gx + 0.08 * k},${gy} l-${0.008 * k},-${0.13 * k} h${0.08 * k} l-${0.008 * k},${0.13 * k}z" fill="#ffc300" stroke="${OUT}" stroke-width="2"/>
        <rect x="${gx + 0.072 * k}" y="${gy - 0.15 * k}" width="${0.08 * k}" height="${0.03 * k}" rx="3" fill="#fff" stroke="${OUT}" stroke-width="1.5"/>`; } }
  // banquetas do salão (assento a 72 cm)
  for (const X of [-1.25, 0, 1.25]) {
    const d = 4.15, k = BARP.f / d, [x, ys] = bP(X, 0.72, d), [, yc] = bP(X, 0, d);
    s += `<path d="M${x - 0.12 * k},${yc} L${x - 0.05 * k},${ys} M${x + 0.12 * k},${yc} L${x + 0.05 * k},${ys}" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>
      <path d="M${x - 0.09 * k},${(ys + yc) / 2 + 0.1 * k} h${0.18 * k}" stroke="${OUT}" stroke-width="3"/>
      <ellipse cx="${x}" cy="${ys}" rx="${0.18 * k}" ry="${0.05 * k}" fill="#e63946" stroke="${OUT}" stroke-width="3"/>`;
  }
  // quem está no salão (na frente do balcão)
  s += frente.map(it => pessoaBar(t, E, it)).join('');
  return s;
}

Object.assign(window, { BARP, bP, bK, QUADROS, quadroRet, BAR_GERAL, barZoom, barDentro, pessoaBar, giz, pincel, BAR_ATRAS, BAR_FRENTE });
