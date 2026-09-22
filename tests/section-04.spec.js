const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
                '.png':'image/png', '.mp4':'video/mp4', '.woff2':'font/woff2', '.woff':'font/woff', '.gif':'image/gif' };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, b) => {
    if (e) { res.writeHead(404); return res.end('nope'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
    res.end(b);
  });
});

const ok = (c, m) => console.log((c ? '  PASS  ' : '  FALHA ') + m);

(async () => {
  await new Promise(r => server.listen(8789, r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('http://localhost:8789/', { waitUntil: 'networkidle' });

  // O style.css tem html{scroll-behavior:smooth}: sem desligar, todo scrollTo
  // do teste chega atrasado e medimos a pagina no meio do caminho.
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  const goTo = async (y) => { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(150); };

  console.log('\n=== 1. Biblioteca e fronteira ===');
  const lib = await page.evaluate(() => ({
    loaded: typeof window.anime === 'object' && !!window.anime,
    version: window.anime && Object.keys(window.anime).length,
    isAnime: !!document.querySelector('.gains.is-anime'),
    hasOnScroll: !!(window.anime && window.anime.onScroll)
  }));
  ok(lib.loaded, 'window.anime carregou do asset local — ' + lib.version + ' exports');
  ok(lib.hasOnScroll, 'anime.onScroll disponivel');
  ok(lib.isAnime, 'secao 4 marcada com .is-anime (biblioteca assumiu)');

  console.log('\n=== 2. Motor antigo nao toca na secao 4 ===');
  const old = await page.evaluate(() => {
    const els = document.querySelectorAll('.gains [data-reveal]');
    return {
      total: els.length,
      comIsVisible: [...els].filter(e => e.classList.contains('is-visible')).length,
      comRevealDelay: [...els].filter(e => e.style.getPropertyValue('--reveal-delay') !== '').length
    };
  });
  ok(old.comIsVisible === 0, 'nenhum .is-visible do motor antigo (' + old.comIsVisible + '/' + old.total + ')');
  ok(old.comRevealDelay === 0, 'nenhum --reveal-delay escrito pelo motor antigo');

  console.log('\n=== 3. Estado inicial antes de rolar ===');
  const antes = await page.evaluate(() => {
    const c = document.querySelector('.gain');
    const s = getComputedStyle(c);
    return { opacity: s.opacity, transform: s.transform, t: getComputedStyle(document.querySelector('.gains')).getPropertyValue('--t').trim() };
  });
  ok(parseFloat(antes.opacity) === 0, 'card invisivel antes de entrar (opacity ' + antes.opacity + ')');
  ok(antes.transform.includes('90'), 'card deslocado 90px a direita (' + antes.transform + ')');

  console.log('\n=== 4. Entrada dos cards (elastico) ===');
  // Rola ate a fileira de cards estar de fato entrando pela base da tela.
  /* ATE A MUDANCA DA REGUA este bloco fazia outra coisa: rolava ate a fileira
     de cards ficar 30% visivel e cobrava que os tres entrassem sozinhos. Era
     o comportamento antigo, de gatilho por card — justamente o que foi
     substituido.

     Agora ele cobra o contrario, que e o que prova que o gatilho mudou: com a
     fileira JA VISIVEL na tela, se a regua ainda nao andou, nenhum card pode
     ter entrado. Quem verifica a entrada em si e o bloco 5c. */
  const alvo = await page.evaluate(() => {
    const l = document.querySelector('.gains__list').getBoundingClientRect();
    return l.top + window.scrollY - window.innerHeight + l.height * 0.3;  // 30% da lista visivel
  });
  await goTo(alvo);
  await page.waitForTimeout(1600);
  const comListaVisivel = await page.evaluate(() => {
    const l = document.querySelector('.gains__list').getBoundingClientRect();
    return {
      listaNaTela: l.top < window.innerHeight && l.bottom > 0,
      t: parseFloat(getComputedStyle(document.querySelector('.gains')).getPropertyValue('--t')),
      cards: [...document.querySelectorAll('.gain')].map(c => +getComputedStyle(c).opacity)
    };
  });
  console.log('    fileira na tela: ' + comListaVisivel.listaNaTela
    + '   --t=' + comListaVisivel.t.toFixed(3)
    + '   opacidades: ' + comListaVisivel.cards.join(', '));
  ok(comListaVisivel.listaNaTela, 'a fileira de cards esta mesmo visivel nesta posicao');
  ok(comListaVisivel.t < 0.01, 'a regua ainda nao andou aqui (--t=' + comListaVisivel.t.toFixed(3) + ')');
  ok(comListaVisivel.cards.every(o => o === 0),
     'nenhum card entrou so por estar visivel: quem manda agora e a regua');

  console.log('\n=== 5. Titulo e badge ===');
  const texto = await page.evaluate(() => [...document.querySelectorAll('.gains__eyebrow, .gains__line')].map(e => ({
    cls: e.className.split(' ')[0], o: getComputedStyle(e).opacity, t: getComputedStyle(e).transform
  })));
  ok(texto.every(e => parseFloat(e.o) === 1), 'badge e 2 linhas do titulo opacos');
  ok(texto.every(e => /matrix\(1, 0, 0, 1, 0, 0\)|none/.test(e.t)), 'todos pousaram em y=0');

  console.log('\n=== 5b. A curva realmente aplicada bate com o CSS antigo? ===');
  const curva = await page.evaluate(() => {
    const { animate } = window.anime;
    const o = { x: 0 };
    const a = animate(o, { x: { from: 90, to: 0, duration: 1100, ease: 'outElastic(1, .3)' } }, { autoplay: false });
    const amostras = {};
    [0, 0.04, 0.08, 0.12, 0.20, 0.28, 0.44].forEach(t => { a.seek(t * 1100); amostras[t] = +o.x.toFixed(2); });
    return amostras;
  });
  // valores dos @keyframes que estavam no style.css
  const esperado = { 0: 90, 0.04: 45.64, 0.08: -5.4, 0.12: -31.69, 0.2: -11.25, 0.28: 11.81, 0.44: -4.17 };
  let bate = true;
  for (const [t, v] of Object.entries(esperado)) {
    const got = curva[t];
    const d = Math.abs(got - v);
    if (d > 0.05) { bate = false; console.log('    t=' + t + '  anime=' + got + '  css=' + v + '  DIF ' + d.toFixed(2)); }
  }
  ok(bate, 'os 7 pontos da curva batem com os @keyframes antigos (tolerancia 0.05px)');

  console.log('\n=== 5c. A regua comanda a entrada dos cards ===');
  /* O comportamento novo: a barra comeca toda cinza e cada card entra quando
     o laranja alcanca o terco dele. Antes os cards entravam por conta propria
     e a barra ja nascia com 33% laranja — as duas coisas nao conversavam. */
  await page.goto('http://localhost:8789/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  const gTopo = await page.evaluate(() => document.querySelector('.gains').getBoundingClientRect().top + window.scrollY);
  const gAlt = await page.evaluate(() => document.querySelector('.gains').offsetHeight);
  const gCurso = gAlt - 900;

  const leCards = () => page.evaluate(() => ({
    fill: +(document.querySelector('.timeline__fill').getBoundingClientRect().width
         / document.querySelector('.timeline__track').getBoundingClientRect().width).toFixed(3),
    visiveis: [...document.querySelectorAll('.gain')].map(c => +getComputedStyle(c).opacity > 0.5)
  }));

  // logo antes da secao pinar: barra cinza e nenhum card
  await goTo(gTopo - 200);
  await page.waitForTimeout(400);
  const antesDeTudo = await leCards();
  console.log('    antes da secao: fill=' + (antesDeTudo.fill * 100).toFixed(0) + '%  cards=' + antesDeTudo.visiveis.map(v => v ? 'X' : '.').join(''));
  ok(antesDeTudo.fill < 0.02, 'a barra comeca toda cinza (' + (antesDeTudo.fill * 100).toFixed(0) + '%)');
  ok(antesDeTudo.visiveis.every(v => !v), 'nenhum card entrou antes da secao comecar');

  // avanca em fatias e registra quando cada card aparece
  const sequencia = [];
  for (const t of [0.10, 0.30, 0.40, 0.60, 0.70, 0.95]) {
    await goTo(gTopo + Math.round(gCurso * t));
    await page.waitForTimeout(1500);           // 1.1s da elastica + folga
    const e = await leCards();
    sequencia.push({ t, ...e });
    console.log('    t=' + t.toFixed(2) + '  fill=' + String((e.fill * 100).toFixed(0) + '%').padEnd(5)
      + '  cards=' + e.visiveis.map(v => v ? 'X' : '.').join(''));
  }
  const quantos = sequencia.map(s => s.visiveis.filter(Boolean).length);
  ok(quantos[0] === 1, 'no 1o terco so o card 1 entrou (' + quantos[0] + ')');
  ok(quantos[sequencia.findIndex(s => s.t === 0.40)] === 2, 'no 2o terco ja sao 2 cards');
  ok(quantos[quantos.length - 1] === 3, 'no fim os 3 cards entraram');
  ok(quantos.every((q, i) => i === 0 || q >= quantos[i - 1]), 'descendo, a contagem so cresce');
  ok(sequencia.every(s => Math.abs(s.fill - s.t) < 0.05), 'a barra acompanha o progresso (fill = --t)');

  console.log('\n=== 5c-bis. Rolando de VOLTA: a animacao se desfaz? ===');
  /* Subindo, o laranja recua e cada card tem de sair.

     A saida e LINEAR, por escolha do cliente: o elastico fica so na ida, onde
     tem funcao. Este teste verifica a SEQUENCIA — quem sai, em que ordem, e
     se volta tudo ao estado inicial —, nao a curva; trocar o easing da saida
     nao deve mexer aqui. */
  const volta = [];
  for (const t of [0.70, 0.55, 0.30, 0.10, 0.00]) {
    await goTo(gTopo + Math.round(gCurso * t));
    await page.waitForTimeout(1500);
    const e = await leCards();
    volta.push({ t, ...e });
    console.log('    t=' + t.toFixed(2) + '  fill=' + String((e.fill * 100).toFixed(0) + '%').padEnd(5)
      + '  cards=' + e.visiveis.map(v => v ? 'X' : '.').join(''));
  }
  const qVolta = volta.map(v => v.visiveis.filter(Boolean).length);
  ok(qVolta.every((q, i) => i === 0 || q <= qVolta[i - 1]), 'subindo, a contagem so diminui');
  ok(qVolta[qVolta.length - 1] === 0, 'de volta ao inicio, nenhum card fica na tela (' + qVolta[qVolta.length - 1] + ')');

  /* A invariante que vale nos DOIS sentidos: os cards visiveis sao sempre os
     primeiros, sem buraco no meio. Isso cobre a ordem de saida (o ultimo a
     entrar e o primeiro a sair) sem depender de qual amostra pegou o que. */
  const semBuraco = arr => arr.every((v, i) => !v || arr.slice(0, i).every(Boolean));
  const todas = sequencia.concat(volta);
  ok(todas.every(s => semBuraco(s.visiveis)),
     'em todas as ' + todas.length + ' amostras os visiveis sao os primeiros, sem buraco');

  // e desce de novo: tem de reentrar, nao ficar preso
  await goTo(gTopo + Math.round(gCurso * 0.95));
  await page.waitForTimeout(2000);
  const reentrou = await leCards();
  console.log('    descendo de novo ate t=0.95  ->  cards=' + reentrou.visiveis.map(v => v ? 'X' : '.').join(''));
  ok(reentrou.visiveis.every(Boolean), 'descendo de novo os 3 cards voltam a entrar');

  console.log('\n=== 5d. Telas pequenas: os cards ainda aparecem? ===');
  /* O RISCO desta mudanca: os cards passaram a depender da regua andar, e a
     regua so anda com a secao fixada. No mobile o CSS troca a altura por
     `auto` e o sticky por `static` — sem pin, --t nunca avanca. Se nao
     houvesse um segundo caminho no cardsIn(), os cards ficariam em opacity 0
     para sempre justamente onde ninguem ia testar. */
  const mob = await browser.newPage({ viewport: { width: 390, height: 780 } });
  await mob.goto('http://localhost:8789/', { waitUntil: 'networkidle' });
  await mob.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  const mobGeo = await mob.evaluate(() => {
    const s = document.querySelector('.gains');
    return {
      telas: +(s.offsetHeight / window.innerHeight).toFixed(1),
      sticky: getComputedStyle(document.querySelector('.gains__sticky')).position,
      topo: s.getBoundingClientRect().top + window.scrollY
    };
  });
  console.log('    .gains no mobile: ' + mobGeo.telas + ' telas, sticky=' + mobGeo.sticky);
  // rola ATE DENTRO da secao, e nao so ate perto: a primeira versao parava
  // 100px antes dela, onde nenhum gatilho teria motivo para disparar mesmo.
  await mob.evaluate(y => window.scrollTo(0, y), mobGeo.topo + 200);
  await mob.waitForTimeout(2500);
  const mobCards = await mob.evaluate(() => [...document.querySelectorAll('.gain')].map(c => +getComputedStyle(c).opacity));
  console.log('    opacidade dos cards: ' + mobCards.join(', '));
  ok(mobCards.every(o => o === 1), 'os 3 cards aparecem no mobile mesmo sem a regua');
  await mob.close();

  console.log('\n=== 6. Timeline presa ao scroll ===');
  // recarrega: os blocos acima deixaram a pagina rolada e os cards animados
  await page.goto('http://localhost:8789/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  const topo = await page.evaluate(() => document.querySelector('.gains').offsetTop);
  const alt = await page.evaluate(() => document.querySelector('.gains').offsetHeight);
  const curso = alt - 900;
  const amostras = [];
  for (const frac of [0, 0.25, 0.5, 0.75, 1]) {
    await goTo(topo + curso * frac);
    amostras.push(await page.evaluate(() => {
      const s = document.querySelector('.gains');
      const fill = document.querySelector('.timeline__fill');
      const track = document.querySelector('.timeline__track');
      const atual = [...document.querySelectorAll('.gain')].findIndex(c => c.classList.contains('is-current'));
      const rotulo = [...document.querySelectorAll('.timeline__label')].findIndex(c => c.classList.contains('is-current'));
      return {
        t: parseFloat(getComputedStyle(s).getPropertyValue('--t')),
        pct: Math.round(fill.getBoundingClientRect().width / track.getBoundingClientRect().width * 100),
        card: atual, rotulo
      };
    }));
  }
  amostras.forEach((a, i) => console.log('    scroll ' + (i*25) + '%  ->  --t=' + a.t.toFixed(3) + '  fill=' + a.pct + '%  card ativo=' + a.card + '  rotulo=' + a.rotulo));
  ok(amostras[0].t < 0.02, '--t comeca em 0');
  ok(amostras[4].t > 0.98, '--t chega em 1');
  /* A barra comeca em ZERO. Ate a mudanca da regua ela nascia com 33%
     laranja, porque o primeiro terco era "o capitulo atual" mesmo sem
     ninguem ter rolado. Agora o laranja E o progresso: ele da a partida nos
     cards, entao comecar preenchido seria mentir sobre o que ja aconteceu. */
  ok(amostras[0].pct <= 2, 'fill comeca em 0% (barra toda cinza)');
  ok(amostras[4].pct >= 99, 'fill termina em 100%');
  ok(amostras.every(a => a.card === a.rotulo), 'card e rotulo sempre no mesmo indice');
  ok(amostras[0].card === 0 && amostras[4].card === 2, 'indice vai de 0 a 2');

  console.log('\n=== 7. Filete laranja so no card da vez ===');
  await goTo(topo + curso * 0.1);
  await page.waitForTimeout(400);
  const filetes = await page.evaluate(() => [...document.querySelectorAll('.gain')].map(c =>
    getComputedStyle(c, '::after').opacity));
  console.log('    opacidade dos filetes:', filetes.join(', '));
  ok(parseFloat(filetes[0]) === 1 && parseFloat(filetes[1]) === 0 && parseFloat(filetes[2]) === 0,
     'so o card 1 com filete aceso no inicio');

  /* O hero foi migrado na fase 3. Ate la, este bloco verificava que ele
     continuava no motor antigo; agora verifica o que de fato importa — que
     ele segue funcionando, seja qual for o motor. Quem cobre o hero em
     detalhe e o fase-03.spec.js. */
  console.log('\n=== 8. Hero continua funcionando ===');
  await goTo(0);
  await page.waitForTimeout(1200);
  const hero = await page.evaluate(() => ({
    opacos: [...document.querySelectorAll('.hero [data-reveal]')].filter(e => +getComputedStyle(e).opacity === 1).length,
    total: document.querySelectorAll('.hero [data-reveal]').length,
    p: getComputedStyle(document.documentElement).getPropertyValue('--p').trim()
  }));
  ok(hero.opacos === hero.total, 'os ' + hero.total + ' reveals do hero aparecem (' + hero.opacos + ')');
  ok(hero.p !== '', '--p do showcase continua sendo escrito (' + hero.p + ')');

  console.log('\n=== Erros de runtime ===');
  console.log(errors.length ? errors.join('\n') : '  nenhum');

  await browser.close();
  server.close();
})();
