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
const qa = flags.includes('--qa');                // checa sobreposição de textos/cartões e corte na borda
const FPS = Number(process.env.FPS || 30);
const dados = JSON.parse(readFileSync(entrada, 'utf-8'));
const aqui = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(aqui, 'palco.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => Promise.all([...document.fonts].map(f => f.load())));
if (process.env.ESTILO3D) await page.evaluate(() => { window.ESTILO3D = true; });  // estilo 3D experimental (arte3d.js)
const total = await page.evaluate(d => window.preparar(d), dados);

if (qa) {
  const cenas = await page.evaluate(() => DADOS.cenas.map(c => ({ id: c.id, inicio: c.inicio, duracao: c.duracao })));
  const problemas = new Map();
  for (const c of cenas) {
    for (let t = 0.6; t < c.duracao; t += 0.4) {
      const achados = await page.evaluate(t => {
        window.quadro(t);
        const els = [...document.querySelectorAll('#palco .ui')].filter(el => !el.parentElement.closest('.ui'));
        const caixas = els.map(el => { const r = el.getBoundingClientRect();
          return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, nome: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 32) || '(gráfico)' }; })
          .filter(b => b.x1 - b.x0 > 2 && b.y1 - b.y0 > 2);
        // letreiros do cenário (placa do bar, muro, lanchonete): a interface não pode cobri-los
        const rotulos = [...document.querySelectorAll('#palco .rotulo')].map(el => { const r = el.getBoundingClientRect();
          return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, nome: 'letreiro "' + ((el.textContent || '').trim().slice(0, 20) || 'placa') + '"', fundo: true }; })
          .filter(b => b.x1 > 40 && b.x0 < 1040 && b.y1 > 0 && b.y0 < 1920);  // ignora o que a câmera já deixou fora
        const out = [];
        for (const b of [...caixas, ...rotulos]) if (b.x0 < -6 || b.x1 > 1086 || b.y0 < -6 || b.y1 > 1926) out.push(`fora da tela: "${b.nome}"`);
        const rostos = [...document.querySelectorAll('#palco .rosto')].map(el => { const r = el.getBoundingClientRect();
          return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, nome: 'rosto de personagem', rosto: true }; });
        for (const f of rostos) for (const b of [...rotulos, ...caixas.filter(c => !/^[👥💰]/.test(c.nome))]) {
          const w = Math.min(f.x1, b.x1) - Math.max(f.x0, b.x0), h = Math.min(f.y1, b.y1) - Math.max(f.y0, b.y0);
          if (w > 0 && h > 0 && w * h / ((f.x1 - f.x0) * (f.y1 - f.y0)) > 0.12) out.push(`rosto coberto/cobrindo: ${b.nome}`);
        }
        const todos = [...caixas, ...rotulos];
        for (let i = 0; i < todos.length; i++) for (let j = i + 1; j < todos.length; j++) {
          const a = todos[i], b = todos[j];
          if (a.fundo && b.fundo) continue;
          const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
          if (w <= 0 || h <= 0) continue;
          const menor = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
          if (w * h / menor > 0.06) out.push(`sobreposição: "${a.nome}" × "${b.nome}" (${Math.round(100 * w * h / menor)}%)`);
        }
        return out;
      }, c.inicio + t);
      for (const p of achados) { const k = `${c.id}: ${p.replace(/\(\d+%\)/, '')}`; if (!problemas.has(k)) problemas.set(k, `${c.id} @${t.toFixed(1)}s  ${p}`); }
    }
  }
  console.log(problemas.size ? [...problemas.values()].join('\n') : 'QA ok: nenhuma sobreposição');
  await browser.close();
  process.exit(problemas.size ? 2 : 0);
}

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
