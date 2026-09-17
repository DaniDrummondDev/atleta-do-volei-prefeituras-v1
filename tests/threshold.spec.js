/* Prova de equivalência do gatilho.
   -----------------------------------------------------------------------
   A migração trocou o IntersectionObserver(threshold: 0.2) do main.js pelo
   onScroll() do Anime.js. Este teste roda OS DOIS lado a lado, nos mesmos
   elementos, e compara em que pixel de scroll cada um dispara.

   Se os dois disparam no mesmo pixel, o comportamento é idêntico — não
   "parecido". É a única forma de afirmar isso sem olhar no olho.

   A ordem das palavras no enter é "CONTAINER ALVO" (ver scroll.js da lib):
     'end top+=20%'  ->  container na base da tela, alvo a 20% da altura dele
   que é exatamente o que threshold: 0.2 significa para quem entra por baixo. */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2','.woff':'font/woff','.gif':'image/gif' };
const server = http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end('x')}res.writeHead(200,{'Content-Type':TYPES[path.extname(p)]||'application/octet-stream'});res.end(b)})});
const ok = (c, m) => console.log((c ? '  PASS  ' : '  FALHA ') + m);

(async () => {
  await new Promise(r => server.listen(8794, r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:8794/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

  // Instala os dois observadores nos mesmos elementos, sem tocar na pagina.
  await page.evaluate(() => {
    const { animate, onScroll } = window.anime;
    window.__cmp = {};

    const alvos = [
      ['badge',    document.querySelector('.gains__eyebrow')],
      ['titulo 1', document.querySelectorAll('.gains__line')[0]],
      ['titulo 2', document.querySelectorAll('.gains__line')[1]],
      ['cards',    document.querySelector('.gains__list')],
    ];

    alvos.forEach(([nome, el]) => {
      window.__cmp[nome] = { io: null, anime: null };

      // 1. referencia: o IntersectionObserver que o main.js usa hoje
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          if (window.__cmp[nome].io === null) window.__cmp[nome].io = Math.round(window.scrollY);
          io.unobserve(e.target);
        });
      }, { threshold: 0.2 });
      io.observe(el);

      // 2. o gatilho novo, com a MESMA configuracao usada em section-04.js.
      //    target explicito: animamos um objeto JS aqui, entao a biblioteca
      //    nao teria de onde tirar o elemento sozinha.
      const opts = {
        target: el,
        enter: 'end top+=20%',
        sync: 'play',
        onEnter: () => {
          if (window.__cmp[nome].anime === null) window.__cmp[nome].anime = Math.round(window.scrollY);
        }
      };
      animate({ v: 0 }, { v: 1, duration: 50, autoplay: onScroll(opts) });
    });
  });

  // Rola de 10 em 10px pela entrada da secao: resolucao suficiente para
  // distinguir os dois gatilhos se eles divergirem.
  const secTop = await page.evaluate(() => document.querySelector('.gains').getBoundingClientRect().top + window.scrollY);
  for (let y = Math.max(0, secTop - 1600); y <= secTop + 600; y += 10) {
    await page.evaluate(v => window.scrollTo(0, v), y);
    await page.waitForTimeout(8);
  }

  const cmp = await page.evaluate(() => window.__cmp);
  console.log('=== Em que scrollY cada gatilho disparou ===');
  console.log('  ' + 'elemento'.padEnd(12) + 'IntersectionObserver'.padEnd(22) + 'onScroll'.padEnd(12) + 'diferenca');
  let tudoIgual = true;
  for (const [nome, v] of Object.entries(cmp)) {
    const dif = (v.io === null || v.anime === null) ? null : Math.abs(v.io - v.anime);
    if (dif === null || dif > 10) tudoIgual = false;
    console.log('  ' + nome.padEnd(12)
      + String(v.io === null ? 'NUNCA' : 'y=' + v.io).padEnd(22)
      + String(v.anime === null ? 'NUNCA' : 'y=' + v.anime).padEnd(12)
      + (dif === null ? '—' : dif + 'px'));
  }
  console.log('');
  ok(tudoIgual, 'os dois gatilhos disparam no mesmo ponto (tolerancia = 1 passo de scroll, 10px)');

  await browser.close(); server.close();
})();
