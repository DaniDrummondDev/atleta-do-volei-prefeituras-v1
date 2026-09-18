/* ============================================================
   scroll-hint.js — indicador fixo "ROLE PARA BAIXO"
   ------------------------------------------------------------
   O QUE FAZ
   Cria UM único bloco (ícone assets/images/mouse.png + texto
   "ROLE PARA BAIXO" em laranja) preso ao rodapé da janela.
   Ele não acompanha o scroll: fica sempre visível, acima de
   todo o resto da página.

   POR QUE DIRETO NO <body>
   `position: fixed` deixa de ancorar na viewport se qualquer
   ancestral tiver transform/filter/perspective — e as sections
   deste site são todas animadas com transform. Por isso o nó é
   filho direto do <body>, fora de qualquer contexto animado.

   ONDE MEXER NO FUTURO
   - Texto/ícone: constantes LABEL e ICON logo abaixo.
   - Posição/tamanho/cor/velocidade/z-index: CSS, no FIM de
     assets/css/style.css, bloco ".scroll-hint".
     ATENÇÃO: animations.css NÃO é carregado pelo index.html —
     só style.css está no <link>. Regra nova vai em style.css.
   ============================================================ */
(function () {
  'use strict';

  var LABEL = 'ROLE PARA BAIXO';
  var ICON  = 'assets/images/mouse.png';

  function mount() {
    // Idempotente: se o script for carregado duas vezes, não duplica.
    if (document.querySelector('.scroll-hint')) return;

    var wrap = document.createElement('div');
    wrap.className = 'scroll-hint';
    // Decorativo — é redundante com o próprio gesto de rolar.
    wrap.setAttribute('aria-hidden', 'true');

    var icon = document.createElement('img');
    icon.className = 'scroll-hint__icon';
    icon.src = ICON;
    icon.alt = '';
    icon.decoding = 'async';

    var label = document.createElement('span');
    label.className = 'scroll-hint__label';
    label.textContent = LABEL;

    wrap.appendChild(icon);
    wrap.appendChild(label);
    document.body.appendChild(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
