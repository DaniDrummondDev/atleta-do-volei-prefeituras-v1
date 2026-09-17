/* =========================================================
   SEÇÃO 4 — "O que a prefeitura ganha?"
   Animações com Anime.js 4.5.0 (sprint 5, fase 1)
   ---------------------------------------------------------
   REGRA DESTA MIGRAÇÃO: o comportamento não muda. Este arquivo reproduz,
   com a biblioteca, exatamente o que o main.js + style.css já faziam.
   Toda constante aqui é uma CÓPIA de um valor do CSS — as duas pontas estão
   marcadas com "espelha:" para quem for manter saber que andam juntas.

   Arquitetura (pedido do cliente):
     · onScroll() da biblioteca inicia/para as animações da seção;
     · dentro da seção, os recursos da biblioteca (stagger, eases, onUpdate).

   Três animações:
     1. revealUp()   — badge e as duas linhas do título sobem
     2. cardsIn()    — os 3 cards entram da direita com easing elástico
     3. timeline()   — a régua laranja avança com o scroll (seção fixada)

   COMO 2 E 3 SE LIGAM (mudou depois da sprint 5):
   os cards não têm mais gatilho próprio. Quem dá a partida em cada um é a
   régua: a barra começa toda cinza e, conforme o laranja avança e entra no
   terço de um card, aquele card entra. Rolar é o que comanda a sequência.

   A consequência disso é que os cards passaram a DEPENDER da régua andar —
   e a régua só anda enquanto a seção está fixada. Onde ela não fixa (telas
   pequenas, onde a seção vira altura de conteúdo), cardsIn() volta ao
   gatilho por card. Está explicado lá embaixo.
   ========================================================= */
(function () {
  "use strict";

  /* Sem biblioteca (CDN fora, SRI recusou, rede caiu), saímos em silêncio: a
     rede .sem-anime do main.js já deixou a seção no estado final. */
  var lib = window.anime;
  if (!lib) return;

  var section = document.querySelector('[data-anime="gains"]');
  if (!section) return;

  var animate = lib.animate;
  var onScroll = lib.onScroll;
  var stagger = lib.stagger;

  /* Avisa ao CSS que a seção passou a ser dirigida pela biblioteca.
     Isso é OBRIGATÓRIO, não cosmético: o Anime.js escreve style inline a cada
     frame, e a `transition` que o CSS coloca em [data-reveal] dispararia POR
     CIMA de cada escrita, criando um segundo interpolador brigando com o
     primeiro. A regra .is-anime no style.css desliga transition e animation. */
  section.classList.add("is-anime");

  /* Com movimento reduzido não instanciamos nada: o bloco da seção 8 do
     style.css já deixa cards, filetes e a régua no estado final. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* ---------- constantes espelhadas do CSS ---------- */

  /* espelha: --ease-out no :root (cubic-bezier(.22, 1, .36, 1))
     ATENÇÃO: na 4.5.0 a forma em STRING "cubicBezier(...)" foi removida do
     core — a biblioteca avisa no console e cai no easing padrão, silenciosa
     do ponto de vista visual. Tem de ser a função. Verificado no navegador:
     string -> 12.00 (= linear, ignorada) · função -> 46.63 (correta).
     A string 'outElastic(1, .3)' usada nos cards NÃO foi removida: dá 135.21,
     igual a eases.outElastic(1, .3). Por isso uma é função e a outra é
     string — não é inconsistência, é o que cada uma aceita nesta versão. */
  var EASE_OUT = lib.cubicBezier(.22, 1, .36, 1);

  /* Gatilho idêntico ao IntersectionObserver de threshold 0.2 do main.js:
     dispara quando 20% da altura do elemento já entrou pela base da tela.

     A ORDEM DAS PALAVRAS É "CONTAINER ALVO", não "alvo container".
     Está no fonte da biblioteca (dist/modules/events/scroll.js):

         const splitted = enter.split(' ');
         enterContainer = splitted[0];
         enterTarget    = splitted[1];

     Então:
       'end'        -> ponto do CONTAINER: a base da viewport
       'top+=20%'   -> ponto do ALVO: 20% abaixo do topo dele
     Lê-se: "dispara quando o ponto a 20% do alvo cruza a base da tela" —
     que é a definição de threshold 0.2 entrando por baixo.

     Os padrões da biblioteca, se nada for passado, são
     enterContainer='end' e enterTarget='start' (0% do alvo). */
  var ENTER_20 = "end top+=20%";

  /* ---------- 1. Badge e título sobem de baixo para cima ----------
     espelha: .gains__eyebrow[data-reveal] / .gains__line[data-reveal]
              transform: translateY(48px)
              transition: opacity .8s, transform .8s
              transition-delay: calc(var(--reveal-delay) * 110ms)
     Cada elemento mantém o gatilho próprio, como no main.js: eles estão
     empilhados, então entram na tela em momentos diferentes. */
  function revealUp() {
    var items = section.querySelectorAll(".gains__eyebrow, .gains__line");

    items.forEach(function (el) {
      animate(el, {
        opacity: [0, 1],
        translateY: [48, 0],
        duration: 800,
        delay: (parseFloat(el.dataset.revealDelay) || 0) * 110,
        ease: EASE_OUT,
        /* sync: 'play' = só toca ao entrar. Sem reverse nem reset, que é o
           comportamento do IntersectionObserver de hoje (dispara uma vez).
           O padrão da biblioteca seria 'play pause', que PAUSARIA a animação
           ao sair da tela — não é o que o main.js faz.

           `target` explícito, embora aqui ele coincida com o elemento animado:
           sem target, a biblioteca procura um alvo DOM entre os targets da
           animação, e se não achar (quando se anima um objeto JS, por exemplo)
           o gatilho dispara num ponto sem relação com o elemento. Deixar
           explícito tira essa dependência e é o que o teste compara. */
        autoplay: onScroll({ target: el, enter: ENTER_20, sync: "play" })
      });
    });
  }

  /* ---------- 2. Cards entram da direita, com elástico ----------
     espelha: @keyframes slide-right-elastic + [data-reveal="slide-right"]
              translate3d(90px) -> 0, 1.1s, outElastic(1, .3)
              animation-delay: calc(var(--reveal-delay) * 130ms)

     Os três cards estão lado a lado, então entram na viewport no MESMO
     instante — um gatilho só para os três é equivalente aos três gatilhos
     individuais de hoje, e o escalonamento vem do stagger.

     Por que opacity tem parâmetros próprios: se ela herdasse o ease elástico,
     oscilaria junto (a curva passa de 1.35 e volta a 0.87) e o card piscaria.
     No CSS isso estava resolvido pelos quadros de opacidade separados — a
     opacidade chegava a 1 em 24% de 1100ms = 264ms, em ritmo linear. */
  /* ---------- a entrada e a saída de um card ----------
     DURACAO, DESLOCAMENTO e EASE são os da animação original e não mudam.

     Por que opacity tem parâmetros próprios: se ela herdasse o ease elástico,
     oscilaria junto (a curva passa de 1.35 e volta a 0.87) e o card piscaria.
     A opacidade sobe em 264ms lineares, que é o que o CSS antigo fazia.

     A SAÍDA É LINEAR, por escolha do cliente.

       Chegou a ser o espelho exato da entrada, com inElastic — que é o
       inverso temporal de outElastic (verificado: inElastic(t) ==
       1 - outElastic(1 - t), erro zero). Ficou decidido que a volta não
       precisa de elástico: sair é desfazer, não um efeito por si.

       O elástico continua valendo na IDA, que é onde ele tem função.

       A opacidade mantém o desenho da entrada invertido: lá ela sobe nos
       primeiros 264ms, aqui desce nos ÚLTIMOS 264ms — daí o delay de
       1100 - 264. É o que faz o card continuar visível enquanto desliza para
       fora, em vez de sumir antes de sair.

     Repare que não há `from`. É de propósito: a animação parte do valor em
     que o card estiver AGORA. É isso que faz a inversão no meio do caminho
     ser contínua, sem salto, quando a pessoa muda o sentido da rolagem no
     meio de uma entrada. */
  var DURACAO = 1100;
  var FORA = 90;
  var FADE = 264;

  function entrar(card) {
    return animate(card, {
      translateX: { to: 0, duration: DURACAO, ease: "outElastic(1, .3)" },
      opacity:    { to: 1, duration: FADE,    ease: "linear" }
    });
  }

  function sair(card) {
    return animate(card, {
      translateX: { to: FORA, duration: DURACAO, ease: "linear" },
      opacity:    { to: 0, duration: FADE, delay: DURACAO - FADE, ease: "linear" }
    });
  }

  /* A seção está realmente fixada? É o que decide qual dos dois caminhos vale.

     Perguntamos ao CSS, e não à altura. "Mais alta que a tela" seria uma
     aproximação errada: em telas pequenas o CSS troca `position: sticky` por
     `static` e a altura por `auto`, e o conteúdo empilhado ainda passa de uma
     tela — a conta por altura diria "fixa" onde não fixa. Foi o que o teste
     em 390px pegou.

     Quem manda é a regra do style.css, e perguntar direto a ela mantém as
     duas pontas em sincronia sozinhas: mexeu no ponto de corte do media
     query, isto acompanha.

     MUDOU DE LUGAR: o sticky não é mais desta seção, é do PALCO DUPLO que
     agora abriga as seções 4 e 5 (ver anim/duo.js). Quem sabe responder isso
     passou a ser window.DUO.fixo(); o `false` do fim cobre o caso de o duo.js
     não ter carregado, e é o caminho conservador — sem palco, gatilho por
     card, que funciona sozinho. */
  function seçãoFixa() {
    return !!(window.DUO && window.DUO.fixo());
  }

  function cardsIn() {
    var cards = section.querySelectorAll(".gain");
    if (!cards.length) return [];

    /* ----- caminho 1: a régua comanda (telas normais) -----
       Devolve um interruptor por card. A régua chama definir(true) quando o
       laranja alcança o terço dele e definir(false) quando o laranja recua.
       Nada roda sozinho: quem manda é o scroll, nas duas direções. */
    if (seçãoFixa()) {
      return [].map.call(cards, function (card) {
        /* null = ainda não mexemos neste card. Diferente de false, que
           significa "mandei sair". Sem essa distinção, o primeiro definir(false)
           dispararia uma animação de saída num card que nunca entrou. */
        var dentro = null;

        return function definir(queroDentro) {
          if (dentro === queroDentro) return;      // já está assim: não repete
          if (dentro === null && !queroDentro) {   // nunca entrou e é para sair
            dentro = false;
            return;
          }
          dentro = queroDentro;
          if (queroDentro) entrar(card); else sair(card);
        };
      });
    }

    /* ----- caminho 2: sem régua, gatilho por card -----
       Sem pin, --t nunca avança, e cards presos à régua NUNCA apareceriam:
       ficariam em opacity 0 para sempre. Então aqui cada card volta a ter o
       gatilho próprio, com o escalonamento vindo do stagger em vez do scroll.
       Sem reversão também: sem régua não há como saber que o sentido mudou. */
    var list = section.querySelector(".gains__list");
    animate(cards, {
      translateX: { from: FORA, to: 0, duration: DURACAO, ease: "outElastic(1, .3)" },
      opacity:    { from: 0, to: 1, duration: FADE, ease: "linear" },
      delay: stagger(130, { start: 130 }),
      autoplay: onScroll({ target: list || cards[0], enter: ENTER_20, sync: "play" })
    });
    return [];
  }

  /* ---------- 3. Régua do tempo presa ao scroll ----------
     espelha: createTimelines() no main.js.

     Mapeamento dos limites (idêntico ao cálculo antigo):
       --t = 0  quando o TOPO da seção alcança o TOPO da viewport   -> 'top top'
       --t = 1  quando a BASE da seção alcança a BASE da viewport   -> 'bottom bottom'
     que é exatamente (-rect.top) / (offsetHeight - innerHeight).

     MUDOU COM O PALCO DUPLO: o driver de scroll saiu daqui. Esta função é
     hoje só o PINTOR — recebe um t de 0 a 1 e diz onde cada coisa da seção
     deveria estar. Quem produz o t é o anim/duo.js.

     Separar as duas coisas é o que permitiu a seção 4 virar painel sem que
     uma linha da coreografia mudasse; e é o que deixa o pintor testável, já
     que ele não pergunta nada ao scroll. */
  function timeline(entradas) {
    var steps = section.querySelectorAll("[data-step]");
    var count = parseInt(section.dataset.timelineSteps, 10) || 1;

    /* -1 = "ainda não pintei nenhuma". Guardar o último índice evita mexer no
       DOM a cada frame: só escrevemos quando ele MUDA. */
    var current = -1;

    /* Zona morta nas fronteiras dos terços.

       Sem ela, parar a rolagem exatamente em cima de uma fronteira faria o
       card piscar: qualquer tremido de 1px cruzaria o limite para os dois
       lados e a régua mandaria entrar e sair sem parar. Com a zona morta, o
       card entra ao passar da fronteira e só sai depois de recuar 2% a mais.
       2% de 260vh são uns 47px — bem acima de qualquer tremido, e bem abaixo
       do que alguém percebe como atraso. */
    var ZONA_MORTA = 0.02;

    /* Decide o estado de CADA card a partir do progresso, nos dois sentidos.

       Não é "dar partida em quem falta": é dizer a cada card onde ele deveria
       estar agora. Isso resolve de graça três casos que um contador
       incremental erraria:
         · rolar de volta   -> os cards saem, na ordem inversa;
         · saltar índices   -> link âncora ou arrastar a barra de rolagem;
         · recarregar a página no meio da seção.
       Como cada interruptor ignora ordens repetidas, chamar isto todo frame
       não custa nada. */
    function situarCards(t) {
      entradas.forEach(function (definir, i) {
        var fronteira = i / count;

        /* O limite de saída nunca desce abaixo de zero. Para o primeiro card
           a fronteira É zero, então "fronteira - ZONA_MORTA" daria -0.02 —
           um valor que --t, grampeado em [0, 1], jamais alcança. O card 1
           entraria e nunca mais sairia, por mais que a pessoa subisse. */
        var limiteSaida = Math.max(0, fronteira - ZONA_MORTA);

        var dentro = definir.dentroAgora === true
          ? t > limiteSaida                // já dentro: só sai se recuar além da zona
          : t > fronteira;                 // ainda fora: entra ao passar da fronteira

        definir.dentroAgora = dentro;
        definir(dentro);
      });
    }

    function paint(t) {
      /* --t continua sendo escrito aqui, embora a régua tenha saído da seção:
         ele é o progresso DESTA seção, e é por ele que o teste e o inspetor
         leem onde a coreografia está. A barra que a pessoa vê é outra — a
         régua unificada do palco, alimentada pelo duo.js. */
      section.style.setProperty("--t", t.toFixed(4));

      /* Fatias iguais; o último índice também cobre t === 1 exato. */
      var i = Math.min(Math.floor(t * count), count - 1);

      situarCards(t);

      if (i === current) return;
      current = i;

      steps.forEach(function (step) {
        step.classList.toggle("is-current", parseInt(step.dataset.step, 10) === i);
      });
    }

    /* ---- QUEM DÁ O PROGRESSO ----
       Desde o palco duplo (anim/duo.js), esta seção NÃO mede mais a própria
       geometria: ela virou um painel dentro de um pin que não é dela, e
       "top top / bottom bottom" aqui não significaria nada — o painel tem
       exatamente uma tela de altura, o curso daria zero e --t saltaria de 0
       para 1 de uma vez.

       Quem mede é o maestro, e ele entrega t4: o progresso do PRIMEIRO ATO,
       já recortado e reescalado para 0..1. Toda a pintura acima continua
       igual — só trocou a fonte do número, que era o objetivo de ter
       separado paint(t) do driver.

       Sem palco fixado (telefone, ou duo.js fora do ar) não há progresso
       nenhum a acompanhar: saímos, e quem cuida dos cards é o caminho 2 de
       cardsIn(), com gatilho por card. Os filetes laranja ficam todos acesos
       por regra de CSS no media query. */
    if (!window.DUO || !window.DUO.fixo()) return;

    window.DUO.subscribe(function (d) { paint(d.t4); });
  }

  /* Ordem importa: cardsIn() devolve as animações paradas, e é a timeline
     que dá partida nelas. */
  revealUp();
  timeline(cardsIn());
})();
