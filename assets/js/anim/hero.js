/* =========================================================
   HERO — Anime.js 4.5.0 (sprint 5, fase 3)
   ---------------------------------------------------------
   A seção mais delicada da migração. Cinco coisas acontecem aqui:

     1. reveals()   — badge, título, subtítulo, CTA e stats sobem
     2. counters()  — a contagem numérica das estatísticas
     3. showcase()  — o progresso --p do palco dos celulares, a classe
                      .bridge.is-active e o scrub do vídeo
     4. reel()      — o progresso --reel da tira de fundo do hero
     5. resize      — os limites em px de reel() dependem da altura da tela

   --p e --reel continuam sendo escritos em :root, como no main.js: o CSS do
   hero inteiro depende deles e nada disso muda.
   ========================================================= */
(function () {
  "use strict";

  var lib = window.anime;
  if (!lib) return;

  var hero = document.querySelector('[data-anime="hero"]');
  if (!hero) return;

  /* O atributo poster de <video> não aceita <source>. Mantemos as duas
     versões como dados no HTML e trocamos o pôster no mesmo breakpoint do
     restante do layout móvel. */
  var videoDoHero = hero.querySelector("[data-video]");
  if (videoDoHero) {
    var midiaMobile = window.matchMedia("(max-width: 900px)");
    var atualizarPoster = function () {
      videoDoHero.poster = midiaMobile.matches
        ? videoDoHero.dataset.posterMobile
        : videoDoHero.dataset.posterDesktop;
    };
    atualizarPoster();
    midiaMobile.addEventListener("change", atualizarPoster);
  }

  var animate = lib.animate;
  var onScroll = lib.onScroll;

  hero.classList.add("is-anime");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var root = document.documentElement;

  /* espelha: --ease-out no :root. Tem de ser a FUNÇÃO — a forma em string
     foi removida do core na 4.5.0 e é ignorada em silêncio. */
  var EASE_OUT = lib.cubicBezier(.22, 1, .36, 1);

  /* espelha: IntersectionObserver com threshold 0.2 (reveal) e 1 (contadores).
     Ordem das palavras: "container alvo".
       'end top+=20%'  -> 20% do alvo cruzou a base da tela
       'end end'       -> a BASE do alvo cruzou a base da tela, ou seja, o
                          elemento está inteiro na tela = threshold 1        */
  var ENTER_20 = "end top+=20%";

  /* espelha: [data-reveal] { transform: translateY(24px) } no style.css */
  var REVEAL_Y = 24;

  /* Deslocamento inicial herdado de um ancestral [data-reveal].
     Mesma armadilha documentada em effects.js: a biblioteca calibra o
     observador com os transforms vigentes, e um [data-reveal] nasce 24px
     deslocado. Sem descontar, o gatilho do contador sai 24px fora. */
  function herdadoDoReveal(el) {
    var pai = el.parentElement, total = 0;
    while (pai && pai !== document.body) {
      if (pai.hasAttribute("data-reveal") &&
          pai.getAttribute("data-reveal") !== "fade") {
        total += REVEAL_Y;
      }
      pai = pai.parentElement;
    }
    return total;
  }

  function desloca(base, px) {
    var n = Math.round(px);
    if (!n) return base;
    return base + (n > 0 ? "-=" : "+=") + Math.abs(n);
  }

  /* ---------- 1. Reveals do hero ----------
     espelha: reveal() no main.js + [data-reveal] no CSS.
     Cada elemento tem gatilho próprio, como hoje: eles estão empilhados e
     entram em momentos diferentes. */
  function reveals() {
    hero.querySelectorAll("[data-reveal]").forEach(function (el) {
      var params = {
        opacity: [0, 1],
        duration: 800,
        delay: (parseFloat(el.dataset.revealDelay) || 0) * 110,
        ease: EASE_OUT,
        autoplay: onScroll({ target: el, enter: ENTER_20, sync: "play" })
      };
      if (el.getAttribute("data-reveal") !== "fade") {
        params.translateY = [REVEAL_Y, 0];
      }
      animate(el, params);
    });
  }

  /* ---------- 2. Contadores ----------
     espelha: counters() no main.js — 1400ms, easeOutCubic (1-(1-t)^3),
     texto arredondado a cada frame, disparando com o número INTEIRO na tela.

     Animamos um objeto JS e escrevemos o texto no onUpdate, porque o alvo é
     conteúdo de texto e não uma propriedade de estilo. */
  function counters() {
    hero.querySelectorAll("[data-count]").forEach(function (el) {
      var alvo = parseInt(el.dataset.count, 10) || 0;
      var contador = { v: 0 };

      animate(contador, {
        v: alvo,
        duration: 1400,
        ease: "outCubic",           /* esta string NÃO foi removida na 4.5.0 */
        onUpdate: function () { el.textContent = Math.round(contador.v); },
        autoplay: onScroll({
          target: el,
          /* 'end end' = o threshold 1 do IntersectionObserver: a BASE do alvo
             cruza a base da tela, ou seja, o elemento está inteiro visível.
             O deslocamento vai só na parte do CONTAINER (a primeira palavra),
             para descontar os 24px do .hero__stats, que é [data-reveal] e
             nasce deslocado — ver herdadoDoReveal(). */
          enter: desloca("end", -herdadoDoReveal(el)) + " end",
          sync: "play"
        })
      });
    });
  }

  /* ---------- 3. Palco dos celulares: --p, .bridge e o vídeo ----------
     espelha: o bloco 3a/3b/3c de scrollFx() no main.js.

       range = showcase.offsetHeight - vh
       p = (-rect.top) / range        (grampeado em 0..1)

     p = 0 quando o topo do palco encosta no topo da tela  -> 'top top'
     p = 1 quando a base do palco encosta na base da tela  -> 'bottom bottom'

     Os dois limites são pares simétricos, então não há poluição de régua a
     descontar: o palco não é deslocado por nenhuma animação. */
  var PONTO_BRIDGE = 0.50;          /* espelha: p > 0.50 no main.js */

  /* Duração nominal das animações raspadas pelo scroll. Não é percebida — a
     barra de rolagem é o relógio —, mas é a unidade usada no seek() que
     trava as bordas. */
  var CURSO = 1000;

  function showcase() {
    var palco = hero.querySelector("[data-showcase]");
    if (!palco) return;

    var bridge = hero.querySelector("[data-bridge]");
    var scrub = criarScrubDeVideo();
    var progresso = { p: 0 };

    function aplicar() {
      var p = progresso.p;
      root.style.setProperty("--p", p.toFixed(4));
      if (bridge) bridge.classList.toggle("is-active", p > PONTO_BRIDGE);
      scrub(p);
    }

    /* ---- Trava as bordas ----
       A biblioteca PARA de sincronizar quando o alvo sai da faixa, e deixa o
       progresso congelado no último valor em vez de grampeá-lo na borda.

       Aqui isso era VISÍVEL: descer um pouco no hero e voltar ao topo da
       página deixava --p travado (medido: 0.1235), com os celulares parados
       a meio caminho da transição e a tira de fundo fora do lugar. O motor
       antigo não tinha esse problema porque recalculava a cada frame e
       grampeava; foi uma regressão da migração, que passou batido porque os
       testes só amostravam descendo.

       Os nomes dos callbacks não seguem o sentido da rolagem — subir para
       fora do início dispara `onLeave`, descer além do fim dispara `onEnter`.
       Então os dois apontam para a mesma função, que pergunta ao DOM onde o
       alvo está e grampeia no 0 ou no 1 conforme o lado. */
    function travarBorda() {
      var r = palco.getBoundingClientRect();
      if (r.top > 0) {
        animacao.seek(0);
      } else if (r.bottom < window.innerHeight) {
        animacao.seek(CURSO);
      }
      aplicar();
    }

    var animacao = animate(progresso, {
      p: 1,
      ease: "linear",               /* a rolagem é o relógio */
      duration: CURSO,
      onUpdate: aplicar,
      autoplay: onScroll({
        target: palco,
        enter: "top top",
        leave: "bottom bottom",
        sync: true,
        onEnter: travarBorda,
        onLeave: travarBorda
      })
    });

    aplicar();                      /* estado inicial, se a página abrir no meio */
  }

  /* ---------- 4. Tira de fundo: --reel ----------
     espelha: o cálculo de --reel em scrollFx().

       lead = REEL_LEAD * vh
       span = lead + REEL_END * range
       reel = (lead - rect.top) / span

     reel = 0 quando rect.top = lead = vh   -> topo do palco na base da tela
     reel = 1 quando rect.top = -REEL_END * range

     O segundo ponto é o MESMO instante em que --p vale REEL_END, que é o que
     faz o vídeo emendar sem salto. Ele depende de `range`, que depende da
     altura da tela, então sai em pixels e é refeito no resize. */
  var REEL_LEAD = 1.0;              /* frações de viewport de antecipação */
  var REEL_END = 0.55;              /* = VIDEO_IN no main.js */

  /* Guardados para poder desfazer no resize. A animação tem um OBJETO JS como
     alvo, não o elemento, então lib.remove(palco) não desfaria nada — é
     preciso a referência da animação e a do observador. */
  var animacaoReel = null;
  var observadorReel = null;

  function reel() {
    var palco = hero.querySelector("[data-showcase]");
    if (!palco) return;

    var range = palco.offsetHeight - window.innerHeight;
    if (range <= 0) return;

    var tira = { v: 0 };

    function escreve() { root.style.setProperty("--reel", tira.v.toFixed(4)); }

    /* Mesma trava de borda do showcase, com a geometria própria da tira:
         v = 0  quando o topo do palco ainda está abaixo da base da tela
         v = 1  quando ele já subiu REEL_END * range acima do topo da tela */
    function travarBorda() {
      var topo = palco.getBoundingClientRect().top;
      if (topo >= window.innerHeight) {
        animacaoReel.seek(0);
      } else if (topo <= -REEL_END * range) {
        animacaoReel.seek(CURSO);
      }
      escreve();
    }

    observadorReel = onScroll({
      target: palco,
      /* topo do palco na base da tela */
      enter: "end start",
      /* topo do palco a REEL_END * range acima do topo da tela */
      leave: desloca("start", REEL_END * range) + " start",
      sync: true,
      onEnter: travarBorda,
      onLeave: travarBorda
    });

    animacaoReel = animate(tira, {
      v: 1,
      ease: "linear",
      duration: CURSO,
      onUpdate: escreve,
      autoplay: observadorReel
    });
  }

  /* ---------- Scrub do vídeo ----------
     Veio do main.js na migração e agora é a única cópia.

     O que esta função tem que o Anime.js não substitui, e por isso foi
     movida em vez de reescrita:
       · fila de seek: só pede o próximo quando o anterior terminou, senão a
         thread de vídeo trava;
       · tolerância de 0.04s, para não pedir seek a cada pixel;
       · o play()/pause() mudo do loadedmetadata, que é o que destrava a
         decodificação de frames no Safari e no iOS.
     A biblioteca entra só como fonte do progresso. */
  var VIDEO_IN = 0.55;
  var VIDEO_OUT = 1.00;

  function criarScrubDeVideo() {
    var video = hero.querySelector("[data-video]");
    if (!video) return function () { };

    /* Os nomes daqui para baixo estão em inglês e destoam do resto do
       arquivo: é o código original do main.js, preservado como estava para
       que o histórico do git mostre um MOVE e não uma reescrita. */
    var duration = 0;
    var wanted = 0;
    var seeking = false;

    video.addEventListener("loadedmetadata", function () {
      duration = video.duration || 0;
      var kick = video.play();
      if (kick && typeof kick.then === "function") {
        kick.then(function () { video.pause(); }).catch(function () { });
      } else {
        video.pause();
      }
    });

    video.addEventListener("seeked", function () {
      seeking = false;
      apply();
    });

    function apply() {
      if (!duration || seeking) return;
      if (Math.abs(video.currentTime - wanted) < 0.04) return;
      seeking = true;
      try {
        if (typeof video.fastSeek === "function") video.fastSeek(wanted);
        else video.currentTime = wanted;
      } catch (e) {
        seeking = false;
      }
    }

    return function scrub(p) {
      var t = (p - VIDEO_IN) / (VIDEO_OUT - VIDEO_IN);
      wanted = Math.min(Math.max(t, 0), 1) * duration;
      apply();
    };
  }

  /* ---------- 5. Resize ----------
     Só reel() tem limite em pixels derivado da altura da tela. --p usa pares
     simétricos ('top top', 'bottom bottom'), que a biblioteca resolve contra
     o tamanho vivo do container e sobrevivem sozinhos. */
  var temporizador;
  window.addEventListener("resize", function () {
    clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      if (observadorReel && typeof observadorReel.revert === "function") observadorReel.revert();
      if (animacaoReel && typeof animacaoReel.revert === "function") animacaoReel.revert();
      reel();
    }, 200);
  });

  reveals();
  counters();
  showcase();
  reel();
})();
