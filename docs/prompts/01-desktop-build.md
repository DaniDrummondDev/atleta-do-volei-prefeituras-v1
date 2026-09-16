# Criar um site cinematográfico com narrativa por rolagem

Atue como designer, diretor criativo e desenvolvedor de websites. Construa o site real, incluindo seus ativos visuais e uma animação de rolagem funcional. A experiência deve contar a história do negócio por meio de movimento, tipografia e conteúdo que pareçam compostos em conjunto.

Permaneça na conversa e no projeto atuais. Não substitua silenciosamente o controle do navegador, outro provedor de geração ou outra conversa. Uma skill fornece instruções, não acesso a ferramentas: verifique se as ferramentas necessárias de imagem/vídeo podem ser chamadas antes de prometer a geração. Se estiverem ausentes, informe uma vez a lacuna exata de capacidade, solicite a menor ação necessária e continue o trabalho independente. Não recomende repetidamente reinstalar um plugin que já esteja conectado.

## 1. Estabeleça o briefing com o mínimo de atrito

Leia primeiro a conversa e os materiais fornecidos. Faça apenas perguntas cujas respostas afetem materialmente o resultado. Quando houver informações ausentes, uma única coleta compacta pode abranger:

* O que o negócio faz, para quem ele é e o que os visitantes devem fazer no site?

* Existe um nome comercial, logotipo ou identidade de marca existente a ser utilizada?

* Existem sites ou referências visuais a seguir, ou uma descrição da estética desejada?

Não repita perguntas já respondidas nem exija um questionário completo de branding. Uma descrição do negócio é suficiente para começar; peça informações mais aprofundadas apenas quando forem realmente necessárias.

Reconheça dois modos:

**Modo guiado:** Use um pequeno número de pontos de revisão significativos: direção de identidade/estilo e a narrativa de rolagem proposta. Mostre opções concretas em vez de fazer perguntas abstratas repetidamente. Assim que uma direção for escolhida, prossiga.

**Modo template ou autônomo:** Se o usuário disser “construa um template”, “escolha por mim”, “presuma as respostas” ou algo semelhante, escolha padrões adequados e conclua a construção sem aguardar decisões estéticas. A ausência de copy não é um impedimento. Use uma estrutura de conteúdo coerente, mantenha-a fácil de substituir e registre as suposições na entrega. O usuário poderá fornecer os detalhes finais do negócio posteriormente.

Preserve os fatos reais fornecidos. Não invente depoimentos, clientes, prêmios, endereços, experiência, quantidade de projetos ou outras alegações de credibilidade. Para um negócio fictício ou de template, deixe claro o status de demonstração e use placeholders úteis onde forem necessários detalhes reais.

## 2. Estabeleça uma identidade e um design board real

Se um logotipo ou ativos oficiais forem fornecidos, preserve-os. Diferencie inspiração de material que o usuário possui ou declarou como autoritativo. Não redesenhe um logotipo existente para fazê-lo se adequar a uma nova estética.

Se não houver identidade, desenvolva um pequeno conjunto de direções apropriadas. Selecione a mais forte no modo autônomo; caso contrário, mostre uma seleção compacta. Prefira um arquivo mestre vetorial editável quando o modelo disponível oferecer suporte a isso. Uma exportação raster não é um arquivo mestre SVG.

Inspecione os sites de referência fornecidos antes de descrever seu design. Extraia características úteis como tipografia, espaçamento, contraste, composição, materiais, tratamento de componentes e movimento. Referências como bibliotecas de componentes podem orientar a implementação; não copie integralmente branding proprietário ou artes distintivas.

Sem referências, deduza uma direção coerente a partir do negócio e da descrição do usuário. Evite usar por padrão o mesmo template para todos os negócios.

Crie um **style tile** compacto usando os tokens de design reais do website. Inclua o logotipo escolhido, paleta de cores, tipografia de títulos/corpo, botões, links, um card de exemplo ou componente de serviço e direção das imagens. Prefira um board HTML/CSS editável que possa ser visualizado ao lado do site. Esta é uma amostra de design, não uma captura de tela de um website finalizado e nem um brandbook completo.

Mantenha uma identidade consistente entre o board, os ativos gerados e o website. Preserve os ativos-fonte selecionados, prompts e justificativa da seleção. Quando houver uma skill relevante de produção de marca instalada, siga suas orientações de preservação e produção de ativos sem expandir a entrega para um brandbook desnecessário.

## 3. Projete a narrativa de rolagem

Traduza a oferta do negócio em uma curta jornada visual. O movimento deve comunicar algo sobre o produto, o trabalho artesanal, o serviço ou a experiência do cliente.

**Apresente a história antes da produção.** Comece com uma tabela concisa intitulada **Visual Story**, usando exatamente estas três colunas: **Scene**, **Visual story** e **Website copy**. Cada linha descreve uma cena significativa e associa sua ação visual a títulos preliminares, copy de apoio e chamadas para ação relevantes. Escreva propostas específicas para o negócio em vez de placeholders vazios. Frequentemente, três cenas são suficientes; adicione cenas somente quando a narrativa precisar delas.

Use esta estrutura de tabela, substituindo as descrições pela história realmente proposta:

| Scene                | Visual story                                                                       | Website copy                                                                         |
| -------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 01 — Abertura        | Estabeleça o assunto e a ação inicial; identifique espaço para a copy de abertura. | Título preliminar do hero, linha de apoio e ação principal.                          |
| 02 — Desenvolvimento | Continue da cena anterior para a próxima ação ou detalhe significativo.            | Título preliminar do recurso ou serviço, copy de apoio e qualquer ação relevante.    |
| 03 — Resolução       | Conduza o mesmo assunto até a revelação ou destino final.                          | Título preliminar do resultado, informações úteis do negócio e ação de encerramento. |

Após a tabela, explique brevemente como as cenas se conectam e como a rolagem introduz, mantém e remove a copy do website. Identifique onde HTML legível pode ficar sem cobrir a ação importante. Um segundo de vídeo não equivale a um segundo de rolagem: dê aos momentos que contêm texto espaço de rolagem suficiente para serem lidos e permita que momentos visuais importantes sejam mantidos.

### Projete os momentos de transição e o ritmo da rolagem

Projete o espaço entre as cenas de conteúdo com o mesmo cuidado dedicado às próprias cenas. Quando a narrativa se beneficiar disso, inclua um **momento de transição** dedicado: o cenário anterior sai de vista, o sujeito em movimento ocupa sozinho o viewport e o próximo cenário permanece fora de vista até sua entrada planejada. Não mostre a origem, o sujeito em deslocamento e o destino simultaneamente durante toda a filmagem quando a história pretendida exigir uma revelação em etapas. Gere enquadramento e movimento de câmera/sujeito que realmente criem o isolamento; uma distância de rolagem maior, por si só, não pode alterar o que está visível nos frames de origem.

Inclua esses momentos de transição como suas próprias linhas na tabela Visual Story quando carregarem uma ação significativa. A célula Website copy pode dizer “Sem copy — deixe o movimento conduzir” quando apropriado. Mantenha as três colunas da tabela inalteradas. Abaixo da tabela, forneça um plano conciso de **Scroll pacing** para cada cena e transição: o que entra/sai de vista, o enquadramento pretendido, a distância aproximada de rolagem ativa em alturas de viewport e se o momento utiliza movimento contínuo, movimento mais lento ou uma pausa em frame estático.

Atribua a distância de rolagem independentemente da duração do clipe e da quantidade de frames. Um clipe de seis segundos pode ocupar várias alturas de viewport de rolagem; frames adicionais melhoram a amostragem temporal, mas não aumentam inerentemente a duração da experiência de rolagem. Meça o ritmo em alturas de viewport ou distâncias de layout equivalentes, não em movimentos da roda do mouse, porque os dispositivos de entrada se comportam de maneira diferente. Trate as distâncias sugeridas como escolhas iniciais de design, não como valores obrigatórios. Para uma revelação prolongada, uma abertura pode usar uma altura de viewport, uma transição isolada uma ou duas, e uma revelação outra, sendo então ajustadas à história e à legibilidade.

Use uma linha do tempo de rolagem por partes em vez de um único mapeamento uniforme quando diferentes momentos precisarem de ênfases distintas. Aloque mais distância de rolagem para movimentos importantes ou uma transição e permita pausas deliberadas em frames para conteúdo legível. Diferencie **uma pausa em frame estático** de **movimento sustentado**: congelar um frame é apropriado para uma pausa, mas um sujeito que deve continuar se movendo precisa de movimento utilizável suficiente e frames intermediários. Não estique um punhado de frames por um longo intervalo de rolagem e chame a reprodução resultante em etapas de suave. Solicite um clipe de transição mais longo ou separado quando necessário, mantendo a continuidade de frames correspondentes descrita abaixo.

Especifique a estrutura de ritmo antes da geração das filmagens para que o clipe contenha a entrada, o movimento isolado e a saída necessários. Na implementação, mapeie o intervalo de rolagem de cada momento para seu próprio intervalo de frames; uma pausa mapeia um intervalo para um único frame. Preserve a continuidade nos limites e ao inverter a direção. Conte o deslocamento ativo de rolagem fixada separadamente da altura do palco visível, para que o dimensionamento do layout não encurte acidentalmente a sequência pretendida.

Quando verificações de interação no navegador forem permitidas, valide a experiência real com rolagem comum: a transição recebe o espaço pretendido, o destino entra no momento correto e o texto tem tempo para ser lido. Ajuste as distâncias de rolagem e os intervalos de frames com base nessa experiência. Se testes de interação não estiverem disponíveis, informe que o ritmo permanece não verificado em vez de afirmar que o resultado é suave apenas com base na compilação.

**Faça com que a história visual seja contínua.** Para histórias que acompanham o mesmo sujeito por múltiplas ações ou locais, prefira sequências conectadas com frames de transição correspondentes. Cada cena deve começar onde a anterior terminou. Preserve a identidade do sujeito, geometria dos objetos, materiais, escala, iluminação e relações espaciais durante a transição. Se a história mudar de ambiente, mostre uma transição motivada em vez de substituir acidentalmente o cenário no limite entre clipes.

Escolha a arquitetura adequada mais simples:

**Uma sequência contínua:** Faça scrub de um clipe curto enquanto um palco visual permanece fixado. Faça fade, mova ou substitua conteúdo real do website em intervalos de progresso definidos. Várias aparentes “seções hero” podem ser capítulos dentro desse único palco fixado.

**Múltiplas sequências conectadas:** Use clipes correspondentes quando a história mudar de local, ação ou composição além do que um único clipe consegue sustentar de forma confiável. Extraia o frame final selecionado da sequência anterior e use-o como frame inicial ou referência inicial da próxima sequência quando o modelo oferecer suporte. Continue a ação visível e o movimento da câmera a partir desse estado. Faça corresponder enquadramento, posição do sujeito, orientação e fundo na fronteira; não gere cenas independentes não relacionadas e presuma que um crossfade as tornará contínuas.

No modo guiado ou explicitamente passo a passo, apresente a tabela e a explicação da conexão para feedback antes de gerar a filmagem da história ou construir a animação. No modo autônomo/template, ainda apresente-os e depois continue sem aguardar uma aprovação estética.

Não force todos os websites a usar um clipe de duração fixa ou um hero fixado indefinidamente. Um clipe curto de aproximadamente 6–12 segundos é um ponto de partida útil, sujeito às capacidades do modelo escolhido. Gere apenas o movimento necessário para a história escolhida. O website final pode combinar cenas com scrub, transições, frames de repouso e seções comuns em fluxo normal.

Planeje agora a composição responsiva. Reserve espaço para texto e considere como o sujeito sobrevive a um recorte estreito. Evite ações importantes nas duas extremidades laterais. Escolha um ativo separado para dispositivos móveis somente quando isso melhorar materialmente o resultado.

## 4. Gere, inspecione e prepare os ativos por meio do MCP

Verifique o schema atual do modelo antes de enviar: duração, proporção, resolução, funções das referências e controles de primeiro/último frame suportados. Use o provedor solicitado pelo usuário e preserve suas preferências de cobrança. Criar os ativos solicitados não autoriza comprar uma assinatura nem alterar configurações da conta.

Gere primeiro os stills principais quando eles ajudarem a estabelecer composição ou consistência do sujeito. Para clipes relacionados, reutilize as referências selecionadas em vez de reinventar o sujeito de forma independente. Especifique a ação, comportamento da câmera, materiais, iluminação, espaço utilizável para texto e pontos finais de transição. Evite cortes, a menos que o storyboard os utilize intencionalmente. Não incorpore títulos, navegação, descrições de serviços ou chamadas para ação nos pixels gerados.

Para cenas conectadas, produza os clipes dependentes em ordem: aceite a cena A, extraia seu frame final limpo, passe exatamente esse ativo raster usando o parâmetro de frame inicial/referência suportado pelo próximo modelo e então gere a cena B como uma continuação. Preserve as mesmas referências de identidade e configurações visuais. Planeje e inspecione o frame de transição antes de iniciar o clipe dependente; stills independentes e o trabalho no website podem continuar simultaneamente. Se um modelo não possuir controle de frame inicial, utilize orientação de imagem-para-vídeo/referência suportada ou selecione um modelo compatível dentro das restrições do usuário e informe a limitação em vez de alegar uma correspondência garantida.

Inspecione cada junção usando conjuntamente os frames de saída e entrada. Procure alterações de posição, escala, orientação, iluminação, direção da câmera e movimento que possam causar um salto durante a rolagem para frente ou para trás. Um frame de referência orienta a geração, mas não garante continuidade. Corrija uma transição visivelmente quebrada antes da integração, preserve tamanho de renderização/recorte consistente entre cenas e coordene as transições dos capítulos HTML com a junção aceita.

Mantenha os IDs dos jobs e recupere os resultados dos jobs existentes antes de enviar duplicatas. Um job pendente não é um job com falha. Trabalhe no layout e no conteúdo enquanto a geração estiver sendo executada. Mostre ativos concluídos úteis prontamente, sem exigir aprovações desnecessárias no modo autônomo.

Inspecione frames representativos e o movimento concluído usando as ferramentas de mídia disponíveis. Verifique continuidade, coerência visual, texto não intencional, enquadramento e se o conteúdo planejado pode permanecer legível. Se um ativo falhar em um requisito importante, faça uma correção direcionada; não execute um loop aberto de regeneração. Preserve ativos que já sejam úteis.

Salve o vídeo original e os arquivos mestres de marca selecionados. Extraia uma sequência de imagens pronta para o navegador usando uma ferramenta de mídia disponível, como FFmpeg. Um comando típico é:

```sh
ffmpeg -i input.mp4 -an -vf "fps=18,scale=1280:-2" -c:v libwebp -quality 78 -start_number 0 frames/frame-%04d.webp
```

Trate essas configurações como um ponto de partida, não como uma garantia. Adapte taxa de frames, dimensões e qualidade ao movimento e ao tamanho de transferência medido. Evite fazer upscale de uma fonte de baixa resolução. Use um diretório de staging novo em vez de sobrescrever uma sequência existente. Escreva um manifest com contagem real, dimensões, padrão de nomenclatura e um poster válido. Verifique o primeiro, o intermediário e o último frame, numeração, tamanhos dos arquivos e todos os caminhos referenciados antes da integração. Disponibilize imediatamente uma imagem estática adequada enquanto a sequência é carregada.

## 5. Construa um website completo e utilizável

Reutilize o projeto atual e componentes existentes adequados. Siga o workflow de build/deploy exigido pelo ambiente de hospedagem, se houver. Mantenha um único responsável pelo ciclo de vida do código-fonte e da publicação.

Construa a estrutura de negócio do site, além de sua animação: navegação útil, oferta clara, seções relevantes e uma ação principal. Use o briefing do negócio para determinar o conteúdo em vez de adicionar mecanicamente todas as seções padrão de uma landing page.

Implemente a narrativa de rolagem com um canvas/palco de imagens fixado ou uma abordagem igualmente confiável. Para uma sequência de imagens, mapeie o progresso limitado da cena para um índice de frame válido:

```text
progress = clamp(sceneScroll / sceneScrollDistance, 0, 1)

frameIndex = round(progress * (frameCount - 1))
```

Mantenha a renderização do movimento separada do conteúdo HTML semântico. Texto temporizado, botões, labels de recursos e navegação devem permanecer nítidos, selecionáveis, acessíveis e editáveis. Coordene suas transições com o storyboard. Se a copy aparecer vinculada a um objeto em movimento, use posicionamento/keyframes deliberados ou tracking em vez de presumir que uma label fixa o acompanhará automaticamente.

Evite scroll hijacking. A rolagem nativa deve funcionar para frente e para trás. Faça com que os limites das cenas pareçam intencionais e permita que o restante da página flua normalmente. Garanta que camadas invisíveis não interceptem cliques nem deixem links ocultos na ordem de navegação por teclado.

Priorize o frame solicitado e os frames próximos. Limite solicitações simultâneas e a memória de frames decodificados, descarte trabalhos obsoletos, libere bitmaps removidos e evite carregar todos os frames em resolução máxima na memória. Use tentativas limitadas para frames ausentes. Considere saltos rápidos de rolagem, rolagem reversa, redimensionamento, displays de alta densidade e desmontagem. Preserve uma imagem estática útil se a mídia falhar.

Forneça fallbacks para movimento reduzido e dispositivos com recursos limitados que preservem o conteúdo e a ação principal. Permita que visitantes pulem uma animação longa. Reorganize o conteúdo para dispositivos móveis; não apenas reduza a composição desktop. Nunca faça a compreensão do negócio depender inteiramente da visualização da animação.

## 6. Torne o conteúdo fácil de substituir, validar e entregar

Mantenha a copy do negócio, detalhes de serviços, chamadas para ação e referências de mídia em um arquivo de conteúdo claro ou em um CMS existente apropriado. Um pequeno editor baseado no navegador é útil quando adequado ao projeto. Se as edições forem salvas apenas no armazenamento local, explique isso claramente e forneça exportação/importação, além do caminho real para publicar as alterações. Não apresente rascunhos locais como edições compartilhadas ao vivo.

Formulários precisam de um destino real de envio ou de um comportamento de demonstração explicitamente identificado. Nunca mostre “enviado” se nada tiver sido enviado.

Execute as verificações apropriadas de código, build de produção e ativos. Verifique o manifest da sequência, caminhos dos frames, posters e ativos-fonte. Verifique layouts responsivos, fallbacks de movimento e interações principais com as ferramentas permitidas pelo host. Diferencie verificações realmente executadas daquelas que não foram executadas; a compilação por si só não comprova reprodução suave ou qualidade visual.

Publique apenas dentro do escopo e da audiência autorizados pelo usuário. Quando o ambiente oferecer previews privados autorizados, utilize-os. Não exponha silenciosamente um rascunho ao público. Se a publicação não estiver disponível, entregue um projeto local executável e informe a dependência ausente.

Entregue o website/preview, style tile, arquivos mestres do logotipo selecionado, clipe(s) original(is), conteúdo editável e instruções concisas de edição. Inclua uma breve nota de produção com a direção escolhida, suposições, prompts, proveniência dos ativos, medições importantes e limitações observadas. Exclua credenciais e URLs assinadas temporárias de pacotes reutilizáveis.

Continue até que o resultado solicitado esteja completo ou até que uma dependência concreta o impeça. Mostre progresso significativo e resultados concluídos em vez de planos repetidos. Quando o usuário solicitar apenas um template, conclua agora um template coerente e deixe o conteúdo preparado para refinamento posterior.
