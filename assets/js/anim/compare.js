/* =========================================================
   COMPARADOR ANTES / DEPOIS — o círculo da seção 5
   ---------------------------------------------------------
   A pessoa pega a seta do centro e arrasta: para a direita revela o ANTES
   (a planilha), para a esquerda revela o DEPOIS (a quadra). Começa no meio,
   com metade de cada uma.

   POR QUE ESTE ARQUIVO NÃO DEPENDE DO ANIME.JS:
   isto é INTERAÇÃO, não animação. Se ele dependesse da biblioteca, cairia
   junto com ela — e num navegador sem o CDN a página mostraria as duas fotos
   empilhadas com uma alça que não faz nada. Aqui não: sem biblioteca, sem
   movimento reduzido, em qualquer caso, o comparador funciona.

   Está em anim/ por vizinhança (é da seção 5), não por parentesco.

   O QUE ELE ESCREVE, E SÓ ISSO:
     --split  no .trans__stage  — 0 a 100, a posição do corte
     aria-valuenow na seta      — o mesmo número, para leitores de tela
     .is-so-antes / .is-so-depois no palco — some com a legenda que sobrou
     .is-riscado nas pílulas    — o traço sobre as fontes espalhadas
     .ja-usou na seta           — desliga o pulso depois da primeira vez

   Todo o DESENHO fica no CSS, que lê --split em três lugares (o recorte da
   foto de cima, a linha do corte e o `left` da seta). Este arquivo não sabe
   o que é um círculo.

   POR QUE `left` E NÃO transform NA SETA:
   os dois níveis de transform dela já estão ocupados — o <span> pela entrada
   da coreografia (Anime.js), o <img> pelo pulso (CSS). Um terceiro anularia
   um deles. A regra está escrita no style.css, no topo do bloco da seção 5.
   ========================================================= */
(function () {
  "use strict";

  var camada = document.querySelector("[data-comparador]");
  if (!camada) return;

  var palco = camada.closest(".trans__stage");
  var seta = palco && palco.querySelector(".trans__seta");
  if (!palco || !seta) return;

  /* Onde as legendas desaparecem. Não é 0 e 100: a legenda tem de sumir
     quando a foto dela já é um filete, não quando ela acaba exatamente. */
  var SO_DEPOIS = 12;    /* abaixo disto, o "antes" virou um filete */
  var SO_ANTES  = 88;    /* acima disto, o "depois" virou um filete */

  /* As pílulas da esquerda, na ordem em que estão na tela (de cima para
     baixo). A ordem do DOM é a ordem visual, e é dela que saem os limiares. */
  var pilulas = [].slice.call(palco.querySelectorAll(".trans__pill"));

  /* Zona morta dos limiares do risco.

     Sem ela, parar o arrasto exatamente sobre um limiar faria o traço piscar:
     num círculo de 400px, 1px de tremido são 0.25% — e o traço leva 340ms
     para desenhar, então cada tremido viraria uma animação visível indo e
     voltando. Com a zona morta, o risco entra ao passar do limiar e só sai
     depois de recuar 1.5% além dele.

     É o mesmo remédio (e o mesmo motivo) da ZONA_MORTA dos cards da seção 4. */
  var ZONA_MORTA = 1.5;

  var PASSO = 2;         /* seta do teclado */
  var PASSO_GRANDE = 10; /* com Shift, ou PageUp/PageDown */

  var split = 50;

  /* ---------- a única função que escreve no DOM ----------
     Recebe uma posição em porcentagem, grampeia no intervalo válido e
     distribui. Tudo o que mexe no comparador passa por aqui — arrasto,
     teclado, o que vier depois. */
  /* ---------- os riscos sobre as fontes espalhadas ----------
     Conforme o computador aparece, as fontes que ele substitui vão sendo
     riscadas, de cima para baixo: 20% risca WHATSAPP, 40% PLANILHAS, e assim
     até 100%, GRUPOS. Voltar o arrasto desfaz os riscos na ordem inversa.

     Os limiares são CALCULADOS a partir de quantas pílulas existem, não
     escritos à mão cinco vezes: tirar ou acrescentar uma no HTML redistribui
     tudo sozinho. Com cinco, dá exatamente 20/40/60/80/100.

     Não é "riscar quem falta": é dizer a CADA pílula onde ela deveria estar
     agora, a partir do número. Isso resolve de graça os casos que um contador
     incremental erraria — arrastar de volta, saltar de ponta a ponta com
     Home/End, ou chegar aqui com o corte já fora do meio. */
  function riscar(pct) {
    var n = pilulas.length;
    if (!n) return;

    pilulas.forEach(function (pill, i) {
      /* (i+1) * 100 / n, e não (i+1) * (100/n): esta ordem fecha em 100
         exato na última, sem sobra de ponto flutuante. A última só risca no
         fim do curso, como foi pedido. */
      var limiar = (i + 1) * 100 / n;

      var riscada = pill.classList.contains("is-riscado")
        ? pct > limiar - ZONA_MORTA    /* já riscada: só sai se recuar além da zona */
        : pct >= limiar;               /* ainda limpa: risca ao passar do limiar */

      pill.classList.toggle("is-riscado", riscada);
    });
  }

  function definir(pct) {
    split = pct < 0 ? 0 : pct > 100 ? 100 : pct;

    palco.style.setProperty("--split", split.toFixed(2));
    seta.setAttribute("aria-valuenow", Math.round(split));

    palco.classList.toggle("is-so-depois", split <= SO_DEPOIS);
    palco.classList.toggle("is-so-antes", split >= SO_ANTES);

    riscar(split);
  }

  /* Converte um ponto da tela na posição do corte.
     Mede o palco a cada movimento, de propósito: a seção 5 é fixada e o
     círculo muda de tamanho com a janela (e com o deslize do palco duplo).
     Guardar o rect no pointerdown daria uma alça deslocada se algo mexesse
     no layout no meio do gesto. */
  function daTela(clientX) {
    var r = palco.getBoundingClientRect();
    if (!r.width) return split;
    return ((clientX - r.left) / r.width) * 100;
  }

  /* ---------- arrasto ----------
     Pointer Events cobre mouse, dedo e caneta num caminho só.
     setPointerCapture é o que faz o gesto continuar valendo quando o dedo
     sai de cima da seta — sem ele, arrastar rápido "solta" a alça. */
  function aoPegar(e) {
    if (!seta.classList.contains("is-ativa")) return;

    seta.setPointerCapture(e.pointerId);
    seta.classList.add("ja-usou");
    e.preventDefault();
  }

  function aoMover(e) {
    /* hasPointerCapture responde "este gesto é meu?" sem precisarmos de uma
       variável de estado paralela, que poderia dessincronizar. */
    if (!seta.hasPointerCapture(e.pointerId)) return;
    definir(daTela(e.clientX));
    e.preventDefault();
  }

  function aoSoltar(e) {
    if (seta.hasPointerCapture(e.pointerId)) seta.releasePointerCapture(e.pointerId);
  }

  seta.addEventListener("pointerdown", aoPegar);
  seta.addEventListener("pointermove", aoMover);
  seta.addEventListener("pointerup", aoSoltar);
  seta.addEventListener("pointercancel", aoSoltar);

  /* ---------- teclado ----------
     role="slider" promete estas teclas; cumprimos.
     Sentido: seta para a direita empurra o corte para a direita, que é o que
     a pessoa vê acontecer. */
  var TECLAS = {
    ArrowRight: +1, ArrowUp: +1,
    ArrowLeft: -1, ArrowDown: -1
  };

  seta.addEventListener("keydown", function (e) {
    if (!seta.classList.contains("is-ativa")) return;

    if (e.key === "Home") { definir(0); e.preventDefault(); return; }
    if (e.key === "End")  { definir(100); e.preventDefault(); return; }

    var sentido = TECLAS[e.key];
    if (e.key === "PageUp") sentido = +1;
    if (e.key === "PageDown") sentido = -1;
    if (!sentido) return;

    var passo = (e.shiftKey || e.key === "PageUp" || e.key === "PageDown")
      ? PASSO_GRANDE : PASSO;

    seta.classList.add("ja-usou");
    definir(split + sentido * passo);
    e.preventDefault();
  });

  /* ---------- quando a alça fica disponível ----------
     A regra: a seta só pega o gesto depois de ter ENTRADO na tela. Quem sabe
     esse momento é a coreografia, e é o section-05.js que põe .is-ativa.

     Só que a coreografia nem sempre roda — sem a biblioteca, ou com
     movimento reduzido, o section-05.js sai antes de chegar na seta. Nesses
     dois casos o CSS já mostra tudo no estado final, então a alça está
     visível desde o começo e quem acende é este arquivo.

     As duas condições são as MESMAS que o section-05.js testa para desistir.
     Se um dia mudarem lá, mudam aqui. */
  var semCoreografia = !window.anime ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (semCoreografia) seta.classList.add("is-ativa");

  /* Estado inicial: metade de cada imagem, como pedido. Chamado mesmo sendo
     o valor padrão do CSS, porque é ele que sincroniza o aria-valuenow e as
     classes das legendas com o número — um lugar só decide, sempre. */
  definir(50);
})();
