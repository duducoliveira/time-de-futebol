// Folha de contato: alguns quadros de cada cena lado a lado, para revisar enquadramento e movimento.
// node video/folha.mjs render.json saida.png [--cenas 05-obra,09-gol] [--quadros 4] [--largura 270]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const [entrada, saida, ...resto] = process.argv.slice(2);
const opc = (n, pad) => { const i = resto.indexOf(n); return i >= 0 ? resto[i + 1] : pad; };
const filtro = opc('--cenas', '').split(',').filter(Boolean);
const nq = Number(opc('--quadros', 4)), larg = Number(opc('--largura', 270));
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

// cada linha = uma cena; cada coluna = um instante (10%, 40%, 70%, 95% da cena)
const fr = Array.from({ length: nq }, (_, i) => nq === 1 ? 0.6 : 0.1 + i * (0.85 / (nq - 1)));
const imgs = [];
for (const c of cenas) for (const f of fr) {
  await page.evaluate(t => window.quadro(t), c.inicio + c.duracao * f);
  imgs.push((await page.screenshot({ type: 'jpeg', quality: 70 })).toString('base64'));
}
const alt = Math.round(larg * 16 / 9);
const html = `<html><body style="margin:0;background:#222;font:14px sans-serif;color:#fff">
  ${cenas.map((c, i) => `<div style="display:flex;align-items:center;gap:4px;margin:4px">
    <div style="width:90px">${c.id}<br>${c.duracao.toFixed(1)}s</div>
    ${fr.map((f, j) => `<img src="data:image/jpeg;base64,${imgs[i * nq + j]}" width="${larg}" height="${alt}">`).join('')}</div>`).join('')}</body></html>`;
const p2 = await browser.newPage({ viewport: { width: 100 + nq * (larg + 4), height: 100 } });
await p2.setContent(html);
await p2.screenshot({ path: saida, fullPage: true });
console.log(`folha: ${cenas.length} cenas × ${nq} quadros → ${saida}`);
await browser.close();
