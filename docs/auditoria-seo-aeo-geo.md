# Auditoria SEO, AEO e GEO — Atleta do Vôlei

Data: 22/09/2026. Escopo: `index.html` deste repositório, que será a atualização do domínio canônico, e comparação com a página pública atual. Esta é uma auditoria; nenhuma mudança foi aplicada à LP.

## Diagnóstico executivo

**O produto** é o *Atleta do Vôlei*, aplicativo/rede social esportiva para encontrar atletas, equipes, quadras, jogos e eventos de vôlei, criar ou participar de equipes e organizar eventos. É distribuído para Android e iPhone; a própria LP afirma que o download é gratuito.

**Público primário:** praticantes de vôlei, de iniciantes a profissionais, que desejam jogar, encontrar pessoas ou organizar a atividade. **Públicos secundários, hoje ambíguos:** equipes e organizadores; há também uma narrativa parcial dirigida a cidades/prefeituras, sem oferta, CTA ou fluxo comercial correspondente.

**Problema resolvido:** a descoberta e organização de jogos, pessoas, espaços e eventos que hoje podem estar dispersos em grupos, planilhas e redes sociais.

**Associação semântica desejada:** “Atleta do Vôlei é uma rede social e aplicativo brasileiro para praticantes de vôlei encontrarem atletas, equipes, quadras e eventos, organizarem partidas e participarem da comunidade em Android e iPhone.”

O conteúdo de produto é promissor e as entidades principais aparecem com frequência natural. Porém, a página local mistura dois posicionamentos: app B2C para quem joga e solução para cidades. Isso reduz precisão de intenção, conversão e recuperação por motores de resposta. A página pública atual é o baseline da migração: ela já explicita o público de atletas, recursos, FAQ e Premium. Antes de substituir o canônico por esta LP, a nova versão deve incorporar os fatos confirmados que não podem se perder, ou o lançamento causará regressão de conteúdo indexável e de dados estruturados.

### Lacunas que impedem entendimento inequívoco

- Definição factual curta do produto logo após o H1 (o que é, para quem, para qual modalidade e onde funciona).
- Escopo de localização: o Brasil é inferível pelo domínio, lojas e endereço, mas a área de cobertura/cidades atendidas não é declarada.
- Público de “cidades/prefeituras”: falta produto, responsável, fluxo de contratação, recursos próprios, evidências e CTA; não deve permanecer como promessa implícita.
- Fonte, data e critério das métricas 1.568 atletas, 37 equipes e 17 eventos.
- Recurso Premium citado no JSON-LD, mas não na FAQ visível; preço, recursos e regras não estão apresentados nesta versão.
- Critérios de “avaliação dos espaços”, segurança, moderação, tratamento de localização/dados e suporte.

## Principais problemas e prioridades

| Prioridade | Achado | Impacto | Recomendação |
| --- | --- | --- | --- |
| CRÍTICO | A nova LP do repositório substituirá uma página pública mais completa e semanticamente explícita. | Pode haver regressão de conteúdo indexável, snippets e respostas já associadas ao domínio. | Fazer migração editorial: preservar/confirmar na nova LP definição do produto, público, recursos, FAQ e Premium antes do deploy. |
| CRÍTICO | `og:image`, logo do Schema e `apple-touch-icon` apontam para `assets/img/...`, diretório ausente no repositório. | Previews sociais, ícone Apple e dados de entidade quebram. | Corrigir para ativos existentes ou gerar e publicar os arquivos referenciados; validar com HTTP 200. |
| ALTO | FAQ em JSON-LD não espelha a FAQ visível. Inclui Premium, piso e localização que a FAQ local não confirma; omite as perguntas visíveis. | Dados estruturados inconsistentes; risco de resultados enriquecidos inválidos e menor confiança factual. | Gerar FAQPage a partir do conteúdo visível, ou alinhar os dois deliberadamente. |
| ALTO | Narrativa B2C mistura-se a “cidade”, gestão esportiva, escolas e anúncios. | Dilui intenção e entidade de produto; CTAs não atendem ao público institucional. | Escolher B2C nesta URL ou separar uma página institucional com URL, proposta e CTA próprios. |
| ALTO | `MobileApplication` traz oferta gratuita, mas não URL de instalação, imagem, descrição, `@id` ou ligação explícita à WebPage. | Entendimento de entidade incompleto. | Usar um grafo ligado `Organization` → `WebSite` → `WebPage` → `MobileApplication`, apenas com fatos confirmados. |
| MÉDIO | H2s como “Onde o vôlei acontece.” e “Já está acontecendo!” são bons criativos, mas pouco descritivos isoladamente. | Menor extração de contexto em headings/snippets. | Preservar o tom e acrescentar contexto no heading ou parágrafo imediatamente adjacente. |
| MÉDIO | Metatag `keywords` não traz benefício para Google/Bing modernos. | Ruído de manutenção, sem ganho de ranking. | Remover; trabalhar tópicos na cópia. |
| MÉDIO | Links externos de lojas têm atributo `href` duplicado. | HTML inválido; o navegador pode recuperar, mas é defeito de qualidade. | Manter uma única URL e acrescentar `rel="noopener noreferrer"` aos links com nova aba. |
| MÉDIO | Vídeo de 3,8 MB usa `preload="auto"` no hero. | Pode disputar LCP, sobretudo em rede móvel. | Medir Web Vitals reais; considerar `preload="metadata"`, poster otimizado e carregamento após interação/visibilidade. |
| BAIXO | Headings de rodapé usam H2, e cards com informações acionáveis estão em `li` sem agrupamento semântico mais rico. | Hierarquia de documento menos limpa. | Usar títulos de rodapé sem alterar a sequência principal; manter listas para features, ou tornar cada card um `article` se ganhar conteúdo próprio. |

## Auditoria on-page

### Title

**Atual:** `Atleta do Vôlei — A rede social feita para quem ama jogar vôlei` (61 caracteres aproximadamente).

**Avaliação:** marca e categoria aparecem cedo, é humano e tem boa intenção comercial. “Feita para quem ama jogar” é acolhedor, mas não descreve os principais trabalhos do app (encontrar jogos, quadras e atletas).

**Proposto:** `Atleta do Vôlei: encontre jogos, quadras e atletas`

**Motivo:** mantém marca e categoria implícita, adiciona a proposta de valor pesquisável e evita repetição artificial. Alternativa orientada a categoria: `Atleta do Vôlei | Rede social para jogar vôlei`.

### Meta description

**Atual:** “Atleta do Vôlei é a rede social do vôlei: encontre jogos, quadras e atletas do seu nível, monte equipes, participe de campeonatos e compartilhe seus momentos. Baixe o app grátis para Android e iPhone.”

**Avaliação:** excelente cobertura de recursos e CTA; está um pouco longa e a expressão “do seu nível” é uma afirmação funcional que deve continuar visível na página para sustentá-la.

**Proposta final:** `Encontre jogos, quadras, equipes e atletas de vôlei. Crie seu perfil, participe de eventos e baixe grátis o Atleta do Vôlei para Android e iPhone.`

**Motivo:** resposta independente, factual, com benefício e CTA em cerca de 155 caracteres.

### Headings: estado e proposta

Há um único H1, o que está correto. A sequência H1 → H2 → H3 é majoritariamente boa. O ganho está em tornar a finalidade explícita sem sacrificar o ritmo comercial.

| Atual | Proposto | Motivo |
| --- | --- | --- |
| H1: “O vôlei inteiro conectado em um só lugar.” | **Manter**, com parágrafo imediato: “Atleta do Vôlei é um aplicativo e rede social para encontrar jogos, quadras, equipes, atletas e eventos de vôlei.” | O H1 tem força de marca; a definição resolve a ambiguidade para pessoas e máquinas. |
| H2: “Um aplicativo só para organizar e conectar toda a comunidade do vôlei.” | **Manter.** | Já descreve categoria, público e função. |
| H2: “Onde o vôlei acontece.” | “Organize jogos, equipes e eventos de vôlei em um só lugar.” | A seção lista benefícios funcionais; o proposto é extraível fora do layout. |
| H2: “De informações espalhadas para um esporte conectado.” | “Do WhatsApp e das planilhas à organização do vôlei em um só aplicativo.” | Explicita problema → solução, desde que WhatsApp/planilhas seja uma representação real do fluxo. |
| H2: “Por que estar no Atleta?” | “Benefícios do Atleta do Vôlei para quem joga.” | Torna audiência e marca explícitas. |
| H2: “Tudo o que o vôlei precisa. Em um só lugar.” | “Recursos do aplicativo Atleta do Vôlei.” + manter a frase como destaque visual. | Recursos podem ser localizados e citados. |
| H2: “Já está acontecendo!” | “A comunidade Atleta do Vôlei em números.” | Só usar se houver fonte/data das métricas. |
| H2: “Entre para viver o vôlei. O próximo jogo começa no Atleta.” | “Como começar a usar o Atleta do Vôlei.” + manter slogan como apoio. | Atende pergunta recorrente e orientação de tarefa. |
| H2: “Ainda tem dúvidas?” | “Perguntas frequentes sobre o Atleta do Vôlei.” | Melhora navegação e AEO sem soar mecânico. |

## Intenções de busca e keyword map

| Grupo | Consultas/tópicos naturais | Onde aparecer |
| --- | --- | --- |
| Principal | app para jogar vôlei; rede social de vôlei | Title/H1, definição, meta e primeiro bloco. |
| Comercial | aplicativo de vôlei; baixar app de vôlei; app para encontrar jogos de vôlei | Hero, lojas e CTA. |
| Problema → solução | como achar jogo de vôlei; onde encontrar quadra de vôlei; encontrar pessoas para jogar vôlei | Bloco “o que é”, recursos e FAQ. |
| Funcionalidades | criar equipe de vôlei; organizar torneio de vôlei; encontrar quadras; eventos de vôlei; perfil de atleta | Cards de recursos, jornadas e páginas internas futuras. |
| Público | vôlei amador; vôlei de praia; jogadores de vôlei; equipes de vôlei | Definição, FAQ e páginas por segmento; somente quando a cobertura for real. |
| Informacional | como funciona app de vôlei; como entrar em um time de vôlei | Jornada e FAQ. |
| Branded | Atleta do Vôlei; app Atleta do Vôlei; Atleta do Vôlei Android/iPhone | Title, schema, lojas, suporte e rodapé. |

**Relações de entidade:** Atleta do Vôlei → `MobileApplication`/rede social esportiva; serve a → atletas, equipes e organizadores de eventos; permite → perfis, descoberta de quadras, equipes, jogos e campeonatos; disponível em → Android/iPhone; operado por → RS Sistemas Ltda (o rodapé declara CNPJ, a confirmação jurídica deve ocorrer antes de estruturar essa relação).

Não tratar “prefeitura”, “gestão esportiva municipal”, “escolas” ou “anúncios” como keywords desta URL sem uma oferta verificável. Caso sejam linhas reais, criar cluster próprio (por exemplo `/prefeituras/`) em vez de competir semanticamente com a página de download do app.

## AEO e GEO

### Cobertura atual

A LP responde bem a “o que encontro no aplicativo?”, “posso criar equipe?”, “posso organizar torneio?” e “é gratuito para baixar?”. Há respostas incompletas ou inconsistentes para “o que é exatamente?”, “onde funciona?”, “como a localização é usada?”, “o que significa Premium?”, “como reportar problema?”, “os locais são avaliados ou verificados?” e “como meus dados são tratados?”.

### Blocos recomendados

Logo após o hero, inserir um bloco curto, visível e não promocional:

> **O que é o Atleta do Vôlei?**
>
> O Atleta do Vôlei é um aplicativo e rede social para praticantes de vôlei encontrarem atletas, equipes, quadras, jogos e eventos. Pelo app, é possível criar um perfil, participar de equipes, descobrir oportunidades para jogar e acompanhar a comunidade.

Usar somente os trechos confirmados pela operação. Para cada afirmação de proximidade, nível, avaliação, filtro por piso, chat, placar, board tático, escolas ou anúncios, a UI/documentação precisa demonstrar o recurso. Em mecanismos generativos, especificidade sustentada é mais útil que slogans como “o vôlei inteiro conectado”.

Substituições de copy ilustrativas:

| Atual | Proposto | Motivo |
| --- | --- | --- |
| “O vôlei inteiro conectado em um só lugar.” | **Manter como slogan**; abaixo: “Um aplicativo para encontrar atletas, equipes, quadras, jogos e eventos de vôlei.” | Separa promessa de definição factual. |
| “Onde o vôlei acontece.” | “Organize e encontre jogos, equipes e eventos de vôlei.” | O trecho pode ser entendido sem o visual. |
| “Aproxime a cidade do esporte.” | Remover desta LP B2C ou mover para página municipal com oferta verificável. | Evita público não atendido. |
| “Transforme dados em decisões.” | “Acompanhe [dados específicos disponíveis] para [decisão específica].” ou remover. | Sem dado, fonte e usuário definidos, é publicidade de baixa densidade factual. |

### FAQ recomendada

Manter perguntas que a operação pode comprovar e alinhar rigorosamente HTML e JSON-LD:

1. O que é o Atleta do Vôlei?
2. O Atleta do Vôlei é gratuito para baixar?
3. Quem pode usar o aplicativo?
4. Como encontro jogos, equipes, atletas e quadras?
5. Posso criar uma equipe ou participar de uma existente?
6. Posso criar torneios e amistosos pelo aplicativo?
7. Como cadastrar uma quadra ou local para jogar?
8. O app está disponível para Android e iPhone?
9. Como entrar em contato ou reportar um problema?

Evitar FAQ de Premium, geolocalização, avaliação/verificação e tipo de piso enquanto a cópia visível, produto e política não confirmarem cada resposta.

## E-E-A-T e confiança

Pontos positivos: empresa, endereço, CNPJ, e-mail, termos, privacidade, lojas e perfis sociais aparecem no rodapé. Prioridades: confirmar a razão social e o CNPJ declarados; disponibilizar páginas legais com HTTP 200; explicar suporte e privacidade/localização; datar e contextualizar métricas; ter uma página “sobre” e canal de suporte. Não exibir reviews, “locais verificados”, números, clientes ou certificações sem fonte verificável. Para uma plataforma com conteúdo e localização de usuários, regras de comunidade/moderação e critérios de cadastro de quadras aumentariam confiança e informação própria.

## Dados estruturados recomendados

Aplicar **Organization**, **WebSite**, **WebPage** e **MobileApplication**. `FAQPage` só deve ser publicado se o conteúdo abaixo estiver visível e idêntico. Não usar `Product`, `AggregateRating`, `Review`, `LocalBusiness` ou `Offer` nesta página: não há produto físico, avaliações verificáveis, estabelecimento local de atendimento nem preço/condições suficientemente documentados. Substituir placeholders antes de publicar.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://atletadovolei.com.br/#organization",
      "name": "Atleta do Vôlei",
      "url": "https://atletadovolei.com.br/",
      "logo": "https://atletadovolei.com.br/assets/images/icon.png",
      "sameAs": [
        "https://www.instagram.com/atletadovolei",
        "https://www.tiktok.com/@atletadovolei",
        "https://www.youtube.com/@AtletadoVoleiOficial",
        "https://www.facebook.com/atletadovolei"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://atletadovolei.com.br/#website",
      "url": "https://atletadovolei.com.br/",
      "name": "Atleta do Vôlei",
      "inLanguage": "pt-BR",
      "publisher": { "@id": "https://atletadovolei.com.br/#organization" }
    },
    {
      "@type": "WebPage",
      "@id": "https://atletadovolei.com.br/#webpage",
      "url": "https://atletadovolei.com.br/",
      "name": "Atleta do Vôlei: encontre jogos, quadras e atletas",
      "description": "Aplicativo e rede social para praticantes de vôlei encontrarem atletas, equipes, quadras, jogos e eventos.",
      "inLanguage": "pt-BR",
      "isPartOf": { "@id": "https://atletadovolei.com.br/#website" },
      "about": { "@id": "https://atletadovolei.com.br/#app" }
    },
    {
      "@type": "MobileApplication",
      "@id": "https://atletadovolei.com.br/#app",
      "name": "Atleta do Vôlei",
      "applicationCategory": "SportsApplication",
      "operatingSystem": "Android, iOS",
      "description": "Aplicativo e rede social para praticantes de vôlei encontrarem atletas, equipes, quadras, jogos e eventos.",
      "publisher": { "@id": "https://atletadovolei.com.br/#organization" },
      "downloadUrl": "https://play.google.com/store/apps/details?id=br.atletadovolei.com",
      "installUrl": "https://apps.apple.com/br/app/atleta-do-v%C3%B4lei/id1513042771"
    }
  ]
}
```

Se a gratuidade for confirmada nos dois stores, pode-se incluir `offers` com preço `0`; se existir Premium, não o declarar nesta LP até expor suas condições de modo claro e consistente.

## Social metadata

```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="Atleta do Vôlei">
<meta property="og:url" content="https://atletadovolei.com.br/">
<meta property="og:title" content="Atleta do Vôlei: encontre jogos, quadras e atletas">
<meta property="og:description" content="Encontre jogos, quadras, equipes e atletas de vôlei. Baixe grátis para Android e iPhone.">
<meta property="og:image" content="https://atletadovolei.com.br/assets/images/og-cover.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Telas do aplicativo Atleta do Vôlei para encontrar jogos, quadras e atletas">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Atleta do Vôlei: encontre jogos, quadras e atletas">
<meta name="twitter:description" content="Encontre jogos, quadras, equipes e atletas de vôlei. Baixe grátis para Android e iPhone.">
<meta name="twitter:image" content="https://atletadovolei.com.br/assets/images/og-cover.jpg">
```

Criar uma imagem real 1200×630 px, com marca legível, uma ou duas telas do app e contraste seguro. Validar a URL absoluta publicada; não manter a referência atual inexistente.

## SEO técnico e crawlability

**Bom:** `lang="pt-BR"`, charset, viewport, canonical absoluto, robots index/follow, HTML semântico base, alt text em grande parte das imagens relevantes, `loading="lazy"` fora do hero, `font-display: swap`, reduced motion e fallback quando Anime.js falha.

**A corrigir/verificar antes de publicar:**

- Criar `robots.txt` e `sitemap.xml`; eles não existem no repositório. A consulta ao domínio não conseguiu obtê-los, portanto validar no servidor por requisição HTTP após o deploy.
- Canonical, Open Graph, Schema e sitemap devem apontar à mesma URL final HTTPS, sem redirecionamentos intermediários.
- Remover `meta keywords`.
- Corrigir os três caminhos `assets/img` e os atributos `href` duplicados.
- Garantir que links com `target="_blank"` tenham `rel="noopener noreferrer"`.
- Medir LCP, CLS e INP no ambiente publicado em mobile. O vídeo de hero, múltiplas imagens e muitos scripts de animação são candidatos a pressão de LCP/CPU; a severidade depende de dados de campo/lab, não foi inferida como falha confirmada.
- Manter conteúdo essencial no HTML inicial: atualmente os textos estão presentes, o que é favorável a crawlers e LLMs. Não mover definição, recursos ou FAQ para renderização exclusiva de JavaScript.
- Não bloquear Googlebot/Bingbot por padrão. Para crawlers de IA, robots controla acesso de rastreamento conforme cada agente; isso não garante nem impede treinamento, inclusão em respostas ou citação. A decisão deve ser legal/comercial, não um substituto de SEO.

### Arquivos auxiliares propostos

`robots.txt`:

```txt
User-agent: *
Allow: /

Sitemap: https://atletadovolei.com.br/sitemap.xml
```

`sitemap.xml` (substituir `lastmod` pela data real de publicação):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://atletadovolei.com.br/</loc>
    <lastmod>YYYY-MM-DD</lastmod>
  </url>
</urlset>
```

`llms.txt` é opcional e seu suporte ainda varia; não substitui HTML semântico, sitemap ou SEO. Só publicar se puder ser mantido:

```txt
# Atleta do Vôlei
> Aplicativo e rede social para praticantes de vôlei encontrarem atletas, equipes, quadras, jogos e eventos.

## Páginas principais
- https://atletadovolei.com.br/ — produto, recursos, download e perguntas frequentes
- https://atletadovolei.com.br/termos.html — termos de uso
- https://atletadovolei.com.br/privacidade.html — política de privacidade

## Informações verificadas
- Disponível para Android e iPhone.
- Download gratuito, conforme página e lojas oficiais.
```

## Revisão por seção

| Seção | Objetivo atual | Problema / impacto | Recomendação |
| --- | --- | --- | --- |
| Hero | Criar desejo e download. | H1 é memorável, mas não define produto; métricas sem contexto. | Manter slogan; adicionar definição factual e fonte/data ou remover métricas. |
| CTA/lojas | Converter download. | Boa intenção; atributos duplicados e ausência de `rel` em nova aba. | Corrigir HTML; usar URLs oficiais confirmadas. |
| Recursos | Explicar atletas/equipes/quadras/eventos. | É a seção mais forte semanticamente. | Manter e uniformizar cada card em “o que permite + para quem/resultado”. |
| Ganhos/transformação | Vender organização. | “equipe”, “cidade” e “gestão” deixam o destinatário indefinido. | Reescrever para jogador/equipe ou mover à página B2B municipal. |
| Benefícios | Sustentar valor. | Cinco slides escondem boa parte da cópia até interação/scroll; há promessas amplas de dados/cidade. | Expor um resumo textual estático e fundamentar/remover promessas. |
| Plataforma | Enumerar recursos. | Lista é densa; várias capacidades não são detalhadas. | Converter em cards/links de recurso e confirmar cada capacidade antes da publicação. |
| Mapa/números | Prova social. | Sem período, fonte ou definição de “ativo”. | Exibir “Dados atualizados em [mês/ano]” e metodologia, ou retirar. |
| Jornada | Explicar ativação. | Boa estrutura, mas o título é slogan. | Adicionar heading funcional “Como começar”. |
| FAQ | Reduzir objeções. | HTML e JSON-LD divergem; pequenos erros de digitação prejudicam confiança. | Revisar conteúdo, ortografia e alinhamento Schema. |
| Rodapé | Confiança e navegação. | Bom conjunto institucional; “cidades inteiras” reabre a ambiguidade. | Confirmar dados empresariais; separar mensagem B2B ou removê-la desta URL. |

## Plano de implementação

### P0 — antes de publicar

1. Tratar a LP pública como baseline de migração e preservar na nova versão todos os fatos confirmados que hoje são indexáveis (definição, público, recursos, FAQ e, se existir, Premium).
2. Corrigir todos os assets sociais/ícone quebrados e validar respostas HTTP 200.
3. Alinhar a FAQ visual ao `FAQPage` ou remover o Schema até alinhá-los.
4. Escolher o público desta URL: atletas B2C **ou** instituições; remover/migrar a narrativa que não tenha oferta real.
5. Implementar e publicar `robots.txt`, `sitemap.xml`, canonical e metadados com URLs finais corretas.
6. Confirmar métricas, gratuitidade/Premium, funcionalidades e informações legais antes de afirmá-las em cópia ou Schema.

### P1 — alta prioridade

1. Inserir o bloco “O que é o Atleta do Vôlei?” e headings propostos.
2. Aplicar o grafo JSON-LD recomendado com fatos confirmados.
3. Criar social card 1200×630 e validar previews.
4. Melhorar o CTA de cada segmento e criar página própria para prefeituras, se esse for produto real.
5. Medir Core Web Vitals e otimizar o vídeo hero/recursos que afetarem LCP e INP.

### P2 — evolução

1. Criar páginas indexáveis de recursos, ajuda e casos de uso, vinculadas à LP.
2. Publicar conteúdo original de comunidade, critérios de locais e documentação de segurança/moderação.
3. Adicionar dados atualizados, metodologia e cases reais com autorização.
4. Considerar `llms.txt` como documento auxiliar mantido; acompanhar logs e Search Console/Bing Webmaster Tools.

## Checklist de aceite

- [ ] Uma única narrativa e público por URL.
- [ ] Title, description, H1, cópia e Schema descrevem o mesmo produto.
- [ ] FAQ visível = FAQPage, palavra por palavra em substância.
- [ ] Nenhum asset de favicon, OG ou logo retorna 404.
- [ ] Canonical, sitemap, robots e links internos usam a URL de produção.
- [ ] Lojas, termos, privacidade, contato e perfis sociais retornam páginas válidas.
- [ ] Métricas e afirmações de recurso possuem dono, fonte e data.
- [ ] Testes mobile de LCP/CLS/INP e preview social concluídos.
