// Folha de contato: alguns quadros de cada cena lado a lado, para revisar enquadramento e movimento.
// node video/folha.mjs render.json saida.png [--cenas 05-obra,09-gol] [--quadros 4] [--largura 270] [--lance]
// --lance: nos gols, os quadros são os instantes do lance (início, passe, chute, bola no ar, bola entrando, comemoração)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const [entrada, saida, ...resto] = process.argv.slice(2);
const opc = (n, pad) => { const i = resto.indexOf(n); return i >= 0 ? resto[i + 1] : pad; };
const filtro = opc('--cenas', '').split(',').filter(Boolean);
const nq0 = Number(opc('--quadros', 4)), larg = Number(opc('--largura', 270)), modoLance = resto.includes('--lance');
const dados = JSON.parse(readFileSync(entrada, 'utf-8'));
const aqui = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(aqui, 'palco.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => Promise.all([...document.fonts].map(f => f.load())));
await page.evaluate(d => window.preparar(d), dados);
const cenas = (await page.evaluate(() => DADOS.cenas.map(c => ({ id: c.id, inicio: c.inicio, duracao: c.duracao }))))
  .filter(c => !filtro.length || filtro.some(f => c.id.includes(f)));

// cada linha = uma cena; cada coluna = um instante (10%, 40%, 70%, 95% da cena) ou, com --lance, os instantes do gol
const fracoes = n => Array.from({ length: n }, (_, i) => n === 1 ? 0.6 : 0.1 + i * (0.85 / (n - 1)));
const imgs = [], rotulos = [];
let nq = modoLance ? 6 : nq0;
for (const c of cenas) {
  let ts = fracoes(nq).map(f => c.inicio + c.duracao * f);
  if (modoLance) {
    const T = await page.evaluate(id => { const c = DADOS.cenas.find(x => x.id === id); return c.tipo !== 'gol' || c.dados.nosso == null ? null : temposLance(c); }, c.id);
    if (T) ts = [0.05, T.a, T.chute - 0.05, (T.chute + T.entra) / 2, T.entra - 0.02, T.entra + 1.0].map(x => c.inicio + Math.min(c.duracao - 0.05, x));
  }
  for (const t of ts) {
    await page.evaluate(t => window.quadro(t), t);
    imgs.push((await page.screenshot({ type: 'jpeg', quality: 70 })).toString('base64'));
    rotulos.push((t - c.inicio).toFixed(2));
  }
}
const fr = Array.from({ length: nq });
const alt = Math.round(larg * 16 / 9);
const html = `<html><body style="margin:0;background:#222;font:14px sans-serif;color:#fff">
  ${cenas.map((c, i) => `<div style="display:flex;align-items:center;gap:4px;margin:4px">
    <div style="width:90px">${c.id}<br>${c.duracao.toFixed(1)}s</div>
    ${fr.map((f, j) => `<div style="position:relative"><img src="data:image/jpeg;base64,${imgs[i * nq + j]}" width="${larg}" height="${alt}"><span style="position:absolute;left:2px;bottom:2px;background:#000a;padding:1px 3px;font-size:11px">${rotulos[i * nq + j]}s</span></div>`).join('')}</div>`).join('')}</body></html>`;
const p2 = await browser.newPage({ viewport: { width: 100 + nq * (larg + 4), height: 100 } });
await p2.setContent(html);
await p2.screenshot({ path: saida, fullPage: true });
console.log(`folha: ${cenas.length} cenas × ${nq} quadros → ${saida}`);
await browser.close();
