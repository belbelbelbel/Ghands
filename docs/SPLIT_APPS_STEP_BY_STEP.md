# GHands split — step by step

Two **separate apps**, two **separate onboardings**. No “Switch to client” or “Switch to provider” in either app.

---

## Onboarding (they are different)

### Client app only

| Step | Screen | File |
|------|--------|------|
| 1 | Client onboarding slides | `app/onboarding.tsx` |
| 2 | Client type (individual / business) | `app/ClientTypeSelectionScreen.tsx` |
| 3 | Sign up / log in | `app/SignupScreen.tsx`, `app/LoginScreen.tsx` |
| 4 | Profile / location setup | `app/ProfileSetupScreen.tsx`, etc. |
| 5 | Main app | `app/(tabs)/home` |

**Do not include** in the client repo: `provider-onboarding.tsx`, `ProviderSplashScreen`, `ProviderSignInScreen`, `SelectAccountTypeScreen` (pick client vs provider).

Client entry (`app/index.tsx`): after onboarding → `LoginScreen` or `(tabs)/home` if logged in.

### Provider app only

| Step | Screen | File |
|------|--------|------|
| 1 | Provider splash (optional) | `app/ProviderSplashScreen.tsx` |
| 2 | Provider onboarding slides | `app/provider-onboarding.tsx` |
| 3 | Provider type | `app/ProviderTypeSelectionScreen.tsx` |
| 4 | Sign up / log in | `app/ProviderSignUpScreen.tsx`, `app/ProviderSignInScreen.tsx` |
| 5 | Profile, documents, bank | `app/ProviderProfileSetupScreen.tsx`, upload/verify screens |
| 6 | Main app | `app/(tabs)/home` |

**Do not include** in the provider repo: `app/onboarding.tsx` (client slides), `LoginScreen`, `SelectAccountTypeScreen`.

Provider entry (`app/index.tsx`): logged in → `(tabs)/home`, else → `ProviderSignInScreen`.

---

## Part A — Work in GHands repo today

### 1. Stop using the old combined app at repo root

```bash
# Wrong (legacy combined app):
npx expo start -c

# Right — client:
npm run client
# or
cd apps/client && npx expo start -c

# Right — provider:
npm run provider
# or
cd apps/provider && npx expo start -c
```

### 2. Confirm role-switch UI is gone

Reload the app (press `r` in Metro). Provider home should **not** show “Switch to client”. Client profile should **not** show “Switch to provider”.

### 3. Verify structure

```bash
npm run verify:client
npm run verify:provider
```

---

## Part B — Create the new Provider Git repo

### 1. Create empty repo on GitHub

Example name: `ghands-provider`.

### 2. Copy files (automated)

From GHands repo root:

```bash
./scripts/copy-provider-new-repo.sh ../ghands-provider
```

This copies:

- `apps/provider` → app shell + assets  
- `packages/shared` → components, services, hooks, etc.  
- Deletes `app/provider/` (legacy routes)  
- Writes `metro.config.js`, `tsconfig.json`, `package.json` template  

### 3. Install and verify

```bash
cd ../ghands-provider
npm install
node scripts/verify-expo-setup.mjs .
npx expo start -c
```

### 4. Open in Cursor and paste the master prompt

Open `docs/PROVIDER_NEW_REPO_CURSOR_PROMPT.md` from the **GHands** repo (or copy it into the new repo as `CURSOR_SETUP.md`).

Paste **section 10 (CURSOR MASTER PROMPT)** into a new Cursor chat in the **provider** repo.

Cursor should:

- Remove any leftover `app/provider/` routes  
- Fix navigation to `/(tabs)/home`, not `/provider/home`  
- Keep **provider onboarding only** (`provider-onboarding`, not client `onboarding.tsx`)  
- Set `eas init` and update `app.config.js` project id  

### 5. EAS build & submit (provider)

```bash
cd ghands-provider
eas login
eas init                    # NEW project — not the client project id
eas build -p ios --profile production
eas submit -p ios --latest
```

Use bundle id: `com.bendee.GHandsProvider`.

---

## Part C — Client app (this repo)

Keep developing the **client** in:

- `apps/client` (monorepo), or  
- Eventually only root `app/` if you still use legacy root — prefer `apps/client`.

EAS / App Store: existing **GHands** app, `com.bendee.GHands`.

```bash
cd apps/client
eas build -p ios --profile production
```

---

## Part D — Checklist before you ship

| Check | Client app | Provider app |
|-------|------------|--------------|
| No “Switch to …” button | ✓ | ✓ |
| Own bundle id | `com.bendee.GHands` | `com.bendee.GHandsProvider` |
| Own EAS project | existing | **new** `eas init` |
| Own onboarding flow | `onboarding.tsx` | `provider-onboarding.tsx` |
| Entry login | `LoginScreen` | `ProviderSignInScreen` |
| `package.json` has `"main": "expo-router/entry"` | ✓ | ✓ |

---

## If Cursor in the new provider repo needs one sentence

> This is **GHands Provider only**. Use provider onboarding (`provider-onboarding.tsx` → `ProviderSignInScreen` → `(tabs)/home`). Remove all client onboarding, `SelectAccountTypeScreen`, and any role-switch UI. Client app is a separate repository.

---

## Quick reference

| Doc | Purpose |
|-----|---------|
| `docs/SPLIT_APPS_STEP_BY_STEP.md` | This file |
| `docs/PROVIDER_NEW_REPO_CURSOR_PROMPT.md` | Full Cursor handoff + copy commands |
| `MONOREPO.md` | Run client/provider in monorepo |
| `scripts/copy-provider-new-repo.sh` | One-command copy to new repo |
