# Mundos Sombrios V2.9.0 — Offline e Sandbox Integral

## Site principal offline
Sirva a pasta raiz por HTTP local e abra `http://localhost:8080/`. Com o Supabase não configurado, o login usa o adaptador local.

Contas QA:
- Jogador: `jogador` / `jogador123`
- Mestre: `mestre` / `mestre1234`
- ADM/Arconte: `admin` / `admin12345`

No Windows, execute `INICIAR-SITE-OFFLINE.bat`.

## Sandbox integral
Abra `http://localhost:8080/sandbox-offline/` ou execute `INICIAR-SANDBOX.bat`.

O sandbox é reconstruído do **mesmo HTML/CSS/JavaScript do site principal**. A única substituição funcional é `js/ms-runtime-config.js`, que ativa um banco local isolado no namespace `ms-sandbox-v290`.

A barra QA permite alternar entre Jogador, Mestre e ADM/Arconte usando o fluxo real de autenticação/hidratação.

## Limite do sandbox
Ele testa a aplicação, permissões, fichas, Mesas/VTT, SoulDrakma, PEG, Arconte e persistência local. Não substitui a validação de RLS/RPC/Realtime de um Supabase real.
