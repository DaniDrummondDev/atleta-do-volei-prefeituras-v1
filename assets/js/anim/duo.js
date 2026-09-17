/* =========================================================
   PALCO DUPLO — seções 4 e 5 num único pin
   O maestro do scroll. Anime.js 4.5.0
   ---------------------------------------------------------
   O QUE MUDOU E POR QUÊ

   Antes: duas seções fixadas, uma embaixo da outra, cada uma com o seu
   onScroll e a sua régua. A passagem entre elas era rolagem vertical comum.

   Agora: um pin só. As duas seções são painéis lado a lado num trilho, e a
   passagem da 4 para a 5 é um DESLIZE HORIZONTAL do trilho. A régua é uma só,
   fica fora do trilho (por isso não desliza) e mede o palco inteiro.

   POR QUE UM MAESTRO, E NÃO TRÊS OBSERVADORES:
   deslize, coreografia da 4 e coreografia da 5 são agora TEMPOS DO MESMO
   MOVIMENTO. Três onScroll independentes não têm como garantir que o deslize
   só comece depois de a 4 terminar — cada um mediria a sua própria geometria,
   e a mesma rolagem daria resultados diferentes em cada tela. Com um driver
   só, um progresso único (0 -> 1) é fatiado em três atos e distribuído.

   OS TRÊS ATOS (as fronteiras saem do CSS, ver mais abaixo):

     p:  0 ............ f4 ...... fPan ................. 1
         |  coreografia  |deslize |   coreografia da 5   |
         |   da seção 4  |  4->5  |                      |

   CONTRATO PÚBLICO — window.DUO
     .fixo()        true se o palco está realmente fixado (pergunta ao CSS).
     .subscribe(fn) fn recebe { p, t4, pan, t5 } a cada frame de scroll.

   As seções 4 e 5 consultam window.DUO para escolher o driver delas. Se ele
   não existir (arquivo fora do ar) ou o palco não estiver fixado (telefone,
   movimento reduzido), cada uma volta ao gatilho próprio — ver os fallbacks
   em section-04.js e section-05.js.

   ORDEM DE CARGA: este arquivo vem ANTES dos dois no index.html. Com defer,
   a ordem das tags é a ordem de execução, então window.DUO já existe quando
   as seções procuram por ele.
   ========================================================= */
(function () {
  "use strict";

  var lib = window.anime;
  if (!lib) return;                  /* sem biblioteca: a rede .sem-anime resolve */

  var palco = document.querySelector('[data-anime="duo"]');
  if (!palco) return;

  var trilho = palco.querySelector(".duo__rail");
  var grude  = palco.querySelector(".duo__sticky");
  var rotulos = palco.querySelectorAll(".duo__timeline [data-cap]");

  /* ---------- o palco está mesmo fixado? ----------
     Perguntamos ao CSS, não à altura — mesma decisão (e mesmo motivo) da
     seçãoFixa() da seção 4: em telas pequenas e com movimento reduzido o CSS
     troca o sticky por static, e só ele sabe onde está esse ponto de corte.
     Perguntar direto mantém as duas pontas em sincronia sozinhas. */
  function fixo() {
    return !!grude && getComputedStyle(grude).position === "sticky";
  }

  /* ---------- as fronteiras dos atos, lidas do CSS ----------
     Os três cursos (--curso-4, --curso-pan, --curso-5) estão no .duo em vh e
     são a MESMA fonte que define a altura da seção. Ler daqui em vez de
     repetir os números é o que impede os dois lados de divergirem: mexeu no
     CSS para o deslize durar mais, este cálculo acompanha sem tocar no JS.

     Devolve as duas fronteiras como FRAÇÃO do curso total. */
  function fronteiras() {
    var css = getComputedStyle(palco);

    function curso(nome) {
      return parseFloat(css.getPropertyValue(nome)) || 0;
    }

    var c4 = curso("--curso-4");
    var cPan = curso("--curso-pan");
    var c5 = curso("--curso-5");
    var total = c4 + cPan + c5;

    /* Guarda: sem os tokens (CSS antigo em cache, por exemplo) caímos num
       terço para cada ato, que é feio mas não quebra. */
    if (!total) return { f4: 1 / 3, fPan: 2 / 3 };

    return { f4: c4 / total, fPan: (c4 + cPan) / total };
  }

  /* Recorta um pedaço [a, b] do progresso global e o reescala para 0..1.
     É a única conta deste arquivo, e as três chamadas abaixo saem dela. */
  function fatia(p, a, b) {
    if (b <= a) return p >= b ? 1 : 0;
    var v = (p - a) / (b - a);
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  var ouvintes = [];

  /* Só publicamos a API depois de saber que ela existe. subscribe() guarda o
     ouvinte e o chama uma vez na hora, com o estado atual: quem entra depois
     do primeiro frame não fica esperando o próximo scroll para se posicionar. */
  var estado = { p: 0, t4: 0, pan: 0, t5: 0 };

  window.DUO = {
    fixo: fixo,
    subscribe: function (fn) {
      if (typeof fn !== "function") return;
      ouvintes.push(fn);
      fn(estado);
    }
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* Palco solto (telefone): não instalamos driver nenhum. window.DUO continua
     publicado, mas fixo() devolve false e cada seção segue o caminho próprio.
     Repare que subscribe() ainda funciona e entrega p = 0 — é de propósito:
     quem assinar sem checar fixo() recebe um estado coerente em vez de nada. */
  if (!fixo()) return;

  /* ---------- 1. o quadro: escreve no DOM o que o progresso diz ----------
     Função PURA em relação ao scroll: recebe p e não pergunta nada ao mundo.
     É isso que a torna testável e que permite chamá-la tanto do onUpdate
     quanto da trava de borda. */
  var capAtual = -1;

  function pintar(p) {
    var lim = LIMITES;

    estado.p   = p;
    estado.t4  = fatia(p, 0, lim.f4);
    estado.pan = fatia(p, lim.f4, lim.fPan);
    estado.t5  = fatia(p, lim.fPan, 1);

    /* O deslize. translate3d fica no CSS; aqui só entregamos o número. */
    if (trilho) trilho.style.setProperty("--pan", estado.pan.toFixed(4));

    /* A RÉGUA UNIFICADA: --t é o progresso do palco INTEIRO, não o de uma
       seção. É o que faz a barra ser uma só — ela atravessa a 4, o deslize e
       a 5 sem reiniciar. O CSS que consome --t não mudou. */
    palco.style.setProperty("--t", p.toFixed(4));

    /* Rótulo em destaque: troca no meio do deslize, que é quando a tela deixa
       de ser mais da seção 4 e passa a ser mais da 5. */
    var cap = estado.pan < 0.5 ? 0 : 1;
    if (cap !== capAtual) {
      capAtual = cap;
      [].forEach.call(rotulos, function (el) {
        el.classList.toggle("is-current", parseInt(el.dataset.cap, 10) === cap);
      });
    }

    for (var i = 0; i < ouvintes.length; i++) ouvintes[i](estado);
  }

  /* As fronteiras são lidas uma vez e recalculadas ao redimensionar: os
     cursos são em vh, então mudar a altura da janela muda as proporções se
     alguém trocar os tokens por valores em px. Barato e à prova de surpresa. */
  var LIMITES = fronteiras();

  /* ---------- 2. o driver ----------
     Mesma receita das outras seções: um objeto JS raspado pelo scroll.
     ease linear + sync: true = a barra de rolagem É o relógio. */
  var agulha = { p: 0 };
  var CURSO = 1000;

  /* Trava de borda — o mesmo defeito conhecido da biblioteca que a seção 4 e
     o hero já tratavam: ao sair da faixa ela PARA de sincronizar e deixa o
     progresso congelado no último valor, em vez de grampeá-lo em 0 ou 1.
     Aqui isso seria pior que antes: com p travado em 0.98, o trilho ficaria
     preso no meio do deslize depois que a pessoa já passou da seção.

     Os nomes dos callbacks não seguem o sentido da rolagem (medido: subir
     para fora do início dispara onLeave), então não decoramos: perguntamos
     ao DOM de que lado o palco está. */
  function travarBorda() {
    var r = palco.getBoundingClientRect();
    if (r.top > 0) motor.seek(0);
    else if (r.bottom < window.innerHeight) motor.seek(CURSO);
    pintar(agulha.p);
  }

  var motor = lib.animate(agulha, {
    p: 1,
    ease: "linear",
    duration: CURSO,
    onUpdate: function () { pintar(agulha.p); },
    autoplay: lib.onScroll({
      target: palco,
      enter: "top top",
      leave: "bottom bottom",
      sync: true,
      onEnter: travarBorda,
      onLeave: travarBorda
    })
  });

  window.addEventListener("resize", function () {
    LIMITES = fronteiras();
    pintar(agulha.p);
  });

  /* Estado inicial: cobre recarregar a página no meio do palco, quando o
     onScroll só corrigiria no primeiro evento de rolagem. */
  pintar(0);
})();
