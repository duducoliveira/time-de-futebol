// ============================================================ mundo.js
// Novos enquadramentos do mesmo mundo (o bairro do Poeira), para os vídeos não repetirem:
//  - TV: o campo visto da lateral direita (leste), como numa transmissão; a câmera acompanha a bola.
//        Ao fundo, a lateral esquerda (oeste) com a obra / arquibancada nova; nas pontas, os gols.
//  - lances de jogo (passe, drible, chute, defesa) para contar cada gol.
//  - bar por dentro, celular da Dona Cida, quadro de avisos, quadro-negro e caderno do caixa.
//  - rua do adversário (chegada de Kombi), saída do vestiário, pôr do sol.
// Tudo na escala do resto: uma pessoa em s = 1 tem ~300 px.

// ------------------------------------------------------------ TV (vista lateral), em METROS
// Câmera na lateral leste olhando um campo de 90 × 60 m. x = ao longo do campo (px de mundo, ortográfico);
// y = profundidade na tela (encurtada pela perspectiva). Uma pessoa na profundidade y tem escala tvK(y).
// câmera elevada ~15° (como numa transmissão): 1 m de profundidade = 0,24 m ao longo do campo, na tela
const TV = { yLonge: 960 };
TV.M = PX_M * 0.67;                                // px por metro ao longo do campo (pessoa no meio da profundidade: s = 0,67)
TV.P = TV.M * 0.24;                                // px por metro na profundidade
TV.yPerto = TV.yLonge + 60 * TV.P;                 // lateral de cá
TV.yMeio = (TV.yLonge + TV.yPerto) / 2;
TV.L = 90 * TV.M;                                  // comprimento do campo
const tvK = y => 0.42 + (y - TV.yLonge) / (TV.yPerto - TV.yLonge) * 0.5;
TV.gol = [TV.yMeio - 3.66 * TV.P, TV.yMeio + 3.66 * TV.P];   // postes: 7,32 m
const tvM = v => v * TV.M;
const tvD = v => TV.yMeio + v * TV.P;              // profundidade a partir do meio (metros; − = lado de lá)
// posição na tela (antes do zoom) de um ponto do mundo (x ao longo do campo, y = profundidade, h = altura em px de s = 1)
const tvP = (x, y, cam, h = 0) => [x - cam + W / 2, y - h * tvK(y)];
const TV_X0 = -2700, TV_X1 = W + 2700;             // largura desenhada: cobre a câmera aberta (zoom até 0,3)

// fundo em camadas (como no detetive), desenhado na TELA: céu + morro com casas, com paralaxe e escala próprias,
// para a câmera poder abrir (zoom < 1) sem buraco. yMuro = onde o topo do muro do fundo cai na tela.
function tvFundo(t, cam, z, yMuro) {
  let s = ceu(t);
  const sz = 0.55 + 0.45 * Math.min(1, z), desl = -cam * 0.06 * sz, larg = 1180 * sz;
  const i0 = Math.floor((-desl - 200) / larg) - 1, i1 = Math.ceil((W - desl + 200) / larg) + 1;
  for (let i = i0; i <= i1; i++) {
    s += `<g transform="translate(${(desl + i * larg).toFixed(1)} ${(yMuro + 30).toFixed(1)}) scale(${sz.toFixed(3)}) translate(0 -800)">${bairro(800, { xMin: -60, xMax: 1240 }).replace(/data-v="[^"]*" /g, '')}</g>`;
  }
  return s;
}

function tvCenario(estrutura, cam, t = 0, { torcida = 0, nome = '', fundo = true } = {}) {
  const fora = !!window._local, grama = estrutura.gramado === 'grama';
  const px = (x, f = 1) => (x - cam) * f + W / 2;                       // paralaxe: f < 1 = longe
  const dentro = (x, folga = 300) => x > TV_X0 - folga && x < TV_X1 + folga;
  let s = '';
  // morro e casas bem ao fundo (andam devagar) — só quando o fundo vem junto (câmera com zoom ≥ 1)
  if (fundo) s += ceu(t) + `<g transform="translate(${(-(cam - TV.L / 2) * 0.25).toFixed(1)} 0)">${bairro(780, { xMin: -700, xMax: 1800 })}</g>`;
  // muro do fundo (lado oeste), com o nome do dono do campo (2,5 m de altura)
  const corMuro = fora ? coresTime(window._local.nome)[0] : CORES.vinho, nomeMuro = fora ? window._local.nome : nome;
  s += `<rect x="${TV_X0}" y="800" width="${TV_X1 - TV_X0}" height="${TV.yLonge - 800}" fill="#e9e1d1" stroke="${OUT}" stroke-width="5"/>
    <rect x="${TV_X0}" y="792" width="${TV_X1 - TV_X0}" height="10" fill="#cfc6ba" stroke="${OUT}" stroke-width="3"/>`;
  for (let i = Math.floor((cam - 3600) / 900); i <= Math.ceil((cam + 3600) / 900); i++) { const x = px(i * 900 + 450, 0.92); if (dentro(x))
    s += `<text x="${x.toFixed(0)}" y="868" text-anchor="middle" font-family="Anton" font-size="44" fill="${corMuro}" opacity=".85" letter-spacing="4">${esc((nomeMuro || '').toUpperCase())}</text>`; }
  // lateral oeste (fundo): obra ou arquibancada nova, ao longo do meio do campo; senão, árvores atrás do alambrado
  if (!fora && (estrutura.obra_arquibancada || estrutura.arquibancada_lateral)) s += tvLateralOeste(estrutura, cam, t, torcida);
  else for (let x = 300; x < TV.L; x += 640) { const sx = px(x, 0.97); if (dentro(sx, 100)) s += arvore(sx, TV.yLonge - 4, 46, 'tv' + x, x % 3); }
  // chão de fora e o campo (90 m)
  s += `<rect x="${TV_X0}" y="${TV.yLonge - 8}" width="${TV_X1 - TV_X0}" height="${H + 3000 - TV.yLonge}" fill="#b98b57"/>`;
  const x0 = px(0), x1 = px(TV.L);
  s += `<path d="M${x0},${TV.yLonge} H${x1} V${TV.yPerto} H${x0}Z" fill="${grama ? CORES.grama1 : 'url(#gterra)'}"/>`;
  if (grama) for (let i = 0; i < 18; i++) { const a = px(i * TV.L / 18); if (dentro(a)) s += `<path d="M${a},${TV.yLonge} h${TV.L / 36} v${TV.yPerto - TV.yLonge} h${-TV.L / 36}z" fill="${CORES.grama2}" opacity=".7"/>`; }
  else { const r = rng('tv-pedras'); for (let i = 0; i < 260; i++) { const x = px(r() * TV.L), y = TV.yLonge + 20 + r() * (TV.yPerto - TV.yLonge - 40), rx = 8 + r() * 26, ry = 3 + r() * 6;
    if (dentro(x, 60)) s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="#8b4a22" opacity=".4"/>`; } }
  // linhas oficiais: laterais, fundo, meio, círculo (9,15 m), grande área (16,5 × 40,3 m), pequena área (5,5 × 18,3 m), marca do pênalti (11 m)
  const lc = grama ? '#ffffffdd' : '#ffffff88', xm = px(TV.L / 2);
  s += `<path d="M${x0},${TV.yLonge} H${x1} M${x0},${TV.yPerto} H${x1} M${x0},${TV.yLonge} V${TV.yPerto} M${x1},${TV.yLonge} V${TV.yPerto} M${xm},${TV.yLonge} V${TV.yPerto}" stroke="${lc}" stroke-width="7" fill="none"/>
    <ellipse cx="${xm}" cy="${TV.yMeio}" rx="${tvM(9.15)}" ry="${9.15 * TV.P}" fill="none" stroke="${lc}" stroke-width="6"/>
    ${[[0, 1], [TV.L, -1]].map(([gx, d]) => `<path d="M${px(gx)},${tvD(-20.16)} H${px(gx + d * tvM(16.5))} V${tvD(20.16)} H${px(gx)} M${px(gx)},${tvD(-9.16)} H${px(gx + d * tvM(5.5))} V${tvD(9.16)} H${px(gx)}" fill="none" stroke="${lc}" stroke-width="6"/>
      <ellipse cx="${px(gx + d * tvM(11))}" cy="${TV.yMeio}" rx="9" ry="4" fill="${lc}"/>`).join('')}`;
  return s;
}

// trave vista de lado: dois postes (um mais longe) ligados pelo travessão, rede para fora do campo
function tvTrave(gx, cam, dir, t = 0, { balanco = 0 } = {}) {
  // dir = +1: gol na ponta direita (rede para a direita); -1: ponta esquerda
  const [ya, yb] = TV.gol, k = y => tvK(y), h = m(2.44);   // travessão a 2,44 m
  const [xa, ta] = tvP(gx, ya, cam, h), [xb, tb] = tvP(gx, yb, cam, h);
  const fa = tvP(gx, ya, cam), fb = tvP(gx, yb, cam);
  const fundo = m(1.2) * dir;   // a rede vai 1,2 m para trás
  const b = balanco * dir * 18;
  return `<path d="M${fa[0]},${fa[1]} L${fa[0] + fundo * k(ya) + b},${fa[1]} L${xa + fundo * k(ya) * 0.6 + b},${ta + 20} L${xa},${ta}
      M${fb[0]},${fb[1]} L${fb[0] + fundo * k(yb) + b},${fb[1]} L${xb + fundo * k(yb) * 0.6 + b},${tb + 20} L${xb},${tb}
      M${fa[0] + fundo * k(ya) + b},${fa[1]} L${fb[0] + fundo * k(yb) + b},${fb[1]} M${xa + fundo * k(ya) * 0.6 + b},${ta + 20} L${xb + fundo * k(yb) * 0.6 + b},${tb + 20}"
      fill="#ffffff30" stroke="#fff" stroke-width="2.5" opacity=".85"/>
    ${Array.from({ length: 6 }, (_, i) => { const u = (i + 1) / 7, y = ya + (yb - ya) * u, p = tvP(gx, y, cam), q = tvP(gx, y, cam, h);
      return `<path d="M${p[0] + fundo * k(y) + b},${p[1]} L${q[0] + fundo * k(y) * 0.6 + b},${q[1] + 20}" stroke="#fff" stroke-width="2" opacity=".6"/>`; }).join('')}
    <path d="M${fa[0]},${fa[1]} L${xa},${ta} L${xb},${tb} L${fb[0]},${fb[1]}" fill="none" stroke="${OUT}" stroke-width="14" stroke-linejoin="round"/>
    <path d="M${fa[0]},${fa[1]} L${xa},${ta} L${xb},${tb} L${fb[0]},${fb[1]}" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/>`;
}

// lateral oeste na vista de TV (do outro lado do campo, perto do muro): a arquibancada nova, em medidas reais —
// 60 m ao longo do meio do campo, 12 degraus de 45 cm (5,4 m de altura), ~1.500 lugares. Na obra, a parte pronta
// avança da esquerda para a direita, com andaime e pedreiros na frente de trabalho.
const TV_ARQ = { meia: 30, nDeg: 12 };
function tvLateralOeste(estrutura, cam, t = 0, torcida = 0) {
  const obra = estrutura.obra_arquibancada, prog = obra ? Math.min(1, ((obra.feitos || 0) + 1) / ((obra.jogos || 3) + 1)) : 1;
  const k = tvK(TV.yLonge), nDeg = TV_ARQ.nDeg, passoH = m(0.45) * k, passoP = m(0.8) * k * 0.3;
  const xa = TV.L / 2 - tvM(TV_ARQ.meia), xb = TV.L / 2 + tvM(TV_ARQ.meia), base = TV.yLonge - 6;
  const px = x => (x - cam) * 0.97 + W / 2;
  if (px(xb) < TV_X0 - 200 || px(xa) > TV_X1 + 200) return '';
  const xPronto = obra ? xa + (xb - xa) * prog : xb;
  let s = `<rect x="${px(xa) - 10}" y="${base - nDeg * passoH - 8}" width="${px(xb) - px(xa) + 20}" height="${nDeg * passoH + 14}" fill="#000" opacity=".1"/>`;
  for (let d = nDeg - 1; d >= 0; d--) {
    const y = base - (d + 1) * passoH, recuo = d * passoP;
    s += `<rect x="${px(xa) + recuo}" y="${y}" width="${Math.max(0, px(xPronto) - px(xa) - recuo)}" height="${passoH}" fill="${obra ? '#c79a6b' : '#b08968'}" stroke="${OUT}" stroke-width="2.5"/>`;
    if (obra) s += `<path d="M${px(xPronto)},${y + passoH / 2} H${px(xb) - recuo}" stroke="#7f5539" stroke-width="3"/>`;
  }
  const hP = (nDeg + 0.3) * passoH;
  for (let x = xa; x <= xb + 1; x += tvM(5)) { const sx = px(x); if (sx < TV_X0 - 50 || sx > TV_X1 + 50) continue;
    s += `<path d="M${sx},${base} V${base - hP}" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/><path d="M${sx},${base} V${base - hP}" stroke="#9c6644" stroke-width="4.5" stroke-linecap="round"/>`; }
  if (obra) {
    // andaime (3 m), faixa zebrada e pedreiros (na escala da distância) na frente de trabalho
    const xo = px(xPronto), ha = m(3) * k, la = m(1.2) * k;
    s += `<path d="M${xo + 8},${base} V${base - ha} M${xo + 8 + la},${base} V${base - ha} M${xo + 8},${base - ha / 2} H${xo + 8 + la} M${xo + 8},${base - ha} H${xo + 8 + la} M${xo + 8},${base} L${xo + 8 + la},${base - ha / 2} L${xo + 8},${base - ha}" stroke="#6c757d" stroke-width="4" fill="none"/>
      <path d="M${px(xa) - 30},${base + 4} H${px(xb) + 30}" stroke="${OUT}" stroke-width="8"/><path d="M${px(xa) - 30},${base + 4} H${px(xb) + 30}" stroke="#ffd60a" stroke-width="5" stroke-dasharray="14 12"/>`;
    s += [[-1.2, 0, 'caixa'], [2.6, 1, 'aponta'], [4.4, 2, 'normal']].map(([dx, i, pose]) => pessoa({ pele: ['#a0673e', '#e0ac69', '#8d5524'][i], cabelo: 'curto', corCabelo: '#2b1d14', bone: '#ffd60a', camisa: '#f77f00', calcao: '#495057', meiao: '#343a40',
      pose, expr: 'serio', bigode: i === 1 }, t, { x: xo + tvM(dx), y: base, s: k, fase: i }).replace(/class="rosto" /g, '')).join('');
  } else if (torcida > 0) {
    const r = rng('tv-oeste'); let n = Math.min(320, Math.round(torcida / 5));
    for (let i = 0; n > 0 && i < 1200; i++) { const d = Math.floor(r() * nDeg), x = xa + tvM(0.5) + r() * (xb - xa - tvM(1)), cor = r() > 0.3 ? CORES.vinho : CORES.amarelo, pele = PELES[Math.floor(r() * PELES.length)]; n--;
      const sx = px(x) + d * passoP; if (sx < TV_X0 || sx > TV_X1) continue;
      const y = base - (d + 0.15) * passoH, pulo = Math.abs(Math.sin(t * 6 + i)) * 2, bw = m(0.44) * k, bh = m(0.55) * k;
      s += `<rect x="${(sx - bw / 2).toFixed(1)}" y="${(y - bh - pulo).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${(bw / 3).toFixed(1)}" fill="${cor}" stroke="${OUT}" stroke-width="1.5"/><circle cx="${sx.toFixed(1)}" cy="${(y - bh - m(0.15) * k - pulo).toFixed(1)}" r="${(m(0.13) * k).toFixed(1)}" fill="${pele}" stroke="${OUT}" stroke-width="1.5"/>`; }
  }
  return s;
}

// lateral leste (perto da câmera, embaixo da tela): banco, pomponetes e o Caramelo, em tamanho real nessa profundidade
function tvLateralLeste(estrutura, cam, t = 0) {
  const yb = TV.yPerto + 3 * TV.P, k = tvK(yb), px = x => (x - cam) + W / 2, fora = !!window._local;
  let s = '';
  if (estrutura.banco_reservas && !fora) s += `<g transform="translate(${px(TV.L / 2 + tvM(4))} ${yb}) scale(${k})">${bancoReservasFrente()}</g>`;
  if (estrutura.pomponetes) [TV.L / 2 - tvM(3), TV.L / 2 - tvM(1.6)].forEach((x, i) => {
    s += pessoa({ pele: PELES[(i * 2 + 1) % PELES.length], cabelo: 'coque', corCabelo: i ? '#7a4b2a' : '#1b1b1b', camisa: CORES.amarelo, listra: CORES.vinho,
      calcao: CORES.vinho, meiao: '#fff', pompons: CORES.vinho, pose: Math.sin(t * 4 + i) > 0 ? 'comemora' : 'acena', expr: 'feliz' }, t, { x: px(x), y: yb + 15, s: k, fase: i }).replace(/class="rosto" /g, '');
  });
  if (estrutura.mascote && !fora) s += `<g transform="translate(${px(TV.L / 2 + tvM(0.6))} ${yb + 8}) scale(${k})">${caramelo(t)}</g>`;
  return s;
}

// ------------------------------------------------------------ lances
// Jogador visto de lado na TV: corre (alterna a passada), comemora ou lamenta. O rosto não entra na checagem
// de sobreposição (passa embaixo da legenda durante o lance).
function tvJogador(visual, x, y, cam, t, { correndo = false, fase = 0, pose = null } = {}) {
  const k = tvK(y), [sx, sy] = tvP(x, y, cam);
  if (sx < -200 || sx > W + 200) return '';
  const passo = correndo ? (Math.floor(t * 7 + fase) % 2 ? 'chute' : 'normal') : 'normal';
  return pessoa({ ...visual, pose: pose || passo }, t, { x: sx, y: sy, s: k, fase }).replace(/class="rosto" /g, '');
}
function tvBola(x, y, cam, h = 0) {
  const k = tvK(y), [sx, sy] = tvP(x, y, cam, h), r = 11 * k * 1.6;
  return `<ellipse cx="${tvP(x, y, cam)[0]}" cy="${y + 2}" rx="${r * 1.1}" ry="${r * 0.35}" fill="#000" opacity="${0.25 * Math.max(0.2, 1 - h / 300)}"/>
    <circle cx="${sx}" cy="${sy - r}" r="${r}" fill="#fff" stroke="${OUT}" stroke-width="3"/><path d="M${sx - r * 0.4},${sy - r - r * 0.3} l${r * 0.4},${-r * 0.3} l${r * 0.4},${r * 0.3} l${-r * 0.15},${r * 0.45} h${-r * 0.5}z" fill="${OUT}"/>`;
}
const lerp = (a, b, p) => a + (b - a) * p;
const vis = (n, E, extra = {}) => jogador(n, E, extra);
const visAdv = (adv, n, extra = {}) => { const [c1, c2] = coresTime(adv), r = rng('adv' + adv + n);
  return { pele: PELES[Math.floor(r() * PELES.length)], cabelo: ['curto', 'raspado', 'cacheado', 'careca'][Math.floor(r() * 4)], corCabelo: '#2b1d14',
    camisa: c1, listra: c2, calcao: c2, meiao: c1, numero: String(n), bigode: r() > 0.6, idade: adv.includes('Veteranos'), ...extra }; };

// câmera da obra: onde a frente de trabalho está agora
const tvObraCam = est => { const o = est.obra_arquibancada; const p = o ? Math.min(1, ((o.feitos || 0) + 1) / ((o.jogos || 3) + 1)) : 0.5; return TV.L / 2 + tvM(TV_ARQ.meia) * (2 * p - 1); };
Object.assign(window, { tvObraCam, TV, tvK, tvP, tvCenario, tvTrave, tvLateralOeste, tvLateralLeste, tvJogador, tvBola, tvFundo, tvM, tvD, visAdv });
