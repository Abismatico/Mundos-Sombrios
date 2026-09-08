# Mundos Sombrios — v0.67.0

Revisão estrutural da Forja da Alma, Sala dos Mestres, Escudo do Mestre e infraestrutura online.

## Forja da Alma
- Seleção focal em carrossel 3D para classes e naturezas/expansões, com navegação lateral, teclado, resumo mecânico e arte temática exclusiva.
- 31 retratos vetoriais próprios: 23 classes e 8 naturezas/expansões.
- Conceito de personagem estruturado: origem, ocupação, vínculo institucional, situação, vínculos, motivação e relação com o mundo.
- Resumo permanente da construção e trilha guiada de etapas.
- Rascunho automático recuperável e descarte explícito.
- Histórico de versões com restauração pelo serviço online.
- Registro de Evolução Gradual por sessão, capacidade, sucessos, autorização e observações.
- Poderes estruturados por efeito, alcance, duração, alvos, custo, teste e consequência, preservando compatibilidade com `powersHtml` legado.
- Validação de atributos alinhada à interface: faixa -2..10, campos essenciais e avisos de construção.
- Persistência alterada para só promover a ficha ao estado local após confirmação remota; falhas mantêm o rascunho.
- Ajustes de impressão/PDF para preservar blocos mecânicos e remover controles transitórios.

## Sala dos Mestres
- Preparação vinculada explicitamente a uma mesa/campanha.
- Metadados de campanha: descrição, época, região, expansões, condições iniciais e regras próprias.
- Cofre contextualizado por mesa.
- NPCs ampliados com ataques, resistências, poderes, comportamento, objetivos e vínculo de token.
- Encontros com objetivos, ameaças, perigos, desfechos e leitura de controle/resistência/letalidade.
- Controle de combate com iniciativa, rodada, turno, PV e condições.
- Pistas privadas com revelação seletiva via eventos da mesa.
- Registro de facções, relações, acontecimentos e consequências do mundo.
- Planejamento, início e encerramento de sessões usando campanhas/sessões do backend existente.

## Mesa virtual
- Régua real por arrasto com escala configurável da grade.
- Tokens preservam `msTokenId`, proprietário, `ownerId` e personagem vinculado na serialização.
- Objetos transitórios de régua/grade não contaminam o estado persistente.
- Permissões de seleção respeitam propriedade do token.

## Escudo do Mestre
- As nove abas agora possuem conteúdo funcional: Cronologia, Mapa, Economia, Êxodo, Ocultatun, Ordem dos Sete, Envolto, Árvores e Arquivos.
- Êxodo inclui consulta de Estigmas com custo, bônus e risco.
- Busca em classes, árvores e corpus editorial.
- Favoritos locais e referência explícita de origem/ID no acervo.
- Carregamento sob demanda do grande corpus do Escudo, evitando seu custo na entrada do portal.

## Online / Supabase
- Políticas RLS para `realtime.messages` limitam Broadcast/Presence privado aos membros ou proprietário da mesa em tópicos `ms:table:*`.
- `ms-online-ui.js` e `ms-platform.css`, antes referenciados/ausentes, foram entregues.
- A instalação deve aplicar o SQL atualizado e manter os canais configurados como privados. No painel do Supabase Realtime, desative **Allow public access** para que a autorização privada seja efetivamente exigida.

## Qualidade
- `npm run audit`: 29 arquivos JavaScript válidos.
- 18/18 testes estruturais e regressivos aprovados.
- 39/39 referências locais do `index.html` resolvidas.
- `tests/syntax-check.mjs` e `tests/platform-regression.test.js` adicionados.

## Compatibilidade
As fichas antigas continuam podendo usar os campos HTML legados. Os novos registros estruturados são gravados em paralelo para permitir migração gradual sem invalidar dados existentes.
