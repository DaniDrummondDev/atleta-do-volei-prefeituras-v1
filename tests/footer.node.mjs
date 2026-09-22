/* =========================================================
   FOOTER — teste de estrutura e ordem (sem navegador)
   ---------------------------------------------------------
   A animação do footer não guarda uma lista de ordem: ela usa a ordem do DOM.
   Isso é bom (uma fonte só) e é frágil (reordenar as colunas no HTML reordena
   a animação, sem erro nenhum). Este teste é o alarme desse acordo.

   Cobre também o que o CSS e o HTML precisam combinar entre si: todo elemento
   que nasce escondido tem de aparecer nas DUAS redes de segurança, senão ele
   fica invisível para sempre em quem não tem a biblioteca ou pediu movimento
   reduzido — que é o modo mais fácil de deixar um footer em branco.

   COMO RODAR:
     npm i jsdom && node tests/footer.node.mjs
   ========================================================= */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(raiz + '/index.html', 'utf8');
const css = fs.readFileSync(raiz + '/assets/css/style.css', 'utf8');
const src = fs.readFileSync(raiz + '/assets/js/anim/footer.js', 'utf8');

const ok = [];
const falha = [];
const t = (nome, cond, extra = '') => (cond ? ok : falha).push(nome + (extra ? ` [${extra}]` : ''));

const { window } = new JSDOM(html);
const { document } = window;
const foot = document.querySelector('[data-anime="foot"]');

// ---- estrutura ----
t('o footer existe', !!foot);
t('o footer e o destino de #contato', foot && foot.id === 'contato',
  'os dois botoes "Fale com um especialista" apontam para la');

const ancoras = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1));
const semDestino = [...new Set(ancoras)].filter(id => id && !document.getElementById(id));
t('nenhuma ancora da pagina aponta para o vazio', semDestino.length === 0, semDestino.join(', '));

t('usa logo-white.png', !!foot.querySelector('img.foot__logo[src$="logo-white.png"]'));
t('o logo tem alt (nao e decorativo: e a marca)',
  (foot.querySelector('.foot__logo')?.getAttribute('alt') || '').length > 5);

/* O subtitulo "REDE SOCIAL ESPORTIVA" ja vem embutido no PNG, em branco —
   conferido decodificando o arquivo. Um <p> repetindo isso apareceria duas
   vezes na tela, e a segunda por cima da primeira. */
t('nao ha subtitulo em texto duplicando o do PNG',
  !/REDE SOCIAL ESPORTIVA/i.test(foot.textContent));

t('tres colunas', foot.querySelectorAll('.foot__col').length === 3);
t('3 links de navegacao', foot.querySelectorAll('nav .foot__link').length === 3);
/* pela POSICAO, nao por :last-of-type: o <nav> tambem e o ultimo do seu tipo,
   entao aquele seletor casava com duas colunas. */
const colunas = [...foot.querySelectorAll('.foot__col')];
t('2 itens de contato', colunas[2]?.querySelectorAll('.foot__link').length === 2,
  String(colunas[2]?.querySelectorAll('.foot__link').length));
t('a coluna da marca nao tem links (so logo e descricao)',
  colunas[0]?.querySelectorAll('.foot__link').length === 0);
t('o e-mail e clicavel (mailto)', !!foot.querySelector('a[href^="mailto:"]'));
t('o link externo leva rel=noopener',
  [...foot.querySelectorAll('a[target="_blank"]')].every(a => /noopener/.test(a.rel || '')));

// ---- A ORDEM: esquerda -> direita, e dentro de cada coluna de cima para baixo ----
const animados = [...foot.querySelectorAll(
  '.foot__logo, .foot__desc, .foot__head, .foot__list li, .foot__copy')];

const rotulo = el => (el.tagName === 'IMG' ? '[logo]' : el.textContent.trim().slice(0, 26));
const ordem = animados.map(rotulo);

const ESPERADA = [
  '[logo]',                      // coluna 1
  'A rede social feita para q',
  'Navegação',                   // coluna 2
  'O que a prefeitura ganha',
  'A solução',
  'Como funciona',
  'Contato',                     // coluna 3
  'contato@atletadovolei.com.',
  'atletadovolei.com.br',
  '© 2026 Atleta do Vôlei. To',  // faixa de baixo
];

t('a ordem do DOM e a ordem da animacao, da esquerda para a direita',
  JSON.stringify(ordem) === JSON.stringify(ESPERADA),
  ordem.join(' > '));

// ---- estado inicial x redes de seguranca ----
const bloco = (marcador, fim) => css.slice(css.indexOf(marcador), css.indexOf(fim, css.indexOf(marcador)));

const escondidos = ['.foot__logo', '.foot__desc', '.foot__head', '.foot__list li', '.foot__copy'];
const inicial = bloco('/* ----- estados iniciais da animação -----', '/* ---------- 6.');
t('todo elemento animado nasce escondido',
  escondidos.every(sel => inicial.includes(sel)),
  'senao ele pisca antes de o bundle local carregar');

const semAnime = css.slice(css.indexOf('.sem-anime .foot__logo'));
t('rede .sem-anime cobre os mesmos cinco',
  escondidos.every(sel => semAnime.slice(0, 400).includes(sel.replace('.foot', '.sem-anime .foot'))),
  'um que falte fica invisivel para sempre sem a biblioteca');

const reduzido = css.slice(css.indexOf('@media (prefers-reduced-motion'));
t('rede de movimento reduzido cobre os mesmos cinco',
  escondidos.every(sel => reduzido.includes('\n  ' + sel.replace('.foot__list li', '.foot__list li'))),
  'um que falte fica invisivel para quem pediu movimento reduzido');

// ---- o modulo, rodando de verdade ----
/* Aqui o módulo é EXECUTADO contra um anime.js de mentira que só anota o que
   foi pedido. É o que prova o requisito — "só pode começar quando a rolagem
   chegar ao fim da página" — que nenhuma expressão regular provaria. */
const ALTURA_DOC = 20000, TELA = 950;
const { window: w2 } = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
w2.matchMedia = () => ({ matches: false });

const tocadas = [];
const feitas = [];
const fabrica = cfg => {
  const a = { cfg, play() { tocadas.push(a); } };
  feitas.push(a);
  return a;
};
w2.anime = {
  animate: (alvos, cfg) => fabrica({ alvos, ...cfg }),
  stagger: (v, o) => ({ stagger: v, ...o }),
  cubicBezier: () => 'ease',
  onScroll: () => { throw new Error('o footer nao deve mais usar onScroll'); },
};

Object.defineProperty(w2, 'innerHeight', { value: TELA, writable: true });
Object.defineProperty(w2.document.documentElement, 'scrollHeight', { value: ALTURA_DOC });
let posicao = 0;
Object.defineProperty(w2, 'scrollY', { get: () => posicao });
const rolarPara = y => { posicao = y; w2.dispatchEvent(new w2.Event('scroll')); };

let explodiu = null;
try { w2.eval(src); } catch (e) { explodiu = e; }
t('o modulo roda sem erro (e sem onScroll)', !explodiu, String(explodiu).split('\n')[0]);

t('duas animacoes criadas: o logo e os textos', feitas.length === 2, String(feitas.length));
t('as duas nascem PARADAS (autoplay: false)',
  feitas.every(a => a.cfg.autoplay === false), 'senao tocam sozinhas ao carregar');

const [aLogo, aTextos] = feitas;
t('o logo so muda de opacidade (nao se desloca)',
  aLogo.cfg.opacity && aLogo.cfg.translateY === undefined, 'foi pedido explicitamente');
t('os textos sobem e aparecem',
  !!aTextos.cfg.opacity && Array.isArray(aTextos.cfg.translateY));
t('ha um passo entre um elemento e o seguinte',
  !!aTextos.cfg.delay && aTextos.cfg.delay.stagger > 0,
  'sem stagger tudo entraria junto');
t('o passo reserva o primeiro lugar para o logo',
  aTextos.cfg.delay.start === aTextos.cfg.delay.stagger);

/* O requisito, ponto a ponto. O fim da pagina e scrollY = 20000 - 950. */
const FIM = ALTURA_DOC - TELA;
for (const [onde, y] of [['no topo', 0], ['no meio', FIM / 2],
                         ['quase no fim (200px antes)', FIM - 200],
                         ['a 10px do fim', FIM - 10]]) {
  rolarPara(y);
  t(`nada toca ${onde}`, tocadas.length === 0, `${tocadas.length} tocaram`);
}

rolarPara(FIM);
t('AO CHEGAR NO FIM, as duas tocam', tocadas.length === 2, `${tocadas.length} tocaram`);

/* Tolerancia: com zoom ou densidade fracionaria a soma fica 1-2px curta. */
const { window: w3 } = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
w3.matchMedia = () => ({ matches: false });
const tocadas3 = [];
w3.anime = { animate: (al, c) => ({ cfg: c, play() { tocadas3.push(1); } }),
  stagger: (v, o) => ({ stagger: v, ...o }), cubicBezier: () => 'ease',
  onScroll: () => { throw new Error('x'); } };
Object.defineProperty(w3, 'innerHeight', { value: TELA });
Object.defineProperty(w3.document.documentElement, 'scrollHeight', { value: ALTURA_DOC });
let p3 = 0;
Object.defineProperty(w3, 'scrollY', { get: () => p3 });
w3.eval(src);
p3 = FIM - 3; w3.dispatchEvent(new w3.Event('scroll'));
t('tolera 3px de sobra (zoom, densidade fracionaria)', tocadas3.length === 2,
  `${tocadas3.length} tocaram`);

/* Uma vez so: subir e voltar nao repete a entrada. */
const antes = tocadas.length;
rolarPara(0); rolarPara(FIM);
t('toca uma vez so, mesmo subindo e voltando', tocadas.length === antes,
  `${tocadas.length - antes} repeticoes`);

t('o script esta registrado no index.html',
  /<script src="assets\/js\/anim\/footer\.js" defer><\/script>/.test(html));

console.log('PASSOU:', ok.length);
for (const f of falha) console.log('  FALHOU:', f);
process.exit(falha.length ? 1 : 0);
