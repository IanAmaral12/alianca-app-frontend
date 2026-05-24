# Alianca Mobile

Frontend Expo React Native do Alianca, um app para casais com autenticacao, conexao por convite, questionarios, tarefas compartilhadas, gamificacao e sugestoes de tarefas do Cupido.

## O que o app cobre hoje

- Autenticacao com e-mail e senha via Supabase Auth.
- Cadastro inicial com nome e data de nascimento na mesma tela.
- Conexao do casal por token pessoal e convites.
- Questionario individual.
- Questionario do casal, incluindo filhos com nome, sexo e data de nascimento.
- Workspace com tarefas colaborativas.
- Tarefas com dificuldade, categoria, frequencia, dias da semana personalizados e prazo.
- XP, nivel e barra de progresso.
- Realtime do Supabase para atualizacao da lista de tarefas.
- Notificacoes locais quando o parceiro cria nova tarefa.
- Sugestoes de tarefas do Cupido via Edge Function no backend.

## Fluxo principal

1. O usuario cria conta ou entra com e-mail e senha.
2. O app carrega o perfil e leva para a tela de conexao com o parceiro.
3. O casal se conecta usando token e convite.
4. Cada pessoa responde o questionario individual.
5. O casal responde o questionario conjunto.
6. O workspace libera tarefas, progresso e sugestoes do Cupido.

## Dependencias principais

- Expo SDK 56
- React Native 0.85
- Supabase JS 2
- React Navigation
- Expo Notifications

## Ambiente

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Variaveis usadas pelo app:

```env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Observacoes:

- No Android emulator, normalmente a URL do Supabase local deve usar `http://10.0.2.2:54321`.
- Em dispositivo fisico, troque `127.0.0.1` pelo IP local da maquina que esta rodando o Supabase.
- O projeto tem fallback local em `src/lib/supabase.ts`, mas o recomendado e manter o `.env` configurado.

## Como rodar localmente

Suba a stack local do Supabase e reaplique as migrations:

```bash
cd ../backend
npx supabase start
npx supabase db reset
```

Instale dependencias do frontend:

```bash
cd ../frontend
npm install
```

Inicie o app:

```bash
npm start
```

Atalhos uteis:

```bash
npm run web
npm run android
npm run ios
```

## Cupido no frontend

Na tela de workspace existe uma secao chamada `Sugestoes do Cupido`.

- O botao `Pedir sugestoes de tarefa pro Cupido` chama a Edge Function `cupido-suggestions`.
- A funcao devolve 5 sugestoes no mesmo formato de `couple_tasks`.
- Cada sugestao pode ser aceita, criando uma tarefa real, ou descartada.

Para isso funcionar, o backend precisa estar com a function publicada e com o secret `GROQ_API_KEY` configurado.

## Estrutura relevante

- `App.tsx`: orquestra sessao, onboarding e roteamento de alto nivel.
- `src/lib/supabase.ts`: cliente Supabase e resolucao de ambiente.
- `src/lib/date.ts`: formatacao e conversao de datas em `DD/MM/AAAA`.
- `src/lib/notifications.ts`: notificacoes locais.
- `src/screens/ConnectionHomeScreen.tsx`: token e convites.
- `src/screens/CoupleQuestionnaireScreen.tsx`: questionario conjunto.
- `src/screens/WorkspaceScreen.tsx`: tarefas, progresso e Cupido.

## Validacao

Para validar tipagem do frontend:

```bash
npx tsc --noEmit
```

## APK para testar notificacoes no Android

O `expo-notifications` no Android nao deve mais ser testado pelo Expo Go. Para isso, use um build proprio do app.

Configuracao adicionada no projeto:

- `app.json` agora define o package Android `com.alianca.app`
- `eas.json` usa um perfil `preview` que gera APK instalavel
- `package.json` ganhou os scripts `eas:configure`, `build:android:apk` e `build:android:aab`

Passo a passo:

```bash
cd frontend
npx expo login
npm install
npm run eas:configure
npm run build:android:apk
```

Quando o build terminar, o EAS devolve um link para baixar o APK no celular.

Se preferir rodar sem script, use `npx eas-cli build:configure` e `npx eas-cli build --platform android --profile preview`.

Observacao tecnica:

- Os scripts usam `npx eas-cli` diretamente em vez de instalar `eas-cli` nas dependencias do app.
- Isso evita conflito de lockfile entre o npm local e o npm usado pelo EAS Build.

Observacao importante:

- O app hoje usa notificacoes locais em `src/lib/notifications.ts`.
- Isso funciona em um APK nativo, mas nao equivale a push remota com o app totalmente fechado.
- Se voce quiser push real depois, sera preciso salvar device token e enviar a notificacao pelo backend ou por uma Edge Function.

## Referencias

- Supabase + Expo React Native: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Supabase Edge Functions: https://supabase.com/docs/guides/functions