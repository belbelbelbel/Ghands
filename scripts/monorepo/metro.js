const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/**
 * Metro config for apps/client and apps/provider in the GHands monorepo.
 */
function createMetroConfig(projectRoot) {
  const monorepoRoot = path.resolve(projectRoot, '../..');

  const config = getDefaultConfig(projectRoot);

  config.watchFolders = [monorepoRoot];
  config.resolver.disableHierarchicalLookup = true;
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
  ];

  return withNativeWind(config, {
    input: path.join(projectRoot, 'global.css'),
  });
}

module.exports = { createMetroConfig };
