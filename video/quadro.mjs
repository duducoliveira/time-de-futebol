// Um quadro em tamanho real: node video/quadro.mjs render.json saida.png <segundos do vídeo> [largura]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const [entrada, saida, seg, larg = '540'] = process.argv.slice(2);
const aqui = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: Number(larg) / 1080 });
await page.goto(pathToFileURL(path.join(aqui, 'palco.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(d => window.preparar(d), JSON.parse(readFileSync(entrada, 'utf-8')));
await page.evaluate(t => window.quadro(t), Number(seg));
await page.screenshot({ path: saida });
await browser.close();
