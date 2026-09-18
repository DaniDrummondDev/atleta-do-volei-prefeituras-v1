/* =========================================================
   COMPARADOR ANTES/DEPOIS — teste de lógica (sem navegador)
   ---------------------------------------------------------
   Roda em Node com jsdom, e NÃO é um spec do Playwright como os vizinhos
   deste diretório. A razão é o que ele testa: compare.js não desenha nada —
   ele escreve --split, aria-valuenow e três classes. Isso é lógica pura, e
   lógica pura não precisa de motor de layout para ser conferida.

   O que ele NÃO cobre, e continua precisando de olho humano ou Playwright:
   o recorte da imagem, a posição da seta e a linha do corte. Tudo isso é CSS
   lendo --split.

   COMO RODAR:
     npm i jsdom && node tests/compare.node.mjs

   O jsdom não implementa Pointer Events nem mede elementos: as quatro
   funções falsificadas no topo são exatamente as que compare.js chama, e
   nada além disso.
   ========================================================= */

import { JSDOM } from 'jsdom';
import fs from 'node:fs';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(raiz + '/index.html', 'utf8');
const src = fs.readFileSync(raiz + '/assets/js/anim/compare.js', 'utf8');

const dom = new JSDOM(html, { pretendToBeVisual: true, runScripts: 'outside-only' });
const { window } = dom;
const { document } = window;

// jsdom não implementa Pointer Events nem getBoundingClientRect com tamanho:
// fingimos o mínimo que o módulo usa, e só isso.
const palco = document.querySelector('.trans__stage');
const seta = document.querySelector('.trans__seta');
palco.getBoundingClientRect = () => ({ left: 100, width: 400, top: 0, height: 400 });
let capturado = null;
seta.setPointerCapture = id => { capturado = id; };
seta.releasePointerCapture = () => { capturado = null; };
seta.hasPointerCapture = id => capturado === id;

// sem window.anime => o módulo deve acender a alça sozinho
window.eval(src);

const ok = [];
const falha = [];
const t = (nome, cond, extra = '') => (cond ? ok : falha).push(nome + (extra ? ` [${extra}]` : ''));

const split = () => palco.style.getPropertyValue('--split');

t('inicia centralizado em 50', split() === '50.00', split());
t('aria-valuenow inicial 50', seta.getAttribute('aria-valuenow') === '50');
t('is-ativa sem coreografia', seta.classList.contains('is-ativa'));
t('sem legenda escondida no inicio',
  !palco.classList.contains('is-so-antes') && !palco.classList.contains('is-so-depois'));

function ponteiro(tipo, clientX, id = 1) {
  const e = new window.Event(tipo, { bubbles: true, cancelable: true });
  e.pointerId = id; e.clientX = clientX;
  seta.dispatchEvent(e);
  return e;
}

// arrasto sem pegar antes: nao deve mexer
ponteiro('pointermove', 300);
t('pointermove sem captura e ignorado', split() === '50.00', split());

// pega e arrasta para a direita (x=400 => (400-100)/400 = 75%)
ponteiro('pointerdown', 300);
t('ja-usou apos pegar', seta.classList.contains('ja-usou'));
ponteiro('pointermove', 400);
t('arrasto direita -> 75', split() === '75.00', split());

// alem da borda direita: grampeia em 100 e esconde o logo
ponteiro('pointermove', 900);
t('grampeia em 100', split() === '100.00', split());
t('is-so-antes em 100', palco.classList.contains('is-so-antes'));
t('logo escondido, ANTES nao', !palco.classList.contains('is-so-depois'));

// alem da borda esquerda
ponteiro('pointermove', -500);
t('grampeia em 0', split() === '0.00', split());
t('is-so-depois em 0', palco.classList.contains('is-so-depois'));
t('ANTES escondido, logo nao', !palco.classList.contains('is-so-antes'));

ponteiro('pointerup', 0);
ponteiro('pointermove', 400);
t('apos soltar, move e ignorado', split() === '0.00', split());

// ---- os riscos sobre as pílulas ----
const pilulas = [...document.querySelectorAll('.trans__pill')];
const riscadas = () => pilulas.filter(p => p.classList.contains('is-riscado')).length;
const palavra = i => pilulas[i].textContent.trim();

t('cinco pilulas encontradas', pilulas.length === 5, String(pilulas.length));

function em(pct) { ponteiro('pointerdown', 0); ponteiro('pointermove', 100 + pct * 4); ponteiro('pointerup', 0); }

// o risco anda no eixo INVERTIDO do corte: quem risca e ir para a ESQUERDA
// (a quadra aparecendo), nao para a direita.
em(100); t('100%: nenhum risco', riscadas() === 0, String(riscadas()));
em(81);  t('81%: ainda nenhum', riscadas() === 0, String(riscadas()));
em(80);  t('80%: risca a 1a (' + palavra(0) + ')', riscadas() === 1 && pilulas[0].classList.contains('is-riscado'));
em(60);  t('60%: duas (' + palavra(1) + ')', riscadas() === 2 && pilulas[1].classList.contains('is-riscado'));
em(40);  t('40%: tres (' + palavra(2) + ')', riscadas() === 3 && pilulas[2].classList.contains('is-riscado'));
em(20);  t('20%: quatro (' + palavra(3) + ')', riscadas() === 4 && pilulas[3].classList.contains('is-riscado'));
em(0);   t('0%: as cinco (' + palavra(4) + ')', riscadas() === 5);

// volta: os riscos saem na ordem inversa, respeitando a zona morta de 1.5
em(1);   t('1%: a ultima resiste (zona morta)', riscadas() === 5, String(riscadas()));
em(2);   t('2%: a ultima sai', riscadas() === 4, String(riscadas()));
em(42);  t('42%: sobram duas', riscadas() === 2, String(riscadas()));
em(100); t('volta a 100%: nenhum risco', riscadas() === 0, String(riscadas()));

// saltar de ponta a ponta nao deixa estado preso
em(0); em(100);
t('salto 0 -> 100 limpa tudo', riscadas() === 0, String(riscadas()));

// teclado
function tecla(key, shiftKey = false) {
  const e = new window.KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
  seta.dispatchEvent(e);
  return e;
}
tecla('Home'); t('Home -> 0', split() === '0.00', split());
tecla('ArrowRight'); t('ArrowRight -> 2', split() === '2.00', split());
tecla('ArrowRight', true); t('Shift+ArrowRight -> 12', split() === '12.00', split());
tecla('ArrowLeft'); t('ArrowLeft -> 10', split() === '10.00', split());
tecla('End'); t('End -> 100', split() === '100.00', split());
const ign = tecla('a');
t('tecla irrelevante nao preventDefault', !ign.defaultPrevented);

// alca desligada: nada responde
seta.classList.remove('is-ativa');
tecla('Home');
t('sem is-ativa, teclado ignorado', split() === '100.00', split());

console.log('PASSOU:', ok.length);
for (const f of falha) console.log('  FALHOU:', f);
process.exit(falha.length ? 1 : 0);
