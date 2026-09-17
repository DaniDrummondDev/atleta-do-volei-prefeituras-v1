/* Seção 5 — a coreografia.
   -----------------------------------------------------------------------
   O que importa aqui NAO e "cada elemento aparece", e sim a ORDEM. O pedido
   foi um ritmo, uma sequencia. Entao o teste varre a secao de ponta a ponta,
   anota em que ponto do scroll cada peca aparece, e cobra a ordem.

   Tudo e raspado pelo scroll, entao tudo tem de desfazer ao subir. A unica
   excecao e o pulso da seta, que e um laco continuo em CSS. */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2','.woff':'font/woff','.gif':'image/gif' };
const server = http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end('x')}res.writeHead(200,{'Content-Type':TYPES[path.extname(p)]||'application/octet-stream'});res.end(b)})});
const ok = (c, m) => console.log((c ? '  PASS  ' : '  FALHA ') + m);

(async () => {
  await new Promise(r => server.listen(8815, r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const erros = [];
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') erros.push(m.type() + ': ' + m.text()); });
  await page.goto('http://localhost:8815/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

  const goTo = async (y) => {
    await page.evaluate(v => new Promise(res => {
      window.scrollTo(0, v);
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res)));
    }), y);
    await page.waitForTimeout(60);
  };

  console.log('=== 1. Estrutura e geometria ===');
  const geo = await page.evaluate(() => {
    const s = document.querySelector('.trans');
    if (!s) return null;
    const stage = s.querySelector('.trans__stage');
    const foto = s.querySelector('.trans__foto').getBoundingClientRect();
    const arcoIn = s.querySelector('.trans__arco--in').getBoundingClientRect();
    const arcoOut = s.querySelector('.trans__arco--out').getBoundingClientRect();
    return {
      telas: +(s.offsetHeight / window.innerHeight).toFixed(1),
      sticky: getComputedStyle(s.querySelector('.trans__sticky')).position,
      isAnime: s.classList.contains('is-anime'),
      semSnap: !s.hasAttribute('data-snap'),
      pills: s.querySelectorAll('.trans__pill').length,
      spots: s.querySelectorAll('.trans__spot').length,
      // os arcos tem de envolver a foto, nas proporcoes dos arquivos
      razaoIn: +(arcoIn.height / foto.height).toFixed(3),
      razaoOut: +(arcoOut.height / foto.height).toFixed(3),
      topo: s.getBoundingClientRect().top + window.scrollY,
      alt: s.offsetHeight
    };
  });
  ok(!!geo, 'a secao 5 existe no documento');
  console.log('    ' + geo.telas + ' telas, sticky=' + geo.sticky
    + ', ' + geo.pills + ' pilulas, ' + geo.spots + ' pontos');
  console.log('    arcos sobre a foto: interno ' + geo.razaoIn + 'x  externo ' + geo.razaoOut + 'x');
  ok(geo.isAnime, 'marcada com .is-anime');
  ok(geo.sticky === 'sticky', 'a secao fixa (o curso da coreografia)');
  ok(geo.semSnap, 'sem data-snap: e mais alta que uma tela, logo continua');
  ok(geo.pills === 5 && geo.spots === 10, '5 pilulas e 10 pontos');
  /* 747/647 = 1.155 e 848/647 = 1.311, as proporcoes reais dos PNGs */
  ok(Math.abs(geo.razaoIn - 1.155) < 0.02, 'arco interno na proporcao do arquivo (1.155)');
  ok(Math.abs(geo.razaoOut - 1.311) < 0.02, 'arco externo na proporcao do arquivo (1.311)');

  console.log('\n=== 1b. Fidelidade a referencia ===');
  /* A referencia e um palco 1000 x 563. A secao reconstroi esse palco e
     posiciona tudo em fracao dele, entao a composicao e a MESMA em qualquer
     tela — so maior ou menor. Os alvos abaixo foram medidos na imagem de
     referencia, em pixels do artboard de 1000.

     Por que isto e um teste e nao so um ajuste: a primeira versao usava o
     .container de 1160px do projeto, e ai a composicao mudava de proporcao a
     cada largura de tela. O circulo saiu pequeno demais e a regua foi parar
     no meio da secao. Medir contra fracoes fixas e o que impede isso de
     voltar sem ninguem notar. */
  const REF = {
    'badge.left':       68/1000,  'badge.top':        54/563,
    'titulo.left':      68/1000,  'titulo.fonte':     34/1000,
    'circulo.centro.x': 585/1000, 'circulo.centro.y': 260/563,
    'circulo.diametro': 340/1000,
    'regua.track.y':    510/563,  'regua.left':       68/1000,
    'ponto1.x':         697/1000, 'ponto1.y':          66/563,
    'arcoOut.direita.x':806/1000
  };
  await goTo(geo.topo + (geo.alt - 900));    // fim da coreografia: tudo visivel
  await page.waitForTimeout(400);
  const medido = await page.evaluate(() => {
    const palco = document.querySelector('.trans__inner').getBoundingClientRect();
    const U = palco.width, H = palco.height;
    const fx = v => (v - palco.left) / U, fy = v => (v - palco.top) / H;
    const r = sel => document.querySelector('.trans ' + sel).getBoundingClientRect();
    const foto = r('.trans__foto'), s1 = r('.trans__spot:nth-child(1) i');
    return {
      razao: +(U / H).toFixed(3),
      cabeNaTela: palco.top >= -1 && palco.bottom <= window.innerHeight + 1,
      v: {
        'badge.left': fx(r('.trans__eyebrow').left), 'badge.top': fy(r('.trans__eyebrow').top),
        'titulo.left': fx(r('.trans__title').left),
        'titulo.fonte': parseFloat(getComputedStyle(document.querySelector('.trans__title')).fontSize) / U,
        'circulo.centro.x': fx(foto.left + foto.width / 2),
        'circulo.centro.y': fy(foto.top + foto.height / 2),
        'circulo.diametro': foto.width / U,
        'regua.track.y': fy(r('.timeline__track').top), 'regua.left': fx(r('.timeline').left),
        'ponto1.x': fx(s1.left + s1.width / 2), 'ponto1.y': fy(s1.top + s1.height / 2),
        'arcoOut.direita.x': fx(r('.trans__arco--out').right)
      }
    };
  });
  ok(Math.abs(medido.razao - 1.776) < 0.01, 'o palco mantem a proporcao da referencia (' + medido.razao + ')');
  ok(medido.cabeNaTela, 'o palco cabe inteiro na tela, sem cortar');
  let pior = 0, piorNome = '';
  for (const [k, alvo] of Object.entries(REF)) {
    const erro = Math.abs(medido.v[k] - alvo);
    if (erro > pior) { pior = erro; piorNome = k; }
  }
  console.log('    pior desvio: ' + (pior * 100).toFixed(2) + '% em ' + piorNome);
  /* 1.5% do palco e a tolerancia: acomoda a imprecisao de ler pixels numa
     captura de referencia, e ainda pega qualquer erro estrutural. */
  ok(pior < 0.015, 'todas as 12 medidas dentro de 1.5% da referencia');

  console.log('\n=== 2. A ordem da coreografia ===');
  const curso = geo.alt - 900;
  const pecas = {
    badge:  '.trans__eyebrow',
    'titulo (1a linha)': '.trans__line:nth-child(1)',
    'titulo "para um"':  '.trans__line:nth-child(3)',
    foto:   '.trans__foto',
    'pilula 1': '.trans__pill:nth-child(1) span',
    'pilula 3 (Rede sociais)': '.trans__pill:nth-child(3) span',
    ANTES:  '.trans__antes span',
    seta:   '.trans__seta',
    logo:   '.trans__logo',
    'arco externo': '.trans__arco--out',
    'ponto 1':  '.trans__spot:nth-child(1) i',
    'rotulo 1': '.trans__spot:nth-child(1) b',
    'ponto 10': '.trans__spot:nth-child(10) i',
    'rotulo 10':'.trans__spot:nth-child(10) b'
  };
  const apareceEm = {};
  const PASSOS = 60;
  for (let k = 0; k <= PASSOS; k++) {
    const f = k / PASSOS;
    await goTo(geo.topo + Math.round(curso * f));
    const vis = await page.evaluate(sels => {
      /* Opacidade EFETIVA: a do elemento multiplicada pela de todos os pais
         ate a secao. Ler so a propria enganaria — um elemento pode estar em
         opacity 1 dentro de um pai em opacity 0, e continuar invisivel. Foi
         exatamente o bug que a primeira versao deste teste deixou passar:
         o CSS escondia o <p> que POSICIONA o "ANTES" em vez do <span> que
         anima, e o teste dizia que estava visivel. */
      const efetiva = (el) => {
        let o = 1, n = el;
        while (n && n !== document.body) {
          o *= +getComputedStyle(n).opacity;
          n = n.parentElement;
        }
        return o;
      };
      const out = {};
      for (const [nome, sel] of Object.entries(sels)) {
        const el = document.querySelector('.trans ' + sel);
        out[nome] = el ? efetiva(el) : -1;
      }
      return out;
    }, pecas);
    for (const [nome, o] of Object.entries(vis)) {
      if (apareceEm[nome] === undefined && o > 0.5) apareceEm[nome] = f;
    }
  }
  const ordem = Object.keys(pecas);
  ordem.forEach(n => console.log('    ' + n.padEnd(26)
    + (apareceEm[n] === undefined ? 'NUNCA' : 'em ' + (apareceEm[n] * 100).toFixed(0) + '% do scroll')));

  ok(ordem.every(n => apareceEm[n] !== undefined), 'todas as pecas aparecem em algum ponto');
  const seq = ordem.map(n => apareceEm[n]);
  const foraDeOrdem = ordem.filter((n, i) => i > 0 && seq[i] < seq[i - 1] - 1e-9);
  ok(foraDeOrdem.length === 0,
     'a ordem da partitura e respeitada' + (foraDeOrdem.length ? ' — fora de ordem: ' + foraDeOrdem.join(', ') : ''));
  ok(apareceEm['foto'] >= apareceEm['titulo "para um"'] - 1e-9,
     'a foto so comeca a partir da linha "para um"');
  ok(apareceEm['ANTES'] >= apareceEm['pilula 3 (Rede sociais)'] - 1e-9,
     'ANTES entra depois da pilula "Rede sociais"');
  ok(apareceEm['logo'] >= apareceEm['seta'] - 1e-9, 'o logo entra depois da seta');
  ok(apareceEm['ponto 10'] > apareceEm['ponto 1'], 'os pontos entram em sequencia, nao juntos');

  console.log('\n=== 3. A regua de baixo enche junto ===');
  const barra = [];
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    await goTo(geo.topo + Math.round(curso * f));
    barra.push(await page.evaluate(() => {
      const s = document.querySelector('.trans');
      const fill = s.querySelector('.timeline__fill').getBoundingClientRect().width;
      const track = s.querySelector('.timeline__track').getBoundingClientRect().width;
      return { t: parseFloat(getComputedStyle(s).getPropertyValue('--t')), pct: +(fill / track).toFixed(3) };
    }));
  }
  barra.forEach((b, i) => console.log('    scroll ' + (i * 25) + '%  ->  --t=' + b.t.toFixed(3) + '  barra=' + (b.pct * 100).toFixed(0) + '%'));
  ok(barra[0].pct < 0.02, 'a barra comeca cinza');
  ok(barra[4].pct > 0.98, 'a barra termina cheia');
  ok(barra.every((b, i) => i === 0 || b.pct >= barra[i - 1].pct), 'a barra so cresce enquanto desce');
  const atual = await page.evaluate(() => {
    const ls = [...document.querySelectorAll('.trans .timeline__label')];
    return ls.findIndex(l => l.classList.contains('is-current'));
  });
  ok(atual === 1, 'o capitulo atual e "A transformacao" (indice ' + atual + ')');

  console.log('\n=== 4. O pulso da seta ===');
  await goTo(geo.topo + Math.round(curso * 0.4));
  const antesDoPulso = await page.evaluate(() => document.querySelector('.trans__seta').classList.contains('is-pulsando'));
  await goTo(geo.topo + Math.round(curso * 0.9));
  const depoisDoPulso = await page.evaluate(() => ({
    classe: document.querySelector('.trans__seta').classList.contains('is-pulsando'),
    anim: getComputedStyle(document.querySelector('.trans__seta img')).animationName
  }));
  ok(!antesDoPulso, 'a seta nao pulsa antes de entrar');
  ok(depoisDoPulso.classe && depoisDoPulso.anim === 'seta-pulso', 'a seta pulsa depois de entrar (' + depoisDoPulso.anim + ')');

  console.log('\n=== 5. Subindo, a coreografia desfaz ===');
  await goTo(geo.topo);
  const noInicio = await page.evaluate(() => {
    const s = document.querySelector('.trans');
    const alvos = ['.trans__eyebrow', '.trans__foto', '.trans__logo', '.trans__spot:nth-child(10) b'];
    return {
      t: parseFloat(getComputedStyle(s).getPropertyValue('--t')),
      opacidades: alvos.map(a => +getComputedStyle(s.querySelector(a)).opacity),
      pulso: s.querySelector('.trans__seta').classList.contains('is-pulsando')
    };
  });
  console.log('    de volta ao topo: --t=' + noInicio.t.toFixed(3) + '  opacidades=' + noInicio.opacidades.join(', '));
  ok(noInicio.t < 0.01, '--t volta a zero');
  ok(noInicio.opacidades.every(o => o < 0.05), 'as pecas voltam a ficar invisiveis');
  ok(!noInicio.pulso, 'o pulso desliga ao voltar');

  console.log('\n=== Erros de runtime ===');
  const rel = erros.filter(e => !e.includes('favicon') && !e.includes('video') && !e.includes('media'));
  console.log(rel.length ? rel.map(e => '    ' + e.slice(0, 140)).join('\n') : '    nenhum');
  ok(rel.length === 0, 'console limpo');

  await browser.close(); server.close();
})();
