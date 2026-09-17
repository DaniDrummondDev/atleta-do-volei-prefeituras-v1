/* =========================================================
   SEÇÃO 7 — teste da coreografia do carrossel (sem navegador)
   ---------------------------------------------------------
   bene.js não desenha: ele escreve --on e --y em cada bloco, e o CSS resolve.
   Isso é lógica pura, e é onde mora o que pode dar errado sem aparecer:

     · a troca é SEQUENCIAL (um sai, DEPOIS o outro entra) e nunca cruzada;
     · em cima de um slide, só ele está visível, e inteiro;
     · as fotos, ao contrário dos textos, fazem crossfade (somam 1);
     · o último slide chega a 100% no fim do curso, não antes;
     · subir desfaz exatamente o que descer fez.

   O que ele NÃO cobre: posições, tamanhos e proporções — isso é CSS lido da
   referência, e precisa de olho ou de Playwright.

   COMO RODAR:
     npm i jsdom && node tests/bene.node.mjs
   ========================================================= */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(raiz + '/index.html', 'utf8');
const src = fs.readFileSync(raiz + '/assets/js/anim/bene.js', 'utf8');

const ok = [];
const falha = [];
const t = (nome, cond, extra = '') => (cond ? ok : falha).push(nome + (extra ? ` [${extra}]` : ''));

const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
const { window } = dom;
const { document } = window;

const secao = document.querySelector('[data-anime="bene"]');
const ALTURA = 500, TELA = 100;          // 5 telas de 100 unidades
Object.defineProperty(secao, 'offsetHeight', { value: ALTURA });
Object.defineProperty(window, 'innerHeight', { value: TELA, writable: true });

// o scroll e simulado movendo o retangulo da secao
let topo = 0;
secao.getBoundingClientRect = () => ({ top: topo, bottom: topo + ALTURA, left: 0, width: 0, height: ALTURA });
window.requestAnimationFrame = fn => fn();

window.eval(src);

/** posiciona o scroll em p (0..1) e devolve o estado pintado */
function em(p) {
  topo = -p * (ALTURA - TELA);
  window.dispatchEvent(new window.Event('scroll'));

  const ler = sel => [...document.querySelectorAll(sel)].map(el => ({
    on: parseFloat(el.style.getPropertyValue('--on')),
    y: el.style.getPropertyValue('--y'),
  }));
  return {
    textos: ler('.bene__text'),
    fotos: ler('.bene__card'),
    legendas: ler('.bene__cap'),
    palavras: ler('.bene__word'),
    aceso: [...document.querySelectorAll('.bene__rail-i')].findIndex(e => e.classList.contains('is-on')),
    marca: parseFloat(document.querySelector('.bene__rail-mark').style.getPropertyValue('--f')),
  };
}

// ---- estrutura ----
t('cinco slides em todos os grupos',
  ['.bene__card', '.bene__text', '.bene__cap', '.bene__word', '.bene__rail-i']
    .every(sel => document.querySelectorAll(sel).length === 5));
t('cinco degraus de encaixe, todos com data-snap',
  document.querySelectorAll('.bene__step[data-snap]').length === 5);

// ---- em cima de cada slide: so ele, e inteiro ----
for (let i = 0; i < 5; i++) {
  const e = em(i / 4);
  const visiveis = e.textos.filter(x => x.on > 0.001).length;
  t(`slide ${i}: so um texto visivel`, visiveis === 1, `${visiveis} visiveis`);
  t(`slide ${i}: e o texto certo, em opacidade cheia`, e.textos[i].on === 1, String(e.textos[i].on));
  t(`slide ${i}: sem deslocamento`, /\* 0\.000\)$/.test(e.textos[i].y), e.textos[i].y);
  t(`slide ${i}: numero ${i + 1} aceso no trilho`, e.aceso === i, String(e.aceso));
  t(`slide ${i}: filete do trilho em ${i}`, Math.abs(e.marca - i) < 1e-6, String(e.marca));
}

// ---- a troca e SEQUENCIAL: nunca dois textos no ar ao mesmo tempo ----
let maxJuntos = 0, somaMax = 0;
for (let p = 0; p <= 1.0001; p += 0.002) {
  const e = em(p);
  const juntos = e.textos.filter(x => x.on > 0.01).length;
  const soma = e.textos.reduce((a, x) => a + x.on, 0);
  if (juntos > maxJuntos) maxJuntos = juntos;
  if (soma > somaMax) somaMax = soma;
}
t('nunca dois textos visiveis ao mesmo tempo', maxJuntos <= 1, `pico ${maxJuntos}`);
t('a soma das opacidades nunca passa de 1', somaMax <= 1.0001, somaMax.toFixed(3));

// ---- no meio de uma troca: o que sai ja foi, o que entra ainda nao veio ----
const meio = em(0.5 / 4 + 0.175 / 4);   // f ~= 0.675, entre SAINDO(0.70) e o proximo
t('existe um instante sem texto nenhum',
  (() => { for (let p = 0; p <= 1; p += 0.001) if (em(p).textos.every(x => x.on < 0.01)) return true; return false; })());

// ---- as legendas e as palavras seguem os textos, no mesmo compasso ----
const amostra = em(0.13);
t('legenda acompanha o texto', amostra.legendas.every((c, i) => Math.abs(c.on - amostra.textos[i].on) < 1e-9));
t('palavra acompanha o texto', amostra.palavras.every((c, i) => Math.abs(c.on - amostra.textos[i].on) < 1e-9));

// ---- as FOTOS sao o caso oposto: crossfade, somando 1 ----
let somaFotoMin = 9, somaFotoMax = 0;
for (let p = 0; p <= 1.0001; p += 0.002) {
  const soma = em(p).fotos.reduce((a, x) => a + x.on, 0);
  if (soma < somaFotoMin) somaFotoMin = soma;
  if (soma > somaFotoMax) somaFotoMax = soma;
}
t('as fotos sempre somam 1 (crossfade, nunca um buraco)',
  somaFotoMin > 0.999 && somaFotoMax < 1.001, `${somaFotoMin.toFixed(3)}..${somaFotoMax.toFixed(3)}`);

// ---- o texto que sai desce; o que entra vem de baixo ----
const saindo = em((0.55) / 4);           // f = 0.55: slide 0 esta saindo
const fator = s => parseFloat(s.match(/\* ([\d.]+)\)/)[1]);
t('o texto que sai esta descendo (y > 0)', fator(saindo.textos[0].y) > 0, saindo.textos[0].y);
t('o texto que sai esta sumindo', saindo.textos[0].on < 1 && saindo.textos[0].on > 0);
const entrando = em((0.85) / 4);         // f = 0.85: slide 1 esta entrando
t('o que entra vem de baixo (y > 0, indo a 0)', fator(entrando.textos[1].y) > 0, entrando.textos[1].y);
t('o que entra esta aparecendo', entrando.textos[1].on > 0 && entrando.textos[1].on < 1);
t('quem saiu ja nao esta mais la', entrando.textos[0].on === 0);

// ---- bordas ----
t('antes da secao, primeiro slide inteiro', em(-0.5).textos[0].on === 1);
t('depois da secao, ultimo slide inteiro', em(1.5).textos[4].on === 1);

// ---- subir desfaz exatamente o que descer fez ----
const ida = em(0.37);
em(1); em(0);
const volta = em(0.37);
t('subir devolve o mesmo estado', JSON.stringify(ida) === JSON.stringify(volta));

/* ---------------------------------------------------------
   GEOMETRIA DO PAINEL — contra a referência de 1051 x 590

   Isto não é zelo: foi o que quebrou. As medidas dentro do .bene__panel
   estavam em %, e porcentagem horizontal ali resolve contra o PAINEL (36,9%
   do palco), não contra o palco. A foto saiu com 10,4% em vez de 28,25% —
   quase três vezes menor — e arrastou junto a logo e a legenda, que
   dependiam de cair em cima dela.

   O jsdom não calcula layout, então não dá para medir o resultado. Mas dá
   para ler os fatores do CSS e refazer a conta, que é onde o erro estava. */
const css = fs.readFileSync(raiz + '/assets/css/style.css', 'utf8');
const bloco = css.slice(css.indexOf('.bene__card {'), css.indexOf('.bene__right {'));
const semComentario = bloco.replace(/\/\*[\s\S]*?\*\//g, '');

t('nenhuma medida horizontal em % dentro do painel',
  !semComentario.split('\n').some(l => /^\s*(left|right|width)\s*:\s*(?!100%)[\d.]+%/.test(l)),
  'porcentagem ali resolve contra o painel, nao contra o palco');

const fatorU = (regra, prop) => {
  const r = bloco.slice(bloco.indexOf(regra));
  const m = r.slice(0, r.indexOf('}')).match(new RegExp(prop + ':\\s*calc\\(var\\(--u\\) \\* ([\\d.]+)\\)'));
  return m ? parseFloat(m[1]) : NaN;
};

const U = 1051, ALT = U / 1.7797, px = f => f * U;
const foto = { l: px(fatorU('.bene__card {', 'left')), t: px(fatorU('.bene__card {', 'top')), w: px(fatorU('.bene__card {', 'width')) };
foto.h = foto.w / (556 / 946);
const logo = { l: px(fatorU('.bene__logo {', 'left')), b: px(fatorU('.bene__logo {', 'bottom')), w: px(fatorU('.bene__logo {', 'width')) };
const cap = { l: px(fatorU('.bene__cap {', 'left')), w: px(fatorU('.bene__cap {', 'width')), b: px(fatorU('.bene__cap {', 'bottom')) };
const PAINEL = 0.369 * U;
const perto = (a, b, tol = 2) => Math.abs(a - b) <= tol;

t('foto: 297 x 505 na referencia', perto(foto.w, 297) && perto(foto.h, 505),
  `${foto.w.toFixed(0)} x ${foto.h.toFixed(0)}`);
t('foto: cabe no painel', foto.l + foto.w < PAINEL, `${(foto.l + foto.w).toFixed(0)} < ${PAINEL.toFixed(0)}`);
t('foto: ocupa a maior parte do painel (>70%)', foto.w / PAINEL > 0.7,
  (100 * foto.w / PAINEL).toFixed(0) + '% do painel');
t('logo: 38px, alinhada com a legenda', perto(logo.w, 38) && perto(logo.l, cap.l));
t('logo: fica SOBRE a foto', foto.t < ALT - logo.b - logo.w && ALT - logo.b < foto.t + foto.h);
t('legenda: nao passa da largura da foto', cap.l + cap.w <= foto.l + foto.w + 2);

/* O bloco logo+legenda desceu a pedido do cliente e a legenda passou a
   encostar no pé da foto. O que ainda tem de valer:
     · não vazar pelo pé do painel;
     · não subir por cima do logo — o vão entre os dois é parte do desenho. */
const capT = 0.0124 * U, capD = 0.0105 * U;
const capAlt = capT + 0.5 * capT + capD * 1.45 * 2;     // titulo + margem + 2 linhas
const capTopo = ALT - cap.b - capAlt, logoBase = ALT - logo.b;

t('legenda: nao vaza pelo pe do painel', ALT - cap.b < ALT,
  `base ${(ALT - cap.b).toFixed(0)} < ${ALT.toFixed(0)}`);
t('legenda: sobra respiro abaixo dela', ALT - (ALT - cap.b) > 20,
  `${(cap.b).toFixed(0)}px de folga`);
t('logo e legenda nao se sobrepoem', capTopo > logoBase,
  `vao de ${(capTopo - logoBase).toFixed(0)}px`);

/* ----- a palavra deitada, ancorada pela BASE das letras -----
   O pedido foi explícito: a base encostada na divisão preto/branco, mesmo que
   a perna do "p" e a cedilha do "ç" passem dela. Isso depende de duas coisas
   andarem juntas, e uma delas é fácil de desfazer sem perceber. */
const wordCss = css.slice(css.indexOf('.bene__word {'));
const wordBloco = wordCss.slice(0, wordCss.indexOf('}'));

t('palavra: ancorada na divisao (.369u) e nao no meio da coluna',
  /left:\s*calc\(var\(--u\) \* \.369 - var\(--descida\) - var\(--folga\)\)/.test(wordBloco),
  'sem isto a base das letras nao para na divisao');

/* --descida É MEDIDA, não escolhida. Lida de
   assets/fonts/TT Firs Neue Trial Regular.woff (unitsPerEm 1000):
     ascent .950em  descent .340em  capHeight .700em
   Com line-height: 1 o meio-entrelinha é (1 - 1.29)/2 = -0.145em, a base cai
   a 0.805em do topo da caixa, e o recuo do centro é 0.805 - 0.5 = 0.305em.
   Chutar aqui foi o que pôs as letras passando da divisão. */
const BASE_FONTE = 0.305;
const dDescida = parseFloat((wordBloco.match(/--descida:\s*([\d.]+)em/) || [])[1]);
const dFolga = parseFloat((wordBloco.match(/--folga:\s*([\d.]+)em/) || [])[1]);
const corpo = 0.70;      // capHeight da fonte

t('palavra: --descida bate com a metrica da fonte (.305em)',
  Math.abs(dDescida - BASE_FONTE) < 0.005, `${dDescida}em`);
t('palavra: --folga declarada (o respiro, o unico numero de gosto)',
  dFolga >= 0, `${dFolga}em`);

/* Onde a base cai, em em de fonte, medido da divisão (negativo = para dentro
   do preto). Duas cobranças opostas, e é entre elas que o desenho vive. */
const baseNaDivisao = BASE_FONTE - dDescida - dFolga;
t('palavra: a base NAO passa da divisao (letra normal nao vaza pro branco)',
  baseNaDivisao <= 0.001, `${(baseNaDivisao).toFixed(3)}em depois da divisao`);
t('palavra: a base nao recua demais (continua encostada)',
  baseNaDivisao > -0.15, `${(-baseNaDivisao).toFixed(3)}em para dentro`);
t('palavra: o corpo das letras fica todo no preto',
  baseNaDivisao - corpo < 0, 'cap height inteira dentro do painel');

const painelBloco = css.slice(css.indexOf('.bene__panel {'), css.indexOf('.bene__card {'));
t('painel NAO apara o que vaza (as descidas das letras passam da divisao)',
  !/overflow:\s*hidden/.test(painelBloco.replace(/\/\*[\s\S]*?\*\//g, '')),
  'overflow: hidden cortaria a perna do p e a cedilha do c');

/* ---------------------------------------------------------
   O PALCO EM JANELAS REAIS

   Foi a segunda coisa a quebrar, e por um motivo que não aparece numa tela só:
   o palco era dimensionado para COBRIR a janela, então numa janela mais larga
   que 16:9 ele ficava mais ALTO que ela e o recorte comia a margem de cima da
   foto. Parecia padding faltando.

   E janela mais larga que 16:9 é o caso COMUM, não a exceção: a barra do
   navegador come altura, e um monitor 1920x1080 entrega ~1889x955, que é 1.98.

   Então o teste varre formatos de janela de verdade e cobra duas coisas:
   nada de estourar na vertical, e o painel não encostar na coluna da direita. */
const formula = css.match(/--u:\s*min\(([\d.]+)vh,\s*([\d.]+)vw\)/);
t('--u cabe pela altura (min), nao cobre a tela (max)', !!formula,
  'um max() aqui volta a recortar a margem de cima');

if (formula) {
  const [, VH, VW] = formula.map(Number);
  const JANELAS = [
    ['1920x1080 tela cheia', 1920, 1080], ['1889x955 com barra', 1889, 955],
    ['1440x821 macbook', 1440, 821], ['1536x785 notebook', 1536, 785],
    ['2560x1000 ultrawide', 2560, 1000], ['1280x945 4:3', 1280, 945],
    ['1024x690', 1024, 690],
  ];

  for (const [nome, w, h] of JANELAS) {
    const uu = Math.min(VH / 100 * h, VW / 100 * w);
    const fw = fatorU('.bene__card {', 'width') * uu;
    const base = fatorU('.bene__card {', 'top') * uu + fw / (556 / 946);
    const pnl = 0.369 * uu;
    t(`${nome}: a foto inteira cabe na tela`, base < h, `${base.toFixed(0)} / ${h}`);
    t(`${nome}: o painel nao encosta na coluna da direita`, pnl < 0.45 * w,
      `painel ${pnl.toFixed(0)}, coluna em ${(0.45 * w).toFixed(0)}`);
  }
}

/* O sentido do giro da palavra deitada. Os dois valores deitam a palavra; só
   -90deg lê de baixo para cima, que é o da referência ("ão" em cima). */
t('a palavra deita com -90deg (le de baixo para cima)',
  /\.bene__word[\s\S]*?rotate\(-90deg\)/.test(css),
  '90deg leria de cima para baixo');

console.log('PASSOU:', ok.length);
for (const f of falha) console.log('  FALHOU:', f);
process.exit(falha.length ? 1 : 0);
