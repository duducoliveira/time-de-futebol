// Régua: mede cada objeto do mundo (em s = 1) e compara com a medida real, na escala PX_M (px por metro).
// Como no detetive: tudo em metros. node video/regua.mjs [saida.png]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(path.join(aqui, 'palco.html')).href);
const res = await page.evaluate(() => {
  const E = { clube: { nome: 'Poeira FC' }, elenco: {}, estrutura: {} };
  const itens = MEDIDAS_REAIS(E);
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('width', 3000); svg.setAttribute('height', 3000);
  document.body.appendChild(svg);
  return itens.map(([nome, real, eixo, desenho]) => {
    const g = document.createElementNS(ns, 'g'); g.innerHTML = desenho; svg.appendChild(g);
    const b = g.getBBox(); g.remove();
    const px = eixo === 'w' ? b.width : b.height, m = px / PX_M;
    return { nome, real, medido: +m.toFixed(2), erro: +((m / real - 1) * 100).toFixed(0) };
  });
});
let ruim = 0;
for (const r of res) { const ok = Math.abs(r.erro) <= 15; if (!ok) ruim++;
  console.log(`${ok ? 'ok ' : 'XX '} ${r.nome.padEnd(28)} real ${String(r.real).padStart(5)} m  desenho ${String(r.medido).padStart(5)} m  (${r.erro > 0 ? '+' : ''}${r.erro}%)`); }
console.log(ruim ? `régua: ${ruim} fora da escala (±15%)` : 'régua ok');
await browser.close();
process.exit(ruim ? 1 : 0);
