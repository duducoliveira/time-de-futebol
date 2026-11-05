// Gera a foto de perfil do Instagram: node video/logo.mjs pasta_saida
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const saida = process.argv[2] || 'entregas/logo';
mkdirSync(saida, { recursive: true });
const aqui = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
await page.goto(pathToFileURL(path.join(aqui, 'palco.html')).href);
await page.evaluate(() => Promise.all([...document.fonts].map(f => f.load())));

const variantes = {
  // fundo de terra com poeira: o escudo ocupa ~80% do círculo do Instagram
  'perfil-terra': () => `<defs><radialGradient id="gf" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#e0a46a"/><stop offset="1" stop-color="#a8572a"/></radialGradient></defs>
    <rect width="1080" height="1080" fill="url(#gf)"/>
    ${[[160, 820, 130], [930, 860, 150], [540, 990, 190], [80, 600, 70], [1010, 620, 80]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f1dcb8" opacity=".35"/>`).join('')}
    <g transform="translate(540 560) scale(1.72)">${escudoPoeira()}</g>`,
  'perfil-creme': () => `<rect width="1080" height="1080" fill="${CORES.creme}"/>
    <g transform="translate(540 560) scale(1.72)">${escudoPoeira()}</g>`,
  'escudo-transparente': () => `<g transform="translate(540 550) scale(1.9)">${escudoPoeira()}</g>`,
};
for (const [nome, fn] of Object.entries(variantes)) {
  await page.evaluate(svg => {
    const el = document.getElementById('palco');
    el.setAttribute('width', 1080); el.setAttribute('height', 1080); el.setAttribute('viewBox', '0 0 1080 1080');
    el.innerHTML = svg; document.body.style.background = 'transparent';
  }, await page.evaluate(`(${fn.toString()})()`));
  await page.screenshot({ path: `${saida}/${nome}.png`, omitBackground: nome.includes('transparente'), clip: { x: 0, y: 0, width: 1080, height: 1080 } });
}
// simulação de como aparece no perfil (círculo pequeno)
await page.setViewportSize({ width: 900, height: 360 });
await page.setContent(`<html><body style="margin:0;background:#fff;font-family:Arial;display:flex;gap:40px;align-items:center;padding:40px">
  ${['perfil-terra', 'perfil-creme'].map(n => `<div style="text-align:center"><img src="${pathToFileURL(path.resolve(saida, n + '.png')).href}" style="width:150px;height:150px;border-radius:50%;border:1px solid #ddd"><div style="font-size:13px;margin-top:6px">${n} (150 px)</div></div>
  <div style="text-align:center"><img src="${pathToFileURL(path.resolve(saida, n + '.png')).href}" style="width:56px;height:56px;border-radius:50%;border:1px solid #ddd"><div style="font-size:13px;margin-top:6px">56 px</div></div>`).join('')}
</body></html>`);
await page.waitForTimeout(300);
await page.screenshot({ path: `${saida}/simulacao-perfil.png` });
await browser.close();
console.log('ok', saida);
