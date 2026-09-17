/* =========================================================
   RESPIRO DOS PONTOS — teste do sorteio (sem navegador)
   ---------------------------------------------------------
   spots.js não anima nada: ele sorteia --ciclo e --atraso por ponto, e o CSS
   faz o resto. O que dá para conferir sem motor de layout é justamente o que
   pode dar errado no sorteio:

     · todo ponto recebe os dois números;
     · ninguém começa junto com ninguém (a razão de existir o baralho);
     · a ordem muda de um carregamento para o outro;
     · o ciclo é o MESMO para todos (é o que impede o empilhamento);
     · com movimento reduzido, nada é escrito.

   O que ele NÃO cobre: a piscada em si, que é @keyframes no style.css.

   COMO RODAR:
     npm i jsdom && node tests/spots.node.mjs
   ========================================================= */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(raiz + '/index.html', 'utf8');
const src = fs.readFileSync(raiz + '/assets/js/anim/spots.js', 'utf8');

const ok = [];
const falha = [];
const t = (nome, cond, extra = '') => (cond ? ok : falha).push(nome + (extra ? ` [${extra}]` : ''));

function rodar({ reduzido = false } = {}) {
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  const { window } = dom;
  window.matchMedia = () => ({ matches: reduzido });
  window.eval(src);

  const spots = [...window.document.querySelectorAll('.trans__spot')];
  return spots.map(s => ({
    ciclo: parseFloat(s.style.getPropertyValue('--ciclo')),
    atraso: parseFloat(s.style.getPropertyValue('--atraso')),
    nome: s.textContent.trim(),
  }));
}

const r = rodar();

t('dez pontos no anel', r.length === 10, String(r.length));
t('todos receberam --ciclo e --atraso', r.every(p => p.ciclo > 0 && p.atraso >= 0));
t('ciclo de 8s, igual para todos', new Set(r.map(p => p.ciclo)).size === 1 && r[0].ciclo === 8,
  [...new Set(r.map(p => p.ciclo))].join(' '));

// o baralho existe para isto: ninguém começa junto com ninguém
const atrasos = r.map(p => p.atraso).sort((a, b) => a - b);
const menorVao = Math.min(...atrasos.slice(1).map((a, i) => a - atrasos[i]));
t('nenhum par comeca junto (vao > 0.2s)', menorVao > 0.2, 'menor vao ' + menorVao.toFixed(2) + 's');

// os atrasos cobrem o ciclo inteiro, em vez de se amontoarem num trecho
t('atrasos espalhados pelo ciclo', atrasos[0] < 1 && atrasos[9] > 6,
  atrasos[0].toFixed(2) + ' .. ' + atrasos[9].toFixed(2));
t('nenhum atraso passa do ciclo', atrasos[9] < 8, atrasos[9].toFixed(2));

// a garantia que motivou o ciclo unico: nunca muitos piscando juntos.
// a piscada ocupa 20% do ciclo (ver @keyframes spot-respirar no style.css).
const FRACAO = 0.20;
let maxJuntos = 0;
for (let tempo = 0; tempo < 8; tempo += 0.02) {
  let n = 0;
  for (const p of r) {
    const f = (((tempo - p.atraso) % p.ciclo) + p.ciclo) % p.ciclo / p.ciclo;
    if (tempo >= p.atraso && f < FRACAO) n++;
  }
  if (n > maxJuntos) maxJuntos = n;
}
t('nunca mais de 3 piscando juntos', maxJuntos <= 3, 'pico ' + maxJuntos + ' de 10');

// a ordem muda entre carregamentos
const ordem = xs => xs.slice().sort((a, b) => a.atraso - b.atraso).map(p => p.nome).join('>');
const ordens = new Set([ordem(r), ...Array.from({ length: 9 }, () => ordem(rodar()))]);
t('a ordem varia entre carregamentos', ordens.size > 1, ordens.size + ' ordens em 10 sorteios');

// movimento reduzido: nada e escrito, e o CSS cai no valor de reserva
const reduzido = rodar({ reduzido: true });
t('movimento reduzido nao escreve nada',
  reduzido.every(p => Number.isNaN(p.ciclo) && Number.isNaN(p.atraso)));

console.log('PASSOU:', ok.length);
for (const f of falha) console.log('  FALHOU:', f);
process.exit(falha.length ? 1 : 0);
