# GHands (client app)

Single Expo project at the repo root. **Provider app** is a separate repository.

## Run

```bash
npm install
npx expo start -c
```

Or:

```bash
npm start
```

## Verify setup

```bash
npm run verify
```

Requires `package.json` → `"main": "expo-router/entry"` (already set).

## EAS

```bash
eas build -p ios --profile production
```

Bundle: `com.bendee.GHands` — project id in `app.config.js`.

## Provider app

See separate **ghands-provider** repo. Handoff: [docs/PROVIDER_NEW_REPO_CURSOR_PROMPT.md](./docs/PROVIDER_NEW_REPO_CURSOR_PROMPT.md)
