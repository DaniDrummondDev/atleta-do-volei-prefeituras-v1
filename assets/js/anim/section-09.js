/* =========================================================
   SEÇÃO 9 — "Já está acontecendo!" (o mapa)
   Anime.js 4.5.0
   ---------------------------------------------------------
   Duas coreografias independentes, disparadas pelo MESMO gatilho de
   scroll (a seção entrando na tela):

   A. O BLOCO DE TEXTO — título, subtítulo e estatísticas sobem de baixo
      para cima, opacidade 0 -> 1, escalonados na ordem do DOM. Quando a
      pílula das estatísticas começa a aparecer, os três números saem de 0
      e contam até o total.

   B. O RODAPÉ DE FRASES — coreografia própria, e diferente:
        1. o traço vermelho cresce da esquerda para a direita (scaleX 0->1);
        2. logo depois entram os três blocos de texto, cada um deslizando da
           esquerda, EM CASCATA: o seguinte começa no MEIO do anterior.

      A cascata é só isto: PASSO_FRASE = DUR_FRASE / 2. Escrito como divisão
      e não como número fixo de propósito — mudar a duração mantém o ritmo
      sozinho. Trocar o divisor é trocar a sobreposição: 2 = começa no meio,
      1 = uma depois da outra, 3 = quase juntas.

   O estado inicial (escondido, deslocado, traço em scaleX(0)) vem todo do
   style.css, então não há piscada enquanto o script do CDN não chegou.

   SEM BIBLIOTECA OU COM MOVIMENTO REDUZIDO: nada disto roda, as redes do
   style.css devolvem o texto ao estado final — mas os contadores são um
   caso à parte e estão tratados logo abaixo, em `escreveTotais()`.
   ========================================================= */
(function () {
  "use strict";

  var section = document.querySelector('[data-anime="mapa"]');
  if (!section) return;

  /* ---------- os números, quando NÃO há animação ----------
     Os <b> nascem com "0" no HTML para a seção nunca aparecer com a pílula
     vazia. Mas 0 é o começo da contagem, não a informação: se a contagem
     não vai rodar, deixar o 0 na tela é publicar uma estatística ERRADA.

     Por isso esta função roda antes de qualquer desistência do script —
     é a única parte daqui que não depende da biblioteca. */
  function escreveTotais() {
    section.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = parseInt(el.dataset.count, 10) || 0;
    });
  }

  var lib = window.anime;
  if (!lib) { escreveTotais(); return; }   /* a rede .sem-anime faz o resto */

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    escreveTotais();
    return;
  }

  var animate = lib.animate;
  var onScroll = lib.onScroll;

  /* espelha: --ease-out no :root.
     Tem de ser a FUNÇÃO, não a string: na 4.5.0 a forma "cubicBezier(...)"
     em string saiu do core e a biblioteca cai no easing padrão sem avisar
     em tela. Está documentado com medições no topo do section-04.js. */
  var EASE = lib.cubicBezier(.22, 1, .36, 1);

  var SOBE_TXT = 24;    /* px — espelha: .mapa [data-mapa="txt"] { translateY(24px) } */
  var DUR_TXT = 760;
  var PASSO_TXT = 120;  /* o atraso entre um bloco de texto e o seguinte */

  var DUR_CONTA = 1400; /* espelha: counters() no hero — a mesma contagem */

  var ESPERA_RODAPE = 620;  /* o rodapé só começa com o texto de cima já lido */
  var DUR_TRACO = 420;
  var DUR_FRASE = 620;
  var PASSO_FRASE = DUR_FRASE / 2;   /* ver o cabeçalho: a cascata é isto */

  /* ---------- O GATILHO ----------
     Mesmo da seção 8, e pelo mesmo motivo: a seção tem exatamente 100vh e
     encaixa (data-snap), então esperar visibilidade total faria a entrada
     começar com a pessoa já parada olhando a seção inteira.

     Na linguagem da biblioteca (ordem "container alvo"):
       'start+=15%' -> ponto do CONTAINER: 15% da altura da tela, do topo
       'start'      -> ponto do ALVO: o topo da seção */
  var ENTER = "start+=15% start";

  function gatilho() {
    return onScroll({ target: section, enter: ENTER, sync: "play" });
  }

  /* ---------- A. o bloco de texto ----------
     A ordem do escalonamento é a ordem do DOM: título, subtítulo, pílulas,
     que é como aparecem na tela, de cima para baixo. Reordenar no HTML
     reordena a animação — está avisado lá também. */
  var textos = section.querySelectorAll('[data-mapa="txt"]');

  if (textos.length) {
    animate(textos, {
      opacity: [0, 1],
      translateY: [SOBE_TXT, 0],
      duration: DUR_TXT,
      delay: lib.stagger(PASSO_TXT),
      ease: EASE,
      autoplay: gatilho()
    });
  }

  /* ---------- os contadores ----------
     Animamos um objeto JS e escrevemos o texto no onUpdate, porque o alvo é
     conteúdo de texto e não uma propriedade de estilo — mesma técnica do
     hero (ver counters() em anim/hero.js).

     O ATRASO: a lista de estatísticas é o TERCEIRO [data-mapa="txt"], logo
     entra em 2 * PASSO_TXT. A contagem parte junto com ela, e não depois:
     o número tem de estar rodando quando a pílula surge, senão a pílula
     aparece com 0 e só então acorda — lê como travamento.

     `indice` é lido do DOM em vez de escrito à mão para não virar mentira
     quando alguém inserir um bloco de texto no meio do HTML. */
  var lista = section.querySelector('.mapa__stats');
  var indice = lista ? Array.prototype.indexOf.call(textos, lista) : 0;
  var ESPERA_CONTA = Math.max(indice, 0) * PASSO_TXT;

  section.querySelectorAll("[data-count]").forEach(function (el) {
    var alvo = parseInt(el.dataset.count, 10) || 0;
    var contador = { v: 0 };

    animate(contador, {
      v: alvo,
      duration: DUR_CONTA,
      delay: ESPERA_CONTA,
      ease: "outCubic",           /* esta string NÃO foi removida na 4.5.0 */
      onUpdate: function () { el.textContent = Math.round(contador.v); },
      /* trava o valor exato no fim: o arredondamento do último quadro pode
         parar em 1567 se a animação for interrompida a um frame do fim */
      onComplete: function () { el.textContent = alvo; },
      autoplay: gatilho()
    });
  });

  /* ---------- B. o rodapé: primeiro o traço ---------- */
  var traco = section.querySelector('[data-mapa="traco"]');

  if (traco) {
    animate(traco, {
      scaleX: [0, 1],
      duration: DUR_TRACO,
      delay: ESPERA_RODAPE,
      ease: EASE,
      autoplay: gatilho()
    });
  }

  /* ---------- B. as frases, em cascata ----------
     Entram DA ESQUERDA (translateX negativo -> 0) e a cada meia frase
     começa a seguinte. O início fica logo depois do traço: ESPERA_RODAPE +
     DUR_TRACO * .7 — a frase entra com o traço ainda terminando, que é o
     que amarra os dois gestos num só movimento. Com o traço 100% pronto
     antes, havia um buraco visível de ~120ms. */
  var frases = section.querySelectorAll('[data-mapa="frase"]');

  if (frases.length) {
    animate(frases, {
      opacity: [0, 1],
      translateX: ["-1.2em", "0em"],
      duration: DUR_FRASE,
      delay: lib.stagger(PASSO_FRASE, { start: ESPERA_RODAPE + DUR_TRACO * .7 }),
      ease: EASE,
      autoplay: gatilho()
    });
  }
})();
