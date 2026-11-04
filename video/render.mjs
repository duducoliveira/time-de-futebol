// Renderiza um episódio: node video/render.mjs entrada.json saida.mp4 [--preview]
// entrada.json: { cenas:[{tipo,dados,texto_tela,palavras,duracao}], estado, torcida, audio }
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');  // playwright global (NODE_PATH)
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const [entrada, saida, ...flags] = process.argv.slice(2);
const preview = flags.includes('--preview');      // só alguns quadros PNG, para checagem
const FPS = Number(process.env.FPS || 30);
const dados = JSON.parse(readFileSync(entrada, 'utf-8'));
const aqui = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(aqui, 'palco.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => Promise.all([...document.fonts].map(f => f.load())));
const total = await page.evaluate(d => window.preparar(d), dados);

if (preview) {
  const cenas = await page.evaluate(() => DADOS.cenas.map(c => ({ id: c.id, inicio: c.inicio, duracao: c.duracao })));
  for (const c of cenas) {
    const t = c.inicio + Math.min(c.duracao * 0.6, 2.2);
    await page.evaluate(t => window.quadro(t), t);
    await page.screenshot({ path: `${saida}-${c.id}.png` });
  }
  console.log(`preview: ${cenas.length} quadros`);
  await browser.close();
  process.exit(0);
}

const n = Math.ceil(total * FPS);
const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
if (dados.audio) args.push('-i', dados.audio);
args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS));
if (dados.audio) args.push('-c:a', 'aac', '-b:a', '160k', '-shortest');
args.push('-movflags', '+faststart', saida);
const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let i = 0; i < n; i++) {
  await page.evaluate(t => window.quadro(t), i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % (FPS * 10) === 0) console.log(`quadro ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
await browser.close();
console.log(`ok: ${saida} (${total.toFixed(1)}s, ${n} quadros, ${((Date.now() - t0) / 1000).toFixed(0)}s de render)`);
