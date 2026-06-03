# GHands Provider — New Repo Handoff (paste this into Cursor)

Use this document in a **brand-new Git repository** after you copy files from the main **GHands** client monorepo. The goal is a **standalone Expo app** named **GHands Provider** — not a role inside the client app.

---

## 1. Context (read this first)

### What happened in the old repo

- **GHands** (client) and **GHands Provider** used to live in **one** Expo app with `app/provider/` routes and a “switch to client” testing button.
- We split them into a monorepo:
  - `apps/client` → homeowners (bundle `com.bendee.GHands`)
  - `apps/provider` → service pros (bundle `com.bendee.GHandsProvider`)
  - `packages/shared` → shared API, components, hooks, utils, lib

### What YOU are doing now

- Creating a **second Git repo** only for the provider app.
- Copying `apps/provider` + shared code into that repo as a **normal Expo project** (no monorepo, no `packages/shared` path).
- **New git history** → new EAS project → new App Store / Play listing.

### Important naming clarification

| Path | Meaning |
|------|--------|
| `app/(tabs)/home.tsx` | Expo Router **screen** (main tab) — **keep** |
| `app/provider/home.tsx` | **Legacy duplicate** from old combined app — **DELETE entire `app/provider/` folder** |
| `@/components/provider/SageHeroPanel` | Shared **UI components** folder — **keep** (not a route) |

Do **not** confuse `components/provider/` (components) with `app/provider/` (old routes).

---

## 2. What to copy from the GHands repo into the new repo

From the **main GHands repository**, copy these into the **root** of the new provider repo:

### A. Provider app shell (from `apps/provider/`)

```
apps/provider/app/          →  app/
apps/provider/assets/       →  assets/
apps/provider/app.config.js →  app.config.js
apps/provider/babel.config.js
apps/provider/metro.config.js   (will be replaced — see §4)
apps/provider/tailwind.config.js
apps/provider/global.css
apps/provider/nativewind-env.d.ts
apps/provider/eas.json
apps/provider/postcss.config.js   (if present)
```

### B. Shared code (from `packages/shared/` in monorepo, OR same folders at old repo root)

Copy into the **new repo root** (same level as `app/`):

```
components/
hooks/
lib/
services/
utils/
providers/
data/
```

Also ensure `lib/nativewindSetup.ts` exists (imported from `app/_layout.tsx`).

### C. Root tooling (from main GHands `package.json` dependencies)

The new repo needs its **own** `package.json` with the same dependencies as the client monorepo root (see §5). Do **not** use npm workspaces in the provider-only repo unless you want a monorepo again.

### D. Optional but recommended

```
.eslintrc / eslint.config.js   (if used)
.prettierrc
.github/workflows              (CI from GHands if you use it)
```

### E. Do NOT copy

- `apps/client/`
- `app/(tabs)/` client screens (categories, discover, booking flow, `OngoingJobDetails`, etc.)
- `app/provider/` **inside** `apps/provider/app/provider/` — **delete after copy**
- Role-switch UI (`components/testing/RoleSwitchButton.tsx`) — not needed
- Client-only screens: `LoginScreen`, `ServiceMapScreen`, `BookingConfirmationScreen`, `OngoingJobDetails`, etc. (provider copy should already omit these)

---

## 3. Target folder structure (final standalone repo)

```
ghands-provider/                 # new git root
├── app/
│   ├── _layout.tsx              # root stack
│   ├── index.tsx                # entry → sign-in or (tabs)/home
│   ├── (tabs)/
│   │   ├── _layout.tsx          # bottom tabs
│   │   ├── home.tsx
│   │   ├── jobs.tsx
│   │   ├── quotations.tsx
│   │   ├── wallet.tsx
│   │   └── profile.tsx
│   ├── ProviderSignInScreen.tsx
│   ├── ProviderSignUpScreen.tsx
│   ├── ProviderJobDetailsScreen.tsx
│   ├── SendQuotationScreen.tsx
│   ├── RequestVisitScreen.tsx
│   ├── ChatScreen.tsx
│   ├── NotificationsScreen.tsx
│   ├── WalletScreen.tsx
│   └── ... (other provider stack screens)
├── assets/
│   ├── images/
│   └── fonts/
├── components/
│   └── provider/                # UI only — SageHeroPanel, ProviderProceedModal, etc.
├── hooks/
├── lib/
├── services/
├── utils/
├── providers/
├── data/
├── app.config.js
├── package.json
├── tsconfig.json
├── metro.config.js
├── babel.config.js
├── tailwind.config.js
├── global.css
├── eas.json
└── .gitignore
```

**There must be NO `app/provider/` directory** for routing. Tabs live in `app/(tabs)/`.

---

## 4. Config files to fix in the new repo

### 4.1 `tsconfig.json` (standalone — no monorepo)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ]
}
```

Remove any path like `../../packages/shared/*`.

### 4.2 `metro.config.js` (standalone)

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

### 4.3 `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: { extend: {} },
  plugins: [],
};
```

### 4.4 `app.config.js` (already correct — verify)

| Field | Value |
|-------|--------|
| `expo.name` | `GHands Provider` |
| `expo.slug` | `GHands-Provider` |
| `expo.scheme` | `ghands-provider` |
| `ios.bundleIdentifier` | `com.bendee.GHandsProvider` |
| `android.package` | `com.bendee.GHandsProvider` |
| `extra.appRole` | `provider` |

After `eas init`, set:

```js
extra: {
  appRole: 'provider',
  eas: { projectId: '<YOUR_NEW_EAS_PROJECT_UUID>' },
},
```

**Do not** reuse the client EAS project id (`82fb8167-b26b-4fcf-84c2-fb858f717a03`).

### 4.5 Environment variables (`.env` or EAS secrets)

```bash
EXPO_PUBLIC_API_URL=https://bamibuildit-backend-v1.onrender.com
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<your key>
# Optional wallet bank display:
EXPO_PUBLIC_BANK_ACCOUNT_NUMBER=
EXPO_PUBLIC_BANK_ACCOUNT_NAME=
```

Set the same in EAS: `eas secret:create` or Expo dashboard → Environment variables.

---

## 5. `package.json` for the new repo

**Critical:** `"main": "expo-router/entry"` is required. Without it, Expo uses `expo/AppEntry.js` and fails with:

`Unable to resolve "../../App" from "node_modules/expo/AppEntry.js"`

Use **name** `ghands-provider` (not `@ghands/provider`). Full template: `docs/templates/provider-package.json`

Or run from GHands repo:

```bash
./scripts/copy-provider-new-repo.sh ../ghands-provider
```

That script copies files, writes metro/tsconfig, and runs verification.

Example (minimal fields):

```json
{
  "name": "ghands-provider",
  "version": "1.0.3",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "expo lint",
    "test": "jest"
  },
  "dependencies": {
    "@expo-google-fonts/outfit": "^0.4.3",
    "@expo-google-fonts/poppins": "^0.4.1",
    "@expo/vector-icons": "^15.0.3",
    "@hookform/resolvers": "^5.2.2",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/bottom-tabs": "^7.4.0",
    "@react-navigation/elements": "^2.6.3",
    "@react-navigation/native": "^7.1.8",
    "@tanstack/react-query": "^5.90.6",
    "expo": "~54.0.25",
    "expo-asset": "~12.0.10",
    "expo-constants": "~18.0.10",
    "expo-device": "^8.0.10",
    "expo-font": "~14.0.9",
    "expo-haptics": "~15.0.7",
    "expo-image": "~3.0.10",
    "expo-image-picker": "~17.0.8",
    "expo-linear-gradient": "~15.0.8",
    "expo-linking": "~8.0.9",
    "expo-location": "~19.0.7",
    "expo-navigation-bar": "~5.0.9",
    "expo-notifications": "^0.32.16",
    "expo-router": "~6.0.15",
    "expo-secure-store": "~15.0.8",
    "expo-splash-screen": "~31.0.11",
    "expo-status-bar": "~3.0.8",
    "expo-symbols": "~1.0.7",
    "expo-system-ui": "~6.0.8",
    "expo-web-browser": "~15.0.9",
    "lottie-react-native": "~7.3.1",
    "lucide-react-native": "^0.546.0",
    "moti": "^0.28.1",
    "nativewind": "^4.2.1",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-hook-form": "^7.66.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-maps": "1.20.1",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "^5.4.0",
    "react-native-screens": "~4.16.0",
    "react-native-svg": "15.12.1",
    "react-native-vector-icons": "^10.3.0",
    "react-native-web": "~0.21.0",
    "react-native-webrtc": "^124.0.6",
    "react-native-worklets": "0.5.1",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.25.0",
    "eslint-config-expo": "~10.0.0",
    "jest": "^29.7.0",
    "jest-expo": "^55.0.16",
    "postcss": "^8.5.6",
    "prettier": "^3.8.0",
    "tailwindcss": "^3.4.18",
    "typescript": "~5.9.2"
  },
  "overrides": {
    "react-server-dom-webpack": "19.1.0"
  }
}
```

Then run: `npm install`

---

## 6. Routing rules (provider-only)

### Entry (`app/index.tsx`)

- Set `@ghands:user_role` to `provider` in AsyncStorage.
- If token exists → `router.replace('/(tabs)/home')`
- Else → `router.replace('/ProviderSignInScreen')`
- **Never** redirect to client routes or `SelectAccountTypeScreen`.

### Tab routes (use these paths everywhere)

| Old (combined app) | New (provider repo) |
|--------------------|---------------------|
| `/provider/home` | `/(tabs)/home` |
| `/provider/jobs` | `/(tabs)/jobs` |
| `/provider/wallet` | `/(tabs)/wallet` |
| `/provider/quotations` | `/(tabs)/quotations` |
| `/provider/profile` | `/(tabs)/profile` |

Search the repo for `'/provider/` and replace any remaining navigation strings.

### Push notifications (`app/_layout.tsx`)

For job-related notification types, navigate to:

```ts
router.push({ pathname: '/ProviderJobDetailsScreen', params: { requestId: String(data.requestId) } });
```

**Never** open `OngoingJobDetails` (client screen).

### Auth API

- Login: `POST /api/provider/login` via `providerService.login()` in `services/api/provider.ts`
- Token storage: `authService` in `services/authService.ts` (SecureStore)
- Logout: clear tokens → `ProviderSignInScreen`

---

## 7. Cleanup checklist (Cursor must do)

- [ ] Delete folder `app/provider/` if it exists (duplicate of tabs).
- [ ] Remove `RoleSwitchButton` imports and any “switch to client” UI.
- [ ] Remove `useAuthRole` redirects to client home in tab layout.
- [ ] Fix `tsconfig.json` paths to `@/*` → `./*` only.
- [ ] Replace monorepo `metro.config.js` with standalone version (§4.2).
- [ ] Update `tailwind.config.js` content paths (§4.3).
- [ ] Fix `app/_layout.tsx` import: `import { QueryProvider } from '@/providers/QueryProvider'`.
- [ ] Fix font requires in `_layout.tsx`: `require('../assets/fonts/...')`.
- [ ] Grep for `../../packages/shared` — must be zero results.
- [ ] Grep for `OngoingJobDetails`, `LoginScreen`, `/(tabs)/categories` — must not be used as provider navigation targets.
- [ ] Run `npx tsc --noEmit` and fix errors.
- [ ] Run `npx expo start -c` and verify tabs + ProviderSignIn work.

---

## 8. Git + EAS (build & submit)

### New Git repo

```bash
cd ghands-provider
git init
git add .
git commit -m "Initial GHands Provider app split from GHands monorepo"
git remote add origin <your-new-github-repo-url>
git push -u origin main
```

### EAS (new project — required)

```bash
npm install -g eas-cli
eas login
cd ghands-provider
eas init
# Choose: Create new project → name e.g. ghands-provider
```

Copy the new **project ID** into `app.config.js` → `extra.eas.projectId`.

### Build

```bash
eas build -p ios --profile production
eas build -p android --profile production
```

### Submit

```bash
eas submit -p ios --latest
eas submit -p android --latest
```

### App Store Connect / Play Console

- **New app listing** (separate from GHands client).
- Display name: **GHands Provider**
- Bundle ID / package: `com.bendee.GHandsProvider`
- Screenshots and description for **service providers**, not homeowners.

---

## 9. Backend (unchanged)

Same API as client app:

- Base URL: `https://bamibuildit-backend-v1.onrender.com` (or `EXPO_PUBLIC_API_URL`)
- Provider auth: `/api/provider/login`, `/api/provider/signup`
- Jobs: `/api/provider/requests`, `/api/provider/requests/:id/request-visit`, etc.

Client app is a **separate install**; provider tokens are not interchangeable unless the backend uses the same account (usually separate provider company accounts).

---

## 10. CURSOR MASTER PROMPT (copy everything below into a new chat)

```
You are setting up GHands Provider, a standalone Expo SDK 54 + expo-router app in a NEW git repository.

CONTEXT:
- This was split from the GHands monorepo (client app + provider app combined).
- I copied apps/provider + shared folders (components, hooks, lib, services, utils, providers, data) into this repo root.
- This repo is ONLY for service providers. There is NO client role and NO "switch to client" feature.

YOUR TASKS (in order):
1. Delete the legacy route folder `app/provider/` if present. Main tabs must live in `app/(tabs)/` only.
2. Ensure tsconfig paths are `"@/*": ["./*"]` — not monorepo shared paths.
3. Replace metro.config.js with standalone NativeWind config (input: ./global.css).
4. Fix tailwind content paths to ./app, ./components, ./hooks, ./lib.
5. Grep and replace all navigation paths: `/provider/home` → `/(tabs)/home`, same for jobs, wallet, quotations, profile.
6. Remove RoleSwitchButton, client-only screens references, and provider→client redirects in (tabs)/_layout.tsx.
7. Verify app/index.tsx: token → (tabs)/home, no token → ProviderSignInScreen, role always provider.
8. Verify app.config.js: name "GHands Provider", bundle com.bendee.GHandsProvider, scheme ghands-provider, extra.appRole provider. Run eas init and set extra.eas.projectId.
9. Ensure package.json name is ghands-provider with full expo 54 dependencies; run npm install.
10. Run npx tsc --noEmit and fix all import/path errors.
11. Document any missing files I need to copy from the old repo.

CONSTRAINTS:
- Keep `@/components/provider/*` — that is UI components, NOT routes.
- Push notifications must open ProviderJobDetailsScreen, not OngoingJobDetails.
- API base: EXPO_PUBLIC_API_URL or https://bamibuildit-backend-v1.onrender.com

When done, give me: (1) folder tree, (2) commands for expo start, eas build, eas submit, (3) anything still broken.
```

---

## 11. What stays in the original GHands repo

- **Client app only** in `apps/client` (or root after you clean monorepo).
- Remove or archive `apps/provider` once the new repo is verified.
- Keep `packages/shared` for client; provider repo has its own copy of shared code (no symlink required unless you want a private npm package later).

---

## 12. Quick copy commands (from your machine)

Run from the **GHands monorepo root** after creating empty folder `../ghands-provider`:

```bash
NEW=../ghands-provider
mkdir -p "$NEW"

# Provider app shell
cp -R apps/provider/app apps/provider/assets apps/provider/*.js apps/provider/*.json apps/provider/global.css apps/provider/nativewind-env.d.ts "$NEW/" 2>/dev/null
cp apps/provider/postcss.config.js "$NEW/" 2>/dev/null

# Shared code at repo root
cp -R packages/shared/components packages/shared/hooks packages/shared/lib packages/shared/services packages/shared/utils packages/shared/providers packages/shared/data "$NEW/"

# Remove legacy duplicate routes
rm -rf "$NEW/app/provider"

cd "$NEW"
git init
npm install   # after adding package.json from §5
```

Then open `ghands-provider` in Cursor and paste **§10 CURSOR MASTER PROMPT**.

---

*Generated from GHands monorepo split — provider handoff.*
