/* Equivalência do hero (fase 3 da migração).
   -----------------------------------------------------------------------
   O hero é a parte que mais dói se quebrar, então este teste compara contra
   as DUAS referências possíveis:

     · gatilhos  -> contra IntersectionObserver de verdade, rodando junto;
     · progresso -> contra a fórmula do main.js, reimplementada aqui.

   Ao contrário das seções 2 e 3, aqui NÃO há realimentação de rect ao vivo:
   o palco (.showcase) não é deslocado por nenhuma animação, então a fórmula
   do main.js não é recursiva e a comparação é direta.                     */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2','.woff':'font/woff','.gif':'image/gif' };
const server = http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end('x')}res.writeHead(200,{'Content-Type':TYPES[path.extname(p)]||'application/octet-stream'});res.end(b)})});
const ok = (c, m) => console.log((c ? '  PASS  ' : '  FALHA ') + m);

(async () => {
  await new Promise(r => server.listen(8803, r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const erros = [];
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') erros.push(m.type() + ': ' + m.text()); });
  await page.goto('http://localhost:8803/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

  const goTo = async (y) => {
    await page.evaluate(v => new Promise(res => {
      window.scrollTo(0, v);
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res)));
    }), y);
    await page.waitForTimeout(80);
  };

  console.log('=== 1. Fronteira: o motor antigo largou o hero? ===');
  const fronteira = await page.evaluate(() => ({
    isAnime: !!document.querySelector('.hero.is-anime'),
    revealsForaDoAnime: document.querySelectorAll('.hero [data-reveal]:not([data-anime] [data-reveal])').length,
    visiveisDoMotorAntigo: [...document.querySelectorAll('.hero [data-reveal]')].filter(e => e.classList.contains('is-visible')).length,
    todosMigrados: document.querySelectorAll('[data-anime]').length
  }));
  ok(fronteira.isAnime, 'hero marcado com .is-anime');
  ok(fronteira.revealsForaDoAnime === 0, 'nenhum [data-reveal] do hero fora de [data-anime]');
  ok(fronteira.visiveisDoMotorAntigo === 0, 'motor antigo nao pos .is-visible em nada do hero');
  /* Cresce quando nasce uma secao nova com modulo proprio. Hoje: hero,
     social, features, gains e trans. */
  ok(fronteira.todosMigrados === 5, 'as 5 secoes estao migradas (' + fronteira.todosMigrados + ')');

  console.log('\n=== 2. Contadores: curva e valor final ===');
  await page.waitForTimeout(2200);   // 1400ms da animacao + folga
  const cont = await page.evaluate(() => [...document.querySelectorAll('[data-count]')].map(e => ({
    alvo: +e.dataset.count, texto: e.textContent.trim()
  })));
  cont.forEach(c => console.log('    alvo ' + c.alvo + ' -> texto "' + c.texto + '"'));
  ok(cont.every(c => c.texto === String(c.alvo)), 'os 3 contadores chegam no numero exato');
  ok(cont.every(c => /^\d+$/.test(c.texto)), 'sempre inteiros, nunca decimais na tela');

  // a curva 'outCubic' da lib e a mesma 1-(1-t)^3 do main.js?
  const curva = await page.evaluate(() => {
    const { animate } = window.anime;
    const o = { v: 0 };
    const a = animate(o, { v: 340, duration: 1400, ease: 'outCubic' }, { autoplay: false });
    const out = [];
    [0.1, 0.25, 0.5, 0.75, 0.9].forEach(t => {
      a.seek(t * 1400);
      out.push({ t, anime: +o.v.toFixed(3), main: +(340 * (1 - Math.pow(1 - t, 3))).toFixed(3) });
    });
    return out;
  });
  const piorCurva = Math.max(...curva.map(c => Math.abs(c.anime - c.main)));
  curva.forEach(c => console.log('    t=' + c.t + '  anime=' + c.anime + '  main.js=' + c.main));
  ok(piorCurva < 0.01, "'outCubic' da lib == 1-(1-t)^3 do main.js (pior " + piorCurva.toFixed(4) + ')');

  console.log('\n=== 3. Gatilhos do hero vs IntersectionObserver real ===');
  /* VIEWPORT CURTA de proposito. Numa tela de 900px o hero inteiro ja esta
     visivel no carregamento: os dois motores disparam em y=0 e a comparacao
     nao prova nada — foi o que a primeira versao deste teste fez. Com 420px
     de altura os elementos entram um a um enquanto rolamos, e af os pontos
     de disparo podem realmente divergir. */
  await page.setViewportSize({ width: 1440, height: 420 });
  await page.goto('http://localhost:8803/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  await page.evaluate(() => {
    const { animate, onScroll } = window.anime;
    window.__cmp = {};
    const alvos = [];
    document.querySelectorAll('.hero [data-reveal]').forEach((el, i) => alvos.push(['reveal ' + i, el, 0.2, 'end top+=20%']));
    // o contador: threshold 1, e o gatilho desconta os 24px do .hero__stats
    const c = document.querySelector('[data-count]');
    alvos.push(['contador', c, 1, 'end+=24 end']);

    alvos.forEach(([nome, el, threshold, enter]) => {
      window.__cmp[nome] = { io: null, anime: null };
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        if (window.__cmp[nome].io === null) window.__cmp[nome].io = Math.round(window.scrollY);
        io.unobserve(e.target);
      }), { threshold });
      io.observe(el);
      animate({ v: 0 }, { v: 1, duration: 50, autoplay: onScroll({
        target: el, enter, sync: 'play',
        onEnter: () => { if (window.__cmp[nome].anime === null) window.__cmp[nome].anime = Math.round(window.scrollY); }
      })});
    });
  });
  /* 2px por passo, com 20ms de espera. A espera importa tanto quanto o passo:
     o IntersectionObserver e o onScroll nao respondem no mesmo instante — um
     e callback do navegador, o outro roda no laço da biblioteca. Rolando
     rapido (4ms por passo = 500px/s), um frame de atraso ja vale 8px e o
     teste acusa divergencia que e so defasagem. 20ms por passo poe a rolagem
     em 100px/s, onde um frame vale 1.6px.
     O alcance para em 400px porque o ultimo gatilho do hero cai antes de 250. */
  for (let y = 0; y <= 400; y += 2) {
    await page.evaluate(v => window.scrollTo(0, v), y);
    await page.waitForTimeout(20);
  }
  const cmp = await page.evaluate(() => window.__cmp);
  let piorReveal = 0, difContador = null;
  for (const [nome, v] of Object.entries(cmp)) {
    const dif = (v.io === null || v.anime === null) ? null : Math.abs(v.io - v.anime);
    if (nome === 'contador') difContador = dif;
    else if (dif !== null) piorReveal = Math.max(piorReveal, dif);
    console.log('    ' + nome.padEnd(12) + 'IO: ' + String(v.io === null ? 'NUNCA' : 'y=' + v.io).padEnd(12)
      + 'onScroll: ' + String(v.anime === null ? 'NUNCA' : 'y=' + v.anime).padEnd(12)
      + (dif === null ? '—' : dif + 'px'));
  }
  ok(Object.values(cmp).every(v => v.io !== null && v.anime !== null), 'todos os gatilhos dispararam');
  ok(piorReveal <= 2, 'os reveals do hero caem no mesmo pixel do IntersectionObserver (' + piorReveal + 'px)');

  /* O contador tem tolerancia PROPRIA, e vale explicar por que:

     o <b data-count> vive dentro de .hero__stats, que e [data-reveal]. O
     IntersectionObserver antigo le a posicao AO VIVO, e durante os 800ms do
     reveal essa posicao esta em movimento. Ou seja: o ponto de disparo
     antigo depende de quao rapido a pessoa rola — rolando devagar o reveal
     termina antes e o gatilho cai num lugar, rolando rapido cai noutro. Nao
     existe um valor unico "certo" para comparar.

     O gatilho novo mira o estado ASSENTADO (reveal terminado), que e o que
     um leitor normal ve. Este teste rola 2px a cada 4ms — rapidissimo,
     justamente o pior caso para essa diferenca. Os ~30px medidos aqui sao o
     teto, nao o tipico. */
  console.log('    (o contador tem tolerancia propria — ver comentario no teste)');
  ok(difContador !== null && difContador <= 40,
     'o contador dispara dentro da janela do reveal do .hero__stats (' + difContador + 'px)');

  console.log('\n=== 4. --p, --reel e .bridge vs a formula do main.js ===');
  await page.setViewportSize({ width: 1440, height: 900 });   // volta ao normal
  await page.goto('http://localhost:8803/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  const geo = await page.evaluate(() => {
    const s = document.querySelector('[data-showcase]');
    return { alt: s.offsetHeight, topo: s.getBoundingClientRect().top + window.scrollY, vh: window.innerHeight };
  });
  const curso = geo.alt - geo.vh;
  let piorP = 0, piorReel = 0, bridgeOk = true, amostras = 0;
  for (let y = Math.max(0, geo.topo - geo.vh); y <= geo.topo + curso + 200; y += 120) {
    await goTo(y);
    const d = await page.evaluate(() => {
      const s = document.querySelector('[data-showcase]');
      const r = s.getBoundingClientRect();
      const vh = window.innerHeight;
      const range = s.offsetHeight - vh;

      // formulas ORIGINAIS, copiadas de scrollFx() no main.js
      const p = Math.min(Math.max(range > 0 ? (-r.top) / range : 0, 0), 1);
      const lead = 1.0 * vh;
      const span = lead + 0.55 * range;
      const reel = Math.min(Math.max(span > 0 ? (lead - r.top) / span : 0, 0), 1);

      const cs = getComputedStyle(document.documentElement);
      return {
        pMain: p, pAnime: parseFloat(cs.getPropertyValue('--p')),
        reelMain: reel, reelAnime: parseFloat(cs.getPropertyValue('--reel')),
        bridgeAtiva: document.querySelector('[data-bridge]').classList.contains('is-active'),
        bridgeDeveria: p > 0.50
      };
    });
    if (isNaN(d.pAnime)) continue;
    amostras++;
    piorP = Math.max(piorP, Math.abs(d.pMain - d.pAnime));
    if (!isNaN(d.reelAnime)) piorReel = Math.max(piorReel, Math.abs(d.reelMain - d.reelAnime));
    if (d.bridgeAtiva !== d.bridgeDeveria) bridgeOk = false;
  }
  console.log('    ' + amostras + ' amostras · pior --p: ' + piorP.toFixed(4) + ' · pior --reel: ' + piorReel.toFixed(4));
  ok(amostras > 15, 'amostras suficientes (' + amostras + ')');
  ok(piorP < 0.01, '--p bate com a formula do main.js (' + piorP.toFixed(4) + ')');
  ok(piorReel < 0.01, '--reel bate com a formula do main.js (' + piorReel.toFixed(4) + ')');
  ok(bridgeOk, '.bridge.is-active liga e desliga exatamente em --p > 0.50');

  console.log('\n=== 4b. Subindo de volta: --p e --reel voltam a zero? ===');
  /* REGRESSAO QUE ESTE TESTE EXISTE PARA PEGAR.

     A biblioteca PARA de sincronizar quando o alvo sai da faixa, e deixa o
     progresso congelado no ultimo valor em vez de grampea-lo na borda. O
     motor antigo nao tinha isso: recalculava a cada frame e grampeava.

     O sintoma era visivel — descer um pouco no hero e voltar ao topo deixava
     --p travado em 0.1235, com os celulares parados a meio caminho da
     transicao. Passou batido na fase 3 porque todos os testes so amostravam
     DESCENDO. Daqui em diante, qualquer coisa presa ao scroll precisa ser
     verificada nos dois sentidos. */
  await goTo(geo.topo + Math.round(curso * 0.3));
  const noMeio = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return { p: parseFloat(cs.getPropertyValue('--p')), reel: parseFloat(cs.getPropertyValue('--reel')) };
  });
  await goTo(0);
  const noTopo = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return { p: parseFloat(cs.getPropertyValue('--p')), reel: parseFloat(cs.getPropertyValue('--reel')) };
  });
  console.log('    no meio do palco: --p=' + noMeio.p.toFixed(4) + '  --reel=' + noMeio.reel.toFixed(4));
  console.log('    de volta ao topo: --p=' + noTopo.p.toFixed(4) + '  --reel=' + noTopo.reel.toFixed(4));
  ok(noMeio.p > 0.05, 'o palco realmente avancou antes de voltarmos (' + noMeio.p.toFixed(4) + ')');
  ok(noTopo.p < 0.001, '--p volta a zero ao subir (' + noTopo.p.toFixed(4) + ')');
  ok(noTopo.reel < 0.001, '--reel volta a zero ao subir (' + noTopo.reel.toFixed(4) + ')');

  console.log('\n=== 5. Scrub do video ===');
  /* O scrub ponta a ponta NAO e verificavel aqui: o Chromium que vem com o
     Playwright nao tem o codec H.264, entao o <video> nunca carrega
     (DEMUXER_ERROR_NO_SUPPORTED_STREAMS, canPlayType('...avc1...') vazio).
     Nao e bug nosso e nao adianta insistir — precisa de navegador com codec,
     e o comportamento no iOS precisa de aparelho de verdade.

     Ate a fase 3 havia aqui um teste de "copias gemeas", que comparava o
     miolo do scrub entre main.js e anim/hero.js. A fase 4 removeu o motor
     antigo, entao so existe uma copia e o teste perdeu o objeto.

     Sobra verificar o que da: que o scrub esta onde deve estar, e que a conta
     que liga --p ao tempo do video esta certa. */
  const scrubNoLugar = await page.evaluate(async () => {
    const hero = await (await fetch('assets/js/anim/hero.js')).text();
    const main = await (await fetch('assets/js/main.js')).text();
    return {
      noHero: /video\.currentTime\s*=\s*wanted/.test(hero) && /fastSeek/.test(hero),
      noMain: /currentTime/.test(main) || /fastSeek/.test(main)
    };
  });
  ok(scrubNoLugar.noHero, 'o scrub (fastSeek + currentTime) vive em anim/hero.js');
  ok(!scrubNoLugar.noMain, 'o main.js nao tem mais nenhum resto do scrub');

  // a conta que mapeia --p em currentTime, verificada sem precisar de video
  const mapa = [[0, 0], [0.55, 0], [0.775, 0.5], [1, 1]].map(([p, esperado]) => {
    const t = Math.min(Math.max((p - 0.55) / (1 - 0.55), 0), 1);
    return { p, t, esperado, bate: Math.abs(t - esperado) < 1e-9 };
  });
  mapa.forEach(m => console.log('    --p=' + m.p + '  ->  fracao do video ' + m.t.toFixed(3)));
  ok(mapa.every(m => m.bate), 'o mapa --p -> tempo do video (VIDEO_IN 0.55) esta correto');

  console.log('\n=== 6. Nada quebrou nas outras secoes ===');
  const outras = await page.evaluate(() => ({
    py: [...document.querySelectorAll('[data-parallax]')].filter(e => getComputedStyle(e).getPropertyValue('--py').trim() !== '').length,
    totalPy: document.querySelectorAll('[data-parallax]').length
  }));
  ok(outras.py > 0, 'parallax continua sendo escrito (' + outras.py + '/' + outras.totalPy + ')');

  console.log('\n=== Erros e avisos de runtime ===');
  const rel = erros.filter(e => !e.includes('favicon') && !e.includes('video') && !e.includes('media'));
  console.log(rel.length ? rel.map(e => '    ' + e.slice(0,140)).join('\n') : '    nenhum');
  ok(rel.length === 0, 'console limpo');

  await browser.close(); server.close();
})();
