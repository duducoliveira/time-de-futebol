// ============================================================ lances.js
// Motor de lances na câmera de TV (mundo.js). Cada gol é uma coreografia: atores com trajetória por
// chaves de tempo, a bola com altura, o goleiro que pula, e a comemoração no fim — a câmera acompanha a
// bola e, quando ela entra, aproxima no autor (sem replay: o gol já foi visto entrando).
// Tipos: toque, drible, cabeca, falta, penalti, longe, contra. Os tempos vêm das palavras da narração.
// Comemorações: canto, carrinho, aviao, monte.

// n-ésima palavra que começa com `ini` (ou `padrao`)
function quandoN(c, ini, n = 0, padrao = 0) {
  const ws = (c.palavras || []).filter(w => w.texto.toLowerCase().replace(/[^a-zà-ú]/g, '').startsWith(ini));
  return (ws[n] || ws[ws.length - 1] || { t0: padrao }).t0;
}
// trajetória por chaves [t, x, y, h]: interpolação suave entre chaves
function trajeto(pts, t) {
  if (t <= pts[0][0]) return pts[0].slice(1);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (t <= b[0]) { const k = (t - a[0]) / Math.max(0.001, b[0] - a[0]), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      return [a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e, (a[3] || 0) + ((b[3] || 0) - (a[3] || 0)) * e]; }
  }
  return pts[pts.length - 1].slice(1);
}
// bola em voo: reta no chão + parábola na altura
function voo(t, t0, t1, de, para, alto = 0) {
  const k = clamp((t - t0) / Math.max(0.01, t1 - t0));
  return [de[0] + (para[0] - de[0]) * k, de[1] + (para[1] - de[1]) * k, (de[2] || 0) + ((para[2] || 0) - (de[2] || 0)) * k + Math.sin(k * Math.PI) * alto];
}

// tempos do lance a partir da narração
function temposLance(c) {
  const tipo = c.dados.lance_tipo || 'toque';
  const T = { tipo };
  const bateu = quandoN(c, 'bateu', 0, 2.4);
  if (tipo === 'drible') { T.a = quandoN(c, 'passou', 0, 1.0); T.b = quandoN(c, 'passou', 1, T.a + 0.8); T.chute = Math.max(T.b + 0.5, bateu); }
  else if (tipo === 'cabeca') { T.a = Math.max(0.9, quandoN(c, 'cruz', 0, 0) + 0.9); T.chute = Math.max(T.a + 1.0, quandoN(c, 'cabe', 0, T.a + 1.4) - 0.15); }
  else if (tipo === 'contra') { T.a = Math.max(0.9, quandoN(c, 'cruz', 0, 0) + 0.9); T.chute = Math.max(T.a + 1.0, quandoN(c, 'cortar', 0, T.a + 1.4)); }
  else if (tipo === 'falta') { T.a = quandoN(c, 'ajeit', 0, 1.2); T.chute = Math.max(T.a + 0.8, bateu); }
  else if (tipo === 'penalti') { T.a = quandoN(c, 'corr', 0, 1.2); T.chute = Math.max(T.a + 0.6, bateu); }
  else if (tipo === 'longe') { T.a = quandoN(c, 'arrisc', 0, 0.8); T.chute = Math.max(T.a + 0.9, bateu); }
  else { T.a = quandoN(c, 'toc', 0, 1.0); T.chute = Math.max(T.a + 0.8, bateu); }
  T.entra = T.chute + (tipo === 'longe' || tipo === 'falta' ? 0.75 : tipo === 'penalti' ? 0.4 : 0.5);
  return T;
}

// Coreografia: devolve atores (visual + trajeto + pose por tempo), a bola e o goleiro, em coordenadas do campo
// (x ao longo do campo; y = profundidade na tela). dir = +1: ataque para a direita (gol em x = TV.L).
// Tudo em METROS a partir da linha do gol (at(d)), como num campo de verdade: pênalti a 11 m, barreira a 9,15 m,
// falta da entrada da área a 18 m, chute de longe a 22 m. Alturas da bola (h) em px de s = 1 (m(1) = 1 metro).
function coreografia(E, dd, T) {
  const nosso = !!dd.nosso, adv = dd.mandante === E.clube.nome ? dd.visitante : dd.mandante;
  const dir = nosso ? 1 : -1, golX = dir > 0 ? TV.L : 0, at = d => golX - dir * tvM(d);
  const yG = TV.yMeio, frente = dir * tvM(0.3);              // a bola corre 30 cm à frente do pé
  const vAt = n => nosso ? jogador(n, E) : visAdv(adv, n), vDf = n => nosso ? visAdv(adv, n) : jogador(n, E);
  const autor = vAt(nosso ? (dd.autor_numero || '9') : 9), pas = vAt(nosso ? (dd.passador_numero || '10') : 10);
  const tp = T.tipo, A = [], ent = T.entra;
  const canto = dd.minuto % 2 ? -1 : 1;                       // canto do gol: −1 = poste de lá, +1 = poste de cá
  let bola, alvo = [at(-0.6), yG + canto * 2.6 * TV.P, m(0.5)];   // onde a bola morre dentro do gol
  const corre = (pts, vis, extra = {}) => A.push({ vis, pts, ...extra });
  const conduz = (ator, dy = 6) => t => (([x, y]) => [x + frente, y + dy, 0])(trajeto(ator.pts, t));
  const fim = (d, y = tvD(14)) => [ent + 1.2, at(d), y];      // depois do gol o autor corre para a câmera
  if (tp === 'drible') {
    corre([[0, at(21), tvD(4)], [T.a, at(16), tvD(2)], [T.b, at(12), tvD(-1)], [T.chute, at(9.5), tvD(-1.5)], fim(4)], autor, { autor: true });
    corre([[0, at(14.5), tvD(-1)], [T.a - 0.15, at(15.5), tvD(1)], [T.a + 0.3, at(15.8), tvD(5)]], vDf(4), { cai: T.a + 0.1 });
    corre([[0, at(10.5), tvD(-3)], [T.b - 0.15, at(11.6), tvD(-2)], [T.b + 0.3, at(12), tvD(-7)]], vDf(3), { cai: T.b + 0.1 });
    const c0 = conduz(A[0]);
    bola = t => t < T.chute ? (([x, y]) => [x, y, Math.abs(Math.sin(t * 9)) * m(0.08)])(c0(t)) : voo(t, T.chute, ent, c0(T.chute), alvo, m(0.3));
  } else if (tp === 'cabeca' || tp === 'contra') {
    // cruzamento da linha de fundo, do lado de lá; a bola encontra a cabeça na marca do pênalti (ou o zagueiro, no gol contra)
    corre([[0, at(14), tvD(-24)], [T.a, at(4), tvD(-25)], [ent + 2, at(3.5), tvD(-25)]], pas);
    const ponto = tp === 'cabeca' ? [at(8), tvD(-0.5)] : [at(4.5), tvD(-1.5)], hc = m(1.75 + 0.35);
    if (tp === 'cabeca') corre([[0, at(16), tvD(6)], [T.a, at(11), tvD(3)], [T.chute, ponto[0], ponto[1] + 4], fim(5)], autor, { autor: true, pulo: [T.chute - 0.25, T.chute + 0.25] });
    else corre([[0, at(15), tvD(6)], [T.chute, at(6.5), tvD(2)], [ent + 0.6, at(7.5), tvD(4)], [ent + 2.8, at(10), tvD(13)]], autor, { festeiro: true });   // no gol contra, quem comemora é o nosso atacante
    corre([[0, at(6), tvD(-6)], [T.chute, tp === 'contra' ? ponto[0] : at(7), (tp === 'contra' ? ponto[1] : tvD(-1.5)) - 2]], vDf(3),
      tp === 'contra' ? { autor: true, contra: true, pulo: [T.chute - 0.2, T.chute + 0.2] } : { pulo: [T.chute - 0.2, T.chute + 0.2] });
    const c0 = conduz(A[0], 0);
    bola = t => t < T.a ? c0(t) : t < T.chute ? voo(t, T.a, T.chute, [at(4) - frente, tvD(-25), 0], [ponto[0], ponto[1], hc], m(2.4))
      : voo(t, T.chute, ent, [ponto[0], ponto[1], hc], alvo, m(0.2));
  } else if (tp === 'falta') {
    // bola parada na entrada da área (18 m); barreira a 9,15 m da bola; cobrança no ângulo, por cima da barreira
    const xb = 18, xw = xb - 9.15;
    for (let i = 0; i < 4; i++) corre([[0, at(xw) + dir * (i % 2 ? 16 : -6), tvD(-1.6 + i * 0.75)], [ent + 1, at(xw) + dir * (i % 2 ? 16 : -6), tvD(-1.6 + i * 0.75)]], vDf(2 + i), { pulo: [T.chute, T.chute + 0.4], barreira: true });
    corre([[0, at(xb + 3), tvD(4)], [T.a, at(xb + 3), tvD(4)], [T.chute, at(xb + 0.6), tvD(0.6)], fim(xb - 1)], autor, { autor: true });
    alvo = [at(-0.4), TV.gol[0] + 1.0 * TV.P, m(2.2)];
    bola = t => t < T.chute ? [at(xb), tvD(0), 0] : voo(t, T.chute, ent, [at(xb), tvD(0), 0], alvo, m(1.6));
  } else if (tp === 'penalti') {
    corre([[0, at(14), tvD(2.5)], [T.a, at(14), tvD(2.5)], [T.chute, at(11.6), tvD(0.4)], fim(6)], autor, { autor: true });
    bola = t => t < T.chute ? [at(11), yG, 0] : voo(t, T.chute, ent, [at(11), yG, 0], alvo, m(0.3));
    for (let i = 0; i < 3; i++) corre([[0, at(18 + i * 1.5), tvD(-8 + i * 7)]], vDf(3 + i));          // os outros fora da área
    corre([[0, at(18.5), tvD(3)]], pas);
  } else if (tp === 'longe') {
    corre([[0, at(29), tvD(6)], [T.a, at(25), tvD(4)], [T.chute, at(22.5), tvD(3)], fim(10)], autor, { autor: true });
    corre([[0, at(16), tvD(-2)], [T.chute, at(19.5), tvD(1)]], vDf(4));
    const c0 = conduz(A[0]);
    alvo = [alvo[0], alvo[1], m(1.6)];
    bola = t => t < T.chute ? c0(t) : voo(t, T.chute, ent, c0(T.chute), alvo, m(1.4));
  } else {   // toque: o passe na frente da área e a finalização da marca do pênalti
    corre([[0, at(30), tvD(12)], [T.a, at(21), tvD(10)], [ent + 2, at(19), tvD(10)]], pas);
    corre([[0, at(27), tvD(-4)], [T.a + 0.4, at(16), tvD(-2)], [T.chute, at(11.5), tvD(-1)], fim(4)], autor, { autor: true });
    corre([[0, at(17), tvD(3)], [T.chute, at(12.5), tvD(1.5)]], vDf(4));
    corre([[0, at(14), tvD(-9)], [T.chute, at(10), tvD(-6)]], vDf(3));
    const c0 = conduz(A[0]), c1 = conduz(A[1]), tp2 = T.a + 0.5;
    bola = t => t < T.a ? c0(t) : t < tp2 ? voo(t, T.a, tp2, c0(T.a), c1(tp2), m(0.15))
      : t < T.chute ? c1(t) : voo(t, T.chute, ent, c1(T.chute), alvo, m(0.4));
  }
  // figurantes: os outros jogadores dos dois times espalhados pelo campo, acompanhando a jogada de longe
  // (um campo de verdade nunca tem só 3 pessoas). Andam um pouco na direção da bola.
  // números nunca repetem: nem com quem já está no lance, nem entre os figurantes
  const usados = new Set(['1', ...A.map(a => String(a.vis.numero))]);
  const nossos = ['2', '4', '5', '6', '8', '11', '3', '16', '15', '19'].filter(n => !usados.has(n) && E.elenco[n]);
  const deles = ['2', '3', '4', '5', '6', '7', '8', '11', '13', '14', '16'].filter(n => !usados.has(n));
  let iN = 0, iD = 0;
  const outro = time => time === 'nosso' ? (nossos[iN++ % Math.max(1, nossos.length)] || '14') : deles[iD++ % deles.length];
  const pos = { toque: [[8, -11, 0], [19, 15, 1], [24, -12, 1], [14, 17, 0], [34, 2, 1], [6, 7, 0]],
    drible: [[7, 8, 0], [24, -10, 1], [17, 16, 0], [29, 6, 1], [5, -9, 0], [33, -14, 1]],
    cabeca: [[9, 6, 0], [12, 12, 1], [17, -4, 1], [22, 9, 0], [6, 10, 0], [28, -8, 1]],
    contra: [[9, 6, 0], [12, 12, 1], [17, -4, 1], [22, 9, 0], [8, 11, 0], [28, -8, 1]],
    falta: [[6, -6, 0], [6, 4, 1], [8, 8, 0], [5, -10, 1], [26, -9, 1], [12, 12, 0]],
    penalti: [[13, -22, 0], [15, 22, 1], [11, -23, 1], [9, 22, 0], [17, -21.5, 1], [12, 24, 0]],   // fora da área (dos lados) e fora da meia-lua
    longe: [[12, -6, 0], [9, 7, 1], [14, 11, 0], [6, -2, 0], [30, -9, 1], [17, -13, 1]] }[tp] || [];
  pos.forEach(([d, p, df], i) => {
    const doNosso = df ? !nosso : nosso, num = outro(doNosso ? 'nosso' : 'deles');
    const vis = doNosso ? jogador(num, E) : visAdv(adv, num);
    const x0 = at(d), y0 = tvD(p), parado = tp === 'penalti' || tp === 'falta';
    const x1 = parado ? x0 + dir * tvM(0.6) : at(Math.max(4, d * 0.75)), y1 = parado ? y0 : tvD(p * 0.8);
    corre([[0, x0, y0], [ent, x0 + (x1 - x0) * 0.8, y0 + (y1 - y0) * 0.8]], vis, { figurante: true, devagar: parado, df: !!df });
  });
  // depois do gol: quem defende volta andando para o meio; o time que marcou comemora de onde está (braços para
  // cima, sem atravessar por trás do autor) — a comemoração não vira um bolo na frente da câmera
  { const autorA = A.find(a => a.autor) || A[0], [, fx, fy] = autorA.pts[autorA.pts.length - 1];
    A.filter(a => a.figurante).forEach(a => { const [, x, y] = a.pts[a.pts.length - 1];
      if (!a.df) { a.festa = true; a.pts.push([ent + 2, x + Math.sign(fx - x) * tvM(1), y]); }                  // o time que fez comemora onde está
      else a.pts.push([ent + 3, x - dir * tvM(6), y]);                                                        // a outra equipe volta pro meio
      a.devagar = false; }); }
  // goleiro: no meio do gol, 0,5 m à frente da linha; pula para o lado errado (no pênalti, bem na hora do chute)
  const ladoErrado = alvo[1] > yG ? -1 : 1;
  const goleiro = { vis: nosso ? visAdv(adv, 1, { luvas: true, camisa: '#495057', listra: null }) : jogador('1', E), x: at(0.5), y: yG, dir, salta: T.chute + (tp === 'penalti' ? 0 : tp === 'contra' ? 0.25 : 0.12), lado: ladoErrado };
  // no close da comemoração ninguém fica colado no autor: quem terminaria a menos de 2,6 m dele se afasta para o lado
  { const autorA = A.find(a => a.autor) || A[0], fx = autorA.pts[autorA.pts.length - 1][1], folga = tvM(2.6);
    A.forEach(a => { if (a === autorA || a.festeiro) return; const ult = a.pts[a.pts.length - 1];
      if (Math.abs(ult[1] - fx) >= folga) return;
      const nx = fx + (Math.sign(ult[1] - fx) || 1) * folga;
      if (ult[0] > ent) ult[1] = nx; else a.pts.push([ent + 1.6, nx, ult[2]]); }); }
  // figurante nunca fica "em cima" de outro: se dois terminam (ou começam) quase no mesmo x e perto na profundidade,
  // o figurante anda para o lado (1,3 m, alternando os lados) até ficar livre
  for (const qual of [0, -1]) A.forEach((a, i) => {
    if (!a.figurante) return;
    const u = qual === 0 ? a.pts[0] : a.pts[a.pts.length - 1], x0 = u[1];
    for (const passo of [0, 1, -1, 2, -2, 3, -3]) {
      u[1] = x0 + passo * tvM(1.3);
      const choca = A.some((b, j) => { if (j === i) return false; const v = qual === 0 ? b.pts[0] : b.pts[b.pts.length - 1];
        return Math.abs(v[1] - u[1]) < tvM(1.0) && Math.abs(v[2] - u[2]) < 9 * TV.P; });
      if (!choca) break;
    }
  });
  return { A, bola, goleiro, golX, dir, at, alvo, nosso, adv };
}

// Enquadramento de TV: centro entre a bola e o gol, com o zoom que faz os dois caberem. Se a bola está longe demais
// (falta, chute de longe), o zoom não abre além de 0,36 — a bola fica no quadro com o gol à frente, e a câmera
// acompanha o voo até a rede. Devolve [x do centro (mundo), zoom].
function quadroTV(bx, C) {
  const rede = C.dir * m(1.2) * tvK(TV.yMeio), d = Math.abs(C.golX + rede - bx);
  const zFit = 0.92 * W / (d + 170), z = clamp(zFit, 0.36, 1.45);
  if (zFit >= 0.36) return [(bx + C.golX + rede) / 2, z];
  return [bx + C.dir * (W / 2 / z - 150 / z), z];
}
const mixLog = (a, b, k) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * k);

// Desenha o lance no instante t (câmera inclusa). Devolve o SVG.
function lanceGolV2(t, E, c) {
  const dd = c.dados, T = temposLance(c), C = coreografia(E, dd, T);
  const ent = T.entra, [bx, by, bh] = C.bola(t);
  const aut = C.A.find(a => a.autor) || C.A[0];
  const tipoCom = dd.comemoracao || 'canto';
  const fimAut = aut.pts[aut.pts.length - 1];
  const pc = clamp((t - ent) / 1.2);
  const fest = aut.contra ? C.A.find(a => a.festeiro) : null;      // gol contra: a câmera vai do zagueiro para quem comemora
  const eio = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  // companheiros: os dois figurantes do time que marcou mais perto do herói (gente que já estava em campo, sem
  // número repetido). No "monte" chegam logo e abraçam; nas outras comemorações chegam depois e festejam ao lado.
  const heroi = fest || (aut.contra ? null : aut), monte = (dd.comemoracao || 'canto') === 'monte';
  const fimH = heroi ? heroi.pts[heroi.pts.length - 1] : null;
  const comp = heroi ? C.A.filter(a => a.festa).sort((a, b) => Math.abs(a.pts.at(-1)[1] - fimH[1]) - Math.abs(b.pts.at(-1)[1] - fimH[1])).slice(0, 2) : [];
  const tHeroi = ent + (fest ? 2.2 : 0) + (monte ? 0.4 : 2.2), perto = monte ? tvM(0.5) : tvM(1.1);
  // cada companheiro fica do lado de onde vem (ninguém atravessa na frente do herói); dois do mesmo lado → um mais longe
  const vaga = comp.map((a, i) => { const lado = Math.sign(trajeto(a.pts, tHeroi + i * 0.3)[0] - trajeto(heroi.pts, tHeroi)[0]) || (i ? -1 : 1); return lado; });
  if (vaga.length === 2 && vaga[0] === vaga[1]) { const d0 = Math.abs(trajeto(comp[0].pts, tHeroi)[0] - fimH[1]), d1 = Math.abs(trajeto(comp[1].pts, tHeroi)[0] - fimH[1]); vaga[d0 < d1 ? 1 : 0] *= 2; }
  // câmera: acompanha a jogada e o voo da bola (média de quatro instantes = movimento liso, como uma câmera
  // operada); depois do gol aproxima no autor (zoom em escala log).
  const foco = tt => { const b = C.bola(tt)[0]; if (tt >= T.chute) return b; const a = trajeto(aut.pts, tt)[0] - C.dir * tvM(1.2); return C.dir > 0 ? Math.min(b, a) : Math.max(b, a); };
  const segue = tt => { const q = [0, 0.12, 0.24, 0.36].map(dt => quadroTV(foco(Math.max(0, tt - dt)), C)); return [q.reduce((a, v) => a + v[0], 0) / 4, mixLog(Math.min(...q.map(v => v[1])), Math.max(...q.map(v => v[1])), 0.5)]; };
  let [cam, z] = segue(t), yW = TV.yMeio - 3 * TV.P, yS = 1440;
  if (t > ent + 0.2) {
    const [c0, z0] = segue(ent), k = easeOut(clamp((t - ent - 0.2) / 1.4));
    let [ax, ay] = trajeto(aut.pts, t);
    if (fest) { const k2 = eio(clamp((t - ent - 1.9) / 1.1)), [fx, fy] = trajeto(fest.pts, t); ax += (fx - ax) * k2; ay += (fy - ay) * k2; }
    cam = c0 + (ax - c0) * k; z = mixLog(z0, 2.2, k);
    const yW0 = TV.yMeio - 3 * TV.P;
    yW = yW0 + (ay - m(0.85) * tvK(ay) - yW0) * k;   // centro do corpo de quem a câmera segue
    yS = 1440 + (1490 - 1440) * k;
    // close longo (a narração ainda continua): os companheiros chegam e a câmera abre um pouco para pegar todo mundo
    const tOut = ent + (fest ? 4.2 : 3.0);
    if (c.duracao - tOut > 2.0) { const k3 = eio(clamp((t - tOut) / 2.4)); z = mixLog(z, 1.45, k3) * (1 + 0.02 * Math.max(0, t - tOut - 2.4)); yS += (1530 - yS) * k3; }
  }
  // fundo (céu + bairro) na tela, alinhado ao topo do muro
  let s = tvFundo(t, cam, z, yS + (792 - yW) * z);
  let mundo = tvCenario(E.estrutura, cam, t, { torcida: E._torcida, nome: E.clube.nome, fundo: false });
  const camadas = [];
  // goleiro (o mergulho é de ~2 m para o lado)
  const g = C.goleiro, kg = easeOut(clamp((t - g.salta) / 0.35));
  const gy = g.y + g.lado * 2 * TV.P * kg, gx = g.x;
  camadas.push([gy, () => { const [sx, sy] = tvP(gx, gy, cam, Math.sin(kg * Math.PI) * m(0.4)); return `<g transform="translate(${sx} ${sy}) rotate(${-g.dir * g.lado * 75 * kg})">${pessoa({ ...g.vis, pose: 'comemora', expr: 'surpreso' }, t, { s: tvK(gy) }).replace(/class="rosto" /g, '')}</g>`; }]);
  // atores
  C.A.forEach((a, i) => {
    let [x, y] = trajeto(a.pts, t);
    const ic = comp.indexOf(a);
    if (ic >= 0 && t > tHeroi + ic * 0.3) {
      // primeiro alinham na profundidade do herói, depois chegam de lado (não passam por trás da cabeça dele)
      const r = clamp((t - tHeroi - ic * 0.3) / 1.4), qy = easeOut(clamp(r * 2)), qx = easeOut(clamp(r * 1.4 - 0.3)), [hx, hy] = trajeto(heroi.pts, t);
      x += (hx + vaga[ic] * perto - x) * qx; y += (hy + (monte ? (ic ? 6 : -4) : 0) - y) * qy;
    }
    const pulo = a.pulo && t > a.pulo[0] && t < a.pulo[1] ? Math.sin((t - a.pulo[0]) / (a.pulo[1] - a.pulo[0]) * Math.PI) * m(0.4) : 0;
    const caiu = a.cai && t > a.cai;
    let pose = null, rot = 0;
    if (a === aut && a.contra && t > ent) pose = 'normal';
    else if ((a === aut || a === fest) && t > ent + (a === fest ? 0.3 : 0)) {
      if (tipoCom === 'aviao') pose = 'aviao';
      else if (tipoCom === 'carrinho' && pc > 0.6) { pose = 'comemora'; rot = -C.dir * 18; }
      else pose = 'comemora';
    } else if (pulo || (a.festa && t > ent + 0.3)) pose = 'comemora';
    else if (caiu) { pose = 'normal'; rot = C.dir * 70 * clamp((t - a.cai) / 0.3); }
    else if (Math.abs(t - T.chute) < 0.22 && a === aut) pose = 'chute';
    // parado quando a trajetória não anda (barreira, quem espera o pênalti)
    const [x2, y2] = trajeto(a.pts, t + 0.05), anda = Math.hypot(x2 - x, y2 - y) > 1.5;
    const correndo = !pose && anda && !a.barreira && !(a.figurante && a.devagar);
    const vis = a.contra && t > ent ? { ...a.vis, expr: 'triste' } : a.vis;
    camadas.push([y, () => {
      const [sx, sy] = tvP(x, y, cam, pulo + (tipoCom === 'carrinho' && (a === aut || a === fest) && t > ent ? -10 : 0));
      if (sx < TV_X0 || sx > TV_X1) return '';
      const passo = correndo ? (Math.floor(t * (a.figurante ? 4 : 7) + i) % 2 ? 'chute' : 'normal') : pose;
      return `<g transform="translate(${sx} ${sy}) rotate(${rot})">${pessoa({ ...vis, pose: passo }, t, { s: tvK(y), fase: i, espelho: C.dir < 0 }).replace(/class="rosto" /g, '')}</g>`;
    }]);
  });
  // monte: depois do gol, dois companheiros correm e abraçam o autor
  camadas.push([by, () => tvBola(bx, by, cam, bh)]);
  camadas.sort((a, b) => a[0] - b[0]);
  // a trave entra na ordem de profundidade: poste de lá atrás de quem está na frente dele
  const trave = tvTrave(C.golX, cam, C.dir, t, { balanco: t > ent ? Math.max(0, 1 - (t - ent) * 2) * Math.sin((t - ent) * 30) : 0 });
  mundo += trave + camadas.map(k => k[1]()).join('');
  mundo += tvLateralLeste(E.estrutura, cam, t);
  s += `<g transform="translate(${W / 2} ${yS.toFixed(1)}) scale(${z.toFixed(4)}) translate(${-W / 2} ${(-yW).toFixed(1)})">${mundo}</g>`;
  return { svg: s, T, C };
}

Object.assign(window, { quandoN, trajeto, temposLance, coreografia, lanceGolV2, quadroTV });
