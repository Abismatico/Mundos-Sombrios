# Mundos Sombrios — Base de Desenvolvimento v0.57

## Objetivo
Esta build é um **baseline de desenvolvimento**: organiza os próximos trabalhos para evitar correções concorrentes, mas ainda é um aplicativo client-side. Ela não deve ser tratada como aplicação segura de produção.

## Decisões aplicadas
1. **Credenciais padrão removidas.** A build não cria mais `admin/123`, `mestre/123` ou `jogador/123`.
2. **Primeiro ADM por instalação.** Ao abrir uma instalação sem ADM configurado, o botão `CONFIGURAR ADM INICIAL` permite criar o primeiro administrador manualmente.
3. **Senhas com PBKDF2 local.** Contas novas usam `Web Crypto API + PBKDF2/SHA-256` com salt aleatório. Isso reduz exposição acidental, mas não substitui backend.
4. **Migração legada.** Se um navegador já possuir uma conta antiga em texto puro, o login válido converte essa credencial para hash e remove o campo `password`.
5. **Painel ADM não exibe senha.** O campo virou uma entrada opcional de "nova senha"; vazio significa manter a senha atual.
6. **Autorização explícita.** As operações sensíveis continuam verificando `currentUser.role === 'admin'` dentro das próprias funções.
7. **Sem novo arquivo de patch global.** A regra é corrigir no módulo proprietário ou no ponto de contrato correspondente.

## Limite de segurança
`localStorage` continua sendo controlável pelo usuário do navegador. Portanto:
- não há proteção real contra adulteração do papel do usuário;
- não há sessão autenticada no servidor;
- não há banco de dados confiável;
- não há recuperação de senha real;
- mesas, fichas e dados administrativos continuam locais.

Antes de publicar online, migrar autenticação, autorização, sessões e persistência para um backend.

## Regra de fronteira entre módulos
- `script.js`: núcleo atual e compatibilidade global. Não adicionar novas funcionalidades grandes aqui.
- `power-registry.js`: Registro de Potências/Capacidades.
- `projeto-player-interface.js`: Projeto Player.
- `ordem-sete.js`: Ordem dos Sete.
- `hermetico-rituais.js`: Hermético/Rituais.
- `aprimorador-engenharia.js`: Aprimorador/Engenharia.
- `linhagem-tree.js`: Linhagem/árvore.
- `exodo-nexo.js`: Nexo/Êxodo.
- `codex*.js`: catálogo, biblioteca e leitura do Códice.
- `mundos-updates.js`: compatibilidade histórica. Não usar para novas features; migrar gradualmente a lógica para o proprietário.

## Ordem segura para uma atualização
1. Descrever o comportamento esperado.
2. Identificar o módulo proprietário.
3. Alterar somente esse módulo.
4. Criar/atualizar teste QA do comportamento.
5. Executar `node --check` em todos os JS.
6. Executar a suíte QA.
7. Fazer teste manual do fluxo afetado.
8. Fazer teste de regressão do login/modo/contexto.
9. Registrar a mudança no changelog.
10. Só depois iniciar outra alteração.
