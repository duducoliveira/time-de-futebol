// ============================================================ cenas2.js
// Variações de enquadramento para cada parte do vídeo. O roteiro (Python, "diretor de cena") escolhe
// c.dados.variante; aqui cada variante tem seu desenho. Sem variante (ou desconhecida), vale a cena original.
// Lugares novos: bar por dentro (mural de recados, quadro-negro, caderno do caixa, TV), celular da Dona Cida,
// álbum de figurinhas, placar de madeira, saída do vestiário, rua do adversário, pôr do sol.

// ------------------------------------------------------------ cenários
const PAPEL = ['#fff4b8', '#ffffff', '#ffd6e0', '#d8f3dc', '#cde7ff'];
const CHALK = '#f1f3f5';

// ---- câmera por chaves (como no detetive): [t, x, y, zoom, ySaida?] → o ponto (x, y) do mundo vai para
// (540, ySaida) da tela; entre as chaves, aceleração suave e zoom em escala logarítmica.
function camChaves(t, chaves) {
  let i = 0;
  while (i < chaves.length - 2 && t >= chaves[i + 1][0]) i++;
  const a = chaves[i], b = chaves[i + 1] || a, k0 = clamp((t - a[0]) / Math.max(0.001, b[0] - a[0]));
  const k = k0 < 0.5 ? 4 * k0 * k0 * k0 : 1 - Math.pow(-2 * k0 + 2, 3) / 2;
  const z = Math.exp(Math.log(a[3]) + (Math.log(b[3]) - Math.log(a[3])) * k);
  return { x: a[1] + (b[1] - a[1]) * k, y: a[2] + (b[2] - a[2]) * k, z, sy: (a[4] ?? 960) + ((b[4] ?? 960) - (a[4] ?? 960)) * k };
}
const naCamera = (cam, svg) => `<g transform="translate(540 ${cam.sy.toFixed(1)}) scale(${cam.z.toFixed(4)}) translate(${(-cam.x).toFixed(1)} ${(-cam.y).toFixed(1)})">${svg}</g>`;

// ---- bar por dentro, em perspectiva: teto, paredes laterais e piso convergem para a parede do fundo.
const ATRAS = 1392;   // pé de quem está atrás do balcão (o balcão esconde as pernas)
// Escala: pessoa no balcão (pé em ~1330) s≈0,95; no primeiro plano (pé em ~1900) s≈1,35. Porta da rua ≈ 290.
const BAR = { fx0: 150, fx1: 930, fy0: 250, fy1: 1250, mural: [170, 470, 350, 290], quadro: [560, 470, 350, 290] };
function barDentro(t = 0, E = {}, { mural = true, quadro = true, atras = '' } = {}) {
  const { fx0, fx1, fy0, fy1 } = BAR;
  let s = `<rect x="-600" y="-600" width="${W + 1200}" height="${H + 1200}" fill="#3d2b1f"/>`;
  // teto (forro de madeira) e paredes laterais
  s += `<path d="M-600,-600 H${W + 600} L${fx1},${fy0} H${fx0}Z" fill="#a47148"/>
    ${Array.from({ length: 13 }, (_, i) => { const u = i / 12; return `<path d="M${-600 + u * (W + 1200)},-600 L${fx0 + u * (fx1 - fx0)},${fy0}" stroke="#8a5a36" stroke-width="4"/>`; }).join('')}
    <path d="M-600,-600 L${fx0},${fy0} V${fy1} L-600,${H + 600}Z" fill="#e8c38f"/>
    <path d="M${W + 600},-600 L${fx1},${fy0} V${fy1} L${W + 600},${H + 600}Z" fill="#e2b984"/>
    <path d="M-600,${fy1 + 420} L${fx0},${fy1 - 300} V${fy1} L-600,${H + 600}Z" fill="#c98a52" opacity=".9"/>
    <path d="M${W + 600},${fy1 + 420} L${fx1},${fy1 - 300} V${fy1} L${W + 600},${H + 600}Z" fill="#bd7f48" opacity=".9"/>`;
  // parede do fundo
  s += `<rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}" fill="#f3d9b1" stroke="${OUT}" stroke-width="4"/>
    <rect x="${fx0}" y="${fy1 - 300}" width="${fx1 - fx0}" height="300" fill="#c98a52"/>
    ${Array.from({ length: 10 }, (_, i) => `<path d="M${fx0 + i * 78},${fy1 - 300} v300" stroke="#a96d3b" stroke-width="3"/>`).join('')}
    <rect x="${fx0}" y="${fy1 - 308}" width="${fx1 - fx0}" height="12" fill="#8d5a2b"/>`;
  // TV (passando o escudo), relógio, flâmula do Poeira e prateleira com garrafas
  s += `<path d="M260,${fy0} v30 M340,${fy0} v30" stroke="${OUT}" stroke-width="5"/>
    <rect x="200" y="280" width="200" height="130" rx="8" fill="#212529" stroke="${OUT}" stroke-width="5"/><rect x="210" y="290" width="180" height="108" fill="#1d3557"/>
    <g transform="translate(300 344) scale(.21)">${escudoPoeira({})}</g><rect x="214" y="294" width="42" height="15" rx="3" fill="#e63946"/><text x="235" y="306" text-anchor="middle" font-family="Anton" font-size="11" fill="#fff">AO VIVO</text>
    <circle cx="860" cy="330" r="38" fill="#fff" stroke="${OUT}" stroke-width="5"/><path d="M860,330 l0,-24 M860,330 l${Math.cos(t * 0.5) * 18},${Math.sin(t * 0.5) * 18}" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
    <path d="M430,290 h120 l-60,95z" fill="${CORES.vinho}" stroke="${OUT}" stroke-width="4"/><path d="M445,300 h90 l-45,70z" fill="${CORES.amarelo}" opacity=".9"/><text x="490" y="330" text-anchor="middle" font-family="Anton" font-size="20" fill="${CORES.vinho}">PFC</text>
    <rect x="590" y="400" width="210" height="10" fill="#8d5a2b" stroke="${OUT}" stroke-width="3"/>`;
  { const r = rng('garrafas-bar'); for (let x = 598; x < 790; x += 22 + r() * 6) { const h = 36 + r() * 26, cor = ['#2d6a4f', '#9d0208', '#e9c46a', '#6d597a', '#c97a40'][Math.floor(r() * 5)];
    s += `<rect x="${x}" y="${400 - h}" width="14" height="${h}" rx="4" fill="${cor}" stroke="${OUT}" stroke-width="2"/><rect x="${x + 4}" y="${400 - h - 12}" width="6" height="13" fill="${cor}" stroke="${OUT}" stroke-width="1.5"/>`; } }
  // mural de recados e quadro-negro na parede do fundo
  if (mural) { const [x, y, w, h] = BAR.mural; s += corticaBoard(x, y, w, h);
    const r = rng('recados'); if (mural !== 'vazio') for (let i = 0; i < 5; i++) s += `<rect x="${x + 20 + (i % 3) * 110}" y="${y + 25 + Math.floor(i / 3) * 130}" width="90" height="80" fill="${PAPEL[i % 5]}" stroke="${OUT}" stroke-width="2" transform="rotate(${(r() - 0.5) * 12} ${x + 65 + (i % 3) * 110} ${y + 65 + Math.floor(i / 3) * 130})"/><circle cx="${x + 65 + (i % 3) * 110}" cy="${y + 32 + Math.floor(i / 3) * 130}" r="6" fill="#e63946"/>`; }
  if (quadro) { const [x, y, w, h] = BAR.quadro; s += quadroNegroMoldura(x, y, w, h) + (quadro === 'vazio' ? '' : `<text x="${x + w / 2}" y="${y + 70}" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="34" fill="${CHALK}" opacity=".9">HOJE TEM JOGO!</text>
    <text x="${x + w / 2}" y="${y + 130}" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="26" fill="${CHALK}" opacity=".8">pastel · caldo · refri</text>
    <text x="${x + w / 2}" y="${y + 230}" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="24" fill="#ffd8a8" opacity=".85">FIADO SÓ AMANHÃ</text>`); }
  // freezer de sorvete e engradados no pé da parede
  s += `<rect x="790" y="1020" width="130" height="230" rx="10" fill="#f1faee" stroke="${OUT}" stroke-width="4"/><rect x="800" y="1032" width="110" height="60" rx="6" fill="#a8dadc"/><text x="855" y="1130" text-anchor="middle" font-family="Anton" font-size="20" fill="#1d3557">SORVETES</text>
    ${[0, 1, 2].map(i => `<rect x="${170 + (i % 2) * 6}" y="${1180 - i * 46}" width="110" height="46" fill="#e63946" stroke="${OUT}" stroke-width="3"/>`).join('')}`;
  // porta da rua na parede direita (luz entrando) e janela na esquerda
  s += `<path d="M${W + 20},560 L${fx1 + 40},640 V1180 L${W + 20},1360Z" fill="#fff4cc" stroke="${OUT}" stroke-width="5"/>
    <path d="M${W + 20},1360 L${fx1 + 40},1180 L${fx1 - 60},1250 L${W - 40},1600Z" fill="#fff4cc" opacity=".35"/>
    <path d="M-20,420 L${fx0 - 40},500 V820 L-20,880Z" fill="#a8dadc" stroke="${OUT}" stroke-width="5"/><path d="M50,445 V860" stroke="${OUT}" stroke-width="4"/>`;
  // lâmpadas penduradas (com luz) e ventilador de teto
  [[330, 170], [750, 170]].forEach(([x, y]) => { s += `<path d="M${x},${y - 200} V${y}" stroke="${OUT}" stroke-width="3"/><path d="M${x - 40},${y + 30} q40,-50 80,0z" fill="#495057" stroke="${OUT}" stroke-width="3"/>
    <ellipse cx="${x}" cy="${y + 60}" rx="140" ry="90" fill="#ffe8a3" opacity=".22"/><circle cx="${x}" cy="${y + 32}" r="12" fill="#fff3bf"/>`; });
  s += `<g transform="translate(540 120)"><path d="M0,-200 V0" stroke="${OUT}" stroke-width="4"/>${[0, 1, 2].map(i => { const a = t * 6 + i * 2.094; return `<ellipse cx="${Math.cos(a) * 70}" cy="${Math.sin(a) * 12}" rx="70" ry="10" fill="#8d5a2b" stroke="${OUT}" stroke-width="2"/>`; }).join('')}<circle r="14" fill="#495057" stroke="${OUT}" stroke-width="3"/></g>`;
  // piso de ladrilho em perspectiva
  s += `<path d="M${fx0},${fy1} H${fx1} L${W + 600},${H + 600} H-600Z" fill="#efe3cf"/>
    ${Array.from({ length: 15 }, (_, i) => { const u = i / 14; return `<path d="M${fx0 + u * (fx1 - fx0)},${fy1} L${-600 + u * (W + 1200)},${H + 600}" stroke="#d5c4a8" stroke-width="3"/>`; }).join('')}
    ${[0.06, 0.15, 0.27, 0.42, 0.6, 0.82].map(k => { const y = fy1 + (H + 600 - fy1) * k, xa = fx0 + (-600 - fx0) * k, xb = fx1 + (W + 600 - fx1) * k; return `<path d="M${xa},${y} H${xb}" stroke="#d5c4a8" stroke-width="3"/>`; }).join('')}`;
  // quem está atrás do balcão (pé em ~1460, escondido): o balcão de 1,05 m cobre da cintura pra baixo
  s += atras;
  // balcão com banquinhos
  s += `<path d="M110,1300 H970 L1000,1330 H80Z" fill="#6f4518" stroke="${OUT}" stroke-width="5"/>
    <rect x="80" y="1330" width="920" height="170" fill="#a0673e" stroke="${OUT}" stroke-width="5"/>
    ${Array.from({ length: 8 }, (_, i) => `<path d="M${120 + i * 120},1336 v158" stroke="#8d5a2b" stroke-width="5"/>`).join('')}
    <rect x="80" y="1490" width="920" height="16" fill="#000" opacity=".15"/>
    ${[260, 540, 820].map(x => `<ellipse cx="${x}" cy="1560" rx="60" ry="16" fill="#e63946" stroke="${OUT}" stroke-width="4"/><path d="M${x},1572 V1680 M${x - 34},1690 h68" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/>`).join('')}
    <path d="M330,1300 l12,-60 h40 l12,60z" fill="#ffd6a5" stroke="${OUT}" stroke-width="3"/><circle cx="362" cy="1230" r="20" fill="#ffd166" stroke="${OUT}" stroke-width="3"/>`;
  return s;
}
// plano geral do bar (Dona Cida no balcão) → a câmera entra no mural ou no quadro, que fica do tamanho da tela
// (área útil na tela: y ≈ 165..955). Devolve o SVG do fundo; o conteúdo vai por cima, em coordenadas de tela.
function entraNaParede(t, d, E, qual) {
  const [x, y, w, h] = BAR[qual], quadro = qual === 'quadro' ? 'vazio' : true, mural = qual === 'mural' ? 'vazio' : true;
  const cam = camChaves(t, [[0, 540, 920, 1, 960], [0.2, 540, 920, 1, 960], [1.0, x + w / 2, y + h / 2, 2.75, 560], [Math.max(d, 1.1), x + w / 2, y + h / 2, 2.85, 560]]);
  const mundo = barDentro(t, E, { quadro, mural, atras: presidente(t, E, qual === 'mural' ? 760 : 330, ATRAS, 0.95, { expr: 'feliz' }) }) + narrador(t, E, qual === 'mural' ? 300 : 760, 1900, 1.35, { pose: 'microfone' });
  // depois que a câmera entra na parede, o Tião e a Dona Cida aparecem em primeiro plano (perto da câmera)
  return naCamera(cam, mundo) + frenteBar(t, E, qual === 'mural' ? 1 : -1);
}
// depois que a câmera entra no quadro da parede, o Tião e a Dona Cida sobem em primeiro plano (perto da câmera,
// cortados na cintura), olhando para o quadro; lado = 1: Tião à esquerda
function frenteBar(t, E, lado = 1, t0 = 0.9) {
  const k = easeOut(clamp((t - t0) / 0.5));
  if (k <= 0) return '';
  const y = FRENTE(1.35) + (1 - k) * 220;
  return `<g opacity="${k.toFixed(3)}">${narrador(t, E, lado > 0 ? 250 : 830, y, 1.35, { pose: 'aponta' })}${presidente(t, E, lado > 0 ? 830 : 250, y, 1.35, { expr: 'feliz' })}</g>`;
}
function corticaBoard(x, y, w, h) {
  const r = rng('cortica' + x);
  return `<rect x="${x - 14}" y="${y - 14}" width="${w + 28}" height="${h + 28}" rx="8" fill="#8d5a2b" stroke="${OUT}" stroke-width="6"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#c9965e"/>
    ${Array.from({ length: 60 }, () => `<circle cx="${(x + r() * w).toFixed(0)}" cy="${(y + r() * h).toFixed(0)}" r="${(1.5 + r() * 2.5).toFixed(1)}" fill="#a87543" opacity=".7"/>`).join('')}`;
}
function quadroNegroMoldura(x, y, w, h) {
  return `<rect x="${x - 16}" y="${y - 16}" width="${w + 32}" height="${h + 32}" rx="6" fill="#8d5a2b" stroke="${OUT}" stroke-width="6"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2f4f3a"/>
    <rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" fill="#ffffff" opacity=".03"/>
    <rect x="${x + w * 0.1}" y="${y + h + 2}" width="${w * 0.8}" height="12" fill="#6f4518" stroke="${OUT}" stroke-width="3"/>`;
}
// bilhete de papel preso com tacha (comentário no mural)
function bilhete(usuario, txt, curtidas, { w = 430, cor = '#fff4b8', rot = 0, selo = '', tam = 30 } = {}) {
  const linhas = quebrar(txt, tam, w - 60).slice(0, 4), lh = tam * 1.33, h = 110 + linhas.length * lh + (selo ? 30 : 0);
  return `<g transform="rotate(${rot})">
    <rect x="${-w / 2 + 8}" y="${-h / 2 + 10}" width="${w}" height="${h}" fill="#000" opacity=".22"/>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${cor}" stroke="${OUT}" stroke-width="3"/>
    <circle cx="0" cy="${-h / 2 + 16}" r="13" fill="#e63946" stroke="${OUT}" stroke-width="3"/><circle cx="-4" cy="${-h / 2 + 12}" r="4" fill="#fff" opacity=".7"/>
    ${selo ? `<text x="${-w / 2 + 26}" y="${-h / 2 + 58}" font-family="Anton" font-size="22" fill="${CORES.laranja}">${esc(selo)}</text>` : ''}
    <text x="${-w / 2 + 26}" y="${-h / 2 + (selo ? 92 : 62)}" font-family="Nunito" font-weight="900" font-size="${tam}" fill="${OUT}">@${esc(usuario)}</text>
    ${linhas.map((l, i) => `<text x="${-w / 2 + 26}" y="${-h / 2 + (selo ? 136 : 106) + i * lh}" font-family="Nunito" font-weight="600" font-size="${tam}" fill="#333">${esc(l)}</text>`).join('')}
    ${curtidas ? `<text x="${w / 2 - 24}" y="${h / 2 - 20}" text-anchor="end" font-family="Nunito" font-weight="900" font-size="${tam}" fill="#e63946">♥ ${curtidas}</text>` : ''}</g>`;
}

// ------------------------------------------------------------ variações
const VARIACOES = {
  // ---- comentários no mural de recados do bar (bilhetes presos, carimbados quando a narração chega neles)
  comentarios: {
    mural(t, d, c, E) {
      // plano geral do bar com a Dona Cida no balcão → a câmera entra no mural (fica do tamanho da tela)
      const [mx, my, mw, mh] = BAR.mural, cam = camChaves(t, [[0, 540, 900, 1, 960], [0.25, 540, 900, 1, 960], [1.0, mx + mw / 2, my + mh / 2, 2.75, 560], [d, mx + mw / 2, my + mh / 2, 2.85, 560]]);
      let mundo = barDentro(t, E, { mural: true, quadro: true, atras: presidente(t, E, 700, ATRAS, 0.95, { pose: 'aponta', expr: 'feliz' }) }) + narrador(t, E, 300, 1900, 1.35, { pose: 'microfone' });
      let s = naCamera(cam, mundo) + frenteBar(t, E, 1);
      const lista = (c.dados.comentarios || []).slice(0, 3), n = lista.length;
      lista.forEach((cm, i) => {
        const t0 = Math.max(1.0, cm.chave ? quando(c, cm.chave, 0.3 + i * 2) : 0.3 + i * 2);
        const x = n === 1 ? W / 2 : n === 2 ? [310, 770][i] : [300, 780, 540][i], y = n === 3 ? [330, 400, 760][i] : n === 2 ? [400, 680][i] : 560;
        const rot = [-4, 3, -2][i], cor = PAPEL[i % PAPEL.length];
        const ent = easeOut(prog(t, t0 - 0.15, 0.4));
        if (ent > 0) s += `<g class="ui" transform="translate(${x} ${y - (1 - ent) * 120}) scale(${0.9 + 0.1 * ent})" opacity="${clamp(ent * 2)}">${bilhete(cm.usuario, cm.texto, cm.curtidas, { rot, cor, selo: cm.selo || '', w: n === 1 ? 760 : 470, tam: n === 1 ? 40 : 34 })}</g>`;
        if (cm.carimbo && CARIMBOS[cm.carimbo]) {
          const t1 = Math.max(t0 + 0.4, cm.chave_carimbo ? quando(c, cm.chave_carimbo, t0 + 1.2) : t0 + 1.2);
          s += pop(t, t1, x + 40, y + 60, carimbo(CARIMBOS[cm.carimbo][0], CARIMBOS[cm.carimbo][1], -10, 38), 0.3, false);
        }
      });
      return s;
    },
    // ---- comentários no celular da Dona Cida (lista do Instagram, o comentário da vez acende)
    celular(t, d, c, E) {
      let s = naCamera({ x: 540, y: 1100, z: 1.25, sy: 870 }, barDentro(t, E, { atras: presidente(t, E, 760, ATRAS, 0.95, { expr: 'feliz' }) })) + `<rect width="${W}" height="${H}" fill="#fff" opacity=".4"/>`;
      const lista = (c.dados.comentarios || []).slice(0, 4);
      const px = 175, py = 140, pw = 730, ph = 980;
      s += `<g transform="rotate(-3 540 640)">
        <rect x="${px + 12}" y="${py + 16}" width="${pw}" height="${ph}" rx="70" fill="#000" opacity=".3"/>
        <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="70" fill="#212529" stroke="${OUT}" stroke-width="8"/>
        <rect x="${px + 28}" y="${py + 70}" width="${pw - 56}" height="${ph - 110}" rx="24" fill="#fff"/>
        <rect x="${px + pw / 2 - 70}" y="${py + 26}" width="140" height="22" rx="11" fill="#000"/>
        <text x="${px + 60}" y="${py + 125}" font-family="Nunito" font-weight="900" font-size="34" fill="${OUT}">${esc(E.clube.instagram)} · comentários</text>
        <path d="M${px + 40},${py + 150} H${px + pw - 40}" stroke="#dee2e6" stroke-width="3"/>`;
      let y = py + 210, atual = -1;
      lista.forEach((cm, i) => { const t0 = cm.chave ? quando(c, cm.chave, 0.3 + i * 2) : 0.3 + i * 2; if (t >= t0 - 0.1) atual = i; });
      lista.forEach((cm, i) => {
        const linhas = quebrar(cm.texto, 28, pw - 220).slice(0, 3), h = 70 + linhas.length * 36;
        const on = i === atual, r = rng(cm.usuario);
        s += `<g opacity="${atual >= i || atual < 0 ? 1 : 0.45}">
          ${on ? `<rect x="${px + 40}" y="${y - 50}" width="${pw - 80}" height="${h + 10}" rx="18" fill="#fff3bf"/>` : ''}
          <circle cx="${px + 90}" cy="${y - 10}" r="30" fill="${CAMISAS_SORTIDAS[Math.floor(r() * CAMISAS_SORTIDAS.length)]}" stroke="${OUT}" stroke-width="3"/>
          <text x="${px + 90}" y="${y}" text-anchor="middle" font-family="Anton" font-size="28" fill="#fff">${esc(cm.usuario[0].toUpperCase())}</text>
          <text x="${px + 140}" y="${y - 14}" font-family="Nunito" font-weight="900" font-size="28" fill="${OUT}">${esc(cm.usuario)}</text>
          ${linhas.map((l, k) => `<text x="${px + 140}" y="${y + 24 + k * 36}" font-family="Nunito" font-weight="600" font-size="28" fill="#333">${esc(l)}</text>`).join('')}
          <text x="${px + pw - 60}" y="${y - 10}" text-anchor="end" font-family="Nunito" font-weight="900" font-size="28" fill="#e63946">♥ ${cm.curtidas || 0}</text></g>`;
        if (cm.carimbo && CARIMBOS[cm.carimbo]) {
          const t0 = cm.chave ? quando(c, cm.chave, 0.3 + i * 2) : 0.3 + i * 2, t1 = cm.chave_carimbo ? quando(c, cm.chave_carimbo, t0 + 1.2) : t0 + 1.2;
          s += pop(t, t1, px + pw / 2 + 120, y + 20, carimbo(CARIMBOS[cm.carimbo][0], CARIMBOS[cm.carimbo][1], -8, 34), 0.3, false);
        }
        y += h + 30;
      });
      s += `</g>`;
      // a mão segurando o celular
      s += `<path d="M${px + pw - 30},${py + ph - 160} q90,20 110,140 q10,90 -60,140 l-160,40 q-60,-40 -20,-110 q40,-40 130,-210z" fill="#8d5524" stroke="${OUT}" stroke-width="6"/>`;
      s += presidente(t, E, 270, 1960, 1.25, { expr: 'feliz' });
      return s;
    },
  },
  // ---- decisão no mural: as opções viram bilhetes e sobra um post-it em branco
  decisao: {
    quadro(t, d, c, E) {
      let s = entraNaParede(t, d, E, 'quadro');
      const giz = (txt, y, tam, t0, cor = CHALK) => { const p = clamp((t - Math.max(1.0, t0)) / 0.5); return p > 0 ? `<text x="540" y="${y}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="${tam}" fill="${cor}" opacity="${p}">${esc(txt)}</text>` : ''; };
      s += giz((c.texto_tela[0] || '').toUpperCase(), 250, 50, 0.1);
      s += giz(`CAIXA: ${E.moeda} ${Math.round(c.dados.caixa || 0).toLocaleString('pt-BR')}`, 370, 66, 0.5, '#ffe066');
      s += giz('E AGORA, O QUE A GENTE FAZ?', 500, 50, 1.0);
      const ops = (c.dados.opcoes || []).filter(o => !/sua ideia/i.test(o));
      ops.forEach((o, i) => s += giz('• ' + o, 600 + i * 70, 42, 1.4 + i * 0.3));
      s += giz('SUA IDEIA NOS COMENTÁRIOS ✍', 620 + ops.length * 70 + 40, 44, 1.8, '#a5d8ff');
      s += giz('O MAIS CURTIDO DECIDE!', 620 + ops.length * 70 + 130, 48, 2.2, '#ffe066');
      return s;
    },
    mural(t, d, c, E) {
      let s = entraNaParede(t, d, E, 'mural');
      const ops = (c.dados.opcoes || []).filter(o => !/sua ideia/i.test(o));
      s += pop(t, 1.0, W / 2, 230, pilula(c.texto_tela[0] || '', { tam: 50, bg: '#2e8b57', rot: -3 }));
      s += pop(t, 1.2, 320, 430, bilhete('dona.cida', `No caixa: ${E.moeda} ${Math.round(c.dados.caixa || 0).toLocaleString('pt-BR')}`, 0, { w: 440, cor: '#d8f3dc', rot: -4, tam: 38 }));
      if (!ops.length) s += pop(t, 1.5, 330, 720, bilhete('dona.cida', 'E agora, o que a gente faz com esse dinheiro?', 0, { w: 440, cor: '#ffffff', rot: 3, tam: 34 }));
      ops.forEach((o, i) => s += pop(t, 1.5 + i * 0.3, 280 + i * 260, 720, bilhete('torcida', o, 0, { w: 360, cor: PAPEL[(i + 1) % PAPEL.length], rot: [-5, 4, -2][i] || 0 })));
      s += pop(t, 1.9, 770, 640, `<g transform="rotate(5)"><rect x="-160" y="-140" width="320" height="280" fill="#ffe066" stroke="${OUT}" stroke-width="4"/>
        <rect x="-160" y="-140" width="320" height="42" fill="#fcc419"/>
        <text y="-20" text-anchor="middle" font-family="Anton" font-size="50" fill="${OUT}">SUA IDEIA</text>
        <text y="46" text-anchor="middle" font-family="Anton" font-size="50" fill="${OUT}">AQUI ✍</text>
        <text y="105" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="24" fill="#495057">nos comentários</text></g>`);
      return s;
    },
  },
  // ---- tabela escrita a giz no quadro-negro do bar
  tabela: {
    quadro(t, d, c, E) {
      let s = entraNaParede(t, d, E, 'quadro');
      const tab = c.dados.tabela || [], nome = NOME(E), t0 = 1.0;
      if (t > t0) s += `<text x="540" y="235" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="40" fill="${CHALK}" opacity="${clamp((t - t0) / 0.4)}">${esc((c.texto_tela[0] || '').toUpperCase())}</text>
        <path d="M150,258 H930" stroke="${CHALK}" stroke-width="3" opacity=".6"/>`;
      tab.forEach((l, i) => {
        const y = 315 + i * 63, p = clamp((t - t0 - 0.1 - i * 0.1) / 0.3), meu = l.time === nome;
        if (p <= 0) return;
        s += `<g opacity="${p}" transform="rotate(${(i % 2 ? 0.4 : -0.3)} 540 ${y})">
          <text x="150" y="${y}" font-family="Nunito" font-weight="800" font-size="36" fill="${CHALK}">${l.pos}º</text>
          <text x="225" y="${y}" font-family="Nunito" font-weight="800" font-size="36" fill="${meu ? '#ffe066' : CHALK}">${esc(l.time)}</text>
          <text x="920" y="${y}" text-anchor="end" font-family="Nunito" font-weight="900" font-size="36" fill="${CHALK}">${l.pts ?? ''}</text></g>`;
        if (meu) { const q = clamp((t - t0 - 1.0) / 0.6); s += `<ellipse cx="520" cy="${y - 12}" rx="${420 * q}" ry="32" fill="none" stroke="#ffe066" stroke-width="5" opacity=".9"/>`; }
      });
      s += pop(t, 1.9, W / 2, 1420, tituloGrande(c.texto_tela[1] || '', { tam: 120, cor: CORES.laranja }));
      return s;
    },
  },
  // ---- renda do jogo no caderno do caixa (a Dona Cida anota linha por linha)
  bilheteria: {
    caderno(t, d, c, E) {
      const dd = c.dados, R = v => `${E.moeda} ${Math.round(v).toLocaleString('pt-BR')}`;
      let s = `<rect width="${W}" height="${H}" fill="#8d5a2b"/>${Array.from({ length: 12 }, (_, i) => `<path d="M0,${i * 170 + 40} H${W}" stroke="#7a4b22" stroke-width="6" opacity=".5"/>`).join('')}`;
      // caderno aberto, visto de cima
      s += `<g transform="rotate(-3 540 700)"><rect x="110" y="150" width="860" height="1100" rx="14" fill="#000" opacity=".25" transform="translate(14 18)"/>
        <rect x="110" y="150" width="860" height="1100" rx="14" fill="#fffdf5" stroke="${OUT}" stroke-width="6"/>
        ${Array.from({ length: 20 }, (_, i) => `<path d="M130,${270 + i * 50} H950" stroke="#a5d8ff" stroke-width="2.5"/>`).join('')}
        <path d="M220,160 V1240" stroke="#ff8787" stroke-width="3"/>
        <text x="540" y="235" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="46" fill="${CORES.vinho}">CAIXA DO POEIRA</text>`;
      const linhas = [['Bilheteria', dd.bilheteria ?? dd.receita, 'pagantes']];
      if (dd.lanche) linhas.push([dd.barraca || 'Barraca', dd.lanche, 'mais']);
      if (dd.venda) linhas.push([`${dd.camisas} camisas`, dd.venda, 'varal']);
      if (dd.placas) linhas.push(['Placas', dd.placas, 'placas']);
      linhas.forEach(([rot, v, chave], i) => {
        const t0 = i ? quando(c, chave, 1 + i * 1.4) : 0.5, p = clamp((t - t0) / 0.5), y = 365 + i * 100;
        if (p > 0) s += `<g opacity="${p}"><text x="250" y="${y}" font-family="Nunito" font-weight="800" font-size="46" fill="#1d3557">${esc(rot)}</text>
          <text x="920" y="${y}" text-anchor="end" font-family="Nunito" font-weight="900" font-size="46" fill="#2e8b57">+ ${R(v)}</text></g>`;
      });
      const tT = quando(c, 'somando', d * 0.7), yT = 365 + linhas.length * 100 + 30;
      if (t > tT) s += `<path d="M250,${yT - 45} H920" stroke="#1d3557" stroke-width="4"/>
        <text x="250" y="${yT + 20}" font-family="Nunito" font-weight="900" font-size="54" fill="#1d3557">TOTAL</text>
        <text x="920" y="${yT + 20}" text-anchor="end" font-family="Nunito" font-weight="900" font-size="54" fill="#2e8b57">${R(dd.receita)}</text>`;
      const tC = quando(c, 'caixa', tT + 1);
      if (t > tC) s += `<text x="250" y="${yT + 140}" font-family="Nunito" font-weight="900" font-size="54" fill="${CORES.vinho}">Caixa: ${R(dd.caixa)}</text>
        <path d="M245,${yT + 160} q330,${12} 660,0" stroke="${CORES.vinho}" stroke-width="5" fill="none"/>`;
      s += `</g>`;
      // caneta escrevendo
      const k = (t * 1.3) % 1;
      s += `<g transform="translate(${640 + Math.sin(t * 9) * 60} ${430 + Math.floor(clamp(t / d) * linhas.length) * 100 + k * 6}) rotate(35)"><rect x="-12" y="-170" width="24" height="170" rx="8" fill="#3a86ff" stroke="${OUT}" stroke-width="4"/><path d="M-12,0 l12,30 l12,-30z" fill="#ffe066" stroke="${OUT}" stroke-width="3"/></g>`;
      s += pop(t, 0.2, W / 2, 1420, pilula('RENDA DO JOGO EM CASA', { tam: 50, bg: CORES.marinho }));
      return s;
    },
  },
  // ---- apelido como figurinha do álbum
  apelido: {
    figurinha(t, d, c, E) {
      const dd = c.dados;
      let s = `<rect width="${W}" height="${H}" fill="#f8f0dc"/>${Array.from({ length: 18 }, (_, i) => `<rect x="${60 + (i % 3) * 330}" y="${80 + Math.floor(i / 3) * 300}" width="290" height="260" rx="10" fill="none" stroke="#e0cfa9" stroke-width="4" stroke-dasharray="12 10"/>`).join('')}`;
      const nosso = dd.alvo === 'nosso', [c1, c2] = nosso ? [CORES.vinho, CORES.amarelo] : coresTime(dd.time || '');
      let visual;
      if (nosso) visual = jogador(dd.numero, E, { expr: 'feliz' });
      else { const r = rng('adv' + dd.apelido); visual = { pele: PELES[Math.floor(r() * PELES.length)], cabelo: ['curto', 'raspado', 'cacheado', 'careca'][Math.floor(r() * 4)], corCabelo: '#2b1d14', camisa: c1, listra: c2, calcao: c2, meiao: c1, numero: dd.numero, bigode: r() > 0.5, expr: 'bravo' }; }
      const ent = easeOutBack(prog(t, 0.1, 0.5)), rot = -4 + Math.sin(t * 1.5) * 1;
      s += `<g transform="translate(540 760) scale(${ent}) rotate(${rot})">
        <rect x="-330" y="-520" width="660" height="980" rx="26" fill="#000" opacity=".25" transform="translate(14 18)"/>
        <rect x="-330" y="-520" width="660" height="980" rx="26" fill="${c1}" stroke="${OUT}" stroke-width="8"/>
        <rect x="-300" y="-490" width="600" height="700" rx="16" fill="${c2}" stroke="${OUT}" stroke-width="5"/>
        <g transform="translate(0 260)">${pessoa(visual, t, { s: 1.9 })}</g>
        <rect x="-330" y="200" width="660" height="260" rx="0" fill="${c1}"/>
        <rect x="-330" y="200" width="660" height="12" fill="${OUT}"/>
        <text x="0" y="285" text-anchor="middle" font-family="Anton" font-size="62" fill="#fff" stroke="${OUT}" stroke-width="10" paint-order="stroke">${esc((dd.nome || dd.time || '').toUpperCase())}</text>
        <text x="0" y="345" text-anchor="middle" font-family="Anton" font-size="36" fill="${c2}">${esc((dd.posicao || '').toUpperCase())} · Nº ${esc(String(dd.numero || ''))}</text>
        <rect x="-300" y="-500" width="140" height="54" rx="10" fill="${OUT}"/><text x="-230" y="-462" text-anchor="middle" font-family="Anton" font-size="32" fill="#fff">${nosso ? 'PFC' : esc(sigla(dd.time || ''))}</text></g>`;
      const tA = quando(c, (dd.apelido || '').split(' ')[0].toLowerCase(), 1.0);
      const titulo = (dd.apelido || '').toUpperCase(), tam = Math.min(110, 900 / Math.max(1, medir(titulo, 1)));
      s += pop(t, tA - 0.1, W / 2, 1360, tituloGrande(titulo, { tam, cor: CORES.amarelo, rot: -3 }));
      s += pop(t, tA + 0.6, W / 2, 1520, pilula(`"${(dd.piada || '').toUpperCase()}"`, { tam: 38, bg: CORES.creme, cor: OUT, rot: 2 }));
      if (!nosso) s += pop(t, 0.2, W / 2, 140, pilula(`DE OLHO NO ${(dd.time || '').toUpperCase()}`, { tam: 40, bg: '#495057', rot: -2 }));
      return s;
    },
  },
  // ---- fim de jogo: placar de madeira na beira do campo (as placas viram)
  fim_de_jogo: {
    placar(t, d, c, E) {
      const dd = c.dados;
      let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E), torcida: E._torcida }), { z0: 1.2, z1: 1.28, cy: 900 });
      s += `<rect width="${W}" height="${H}" fill="#000" opacity=".15"/>`;
      const sg = n => n === NOME(E) ? E.clube.sigla : sigla(n);
      const vira = k => clamp((t - 0.5 - k * 0.35) / 0.35);
      s += `<g transform="translate(540 560)">
        <path d="M-300,260 V420 M300,260 V420" stroke="${OUT}" stroke-width="22" stroke-linecap="round"/><path d="M-300,260 V420 M300,260 V420" stroke="#9c6644" stroke-width="12" stroke-linecap="round"/>
        <rect x="-420" y="-260" width="840" height="520" rx="18" fill="#2b2d42" stroke="${OUT}" stroke-width="9"/>
        <rect x="-400" y="-240" width="800" height="70" rx="10" fill="#8d5a2b"/>
        <text y="-190" text-anchor="middle" font-family="Anton" font-size="50" fill="#ffe066">PLACAR · ${esc((window._local ? 'CAMPO DO ' + window._local.nome : (E.clube.estadio || '')).toUpperCase())}</text>
        ${[[dd.mandante, dd.placar[0], -1], [dd.visitante, dd.placar[1], 1]].map(([n, g, lado], k) => `
          <text x="${lado * 200}" y="-90" text-anchor="middle" font-family="Anton" font-size="62" fill="#fff">${esc(sg(n))}</text>
          <g transform="translate(${lado * 200} 70) scale(1 ${Math.max(0.05, Math.abs(Math.cos(vira(k) * Math.PI)))})">
            <rect x="-120" y="-130" width="240" height="250" rx="14" fill="#f8f9fa" stroke="${OUT}" stroke-width="6"/>
            <text y="80" text-anchor="middle" font-family="Anton" font-size="210" fill="${OUT}">${vira(k) > 0.5 ? g : '·'}</text></g>`).join('')}
        <text y="80" text-anchor="middle" font-family="Anton" font-size="90" fill="#fff">x</text></g>`;
      s += pop(t, 0.1, W / 2, 150, pilula('FIM DE JOGO', { tam: 52, bg: CORES.marinho, rot: -2 }));
      if (dd.resultado === 'vitória') s += pop(t, 1.3, W / 2, 1000, tituloGrande('VITÓRIA!', { tam: 110, cor: CORES.amarelo, rot: -3 }));
      const exp = dd.resultado === 'vitória' ? 'feliz' : dd.resultado === 'empate' ? 'serio' : 'triste', pose = dd.resultado === 'vitória' ? 'comemora' : 'normal';
      ['7', '9', '18'].forEach((n, i) => { if (E.elenco[n]) s += popPessoa(t, 0.6 + i * 0.15, 270 + i * 270, FRENTE(1.25), pessoa(jogador(n, E, { pose, expr: exp }), t, { s: 1.25, fase: i })); });
      return s;
    },
  },
  // ---- torcida: a câmera fecha na arquibancada (vista do campo)
  estadio: {
    arquibancada(t, d, c, E) {
      const dd = c.dados, rev = easeOut(prog(t, 0.3, Math.min(3, d * 0.6))), v = contador(dd.torcida, dd.antes || 0, rev);
      window._closeGol = true;   // câmera fechada: os letreiros do muro saem do quadro
      let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E), torcida: Math.round(v) }), { z0: 1.7, z1: 1.55, cy: 800 });
      window._closeGol = false;
      s += pop(t, 0.1, W / 2, 1450, pilula(`${Math.round(v).toLocaleString('pt-BR')} TORCEDORES`, { tam: 66, bg: CORES.laranja, cor: OUT, rot: -2 }));
      if (c.texto_tela[1]) s += pop(t, 1.6, W / 2, 1580, pilula(c.texto_tela[1], { tam: 52, bg: '#e63946', rot: 3 }));
      return s;
    },
  },
  // ---- pré-jogo: o time sai do vestiário (jogo em casa) ou chega de Kombi na rua do adversário
  pre_jogo: {
    vestiario(t, d, c, E) {
      let cena = sede(E.estrutura, { t });
      // fila saindo pela porta do vestiário e andando para a direita, rumo ao campo
      const ordem = ['1', '3', '4', '5', '7', '9', '18'], porta = -102, y = SEDE.pe - 10;
      ordem.forEach((n, i) => {
        const p = clamp((t - 0.3 - i * 0.45) / 3.2); if (p <= 0 || !E.elenco[n]) return;
        const x = porta + p * 1100;
        cena += pessoa(jogador(n, E, { pose: Math.floor(t * 6 + i) % 2 ? 'chute' : 'normal', expr: 'serio' }), t, { x, y, s: 0.95, fase: i }).replace(/class="rosto" /g, '');
      });
      let s = camera(t, d, zoomSede(E.estrutura, cena), { z0: 1, z1: 1.04, cy: 1750 });
      s += TIPOS.pre_jogo.placa(t, c, E);
      return s;
    },
    chegada(t, d, c, E) {
      // rua do dono da casa: casas, o muro do campo deles com o nome, a Kombi do Poeira chegando e estacionando
      const L = window._local || { nome: '' }, [c1, c2] = coresTime(L.nome);
      let s = ceu(t) + bairro(1180, { xMin: -200, xMax: 1300 });
      s += `<rect x="-10" y="1180" width="${W + 20}" height="260" fill="#e9e1d1" stroke="${OUT}" stroke-width="5"/>
        <rect x="-10" y="1172" width="${W + 20}" height="12" fill="#cfc6ba" stroke="${OUT}" stroke-width="3"/>
        <text x="540" y="1300" text-anchor="middle" font-family="Anton" font-size="72" fill="${c1}" letter-spacing="4">${esc((L.nome || '').toUpperCase())}</text>
        <rect x="420" y="1330" width="240" height="110" fill="${c1}" stroke="${OUT}" stroke-width="5"/><path d="M420,1330 l120,-40 l120,40" fill="${c2}" stroke="${OUT}" stroke-width="5"/>
        <rect x="-10" y="1440" width="${W + 20}" height="80" fill="#cfc6ba" stroke="${OUT}" stroke-width="4"/>
        <rect x="-10" y="1520" width="${W + 20}" height="${H - 1520}" fill="#6c757d"/>
        ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 150 + 30}" y="1700" width="80" height="12" fill="#f8f9fa" opacity=".7"/>`).join('')}`;
      const p = easeOut(clamp((t - 0.2) / 2.2));
      s += `<g transform="translate(${-380 + p * 880} 1800) scale(.95)">${kombi({ t, andando: p < 1 })}</g>`;   // um pouco atrás de quem desce (s ≈ 0,95)
      // o time desce pela porta lateral e se espalha na calçada, um ao lado do outro (sem amontoar)
      if (p >= 1) ['7', '9', '18', '15'].forEach((n, i) => { const q = easeOut(clamp((t - 2.5 - i * 0.4) / 1.1)); if (q > 0 && E.elenco[n]) {
        const x = 470 + ([170, 400, 640, 870][i] - 470) * q, y = 1700 + (1905 - 1700) * q;
        s += pessoa(jogador(n, E, { pose: q < 1 ? (Math.floor(t * 7 + i) % 2 ? 'chute' : 'normal') : 'acena', expr: 'feliz' }), t, { x, y, s: 0.75 + 0.25 * q, fase: i }).replace(/class="rosto" /g, ''); } });
      s += TIPOS.pre_jogo.placa(t, c, E);
      return s;
    },
  },
  // ---- encerramento ao pôr do sol: o time volta pra casa, campo vazio
  encerramento: {
    por_do_sol(t, d, c, E) {
      let cena = campo(E.estrutura, { t, nome: NOME(E), torcida: 0 });
      cena = cena.replace(/url\(#gceu\)/, 'url(#gsol)');
      // o sol se pondo atrás do morro: entra logo depois do céu (antes do bairro), nunca na frente da arquibancada
      cena = cena.replace(/(<rect [^>]*fill="url\(#gsol\)"\/>)/, `$1<circle cx="760" cy="${600 + Math.min(t, 10) * 6}" r="110" fill="#ffd166" opacity=".9"/><circle cx="760" cy="${600 + Math.min(t, 10) * 6}" r="170" fill="#ffd166" opacity=".25"/>`);
      let s = `<defs><linearGradient id="gsol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0ca3"/><stop offset=".45" stop-color="#f72585"/><stop offset=".8" stop-color="#ffb703"/></linearGradient></defs>`;
      s += camera(t, d, cena, { z0: 1.05, z1: 1.0, cy: 1000 });
      s += `<rect width="${W}" height="${H}" fill="#ff7b00" opacity=".18"/>`;
      ['7', '9', '1'].forEach((n, i) => { if (E.elenco[n]) s += pessoa(jogador(n, E, { pose: 'acena', expr: 'feliz' }), t, { x: 470 + i * 70 + Math.sin(t + i) * 2, y: 1780 - Math.min(t, 8) * 22, s: cfK(1780 - Math.min(t, 8) * 22), fase: i }).replace(/class="rosto" /g, ''); });
      return s + TIPOS.encerramento.fim(t, d, c, E);
    },
  },
  // ---- evolução do dia no balcão do bar: a Dona Cida conta o dinheiro, o Tião confere a torcida
  evolucao: {
    balcao(t, d, c, E) {
      // a câmera desliza pelo balcão: do Tião (torcida) para a Dona Cida contando o dinheiro (caixa)
      const tC = quando(c, 'caixa', d * 0.6, true);
      let mundo = barDentro(t, E, { atras: presidente(t, E, 760, ATRAS, 0.95, { pose: 'caixa', expr: 'feliz' }) + narrador(t, E, 300, ATRAS, 0.95, { pose: 'aponta' }) });
      mundo += [0, 1, 2, 3].map(i => `<rect x="${640 + i * 34}" y="${1288 - i * 5}" width="96" height="40" rx="6" fill="#95d5b2" stroke="${OUT}" stroke-width="3" transform="rotate(${-8 + i * 6} ${690 + i * 34} 1308)"/>`).join('')
        + [0, 1, 2].map(i => `<circle cx="${880 + i * 24}" cy="1302" r="12" fill="#ffd166" stroke="${OUT}" stroke-width="3"/>`).join('');
      const cam = camChaves(t, [[0, 330, 1080, 1.45, 1250], [Math.max(0.5, tC - 0.6), 330, 1080, 1.5, 1250], [tC + 0.4, 760, 1080, 1.5, 1250], [Math.max(d, tC + 0.5), 760, 1080, 1.55, 1250]]);
      let s = naCamera(cam, mundo) + `<rect width="${W}" height="${H}" fill="${CORES.marinho}" opacity=".12"/>`;
      return s + TIPOS.evolucao.cartoes(t, c, E);
    },
  },
  // ---- capa: o mesmo "DIA N + tema", com fundos diferentes
  capa: {
    rua(t, d, c, E) {
      let s = camera(t, d, sede(E.estrutura, { t }) + narrador(t, E, 540, SEDE.pe, 1, { pose: 'acena' }), CAM_SEDE);
      return s + TIPOS.capa.titulo(t, c);
    },
    aereo(t, d, c, E) {
      let s = camera(t, d, estadioAereo(E.estrutura, c.dados.antes || 0, { t, nome: NOME(E) }), { z0: 1.0, z1: 1.04 });
      s += narrador(t, E, 540, FRENTE(1.9), 1.9, { pose: 'acena' });
      return s + TIPOS.capa.titulo(t, c);
    },
  },
};

// liga as variações às cenas: c.dados.variante escolhe; sem variante (ou desconhecida), fica a cena original
for (const [tipo, vs] of Object.entries(VARIACOES)) {
  const original = TIPOS[tipo];
  if (!original) continue;
  TIPOS[tipo] = (t, d, c, E) => (vs[c.dados.variante] || original)(t, d, c, E);
  Object.assign(TIPOS[tipo], original);   // mantém os "pedaços" pendurados na original (ex.: TIPOS.capa.titulo)
}
Object.assign(window, { barDentro, bilhete, VARIACOES });

// ------------------------------------------------------------ transições entre cenas (como no detetive)
// Mesmo lugar → corte seco (a câmera continua). Lugar diferente → chicote com desfoque de movimento;
// a cada três trocas de lugar, uma nuvem de fumaça. Lugares: bar, rua, campo, tv, aereo, papel, escuro.
function lugarDe(c) {
  const v = c.dados.variante, tp = c.tipo;
  if (['mural', 'celular', 'balcao'].includes(v) || (['quadro'].includes(v))) return 'bar';
  if (v === 'caderno' || v === 'figurinha') return 'papel';
  if (v === 'aereo' || tp === 'evolucao' && !v || tp === 'estadio' && v !== 'arquibancada') return 'aereo';
  if (v === 'chegada') return 'rua_fora';
  if (v === 'rua' || v === 'vestiario' || ['comentarios', 'decisao', 'encerramento', 'comentario', 'presidente', 'caixa'].includes(tp) && !v) return 'rua';
  if (tp === 'gol' || (tp === 'obra' && (c.dados.acoes || []).includes('arquibancada_obra'))) return 'tv';
  if (['tabela', 'liga', 'enquete_nova', 'enquete_resultado'].includes(tp) && !v) return 'escuro';
  if (tp === 'obra') return (c.dados.acoes || []).some(a => ['grama', 'arquibancada', 'refletores', 'rede', 'banco_reservas'].includes(a)) ? 'campo' : 'rua';
  return 'campo';
}
function transicaoDe(i) {
  const cenas = DADOS.cenas;
  if (i <= 0) return null;
  if (lugarDe(cenas[i]) === lugarDe(cenas[i - 1])) return null;
  let trocas = 0; for (let k = 1; k <= i; k++) if (lugarDe(cenas[k]) !== lugarDe(cenas[k - 1])) trocas++;
  return trocas % 3 === 0 ? 'fumaca' : 'chicote';
}
function desenharCena(i, t) {
  const c = DADOS.cenas[i];
  let E = c.dados.estrutura ? { ...DADOS.estado, estrutura: c.dados.estrutura } : DADOS.estado;
  window._local = c.dados.local || null;
  window._placas = !!(E.estrutura && E.estrutura.placas);
  CAM_SEDE = camSede(E.estrutura);
  if (window._local) E = { ...E, _torcida: window._local.torcida ?? 300,
    estrutura: { ...E.estrutura, gramado: 'terrão', capacidade: 500, rede: true, iluminacao: false } };
  const fn = TIPOS[c.tipo] || TIPOS.abertura;
  let svg = fn(t, c.duracao, c, E);
  if (window.ESTILO3D) svg = cena3d(svg);
  return { svg, E };
}
const DUR_TRANS = { chicote: 0.42, fumaca: 0.9 };
window.quadro = tGlobal => {
  const cenas = DADOS.cenas;
  let i = cenas.findIndex(c => tGlobal < c.inicio + c.duracao);
  if (i < 0) i = cenas.length - 1;
  const c = cenas[i], t = tGlobal - c.inicio;
  window._tQuadro = tGlobal;
  const tipo = transicaoDe(i), T = DUR_TRANS[tipo] || 0;
  let { svg, E } = desenharCena(i, t);
  if (tipo && t < T) {
    const ant = cenas[i - 1], { svg: svgAnt } = desenharCena(i - 1, ant.duracao + t * 0.5);
    ({ E } = desenharCena(i, t));  // restaura o estado global (_local etc.) da cena atual
    const k = t / T, e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    if (tipo === 'chicote') {
      const borra = Math.sin(Math.PI * k) * 46;
      svg = `<defs><filter id="chicote" x="-20%" y="0" width="140%" height="100%"><feGaussianBlur stdDeviation="${borra.toFixed(1)} 0"/></filter></defs>
        <g filter="url(#chicote)"><g transform="translate(${(-W * e).toFixed(1)} 0)">${svgAnt}</g><g transform="translate(${(W * (1 - e)).toFixed(1)} 0)">${svg}</g></g>`;
    } else {
      // nuvem de fumaça cobre a cena anterior e se abre na nova
      const cobre = k < 0.5 ? Math.sin(k * Math.PI) : Math.sin(k * Math.PI);
      const base = k < 0.5 ? svgAnt : svg, r = rng('fumaca');
      let nuvem = '';
      for (let n = 0; n < 26; n++) { const x = r() * W, y = r() * H, raio = (180 + r() * 220) * cobre;
        nuvem += `<circle cx="${x.toFixed(0)}" cy="${(y - k * 120).toFixed(0)}" r="${raio.toFixed(0)}" fill="${n % 3 ? '#f1f3f5' : '#dee2e6'}" opacity="${(0.95 * cobre).toFixed(2)}"/>`; }
      svg = base + nuvem;
    }
  }
  svg += marcaDagua(E) + hud(c, E) + legenda(t, c);
  if (!tipo && t < 0.08 && i > 0) svg += `<rect width="${W}" height="${H}" fill="#fff" opacity="${((0.08 - t) / 0.08 * 0.25).toFixed(2)}"/>`;
  document.getElementById('palco').innerHTML = svg;
};
