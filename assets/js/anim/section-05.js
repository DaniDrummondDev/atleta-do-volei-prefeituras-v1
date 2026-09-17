/* =========================================================
   SEÇÃO 5 — "A transformação"
   Coreografia única, raspada pelo scroll — Anime.js 4.5.0
   ---------------------------------------------------------
   Diferente das outras seções, aqui NÃO há uma animação por elemento com
   gatilho próprio. Há uma PARTITURA: uma createTimeline com tudo em
   sequência, e o scroll é quem a percorre. Rolar para frente toca,
   rolar para trás desfaz, parar no meio congela no meio.

   POR QUE UMA TIMELINE E NÃO N ANIMAÇÕES:
   o pedido foi "quero um ritmo, tudo em sequência". Ritmo é posição relativa
   no tempo — é exatamente o que uma timeline expressa e o que N observadores
   independentes não conseguem garantir. Com a partitura, mudar o compasso de
   um trecho reposiciona o resto sozinho.

   COMO A PARTITURA SE LIGA AO SCROLL:
   há dois caminhos, os dois medidos e funcionando. `observador.link(tl)`
   serve — desde que chamado DEPOIS de a timeline ter os filhos; passar
   `autoplay: onScroll(...)` na criação NÃO funciona, porque nesse instante a
   timeline ainda tem duração 0 e o scrub fica parado em zero o tempo todo.

   Aqui usamos o outro: um seek() na partitura a cada frame, a partir de um
   progresso de 0 a 1. A razão é que esse mesmo progresso também liga o pulso
   da seta — com link() isso ficaria em dois lugares e poderia sair de
   sincronia.

   DE ONDE VEM O PROGRESSO (mudou): esta seção virou o segundo painel do
   PALCO DUPLO, um pin único que ela divide com a seção 4. Quem mede o scroll
   é o anim/duo.js e entrega t5 por window.DUO.subscribe(). Sem palco fixado
   (telefone) não há o que raspar, e a partitura toca uma vez — ver
   tocarUmaVez() lá embaixo.

   EASING: linear em tudo, por escolha do cliente. Quem dá o ritmo é a
   partitura, não a curva de cada passo.
   ========================================================= */
(function () {
  "use strict";

  var lib = window.anime;
  if (!lib) return;                  /* sem biblioteca: a rede .sem-anime resolve */

  var section = document.querySelector('[data-anime="trans"]');
  if (!section) return;

  var createTimeline = lib.createTimeline;
  var onScroll = lib.onScroll;

  section.classList.add("is-anime");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var $ = function (sel) { return section.querySelector(sel); };
  var $$ = function (sel) { return [].slice.call(section.querySelectorAll(sel)); };

  /* ---------- A PARTITURA ----------
     Os números são COMPASSOS, não milissegundos: o relógio é a barra de
     rolagem. O que importa é a distância entre eles, que é o ritmo.

     Ler de cima para baixo é ler a animação na ordem em que ela acontece.
     Para atrasar um trecho, mexa no número dele; o resto não se move, porque
     todas as marcas são absolutas. */
  var C = {
    badge:   0,
    linha:   120,     /* passo entre as 5 linhas do título */
    foto:    360,     /* entra junto com a linha "para um" (3ª: 0 + 2*120) */
    fotoDur: 520,     /* ...e chega na metade em 620, quando as pílulas começam */
    pill:    620,     /* primeira pílula */
    pillGap: 120,     /* uma de cada vez */
    antes:   900,     /* logo depois da 3ª pílula, "Rede sociais" (620 + 2*120) */
    seta:    1220,    /* depois da última pílula (620 + 4*120 = 1100) */
    logo:    1340,    /* e o logo com os arcos, ao mesmo tempo */
    spot:    1460,    /* primeiro ponto do anel */
    spotGap: 90,      /* o anel fecha num ritmo mais rápido */
    rotulo:  40,      /* o rótulo entra logo atrás do seu ponto */
    dur:     260      /* duração padrão de um passo */
  };

  var ESCONDIDO = 0, VISIVEL = 1;

  function partitura() {
    var tl = createTimeline({ autoplay: false, defaults: { ease: "linear" } });

    /* 1. Badge e as 5 linhas do título, de baixo para cima */
    tl.add($(".trans__eyebrow"),
      { opacity: [ESCONDIDO, VISIVEL], translateY: [28, 0], duration: C.dur }, C.badge);

    $$(".trans__line").forEach(function (linha, i) {
      tl.add(linha,
        { opacity: [ESCONDIDO, VISIVEL], translateY: [28, 0], duration: C.dur },
        C.badge + (i + 1) * C.linha);
    });

    /* 2. A foto redonda: escala e opacidade, começando na linha "para um" */
    tl.add($(".trans__foto"),
      { opacity: [ESCONDIDO, VISIVEL], scale: [0.6, 1], duration: C.fotoDur }, C.foto);

    /* 3. As pílulas da esquerda, uma de cada vez */
    $$(".trans__pill span").forEach(function (pill, i) {
      tl.add(pill,
        { opacity: [ESCONDIDO, VISIVEL], duration: C.dur },
        C.pill + i * C.pillGap);
    });

    /* 4. "ANTES", disparado pela 3ª pílula */
    /* o <span> de dentro, nao o <p>: o <p> usa transform para se posicionar */
    tl.add($(".trans__antes span"),
      { opacity: [ESCONDIDO, VISIVEL], translateY: [22, 0], duration: C.dur }, C.antes);

    /* 5. A seta do centro (o pulso dela é CSS, ligado mais abaixo) */
    tl.add($(".trans__seta"),
      { opacity: [ESCONDIDO, VISIVEL], scale: [0.4, 1], duration: C.dur }, C.seta);

    /* 6. O logo e os dois arcos, no mesmo compasso */
    tl.add($(".trans__logo"),
      { opacity: [ESCONDIDO, VISIVEL], scale: [0.7, 1], duration: C.dur }, C.logo);

    $$(".trans__arco").forEach(function (arco) {
      tl.add(arco, { opacity: [ESCONDIDO, VISIVEL], duration: C.dur * 1.6 }, C.logo);
    });

    /* 7. O anel: cada ponto cresce, e o rótulo entra pela esquerda logo atrás */
    $$(".trans__spot").forEach(function (spot, i) {
      var quando = C.spot + i * C.spotGap;
      tl.add(spot.querySelector("i"),
        { opacity: [ESCONDIDO, VISIVEL], scale: [0, 1], duration: C.dur }, quando);
      tl.add(spot.querySelector("b"),
        { opacity: [ESCONDIDO, VISIVEL], translateX: [-18, 0], duration: C.dur },
        quando + C.rotulo);
    });

    return tl;
  }

  /* ---------- sem palco: a partitura toca uma vez ----------
     Só vale quando o palco duplo NÃO está fixado (telefone, ou duo.js fora do
     ar). Ali não existe curso de rolagem para raspar, e sem isto a seção
     inteira ficaria em opacity 0 para sempre — o CSS esconde tudo o que a
     coreografia anima.

     Então a partitura vira uma animação comum: toca do começo ao fim quando a
     seção entra na tela, no ritmo dela mesma. Perde-se o scrub (rolar para
     trás não desfaz), que é justamente o que não existe sem pin. */
  function tocarUmaVez() {
    var tl = partitura();
    var seta = $(".trans__seta");

    /* Os compassos viram milissegundos sem conversão: a partitura fecha em
       ~2.5s, que é uma duração honesta para uma entrada. Foi por isso que os
       números dela foram escolhidos nessa ordem de grandeza.

       O observador é usado SOLTO, só pelo callback — não como autoplay. É a
       forma que funciona com timeline: passar onScroll() como autoplay na
       criação falha, porque nesse instante a timeline ainda tem duração 0
       (está explicado no cabeçalho deste arquivo). */
    onScroll({
      target: section,
      enter: "end top+=20%",
      onEnter: function () {
        tl.play();
        /* is-ativa junto do pulso: ver o mesmo par em aoRolar() */
        if (seta) seta.classList.add("is-pulsando", "is-ativa");
      }
    });
  }

  function reger() {
    var tl = partitura();
    var seta = $(".trans__seta");

    /* Em que fração da partitura a seta entra. Calculado, não repetido à mão:
       mexer em C.seta reposiciona o pulso junto. */
    var FRACAO_SETA = (C.seta + C.dur) / tl.duration;

    function aoRolar(progresso) {
      /* --t desta seção. A régua que a pessoa vê NÃO é mais desta seção: é a
         régua unificada do palco duplo, e quem a enche é o duo.js, com o
         progresso das duas seções somadas. O que sobra aqui é o progresso
         local — útil para inspecionar e para os testes. */
      section.style.setProperty("--t", progresso.toFixed(4));

      /* O pulso da seta é um laço contínuo, a única coisa aqui que não é
         raspada pelo scroll. Liga quando a coreografia passa da entrada dela
         e desliga ao voltar, para não ficar pulsando um elemento invisível.

         .is-ativa anda junto, e pelo mesmo motivo: a seta é a alça do
         comparador (anim/compare.js), e uma alça invisível e arrastável sobre
         a foto seria pior que nenhuma. As duas classes respondem à mesma
         pergunta — "a seta já entrou?" — mas são separadas porque o pulso
         ainda pode ser desligado por fora, depois do primeiro arrasto. */
      if (seta) {
        var entrou = progresso >= FRACAO_SETA;
        seta.classList.toggle("is-pulsando", entrou);
        seta.classList.toggle("is-ativa", entrou);
      }
    }

    function pintar(p) {
      tl.seek(p * tl.duration);
      aoRolar(p);
    }

    /* ---- QUEM DÁ O PROGRESSO ----
       Desde o palco duplo (anim/duo.js), esta seção não mede mais a própria
       geometria: ela é um painel dentro de um pin que não é dela. O maestro
       entrega t5 — o progresso do terceiro ato, que começa em zero no exato
       instante em que o deslize horizontal termina.

       A agulha saiu: era ela que raspava o scroll, e isso agora é trabalho do
       maestro. O que ficou é o pintor — recebe p e posiciona a partitura. */
    window.DUO.subscribe(function (d) { pintar(d.t5); });
  }

  /* Palco fixado -> coreografia raspada pelo scroll (o normal).
     Palco solto  -> a partitura toca uma vez ao entrar na tela. */
  if (window.DUO && window.DUO.fixo()) reger();
  else tocarUmaVez();
})();
