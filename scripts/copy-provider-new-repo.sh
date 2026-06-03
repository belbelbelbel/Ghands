#!/usr/bin/env bash
# Copy GHands Provider app into a new standalone repo.
# NOTE: apps/provider was removed from GHands — use your ghands-provider clone or git history.
# Usage: ./scripts/copy-provider-new-repo.sh /path/to/ghands-provider
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-}"

if [[ -z "$DEST" ]]; then
  echo "Usage: $0 /path/to/ghands-provider"
  exit 1
fi

mkdir -p "$DEST"

echo "→ Provider app was moved to a separate repo."
echo "  This script expects apps/provider/ — restore from backup or use your ghands-provider clone."
if [[ ! -d "$SRC/apps/provider" ]]; then
  echo "Error: $SRC/apps/provider not found (already removed from GHands)."
  exit 1
fi
cp -R "$SRC/apps/provider/app" "$SRC/apps/provider/assets" "$DEST/"
cp "$SRC/apps/provider/app.config.js" \
   "$SRC/apps/provider/babel.config.js" \
   "$SRC/apps/provider/tailwind.config.js" \
   "$SRC/apps/provider/global.css" \
   "$SRC/apps/provider/nativewind-env.d.ts" \
   "$SRC/apps/provider/eas.json" \
   "$DEST/" 2>/dev/null || true
[[ -f "$SRC/apps/provider/postcss.config.js" ]] && cp "$SRC/apps/provider/postcss.config.js" "$DEST/"

echo "→ Copying shared code from repo root..."
for dir in components hooks lib services utils providers data; do
  if [[ -d "$SRC/$dir" ]]; then
    cp -R "$SRC/$dir" "$DEST/"
  fi
done

echo "→ Removing legacy app/provider routes (tabs are in app/(tabs)/)..."
rm -rf "$DEST/app/provider"

echo "→ Writing standalone metro.config.js..."
cat > "$DEST/metro.config.js" <<'METRO'
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
METRO

echo "→ Writing tsconfig.json..."
cat > "$DEST/tsconfig.json" <<'TS'
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
TS

if [[ ! -f "$DEST/package.json" ]]; then
  echo "→ Copying package template..."
  cp "$SRC/docs/templates/provider-package.json" "$DEST/package.json"
fi

mkdir -p "$DEST/scripts"
cp "$SRC/scripts/verify-expo-setup.mjs" "$DEST/scripts/"

echo "→ Verifying structure..."
node "$SRC/scripts/verify-expo-setup.mjs" "$DEST"

echo ""
echo "Done. Next steps:"
echo "  cd $DEST"
echo "  npm install"
echo "  npx expo start -c"
echo "  eas init   # new EAS project for provider"
echo ""
echo "Paste docs/PROVIDER_NEW_REPO_CURSOR_PROMPT.md into Cursor for remaining fixes."
