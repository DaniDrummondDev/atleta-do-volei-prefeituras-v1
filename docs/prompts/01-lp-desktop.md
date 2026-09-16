Quero criar APENAS uma prova de conceito isolada em HTML/CSS/JavaScript puro para visualizar e aprovar um modelo 3D de um iPhone usando Three.js.

IMPORTANTE:

- NÃO quero integrar isso na landing page agora.
- NÃO quero alterar nenhuma página existente do projeto.
- NÃO quero alterar componentes existentes.
- NÃO quero modificar layout, header, footer ou qualquer outra parte do site.
- NÃO quero implementar a versão final da landing page neste momento.
- Quero SOMENTE uma página HTML isolada para visualizar, testar e aprovar o modelo 3D.

Essa página será um laboratório/protótipo visual.

Depois que eu aprovar o resultado, esse modelo 3D deverá poder ser reutilizado posteriormente na landing page real.

==================================================
OBJETIVO DESTA TAREFA
==================================================

Criar uma única página de demonstração contendo o modelo 3D.

O objetivo agora é exclusivamente validar:

- geometria;
- proporções;
- acabamento;
- materiais;
- textura da tela;
- iluminação;
- reflexos;
- animação;
- perspectiva;
- qualidade visual geral.

NÃO quero trabalhar na landing page ainda.

==================================================
RESTRIÇÕES IMPORTANTES
==================================================

Não fazer:

- integração com a landing page atual;
- alteração da home;
- alteração de outros HTMLs existentes;
- alteração de header;
- alteração de footer;
- alteração de navegação;
- alteração de layout existente;
- criação de seções comerciais;
- criação de textos de marketing;
- implementação de hero section definitiva;
- refatorações não relacionadas;
- alterações arquiteturais desnecessárias.

Criar somente o necessário para visualizar o objeto 3D.

==================================================
TECNOLOGIA
==================================================

A implementação deve utilizar:

- HTML puro;
- CSS puro;
- JavaScript puro;
- Three.js.

NÃO utilizar:

- React;
- Vue;
- Angular;
- Svelte;
- React Three Fiber;
- frameworks frontend.

O resultado deverá funcionar em uma página HTML comum.

==================================================
IMAGENS DE REFERÊNCIA
==================================================

Estou fornecendo duas imagens:

1. phone_01.png (pasta ./docs/refs)

Essa imagem deve ser usada principalmente como REFERÊNCIA DE MODELAGEM.

Ela mostra:

- perspectiva do aparelho;
- espessura;
- frame metálico;
- vidro;
- cantos;
- botões laterais;
- acabamento;
- reflexos.

NÃO utilizar phone_01.png simplesmente como uma imagem plana simulando um objeto 3D.

2. phone_02.png (pasta ./docs/refs)

Essa imagem mostra uma visão frontal praticamente ortográfica.

Ela deverá ser utilizada:

- como principal referência frontal;
- como origem da textura da tela.

O conteúdo visual mostrado em phone_02.png precisa permanecer visível e nítido no aparelho 3D.

==================================================
ANTES DE IMPLEMENTAR
==================================================

Primeiro analise somente o necessário no projeto:

1. verificar se existe package.json;
2. verificar se Three.js já está instalado;
3. verificar se Vite ou outro bundler já existe;
4. verificar a estrutura de assets;
5. verificar onde é mais adequado criar esta página isolada.

Não altere a aplicação antes dessa análise.

Depois me informe resumidamente:

- o que encontrou;
- onde pretende colocar o protótipo;
- quais arquivos serão criados;
- quais arquivos eventualmente precisarão ser alterados.

A alteração deve ser mínima.

==================================================
INSTALAÇÃO DO THREE.JS
==================================================

Verifique se Three.js já está instalado.

Se não estiver, instalar:

npm install three

Se o projeto ainda não possuir package.json:

npm init -y

Depois:

npm install three

Quero utilizar Three.js instalado via npm.

Não utilizar CDN se npm puder ser utilizado normalmente no projeto.

==================================================
VITE
==================================================

Se o projeto já possuir Vite, utilize a configuração existente.

Se NÃO existir uma forma adequada de servir ES Modules e assets, pode configurar Vite de forma mínima.

Nesse caso:

npm install -D vite

E adicionar scripts como:

"scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
}

Não instalar Vite se o projeto já possuir solução equivalente.

==================================================
PÁGINA DE DEMONSTRAÇÃO
==================================================

Criar somente UMA página HTML dedicada ao protótipo.

Por exemplo:

iphone-3d-demo.html

ou outro nome coerente com a estrutura atual.

Essa página deve ser independente da landing page.

Ela deve conter apenas o necessário para visualizar o modelo.

Exemplo conceitual:

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    ...
</head>
<body>

    <main class="iphone-demo">

        <div
            id="iphone-3d"
            class="iphone-3d-container"
        ></div>

    </main>

    <script
        type="module"
        src="..."
    ></script>

</body>
</html>

Não adicionar conteúdos desnecessários.

==================================================
FUNDO DA DEMONSTRAÇÃO
==================================================

Pode utilizar um fundo simples e neutro para facilitar a avaliação visual do aparelho.

Por exemplo:

- preto;
- cinza muito escuro;
- gradiente extremamente discreto.

O fundo deve ajudar a visualizar:

- reflexos;
- vidro;
- metal;
- bordas.

Não criar uma landing page em volta do objeto.

==================================================
ESTRUTURA DO CÓDIGO
==================================================

O protótipo deve ser organizado de forma que possamos posteriormente reutilizar o modelo na landing page.

Não colocar toda a lógica diretamente dentro do HTML.

Separar pelo menos:

HTML
CSS
JavaScript

Sugestão:

iphone-3d-demo.html

css/
    iphone-3d-demo.css

js/
    iphone/
        iphone-demo.js
        iphone-model.js
        iphone-materials.js
        iphone-lighting.js

assets/
    images/
        iphone/
            phone_01.png
            phone_02.png

Adapte à estrutura existente do projeto.

O ponto importante é:

O código do modelo 3D precisa poder ser reaproveitado posteriormente.

==================================================
IMPORTS
==================================================

Utilizar ES Modules.

Exemplo:

import * as THREE from 'three';

Quando necessário:

import { RoundedBoxGeometry }
from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import { RGBELoader }
from 'three/examples/jsm/loaders/RGBELoader.js';

OrbitControls pode ser utilizado somente para debug/calibração.

Não é obrigatório disponibilizar controles livres na versão visual final do protótipo.

==================================================
OBJETIVO VISUAL
==================================================

Criar um smartphone 3D premium e visualmente realista.

Quero que pareça um objeto tridimensional verdadeiro.

O aparelho deve possuir:

- espessura real;
- frame metálico;
- vidro frontal;
- tela;
- bezel;
- cantos arredondados;
- botões físicos;
- profundidade;
- reflexos;
- iluminação realista.

Evitar aparência de:

- imagem 2D inclinada;
- cartão;
- mockup plano;
- objeto low-poly;
- plástico simples;
- desenho/cartoon.

==================================================
ESTRUTURA DO MODELO
==================================================

Criar um THREE.Group principal:

iphone

Estrutura conceitual:

iphone
├── chassis
├── sideFrame
├── frontGlass
├── screen
├── bezel
├── dynamicIsland
├── sideButtons
├── details
└── backAssembly

A traseira poderá ser provisória nesta primeira versão.

Ainda não temos uma imagem traseira definitiva.

Preparar a estrutura para adicioná-la depois.

==================================================
CHASSIS
==================================================

Não utilizar apenas BoxGeometry sem acabamento.

Utilizar preferencialmente:

RoundedBoxGeometry

ou geometria equivalente.

O aparelho precisa possuir:

- cantos arredondados;
- espessura;
- volume;
- bevel;
- relação coerente entre frame, vidro e tela.

As proporções devem ser baseadas visualmente nas imagens fornecidas.

Não precisamos reproduzir dimensões físicas exatas do iPhone.

O objetivo é fidelidade visual.

==================================================
PHONE_01.PNG
==================================================

Utilizar phone_01.png como referência para reconstruir:

- espessura;
- frame;
- cantos;
- vidro;
- botões;
- acabamento metálico;
- reflexos;
- proporções laterais.

NÃO utilizar phone_01.png como um plano 2D para fingir perspectiva.

==================================================
PHONE_02.PNG
==================================================

Utilizar phone_02.png como textura/referência da tela.

Idealmente:

1. identificar a região correspondente à tela;
2. utilizar essa região como textura;
3. manter frame, bezel e vidro como objetos 3D separados.

Se inicialmente for tecnicamente mais seguro utilizar a imagem frontal inteira, fazer isso de forma modular e documentar onde o crop poderá ser melhorado.

A interface mostrada na tela não pode ficar deformada.

==================================================
TEXTURA DA TELA
==================================================

Utilizar THREE.TextureLoader.

Configurar:

texture.colorSpace = THREE.SRGBColorSpace;

Preservar:

- resolução;
- orientação;
- aspect ratio;
- nitidez.

Evitar z-fighting.

A screen deverá ser uma mesh independente.

==================================================
VIDRO FRONTAL
==================================================

Criar uma mesh separada para o vidro.

Preferir:

THREE.MeshPhysicalMaterial

Utilizar parâmetros coerentes de:

- roughness;
- clearcoat;
- clearcoatRoughness;
- reflectivity.

O vidro precisa produzir reflexos sem esconder a interface.

==================================================
FRAME METÁLICO
==================================================

Criar material PBR.

Preferir:

MeshPhysicalMaterial

ou:

MeshStandardMaterial

Utilizar:

- metalness alto;
- roughness baixo/moderado;
- cinza escuro/metálico.

Não usar preto puro.

O frame precisa reagir à iluminação.

==================================================
BEZEL
==================================================

Criar bezel geometricamente.

Não depender exclusivamente do bezel existente na imagem.

O objetivo é criar profundidade entre:

- chassis;
- frame;
- bezel;
- screen;
- glass.

==================================================
DYNAMIC ISLAND
==================================================

Criar o elemento frontal escuro como mesh própria quando possível.

Não depender somente da textura da imagem.

==================================================
BOTÕES LATERAIS
==================================================

Criar os botões laterais como meshes reais.

Eles devem possuir:

- pequena extrusão;
- cantos suavizados;
- material metálico;
- resposta à iluminação.

==================================================
TRASEIRA
==================================================

Ainda não existe imagem traseira.

Criar uma traseira provisória discreta.

Não gastar tempo modelando detalhes complexos da traseira agora.

Somente garantir que o aparelho tenha volume e não fique aberto.

Preparar o código para futuramente receber:

phone_back.png

==================================================
ILUMINAÇÃO
==================================================

Criar iluminação de estúdio.

Preferencialmente:

- environment map;
- key light;
- fill light;
- rim light.

O objetivo é destacar:

- frame;
- vidro;
- espessura;
- cantos;
- botões;
- reflexos.

Evitar iluminação chapada.

==================================================
RENDERER
==================================================

Criar renderer aproximadamente assim:

new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

Configurar:

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

Ajustar toneMappingExposure conforme necessário.

==================================================
CAMERA
==================================================

Utilizar:

THREE.PerspectiveCamera

Começar com FOV aproximadamente entre:

25 e 40 graus.

Calibrar a câmera para apresentar o aparelho de maneira semelhante à referência phone_01.png.

==================================================
ORIENTAÇÃO
==================================================

O aparelho deverá aparecer em landscape.

A orientação da textura e geometria precisa ficar correta.

==================================================
ANIMAÇÃO
==================================================

Criar uma animação idle sutil para facilitar a avaliação do 3D.

Não quero rotação contínua 360°.

Utilizar:

- pequena rotação em Y;
- pequena rotação em X;
- leve movimento vertical.

Exemplo aproximado:

Y: poucos graus
X: aproximadamente 1 a 3 graus

A animação deve parecer apresentação de produto.

==================================================
INTERAÇÃO COM MOUSE
==================================================

Adicionar interação sutil com o pointer para eu conseguir avaliar a profundidade do aparelho.

Movimento horizontal:

→ pequena rotação Y

Movimento vertical:

→ pequena rotação X

Limitar aproximadamente:

Y: ±20°
X: ±8°

Não permitir rotação total do aparelho porque ainda não temos a traseira definitiva.

==================================================
RESPONSIVIDADE
==================================================

A página de demonstração precisa funcionar em:

- desktop;
- notebook;
- tablet;
- mobile.

O container deve ajustar o renderer corretamente.

Utilizar ResizeObserver.

Atualizar:

camera.aspect

camera.updateProjectionMatrix()

renderer.setSize()

==================================================
PREFERS REDUCED MOTION
==================================================

Respeitar:

prefers-reduced-motion

Se estiver ativo:

- reduzir ou remover animação;
- manter o aparelho corretamente visível.

==================================================
PERFORMANCE
==================================================

Mesmo sendo um protótipo, não criar uma implementação descartável.

Manter:

- DPR máximo 2;
- materiais reutilizáveis;
- geometrias razoáveis;
- requestAnimationFrame eficiente;
- resize correto;
- dispose de recursos.

==================================================
CRITÉRIO PRINCIPAL DE ACEITE
==================================================

Nesta tarefa eu NÃO estou aprovando uma landing page.

Estou aprovando SOMENTE O MODELO 3D.

Ao abrir a página de demonstração eu preciso conseguir avaliar:

1. formato do aparelho;
2. proporções;
3. espessura;
4. cantos;
5. frame;
6. vidro;
7. tela;
8. textura;
9. botões;
10. iluminação;
11. reflexos;
12. movimento;
13. profundidade real.

Se o modelo estiver aprovado, em uma etapa posterior iremos utilizá-lo na landing page.

==================================================
REUTILIZAÇÃO FUTURA
==================================================

Embora esta página seja apenas uma demonstração, organize o JavaScript do modelo de forma reutilizável.

Por exemplo, algo semelhante a:

createIphoneModel()

ou:

class IphoneModel

e:

class IphoneScene

A página demo poderá instanciar esses módulos.

Posteriormente a landing page deverá poder reutilizar os mesmos módulos sem copiar toda a implementação.

==================================================
NÃO FAZER NESTA TAREFA
==================================================

Não integrar na landing page.

Não alterar a home.

Não redesenhar o site.

Não criar hero definitiva.

Não alterar textos existentes.

Não alterar navegação.

Não criar novas seções comerciais.

Não realizar otimizações globais do site.

Não refatorar arquivos não relacionados.

Não fazer alterações que não sejam necessárias para o protótipo.

==================================================
ENTREGA
==================================================

Ao terminar, quero somente:

1. a página HTML isolada de demonstração;
2. o CSS necessário;
3. o JavaScript necessário;
4. os assets organizados;
5. Three.js instalado/configurado;
6. instruções exatas para executar a demonstração.

Informe claramente qual URL/local devo abrir.

Exemplo:

npm install
npm run dev

Depois:

http://localhost:5173/iphone-3d-demo.html

Use naturalmente a porta real configurada pelo projeto.

==================================================
IMPORTANTE
==================================================

Não fazer commit.

Não fazer push.

Não tocar na landing page atual.

Não implementar nada além do protótipo 3D.

Primeiro faça a análise mínima do projeto.

Depois informe o plano.

Depois implemente SOMENTE a página isolada de demonstração para que eu possa aprovar visualmente o modelo 3D.