/* =========================================================
   EFEITOS DE SCROLL GENÉRICOS — Anime.js 4.5.0 (sprint 5, fase 2)
   ---------------------------------------------------------
   Substitui createParallax() e createEnters(), que viviam no main.js.
   Vale para TODO [data-parallax] e [data-enter] da página, em qualquer
   seção — inclusive nas que ainda não existem.

   POR QUE ESTE ARQUIVO NÃO É "POR SEÇÃO", como os outros:
   o plano da sprint previa um arquivo por seção, e para o que é específico de
   uma seção (o reveal em bloco da seção 2, a timeline da seção 4) isso vale.
   Mas [data-parallax] e [data-enter] são efeitos POR ELEMENTO, dirigidos por
   atributo, e aparecem em várias seções. Quebrá-los por seção duplicaria o
   mesmo laço em dois arquivos e criaria duas cópias para manter em sincronia.
   Mantê-los genéricos é o que o main.js já fazia — a migração não muda a
   arquitetura, só o motor.

   O QUE ANIMAMOS: as custom properties --py e --e, não as propriedades
   finais. A conta que transforma esses números em pixels e opacidade continua
   no CSS ([data-parallax] e [data-enter] na seção 6 do style.css), com
   --enter-y e tudo mais. Assim:
     · o CSS segue sendo a fonte única da aparência;
     · sem a biblioteca, a rede .sem-anime usa o MESMO CSS para deixar tudo
       no estado final, sem uma segunda implementação para divergir;
     · trocar 110px por 130px nos cards continua sendo uma linha de CSS.
   ========================================================= */
(function () {
  "use strict";

  var lib = window.anime;
  /* sem biblioteca, quem cuida da página é a rede .sem-anime (main.js + a
     seção 6c do style.css): o conteúdo aparece, só não anima */
  if (!lib) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var animate = lib.animate;
  var onScroll = lib.onScroll;

  /* A duração é arbitrária em tudo que usa sync: true. O relógio da animação
     é a barra de rolagem; a biblioteca mapeia o trecho [enter, leave] para
     [0, 1] de progresso. 1000 é só um número redondo para ler no debug. */
  var SCRUB = 1000;

  /* ---------------------------------------------------------------
     A REALIMENTAÇÃO DO RECT AO VIVO — leia isto antes de mexer nos
     limites abaixo.

     O main.js calcula tudo a partir de getBoundingClientRect(), que é a
     posição RENDERIZADA do elemento — ou seja, já inclui o transform que a
     própria animação acabou de aplicar. Isso cria uma realimentação: a
     animação move o elemento, o movimento muda a medida, a medida muda a
     animação. Não foi projetado assim, mas é o que está no ar, e a regra
     desta sprint é não mudar o que está no ar.

     O Anime.js, ao contrário, mede a posição ESTÁTICA do elemento (sem o
     transform). É a medida mais sã das duas — e por isso mesmo dá um
     resultado diferente.

     Medido no navegador, a diferença chegava a 8.7px no parallax e a 0.29
     (de 0 a 1) nas entradas. Longe de imperceptível.

     A correção não é reintroduzir a realimentação: é DESLOCAR os limites
     pela mesma distância, o que dá o mesmo resultado sem o laço. Cada função
     abaixo explica a sua conta.
     --------------------------------------------------------------- */

  /* Monta "base+=N" ou "base-=N" com o sinal certo, porque as amplitudes
     podem ser negativas (o card__photo usa -26) e "end-=-26" não existe. */
  function desloca(base, px) {
    var n = Math.round(px);
    if (!n) return base;
    return base + (n > 0 ? "-=" : "+=") + Math.abs(n);
  }

  /* ---------------------------------------------------------------
     A POLUIÇÃO DA RÉGUA — a segunda armadilha, e a mais escondida.

     A biblioteca calibra o observador medindo o elemento DEPOIS de aplicar o
     valor INICIAL da animação. Então a régua dela não nasce na posição
     estática: nasce deslocada do quanto esse valor inicial desloca.

       parallax : começa em --py = +amp   -> régua deslocada de amp
       entradas : começa em --e  = 0,
                  e o CSS traduz isso em (1-0) * --enter-y
                                          -> régua deslocada de --enter-y

     Todos os limites que passamos herdam esse deslocamento, então cada um
     desconta o seu. Sem isso, medido no navegador:
       · o --e começava em estático.top = 676 em vez de 790 (110px = --enter-y)
       · o --py ficava 1.974px fora em TODA a faixa — um deslocamento
         constante de 40px de scroll, que é a amplitude.

     Por que o valor é calculado e não medido do DOM: o deslocamento é sempre
     o do valor inicial, aconteça o que acontecer antes. Medir o transform
     vigente daria o número certo no carregamento e o número errado ao
     recriar as animações depois de um resize, quando o elemento pode estar
     no meio da animação.

     E a régua herda também o transform dos ANCESTRAIS. O .card__phone vive
     dentro de um .card, que é [data-enter] e nasce 110px deslocado: a régua
     do celular nasce 110px fora, e esse erro nunca mais sai — não é um
     transitório da entrada do card, é um desvio permanente. Media 5.8px de
     parallax, o tempo todo. herdado() soma esses deslocamentos.
     --------------------------------------------------------------- */

  /* Deslocamento inicial que vem dos ancestrais, e que a biblioteca embute na
     régua ao calibrar. Hoje só [data-enter] desloca ancestrais; se um dia
     outro efeito fizer isso, é aqui que ele entra. */
  function herdado(el) {
    var total = 0;
    var pai = el.parentElement;
    while (pai) {
      if (pai.hasAttribute("data-enter")) {
        /* mesmo raciocínio de enters(): --e nasce em 0, logo o deslocamento
           inicial é (1 - 0) * --enter-y */
        total += parseFloat(getComputedStyle(pai).getPropertyValue("--enter-y")) || 44;
      }
      pai = pai.parentElement;
    }
    return total;
  }

  /* ---------- Parallax ----------
     espelha: createParallax() no main.js.

       t = (vh - r.top) / (vh + r.height)
       --py = (0.5 - t) * 2 * amp

     Ou seja, --py vai de +amp a -amp enquanto o elemento ATRAVESSA a tela
     inteira:
       t = 0  quando o topo do elemento toca a base da tela
       t = 1  quando a base do elemento sai pelo topo

     Em posição ESTÁTICA esses dois pontos seriam os limites padrão do
     onScroll ('end start' e 'start end'). Mas o main.js mede a posição
     renderizada, e nela o elemento já está deslocado de --py:

       no começo  --py = +amp  -> o elemento está amp ABAIXO do estático,
                                  então ele "toca a base" amp mais cedo
       no fim     --py = -amp  -> está amp ACIMA, e "sai pelo topo" amp
                                  mais cedo também

     Deslocar os dois limites de amp reproduz isso sem o laço de
     realimentação. O curso encurta de 80px (2*amp), que é justamente a
     inclinação de ~4.9% que o teste tinha flagrado. */
  function parallax() {
    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      var amp = parseFloat(el.dataset.parallax) || 40;
      /* +amp do próprio valor inicial, mais o que vier dos ancestrais */
      var p = amp + herdado(el);

      animate(el, {
        "--py": [amp + "px", -amp + "px"],
        ease: "linear",              /* a rolagem é o easing */
        duration: SCRUB,
        autoplay: onScroll({
          target: el,
          /* topo do elemento na base da tela, amp mais cedo.
             Com a régua já deslocada de amp, os dois amp se cancelam e o
             limite volta a ser o padrão — mas escrito por extenso, para a
             conta ficar legível. */
          enter: desloca("end", amp - p) + " start",
          /* base do elemento no topo da tela, amp mais cedo */
          leave: desloca("start", -(amp + p)) + " end",
          sync: true
        })
      });
    });
  }

  /* ---------- Entradas dirigidas pelo scroll ----------
     espelha: createEnters() no main.js.

       travel = data-enter * vh
       delay  = data-enter-delay * vh
       e = (vh - r.top - delay) / travel     (grampeado em 0..1)

     Onde r.top é a posição RENDERIZADA, deslocada de (1 - e) * --enter-y
     para baixo pelo CSS de [data-enter]. No começo (e = 0) o elemento está
     --enter-y abaixo do lugar dele; no fim (e = 1) está no lugar.

     Resolvendo em posição ESTÁTICA, que é o que a biblioteca mede:

       e = 0  quando estático.top = vh - delay - enterY
       e = 1  quando estático.top = vh - delay - travel

     Repare que só o INÍCIO muda: no fim, e = 1 e o deslocamento é zero, então
     os dois sistemas já concordavam ali. O teste mostrou exatamente isso —
     divergência só na travessia, com 0 e 1 batendo.

     Para os cards, enterY é 110px e travel é 0.26 * 900 = 234px: quase
     metade do curso. Ignorar isso não seria um detalhe.

     Os limites saem em PIXELS porque misturam duas origens (delay é fração
     de tela, enterY é px fixo do CSS) e a biblioteca só aceita um operador
     por expressão. Como px não acompanha redimensionamento, refazemos tudo
     no resize — ver o final do arquivo.

     sync: true mantém a animação REVERSÍVEL: rolar para cima desfaz, que é o
     comportamento do data-enter e o que diferencia ele do data-reveal. */
  function enters() {
    document.querySelectorAll("[data-enter]").forEach(function (el) {
      var vh = window.innerHeight;
      var travel = (parseFloat(el.dataset.enter) || 0.4) * vh;
      var delay = (parseFloat(el.dataset.enterDelay) || 0) * vh;

      /* --enter-y vem do CSS (110px nos cards), com 44px de padrão — o mesmo
         valor que está no fallback de var(--enter-y, 44px). Ler daqui mantém
         o CSS como fonte única: mudar lá continua bastando. */
      var enterY = parseFloat(getComputedStyle(el).getPropertyValue("--enter-y")) || 44;
      /* --e começa em 0, e o CSS traduz isso em (1-0) * --enter-y de
         deslocamento: é esse o quanto a régua da biblioteca nasce fora */
      var p = enterY;

      animate(el, {
        "--e": [0, 1],
        ease: "linear",
        duration: SCRUB,
        autoplay: onScroll({
          target: el,
          enter: desloca("end", delay + enterY - p) + " start",
          leave: desloca("end", delay + travel - p) + " start",
          sync: true
        })
      });
    });
  }

  /* Os limites de enters() são calculados em px a partir da altura da tela,
     então precisam ser refeitos quando ela muda. remove() desfaz as animações
     do elemento (e os observadores presos a elas) antes de recriar.
     O parallax não entra aqui: os limites dele dependem só da amplitude, que
     é um px fixo, e a biblioteca já resolve 'end'/'start' contra o tamanho
     vivo do container. */
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      document.querySelectorAll("[data-enter]").forEach(function (el) {
        lib.remove(el);
      });
      enters();
    }, 200);
  });

  parallax();
  enters();
})();
