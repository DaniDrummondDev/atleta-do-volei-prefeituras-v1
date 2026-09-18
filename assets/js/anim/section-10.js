/* =========================================================
   SEÇÃO 10 — "Como implementamos" (a linha do tempo)
   Anime.js 4.5.0
   ---------------------------------------------------------
   A ROLAGEM É O RELÓGIO. Diferente das seções 8 e 9, aqui nada toca sozinho:
   a barra de rolagem é a agulha da animação. Rolar para baixo monta a seção,
   rolar para cima DESMONTA — a mesma receita do duo.js e do [data-enter]
   (ease linear + sync: true; ver o comentário em anim/effects.js).

   Por isso tudo vive numa ÚNICA createTimeline, e não em quatro animate()
   independentes como antes: com sync: true cada animate ganharia o seu
   próprio observador e a sua própria régua, e os quatro só ficariam em fase
   por coincidência. Numa linha do tempo só existe uma agulha, e as posições
   abaixo (o terceiro argumento de .add) são relativas a ela.

   A coreografia, na ordem em que a agulha passa:

     1. O TEXTO — pílula e título sobem de baixo para cima, opacidade 0 -> 1,
        escalonados na ordem do DOM (de cima para baixo na tela).
     2. O TRAÇO — cresce da esquerda para a direita (scaleX 0 -> 1).
     3. OS PASSOS — cada coluna entra DA ESQUERDA, uma de cada vez, atrás do
        traço que está passando.
     4. OS PONTOS — cada ponto surge em escala junto do seu passo.

   A CASCATA É DERIVADA, NÃO CHUTADA: PASSO = DUR_TRACO / número de passos.
   É essa divisão que faz os blocos entrarem no ritmo da varredura do traço.
   Escrito como divisão de propósito: mudar DUR_TRACO, ou acrescentar um sexto
   passo no HTML, mantém o ritmo sozinho.

   As durações aqui NÃO são tempo — são proporções do curso de rolagem. O
   total da linha do tempo é esticado sobre a faixa entre `enter` e `leave`,
   então o que importa é a razão entre elas. Dobrar todas não muda nada.

   O estado inicial (escondido, deslocado, traço em scaleX(0), ponto em
   scale(.4)) vem todo do style.css, e ele É o quadro 0 desta linha do tempo —
   é o que a pessoa vê antes de começar a rolar, e para onde ela volta se
   rolar de volta para cima. Sem a biblioteca ou com movimento reduzido nada
   disto roda e as redes do style.css devolvem tudo ao estado final.
   ========================================================= */
(function () {
  "use strict";

  var lib = window.anime;
  if (!lib) return;                  /* sem biblioteca: a rede .sem-anime resolve */

  var section = document.querySelector('[data-anime="passos"]');
  if (!section) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var onScroll = lib.onScroll;

  /* espelha: --ease-out no :root.
     Tem de ser a FUNÇÃO, não a string: na 4.5.0 a forma "cubicBezier(...)"
     em string saiu do core e a biblioteca cai no easing padrão sem avisar em
     tela. Está documentado com medições no topo do section-04.js.

     Aqui o easing não é "o tempo da animação" — é a forma de cada peça dentro
     do seu trecho do curso. O traço é a exceção, e está explicado lá embaixo. */
  var EASE = lib.cubicBezier(.22, 1, .36, 1);

  var SOBE_TXT = 24;    /* px — espelha: .passos [data-passo="txt"] { translateY(24px) } */
  var DUR_TXT = 260;
  var PASSO_TXT = 90;   /* o intervalo entre a pílula e o título */

  var INICIO_TRACO = 200;   /* o traço começa com o título já legível */
  var DUR_TRACO = 560;      /* a varredura inteira, da primeira à última coluna */

  var DUR_BLOCO = 240;
  var DUR_PONTO = 170;

  var textos = section.querySelectorAll('[data-passo="txt"]');
  var traco  = section.querySelector('[data-passo="traco"]');
  var blocos = section.querySelectorAll('[data-passo="bloco"]');
  var pontos = section.querySelectorAll('[data-passo="ponto"]');

  var PASSO_BLOCO = blocos.length ? DUR_TRACO / blocos.length : 0;

  /* ---------- A FAIXA DE ROLAGEM ----------
     Onde começa e onde termina o curso, na linguagem da biblioteca
     (ordem "ponto do CONTAINER, ponto do ALVO"):

       enter 'end center' -> o MEIO DA SEÇÃO (50% dela) cruzando a base da
                             tela, subindo. É o gatilho pedido: a seção só
                             começa a se montar quando a metade dela já
                             entrou. Como a seção tem 100vh, isto acontece com
                             o topo dela na metade da tela.
       leave 'start+=5% start' -> o topo da seção quase no topo da tela. A
                             coreografia FECHA um pouco antes de a seção
                             encaixar, e não no encaixe: terminar exato no
                             ponto de encaixe deixaria o último ponto
                             aparecendo no mesmo instante em que a rolagem
                             para — lê como atraso.

     O curso é, portanto, ~45% da altura da tela. Ele tem de caber ANTES do
     encaixe: a seção é 100vh com scroll-snap (data-snap), e depois de
     encaixada não sobra rolagem nenhuma dentro dela para raspar. É uma faixa
     CURTA, e essa é a consequência de disparar no meio: a coreografia inteira
     acontece na segunda metade da aproximação. Querer mais curso é mover o
     enter para baixo ('end-=15% start' era o valor anterior), não esticar as
     durações — elas são proporções, não tempo. */
  var ENTER = "end center";
  var LEAVE = "start+=5% start";

  /* ---------- TRAVA DE BORDA ----------
     Defeito conhecido da biblioteca, o mesmo que o duo.js, a seção 4 e o hero
     já tratavam: ao sair da faixa ela PARA de sincronizar e deixa o progresso
     CONGELADO no último valor, em vez de grampeá-lo em 0 ou 1. Sem isto, sair
     da faixa depressa (um Fim, um clique de âncora, um trackpad rápido)
     deixaria a seção montada pela metade para sempre.

     Os nomes dos callbacks não seguem o sentido da rolagem (medido no duo.js:
     subir para fora do início dispara onLeave), então não decoramos:
     perguntamos ao DOM de que lado a seção está. */
  function travarBorda() {
    var vh = window.innerHeight;
    var r = section.getBoundingClientRect();

    /* As duas contas espelham ENTER e LEAVE, e por isso são escritas do mesmo
       jeito que eles: a primeira é o MEIO da seção ainda abaixo da base da
       tela; a segunda, o topo da seção já acima dos 5%. Mudar um limite lá em
       cima sem mudar aqui deixa a trava prendendo no lugar errado. */
    if (r.top + r.height / 2 > vh) tl.seek(0);       /* ainda não entrou na faixa */
    else if (r.top < vh * .05) tl.seek(tl.duration); /* já passou dela */
  }

  var tl = lib.createTimeline({
    autoplay: onScroll({
      target: section,
      enter: ENTER,
      leave: LEAVE,
      sync: true,          /* a rolagem vira a agulha — e por isso reverte */
      onEnter: travarBorda,
      onLeave: travarBorda
    })
  });

  /* ---------- 1. o texto ----------
     A ordem do escalonamento é a ordem do DOM: pílula, título. Reordenar no
     HTML reordena a animação — está avisado lá também. */
  if (textos.length) {
    tl.add(textos, {
      opacity: [0, 1],
      translateY: [SOBE_TXT, 0],
      duration: DUR_TXT,
      delay: lib.stagger(PASSO_TXT),
      ease: EASE
    }, 0);
  }

  /* ---------- 2. o traço ---------- */
  if (traco) {
    tl.add(traco, {
      scaleX: [0, 1],
      duration: DUR_TRACO,
      /* LINEAR, e não EASE: o traço é a régua desta coreografia. Com easing
         ele desacelera no fim enquanto os blocos continuam entrando em
         intervalos iguais, e a linha passa a chegar DEPOIS do bloco que
         deveria estar anunciando. */
      ease: "linear"
    }, INICIO_TRACO);
  }

  /* ---------- 3. os passos, um de cada vez ----------
     Entram DA ESQUERDA (translateX negativo -> 0), no ritmo do traço.

     Começam junto com ele, e não depois: o primeiro bloco fica na ponta
     esquerda, ou seja, exatamente onde o traço nasce. */
  if (blocos.length) {
    tl.add(blocos, {
      opacity: [0, 1],
      translateX: [-18, 0],   /* px — espelha: [data-passo="bloco"] no CSS */
      duration: DUR_BLOCO,
      delay: lib.stagger(PASSO_BLOCO),
      ease: EASE
    }, INICIO_TRACO);
  }

  /* ---------- 4. os pontos ----------
     Mesmo escalonamento dos blocos, com meio bloco de atraso: o ponto é o
     carimbo de "esta etapa está na linha", e carimbar antes de o bloco
     terminar de entrar embaralha os dois gestos.

     O ponto vive DENTRO do bloco, e opacidade de pai e filho se MULTIPLICAM.
     É por isso que o atraso importa também tecnicamente: o bloco já está
     perto de 1 quando o ponto começa, então o ponto aparece na cor cheia.
     Antecipar isto não adianta o ponto — só o deixa cinzento. */
  if (pontos.length) {
    tl.add(pontos, {
      opacity: [0, 1],
      scale: [.4, 1],   /* espelha: .passos__ponto { transform: scale(.4) } */
      duration: DUR_PONTO,
      delay: lib.stagger(PASSO_BLOCO),
      ease: EASE
    }, INICIO_TRACO + DUR_BLOCO * .5);
  }

  /* Estado inicial: cobre recarregar a página já dentro (ou depois) da faixa,
     quando o observador só corrigiria no primeiro evento de rolagem. */
  travarBorda();
})();
