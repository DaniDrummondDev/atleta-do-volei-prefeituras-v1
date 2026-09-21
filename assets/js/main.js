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
     O hero inclui o palco de transição dos celulares. Observar esse bloco
     inteiro deixava a navbar visível nos primeiros pixels da seção seguinte,
     antes de o observador receber o aviso de que o hero tinha terminado.

     Por isso a fronteira é o início da primeira seção após o hero. A partir
     do momento em que ela entra na janela, o header fica oculto e só volta
     quando a rolagem retorna integralmente ao hero. Assim ele jamais
     sobrepõe a seção "A prefeitura organiza" ou qualquer seção posterior. */
  function header() {
    var barra = document.querySelector("[data-header]");
    var hero = document.querySelector(".hero");
    var proximaSecao = hero && hero.nextElementSibling;
    if (!barra || !hero || !proximaSecao) return;

    function alternar(oculto) {
      barra.classList.toggle("is-oculto", oculto);
    }

    /* Atualiza no máximo uma vez por frame. A coordenada do topo mantém a
       barra oculta também depois que a primeira seção sai da janela; usar só
       isIntersecting a faria reaparecer nas seções seguintes. */
    var agendado = false;
    function sincronizar() {
      agendado = false;
      var limites = proximaSecao.getBoundingClientRect();
      alternar(limites.top < window.innerHeight);
    }
    window.addEventListener("scroll", function () {
      if (!agendado) {
        agendado = true;
        window.requestAnimationFrame(sincronizar);
      }
    }, { passive: true });
    window.addEventListener("resize", sincronizar);
    sincronizar();
  }

  rede();

  document.addEventListener("DOMContentLoaded", function () {
    burger();
    header();
  });
})();
