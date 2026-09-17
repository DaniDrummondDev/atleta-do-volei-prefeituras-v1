/* =========================================================
   SEÇÃO 7 — BENEFÍCIOS (carrossel raspado pelo scroll)
   ---------------------------------------------------------
   Cinco slides, um por tela de rolagem. Não há timer, não há botão: a barra
   de rolagem é o controle. Parar no meio de uma troca congela a troca no
   meio; subir desfaz.

   NÃO HÁ ANIMAÇÃO DE ENTRADA, por pedido do cliente. Nada aqui nasce
   escondido esperando um gatilho — o que anima é só a TROCA de um slide para
   o outro. Por isso este arquivo não usa onScroll da biblioteca com "enter" e
   "leave": ele mede a seção e pinta, sempre.

   O PROGRESSO, E COMO ELE VIRA CINCO SLIDES:
   p vai de 0 a 1 ao longo da seção. Multiplicado pelo número de TROCAS
   (slides - 1, ou seja 4), vira f: 0 no primeiro slide, 4 no último, e os
   valores quebrados são as trocas.

     f:  0 --------- 1 --------- 2 --------- 3 --------- 4
         slide 0     slide 1     slide 2     slide 3     slide 4

   A COREOGRAFIA DA TROCA É SEQUENCIAL, NÃO CRUZADA.
   O pedido foi "o texto que está na tela sai e vai para baixo, e o próximo
   entra de baixo para cima". Se os dois se movessem ao mesmo tempo eles se
   atravessariam no meio do caminho, os dois a meia opacidade, um por cima do
   outro. Então a troca é dividida em dois tempos: primeiro um sai, depois o
   outro entra, e entre os dois há um instante sem texto nenhum.

     x = f - i, a distância deste slide até a agulha

     x:  -0.30 ...... 0 ......... 0.40 ...... 0.70
         |  entrando  |  parado   |  saindo   |
         (sobe, 0->1)             (desce, 1->0)

   Repare que o começo do "entrando" de um (-0.30) é o fim do "saindo" do
   anterior (0.70 - 1 = -0.30). Os dois encostam sem se sobrepor.

   AS FOTOS SÃO OUTRO CASO: elas não se movem, só trocam de opacidade, e a
   troca é CRUZADA de propósito — uma troca seca no meio de uma rolagem
   piscaria. É a única coisa aqui que não segue a regra do texto, e é
   deliberada; se o cliente preferir o corte seco, é a função fotoDe() abaixo.

   NÃO DEPENDE DO ANIME.JS: são custom properties escritas num ouvinte de
   scroll comum, com uma pintura por quadro. A seção não tem estado inicial
   escondido, então mesmo que tudo falhe ela fica no primeiro slide, inteira
   e legível — que é o motivo de não haver animação de entrada aqui.
   ========================================================= */
(function () {
  "use strict";

  var secao = document.querySelector('[data-anime="bene"]');
  if (!secao) return;

  var marca = secao.querySelector(".bene__rail-mark");

  /* Os grupos que trocam. Cada um é uma lista indexada por slide, e todos
     têm o mesmo tamanho — é o data-slide do HTML que os amarra. */
  var fotos   = secao.querySelectorAll(".bene__card");
  var textos  = secao.querySelectorAll(".bene__text");
  var legenda = secao.querySelectorAll(".bene__cap");
  var palavra = secao.querySelectorAll(".bene__word");
  var indices = secao.querySelectorAll(".bene__rail-i");

  var TOTAL = fotos.length;
  if (!TOTAL) return;

  /* Quantas trocas existem. Com 5 slides, 4 — e é por 4 que o progresso é
     multiplicado, não por 5: o último slide fica no fim do curso, não a um
     quinto do fim. */
  var TROCAS = Math.max(1, TOTAL - 1);

  /* ---------- os tempos da troca ----------
     Frações de UMA troca. Mexer aqui muda o ritmo de todas de uma vez.
     PARADO precisa ser o maior: é o tempo em que o slide fica legível. */
  var PARADO = 0.40;   /* até aqui o slide não se mexe */
  var SAINDO = 0.70;   /* daqui em diante ele já saiu por completo */

  /* Quanto tempo a foto fica em opacidade cheia antes de começar a sumir,
     em frações de uma troca. O resto é rampa.

     ESTE NÚMERO NÃO É LIVRE, e foi um teste que mostrou isso. A primeira
     versão dava às fotos uma rampa de 0.60 para cada lado, escolhida no olho.
     No meio de uma troca as duas ficavam em 0.167 e a soma caía para 0.333:
     um escurecimento do painel a cada slide, que eu não veria numa captura
     parada. Duas rampas lineares só somam 1 se a subida de uma for exatamente
     a descida da outra.

     Com platô P, a rampa vai de P a 1-P, e aí a conta fecha em qualquer
     ponto — está demonstrado em tests/bene.node.mjs, que varre a seção
     inteira somando as cinco. Mexer em FOTO_PLATO mantém a soma: mexer na
     FORMA da rampa (para um ease, por exemplo) quebra, e aí as duas pontas
     têm de ser espelhadas de propósito. */
  var FOTO_PLATO = 0.20;

  function grampo(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ---------- onde o TEXTO deste slide está, dado x ----------
     Devolve { on, sobe }: opacidade de 0 a 1, e deslocamento de 0 a 1 (1 =
     deslocado por inteiro, para baixo). Quem transforma isso em pixels é o
     CSS, com o token --sobe — a conta da aparência não sobe para cá. */
  function textoDe(x) {
    /* já passou: saiu de cena */
    if (x > SAINDO) return { on: 0, sobe: 1 };

    /* saindo: desce e some */
    if (x > PARADO) {
      var s = (x - PARADO) / (SAINDO - PARADO);
      return { on: 1 - s, sobe: s };
    }

    /* parado: é o slide da vez */
    if (x >= 0) return { on: 1, sobe: 0 };

    /* entrando: sobe e aparece. A janela é o espelho da de saída. */
    var janela = 1 - SAINDO;
    if (x > -janela) {
      var e = (x + janela) / janela;
      return { on: e, sobe: 1 - e };
    }

    /* ainda não chegou: esperando embaixo */
    return { on: 0, sobe: 1 };
  }

  /* ---------- onde a FOTO deste slide está ----------
     Platô e rampa, simétricos nos dois sentidos: cheia enquanto a agulha está
     a menos de FOTO_PLATO dela, e caindo a zero até 1 - FOTO_PLATO.

     É o que faz duas vizinhas somarem SEMPRE 1 durante a troca — nem
     escurecer no meio, nem estourar. Em x e x-1 as duas parcelas são
     (1-P-a) e (a-P) sobre o mesmo (1-2P), e a soma é o próprio denominador.

     PARA TIRAR O CROSSFADE e ter corte seco no meio da troca, troque o corpo
     por:  return Math.abs(x) < 0.5 ? 1 : 0;  (a soma continua 1). */
  function fotoDe(x) {
    var a = x < 0 ? -x : x;
    if (a <= FOTO_PLATO) return 1;
    if (a >= 1 - FOTO_PLATO) return 0;
    return (1 - FOTO_PLATO - a) / (1 - 2 * FOTO_PLATO);
  }

  /* ---------- pinta um grupo inteiro ----------
     Um laço só para os quatro grupos de texto: eles seguem exatamente a mesma
     regra, e escrever quatro laços iguais seria quatro lugares para
     dessincronizar. */
  function pintarTextos(lista, f) {
    for (var i = 0; i < lista.length; i++) {
      var e = textoDe(f - i);
      var el = lista[i];
      el.style.setProperty("--on", e.on.toFixed(3));
      /* O deslocamento é escrito como uma fração de --sobe; o CSS resolve a
         unidade. Assim trocar 2.6% por 4% é uma linha de CSS. */
      el.style.setProperty("--y", "calc(var(--sobe) * " + e.sobe.toFixed(3) + ")");
    }
  }

  var atual = -1;

  function pintar(p) {
    var f = p * TROCAS;

    pintarTextos(textos, f);
    pintarTextos(legenda, f);
    pintarTextos(palavra, f);

    for (var i = 0; i < fotos.length; i++) {
      fotos[i].style.setProperty("--on", fotoDe(f - i).toFixed(3));
    }

    /* O filete do trilho desliza com f; o CSS o multiplica pela altura de uma
       fatia. Nenhuma tabela de posições para manter em sincronia com o HTML. */
    if (marca) marca.style.setProperty("--f", f.toFixed(4));

    /* O número aceso é o mais próximo. Só mexemos no DOM quando ele MUDA. */
    var perto = Math.round(f);
    if (perto === atual) return;
    atual = perto;

    for (var j = 0; j < indices.length; j++) {
      indices[j].classList.toggle("is-on", j === perto);
    }
  }

  /* ---------- o progresso ----------
     A conta é a mesma dos outros palcos fixados do projeto:
       0 quando o TOPO da seção alcança o topo da tela
       1 quando a BASE da seção alcança a base da tela
     Feita à mão, e não com onScroll da biblioteca, por dois motivos: esta
     seção não depende do Anime.js para nada, e aqui não existe "entrar" e
     "sair" — ela é pintada sempre que está por perto. */
  function medir() {
    var r = secao.getBoundingClientRect();
    var curso = secao.offsetHeight - window.innerHeight;
    if (curso <= 0) return 0;
    return grampo(-r.top / curso);
  }

  /* Uma pintura por quadro, no máximo. O evento de scroll dispara mais vezes
     que a tela repinta; sem isto, seriam escritas jogadas fora. */
  var agendado = false;

  function aoRolar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      pintar(medir());
    });
  }

  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("resize", aoRolar);

  /* Estado inicial: cobre recarregar a página no meio da seção, quando o
     primeiro evento de scroll só viria depois de a pessoa mexer. */
  pintar(medir());
})();
