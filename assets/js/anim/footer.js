/* =========================================================
   FOOTER — entrada escalonada, da esquerda para a direita
   Anime.js 4.5.0
   ---------------------------------------------------------
   Quando a rolagem chega AO FIM DA PÁGINA, os textos sobem de baixo para cima
   e o logo só aparece. Nada entra tudo de uma vez: há um passo entre um e
   outro, e a ordem é da ESQUERDA para a DIREITA.

   "AO FIM DA PÁGINA" É LITERAL, e não "quando o footer aparece": são coisas
   diferentes, e a diferença é a altura do footer. Está explicado no gatilho,
   lá embaixo.

   COMO A ORDEM "DA ESQUERDA PARA A DIREITA" É GARANTIDA, SEM UMA LISTA:
   ela é a ordem do DOM. As três colunas estão escritas no HTML na ordem em
   que aparecem na tela, e dentro de cada uma de cima para baixo, então um
   único querySelectorAll já devolve tudo na ordem certa — e o stagger da
   biblioteca aplica o atraso pelo índice.

   O preço disso é uma dependência que não se vê: REORDENAR AS COLUNAS NO HTML
   REORDENA A ANIMAÇÃO. Está avisado lá também. A alternativa seria numerar
   cada elemento à mão, o que criaria duas listas para manter em sincronia.

   POR QUE UM ARQUIVO SÓ PARA ISTO, se o projeto tem [data-reveal]:
   o [data-reveal] do CSS não tem mais um motor genérico. Desde a sprint 5 cada
   seção anima o que é seu, e o que restou no style.css é só o estado inicial.
   Um módulo por seção é o padrão daqui.

   Sem a biblioteca ou com movimento reduzido nada disto roda, e as redes do
   style.css (seções 6c e 8) devolvem tudo ao estado final.
   ========================================================= */
(function () {
  "use strict";

  var lib = window.anime;
  if (!lib) return;                  /* sem biblioteca: a rede .sem-anime resolve */

  var foot = document.querySelector('[data-anime="foot"]');
  if (!foot) return;

  /* Sem .is-anime aqui, ao contrário das outras seções: aquela classe existe
     para desligar as transitions que o CSS põe em [data-reveal], e no footer
     não há nenhuma nos elementos animados. A única transition daqui é a cor
     do :hover dos links, que o Anime.js não toca. */

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* espelha: .foot__desc e cia. { transform: translateY(24px) } no style.css */
  var SOBE = 24;
  var DURACAO = 700;
  var PASSO = 70;      /* o atraso entre um elemento e o seguinte */

  /* espelha: --ease-out no :root. Tem de ser a FUNÇÃO, não a string: na 4.5.0
     a forma "cubicBezier(...)" em string foi removida do core e a biblioteca
     cai no easing padrão sem avisar em tela. Está explicado com medições no
     cabeçalho do section-04.js. */
  var EASE = lib.cubicBezier(.22, 1, .36, 1);

  /* ---------- O GATILHO: o FIM DA PÁGINA, e nada antes ----------
     Pedido do cliente, e literal: a entrada só começa quando a rolagem chega
     ao fim da página.

     POR QUE NÃO onScroll DA BIBLIOTECA, como no resto do projeto:
     o onScroll dispara quando um ponto do ALVO cruza um ponto da TELA, e o
     ponto mais tardio que ele oferece é a base do footer cruzando a base da
     viewport. Só que o footer tem uma altura própria — hoje uns 270px — e
     essa altura entra na conta: com "end top+=20%" a animação partia uns
     216px ANTES do fim da página. Em telas curtas a diferença cresce, porque
     o footer ocupa uma fatia maior da tela.

     Pior: mexer no conteúdo do footer muda a altura dele e, com ela, o ponto
     de disparo — o gatilho ficaria dependendo de quantas linhas tem a
     descrição. A conta abaixo não depende de nada disso. Ela pergunta o que a
     regra diz, na letra: a rolagem chegou ao fim?

     A FOLGA existe porque a conta raramente fecha exata: com zoom, com
     densidade de tela fracionária ou com barra de rolagem sobreposta, a soma
     fica 1 ou 2px curta do total e a condição nunca seria verdadeira. */
  var FOLGA = 4;

  function noFimDaPagina() {
    var doc = document.documentElement;
    return window.innerHeight + window.scrollY >= doc.scrollHeight - FOLGA;
  }

  /* As duas animações nascem PARADAS. O estado inicial (escondido, deslocado)
     já vem do CSS, então não há piscada enquanto elas esperam. */

  /* O logo SÓ aparece: sem deslocamento, por pedido do cliente. Ele é o
     primeiro da fila. */
  var logo = foot.querySelector(".foot__logo");
  var entraLogo = logo && lib.animate(logo, {
    opacity: [0, 1],
    duration: DURACAO,
    ease: "linear",          /* só opacidade: uma curva aqui não tem o que moldar */
    autoplay: false
  });

  /* Os textos sobem, um atrás do outro.

     A ORDEM É A DO DOM, e o seletor junta os quatro tipos de elemento numa
     lista só de propósito: é isso que faz o índice do stagger correr contínuo
     ATRAVÉS das colunas. Uma animação por coluna faria os atrasos recomeçarem
     do zero em cada uma, e as três entrariam ao mesmo tempo.

     start: PASSO reserva o primeiro passo para o logo, que ficou de fora
     desta animação (ele não se desloca) mas é o primeiro da fila na tela. */
  var textos = foot.querySelectorAll(
    ".foot__desc, .foot__head, .foot__list li, .foot__copy, .foot__social"
  );
  if (!textos.length) return;

  var entraTextos = lib.animate(textos, {
    opacity: [0, 1],
    translateY: [SOBE, 0],
    duration: DURACAO,
    delay: lib.stagger(PASSO, { start: PASSO }),
    ease: EASE,
    autoplay: false
  });

  /* Uma vez só. Depois de tocar, os ouvintes saem: a entrada não se desfaz ao
     subir, que é o comportamento do resto do projeto (sync: 'play' lá). */
  var tocou = false;

  function conferir() {
    if (tocou || !noFimDaPagina()) return;
    tocou = true;

    if (entraLogo) entraLogo.play();
    entraTextos.play();

    window.removeEventListener("scroll", conferir);
    window.removeEventListener("resize", conferir);
  }

  window.addEventListener("scroll", conferir, { passive: true });

  /* resize também: girar o telefone ou abrir o teclado muda a altura da
     janela, e com ela o que conta como "fim da página". */
  window.addEventListener("resize", conferir);

  /* E uma conferida agora, para o caso de a página abrir já no fim —
     recarregar com a posição de rolagem restaurada pelo navegador. */
  conferir();
})();
