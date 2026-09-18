/* =========================================================
   AS LUZES DAS CIDADES — o mapa da seção 9
   ---------------------------------------------------------
   Os 21 pinos do mapa piscam como luzes de cidade: em ordem aleatória,
   nunca todos juntos, cada um com o tom do próprio pino.

   O QUE ESTE ARQUIVO FAZ, E SÓ ISSO:
     1. cria um <i> por pino, no lugar do pino;
     2. sorteia dois números por luz e os escreve como custom properties.

   A ANIMAÇÃO é CSS puro (@keyframes mapa-piscar, no style.css) — aqui não
   há laço, nem timer, nem requestAnimationFrame. Depois destas escritas o
   arquivo não faz mais nada pelo resto da vida da página. É a mesma divisão
   de trabalho do spots.js (seção 5), e pelo mesmo motivo: laço infinito não
   ganha nada indo para JS.

     --rgb     o tom da luz (canais soltos; ver o style.css)
     --ciclo   quanto dura uma volta inteira (piscada + pausa)
     --atraso  quando esta luz começa a sua volta

   NÃO DEPENDE DA BIBLIOTECA: são três propriedades de CSS e um <i>.
   Funciona com o CDN do Anime.js fora do ar.

   POR QUE OS PINOS SÃO RECRIADOS EM CIMA DA ARTE, E NÃO ANIMADOS:
   eles estão PINTADOS dentro do PNG. Não existe elemento para animar — o
   navegador vê um retângulo só. A alternativa seria apagar os pinos da
   imagem e redesenhá-los em DOM/SVG, o que mudaria a arte aprovada; aqui a
   arte fica intacta e o halo acende POR CIMA dela.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- A TABELA DE PINOS ----------
     [x, y, tom] — x e y em PORCENTAGEM da arte (1920x1080), com o ponto no
     BULBO da gota (a parte redonda), não no centro geométrico do pino: é de
     lá que a luz sai.

     MEDIDA, NÃO ESCRITA À MÃO: as coordenadas saíram de uma varredura do
     próprio section_09_map.png, achando os aglomerados de pixels saturados
     contra o fundo azul. Por isso são números quebrados.

     SE A ARTE DO MAPA MUDAR, esta tabela fica errada e as luzes acendem no
     lugar errado — é o ponto frágil do arquivo. Refazer a varredura é mais
     confiável que conferir pino a pino no olho. */
  var PINOS = [
    [30.55, 37.89, "verde"],
    [31.48, 37.97, "amarelo"],
    [32.16, 41.67, "laranja"],
    [31.07, 42.50, "amarelo"],
    [31.90, 46.02, "amarelo"],
    [33.57, 47.41, "laranja"],
    [31.59, 47.71, "verde"],
    [32.47, 48.24, "amarelo"],
    [31.43, 51.49, "laranja"],
    [31.07, 55.34, "laranja"],
    [31.54, 55.59, "verde"],
    [28.98, 55.74, "laranja"],
    [28.52, 57.25, "verde"],
    [29.66, 58.58, "laranja"],
    [30.13, 58.83, "verde"],
    [27.99, 61.58, "amarelo"],
    [29.66, 62.97, "laranja"],
    [27.68, 63.26, "verde"],
    [28.57, 63.73, "amarelo"],
    [26.85, 64.26, "laranja"],
    [27.73, 65.76, "laranja"]
  ];

  /* Os tons são os do próprio pino, clareados: o halo é LUZ, e luz é mais
     clara que o objeto que a emite. Medidos na arte e puxados para cima. */
  var TONS = {
    laranja: "255, 140, 66",
    amarelo: "255, 205, 90",
    verde:   "110, 214, 130"
  };

  var camada = document.querySelector('[data-mapa="luzes"]');
  if (!camada) return;

  /* Movimento reduzido: saímos antes de criar qualquer coisa. Não é só
     economia — é o próprio pedido: piscar é movimento e nada mais. O mapa
     continua com os pinos pintados, que é a informação. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* A volta inteira de uma luz: piscada curta e uma pausa longa.
     IGUAL PARA TODAS, como no spots.js — lá está medido por que sortear
     também o ciclo é pior: a deriva empilha piscadas simultâneas, e com o
     ciclo comum as fatias embaralhadas ficam espaçadas para sempre. */
  var CICLO = 7.0;

  /* Quanto da fatia de cada uma pode ser gasto em tremida. Abaixo de 1 para
     as fatias não se invadirem: é o que garante que duas luzes nunca comecem
     exatamente juntas. */
  var TREMIDA = 0.6;

  /* ---------- o baralho ----------
     Fisher-Yates sobre as FATIAS do ciclo, não sobre instantes soltos: com
     instantes, o acaso junta duas no mesmo momento com frequência (é o
     paradoxo do aniversário) e deixa buracos longos sem ninguém. Com fatias
     embaralhadas, o espaçamento é garantido e o que é aleatório é a ORDEM —
     que é o que "luzes de cidade" quer dizer. */
  var ordem = [];
  for (var i = 0; i < PINOS.length; i++) ordem.push(i);

  for (var j = ordem.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var troca = ordem[j];
    ordem[j] = ordem[k];
    ordem[k] = troca;
  }

  /* As fatias cobrem o ciclo INTEIRO: 21 luzes em 7s = uma piscada nova a
     cada 0.33s. Como a piscada dura 18% do ciclo (1.26s), há sempre umas
     três ou quatro acesas — nunca as 21, nunca nenhuma por muito tempo. */
  var fatia = CICLO / PINOS.length;

  /* Um fragmento só: 21 inserções soltas são 21 recálculos de layout. */
  var lote = document.createDocumentFragment();

  PINOS.forEach(function (pino, idx) {
    var luz = document.createElement("i");
    var atraso = ordem[idx] * fatia + Math.random() * fatia * TREMIDA;

    luz.style.left = pino[0] + "%";
    luz.style.top = pino[1] + "%";
    luz.style.setProperty("--rgb", TONS[pino[2]] || TONS.laranja);
    luz.style.setProperty("--ciclo", CICLO.toFixed(2) + "s");
    luz.style.setProperty("--atraso", atraso.toFixed(2) + "s");

    lote.appendChild(luz);
  });

  camada.appendChild(lote);
})();
