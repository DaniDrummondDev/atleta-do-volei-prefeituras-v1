const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2','.woff':'font/woff','.gif':'image/gif' };
/* O servidor tem duas rotas:
     /            -> a pagina como ela e
     /anime-ausente -> a mesma pagina, apontando Anime.js para um asset ausente.
   A segunda simula a indisponibilidade do arquivo local sem depender de rede
   ou de cache do navegador. */
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/anime-ausente') {
    let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    html = html.replace('assets/js/vendor/anime.umd.min.js', 'assets/js/vendor/anime.umd.min.missing.js');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(html);
  }
  const p = path.join(ROOT, url === '/' ? 'index.html' : url);
  fs.readFile(p, (e, b) => {
    if (e) { res.writeHead(404); return res.end('x'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
    res.end(b);
  });
});
const ok = (c, m) => console.log((c ? '  PASS  ' : '  FALHA ') + m);

(async () => {
  await new Promise(r => server.listen(8793, r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });

  // ---- A. pagina normal: a biblioteca ainda reclama de alguma coisa? ----
  console.log('=== A. Avisos da biblioteca com o codigo corrigido ===');
  let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const msgs = [];
  page.on('console', m => msgs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => msgs.push('pageerror: ' + e.message));
  await page.goto('http://localhost:8793/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.gains').getBoundingClientRect().top + window.scrollY - 300));
  await page.waitForTimeout(1500);
  const relevantes = msgs.filter(m => !m.includes('favicon') && !m.includes('video'));
  console.log(relevantes.length ? relevantes.map(m => '    ' + m.slice(0,140)).join('\n') : '    nenhum');
  ok(relevantes.length === 0, 'console limpo (sem aviso de ease removido)');
  await page.close();

  /* ---- B. biblioteca indisponivel: a pagina ainda serve? ----

     ATE A FASE 3 este bloco verificava outra coisa: que o motor antigo do
     main.js assumia a pagina inteira. A fase 4 removeu esse motor — a decisao
     foi ficar so com o bundle local —, entao o contrato mudou.

     O contrato de hoje: sem a biblioteca a pagina NAO anima, mas tambem NAO
     quebra. Isso importa porque o CSS esconde de proposito tudo que vai ser
     animado (opacity 0, para nao haver flash antes do script chegar) e as
     seçoes 1 e 4 tem varios viewports de altura so para servir de curso as
     animaçoes. Sem rede, o resultado nao seria "sem animaçao": seria pagina
     em branco com rolagem vazia. A rede e a classe .sem-anime, posta pelo
     main.js e atendida pela seçao 6c do style.css.                        */
  console.log('\n=== B. Biblioteca local indisponivel — a pagina ainda serve? ===');
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const err2 = [];
  page.on('pageerror', e => err2.push(e.message));
  await page.goto('http://localhost:8793/anime-ausente', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

  const semLib = await page.evaluate(() => ({
    anime: typeof window.anime,
    semAnime: document.documentElement.classList.contains('sem-anime'),
    isAnime: !!document.querySelector('.is-anime')
  }));
  ok(semLib.anime === 'undefined', 'window.anime indefinido (asset local indisponivel)');
  ok(semLib.semAnime, 'o <html> recebeu a classe .sem-anime');
  ok(semLib.isAnime === false, 'nenhuma secao marcada como .is-anime');

  // 1. TODO o conteudo animavel tem de estar visivel
  const conteudo = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-reveal], [data-enter]')];
    const invisiveis = els.filter(e => +getComputedStyle(e).opacity < 1);
    return {
      total: els.length,
      invisiveis: invisiveis.length,
      quais: invisiveis.slice(0, 4).map(e => e.className.split(' ')[0] || e.tagName)
    };
  });
  ok(conteudo.invisiveis === 0,
     'os ' + conteudo.total + ' elementos animaveis estao visiveis'
     + (conteudo.invisiveis ? ' — invisiveis: ' + conteudo.quais.join(', ') : ''));

  /* 2. As secoes altas nao podem deixar tela de rolagem VAZIA.

     Medir so a altura nao serve: com .sem-anime o .showcase fica com ~2 telas,
     mas sao 2 telas de CONTEUDO — os dois celulares empilhados a 92vw de
     largura, mais a .bridge. Rolagem vazia e outra coisa: e altura reservada
     para servir de curso a uma animacao que nao vai acontecer.

     O que define isso e o PIN. Com a biblioteca, .gains tem altura fixa de
     260vh e um filho sticky; .showcase, idem. Sem ela, os dois precisam
     voltar ao fluxo normal — e ai a altura passa a ser ditada pelo conteudo,
     qualquer que seja. */
  const pins = await page.evaluate(() => {
    const vh = window.innerHeight;
    return {
      gainsSticky: getComputedStyle(document.querySelector('.gains__sticky')).position,
      gainsAltura: document.querySelector('.gains').offsetHeight / vh,
      stageSticky: getComputedStyle(document.querySelector('.showcase__stage')).position,
      showcaseAltura: document.querySelector('[data-showcase]').offsetHeight / vh
    };
  });
  console.log('    .gains__sticky position=' + pins.gainsSticky + ' (' + pins.gainsAltura.toFixed(1) + ' telas)');
  console.log('    .showcase__stage position=' + pins.stageSticky + ' (' + pins.showcaseAltura.toFixed(1) + ' telas)');
  ok(pins.gainsSticky === 'static', '.gains__sticky soltou o pin');
  ok(pins.stageSticky === 'static', '.showcase__stage soltou o pin');
  ok(pins.gainsAltura < 2, '.gains voltou a altura de conteudo (' + pins.gainsAltura.toFixed(1) + ' telas, contra 2.6 com a lib)');

  // 3. os contadores nao podem ficar em zero
  const nums = await page.evaluate(() => [...document.querySelectorAll('[data-count]')]
    .map(e => ({ alvo: e.dataset.count, texto: e.textContent.trim() })));
  console.log('    contadores: ' + nums.map(n => n.texto + '/' + n.alvo).join('  '));
  ok(nums.every(n => n.texto === n.alvo), 'contadores mostram o numero final, nao zero');

  // 4. a secao 5 tambem: a coreografia nao roda, mas tem de aparecer
  const secao5 = await page.evaluate(() => {
    const s = document.querySelector('.trans');
    const efetiva = (el) => { let o = 1, n = el;
      while (n && n !== document.body) { o *= +getComputedStyle(n).opacity; n = n.parentElement; } return o; };
    const alvos = ['.trans__eyebrow', '.trans__foto', '.trans__logo', '.trans__spot:nth-child(10) b', '.trans__antes span'];
    return {
      sticky: getComputedStyle(s.querySelector('.trans__sticky')).position,
      invisiveis: alvos.filter(a => efetiva(s.querySelector(a)) < 0.9).length,
      total: alvos.length
    };
  });
  ok(secao5.sticky === 'static', '.trans__sticky soltou o pin');
  ok(secao5.invisiveis === 0, 'as ' + secao5.total + ' pecas da secao 5 estao visiveis');

  // 5. a secao 4 continua legivel
  const secao4 = await page.evaluate(() => ({
    filete: getComputedStyle(document.querySelector('.gain'), '::after').opacity,
    fill: document.querySelector('.timeline__fill').getBoundingClientRect().width
        / document.querySelector('.timeline__track').getBoundingClientRect().width
  }));
  ok(parseFloat(secao4.filete) === 1, 'filetes dos cards acesos');
  ok(secao4.fill > 0.99, 'a linha do tempo aparece cheia (' + (secao4.fill * 100).toFixed(0) + '%)');

  ok(err2.length === 0, 'sem erro de runtime com a lib ausente' + (err2.length ? ': ' + err2[0] : ''));

  await browser.close(); server.close();
})();
