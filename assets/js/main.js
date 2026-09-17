/* =========================================================
   ATLETA DO VÔLEI — PREFEITURAS
   Arranque da página + menu mobile
   ---------------------------------------------------------
   Este arquivo era o motor de animação do projeto. Na sprint 5 as animações
   passaram todas para o Anime.js, em assets/js/anim/:

     anim/hero.js        reveals, contadores, --p, --reel, .bridge, vídeo
     anim/section-02.js  o reveal em bloco da seção 2
     anim/effects.js     [data-parallax] e [data-enter], em qualquer seção
     anim/section-04.js  reveals, entrada elástica e a timeline da seção 4

   Sobraram três responsabilidades, as três independentes de animação:

     1. rede()    — o que fazer quando o Anime.js NÃO carrega
     2. burger()  — o menu mobile
     3. header()  — o header só existe sobre o hero

   Ordem de execução: o <script> do CDN vem antes deste no HTML e os dois têm
   defer, então quando este arquivo roda já dá para saber se a biblioteca
   chegou. Os módulos de anim/ vêm depois.
   ========================================================= */
(function () {
  "use strict";

  /* ------- 1. Rede de segurança: sem biblioteca, sem página em branco -------
     O CSS esconde de propósito tudo que vai ser animado: [data-reveal] nasce
     com opacity 0 e [data-enter] com opacity: var(--e, 0). É isso que evita
     o flash de conteúdo enquanto o script do CDN não chegou.

     Só que, se ele NUNCA chegar — CDN fora do ar, SRI recusando o arquivo,
     rede bloqueada —, esse mesmo CSS deixa a página em branco, com as seções
     fixadas por vários viewports de rolagem vazia. Não é "página sem
     animação": é página quebrada.

     Então: quando a biblioteca falta, marcamos o <html> com .sem-anime e o
     CSS (seção 6c do style.css) devolve tudo ao estado final — conteúdo
     visível, seções com altura normal, nada fixado.

     Os contadores são o único caso que o CSS não resolve sozinho: o HTML traz
     <b data-count="340">0</b>, e sem JS ficaria o zero na tela. Escrevemos o
     número final aqui.                                                     */
  function rede() {
    if (window.anime) return;

    document.documentElement.classList.add("sem-anime");

    document.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = el.dataset.count;
    });
  }

  /* ------- 2. Menu mobile (placeholder da etapa 1) ------- */
  function burger() {
    var btn = document.querySelector("[data-burger]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      // Etapa 2: abrir/fechar o painel de navegação mobile.
    });
  }

  /* ------- 3. O header vive só sobre o hero -------
     O header é fixo e transparente, e a legibilidade dele vinha do gradiente
     escuro do hero. Passado o hero, ele flutuava por cima de tudo — e na
     seção 7 a logo branca caía em cima do painel preto e virava parte do
     desenho, que não é o que a referência mostra.

     A REGRA: visível enquanto o hero estiver na tela, escondido depois.

     IntersectionObserver e não evento de scroll: a pergunta aqui é
     literalmente "este elemento está na tela?", que é o que o observador
     responde — de graça, fora da thread principal, sem medir nada a cada
     quadro. Um ouvinte de scroll faria getBoundingClientRect() o tempo todo
     para chegar na mesma resposta.

     O hero tem mais de cinco telas de altura, então ele deixa de intersectar
     só quando a base dele passa pelo topo da janela — exatamente o ponto em
     que o gradiente escuro acaba.

     Esconder com transform, e não com display: assim a volta é suave e o
     header não some do fluxo (ele é fixed, mas display: none também tiraria
     o foco de quem estiver navegando por teclado no meio da transição). */
  function header() {
    var barra = document.querySelector("[data-header]");
    var hero = document.querySelector(".hero");
    if (!barra || !hero) return;

    /* Sem suporte ao observador, o header fica como sempre esteve: visível.
       É o comportamento antigo, que nunca deixou a página quebrada. */
    if (!("IntersectionObserver" in window)) return;

    new IntersectionObserver(function (entradas) {
      barra.classList.toggle("is-oculto", !entradas[0].isIntersecting);
    }).observe(hero);
  }

  rede();

  document.addEventListener("DOMContentLoaded", function () {
    burger();
    header();
  });
})();
