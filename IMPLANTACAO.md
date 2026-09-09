# Implantação — GitHub + Supabase

## Estado desta entrega

Código preparado localmente. Nenhum push, publicação ou alteração no banco remoto foi realizado. A validação local não confirma autenticação, RLS, Storage ou Realtime em produção.

## Destinos a confirmar

- URL do repositório GitHub e branch de destino (workflow preparado para `main`).
- Projeto Supabase: o código recebido aponta para `xhcunksjrksdzdtabfxt`.
- URL final do site, necessária para os links de autenticação.

## Site

O GitHub guarda e publica o código; o navegador acessa os dados e a autenticação do Supabase. Alterações no banco não são copiadas para o GitHub.

Em Settings → Pages, selecione GitHub Actions. Cada push na main executa os testes antes da publicação. Pull requests somente validam. O build usa apenas Node, sem dependências npm adicionais.

A chave `sb_publishable_...` existente é pública e própria para o navegador. Nunca substitua por `service_role`, `sb_secret_...`, senha do banco ou token pessoal. A proteção dos dados depende das políticas RLS.

## Banco e autenticação

1. Confirmar o projeto de destino e inspecionar o schema remoto e backups antes de aplicar migrações.
2. Em banco novo, seguir os quatro arquivos SQL na ordem indicada no README. Em banco existente, aplicar apenas as mudanças faltantes após revisar compatibilidade.
3. Configurar em Authentication → URL Configuration a Site URL e as Redirect URLs com a URL final completa, incluindo o caminho do repositório quando houver.
4. Validar confirmação de e-mail e recuperação de senha com uma conta de teste autorizada.
5. Confirmar tabelas, políticas de Storage e publicação Realtime usadas pelo código.
6. Definir o administrador com o proprietário antes de abrir cadastros. O código original contém a RPC `bootstrap_first_admin`, acessível a autenticados quando não há administrador. Além disso, o fluxo visual chama métodos ausentes (`adminExists` e `bootstrapFirstAdmin`). Esse fluxo inicial precisa de revisão com o estado real do projeto; não foi habilitado nesta preparação.

## Validação remota pendente

- Cadastro, confirmação, login e recuperação de senha.
- Salvar e reabrir ficha com Nome + Expansão + Classe.
- Criar mesa e conferir acesso de jogador, mestre e administrador.
- Conferir isolamento entre duas contas, arquivos privados e eventos Realtime.
- Conferir SoulDrakma e restrições de slots no banco.

## Referências

- [GitHub Pages com workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [URLs de autenticação Supabase](https://supabase.com/docs/guides/auth/redirect-urls)
