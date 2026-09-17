/* =========================================================
   ATLETA DO VÔLEI — PREFEITURAS · Etapa 1 (Hero)
   ---------------------------------------------------------
   Módulos:
   1. reveal()    — animação de entrada dos elementos do hero
   2. counters()  — contagem numérica das estatísticas
   3. scrollFx()  — progresso (--p) da timeline
                    phone_01 -> phone_02 -> bloco .bridge,
                    incluindo o scrub do vídeo de fundo
                    (header e background do hero são estáticos)
   Tudo em um único rAF: apenas 1 leitura de layout por frame.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------- 1. Reveal de entrada -------
     Dois gatilhos possíveis:
       a) padrão — cada elemento entra ao aparecer 20% na tela;
       b) [data-reveal-scope] — os elementos dentro dele só entram quando a
          SEÇÃO INTEIRA estiver na tela, todos de uma vez (o escalonamento
          continua vindo do --reveal-delay no CSS).                          */
  var FULL_RATIO = 0.98;   /* ver comentário em observeScope() */

  function reveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    items.forEach(function (el) {
      el.style.setProperty("--reveal-delay", el.dataset.revealDelay || 0);
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var scopes = document.querySelectorAll("[data-reveal-scope]");
    scopes.forEach(observeScope);

    /* Observador individual, ignorando o que já está sob um escopo */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    items.forEach(function (el) {
      if (el.closest("[data-reveal-scope]")) return;
      io.observe(el);
    });
  }

  function observeScope(scope) {
    /* A seção tem exatamente 100vh, então a razão de interseção raramente
       chega a 1 cravado (arredondamento de subpixel, barra de rolagem,
       barra de endereço do mobile). 0.98 é "100% na prática". */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.intersectionRatio < FULL_RATIO) return;

        scope.querySelectorAll("[data-reveal]").forEach(function (el) {
          el.classList.add("is-visible");
        });
        io.disconnect();
      });
    }, { threshold: [0, 0.5, 0.9, FULL_RATIO, 1] });

    io.observe(scope);
  }

  /* ------- 2. Contadores das estatísticas ------- */
  function counters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    function run(el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      if (reduceMotion) { el.textContent = target; return; }

      var duration = 1400;
      var start = performance.now();

      (function step(now) {
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);          // easeOutCubic
        el.textContent = Math.round(target * eased);
        if (t < 1) requestAnimationFrame(step);
      })(start);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 1 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ------- 3a. Vídeo controlado pelo scroll -------
     O vídeo nunca toca sozinho: mapeamos o trecho [VIDEO_IN, VIDEO_OUT]
     da timeline --p para [0, duration] e escrevemos em currentTime. */
  var VIDEO_IN = 0.55;   /* = fim do fade-out do phone_02 (ver .showcase no CSS) */
  var VIDEO_OUT = 1.00;

  /* ------- Progresso da tira de fundo (--reel) -------
     --p só começa a contar quando o palco gruda no topo, mas o celular já
     entrou na tela ANTES disso, enquanto o palco ainda sobe. Por isso a tira
     tem um progresso próprio, que começa mais cedo:

       início : quando rect.top == REEL_LEAD * altura da viewport
       fim    : mesmo ponto em que --p vale VIDEO_IN, para o vídeo emendar

     REEL_LEAD é medido em VIEWPORTS de antecipação e MAIOR = MAIS CEDO:
       0.0  começa só quando o palco gruda no topo (igual a --p)
       0.5  quando o celular assoma na base da tela
       1.0  quando o topo do palco toca a base da viewport
       1.5  meia viewport antes disso, ainda durante o texto do hero        */
  var REEL_LEAD = 1.0;         /* frações de viewport de antecipação */
  var REEL_END = VIDEO_IN;     /* em unidades de --p */

  function createVideoScrubber() {
    var video = document.querySelector("[data-video]");
    if (!video || reduceMotion) return function () { };

    var duration = 0;
    var wanted = 0;
    var seeking = false;

    video.addEventListener("loadedmetadata", function () {
      duration = video.duration || 0;
      /* Alguns navegadores (Safari/iOS) só decodificam frames depois de um
         play(). Damos um play mudo e pausamos no mesmo instante. */
      var kick = video.play();
      if (kick && typeof kick.then === "function") {
        kick.then(function () { video.pause(); }).catch(function () { });
      } else {
        video.pause();
      }
    });

    /* Só emitimos o próximo seek quando o anterior terminou: evita
       empilhar requisições de seek e travar a thread de vídeo. */
    video.addEventListener("seeked", function () {
      seeking = false;
      apply();
    });

    function apply() {
      if (!duration || seeking) return;
      if (Math.abs(video.currentTime - wanted) < 0.04) return;   // tolerância
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

  /* ------- 3b. Parallax genérico -------
     Qualquer [data-parallax="N"] recebe --py variando de +N a -N enquanto
     atravessa a viewport. N é a amplitude em px, definida no HTML. */
  function createParallax() {
    var els = document.querySelectorAll("[data-parallax]");
    if (!els.length || reduceMotion) return function () { };

    return function updateParallax() {
      var vh = window.innerHeight;

      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;      // fora da tela: não calcula

        /* t = 0 quando o topo do elemento toca a base da viewport,
           t = 1 quando a base dele sai pelo topo. */
        var t = (vh - r.top) / (vh + r.height);
        var amp = parseFloat(el.dataset.parallax) || 40;

        el.style.setProperty("--py", ((0.5 - t) * 2 * amp).toFixed(2) + "px");
      });
    };
  }

  /* ------- 3c. Entradas controladas pelo scroll -------
     [data-enter="N"] recebe --e indo de 0 a 1 enquanto o elemento sobe pela
     viewport. N é a distância percorrida, em frações de altura de viewport:
       --e = 0  quando o topo do elemento toca a base da tela
       --e = 1  depois de subir N * altura da viewport
     Diferente do data-reveal (IntersectionObserver, dispara uma vez), aqui a
     animação é reversível: rolar para cima desfaz, como no resto da página. */
  function createEnters() {
    var els = document.querySelectorAll("[data-enter]");
    if (!els.length || reduceMotion) return function () { };

    return function updateEnters() {
      var vh = window.innerHeight;

      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top > vh || r.bottom < 0) return;      // fora da tela: não calcula

        var travel = (parseFloat(el.dataset.enter) || 0.4) * vh;
        /* data-enter-delay atrasa o início: é o que encadeia os cards, para
           um só começar depois que o anterior terminou. */
        var delay = (parseFloat(el.dataset.enterDelay) || 0) * vh;
        var e = (vh - r.top - delay) / travel;

        el.style.setProperty("--e", Math.min(Math.max(e, 0), 1).toFixed(4));
      });
    };
  }

  /* ------- 3d. Linhas do tempo presas ao scroll -------
     [data-timeline] é uma seção MAIS ALTA que a viewport, com um filho
     position:sticky. Enquanto ela atravessa a tela, o conteúdo fica parado e
     o excedente de altura vira o "orçamento" de rolagem da timeline:

       --t = 0  quando o topo da seção gruda no topo da viewport
       --t = 1  quando a seção termina de passar

     Além de --t, marcamos qual etapa está ativa: a seção é dividida em
     data-timeline-steps fatias iguais e o [data-step] do índice atual recebe
     .is-current. Esse índice serve a DOIS lugares ao mesmo tempo — o rótulo
     da régua e o filete laranja no topo do card.                           */
  function createTimelines() {
    var scopes = document.querySelectorAll("[data-timeline]");
    if (!scopes.length) return function () { };

    var lines = [].map.call(scopes, function (el) {
      return {
        el: el,
        steps: el.querySelectorAll("[data-step]"),
        count: parseInt(el.dataset.timelineSteps, 10) || 1,
        /* -1 = "ainda não pintei nenhuma". Guardar o último índice evita
           mexer no DOM a cada frame: só escrevemos quando ele MUDA. */
        current: -1
      };
    });

    return function updateTimelines() {
      var vh = window.innerHeight;

      lines.forEach(function (line) {
        var r = line.el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;   // fora da tela: não calcula

        var range = line.el.offsetHeight - vh;    // altura excedente = curso
        var t = range > 0 ? (-r.top) / range : 0;
        t = Math.min(Math.max(t, 0), 1);

        line.el.style.setProperty("--t", t.toFixed(4));

        /* Fatias iguais: o último índice também cobre t === 1 exato. */
        var i = Math.min(Math.floor(t * line.count), line.count - 1);
        if (i === line.current) return;
        line.current = i;

        line.steps.forEach(function (step) {
          step.classList.toggle("is-current", parseInt(step.dataset.step, 10) === i);
        });
      });
    };
  }

  /* ------- 3. Efeitos de scroll ------- */
  function scrollFx() {
    var showcase = document.querySelector("[data-showcase]");
    var bridge = document.querySelector("[data-bridge]");
    var scrub = createVideoScrubber();
    var parallax = createParallax();
    var enters = createEnters();
    var timelines = createTimelines();
    var root = document.documentElement;
    var ticking = false;

    function update() {
      ticking = false;

      if (reduceMotion) return;

      /* Rodam antes do guard do showcase: são independentes dele */
      parallax();
      enters();
      timelines();

      /* 3a. Progresso 0 -> 1 do palco dos celulares.
         O palco "gruda" enquanto a seção percorre (altura - 100vh).
         p = quanto dessa distância já foi rolado. */
      if (!showcase) return;
      var rect = showcase.getBoundingClientRect();
      var range = showcase.offsetHeight - window.innerHeight;
      var p = range > 0 ? (-rect.top) / range : 0;
      p = Math.min(Math.max(p, 0), 1);

      root.style.setProperty("--p", p.toFixed(4));

      /* Progresso da tira de fundo: mesma rolagem, janela mais larga.
         Percorre de (rect.top = REEL_LEAD * viewport) até (--p = REEL_END). */
      var lead = REEL_LEAD * window.innerHeight;
      var span = lead + REEL_END * range;
      var reel = span > 0 ? (lead - rect.top) / span : 0;

      root.style.setProperty("--reel", Math.min(Math.max(reel, 0), 1).toFixed(4));

      /* 3b. O bloco final só fica interativo depois de aparecer */
      if (bridge) bridge.classList.toggle("is-active", p > 0.50);

      /* 3c. Avança/retrocede o vídeo conforme a mesma timeline */
      scrub(p);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ------- Menu mobile (placeholder da etapa 1) ------- */
  function burger() {
    var btn = document.querySelector("[data-burger]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      // Etapa 2: abrir/fechar o painel de navegação mobile.
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    reveal();
    counters();
    scrollFx();
    burger();
  });
})();
