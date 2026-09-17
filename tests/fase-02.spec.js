/* Equivalência das seções 2 e 3 (fase 2 da migração).
   -----------------------------------------------------------------------
   Aqui não dá para comparar "em que pixel disparou", porque --py e --e são
   CONTÍNUOS: eles têm um valor em cada posição de scroll. Então o teste
   reimplementa a conta do main.js e compara com o que o Anime.js escreveu,
   em vários pontos da rolagem.

   CUIDADO AO MEXER AQUI — a primeira versão deste teste estava errada:

   o main.js mede com getBoundingClientRect(), que já inclui o transform que a
   PRÓPRIA animação aplicou. A conta dele é portanto recursiva, e o valor que
   fica na tela é o PONTO FIXO dessa recursão. Reimplementar a fórmula usando
   o rect ao vivo da página migrada é circular: o rect ali está deslocado pela
   animação nova, não pela antiga, e o "esperado" sai errado.

   A referência honesta é resolver o ponto fixo a partir da posição ESTÁTICA
   (sem transform). Com  s = (vh - estatico.top - delay)/travel  e
   k = enterY/travel:

       e = (vh - (estatico + enterY*(1-e)) - delay)/travel
         =>  e = (s - k) / (1 - k)

   e, para o parallax, com D = vh + altura e u = (vh - estatico.top)/D:

       py = (0.5 - (vh - (estatico + py))/D) * 2 * amp
         =>  py = amp * (1 - 2u) / (1 - 2*amp/D)

   É isso que as funções pontoFixo* abaixo calculam. */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2','.woff':'font/woff','.gif':'image/gif' };
const server = http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end('x')}res.writeHead(200,{'Content-Type':TYPES[path.extname(p)]||'application/octet-stream'});res.end(b)})});
const ok = (c, m) => console.log((c ? '  PASS  ' : '  FALHA ') + m);

(async () => {
  await new Promise(r => server.listen(8796, r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const erros = [];
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') erros.push(m.type() + ': ' + m.text()); });
  await page.goto('http://localhost:8796/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

  /* Espera TRES frames depois de rolar, e nao so um tempo fixo.
     A biblioteca atualiza os observadores no proprio laço de animação dela,
     que roda depois do nosso; medir antes disso pega um valor a meio caminho
     e o teste acusa divergencia que nao existe. Com espera fixa de 70ms isto
     falhava em ~1 de cada 3 execucoes, sempre com numeros enormes (0.5, 0.87)
     num valor que, medido depois de assentar, bate em 0.0000.

     Se este teste voltar a ficar instavel, o suspeito e aqui — nao no
     effects.js. O sintoma de um erro de verdade e divergencia CONSTANTE e
     reproduzivel, como as que a fase 2 encontrou (110px, 40px); o sintoma de
     corrida e divergencia enorme e intermitente. */
  const goTo = async (y) => {
    await page.evaluate(v => new Promise(res => {
      window.scrollTo(0, v);
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res)));
    }), y);
    await page.waitForTimeout(80);
  };

  console.log('=== 1. Fronteira: o motor antigo largou as seções 2 e 3? ===');
  const fronteira = await page.evaluate(() => ({
    social: !!document.querySelector('.social.is-anime'),
    parallaxForaDoAnime: document.querySelectorAll('[data-parallax]:not([data-anime] [data-parallax])').length,
    enterForaDoAnime: document.querySelectorAll('[data-enter]:not([data-anime] [data-enter])').length,
    totalParallax: document.querySelectorAll('[data-parallax]').length,
    totalEnter: document.querySelectorAll('[data-enter]').length
  }));
  ok(fronteira.social, 'seção 2 marcada com .is-anime');
  ok(fronteira.parallaxForaDoAnime === 0, 'todos os ' + fronteira.totalParallax + ' [data-parallax] estão sob [data-anime]');
  ok(fronteira.enterForaDoAnime === 0, 'todos os ' + fronteira.totalEnter + ' [data-enter] estão sob [data-anime]');

  console.log('\n=== 2. --py do parallax: Anime.js vs a conta do main.js ===');
  /* Separado POR SITUACAO, e nao num numero unico, porque o contrato e
     diferente em cada uma:

     · sem ancestral animado  -> tem de bater exato;
     · card assentado (--e=1) -> tem de bater exato, e e onde a pagina passa
                                 a quase totalidade do tempo;
     · card entrando ou ainda invisivel -> NAO bate, e nao tem como bater:
       o main.js le o rect ao vivo, entao o parallax dos filhos do card fica
       acoplado a entrada do card. Reproduzir isso exigiria o mesmo laco de
       realimentacao por frame que a migracao veio tirar. O desvio fica
       confinado a um card que esta com opacity 0 (invisivel, porque o CSS usa
       opacity: var(--e)) ou deslizando 110px. */
  const alturaDoc = await page.evaluate(() => document.documentElement.scrollHeight);
  const piorPorSituacao = {}, amostrasPorSituacao = {};
  let piorPy = 0, amostrasPy = 0, elementosPy = new Set();
  for (let y = 0; y <= alturaDoc - 900; y += 300) {
    await goTo(y);
    const r = await page.evaluate(() => {
      const out = [];
      const vh = window.innerHeight;
      document.querySelectorAll('[data-parallax]').forEach((el, i) => {
        const b = el.getBoundingClientRect();
        if (b.bottom < 0 || b.top > vh) return;            // fora da tela: main.js nao calcula

        // posicao ESTATICA: neutraliza o transform para medir sem ele.
        // Como animamos --py (e nao transform), o style.transform inline
        // esta vazio, entao restaurar e so devolver a string original.
        const prev = el.style.transform;
        el.style.transform = 'none';
        const estatico = el.getBoundingClientRect().top;
        el.style.transform = prev;

        // ponto fixo da conta do main.js (ver cabecalho)
        const amp = parseFloat(el.dataset.parallax) || 40;
        const D = vh + b.height;
        const u = (vh - estatico) / D;
        const esperado = amp * (1 - 2 * u) / (1 - 2 * amp / D);

        const obtido = parseFloat(getComputedStyle(el).getPropertyValue('--py'));

        // em que situacao o ancestral [data-enter] esta?
        const anc = el.closest('[data-enter]');
        let situacao = 'sem ancestral animado';
        if (anc) {
          const e = parseFloat(getComputedStyle(anc).getPropertyValue('--e'));
          situacao = e <= 0.001 ? 'card invisivel (--e = 0)'
                   : e >= 0.999 ? 'card assentado (--e = 1)'
                   : 'card em transicao';
        }
        out.push({ i, cls: el.className.split(' ')[0], esperado, obtido, situacao });
      });
      return out;
    });
    r.forEach(a => {
      if (isNaN(a.obtido)) return;
      elementosPy.add(a.cls);
      amostrasPy++;
      const d = Math.abs(a.esperado - a.obtido);
      piorPy = Math.max(piorPy, d);
      piorPorSituacao[a.situacao] = Math.max(piorPorSituacao[a.situacao] || 0, d);
      amostrasPorSituacao[a.situacao] = (amostrasPorSituacao[a.situacao] || 0) + 1;
    });
  }
  console.log('    ' + amostrasPy + ' amostras em ' + elementosPy.size + ' tipos de elemento (' + [...elementosPy].join(', ') + ')');
  Object.keys(piorPorSituacao).sort().forEach(s =>
    console.log('      ' + s.padEnd(28) + piorPorSituacao[s].toFixed(3) + 'px  (' + amostrasPorSituacao[s] + ' amostras)'));
  ok(amostrasPy > 30, 'amostras suficientes (' + amostrasPy + ')');
  ok((piorPorSituacao['sem ancestral animado'] || 0) < 0.05,
     'exato onde nao ha ancestral animado (' + (piorPorSituacao['sem ancestral animado'] || 0).toFixed(3) + 'px)');
  ok((piorPorSituacao['card assentado (--e = 1)'] || 0) < 0.1,
     'exato com o card assentado, que e o caso normal (' + (piorPorSituacao['card assentado (--e = 1)'] || 0).toFixed(3) + 'px)');
  ok((piorPorSituacao['card em transicao'] || 0) < 8,
     'desvio conhecido e limitado durante a entrada do card (' + (piorPorSituacao['card em transicao'] || 0).toFixed(3) + 'px)');
  ok((piorPorSituacao['card invisivel (--e = 0)'] || 0) < 8,
     'desvio conhecido com o card ainda invisivel (' + (piorPorSituacao['card invisivel (--e = 0)'] || 0).toFixed(3) + 'px)');

  console.log('\n=== 3. --e das entradas: Anime.js vs a conta do main.js ===');
  let piorE = 0, amostrasE = 0;
  const featTop = await page.evaluate(() => document.querySelector('.features').getBoundingClientRect().top + window.scrollY);
  const featH = await page.evaluate(() => document.querySelector('.features').offsetHeight);
  for (let y = Math.max(0, featTop - 1000); y <= featTop + featH; y += 120) {
    await goTo(y);
    const r = await page.evaluate(() => {
      const out = [];
      const vh = window.innerHeight;
      document.querySelectorAll('[data-enter]').forEach(el => {
        const b = el.getBoundingClientRect();
        if (b.top > vh || b.bottom < 0) return;

        const prev = el.style.transform;
        el.style.transform = 'none';
        const estatico = el.getBoundingClientRect().top;
        el.style.transform = prev;

        // ponto fixo da conta do main.js (ver cabecalho)
        const travel = (parseFloat(el.dataset.enter) || 0.4) * vh;
        const delay = (parseFloat(el.dataset.enterDelay) || 0) * vh;
        const enterY = parseFloat(getComputedStyle(el).getPropertyValue('--enter-y')) || 44;
        const s = (vh - estatico - delay) / travel;
        const k = enterY / travel;
        const esperado = Math.min(Math.max((s - k) / (1 - k), 0), 1);

        const obtido = parseFloat(getComputedStyle(el).getPropertyValue('--e'));
        out.push({ cls: el.className.split(' ')[0], esperado, obtido });
      });
      return out;
    });
    r.forEach(a => {
      if (isNaN(a.obtido)) return;
      amostrasE++;
      piorE = Math.max(piorE, Math.abs(a.esperado - a.obtido));
    });
  }
  console.log('    ' + amostrasE + ' amostras · pior divergencia: ' + piorE.toFixed(4) + ' (de uma escala 0..1)');
  ok(amostrasE > 30, 'amostras suficientes (' + amostrasE + ')');
  ok(piorE < 0.02, 'o --e do Anime.js bate com a conta do main.js (pior caso ' + piorE.toFixed(4) + ')');

  console.log('\n=== 4. Reveal em bloco da seção 2 ===');
  // RECARREGA: o reveal dispara uma vez só (como o IntersectionObserver que
  // ele substitui). Os testes acima ja rolaram a pagina inteira, entao sem
  // recarregar mediriamos um gatilho ja disparado e o "antes" seria mentira.
  await page.goto('http://localhost:8796/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  const socTop = await page.evaluate(() => document.querySelector('.social').getBoundingClientRect().top + window.scrollY);
  // antes: seção ainda não está 98% visível
  await goTo(socTop - 400);
  const antes = await page.evaluate(() => [...document.querySelectorAll('.social [data-reveal]')].map(e => +getComputedStyle(e).opacity));
  ok(antes.every(o => o < 0.05), 'texto e lojas invisiveis antes da seção encher a tela (' + antes.join(', ') + ')');
  // depois: seção cheia
  await goTo(socTop);
  await page.waitForTimeout(1400);
  const depois = await page.evaluate(() => [...document.querySelectorAll('.social [data-reveal]')].map(e => ({
    o: +getComputedStyle(e).opacity, t: getComputedStyle(e).transform
  })));
  ok(depois.every(e => e.o === 1), 'os 3 elementos ficam opacos');
  ok(depois.every(e => /matrix\(1, 0, 0, 1, 0, 0\)|none/.test(e.t)), 'os 3 pousam em y=0');

  console.log('\n=== 5. O wiggle do CSS sobreviveu? ===');
  const wig = await page.evaluate(() => {
    const img = document.querySelector('.social__art img');
    return { anim: getComputedStyle(img).animationName, dur: getComputedStyle(img).animationDuration };
  });
  ok(wig.anim === 'wiggle' && wig.dur === '7s', 'o wiggle continua no CSS, intacto (' + wig.anim + ' ' + wig.dur + ')');

  /* O hero foi migrado na fase 3. Ate la, este bloco verificava que ele
     continuava no motor antigo; agora verifica que ele segue funcionando,
     seja qual for o motor. O fase-03.spec.js e quem cobre o hero a fundo. */
  console.log('\n=== 6. Hero continua funcionando ===');
  await goTo(0);
  await page.waitForTimeout(1200);
  const hero = await page.evaluate(() => ({
    opacos: [...document.querySelectorAll('.hero [data-reveal]')].filter(e => +getComputedStyle(e).opacity === 1).length,
    total: document.querySelectorAll('.hero [data-reveal]').length,
    p: getComputedStyle(document.documentElement).getPropertyValue('--p').trim()
  }));
  ok(hero.opacos === hero.total, 'os ' + hero.total + ' reveals do hero aparecem (' + hero.opacos + ')');
  ok(hero.p !== '', '--p do showcase ainda escrito (' + hero.p + ')');

  console.log('\n=== Erros e avisos de runtime ===');
  const rel = erros.filter(e => !e.includes('favicon') && !e.includes('video'));
  console.log(rel.length ? rel.map(e => '    ' + e.slice(0,140)).join('\n') : '    nenhum');
  ok(rel.length === 0, 'console limpo');

  await browser.close(); server.close();
})();
