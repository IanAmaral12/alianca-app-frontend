# Alianca Mobile

Base Expo React Native para um aplicativo focado em melhorar relacionamentos com autenticacao, onboarding de casal, questionarios e workspace colaborativo de tarefas.

## Fluxo atual

1. Autenticacao com e-mail e senha via Supabase Auth.
2. Completar perfil com nome e idade.
3. Exibir token pessoal e conectar o casal por convite.
4. Responder o questionario individual.
5. Responder o questionario do casal.
6. Entrar no workspace com CRUD de tarefas, pontos e nivel.

## Schema usado no backend

- `profiles`: dados basicos do usuario e token pessoal.
- `partnership_invitations`: convites pendentes e respondidos.
- `couple_workspaces`: dados do casal, pontuacao e nivel.
- `couple_memberships`: vinculo entre usuarios e workspace.
- `user_questionnaires`: questionario individual.
- `couple_tasks`: tarefas colaborativas com pontuacao por dificuldade.

## Configuracao de ambiente

Copie o exemplo de ambiente e ajuste se necessario:

```bash
cp .env.example .env
```

Variaveis esperadas:

```env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Observacoes:

- No Android emulator, prefira `http://10.0.2.2:54321`.
- Em dispositivo fisico, use o IP local da sua maquina no lugar de `127.0.0.1`.
- O app tem fallback para a stack local do Supabase, mas configurar `.env` continua sendo o caminho recomendado.

## Rodando localmente

Suba o backend local e reaplique as migrations:

```bash
cd ../backend
npx supabase start
npx supabase db reset
```

Depois rode o app:

```bash
cd ../frontend
npm start
```

## Referencias

- Tutorial oficial base de Expo + Supabase: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- Documentacao de auth no Supabase: https://supabase.com/docs/guides/auth
- Documentacao de RLS no Supabase: https://supabase.com/docs/guides/database/postgres/row-level-security