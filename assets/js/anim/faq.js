/* =========================================================
   SEÇÃO 11 — Accordion das perguntas frequentes
   ---------------------------------------------------------
   NÃO depende do window.anime, de propósito: isto é interação, não
   animação de entrada. Se o CDN da biblioteca cair, o accordion continua
   abrindo e fechando normalmente — quem anima a altura é a transição CSS
   de .faq__painel (style.css, seção 11).

   A REGRA PEDIDA: ao clicar num item, todos os outros fecham ANTES de o
   clicado abrir. Isso é uma sequência no tempo, não um estado:

       clique -> fecha o aberto -> espera a transição -> abre o novo

   POR QUE height EM PIXELS E NÃO max-height:
   `height: auto` não transiciona. O truque comum é max-height com um valor
   grande chutado, mas aí a duração real varia com o tamanho do texto (um
   painel curto "termina" muito antes do fim da transição, e a animação
   parece travada). Aqui a altura real é medida (scrollHeight) e escrita em
   px, então todo painel leva exatamente o mesmo tempo. Ao terminar de
   abrir, a altura volta para `auto` — senão um painel aberto não
   acompanharia o texto se a janela mudasse de largura.

   ONDE MEXER NO FUTURO:
     DUR ................. duração da transição (precisa BATER com o CSS)
     abrir() / fechar() .. as duas únicas funções que mexem no DOM
     hidden .............. é ele que tira o painel fechado do fluxo e da
                           navegação por teclado; sem ele, o Tab entra
                           dentro de painéis invisíveis

   ONDE PODE QUEBRAR:
     - Trocar a duração no CSS sem trocar DUR aqui: o painel "pisca" no fim
       (a altura vira auto antes de a transição acabar) ou fica um atraso
       morto antes de abrir o próximo.
     - Ids duplicados no HTML (aria-controls apontando para o painel
       errado): a tela parece certa, o leitor de tela lê o item errado.
   ========================================================= */
(function () {
  'use strict';

  /* Duração da transição de altura, em ms. ESPELHO de --faq-dur no CSS.
     As duas precisam ser iguais: o CSS desenha, este número agenda. */
  var DUR = 380;

  /* Quem não quer movimento não espera movimento: com prefers-reduced-motion
     a troca é instantânea (o CSS já zera a transição; aqui zeramos a espera
     entre fechar e abrir, senão sobraria uma pausa sem motivo na tela). */
  var semMovimento = window.matchMedia &&
                     window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var espera = semMovimento ? 0 : DUR;

  var lista = document.querySelector('[data-faq="lista"]');
  if (!lista) return;   /* seção fora da página: nada a fazer */

  var botoes = Array.prototype.slice.call(lista.querySelectorAll('.faq__btn'));
  if (!botoes.length) return;

  /* Guarda o timer da sequência "fecha -> abre". Se o usuário clicar duas
     vezes rápido, o agendamento antigo é cancelado: sem isso, dois painéis
     poderiam abrir juntos, que é exatamente o que o pedido proíbe. */
  var agendado = null;

  /* O painel que cada botão controla. Lido do aria-controls e não do
     "próximo irmão" porque o contrato de acessibilidade é o aria-controls —
     assim o HTML pode ser reorganizado sem quebrar o JS. */
  function painelDe(btn) {
    return document.getElementById(btn.getAttribute('aria-controls'));
  }

  function estaAberto(btn) {
    return btn.getAttribute('aria-expanded') === 'true';
  }

  /* ---------- abrir ----------
     Sai de 0px e vai até a altura medida. O `hidden` sai ANTES da medição:
     um elemento escondido tem scrollHeight 0 e o painel abriria para lugar
     nenhum. O reflow forçado (leitura de offsetHeight) existe para o
     navegador registrar o 0px como ponto de partida — sem ele as duas
     alturas caem no mesmo frame e não há transição nenhuma. */
  function abrir(btn) {
    var painel = painelDe(btn);
    if (!painel) return;

    btn.setAttribute('aria-expanded', 'true');
    painel.hidden = false;
    painel.classList.add('is-aberto');

    painel.style.height = '0px';
    void painel.offsetHeight;                       /* reflow proposital */
    painel.style.height = painel.scrollHeight + 'px';

    /* Altura fixa em px é só o trilho da animação. No fim ela vira auto
       para o painel seguir o texto (janela redimensionada, fonte trocada). */
    window.setTimeout(function () {
      if (estaAberto(btn)) painel.style.height = 'auto';
    }, espera);
  }

  /* ---------- fechar ----------
     O caminho inverso: de `auto` não dá para transicionar, então primeiro
     fixamos a altura atual em px, forçamos o reflow e só então vamos a 0.
     O `hidden` volta no fim, quando o painel já encolheu — devolvê-lo antes
     cortaria a animação pela metade. */
  function fechar(btn) {
    var painel = painelDe(btn);
    if (!painel) return;

    btn.setAttribute('aria-expanded', 'false');
    painel.classList.remove('is-aberto');

    painel.style.height = painel.scrollHeight + 'px';
    void painel.offsetHeight;                       /* reflow proposital */
    painel.style.height = '0px';

    window.setTimeout(function () {
      if (!estaAberto(btn)) {
        painel.hidden = true;
        painel.style.height = '';
      }
    }, espera);
  }

  /* ---------- o clique ----------
     Três caminhos, nesta ordem:
       1. clicou no que já estava aberto  -> só fecha (accordion sanfona)
       2. havia outro aberto              -> fecha ele, ESPERA, abre o novo
       3. estava tudo fechado             -> abre na hora, sem espera
     O caso 2 é a regra pedida; o 3 existe para o primeiro clique não ter um
     atraso inexplicável. */
  botoes.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (agendado) { window.clearTimeout(agendado); agendado = null; }

      if (estaAberto(btn)) { fechar(btn); return; }

      var aberto = botoes.filter(estaAberto);
      if (!aberto.length) { abrir(btn); return; }

      aberto.forEach(fechar);
      agendado = window.setTimeout(function () {
        agendado = null;
        abrir(btn);
      }, espera);
    });
  });
})();
