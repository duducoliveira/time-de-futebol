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

// ---- o bar da Dona Cida por dentro fica em bar.js (sala em perspectiva, medidas reais, três quadros na parede)
// câmera do bar: começa na vista geral e entra no quadro `qual` (chega em tZoom); depois só respira um pouco
function camBar(t, d, qual, tZoom = 1.2) {
  const z = barZoom(qual);
  return camChaves(t, [[0, ...BAR_GERAL], [0.3, ...BAR_GERAL], [tZoom, ...z], [Math.max(d, tZoom + 0.1), z[0], z[1], z[2] * 1.03, z[3]]]);
}
// com a câmera no quadro, a parte de baixo (prateleira, balcão) escurece de leve: o olho vai para o quadro
function focoQuadro(cam) {
  const k = clamp((cam.z - 1.6) / 2);
  return k > 0 ? `<defs><linearGradient id="gfoco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a120b" stop-opacity="0"/><stop offset="1" stop-color="#1a120b" stop-opacity=".55"/></linearGradient></defs>
    <rect x="0" y="960" width="${W}" height="${H - 960}" fill="url(#gfoco)" opacity="${k.toFixed(3)}"/>` : '';
}
// conteúdo que aparece aos poucos (entra com um leve "assentar")
const surge = (t, t0, dur = 0.35) => easeOut(clamp((t - t0) / dur));

// bilhete de papel preso com tacha (comentário no mural)
const alturaBilhete = (txt, { w = 430, selo = '', tam = 30, linhas: max = 4 } = {}) => 110 + Math.min(max, quebrar(txt, tam, w - 60).length) * tam * 1.33 + (selo ? 30 : 0);
function bilhete(usuario, txt, curtidas, { w = 430, cor = '#fff4b8', rot = 0, selo = '', tam = 30, linhas: max = 4 } = {}) {
  const linhas = quebrar(txt, tam, w - 60).slice(0, max), lh = tam * 1.33, h = 110 + linhas.length * lh + (selo ? 30 : 0);
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
      // vista geral do bar (Tião no salão, Dona Cida atrás do balcão) → a câmera entra no quadro de recados,
      // onde os comentários estão pregados como bilhetes; o carimbo bate quando a narração chega nele
      const cam = camBar(t, d, 'recados'), rosto = cam.z < 1.3, q = QUADROS.recados;
      const lista = (c.dados.comentarios || []).slice(0, 3), n = lista.length;
      const pos = n === 1 ? [[500, 360]] : n === 2 ? [[262, 240], [738, 500]] : [[255, 190], [745, 230], [500, 545]];
      const fmt = n === 1 ? { w: 820, tam: 50, linhas: 5 } : n === 2 ? { w: 470, tam: 38, linhas: 5 } : { w: 440, tam: 32, linhas: 3 };
      let conteudo = '';
      lista.forEach((cm, i) => {
        const t0 = Math.max(1.25 + i * 0.15, cm.chave ? quando(c, cm.chave, 0.3 + i * 2) : 0.3 + i * 2), k = surge(t, t0 - 0.1);
        if (k <= 0) return;
        const [x, y] = pos[i], rot = [-4, 3, -2][i];
        const op = { ...fmt, rot, cor: PAPEL[i % PAPEL.length], selo: cm.selo || '' };
        conteudo += `<g transform="translate(${x} ${y}) scale(${(1.12 - 0.12 * k).toFixed(3)})" opacity="${k.toFixed(3)}">${bilhete(cm.usuario, cm.texto, cm.curtidas, op)}</g>`;
        if (cm.carimbo && CARIMBOS[cm.carimbo]) {   // o carimbo bate na borda de baixo do bilhete (não tampa o texto)
          const t1 = Math.max(t0 + 0.4, cm.chave_carimbo ? quando(c, cm.chave_carimbo, t0 + 1.2) : t0 + 1.2), kc = clamp((t - t1) / 0.25);
          const hB = alturaBilhete(cm.texto, op);
          if (kc > 0) conteudo += `<g transform="translate(${x - fmt.w * 0.12} ${y + hB / 2 + 6}) scale(${(1.6 - 0.6 * easeOutBack(kc)).toFixed(3)})" opacity="${kc}">${carimbo(CARIMBOS[cm.carimbo][0], CARIMBOS[cm.carimbo][1], -8, n === 1 ? 52 : 38)}</g>`;
        }
      });
      const mundo = barDentro(t, E, { caixa: c.dados.hud?.caixa, conteudo: { recados: conteudo },
        atras: [{ quem: 'cida', X: -0.3, pose: 'aponta', rosto }], frente: [{ quem: 'tiao', X: -1.05, d: BAR_FRENTE, pose: 'microfone', rosto }] });
      return naCamera(cam, mundo) + focoQuadro(cam);
    },
    // ---- comentários no celular da Dona Cida (lista do Instagram, o comentário da vez acende)
    celular(t, d, c, E) {
      // o bar ao fundo, meio apagado; na frente, o celular da Dona Cida com os comentários
      let s = naCamera({ x: 540, y: 1075, z: 1.15, sy: 900 }, barDentro(t, E, { caixa: c.dados.hud?.caixa, atras: [{ quem: 'cida', X: 0.8, rosto: false }] })) + `<rect width="${W}" height="${H}" fill="#fff" opacity=".45"/>`;
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
      s += presidente(t, E, 270, FRENTE(1.3), 1.3, { expr: 'feliz' });
      return s;
    },
  },
  // ---- decisão no mural: as opções viram bilhetes e sobra um post-it em branco
  decisao: {
    quadro(t, d, c, E) {
      // a câmera entra no quadro branco do caixa; a Dona Cida escreve o valor e a pergunta do dia (pincel)
      const cam = camBar(t, d, 'caixa'), rosto = cam.z < 1.3, R = v => `${E.moeda} ${Math.round(v || 0).toLocaleString('pt-BR')}`;
      const ops = (c.dados.opcoes || []).filter(o => !/sua ideia/i.test(o)).slice(0, 3), tB = 1.25;
      const tV = Math.max(tB, quando(c, 'caixa', tB) - 0.1), tA = Math.max(tV + 0.5, quando(c, 'agora', tV + 1) - 0.1);
      const tI = Math.max(tA + 0.5, quando(c, 'ideia', tA + 1.2) - 0.1), tD = Math.max(tI + 0.4, quando(c, 'decide', tI + 1) - 0.4);
      let conteudo = pincel((c.texto_tela[0] || 'DECISÃO').toUpperCase(), 500, 92, 72, { cor: CORES.vinho, op: surge(t, tB - 0.3) })
        + pincel(R(c.dados.caixa), 500, ops.length ? 225 : 250, ops.length ? 120 : 150, { cor: '#2b8a3e', op: surge(t, tV) });
      if (surge(t, tV) > 0) conteudo += `<path d="M230,${ops.length ? 250 : 282} q270,${18} 540,0" stroke="#2b8a3e" stroke-width="9" fill="none" stroke-linecap="round" opacity="${surge(t, tV + 0.3)}"/>`;
      conteudo += pincel('E AGORA, O QUE A GENTE FAZ?', 500, ops.length ? 320 : 370, 56, { cor: '#1971c2', op: surge(t, tA) });
      ops.forEach((o, i) => { conteudo += pincel('• ' + o, 500, 385 + i * 52, 44, { cor: '#495057', op: surge(t, tA + 0.4 + i * 0.3) }); });
      const yI = ops.length ? 400 + ops.length * 52 : 465;
      conteudo += pincel('SUA IDEIA NOS COMENTÁRIOS', 500, yI, 54, { cor: '#1d3557', op: surge(t, tI) });
      conteudo += pincel('O MAIS CURTIDO DECIDE!', 500, yI + 82, 62, { cor: '#e03131', op: surge(t, tD) });
      const mundo = barDentro(t, E, { caixa: c.dados.caixa, conteudo: { caixa: conteudo },
        atras: [{ quem: 'cida', X: 1.05, pose: 'aponta', rosto }], frente: [{ quem: 'tiao', X: -1.05, d: BAR_FRENTE, pose: 'microfone', rosto }] });
      return naCamera(cam, mundo) + focoQuadro(cam);
    },
    mural(t, d, c, E) {
      // a decisão no quadro de recados: o bilhete do caixa, as ideias da torcida e o post-it em branco
      const cam = camBar(t, d, 'recados'), rosto = cam.z < 1.3, R = v => `${E.moeda} ${Math.round(v || 0).toLocaleString('pt-BR')}`;
      const ops = (c.dados.opcoes || []).filter(o => !/sua ideia/i.test(o)).slice(0, 2), tB = 1.25;
      const nota = (x, y, t0, svg) => { const k = surge(t, t0); return k > 0 ? `<g transform="translate(${x} ${y}) scale(${(1.12 - 0.12 * k).toFixed(3)})" opacity="${k.toFixed(3)}">${svg}</g>` : ''; };
      let conteudo = nota(265, 190, tB, bilhete('dona.cida', `No caixa: ${R(c.dados.caixa)}`, 0, { w: 440, cor: '#d8f3dc', rot: -4, tam: 40 }));
      if (!ops.length) conteudo += nota(270, 500, Math.max(tB + 0.4, quando(c, 'agora', tB + 1) - 0.1), bilhete('dona.cida', 'E agora, o que a gente faz com esse dinheiro?', 0, { w: 440, cor: '#ffffff', rot: 3, tam: 36 }));
      ops.forEach((o, i) => { conteudo += nota(265, 470 + i * 0, tB + 0.6 + i * 0.3, bilhete('torcida', o, 0, { w: 420, cor: PAPEL[(i + 1) % PAPEL.length], rot: [3, -3][i], tam: 34 })); });
      conteudo += nota(745, 380, Math.max(tB + 0.8, quando(c, 'ideia', tB + 1.5) - 0.1), `<g transform="rotate(5)"><rect x="-190" y="-170" width="380" height="340" fill="#ffe066" stroke="${OUT}" stroke-width="5"/>
        <rect x="-190" y="-170" width="380" height="52" fill="#fcc419"/><circle cy="-146" r="14" fill="#e63946" stroke="${OUT}" stroke-width="3"/>
        <text y="-20" text-anchor="middle" font-family="Anton" font-size="66" fill="${OUT}">SUA IDEIA</text>
        <text y="66" text-anchor="middle" font-family="Anton" font-size="66" fill="${OUT}">AQUI ✍</text>
        <text y="130" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="30" fill="#495057">nos comentários</text></g>`);
      const mundo = barDentro(t, E, { caixa: c.dados.caixa, conteudo: { recados: conteudo },
        atras: [{ quem: 'cida', X: -0.3, pose: 'aponta', rosto }], frente: [{ quem: 'tiao', X: -1.05, d: BAR_FRENTE, pose: 'microfone', rosto }] });
      let s = naCamera(cam, mundo) + focoQuadro(cam);
      s += pop(t, tB, W / 2, 175, pilula(c.texto_tela[0] || '', { tam: 46, bg: '#2e8b57', rot: -3 }));
      return s;
    },
  },
  // ---- tabela escrita a giz no quadro-negro do bar
  tabela: {
    quadro(t, d, c, E) {
      // a câmera entra no quadro-negro e a tabela já está escrita a giz; o Poeira é circulado
      const cam = camBar(t, d, 'tabela'), rosto = cam.z < 1.3, tab = (c.dados.tabela || []).slice(0, 10), nome = NOME(E), t0 = 1.2;
      let conteudo = giz((c.texto_tela[0] || '').toUpperCase(), 500, 78, 50, { peso: 900, op: surge(t, t0 - 0.4) })
        + `<path d="M50,104 H950" stroke="${CHALK}" stroke-width="4" opacity="${0.6 * surge(t, t0 - 0.4)}"/>`;
      const passo = tab.length > 8 ? 60 : 70;
      tab.forEach((l, i) => {
        const y = 168 + i * passo, op = surge(t, t0 - 0.2 + i * 0.07), meu = l.time === nome;
        if (op <= 0) return;
        conteudo += `<g transform="rotate(${(i % 2 ? 0.4 : -0.3)} 500 ${y})">${giz(`${l.pos}º`, 60, y, 42, { anchor: 'start', op })}${giz(l.time, 145, y, 42, { anchor: 'start', cor: meu ? '#ffe066' : CHALK, op })}${giz(String(l.pts ?? ''), 950, y, 42, { anchor: 'end', peso: 900, op })}</g>`;
        if (meu) { const q = clamp((t - t0 - 0.8) / 0.6); if (q > 0) conteudo += `<ellipse cx="460" cy="${y - 14}" rx="${470 * q}" ry="34" fill="none" stroke="#ffe066" stroke-width="6" opacity=".9"/>`; }
      });
      const mundo = barDentro(t, E, { caixa: c.dados.hud?.caixa, conteudo: { tabela: conteudo },
        atras: [{ quem: 'cida', X: -0.15, pose: 'normal', rosto }], frente: [{ quem: 'tiao', X: 1.05, d: BAR_FRENTE, pose: 'aponta', rosto }] });
      let s = naCamera(cam, mundo) + focoQuadro(cam);
      s += pop(t, Math.max(1.9, quando(c, 'lugar', 1.9) - 0.2), W / 2, 1420, tituloGrande(c.texto_tela[1] || '', { tam: 120, cor: CORES.laranja }));
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
      // no salão: o Tião confere a torcida; a câmera desliza pelo balcão até a Dona Cida contando o dinheiro
      const tC = quando(c, 'caixa', d * 0.6, true), [xT] = bP(-1.0, 0, BAR_FRENTE), [xC] = bP(1.0, 0, BAR_ATRAS);
      // o quadro do caixa mostra o valor de ontem até a narração chegar no caixa; aí a Dona Cida atualiza
      const caixaQuadro = t < tC + 0.6 ? (c.dados.caixa_antes ?? c.dados.caixa) : c.dados.caixa;
      let mundo = barDentro(t, E, { caixa: caixaQuadro, atras: [{ quem: 'cida', X: 1.0, pose: 'caixa' }], frente: [{ quem: 'tiao', X: -1.0, d: BAR_FRENTE, pose: 'aponta' }] });
      // notas e moedas em cima do balcão, na frente da Dona Cida
      { const k = BARP.f / 4.85; mundo += [0, 1, 2, 3].map(i => { const [x, y] = bP(0.72 + i * 0.07, 1.05, 4.85); return `<rect x="${x - 0.07 * k}" y="${y - 0.03 * k}" width="${0.14 * k}" height="${0.06 * k}" rx="3" fill="#95d5b2" stroke="${OUT}" stroke-width="2" transform="rotate(${-8 + i * 6} ${x} ${y})"/>`; }).join('')
        + [0, 1, 2].map(i => { const [x, y] = bP(1.25 + i * 0.05, 1.05, 4.85); return `<ellipse cx="${x}" cy="${y - 4}" rx="${0.022 * k}" ry="${0.012 * k}" fill="#ffd166" stroke="${OUT}" stroke-width="1.5"/>`; }).join(''); }
      // (os rostos ficam acima da faixa da legenda, y ≈ 1165)
      const cam = camChaves(t, [[0, xT + 80, 1110, 1.16, 935], [Math.max(0.5, tC - 0.6), xT + 80, 1110, 1.19, 935], [tC + 0.4, xC - 40, 1110, 1.19, 935], [Math.max(d, tC + 0.5), xC - 40, 1110, 1.22, 935]]);
      let s = naCamera(cam, mundo) + `<rect width="${W}" height="${H}" fill="${CORES.marinho}" opacity=".1"/>`;
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
Object.assign(window, { bilhete, VARIACOES, camBar });

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
