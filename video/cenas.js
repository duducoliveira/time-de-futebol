// Composição das cenas. Cada tipo de cena do roteiro tem uma função
// (t, dur, cena, E) -> SVG, onde t é o tempo local em segundos e E é o estado visual.

const NOME = E => E.clube.nome;
// escudo oficial (o mesmo da foto de perfil), na escala do escudo genérico dos adversários
const nossoEscudo = E => `<g transform="scale(.66)">${escudoPoeira({ estrelas: E.clube.titulos || 0 })}</g>`;

function camera(t, dur, conteudo, { z0 = 1, z1 = 1.06, cx = W / 2, cy = H / 2 } = {}) {
  const z = z0 + (z1 - z0) * easeOut(clamp(t / Math.max(dur, 0.1)));
  return `<g transform="translate(${cx} ${cy}) scale(${z}) translate(${-cx} ${-cy})">${conteudo}</g>`;
}

// câmera das cenas na sede: zoom leve, ancorado no chão (o cenário e as pessoas andam juntos)
const CAM_SEDE = { z0: 1, z1: 1.04, cy: 1750 };

function narrador(t, E, x = 300, y = 1720, s = 1.45, extra = {}) { return pessoa({ ...PERSONAGENS.narrador, ...extra }, t, { x, y, s }); }
function presidente(t, E, x = 780, y = 1720, s = 1.45, extra = {}) { return pessoa({ ...PERSONAGENS.presidente, ...extra }, t, { x, y, s, fase: 1.3 }); }

function elencoLinha(t, E, y = 1500, s = 0.9, numeros = null) {
  const nums = numeros || Object.keys(E.elenco).sort((a, b) => a - b).slice(0, 11);
  const tras = nums.filter((_, i) => i % 2 === 0), frente = nums.filter((_, i) => i % 2 === 1);
  let out = '';
  [[tras, y, 0.92], [frente, y + 150, 1.05]].forEach(([fila, yy, k], f) => {
    fila.forEach((n, i) => {
      const x = W / 2 + (i - (fila.length - 1) / 2) * (f ? 205 : 180);
      out += popPessoa(t, 0.15 + (i * 2 + f) * 0.07, x, yy, pessoa(jogador(n, E), t, { s: s * k, fase: i + f }));
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
    let s = camera(t, d, sede(E.estrutura, { t }) + narrador(t, E, 345, SEDE.pe, 1, { pose: 'microfone' }) + presidente(t, E, 742, SEDE.pe, 1), CAM_SEDE);
    s += pop(t, 0.1, W / 2, 330, pilula(c.texto_tela[0], { tam: 50, bg: '#2e8b57', rot: -2 }));
    const cm = c.dados.comentario;
    s += pop(t, 0.4, W / 2, 620, cartaoComentario(cm.usuario, cm.texto, cm.curtidas));
    return s;
  },
  obra(t, d, c, E) {
    const virada = Math.min(1.6, d * 0.35);
    const est = t < virada ? c.dados.antes : c.dados.depois;
    const acoes = c.dados.acoes || [];
    const noCampo = acoes.some(a => ['grama', 'arquibancada', 'refletores', 'rede', 'banco_reservas'].includes(a));
    // banco de reservas: depois de mostrar a obra no campo, corta para a imagem da lateral
    const tBanco = acoes.includes('banco_reservas') ? Math.max(virada + 0.8, quando(c, 'banquinho', quando(c, 'banco', d * 0.6)) - 0.2) : Infinity;
    const fundo = t >= tBanco ? lateral(est, { t, nome: NOME(E) })
      : noCampo ? campo(est, { t, nome: NOME(E), torcida: 0 }) : sede(est, { t });
    let s = camera(t, d, fundo, noCampo || t >= tBanco ? {} : { z1: 1 });  // na sede a câmera fica parada (as pessoas pisam no chão)
    if (t >= virada && t < virada + 0.5) {
      const p = (t - virada) / 0.5;
      for (let i = 0; i < 10; i++) s += `<circle cx="${100 + i * 95}" cy="${1000 + Math.sin(i) * 180}" r="${60 + p * 120}" fill="#fff" opacity="${0.8 * (1 - p)}"/>`;
    }
    if (acoes.includes('kombi') && t >= virada) {  // a Kombi chega andando e estaciona na frente do bar
      const p = easeOut(prog(t, virada, 1.2));
      s += `<g transform="translate(${-400 + p * 940} 1908) scale(1.1)">${kombi({ t, andando: p < 1 })}</g>`;
    }
    if (acoes.includes('uniforme') && t >= virada) {  // a costureira entrega o uniforme (com remendos) pro time
      s += popPessoa(t, virada + 0.2, 380, SEDE.pe, pessoa(jogador('17', E, { pose: 'comemora', expr: 'feliz' }), t, { s: 1 }));
      s += popPessoa(t, virada + 0.35, 545, SEDE.pe, pessoa(jogador('9', E, { pose: 'comemora', expr: 'feliz' }), t, { s: 1, fase: 1 }));
      s += popPessoa(t, virada + 0.5, 715, SEDE.pe, pessoa({ ...PERSONAGENS.costureira, pose: 'acena' }, t, { s: 1.05, fase: 2 }));
    }
    (c.dados.novos_jogadores || []).forEach((j, i) => {
      const num = Object.keys(E.elenco).find(k => E.elenco[k].nome === j.nome) || '12';
      s += popPessoa(t, virada + 0.2, 540 + i * 200, 1880, pessoa(jogador(num, E, { pose: 'comemora' }), t, { s: 1.9 }));
    });
    s += pop(t, 0.1, W / 2, 330, pilula(c.texto_tela[0] || '', { tam: 52, bg: '#2e8b57', rot: -2 }));
    if (c.texto_tela[1]) s += pop(t, virada + 0.1, W / 2, 580, texto(c.texto_tela[1], { tam: 110, cor: '#e63946', bw: 16 }));
    const [px, py] = noCampo ? [260, 1830] : [W / 2, 820];  // na sede, o painel vai pro céu (embaixo tem gente e varal)
    s += pop(t, virada + 0.6, px, py, `<g transform="scale(.55)">${painelCaixa(c.dados.caixa, E.moeda, 'SOBROU')}</g>`);
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
    s += pop(t, 0.7, 250, 650, `<g transform="scale(.85)">${m === NOME(E) ? nossoEscudo(E) : escudo(m)}</g>`);
    s += pop(t, 0.9, 830, 650, `<g transform="scale(.85)">${v === NOME(E) ? nossoEscudo(E) : escudo(v)}</g>`);
    s += pop(t, 1.1, W / 2, 690, texto('X', { tam: 130 }));
    s += pop(t, 1.0, 250, 845, texto(m, { tam: 38, bw: 10 })) + pop(t, 1.0, 830, 845, texto(v, { tam: 38, bw: 10 }));
    s += elencoLinha(t, E, 1560, 0.7, ['1', '3', '4', '5', '8', '9', '10']);
    if (c.dados.local && E.estrutura.kombi) {  // o Poeira chega de Kombi na casa do adversário (o time atrás dela)
      const p = easeOut(prog(t, 0.1, 1.5));
      s += `<g transform="translate(${-420 + p * 960} 1935) scale(.85)">${kombi({ t, andando: p < 1 })}</g>`;
    }
    return s;
  },
  // Gol: a câmera fecha na trave. O goleiro fica DENTRO do gol (pula pro lado errado) e a bola estufa a rede.
  // Depois: gol nosso = o autor comemora em primeiro plano; gol deles = a zaga lamenta (ou o culpado, com apelido).
  gol(t, d, c, E) {
    const nosso = c.dados.nosso, dd = c.dados;
    const GX = W / 2, GY = 955;                       // trave no campo (antes do zoom)
    const lado = dd.minuto % 2 ? 1 : -1;              // canto da bola
    const p = easeOut(prog(t, 0.15, 0.5));            // chute até a rede
    const mergulho = easeOut(prog(t, 0.25, 0.35));
    const adv = dd.mandante === NOME(E) ? dd.visitante : dd.mandante;
    // goleiro: o deles quando o gol é nosso; o nosso (Baixinho) quando o gol é deles
    const [c1, c2] = coresTime(adv);
    const goleiro = nosso ? { pele: '#c68642', cabelo: 'curto', corCabelo: '#1b1b1b', luvas: true, camisa: c1, listra: c2, calcao: OUT, meiao: c1, expr: 'surpreso' }
      : jogador('1', E, { expr: 'surpreso' });
    const kx = GX - lado * 44 * mergulho, ky = GY - 3 - Math.sin(mergulho * Math.PI) * 20;
    window._closeGol = true;  // com o zoom, os letreiros do muro saem do quadro (não entram na checagem)
    let cena = campo(E.estrutura, { t, nome: NOME(E), torcida: E._torcida });
    if (nosso !== null) {
      cena += sombraChao(GX - lado * 34 * mergulho, GY + 2, 24, 5, 0.25);
      cena += `<g transform="translate(${kx} ${ky}) rotate(${-lado * 78 * mergulho})">${pessoa({ ...goleiro, pose: 'comemora' }, t, { s: 0.24 })}</g>`;
      const bx = GX + lado * (10 + 72 * p), by = 1230 - p * (1230 - (GY - 42)) - Math.sin(p * Math.PI) * 60;
      if (p >= 1) cena += `<ellipse cx="${GX + lado * 82}" cy="${GY - 42}" rx="${28 + Math.sin(t * 20) * 3}" ry="22" fill="none" stroke="#fff" stroke-width="2.5" opacity=".9"/>
        <ellipse cx="${GX + lado * 82}" cy="${GY - 42}" rx="16" ry="12" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>`;  // rede estufando
      const br = 10 - p * 3.5;
      cena += `<circle cx="${bx}" cy="${by}" r="${br}" fill="#fff" stroke="${OUT}" stroke-width="2.5"/><path d="M${bx - br * 0.4},${by - br * 0.3} l${br * 0.4},${-br * 0.3} l${br * 0.4},${br * 0.3} l${-br * 0.15},${br * 0.45} h${-br * 0.5}z" fill="${OUT}"/>`;
    }
    let s = camera(t, d, cena, { z0: 2.6, z1: 2.8, cx: GX, cy: 905 });
    window._closeGol = false;
    if (nosso) {
      const num = Object.keys(E.elenco).find(k => E.elenco[k].nome === dd.autor) || '9';
      s += popPessoa(t, 0.75, 540, 1905, pessoa(jogador(num, E, { pose: 'comemora', expr: 'feliz' }), t, { s: 1.35 }));
      s += pop(t, 0.6, W / 2, 600, tituloGrande('GOOOOL!', { tam: 170, cor: CORES.amarelo, rot: -5 }));
    } else if (nosso === false) {
      s += pop(t, 0.6, W / 2, 600, pilula(c.texto_tela[1] || 'GOL DELES', { tam: 56, bg: '#6c757d', rot: 3 }));
      if (dd.culpado) {  // o culpado do gol, com o apelido novo
        const q = dd.culpado;
        s += popPessoa(t, 0.9, 760, 1905, pessoa(jogador(q.numero, E, { expr: 'surpreso', pose: 'acena' }), t, { s: 1.35 }));
        s += pop(t, 1.0, 330, 1420, pilula(`#${q.numero} ${q.nome.toUpperCase()}`, { tam: 40, bg: CORES.marinho, rot: -3 }));
        s += pop(t, 1.3, 330, 1530, pilula(q.apelido.toUpperCase(), { tam: 54, bg: CORES.laranja, cor: OUT, rot: 2 }));
      } else {
        s += popPessoa(t, 0.9, 380, 1905, pessoa(jogador('3', E, { expr: 'triste' }), t, { s: 1.3 }));
        s += popPessoa(t, 1.0, 700, 1905, pessoa(jogador('4', E, { expr: 'triste' }), t, { s: 1.3, fase: 1 }));
      }
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
    s += pop(t, 0.1, W / 2, 250, pilula('FIM DE JOGO', { tam: 52, bg: CORES.marinho, rot: -2 }));
    s += pop(t, 0.4, W / 2, 545, tituloGrande(`${dd.placar[0]} x ${dd.placar[1]}`, { tam: 180, cor: '#fff', rot: 0 }));
    s += pop(t, 0.6, W / 2, 668, pilula(`${dd.mandante}  ·  ${dd.visitante}`, { tam: 32, bg: CORES.marinho, py: 12 }));
    if (dd.resultado === 'vitória') s += pop(t, 1.0, W / 2, 825, tituloGrande('VITÓRIA!', { tam: 96, cor: CORES.amarelo, rot: -3 }));
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
    let s = camera(t, d, sede(E.estrutura, { t }) + narrador(t, E, 345, SEDE.pe, 1, { pose: 'aponta' }) + presidente(t, E, 742, SEDE.pe, 1), CAM_SEDE);
    const ops = c.dados.opcoes || [];
    const cores = ['#e63946', '#3a86ff', '#2e8b57'];
    ops.forEach((o, i) => s += pop(t, 0.3 + i * 0.25, 210 + i * 330, 560, `<g transform="rotate(${[-4, 2, 5][i] || 0})">${cartaoOpcao(o, iconeOpcao(o), cores[i % 3])}</g>`));
    s += pop(t, 1.2, W / 2, 860, cartaoComentario('voce', 'sua ideia aqui...', 0, { selo: 'COMENTÁRIO MAIS CURTIDO DECIDE', w: 820 }));
    s += pop(t, 0.1, W / 2, 300, pilula(c.texto_tela[0] || '', { tam: 56, bg: '#2e8b57', rot: -3 }));
    return s;
  },
  encerramento(t, d, c, E) {
    let s = camera(t, d, sede(E.estrutura, { t }) + narrador(t, E, 345, SEDE.pe, 1, { pose: 'acena' }) + presidente(t, E, 742, SEDE.pe, 1, { expr: 'feliz' }), CAM_SEDE);
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


// instante em que a narração fala uma palavra (para sincronizar elementos com a voz)
function quando(c, palavra, padrao = 0, ultima = false) {
  const ws = (c.palavras || []).filter(w => w.texto.toLowerCase().replace(/[^a-zà-ú]/g, '').startsWith(palavra));
  const p = ultima ? ws[ws.length - 1] : ws[0];
  return p ? p.t0 : padrao;
}

function contador(valor, antes, p) { return antes + (valor - antes) * easeOut(clamp(p)); }

function cartaoNumero(rotulo, valor, { regra = '', delta = '', cor = CORES.laranja, moeda = '' } = {}) {
  const txt = (moeda ? moeda + ' ' : '') + Math.round(valor).toLocaleString('pt-BR');
  const tam = txt.length > 8 ? 88 : 110;
  return cartao(480, 330, `
    <rect x="-240" y="-165" width="480" height="70" rx="30" fill="${CORES.marinho}"/><rect x="-240" y="-125" width="480" height="30" fill="${CORES.marinho}"/>
    <text y="-115" text-anchor="middle" font-family="Anton" font-size="40" fill="#fff" letter-spacing="3">${esc(rotulo)}</text>
    <text y="10" text-anchor="middle" font-family="Anton" font-size="${tam}" fill="${cor}" stroke="${OUT}" stroke-width="6" paint-order="stroke">${esc(txt)}</text>
    ${delta ? `<text y="72" text-anchor="middle" font-family="Anton" font-size="42" fill="${CORES.verde}">${esc(delta)}</text>` : ''}
    <text y="${delta ? 130 : 110}" text-anchor="middle" font-family="Anton" font-size="30" fill="${OUT}" letter-spacing="1">${esc(regra)}</text>`, { bg: CORES.creme });
}

Object.assign(TIPOS, {
  regras(t, d, c, E) {
    let s = camera(t, d, estadioAereo(E.estrutura, 0, { t, nome: NOME(E) }), { z0: 1.0, z1: 1.05 });
    s += `<rect width="${W}" height="${H}" fill="${CORES.marinho}" opacity=".45"/>`;
    s += pop(t, 0.05, W / 2, 230, pilula(c.texto_tela[0] || 'COMO FUNCIONA', { tam: 60, bg: CORES.laranja, cor: OUT, rot: -2 }));
    const regras = [['seguidor', '👤', '1 SEGUIDOR', '= 1 TORCEDOR NO ESTÁDIO', '#3a86ff'],
      ['curtida', '❤️', '1 CURTIDA', '= R$ 1 NO CAIXA DO CLUBE', '#e63946'],
      ['comentário', '💬', 'COMENTÁRIO MAIS CURTIDO', 'DECIDE O QUE O CLUBE FAZ', '#2e8b57']];
    regras.forEach(([chave, ic, a, b, cor], i) => {
      const t0 = quando(c, chave, 0.6 + i * 2);
      s += pop(t, t0 - 0.15, W / 2, 430 + i * 210, cartao(900, 170, `
        <circle cx="-360" r="58" fill="${cor}" stroke="${OUT}" stroke-width="6"/><text x="-360" y="22" text-anchor="middle" font-size="58">${ic}</text>
        <text x="-270" y="-8" font-family="Anton" font-size="${a.length > 12 ? 52 : 64}" fill="${OUT}">${esc(a)}</text>
        <text x="-270" y="50" font-family="Anton" font-size="38" fill="${cor}">${esc(b)}</text>`, { bg: CORES.creme }));
    });
    return s;
  },
  estadio(t, d, c, E) {
    const dd = c.dados;
    const rev = easeOut(prog(t, 0.4, Math.min(3, d * 0.6)));
    let s = camera(t, d, estadioAereo(E.estrutura, dd.torcida, { t, revelar: rev, torcidaAntes: dd.antes || 0, nome: NOME(E) }),
      { z0: 1.12, z1: 1.0, cy: 900 });
    const v = contador(dd.torcida, dd.antes || 0, rev);
    s += pop(t, 0.1, W / 2, 250, pilula(`${Math.round(v).toLocaleString('pt-BR')} TORCEDORES`, { tam: 66, bg: CORES.laranja, cor: OUT, rot: -2 }));
    if (c.texto_tela[1]) s += pop(t, 1.6, W / 2, 380, pilula(c.texto_tela[1], { tam: 52, bg: '#e63946', rot: 3 }));
    else if (c.texto_tela[0] && !dd.torcida) s += pop(t, 0.5, W / 2, 380, pilula(c.texto_tela[0], { tam: 44, bg: CORES.marinho, rot: 2 }));
    return s;
  },
  evolucao(t, d, c, E) {
    const dd = c.dados;
    const tT = quando(c, 'hoje', 1.2, true), tC = quando(c, 'caixa', 3, true);
    let s = camera(t, d, estadioAereo(E.estrutura, dd.torcida, { t, revelar: easeOut(prog(t, tT, 1.6)), torcidaAntes: dd.antes, nome: NOME(E) }), { z0: 1.0, z1: 1.04 });
    s += `<rect width="${W}" height="${H}" fill="${CORES.marinho}" opacity=".35"/>`;
    s += pop(t, 0.05, W / 2, 230, tituloGrande(c.texto_tela[0] || '', { tam: 170 }));
    const pT = prog(t, tT, 1.6), pC = prog(t, tC, 1.6);
    const dT = dd.torcida - dd.antes, dC = dd.caixa - dd.caixa_antes;
    s += pop(t, 0.4, 290, 600, cartaoNumero('TORCIDA', contador(dd.torcida, dd.antes, pT),
      { regra: '1 SEGUIDOR = 1 TORCEDOR', delta: pT > 0 ? `+${dT.toLocaleString('pt-BR')} HOJE` : `ONTEM`, cor: '#3a86ff' }));
    s += pop(t, 0.6, 790, 600, cartaoNumero('CAIXA', contador(dd.caixa, dd.caixa_antes, pC),
      { regra: '1 CURTIDA = R$ 1', delta: pC > 0 ? `+R$ ${dC.toLocaleString('pt-BR')}` : 'ONTEM', cor: CORES.verde, moeda: E.moeda }));
    for (let i = 0; i < 6 && t > tC; i++) {
      const tt = (t * 0.9 + i * 0.37) % 2.2;
      s += `<text x="${640 + i * 60}" y="${900 - tt * 260}" font-size="54" fill="#e63946" opacity="${clamp(1 - tt / 2.2)}">♥</text>`;
    }
    return s;
  },
});

const CARIMBOS = { inviavel: ['INVIÁVEL POR ENQUANTO', '#e63946'], aprovado: ['APROVADO!', '#2e8b57'],
  anotado: ['ANOTADO', '#f77f00'], depois: ['VEM JUNTO COM O ESTÁDIO', '#e63946'],
  peneira: ['PENEIRA AOS 500!', '#3a86ff'], lotar: ['QUANDO LOTAR', '#f77f00'] };

const CAPA_LAYOUT = 'abaixo_titulo';  // ou 'acima_tiao'

Object.assign(TIPOS, {
  // capa (como a do Dia 1): o Tião abre o vídeo falando "Dia N: tema"; é dela que sai a capa do post
  capa(t, d, c, E) {
    let s = campo(E.estrutura, { t, nome: NOME(E), torcida: c.dados.antes || 0 });
    s += narrador(t, E, 540, 1870, 1.8, { pose: 'acena' });
    s += `<g transform="translate(${W / 2} 470)">${tituloGrande(c.texto_tela[0] || '', { tam: 230 })}</g>`;
    if (c.dados.tema) {
      const tam = Math.min(128, 900 / Math.max(1, medir(c.dados.tema, 1)));  // tema grande, sem passar da tela
      const y = (c.dados.layout || CAPA_LAYOUT) === 'acima_tiao' ? 1150 : 700;
      s += `<g transform="translate(${W / 2} ${y})">${pilula(c.dados.tema, { tam, rot: 2, px: 40, py: 24 })}</g>`;
    }
    return s;
  },
  // vários comentários, cada um entra quando a narração chega nele, com carimbo
  comentarios(t, d, c, E) {
    let s = camera(t, d, sede(E.estrutura, { t }) + narrador(t, E, 345, SEDE.pe, 1, { pose: 'microfone' }) + presidente(t, E, 742, SEDE.pe, 1), CAM_SEDE);
    const lista = c.dados.comentarios || [];
    const alturas = lista.map(cm => 150 + Math.min(2, quebrar(cm.texto, 44, 700).length) * 54);
    const gap = lista.length > 2 ? 22 : 40;  // 3 cartões: mais juntos, para não encostar na legenda
    let y = lista.length > 2 ? 225 : 250;
    lista.forEach((cm, i) => {
      const t0 = cm.chave ? quando(c, cm.chave, 0.3 + i * 2) : 0.3 + i * 2;
      const h = alturas[i];
      s += pop(t, t0 - 0.1, W / 2, y + h / 2, cartaoComentario(cm.usuario, quebrar(cm.texto, 44, 700).slice(0, 2).join(' '), cm.curtidas,
        { selo: cm.selo || (i === 0 ? 'COMENTÁRIO MAIS CURTIDO' : 'COMENTÁRIO'), w: 900 }));
      if (cm.carimbo && CARIMBOS[cm.carimbo]) {
        const t1 = cm.chave_carimbo ? quando(c, cm.chave_carimbo, t0 + 1.2) : t0 + 1.2;
        s += pop(t, t1, W / 2 + 190, y + h - 20, carimbo(CARIMBOS[cm.carimbo][0], CARIMBOS[cm.carimbo][1], -8, 40), 0.3, false);  // carimbo faz parte do cartão
      }
      y += h + gap;
    });
    return s;
  },
  // torcedores que pediram para entrar no time viram personagens
  reforcos(t, d, c, E) {
    const itens = [...Object.values(c.dados.personagens || {}).map(p => ({ ...p, n: null })),
      ...Object.entries(c.dados.jogadores || {}).map(([n, j]) => ({ n, ...j }))];
    const muitos = itens.length > 4;  // muita gente: fundo escuro (sem letreiros) e lista mais compacta
    let s = muitos ? fundoEscuro() : camera(t, d, campo(E.estrutura, { t, nome: NOME(E), torcida: E._torcida }), { z0: 1.05, z1: 1.1 });
    s += pop(t, 0.05, W / 2, 215, pilula(c.texto_tela[0] || 'REFORÇOS DA TORCIDA', { tam: 50, bg: '#2e8b57', rot: -2 }));
    itens.forEach((j, i) => {
      const t0 = j.chave ? quando(c, j.chave, 0.6 + i * 2) : 0.6 + i * 2;
      const linha1 = j.n ? `#${j.n} ${j.nome.toUpperCase()} · ${j.posicao}` : `${j.nome.toUpperCase()} · ${(j.cargo || '').toUpperCase()}`;
      const passo = muitos ? 132 : 138;
      s += pop(t, t0, W / 2, 322 + i * passo, `${pilula(linha1, { tam: muitos ? 38 : 42, bg: j.n ? CORES.vinho : '#2e8b57', rot: i % 2 ? 1.5 : -1.5 })}
        <g transform="translate(0 54)">${pilula('@' + (j.instagram || ''), { tam: 24, bg: CORES.creme, cor: OUT, py: 6 })}</g>`);
      if (muitos && i >= 6) return;
      const x = 160 + i * (760 / Math.max(1, itens.length - 1));
      const visual = j.n ? jogador(j.n, E, { pose: 'comemora' }) : { pele: '#e0ac69', cabelo: 'curto', corCabelo: '#2b1d14', oculos: true, camisa: '#f1faee', calcao: '#343a40', meiao: '#343a40', expr: 'serio' };
      s += popPessoa(t, t0 + 0.1, x, 1910, pessoa(visual, t, { s: 1.05, fase: i }));
    });
    return s;
  },
  cabare(t, d, c, E) {
    const dd = c.dados;
    let s = camera(t, d, cabare(E.estrutura, { t }), { z0: 1.0, z1: 1.04 });
    ['9', '4', '10'].forEach((n, i) => {
      const x = 170 + i * 120;
      s += pessoa(jogador(n, E, { expr: 'serio' }), t, { x, y: 1910, s: 0.95, fase: i });
      s += zzz(x + 20, 1560, t, i * 0.3);
    });
    if (dd.proibido) {
      s += presidente(t, E, 860, 1910, 1.25, { pose: 'aponta', expr: 'bravo' });
      s += pop(t, 0.3, W / 2, 360, pilula(c.texto_tela[0] || 'DECISÃO DA PRESIDENTE', { tam: 50, bg: CORES.vinho, rot: -2 }));
      s += pop(t, quando(c, 'proibido', 1.2) - 0.1, W / 2, 640, carimbo('PROIBIDO PARA JOGADORES', '#e63946', -8, 76), 0.35);
    } else {
      s += presidente(t, E, 880, 1910, 1.2, { expr: 'surpreso' });
      if (dd.comentario) s += pop(t, 0.3, W / 2, 420, cartaoComentario(dd.comentario.usuario, dd.comentario.texto, dd.comentario.curtidas, { selo: 'COMENTÁRIO', w: 900 }));
      if (c.texto_tela[0]) s += pop(t, quando(c, 'existe', 2.5), W / 2, 720, carimbo(c.texto_tela[0], '#9d4edd', -6, 56), 0.35);
    }
    return s;
  },
});

Object.assign(TIPOS, {
  // os reservas que entraram descansados, ao lado do banco na lateral
  banco(t, d, c, E) {
    let s = camera(t, d, lateral(E.estrutura, { t, nome: NOME(E), torcida: E._torcida }), { z0: 1.0, z1: 1.05, cx: 330, cy: 1500 });
    s += pop(t, 0.1, W / 2, 330, pilula(c.texto_tela[0] || 'O BANCO FUNCIONOU', { tam: 60, bg: '#2e8b57', rot: -2 }));
    (c.dados.jogadores || []).forEach((n, i) => {
      const j = E.elenco[n] || {};
      const t0 = quando(c, (j.nome || '').split(' ')[0].toLowerCase(), 0.6 + i);
      s += popPessoa(t, t0, 640 + i * 150, 1910 - i * 40, pessoa(jogador(n, E, { pose: 'comemora', expr: 'feliz' }), t, { s: 1.0, fase: i }));
      s += pop(t, t0 + 0.1, W / 2, 470 + i * 110, pilula(`#${n} ${(j.nome || '').toUpperCase()}`, { tam: 40, bg: CORES.vinho, rot: i % 2 ? 2 : -2 }));
    });
    return s;
  },
  // comemoração (ex: primeira vitória no clássico)
  festa(t, d, c, E) {
    let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E), torcida: E._torcida }), { z0: 1.05, z1: 1.12 });
    s += pop(t, 0.1, W / 2, 420, tituloGrande('VITÓRIA!', { tam: 170, cor: CORES.amarelo, rot: -5 }));
    if (c.texto_tela[0]) s += pop(t, 0.8, W / 2, 640, pilula(c.texto_tela[0], { tam: 46, bg: CORES.vinho, rot: 2 }));
    ['9', '8', '1', '10', '12'].forEach((n, i) => {
      if (E.elenco[n]) s += popPessoa(t, 0.3 + i * 0.15, 140 + i * 200, 1910, pessoa(jogador(n, E, { pose: 'comemora', expr: 'feliz' }), t, { s: 1.0, fase: i }));
    });
    return s;
  },
});

// prancheta do técnico: formação desenhada num campinho (ex: [2, 3, 5] = Pombo Atômico)
function prancheta(t, c, formacao, { balanco = false } = {}) {
  const w = 700, h = 640, x0 = -w / 2, y0 = -h / 2;
  let s = `<rect x="${x0 - 26 + 10}" y="${y0 - 26 + 14}" width="${w + 52}" height="${h + 52}" rx="26" fill="#000" opacity=".25"/>
    <rect x="${x0 - 26}" y="${y0 - 26}" width="${w + 52}" height="${h + 52}" rx="26" fill="#9c6644" stroke="${OUT}" stroke-width="8"/>
    <rect x="-90" y="${y0 - 58}" width="180" height="56" rx="14" fill="#adb5bd" stroke="${OUT}" stroke-width="7"/><circle cy="${y0 - 34}" r="11" fill="${OUT}"/>
    <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="10" fill="#2e8b57" stroke="${OUT}" stroke-width="6"/>
    <path d="M${x0},0 H${-x0}" stroke="#ffffffaa" stroke-width="5"/><circle r="70" fill="none" stroke="#ffffffaa" stroke-width="5"/>
    <rect x="-150" y="${y0}" width="300" height="86" fill="none" stroke="#ffffffaa" stroke-width="5"/>
    <rect x="-150" y="${-y0 - 86}" width="300" height="86" fill="none" stroke="#ffffffaa" stroke-width="5"/>`;
  // linhas da formação, de baixo (defesa) para cima (ataque); o goleiro fica no pé da prancheta
  const linhas = [[1], ...formacao.map(n => Array.from({ length: n }))];
  const chaves = ['', 'zagueiros', 'meio', 'atacantes'];
  linhas.forEach((linha, k) => {
    const n = linha.length, y = -y0 - 52 - k * ((h - 150) / (linhas.length - 1));
    const t0 = balanco ? 0.3 + k * 0.12 : k ? quando(c, chaves[k] || '', 1 + k * 1.2) - 0.15 : 0.4;
    for (let i = 0; i < n; i++) {
      let x = (i - (n - 1) / 2) * Math.min(150, (w - 110) / Math.max(1, n - 1)), yy = y;
      if (k === 2 && n === 3) { const a = t * 1.6 + i * 2.094; x = Math.cos(a) * 62; yy = y + Math.sin(a) * 34; }   // roda de oração
      if (k === 3) yy = y + (i % 2) * 22 - Math.max(0, Math.sin(t * 3 + i)) * 14;                                  // invadindo a área
      const cor = k === 0 ? CORES.amarelo : CORES.vinho;
      s += pop(t, t0 + i * 0.08, x, yy, `<circle r="30" fill="${cor}" stroke="${OUT}" stroke-width="6"/><circle r="30" fill="none" stroke="${k === 0 ? CORES.vinho : CORES.amarelo}" stroke-width="4" stroke-dasharray="6 6"/>`, 0.25, false);
      if (k === 3 && t > t0 + 0.6) s += `<path d="M${x},${yy - 40} v-34 m-12,14 l12,-14 l12,14" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
    }
  });
  if (balanco) {  // depois do jogo: o que deu certo e o que não deu
    s += pop(t, quando(c, 'defesa', 2.5), 0, -y0 - 150, `<rect x="-250" y="-52" width="500" height="92" rx="12" fill="#fff4dc" transform="rotate(-5)"/>` + carimbo('DEFESA: TOMOU 3', '#e63946', -5, 50), 0.3, false);
    s += pop(t, quando(c, 'ataque', 5), 0, y0 + 150, `<rect x="-215" y="-52" width="430" height="92" rx="12" fill="#fff4dc" transform="rotate(4)"/>` + carimbo('ATAQUE: FEZ 3', '#2e8b57', 4, 50), 0.3, false);
  } else s += pop(t, 0.6, w / 2 - 70, y0 + 20, `<text font-size="96" text-anchor="middle" transform="rotate(${Math.sin(t * 4) * 8})">🐦</text><text x="46" y="-44" font-size="50">💣</text>`, 0.3, false);
  return s;
}

Object.assign(TIPOS, {
  // tática do técnico: prancheta com a formação (antes do jogo) ou com o balanço (depois)
  tatica(t, d, c, E) {
    const dd = c.dados;
    let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E), torcida: E._torcida }), { z0: 1.04, z1: 1.1 });
    s += `<rect width="${W}" height="${H}" fill="${CORES.marinho}" opacity=".35"/>`;
    s += pop(t, 0.1, W / 2, 250, pilula(c.texto_tela[0] || 'A TÁTICA', { tam: 54, bg: CORES.vinho, rot: -2 }));
    s += pop(t, 0.25, W / 2, 700, prancheta(t, c, dd.formacao || [4, 4, 2], { balanco: !!dd.balanco }), 0.35, false);
    s += popPessoa(t, 0.3, 830, 1905, pessoa({ ...PERSONAGENS.tecnico, pose: dd.balanco ? 'comemora' : 'aponta', expr: dd.balanco ? 'feliz' : 'serio' }, t, { s: 1.35, espelho: !dd.balanco }));
    s += pop(t, 0.7, 330, 1560, pilula('PROF. GILBERTO TELES', { tam: 36, bg: CORES.marinho, rot: -3 }));
    if (dd.instagram) s += pop(t, 0.9, 330, 1640, pilula('@' + dd.instagram, { tam: 28, bg: CORES.creme, cor: OUT, py: 8 }));
    return s;
  },
  // piada do dia: posição + apelido + o porquê (jogador nosso, do adversário ou seguidor)
  apelido(t, d, c, E) {
    const dd = c.dados;
    let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E), torcida: E._torcida }), { z0: 1.12, z1: 1.18 });
    let visual;
    if (dd.alvo === 'nosso') visual = jogador(dd.numero, E, { expr: 'feliz' });
    else if (dd.alvo === 'adversario') {
      const [c1, c2] = coresTime(dd.time || '');
      const r = rng('adv' + dd.apelido);
      visual = { pele: PELES[Math.floor(r() * PELES.length)], cabelo: ['curto', 'raspado', 'cacheado', 'careca'][Math.floor(r() * 4)],
        corCabelo: '#2b1d14', camisa: c1, listra: c2, calcao: c2, meiao: c1, numero: dd.numero, bigode: r() > 0.5,
        luvas: dd.posicao === 'goleiro', expr: 'bravo' };
    } else {
      const r = rng('seg' + (dd.instagram || dd.nome));
      visual = { pele: PELES[Math.floor(r() * PELES.length)], cabelo: ['curto', 'cacheado', 'black'][Math.floor(r() * 3)],
        corCabelo: '#2b1d14', camisa: CORES.vinho, listra: CORES.amarelo, calcao: '#fff', numero: dd.numero || '', expr: 'feliz' };
    }
    s += popPessoa(t, 0.2, W / 2, 1960, pessoa(visual, t, { s: 2.1 }));
    const topo = c.texto_tela[0] || (dd.time ? `DE OLHO NO ${dd.time.toUpperCase()}` : '');
    if (topo) s += pop(t, 0.1, W / 2, 300, pilula(topo, { tam: 44, bg: dd.alvo === 'adversario' ? '#495057' : CORES.vinho, rot: -2 }));
    const tApelido = quando(c, (dd.apelido || '').split(' ')[0].toLowerCase(), 1.0);
    const titulo = `${(dd.posicao || '').toUpperCase()} ${(dd.apelido || '').toUpperCase()}`;
    const tam = Math.min(110, 900 / Math.max(1, medir(titulo, 1)));
    s += pop(t, tApelido - 0.1, W / 2, 520, tituloGrande(titulo, { tam, cor: CORES.amarelo, rot: -3 }));
    s += pop(t, tApelido + 0.6, W / 2, 680, pilula(`"${(dd.piada || '').toUpperCase()}"`, { tam: 38, bg: CORES.creme, cor: OUT, rot: 2 }));
    if (dd.instagram) s += pop(t, tApelido + 0.9, W / 2, 790, pilula('@' + dd.instagram, { tam: 30, bg: CORES.marinho, py: 10 }));
    return s;
  },
});

Object.assign(TIPOS, {
  // Peneira do Poeira: "anuncio" (fila de candidatos) e "regras" (como participar)
  peneira(t, d, c, E) {
    const dd = c.dados;
    let s = camera(t, d, campo(E.estrutura, { t, nome: NOME(E), torcida: E._torcida }), { z0: 1.0, z1: 1.06 });
    if (dd.etapa === 'anuncio') {
      s += pop(t, 0.2, W / 2, 470, tituloGrande('PENEIRA', { tam: 180, cor: CORES.amarelo, rot: -4 }));
      s += pop(t, 0.6, W / 2, 620, pilula('DO POEIRA', { tam: 64, bg: CORES.vinho, rot: 2 }));
    s += pop(t, quando(c, 'cinco', 2.5), W / 2, 760, pilula('5 JOGADORES + 1 TÉCNICO', { tam: 44, bg: CORES.marinho, rot: -1 }));
      // fila de candidatos chegando, cada um com uma camisa diferente
      for (let i = 0; i < 7; i++) {
        const r = rng('cand' + i);
        const p = { pele: PELES[Math.floor(r() * PELES.length)], cabelo: ['curto', 'raspado', 'cacheado', 'black', 'careca'][Math.floor(r() * 5)],
          corCabelo: '#2b1d14', camisa: CAMISAS_SORTIDAS[Math.floor(r() * CAMISAS_SORTIDAS.length)], numero: String(Math.floor(r() * 30) + 1),
          expr: ['feliz', 'surpreso', 'serio'][Math.floor(r() * 3)], pose: i % 3 === 0 ? 'acena' : 'normal' };
        s += popPessoa(t, 0.8 + i * 0.18, 100 + i * 147, 1880 + (i % 2) * 40, pessoa(p, t, { s: 0.95, fase: i }));
      }
      return s;
    }
    // regras: fundo escuro (sem letreiros); cada cartão entra quando a narração chega nele
    s = fundoEscuro() + `<g transform="translate(${W / 2} 1500) scale(.9)">${escudoPoeira()}</g>`;
    s += pop(t, 0.05, W / 2, 200, pilula('COMO ENTRAR NO TIME', { tam: 56, bg: CORES.laranja, cor: OUT, rot: -2 }));
    const regras = [['coment', '💬', 'COMENTE SEU NOME', 'E SUA POSIÇÃO (OU TÉCNICO)', '#3a86ff'],
      ['cinco', '❤️', '5 JOGADORES + 1 TÉCNICO', 'OS MAIS CURTIDOS ENTRAM NO POEIRA', '#e63946'],
      ['amigos', '📲', 'MANDA PROS AMIGOS', 'PEDE PRA ELES CURTIREM', '#2e8b57']];
    regras.forEach(([chave, ic, a, b, cor], i) => {
      const t0 = quando(c, chave, 0.6 + i * 2);
      s += pop(t, t0 - 0.15, W / 2, 350 + i * 175, cartao(900, 155, `
        <circle cx="-360" r="56" fill="${cor}" stroke="${OUT}" stroke-width="6"/><text x="-360" y="22" text-anchor="middle" font-size="56">${ic}</text>
        <text x="-270" y="-6" font-family="Anton" font-size="56" fill="${OUT}">${esc(a)}</text>
        <text x="-270" y="48" font-family="Anton" font-size="36" fill="${cor}">${esc(b)}</text>`, { bg: CORES.creme }));
    });
    s += pop(t, quando(c, 'comenta', 1) + 1.2, W / 2, 900, cartaoComentario('voce', 'Zé da Silva, lateral esquerdo', 0, { selo: 'EXEMPLO DE COMENTÁRIO', w: 760 }));
    return s;
  },
});

// contador fixo no canto: a lógica do perfil sempre visível
const SEM_HUD = new Set(['abertura', 'regras', 'evolucao', 'estadio', 'encerramento']);
function hud(c, E) {
  if (SEM_HUD.has(c.tipo) || !c.dados.hud) return '';
  const h = c.dados.hud, y = c.tipo === 'gol' ? 320 : 40;
  const item = (x, ic, txt) => { const w = medir(txt, 34) + 86; return `<g class="ui" transform="translate(${x} ${y})">
    <rect width="${w}" height="58" rx="29" fill="${CORES.marinho}" stroke="${OUT}" stroke-width="4" opacity=".92"/>
    <text x="34" y="42" text-anchor="middle" font-size="30">${ic}</text>
    <text x="62" y="43" font-family="Anton" font-size="34" fill="#fff">${esc(txt)}</text></g>`; };
  const tor = `${Math.round(h.torcida).toLocaleString('pt-BR')}`;
  return item(30, '👥', tor) + item(30 + medir(tor, 34) + 104, '💰', `${E.moeda} ${Math.round(h.caixa).toLocaleString('pt-BR')}`);
}

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
  return `<g class="ui legenda" transform="translate(${W / 2} 1165) scale(${escala * (0.85 + 0.15 * entrada)})">${s}</g>`;
}

function marcaDagua(E) {
  return `<g class="ui" transform="translate(${W - 50} 110)" opacity=".85">
    <text text-anchor="end" font-family="Anton" font-size="30" fill="#fff" stroke="${OUT}" stroke-width="6" paint-order="stroke">${esc(E.clube.instagram)}</text></g>`;
}

// ------------------------------------------------------------ API para o render.mjs
let DADOS = null;
window.preparar = dados => {
  DADOS = dados;
  DADOS.estado._torcida = dados.torcida;
  window._sigla = dados.estado.clube.sigla;
  let t = 0;
  for (const c of DADOS.cenas) { c.inicio = t; t += c.duracao; }
  DADOS.total = t;
  return t;
};

window.quadro = tGlobal => {
  const cenas = DADOS.cenas;
  let i = cenas.findIndex(c => tGlobal < c.inicio + c.duracao);
  if (i < 0) i = cenas.length - 1;
  const c = cenas[i], t = tGlobal - c.inicio;
  let E = c.dados.estrutura ? { ...DADOS.estado, estrutura: c.dados.estrutura } : DADOS.estado;
  // jogo fora: campo, muro e torcida do dono da casa (a nossa estrutura fica no Campo do Poeira)
  window._local = c.dados.local || null;
  if (window._local) E = { ...E, _torcida: window._local.torcida ?? 300,
    estrutura: { ...E.estrutura, gramado: 'terrão', capacidade: 500, rede: true, iluminacao: false } };
  const fn = TIPOS[c.tipo] || TIPOS.abertura;
  let svg = fn(t, c.duracao, c, E);
  if (window.ESTILO3D) svg = cena3d(svg);  // volume, luz e contorno suave (arte3d.js)
  svg += marcaDagua(E) + hud(c, E) + legenda(t, c);
  // corte com "flash" curto entre cenas
  if (t < 0.12 && i > 0) svg += `<rect width="${W}" height="${H}" fill="#fff" opacity="${(0.12 - t) / 0.12 * 0.5}"/>`;
  document.getElementById('palco').innerHTML = svg;
};
