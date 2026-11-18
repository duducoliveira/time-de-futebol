// ============================================================ cenas2.js
// Variações de enquadramento para cada parte do vídeo. O roteiro (Python, "diretor de cena") escolhe
// c.dados.variante; aqui cada variante tem seu desenho. Sem variante (ou desconhecida), vale a cena original.
// Lugares novos: bar por dentro (mural de recados, quadro-negro, caderno do caixa, TV), celular da Dona Cida,
// álbum de figurinhas, placar de madeira, saída do vestiário, rua do adversário, pôr do sol.

// ------------------------------------------------------------ cenários
const PAPEL = ['#fff4b8', '#ffffff', '#ffd6e0', '#d8f3dc', '#cde7ff'];
const CHALK = '#f1f3f5';

// bar por dentro (plano geral): parede, prateleiras, TV, mural, quadro-negro, balcão e piso
function barDentro(t = 0, E = {}, { mural = true, quadro = true } = {}) {
  let s = `<rect width="${W}" height="${H}" fill="#f1d4a8"/>`;
  // lambri de madeira embaixo e rodapé
  s += `<rect x="0" y="1180" width="${W}" height="420" fill="#c98a52"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 80},1180 v420" stroke="#a96d3b" stroke-width="4"/>`).join('')}
    <rect x="0" y="1170" width="${W}" height="16" fill="#8d5a2b" stroke="${OUT}" stroke-width="4"/>`;
  // prateleiras com garrafas (atrás do balcão)
  for (const y of [300, 440]) {
    s += `<rect x="560" y="${y}" width="470" height="16" fill="#8d5a2b" stroke="${OUT}" stroke-width="4"/>`;
    const r = rng('garrafas' + y);
    for (let x = 580; x < 1010; x += 34 + r() * 10) { const h = 60 + r() * 40, cor = ['#2d6a4f', '#9d0208', '#e9c46a', '#6d597a', '#c97a40'][Math.floor(r() * 5)];
      s += `<rect x="${x}" y="${y - h}" width="22" height="${h}" rx="6" fill="${cor}" stroke="${OUT}" stroke-width="3"/><rect x="${x + 7}" y="${y - h - 18}" width="8" height="20" fill="${cor}" stroke="${OUT}" stroke-width="2.5"/>`; }
  }
  // TV na parede: passando o escudo do Poeira
  s += `<rect x="70" y="160" width="400" height="250" rx="14" fill="#212529" stroke="${OUT}" stroke-width="7"/>
    <rect x="90" y="180" width="360" height="210" fill="#1d3557"/><g transform="translate(270 290) scale(.42)">${escudoPoeira({})}</g>
    <rect x="102" y="192" width="74" height="26" rx="5" fill="#e63946"/><text x="139" y="211" text-anchor="middle" font-family="Anton" font-size="18" fill="#fff">AO VIVO</text>
    <path d="M200,410 l-30,40 M340,410 l30,40" stroke="${OUT}" stroke-width="6"/>`;
  if (mural) s += corticaBoard(70, 560, 440, 330);
  if (quadro) s += quadroNegroMoldura(570, 560, 440, 330) + `<text x="790" y="640" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="40" fill="${CHALK}" opacity=".9">HOJE TEM JOGO!</text>
    <text x="790" y="710" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="30" fill="${CHALK}" opacity=".8">pastel · caldo · refri</text>`;
  // balcão (na altura da cintura) e banquinhos
  s += `<rect x="-10" y="1440" width="${W + 20}" height="30" fill="#6f4518" stroke="${OUT}" stroke-width="5"/>
    <rect x="-10" y="1470" width="${W + 20}" height="190" fill="#a0673e" stroke="${OUT}" stroke-width="5"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 130 + 40},1478 v176" stroke="#8d5a2b" stroke-width="5"/>`).join('')}`;
  // piso em perspectiva (ladrilho)
  s += `<rect x="0" y="1660" width="${W}" height="${H - 1660}" fill="#e9dcc8"/>
    ${Array.from({ length: 13 }, (_, i) => `<path d="M${540 + (i - 6) * 120},1660 L${540 + (i - 6) * 220},${H}" stroke="#cdbfa8" stroke-width="3"/>`).join('')}
    ${[1720, 1800, 1890].map(y => `<path d="M0,${y} H${W}" stroke="#cdbfa8" stroke-width="3"/>`).join('')}`;
  return s;
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
      let s = camera(t, d, barDentro(t, E, { mural: false, quadro: false }) + corticaBoard(60, 180, 960, 940), { z0: 1, z1: 1.03, cy: 700 });
      const lista = (c.dados.comentarios || []).slice(0, 3), n = lista.length;
      lista.forEach((cm, i) => {
        const t0 = cm.chave ? quando(c, cm.chave, 0.3 + i * 2) : 0.3 + i * 2;
        const x = n === 1 ? W / 2 : n === 2 ? [310, 770][i] : [300, 780, 540][i], y = n === 3 ? [390, 470, 860][i] : n === 2 ? [480, 760][i] : 600;
        const rot = [-4, 3, -2][i], cor = PAPEL[i % PAPEL.length];
        const ent = easeOut(prog(t, t0 - 0.15, 0.4));
        if (ent > 0) s += `<g class="ui" transform="translate(${x} ${y - (1 - ent) * 120}) scale(${0.9 + 0.1 * ent})" opacity="${clamp(ent * 2)}">${bilhete(cm.usuario, cm.texto, cm.curtidas, { rot, cor, selo: cm.selo || '', w: n === 1 ? 760 : 470, tam: n === 1 ? 40 : 34 })}</g>`;
        if (cm.carimbo && CARIMBOS[cm.carimbo]) {
          const t1 = cm.chave_carimbo ? quando(c, cm.chave_carimbo, t0 + 1.2) : t0 + 1.2;
          s += pop(t, t1, x + 40, y + 60, carimbo(CARIMBOS[cm.carimbo][0], CARIMBOS[cm.carimbo][1], -10, 38), 0.3, false);
        }
      });
      // a Dona Cida prendendo os bilhetes e o Tião lendo no microfone, no primeiro plano
      s += presidente(t, E, 820, 1930, 1.15, { pose: 'aponta', expr: 'feliz' }) + narrador(t, E, 250, 1930, 1.15, { pose: 'microfone' });
      return s;
    },
    // ---- comentários no celular da Dona Cida (lista do Instagram, o comentário da vez acende)
    celular(t, d, c, E) {
      let s = barDentro(t, E) + `<rect width="${W}" height="${H}" fill="#fff" opacity=".35"/>`;
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
      let s = barDentro(t, E, { mural: false, quadro: false }) + quadroNegroMoldura(70, 160, 940, 980);
      const giz = (txt, y, tam, t0, cor = CHALK) => { const p = clamp((t - t0) / 0.5); return p > 0 ? `<text x="540" y="${y}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="${tam}" fill="${cor}" opacity="${p}">${esc(txt)}</text>` : ''; };
      s += giz((c.texto_tela[0] || '').toUpperCase(), 260, 54, 0.1);
      s += giz(`CAIXA: ${E.moeda} ${Math.round(c.dados.caixa || 0).toLocaleString('pt-BR')}`, 400, 72, 0.5, '#ffe066');
      s += giz('E AGORA, O QUE A GENTE FAZ?', 560, 56, 1.0);
      const ops = (c.dados.opcoes || []).filter(o => !/sua ideia/i.test(o));
      ops.forEach((o, i) => s += giz('• ' + o, 680 + i * 80, 46, 1.4 + i * 0.3));
      s += giz('SUA IDEIA NOS COMENTÁRIOS ✍', 680 + ops.length * 80 + 60, 46, 1.8, '#a5d8ff');
      s += giz('O MAIS CURTIDO DECIDE!', 680 + ops.length * 80 + 150, 50, 2.2, '#ffe066');
      s += narrador(t, E, 840, 1930, 1.15, { pose: 'aponta' }) + presidente(t, E, 260, 1930, 1.15);
      return s;
    },
    mural(t, d, c, E) {
      let s = camera(t, d, barDentro(t, E, { mural: false, quadro: false }) + corticaBoard(60, 180, 960, 940), { z0: 1, z1: 1.03, cy: 700 });
      s += pop(t, 0.1, W / 2, 290, pilula(c.texto_tela[0] || '', { tam: 56, bg: '#2e8b57', rot: -3 }));
      const ops = (c.dados.opcoes || []).filter(o => !/sua ideia/i.test(o));
      ops.forEach((o, i) => s += pop(t, 0.6 + i * 0.3, ops.length === 1 ? 330 : 280 + i * 260, 820, bilhete('torcida', o, 0, { w: 360, cor: PAPEL[(i + 1) % PAPEL.length], rot: [-5, 4, -2][i] || 0 })));
      // bilhetes da Dona Cida: quanto tem no caixa e a pergunta do dia
      s += pop(t, 0.3, 320, 520, bilhete('dona.cida', `No caixa: ${E.moeda} ${Math.round(c.dados.caixa || 0).toLocaleString('pt-BR')}`, 0, { w: 440, cor: '#d8f3dc', rot: -4, tam: 40 }));
      if (!ops.length) s += pop(t, 0.7, 330, 840, bilhete('dona.cida', 'E agora, o que a gente faz com esse dinheiro?', 0, { w: 440, cor: '#ffffff', rot: 3, tam: 36 }));
      // post-it amarelo grande: "SUA IDEIA AQUI"
      s += pop(t, 1.1, 760, 860, `<g transform="rotate(5)"><rect x="-170" y="-150" width="340" height="300" fill="#ffe066" stroke="${OUT}" stroke-width="4"/>
        <rect x="-170" y="-150" width="340" height="44" fill="#fcc419"/>
        <text y="-20" text-anchor="middle" font-family="Anton" font-size="52" fill="${OUT}">SUA IDEIA</text>
        <text y="50" text-anchor="middle" font-family="Anton" font-size="52" fill="${OUT}">AQUI ✍</text>
        <text y="115" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="26" fill="#495057">nos comentários</text></g>`);
      s += narrador(t, E, 260, 1930, 1.15, { pose: 'aponta' }) + presidente(t, E, 830, 1930, 1.15);
      return s;
    },
  },
  // ---- tabela escrita a giz no quadro-negro do bar
  tabela: {
    quadro(t, d, c, E) {
      let s = barDentro(t, E, { mural: false, quadro: false }) + quadroNegroMoldura(70, 160, 940, 980);
      const tab = c.dados.tabela || [], nome = NOME(E);
      s += `<text x="540" y="250" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="46" fill="${CHALK}">${esc((c.texto_tela[0] || '').toUpperCase())}</text>
        <path d="M150,275 H930" stroke="${CHALK}" stroke-width="3" opacity=".7"/>`;
      tab.forEach((l, i) => {
        const y = 340 + i * 78, p = clamp((t - 0.2 - i * 0.12) / 0.3), meu = l.time === nome;
        if (p <= 0) return;
        s += `<g opacity="${p}" transform="rotate(${(i % 2 ? 0.4 : -0.3)} 540 ${y})">
          <text x="150" y="${y}" font-family="Nunito" font-weight="800" font-size="40" fill="${CHALK}">${l.pos}º</text>
          <text x="235" y="${y}" font-family="Nunito" font-weight="800" font-size="40" fill="${meu ? '#ffe066' : CHALK}">${esc(l.time)}</text>
          <text x="920" y="${y}" text-anchor="end" font-family="Nunito" font-weight="900" font-size="40" fill="${CHALK}">${l.pts ?? ''}</text></g>`;
        if (meu) { const q = clamp((t - 1.0) / 0.6); s += `<ellipse cx="520" cy="${y - 14}" rx="${420 * q}" ry="38" fill="none" stroke="#ffe066" stroke-width="5" opacity=".9"/>`; }
      });
      s += pop(t, 0.9, W / 2, 1420, tituloGrande(c.texto_tela[1] || '', { tam: 120, cor: CORES.laranja }));
      s += narrador(t, E, 840, 1930, 1.15, { pose: 'aponta' });
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
      ['7', '9', '18'].forEach((n, i) => { if (E.elenco[n]) s += popPessoa(t, 0.6 + i * 0.15, 270 + i * 270, 1920, pessoa(jogador(n, E, { pose, expr: exp }), t, { s: 1.15, fase: i })); });
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
      s += `<g transform="translate(${-380 + p * 880} 1800) scale(1.15)">${kombi({ t, andando: p < 1 })}</g>`;
      if (p >= 1) ['7', '9', '18', '15'].forEach((n, i) => { const q = clamp((t - 2.5 - i * 0.35) / 1.2); if (q > 0 && E.elenco[n])
        s += pessoa(jogador(n, E, { pose: 'acena', expr: 'feliz' }), t, { x: 400 - q * (120 + i * 70), y: 1880, s: 0.95, fase: i }).replace(/class="rosto" /g, ''); });
      s += TIPOS.pre_jogo.placa(t, c, E);
      return s;
    },
  },
  // ---- encerramento ao pôr do sol: o time volta pra casa, campo vazio
  encerramento: {
    por_do_sol(t, d, c, E) {
      let cena = campo(E.estrutura, { t, nome: NOME(E), torcida: 0 });
      cena = cena.replace(/url\(#gceu\)/, 'url(#gsol)');
      let s = `<defs><linearGradient id="gsol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0ca3"/><stop offset=".45" stop-color="#f72585"/><stop offset=".8" stop-color="#ffb703"/></linearGradient></defs>`;
      s += camera(t, d, cena, { z0: 1.05, z1: 1.0, cy: 1000 });
      s += `<circle cx="760" cy="760" r="120" fill="#ffd166" opacity=".85"/><rect width="${W}" height="${H}" fill="#ff7b00" opacity=".18"/>`;
      ['7', '9', '1'].forEach((n, i) => { if (E.elenco[n]) s += pessoa(jogador(n, E, { pose: 'acena', expr: 'feliz' }), t, { x: 380 + i * 170 + Math.sin(t + i) * 4, y: 1560 - Math.min(t, 6) * 18, s: 0.75 - Math.min(t, 6) * 0.02, fase: i }).replace(/class="rosto" /g, ''); });
      return s + TIPOS.encerramento.fim(t, d, c, E);
    },
  },
  // ---- evolução do dia no balcão do bar: a Dona Cida conta o dinheiro, o Tião confere a torcida
  evolucao: {
    balcao(t, d, c, E) {
      let cena = barDentro(t, E);
      cena += presidente(t, E, 760, 1600, 1.0, { pose: 'caixa', expr: 'feliz' });
      // notas e moedas no balcão
      cena += [0, 1, 2, 3].map(i => `<rect x="${600 + i * 40}" y="${1410 - i * 6}" width="120" height="50" rx="6" fill="#95d5b2" stroke="${OUT}" stroke-width="3" transform="rotate(${-8 + i * 6} ${660 + i * 40} ${1435})"/>`).join('')
        + [0, 1, 2].map(i => `<circle cx="${880 + i * 28}" cy="${1428}" r="14" fill="#ffd166" stroke="${OUT}" stroke-width="3"/>`).join('');
      cena += narrador(t, E, 250, 1930, 1.15, { pose: 'aponta' });
      let s = camera(t, d, cena, { z0: 1, z1: 1.04, cy: 1500 });
      s += `<rect width="${W}" height="${H}" fill="${CORES.marinho}" opacity=".18"/>`;
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
      s += narrador(t, E, 540, 1870, 1.6, { pose: 'acena' });
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
