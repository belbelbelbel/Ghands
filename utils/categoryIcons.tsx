import React from 'react';
import { Image, ImageSourcePropType, Text, View } from 'react-native';

import { Colors } from '@/lib/designSystem';

const ICON_SIZE = 40;

/** Metro requires static string literals for each image. */
const ASSETS = {
  applianceRepair: require('../assets/images/Category icons/Appliance repair.png'),
  automotive: require('../assets/images/Category icons/Automotive.png'),
  blindsInstallation: require('../assets/images/Category icons/Blinds installation.png'),
  borehole: require('../assets/images/Category icons/Borehole.png'),
  cctvCamera: require('../assets/images/Category icons/CCTV camera.png'),
  carpentry: require('../assets/images/Category icons/Carpentry.png'),
  cleaning: require('../assets/images/Category icons/Cleaning.png'),
  curtains: require('../assets/images/Category icons/Curtains.png'),
  electricity: require('../assets/images/Category icons/Electricity.png'),
  flooring: require('../assets/images/Category icons/Flooring.png'),
  gateFabrication: require('../assets/images/Category icons/Gate fabrication.png'),
  insulation: require('../assets/images/Category icons/Insulation.png'),
  mansory: require('../assets/images/Category icons/Mansory.png'),
  painting: require('../assets/images/Category icons/Painting.png'),
  pestControl: require('../assets/images/Category icons/Pest control.png'),
  plumbing: require('../assets/images/Category icons/Plumbing.png'),
  pool: require('../assets/images/Category icons/Pool.png'),
  roofing: require('../assets/images/Category icons/Roofing.png'),
  security: require('../assets/images/Category icons/Security.png'),
  solarInstallation: require('../assets/images/Category icons/Solar_Installation.png'),
  technician: require('../assets/images/Category icons/Technician.png'),
  tiling: require('../assets/images/Category icons/Tiling.png'),
  upholstery: require('../assets/images/Category icons/Upholstery.png'),
  wasteDisposal: require('../assets/images/Category icons/Waste_disposal.png'),
} as const;

/** Normalized file stems ↔ asset (exact match on full label). */
const STEM_ASSET_ENTRIES: { stem: string; source: ImageSourcePropType }[] = [
  { stem: 'appliance repair', source: ASSETS.applianceRepair },
  { stem: 'automotive', source: ASSETS.automotive },
  { stem: 'blinds installation', source: ASSETS.blindsInstallation },
  { stem: 'borehole', source: ASSETS.borehole },
  { stem: 'cctv camera', source: ASSETS.cctvCamera },
  { stem: 'carpentry', source: ASSETS.carpentry },
  { stem: 'cleaning', source: ASSETS.cleaning },
  { stem: 'curtains', source: ASSETS.curtains },
  { stem: 'electricity', source: ASSETS.electricity },
  { stem: 'flooring', source: ASSETS.flooring },
  { stem: 'gate fabrication', source: ASSETS.gateFabrication },
  { stem: 'insulation', source: ASSETS.insulation },
  { stem: 'mansory', source: ASSETS.mansory },
  { stem: 'masonry', source: ASSETS.mansory },
  { stem: 'painting', source: ASSETS.painting },
  { stem: 'pest control', source: ASSETS.pestControl },
  { stem: 'plumbing', source: ASSETS.plumbing },
  { stem: 'pool', source: ASSETS.pool },
  { stem: 'roofing', source: ASSETS.roofing },
  { stem: 'security', source: ASSETS.security },
  { stem: 'solar installation', source: ASSETS.solarInstallation },
  { stem: 'solar_installation', source: ASSETS.solarInstallation },
  { stem: 'technician', source: ASSETS.technician },
  { stem: 'tiling', source: ASSETS.tiling },
  { stem: 'upholstery', source: ASSETS.upholstery },
  { stem: 'waste disposal', source: ASSETS.wasteDisposal },
  { stem: 'waste_disposal', source: ASSETS.wasteDisposal },
];

/**
 * Phrases are checked in array order; longer / more specific phrases first.
 * Rule order matters: first match wins.
 */
const ICON_RULES: { source: ImageSourcePropType; phrases: string[] }[] = [
  {
    source: ASSETS.wasteDisposal,
    phrases: [
      'waste disposal',
      'waste management',
      'rubbish removal',
      'garbage disposal',
      'trash removal',
      'refuse',
      'septic',
      'landfill',
      'rubbish',
      'garbage',
      'trash',
      'waste',
    ],
  },
  {
    source: ASSETS.cctvCamera,
    phrases: [
      'cctv',
      'surveillance camera',
      'security camera',
      'ip camera',
      'dvr',
      'nvr',
    ],
  },
  {
    source: ASSETS.pestControl,
    phrases: [
      'pest control',
      'exterminat',
      'rodent',
      'termite',
      'fumigat',
      'insect',
      'cockroach',
      'rat ',
    ],
  },
  {
    source: ASSETS.solarInstallation,
    phrases: [
      'solar installation',
      'solar panel',
      'photovoltaic',
      'pv system',
      'solar power',
      'solar energy',
      'solar',
    ],
  },
  {
    source: ASSETS.gateFabrication,
    phrases: [
      'gate fabrication',
      'metal gate',
      'driveway gate',
      'security gate',
      'gate install',
      'gate repair',
      'welding gate',
      'gate',
    ],
  },
  {
    source: ASSETS.blindsInstallation,
    phrases: [
      'blinds installation',
      'window blinds',
      'venetian',
      'roller blind',
      'blinds',
      'shutter install',
    ],
  },
  {
    source: ASSETS.borehole,
    phrases: [
      'borehole',
      'water well',
      'well drilling',
      'drilling',
      'bore ',
    ],
  },
  {
    source: ASSETS.applianceRepair,
    phrases: [
      'appliance repair',
      'fridge repair',
      'refrigerator',
      'washing machine',
      'dishwasher',
      'oven repair',
      'appliance',
    ],
  },
  {
    source: ASSETS.pool,
    phrases: [
      'swimming pool',
      'pool maintenance',
      'pool cleaning',
      'pool',
    ],
  },
  {
    source: ASSETS.plumbing,
    phrases: [
      'plumbing',
      'plumber',
      'plumb',
      'pipework',
      'drainage',
      'drain ',
      'sewer',
      'leak repair',
      'toilet',
      'faucet',
      'tap ',
      'gutter',
      'water heater',
      'water tank',
      'water pipe',
    ],
  },
  {
    source: ASSETS.electricity,
    phrases: [
      'electricity',
      'electrical',
      'electrician',
      'electric',
      'wiring',
      'rewiring',
      'circuit',
      'lighting install',
      'power outlet',
      'generator',
    ],
  },
  {
    source: ASSETS.carpentry,
    phrases: [
      'carpentry',
      'carpenter',
      'woodwork',
      'cabinet',
      'furniture repair',
      'shelving',
      'decking',
    ],
  },
  {
    source: ASSETS.cleaning,
    phrases: [
      'house cleaning',
      'deep clean',
      'cleaning',
      'cleaner',
      'housekeep',
      'maid',
      'janitor',
      'sanitize',
    ],
  },
  {
    source: ASSETS.painting,
    phrases: [
      'painting',
      'painter',
      'paint job',
      'repaint',
      'wall paint',
    ],
  },
  {
    source: ASSETS.roofing,
    phrases: [
      'roofing',
      'roofer',
      'roof repair',
      'roof leak',
      'gutter install',
      'roof',
    ],
  },
  {
    source: ASSETS.tiling,
    phrases: [
      'tiling',
      'tile install',
      'ceramic tile',
      'porcelain',
      'grout',
      'tile',
    ],
  },
  {
    source: ASSETS.flooring,
    phrases: [
      'flooring',
      'floor install',
      'laminate',
      'hardwood',
      'vinyl floor',
      'floor ',
    ],
  },
  {
    source: ASSETS.insulation,
    phrases: [
      'insulation',
      'insulate',
      'thermal insulation',
      'ceiling insulation',
    ],
  },
  {
    source: ASSETS.mansory,
    phrases: [
      'masonry',
      'mansory',
      'brickwork',
      'brick layer',
      'stonework',
      'concrete wall',
      'blockwork',
    ],
  },
  {
    source: ASSETS.automotive,
    phrases: [
      'automotive',
      'auto repair',
      'car repair',
      'mechanic',
      'vehicle',
      'motor ',
      'car service',
      'car wash',
    ],
  },
  {
    source: ASSETS.security,
    phrases: [
      'security system',
      'alarm system',
      'access control',
      'burglar',
      'security',
      'armed response',
    ],
  },
  {
    source: ASSETS.technician,
    phrases: [
      'technician',
      'handyman',
      'general repair',
      'maintenance tech',
      'it support',
      'tech support',
    ],
  },
  {
    source: ASSETS.upholstery,
    phrases: [
      'upholstery',
      'reupholster',
      'sofa repair',
      'furniture fabric',
    ],
  },
  {
    source: ASSETS.curtains,
    phrases: [
      'curtains',
      'curtain install',
      'drapes',
      'drapery',
    ],
  },
];

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, '');
}

/** First letter of first word + first letter of last word; single word → one letter. */
export function getCategoryInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return '?';

  const words = trimmed.split(/\s+/).filter(Boolean);
  const letter = (word: string) => {
    const m = word.match(/[a-zA-Z0-9]/);
    return m ? m[0].toUpperCase() : '';
  };

  if (words.length === 1) {
    const one = letter(words[0]);
    return one || '?';
  }

  const a = letter(words[0]);
  const b = letter(words[words.length - 1]);
  const pair = `${a}${b}`.trim();
  return pair || '?';
}

/** Match backend label to a known file stem without substring false positives (e.g. pool ⊄ whirlpool). */
function stemMatchesHaystack(haystack: string, stem: string): boolean {
  if (!haystack || !stem) return false;
  if (haystack === stem) return true;
  if (stem.includes(' ')) {
    return haystack.includes(stem);
  }
  const tokens = haystack.split(/\s+/).filter(Boolean);
  return tokens.includes(stem);
}

function matchStemInText(normalizedFull: string): ImageSourcePropType | null {
  for (const { stem, source } of STEM_ASSET_ENTRIES) {
    if (stemMatchesHaystack(normalizedFull, stem)) return source;
  }
  return null;
}

function matchPhrase(haystack: string): ImageSourcePropType | null {
  for (const { source, phrases } of ICON_RULES) {
    for (const phrase of phrases) {
      if (haystack.includes(phrase)) return source;
    }
  }
  return null;
}

export function resolveCategoryImageSource(
  name?: string,
  displayName?: string,
  description?: string
): ImageSourcePropType | null {
  const parts = [name, displayName, description].filter(Boolean) as string[];
  if (parts.length === 0) return null;

  for (const part of parts) {
    const n = normalizeKey(part);
    if (n) {
      const stemHit = matchStemInText(n);
      if (stemHit) return stemHit;
    }
  }

  const combined = normalizeKey(parts.join(' '));
  if (combined) {
    const stemHit = matchStemInText(combined);
    if (stemHit) return stemHit;
  }

  if (!combined) return null;
  return matchPhrase(combined);
}

const CategoryInitialsAvatar = ({ label }: { label: string }) => {
  const initials = getCategoryInitials(label);
  return (
    <View
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: 10,
        backgroundColor: '#F0F7E6',
        borderWidth: 1,
        borderColor: '#E0ECC8',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: initials.length > 1 ? 14 : 16,
          fontFamily: 'Poppins-SemiBold',
          color: Colors.accent,
          letterSpacing: -0.3,
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

const CategoryRasterIcon = ({ source }: { source: ImageSourcePropType }) => (
  <Image
    source={source}
    style={{ width: ICON_SIZE, height: ICON_SIZE }}
    resizeMode="contain"
  />
);

/**
 * Maps API category fields to a bundled category image when possible; otherwise initials (design-aligned).
 */
export const getCategoryIcon = (
  name?: string,
  displayName?: string,
  description?: string
): React.ComponentType => {
  const labelForInitials = (displayName || name || 'Service').trim() || 'Service';
  const source = resolveCategoryImageSource(name, displayName, description);

  if (source) {
    const Raster = () => <CategoryRasterIcon source={source} />;
    return Raster;
  }

  const Initials = () => <CategoryInitialsAvatar label={labelForInitials} />;
  return Initials;
};
