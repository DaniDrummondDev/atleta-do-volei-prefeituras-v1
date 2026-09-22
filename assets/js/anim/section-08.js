/* =========================================================
   SEÇÃO 8 — "Tudo o que o vôlei precisa. Em um só lugar."
   Anime.js 4.5.0
   ---------------------------------------------------------
   Três movimentos, nesta ordem:

     1. O TEXTO entra de baixo para cima, opacidade 0 -> 1. Os três blocos
        (pílula, título, lista) sobem escalonados, de cima para baixo.
     2. OS CELULARES entram UM DE CADA VEZ, também de baixo para cima: o de
        trás primeiro, o da frente depois e o terceiro por último.
     3. Quando um celular PARA, ele começa o wiggle — o balanço suave e
        infinito. O wiggle não está aqui: é CSS (@keyframes plat-wiggle), e
        este arquivo só liga a chave, com a classe .is-parado. Laço infinito
        não ganha nada indo para JS, e é a convenção do projeto desde a
        seção 2.

   A FRONTEIRA ENTRE JS E CSS, que é o ponto delicado desta seção:
   o JS anima a DIV .plat__phone e o CSS balança a IMG de dentro. São dois
   elementos porque são dois `transform` — no mesmo elemento, o segundo
   apagaria o primeiro e o celular saltaria de volta para a posição de
   partida no instante em que o balanço começasse.

   O estado inicial (escondido, deslocado) vem todo do style.css, então não
   há piscada enquanto o script do CDN não chegou. Sem a biblioteca ou com
   movimento reduzido, nada disto roda e as redes do style.css devolvem tudo
   ao estado final.
   ========================================================= */
(function () {
  "use strict";

  var lib = window.anime;
  if (!lib) return;                  /* sem biblioteca: a rede .sem-anime resolve */

  var section = document.querySelector('[data-anime="plat"]');
  if (!section) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var animate = lib.animate;
  var onScroll = lib.onScroll;

  /* espelha: --ease-out no :root.
     Tem de ser a FUNÇÃO, não a string: na 4.5.0 a forma "cubicBezier(...)"
     em string saiu do core e a biblioteca cai no easing padrão sem avisar em
     tela. Está documentado com medições no topo do section-04.js. */
  var EASE = lib.cubicBezier(.22, 1, .36, 1);

  var SOBE_TXT = 24;    /* px — espelha: [data-plat="txt"] { translateY(24px) } */
  var DUR_TXT = 760;
  var PASSO_TXT = 110;  /* o atraso entre um bloco de texto e o seguinte */

  var DUR_PHONE = 900;
  var ESPERA_PHONE = 320;   /* depois do texto: o texto lê primeiro */
  var PASSO_PHONE = 260;    /* "um de cada vez": o intervalo entre celulares */

  /* ---------- O GATILHO ----------
     Mesmo da seção 2: dispara quando a SEÇÃO está praticamente toda na tela,
     e não elemento a elemento. É o que faz a coreografia começar do começo,
     em vez de o texto já ter entrado antes de a pessoa ver a seção.

     Na linguagem da biblioteca (ordem "container alvo"):
       'start+=15%' -> ponto do CONTAINER: 15% da altura da tela, do topo
       'start'      -> ponto do ALVO: o topo da seção

     15% e não os 2% da seção 2: esta seção tem exatamente 100vh e encaixa
     (data-snap). Esperar os 98% de visibilidade aqui deixava a entrada
     começar tarde demais — a pessoa já estava com a seção inteira na frente,
     parada, olhando o espaço em branco. */
  var ENTER = "start+=15% start";

  /* ---------- 1. o texto ----------
     A ordem do escalonamento é a ordem do DOM: pílula, título, lista, que é
     como eles aparecem na tela, de cima para baixo. Reordenar no HTML
     reordena a animação — está avisado lá também. */
  var textos = section.querySelectorAll('[data-plat="txt"]');

  if (textos.length) {
    animate(textos, {
      opacity: [0, 1],
      translateY: [SOBE_TXT, 0],
      duration: DUR_TXT,
      delay: lib.stagger(PASSO_TXT),
      ease: EASE,
      autoplay: onScroll({ target: section, enter: ENTER, sync: "play" })
    });
  }

  /* ---------- 2. os celulares, um de cada vez ----------
     Uma animação POR celular, e não uma só com stagger, porque cada uma
     precisa do próprio onComplete: é ele que acende o wiggle daquele
     aparelho, no instante em que AQUELE parou. Com uma animação só, o
     onComplete dispararia uma vez, no fim de todos — e o primeiro celular
     ficaria imóvel esperando o segundo.

     O deslocamento inicial vem do CSS (--sobe, em %) e aqui a subida é
     escrita como "de 8% para 0%" para casar com ele. Em porcentagem, e não
     em px, porque a unidade é a ALTURA DO PRÓPRIO CELULAR: assim a entrada
     tem a mesma cara na tela grande e na pequena, onde o aparelho é menor. */
  var phones = section.querySelectorAll('[data-plat="phone"]');

  Array.prototype.forEach.call(phones, function (phone, i) {
    animate(phone, {
      opacity: [0, 1],
      translateY: ["8%", "0%"],
      duration: DUR_PHONE,
      delay: ESPERA_PHONE + i * PASSO_PHONE,
      ease: EASE,
      autoplay: onScroll({ target: section, enter: ENTER, sync: "play" }),

      /* 3. parou de entrar -> começa a balançar.
         A classe fica; o wiggle é infinito e não tem por que ser desligado
         ao sair da tela — o navegador já não pinta o que não está visível. */
      onComplete: function () {
        phone.classList.add("is-parado");
      }
    });
  });
})();
