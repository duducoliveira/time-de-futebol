// ============================================================ mundo.js
// Novos enquadramentos do mesmo mundo (o bairro do Poeira), para os vídeos não repetirem:
//  - TV: o campo visto da lateral direita (leste), como numa transmissão; a câmera acompanha a bola.
//        Ao fundo, a lateral esquerda (oeste) com a obra / arquibancada nova; nas pontas, os gols.
//  - lances de jogo (passe, drible, chute, defesa) para contar cada gol.
//  - bar por dentro, celular da Dona Cida, quadro de avisos, quadro-negro e caderno do caixa.
//  - rua do adversário (chegada de Kombi), saída do vestiário, pôr do sol.
// Tudo na escala do resto: uma pessoa em s = 1 tem ~300 px.

// ------------------------------------------------------------ TV (vista lateral)
const TV = { L: 2200, yLonge: 960, yPerto: 1730, gol: [1210, 1450] };   // campo: x 0..L; profundidade (y na tela) longe..perto
const tvK = y => 0.42 + (y - TV.yLonge) / (TV.yPerto - TV.yLonge) * 0.5;   // escala de pessoa na profundidade
// posição na tela de um ponto do mundo (x ao longo do campo, y = profundidade na tela, h = altura acima do chão)
const tvP = (x, y, cam, h = 0) => [x - cam + W / 2, y - h * tvK(y)];

function tvCenario(estrutura, cam, t = 0, { torcida = 0, nome = '' } = {}) {
  const fora = !!window._local, grama = estrutura.gramado === 'grama';
  const px = (x, f = 1) => (x - cam) * f + W / 2;                       // paralaxe: f < 1 = longe
  let s = ceu(t);
  // morro e casas bem ao fundo (andam devagar)
  s += `<g transform="translate(${(-(cam - TV.L / 2) * 0.25).toFixed(1)} 0)">${bairro(780, { xMin: -700, xMax: 1800 })}</g>`;
  // muro do fundo (lado oeste), com o nome do dono do campo
  const corMuro = fora ? coresTime(window._local.nome)[0] : CORES.vinho, nomeMuro = fora ? window._local.nome : nome;
  s += `<rect x="-10" y="800" width="${W + 20}" height="${TV.yLonge - 800}" fill="#e9e1d1" stroke="${OUT}" stroke-width="5"/>
    <rect x="-10" y="792" width="${W + 20}" height="10" fill="#cfc6ba" stroke="${OUT}" stroke-width="3"/>`;
  for (let i = -2; i < 4; i++) { const x = px(i * 800 + 400, 0.92); if (x > -300 && x < W + 300)
    s += `<text x="${x}" y="868" text-anchor="middle" font-family="Anton" font-size="44" fill="${corMuro}" opacity=".85" letter-spacing="4">${esc((nomeMuro || '').toUpperCase())}</text>`; }
  // lateral oeste (fundo): obra ou arquibancada nova, ao longo do meio do campo
  if (!fora && (estrutura.obra_arquibancada || estrutura.arquibancada_lateral)) s += tvLateralOeste(estrutura, cam, t, torcida);
  else for (const x of [300, 900, 1500, 2000]) { const sx = px(x, 0.97); if (sx > -150 && sx < W + 150) s += arvore(sx, TV.yLonge - 4, 46, 'tv' + x, x % 3); }
  // chão de fora (faixas antes/depois do campo) e o campo
  s += `<rect x="-10" y="${TV.yLonge - 8}" width="${W + 20}" height="${H - TV.yLonge + 8}" fill="#b98b57"/>`;
  const x0 = px(0), x1 = px(TV.L);
  s += `<path d="M${x0 - 40},${TV.yLonge} H${x1 + 40} L${x1 + 80},${TV.yPerto} H${x0 - 80}Z" fill="${grama ? CORES.grama1 : 'url(#gterra)'}"/>`;
  if (grama) for (let i = 0; i < 11; i++) { const a = px(i * 200); s += `<path d="M${a},${TV.yLonge} h100 l4,${TV.yPerto - TV.yLonge} h-100z" fill="${CORES.grama2}" opacity=".7"/>`; }
  else { const r = rng('tv-pedras'); for (let i = 0; i < 40; i++) { const x = px(r() * TV.L), y = TV.yLonge + 20 + r() * (TV.yPerto - TV.yLonge - 40);
    if (x > -60 && x < W + 60) s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(8 + r() * 26).toFixed(0)}" ry="${(3 + r() * 6).toFixed(0)}" fill="#8b4a22" opacity=".4"/>`; } }
  const lc = grama ? '#ffffffdd' : '#ffffff88', xm = px(TV.L / 2);
  s += `<path d="M${x0 - 40},${TV.yLonge} H${x1 + 40} M${x0 - 80},${TV.yPerto} H${x1 + 80} M${x0 - 40},${TV.yLonge} L${x0 - 80},${TV.yPerto} M${x1 + 40},${TV.yLonge} L${x1 + 80},${TV.yPerto}" stroke="${lc}" stroke-width="7" fill="none"/>
    <path d="M${xm},${TV.yLonge} V${TV.yPerto}" stroke="${lc}" stroke-width="7"/>
    <ellipse cx="${xm}" cy="${(TV.yLonge + TV.yPerto) / 2}" rx="120" ry="160" fill="none" stroke="${lc}" stroke-width="6"/>
    ${[[0, 1], [TV.L, -1]].map(([gx, d]) => `<path d="M${px(gx) + d * -38},${1120} H${px(gx + d * 330)} V${1560} H${px(gx) + d * -60}" fill="none" stroke="${lc}" stroke-width="6"/>`).join('')}`;
  return s;
}

// trave vista de lado: dois postes (um mais longe) ligados pelo travessão, rede para fora do campo
function tvTrave(gx, cam, dir, t = 0, { balanco = 0 } = {}) {
  // dir = +1: gol na ponta direita (rede para a direita); -1: ponta esquerda
  const [ya, yb] = TV.gol, k = y => tvK(y), h = 2.44 * 120;   // altura do gol ~1,45 pessoa
  const [xa, ta] = tvP(gx, ya, cam, h), [xb, tb] = tvP(gx, yb, cam, h);
  const fa = tvP(gx, ya, cam), fb = tvP(gx, yb, cam);
  const fundo = 70 * dir;
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

// lateral oeste na vista de TV: estrutura de degraus ao longo do campo (obra) ou pronta, com torcida
function tvLateralOeste(estrutura, cam, t = 0, torcida = 0) {
  const obra = estrutura.obra_arquibancada, prog = obra ? Math.min(1, ((obra.feitos || 0) + 1) / ((obra.jogos || 3) + 1)) : 1;
  const xa = 500, xb = 1700, base = TV.yLonge - 6, nDeg = 4, passoH = 46, passoP = 20;
  const px = x => (x - cam) * 0.97 + W / 2;
  const xPronto = obra ? xa + (xb - xa) * prog : xb;   // a obra avança da esquerda para a direita
  let s = `<rect x="${px(xa) - 10}" y="${base - nDeg * passoH - 8}" width="${px(xb) - px(xa) + 20}" height="${nDeg * passoH + 14}" fill="#000" opacity=".1"/>`;
  for (let d = nDeg - 1; d >= 0; d--) {
    const y = base - (d + 1) * passoH, recuo = d * passoP;
    s += `<rect x="${px(xa) + recuo}" y="${y}" width="${Math.max(0, px(xPronto) - px(xa) - recuo)}" height="${passoH}" fill="${obra ? '#c79a6b' : '#b08968'}" stroke="${OUT}" stroke-width="3"/>`;
    if (obra) s += `<path d="M${px(xPronto)},${y + passoH / 2} H${px(xb) - recuo}" stroke="#7f5539" stroke-width="5"/>`;
  }
  for (let x = xa; x <= xb; x += 100) { const h = (nDeg + 0.3) * passoH;
    s += `<path d="M${px(x)},${base} V${base - h}" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/><path d="M${px(x)},${base} V${base - h}" stroke="#9c6644" stroke-width="5" stroke-linecap="round"/>`; }
  if (obra) {
    // andaime, faixa zebrada e pedreiros (na escala da distância) trabalhando na ponta da obra
    const xo = px(xPronto);
    s += `<path d="M${xo + 10},${base} V${base - 170} M${xo + 70},${base} V${base - 170} M${xo + 10},${base - 85} H${xo + 70} M${xo + 10},${base - 170} H${xo + 70} M${xo + 10},${base} L${xo + 70},${base - 85} L${xo + 10},${base - 170}" stroke="#6c757d" stroke-width="5" fill="none"/>
      <path d="M${px(xa) - 30},${base + 4} H${px(xb) + 30}" stroke="${OUT}" stroke-width="9"/><path d="M${px(xa) - 30},${base + 4} H${px(xb) + 30}" stroke="#ffd60a" stroke-width="6" stroke-dasharray="16 14"/>`;
    s += [0, 1].map(i => pessoa({ pele: i ? '#e0ac69' : '#a0673e', cabelo: 'curto', corCabelo: '#2b1d14', bone: '#ffd60a', camisa: '#f77f00', calcao: '#495057', meiao: '#343a40',
      pose: i ? 'aponta' : 'caixa', expr: 'serio' }, t, { x: xo - 40 + i * 130, y: base, s: 0.4, fase: i }).replace(/class="rosto" /g, '')).join('');
  } else if (torcida > 0) {
    const r = rng('tv-oeste'); let n = Math.min(90, Math.round(torcida / 20));
    for (let i = 0; n > 0 && i < 400; i++) { const d = i % nDeg, x = xa + 30 + r() * (xb - xa - 60), y = base - (d + 0.4) * passoH; n--;
      const pulo = Math.abs(Math.sin(t * 6 + i)) * 3;
      s += `<rect x="${px(x) - 9}" y="${y - 22 - pulo}" width="18" height="22" rx="6" fill="${r() > 0.3 ? CORES.vinho : CORES.amarelo}" stroke="${OUT}" stroke-width="2"/><circle cx="${px(x)}" cy="${y - 30 - pulo}" r="8" fill="${PELES[Math.floor(r() * PELES.length)]}" stroke="${OUT}" stroke-width="2"/>`; }
  }
  return s;
}

// lateral leste (perto da câmera, embaixo da tela): banco, pomponetes e o Caramelo
function tvLateralLeste(estrutura, cam, t = 0) {
  const px = x => (x - cam) * 1.08 + W / 2, fora = !!window._local;
  let s = '';
  if (estrutura.banco_reservas && !fora) s += `<g transform="translate(${px(TV.L / 2 + 260)} 1905) scale(1.25)">${bancoReservasFrente()}</g>`;
  if (estrutura.pomponetes) [TV.L / 2 - 260, TV.L / 2 - 120].forEach((x, i) => {
    s += pessoa({ pele: PELES[(i * 2 + 1) % PELES.length], cabelo: 'coque', corCabelo: i ? '#7a4b2a' : '#1b1b1b', camisa: CORES.amarelo, listra: CORES.vinho,
      calcao: CORES.vinho, meiao: '#fff', pompons: CORES.vinho, pose: Math.sin(t * 4 + i) > 0 ? 'comemora' : 'acena', expr: 'feliz' }, t, { x: px(x), y: 1925, s: 0.95, fase: i }).replace(/class="rosto" /g, '');
  });
  if (estrutura.mascote && !fora) s += `<g transform="translate(${px(TV.L / 2 + 40)} 1915) scale(.95)">${caramelo(t)}</g>`;
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

// Um gol contado como lance: o time que ataca sai do meio, toca, o autor finaliza e o goleiro pula do lado errado.
// tempos: tPasse (o passe), tChute (a finalização); a bola entra ~0,45 s depois do chute.
function lanceGol(t, E, dd, { tPasse = 1.0, tChute = 2.0 } = {}) {
  const nosso = dd.nosso, adv = dd.mandante === E.clube.nome ? dd.visitante : dd.mandante;
  const dir = nosso ? 1 : -1, golX = dir > 0 ? TV.L : 0;            // nós atacamos para a direita; eles, para a esquerda
  const at = x => golX - dir * x;                                   // distância até o gol
  const autorN = dd.autor_numero || '9', passN = dd.passador_numero || '10';
  const vAut = nosso ? vis(autorN, E) : visAdv(adv, 9), vPas = nosso ? vis(passN, E) : visAdv(adv, 10);
  const vDef = nosso ? visAdv(adv, 4) : vis('3', E), vGol = nosso ? visAdv(adv, 1, { luvas: true, camisa: '#495057', listra: null }) : vis('1', E);
  const yP = 1520, yA = 1300, yG = (TV.gol[0] + TV.gol[1]) / 2;
  // posições ao longo do tempo
  const tEntra = tChute + 0.45;
  const pP = clamp(t / Math.max(0.3, tPasse)), pA = clamp((t - tPasse) / Math.max(0.3, tChute - tPasse));
  const pasX = at(lerp(900, 640, pP)), autX = at(lerp(760, 300, clamp(t / tChute)));
  let bx, by, bh = 0;
  if (t < tPasse) { bx = pasX + dir * 30; by = yP; }
  else if (t < tPasse + 0.45) { const q = (t - tPasse) / 0.45; bx = lerp(at(640) + dir * 30, at(lerp(760, 300, clamp(tPasse / tChute + 0.45 / tChute))), q); by = lerp(yP, yA, q); bh = Math.sin(q * Math.PI) * 60; }
  else if (t < tChute) { bx = autX + dir * 28; by = yA; }
  else if (t < tEntra) { const q = (t - tChute) / 0.45; bx = lerp(at(300) + dir * 28, at(-50), q); by = lerp(yA, yG + 40, q); bh = Math.sin(q * Math.PI * 0.8) * 120 + q * 60; }
  else { bx = at(-55); by = yG + 40; bh = 40; }
  const cam = clamp(bx, W / 2 - 120, TV.L - W / 2 + 120);
  let s = tvCenario(E.estrutura, cam, t, { torcida: E._torcida, nome: E.clube.nome });
  // goleiro: espera no meio do gol e pula para o lado errado na hora do chute
  const mg = easeOut(clamp((t - tChute) / 0.35));
  const kgY = lerp(yG, yG + (dir > 0 ? -150 : 150), mg);
  const gol = [];   // camadas ordenadas pela profundidade (y): quem está mais perto fica na frente
  gol.push([kgY, () => { const [gx, gy] = tvP(at(25), kgY, cam); return `<g transform="translate(${gx} ${gy}) rotate(${dir * 70 * mg})">${pessoa({ ...vGol, pose: 'comemora', expr: 'surpreso' }, t, { s: tvK(kgY) }).replace(/class="rosto" /g, '')}</g>`; }]);
  gol.push([yP + 10, () => tvJogador(vPas, pasX, yP + 10, cam, t, { correndo: t < tPasse + 0.3, pose: t > tEntra ? 'comemora' : null })]);
  gol.push([yA, () => tvJogador(vAut, t > tEntra ? lerp(autX, at(150), clamp((t - tEntra) / 1.2)) : autX, yA, cam, t, { correndo: t < tChute || t > tEntra, fase: 1, pose: t > tEntra ? 'comemora' : (Math.abs(t - tChute) < 0.2 ? 'chute' : null) })]);
  gol.push([yA + 90, () => tvJogador(vDef, lerp(at(520), at(330), clamp(t / tChute)) , yA + 90, cam, t, { correndo: t < tChute, fase: 2, pose: t > tEntra ? 'normal' : null })]);
  gol.push([by, () => tvBola(bx, by, cam, bh)]);
  gol.sort((a, b) => a[0] - b[0]);
  s += tvTrave(golX, cam, dir, t, { balanco: t > tEntra ? Math.max(0, 1 - (t - tEntra) * 2) * Math.sin((t - tEntra) * 30) : 0 });
  s += gol.map(g => g[1]()).join('');
  s += tvLateralLeste(E.estrutura, cam, t);
  return s;
}

// câmera da obra: onde a frente de trabalho está agora
const tvObraCam = est => { const o = est.obra_arquibancada; const p = o ? Math.min(1, ((o.feitos || 0) + 1) / ((o.jogos || 3) + 1)) : 0.5; return 500 + 1200 * p; };
Object.assign(window, { tvObraCam, TV, tvK, tvP, tvCenario, tvTrave, tvLateralOeste, tvLateralLeste, tvJogador, tvBola, lanceGol, visAdv });
