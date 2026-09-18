/* Encaixe de rolagem (scroll snap).
   -----------------------------------------------------------------------
   A REGRA: encaixa so a secao de EXATAMENTE uma tela. Tudo que passa de
   100vh e continuo — nem no meio, nem na chegada.

   O motivo: uma secao mais alta que a tela e mais alta de proposito, porque
   a altura extra e o curso de rolagem de uma animacao (--p, --reel, o video,
   --e, --t). Nelas nao existe "posicao certa" para encaixar: cada pixel e um
   quadro. Encaixar seria escolher um quadro pela pessoa.

   Este teste cobra tres coisas:
     1. so [data-snap] tem ponto de encaixe;
     2. todo [data-snap] cabe mesmo em uma tela (senao o atributo esta no
        lugar errado e a regra foi violada sem ninguem perceber);
     3. as secoes altas sao continuas de ponta a ponta. */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2','.woff':'font/woff','.gif':'image/gif' };
const server = http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end('x')}res.writeHead(200,{'Content-Type':TYPES[path.extname(p)]||'application/octet-stream'});res.end(b)})});
const ok = (c, m) => console.log((c ? '  PASS  ' : '  FALHA ') + m);

(async () => {
  await new Promise(r => server.listen(8805, r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const erros = [];
  page.on('pageerror', e => erros.push(e.message));
  await page.goto('http://localhost:8805/', { waitUntil: 'networkidle' });

  /* Rola e espera o encaixe ACONTECER, se for acontecer. Sem scroll-behavior
     forcado para `auto` aqui, de proposito: queremos o comportamento real da
     pagina, encaixe animado incluso. */
  const parar = async (y) => {
    /* Espera a rolagem ASSENTAR, em vez de um tempo fixo. A pagina tem
       scroll-behavior: smooth, entao um window.scrollTo longo leva centenas
       de ms; medir antes disso confunde "ainda chegando" com "o encaixe
       puxou". Foi o que aconteceu na primeira versao deste teste, que acusou
       2 a 6px de movimento onde nao havia encaixe nenhum. */
    await page.evaluate(v => window.scrollTo(0, v), y);
    return page.evaluate(() => new Promise(res => {
      /* Sao DUAS animacoes em sequencia: primeiro o scrollTo suave chega ao
         destino, depois o navegador decide encaixar e anima de novo. Entre
         elas existe um PLATO de alguns frames parados.

         Por isso nao basta "parou por 4 frames": a primeira versao deste
         teste media no plato, achava que tinha assentado e reportava
         posicoes que ainda iam mudar — passava sozinho e falhava em lote.

         Agora exige 12 frames parados (~200ms, bem mais que o plato) E um
         minimo de 500ms de espera total, que cobre a decisao de encaixar. */
      const inicio = performance.now();
      let anterior = -1, iguais = 0;
      (function olha() {
        const atual = Math.round(window.scrollY);
        iguais = (atual === anterior) ? iguais + 1 : 0;
        anterior = atual;
        const tempo = performance.now() - inicio;
        if ((iguais >= 12 && tempo > 500) || tempo > 3000) return res(atual);
        requestAnimationFrame(olha);
      })();
    }));
  };

  const secoes = await page.evaluate(() => {
    const vh = window.innerHeight;
    return ['.hero', '.social', '.features', '.gains', '.trans', '.plat'].map(sel => {
      const el = document.querySelector(sel);
      return {
        sel,
        topo: Math.round(el.getBoundingClientRect().top + window.scrollY),
        telas: +(el.offsetHeight / vh).toFixed(1)
      };
    });
  });
  console.log('=== Geometria ===');
  secoes.forEach(s => console.log('  ' + s.sel.padEnd(11) + 'topo y=' + String(s.topo).padEnd(7) + s.telas + ' telas'));

  console.log('\n=== 1. Quem encaixa e quem nao encaixa ===');
  const css = await page.evaluate(() => {
    const vh = window.innerHeight;
    return {
      tipo: getComputedStyle(document.documentElement).scrollSnapType,
      secoes: ['.hero', '.social', '.features', '.gains', '.trans', '.plat'].map(sel => {
        const el = document.querySelector(sel);
        return {
          sel,
          telas: +(el.offsetHeight / vh).toFixed(1),
          marcada: el.hasAttribute('data-snap'),
          encaixa: getComputedStyle(el).scrollSnapAlign.startsWith('start')
        };
      })
    };
  });
  /* O Chrome normaliza `y proximity` para `y` no valor computado, porque
     `proximity` e o valor inicial da forca. Entao "nao contem mandatory" e a
     verificacao correta; procurar a palavra `proximity` acusaria falha num
     CSS certo — foi o que a primeira versao deste teste fez. */
  ok(css.tipo.startsWith('y'), 'html com scroll-snap-type no eixo y (computado: "' + css.tipo + '")');
  ok(!css.tipo.includes('mandatory'), 'NAO e mandatory — ver o comentario na secao 1b do style.css');

  css.secoes.forEach(s => console.log('  ' + s.sel.padEnd(11) + s.telas + ' telas   '
    + (s.encaixa ? 'ENCAIXA' : 'continua')));

  const umaTelaCss = css.secoes.filter(s => s.telas <= 1.05);
  const altasCss = css.secoes.filter(s => s.telas > 1.05);
  ok(umaTelaCss.every(s => s.encaixa),
     'as secoes de uma tela encaixam (' + umaTelaCss.map(s => s.sel).join(', ') + ')');
  ok(altasCss.every(s => !s.encaixa),
     'nenhuma secao maior que 100vh encaixa (' + altasCss.map(s => s.sel).join(', ') + ')');

  /* Guarda contra desvio: se alguem marcar com data-snap uma secao que cresceu
     alem de uma tela, a regra estaria violada sem sintoma visivel. */
  const marcadasAltas = css.secoes.filter(s => s.marcada && s.telas > 1.05);
  ok(marcadasAltas.length === 0,
     'nenhum data-snap em secao maior que uma tela'
     + (marcadasAltas.length ? ' — sobrando em: ' + marcadasAltas.map(s => s.sel + ' (' + s.telas + ' telas)').join(', ') : ''));

  console.log('\n=== 2. A secao de uma tela: corrige o desalinhamento? ===');
  const deUmaTela = secoes.filter(s => s.telas <= 1.05);
  let corrigiu = 0, tentativas = 0;
  for (const s of deUmaTela) {
    for (const desvio of [-150, -60, -15, 15, 60, 150]) {
      const alvo = s.topo + desvio;
      if (alvo < 0) continue;
      const parou = await parar(alvo);
      const erroDepois = Math.abs(parou - s.topo);
      tentativas++;
      if (erroDepois <= 2) corrigiu++;
      console.log('  ' + s.sel.padEnd(11) + 'parou ' + String(desvio).padStart(5) + 'px fora  ->  '
        + (erroDepois <= 2 ? 'encaixou' : 'ficou a ' + erroDepois + 'px'));
    }
  }
  console.log('  encaixou em ' + corrigiu + ' de ' + tentativas);
  ok(corrigiu === tentativas, 'a secao de uma tela encaixa com ate 150px de desvio, dos dois lados');

  console.log('\n=== 3. As secoes altas sao continuas de ponta a ponta ===');
  /* O teste que protege as animacoes presas ao scroll. Nao basta checar o
     meio: a CHEGADA tambem tem de ser continua, que e o que mudou nesta
     versao. Antes as secoes altas tinham ponto de encaixe na borda de cima e
     corrigiam ate 300px na aproximacao — util para secoes comuns, errado
     para estas, onde cada pixel de rolagem e um quadro de animacao. */
  const altas = secoes.filter(s => s.telas > 1.05);
  let livres = 0, checagens = 0;
  for (const s of altas) {
    const pontos = [-150, -60, -15, 15, 60, 200, Math.round(s.telas * 900 / 2)];
    for (const d of pontos) {
      const alvo = s.topo + d;
      if (alvo < 0) continue;
      const parou = await parar(alvo);
      const moveu = Math.abs(parou - alvo);
      checagens++;
      if (moveu <= 2) livres++;
      const onde = d < 0 ? String(d) + 'px antes ' : String(d).padStart(5) + 'px dentro';
      console.log('  ' + s.sel.padEnd(11) + onde.padStart(14) + '  ->  '
        + (moveu <= 2 ? 'nao foi movido' : 'MOVEU ' + moveu + 'px'));
    }
  }
  ok(livres === checagens,
     'as ' + altas.length + ' secoes altas nunca sao movidas (' + livres + '/' + checagens + ')');

  console.log('\n=== 4. As animacoes presas ao scroll continuam alcancaveis ===');
  /* Se o encaixe puxasse de dentro do .showcase, --p nunca assumiria valores
     intermediarios e o scrub do video e os celulares ficariam inacessiveis. */
  const showcase = await page.evaluate(() => {
    const s = document.querySelector('[data-showcase]');
    return { topo: Math.round(s.getBoundingClientRect().top + window.scrollY), alt: s.offsetHeight };
  });
  const curso = showcase.alt - 900;
  const valores = [];
  for (const frac of [0.25, 0.5, 0.75]) {
    await parar(showcase.topo + Math.round(curso * frac));
    valores.push(await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--p'))));
  }
  console.log('  --p nos pontos 25/50/75% do palco: ' + valores.map(v => v.toFixed(3)).join('  '));
  ok(valores.every(v => v > 0.01 && v < 0.99), '--p assume valores intermediarios (o scrub e alcancavel)');
  ok(valores[0] < valores[1] && valores[1] < valores[2], '--p cresce de forma monotona');

  // e a timeline da secao 4
  const gains = secoes.find(s => s.sel === '.gains');
  const ts = [];
  for (const frac of [0.25, 0.5, 0.75]) {
    await parar(gains.topo + Math.round((gains.telas * 900 - 900) * frac));
    ts.push(await page.evaluate(() =>
      parseFloat(getComputedStyle(document.querySelector('.gains')).getPropertyValue('--t'))));
  }
  console.log('  --t nos pontos 25/50/75% da secao 4: ' + ts.map(v => v.toFixed(3)).join('  '));
  ok(ts.every(v => v > 0.01 && v < 0.99), '--t assume valores intermediarios (a timeline e alcancavel)');

  console.log('\n=== 5. Movimento reduzido desliga o encaixe ===');
  const pageRM = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageRM.emulateMedia({ reducedMotion: 'reduce' });
  await pageRM.goto('http://localhost:8805/', { waitUntil: 'networkidle' });
  const tipoRM = await pageRM.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType);
  ok(tipoRM === 'none', 'com prefers-reduced-motion o encaixe sai (' + tipoRM + ')');
  await pageRM.close();

  console.log('\n=== Erros de runtime ===');
  console.log(erros.length ? erros.map(e => '    ' + e.slice(0, 120)).join('\n') : '    nenhum');
  ok(erros.length === 0, 'console limpo');

  await browser.close(); server.close();
})();
