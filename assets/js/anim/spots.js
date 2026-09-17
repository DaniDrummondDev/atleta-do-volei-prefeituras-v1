/* =========================================================
   O RESPIRO DOS PONTOS — o anel da direita, seção 5
   ---------------------------------------------------------
   Os dez pontos laranja piscam de 100% a 20% e voltam, em ordem aleatória e
   nunca todos juntos.

   O QUE ESTE ARQUIVO FAZ, E SÓ ISSO:
   sorteia dois números por ponto e os escreve como custom properties. A
   ANIMAÇÃO é CSS puro (@keyframes spot-respirar, no style.css) — aqui não há
   laço, nem timer, nem requestAnimationFrame. Depois destas 10 escritas o
   arquivo não faz mais nada pelo resto da vida da página.

     --ciclo   quanto dura uma volta inteira (piscada + pausa)
     --atraso  quando este ponto começa a sua volta

   POR QUE SORTEAR NO JS, SE OS ÂNGULOS DOS PONTOS ESTÃO NO HTML:
   --ang é DADO do item — "Atletas" fica a -60 graus, sempre, e por isso mora
   no HTML. O atraso não é dado de coisa nenhuma: ele precisa ser diferente a
   cada visita, que é o que "ordem aleatória" quer dizer. Valores fixos no
   HTML dariam sempre a mesma ordem, para todo mundo, para sempre.

   ONDE OS NÚMEROS SÃO ESCRITOS, E POR QUÊ NÃO NO PONTO:
   no .trans__spot (o <li>), não no <i>. O <i> é o elemento que a coreografia
   anima, e style inline dele é território do Anime.js. Custom properties
   herdam, então escrever no pai chega ao ::after do mesmo jeito — sem dividir
   o atributo style com ninguém.

   NÃO DEPENDE DA BIBLIOTECA: são duas propriedades de CSS. Funciona com o CDN
   fora do ar, e com movimento reduzido ele nem chega a sortear.
   ========================================================= */
(function () {
  "use strict";

  var pontos = document.querySelectorAll(".trans__spot");
  if (!pontos.length) return;

  /* Movimento reduzido: saímos antes de escrever qualquer coisa. Sem --ciclo,
     o valor de reserva do CSS (0s) deixa os pontos acesos e parados — que é
     exatamente o estado final. Não dependemos do !important global da seção 8
     para isso; aqui a animação simplesmente não existe. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* A volta inteira de um ponto: piscada curta e uma pausa longa.
     O MESMO para todos os dez, e isso foi MEDIDO, não escolhido no gosto.

     A primeira versão sorteava também o ciclo, para as fases derivarem e a
     ordem nunca se repetir. Simulando 30 minutos: com ciclos entre 7 e 9.5s,
     a deriva empilhava QUATRO OU MAIS pontos piscando juntos em 12% do tempo,
     chegando a sete. Estreitar a faixa não ajudou (11.4%) — o empilhamento
     vem da deriva em si, não do tamanho dela.

     Com o ciclo igual para todos, as fatias embaralhadas ficam espaçadas para
     sempre e o empilhamento cai a ZERO: nunca mais de três ao mesmo tempo,
     média de dois. O preço é a ordem sorteada se repetir a cada volta — e ela
     é imperceptível, porque a ordem é aleatória no ANEL, não uma varredura de
     um ponto para o vizinho. Trocamos uma variedade que ninguém vê por uma
     garantia que todo mundo vê. */
  var CICLO = 8.0;

  /* Quanto da fatia de cada um pode ser gasto em tremida. Abaixo de 1 para as
     fatias não se invadirem: é o que garante que dois pontos nunca comecem
     exatamente juntos. Com 0.6, sobram pelo menos 0.32s entre duas piscadas. */
  var TREMIDA = 0.6;

  /* ---------- o baralho ----------
     Fisher-Yates. Cada ponto recebe uma FATIA diferente do ciclo, e são as
     fatias que são embaralhadas — não os instantes.

     A diferença importa: sorteando um instante solto para cada ponto, o acaso
     junta dois no mesmo momento com frequência (é o paradoxo do aniversário)
     e deixa buracos longos sem ninguém. Distribuindo fatias e embaralhando,
     o espaçamento fica garantido e o que é aleatório é a ORDEM — que é o que
     foi pedido. */
  var ordem = [];
  for (var i = 0; i < pontos.length; i++) ordem.push(i);

  for (var j = ordem.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var troca = ordem[j];
    ordem[j] = ordem[k];
    ordem[k] = troca;
  }

  /* As fatias cobrem o ciclo INTEIRO: com dez pontos em 8s, uma piscada nova
     começa a cada 0.8s. Como a piscada dura 1.6s (20% do ciclo), há sempre
     uns dois no ar — nunca os dez, nunca nenhum por muito tempo. */
  var fatia = CICLO / pontos.length;

  [].forEach.call(pontos, function (spot, i) {
    var atraso = ordem[i] * fatia + Math.random() * fatia * TREMIDA;

    spot.style.setProperty("--ciclo", CICLO.toFixed(2) + "s");
    spot.style.setProperty("--atraso", atraso.toFixed(2) + "s");
  });
})();
