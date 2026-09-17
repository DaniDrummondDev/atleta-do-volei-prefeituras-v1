/* =========================================================
   SEÇÃO 2 — "A prefeitura organiza / A rede social movimenta"
   Animações com Anime.js 4.5.0 (sprint 5, fase 2)
   ---------------------------------------------------------
   Aqui mora UMA animação só: o reveal em bloco.

   O que a torna diferente da seção 4: no main.js ela não usa o observador
   individual, e sim observeScope() — os elementos só entram quando a SEÇÃO
   INTEIRA estiver na tela, todos de uma vez, e o escalonamento vem só do
   atraso. Por isso um observador para a seção e N animações penduradas nele,
   em vez de um observador por elemento.

   O parallax da arte (.social__art) NÃO está aqui: é [data-parallax], efeito
   genérico por atributo, e vive em effects.js.
   O wiggle da imagem continua onde sempre esteve, no CSS — animação em laço
   infinito não ganha nada indo para JS.
   ========================================================= */
(function () {
  "use strict";

  var lib = window.anime;
  if (!lib) return;

  var section = document.querySelector('[data-anime="social"]');
  if (!section) return;

  var animate = lib.animate;
  var onScroll = lib.onScroll;

  /* Desliga as transitions do CSS: a biblioteca escreve style inline a cada
     frame e as duas interpolariam a mesma propriedade. Ver a regra
     .is-anime [data-reveal] no style.css. */
  section.classList.add("is-anime");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* espelha: --ease-out no :root.
     A forma em STRING "cubicBezier(...)" foi removida do core na 4.5.0 — ela
     é ignorada em silêncio e a animação cai no easing padrão. Tem de ser a
     função. Está documentado em detalhe no topo de section-04.js. */
  var EASE_OUT = lib.cubicBezier(.22, 1, .36, 1);

  /* Gatilho equivalente ao observeScope(): dispara quando a seção está 98%
     visível (FULL_RATIO no main.js).

     A seção tem exatamente 100vh. Entrando por baixo, a razão de interseção
     chega a 0.98 quando o topo dela está a 2% da altura da tela abaixo do
     topo da viewport. Na linguagem da biblioteca (ordem "container alvo"):

       'start+=2%'  -> ponto do CONTAINER: 2% da altura da tela, a partir do topo
       'start'      -> ponto do ALVO: o topo da seção

     O 0.98 do main.js não é arbitrário: é "100% na prática", porque
     arredondamento de subpixel e a barra de endereço do mobile impedem a
     razão de chegar a 1 cravado. O 2% aqui é o complemento disso. */
  var ENTER_SCOPE = "start+=2% start";

  function revealScope() {
    var items = section.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    /* UM OBSERVADOR POR ELEMENTO, e não um observador da seção com as três
       animações penduradas via link().

       Por quê: link() guarda UMA animação só. No fonte da biblioteca
       (dist/modules/events/scroll.js) o método faz `this.linked = linked`,
       um slot único — cada chamada descarta a anterior. Com três link() no
       mesmo observador, as duas primeiras animações ficam pausadas para
       sempre e nunca aparecem. Foi exatamente o que o teste pegou.

       Os três observadores apontam para a MESMA seção, com o MESMO limite,
       então disparam juntos — que é o comportamento do observeScope(). */
    items.forEach(function (el) {
      /* espelha: [data-reveal] e a variante [data-reveal="fade"] no CSS —
         a "fade" não desloca, só aparece (é a dos botões das lojas). */
      var params = {
        opacity: [0, 1],
        duration: 800,
        delay: (parseFloat(el.dataset.revealDelay) || 0) * 110,
        ease: EASE_OUT,
        /* o gatilho olha a SEÇÃO, não o elemento: é o que faz os três
           entrarem juntos em vez de um a um */
        autoplay: onScroll({ target: section, enter: ENTER_SCOPE, sync: "play" })
      };
      if (el.getAttribute("data-reveal") !== "fade") {
        params.translateY = [24, 0];   /* espelha: transform: translateY(24px) */
      }

      animate(el, params);
    });
  }

  revealScope();
})();
