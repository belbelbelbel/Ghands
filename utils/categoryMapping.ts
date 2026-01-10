/**
 * Maps display names or common variations to API category names
 * API expects exact category names like "plumbing", "electrical", etc.
 */

/**
 * Maps a display name or variation to the API category name
 * @param displayName - The display name or variation (e.g., "Plumber", "Plumbing Service", "plumbing")
 * @returns The API category name (e.g., "plumbing") or the original if already valid
 */
export const normalizeCategoryName = (displayName: string): string => {
  if (!displayName || typeof displayName !== 'string') {
    return '';
  }

  // Convert to lowercase and trim
  const normalized = displayName.toLowerCase().trim();

  // Mapping of common variations to API category names
  // Based on API_ENDPOINTS_DOCUMENTATION.txt - VALID CATEGORY NAMES (38 total)
  const categoryMapping: { [key: string]: string } = {
    // Plumbing variations
    'plumber': 'plumbing',
    'plumbing service': 'plumbing',
    'plumbing': 'plumbing',
    
    // Electrical variations
    'electrician': 'electrical',
    'electrical service': 'electrical',
    'electrical': 'electrical',
    'electric': 'electrical',
    
    // Carpentry variations
    'carpenter': 'carpentry',
    'carpentry service': 'carpentry',
    'carpentry': 'carpentry',
    
    // Painting variations
    'painter': 'painting',
    'painting service': 'painting',
    'painting': 'painting',
    
    // Masonry
    'mason': 'masonry',
    'masonry': 'masonry',
    
    // Tiling
    'tiler': 'tiling',
    'tiling': 'tiling',
    'tile': 'tiling',
    
    // Flooring
    'flooring': 'flooring',
    'floor': 'flooring',
    
    // Roofing
    'roofer': 'roofing',
    'roofing': 'roofing',
    'roof': 'roofing',
    
    // Fencing
    'fence': 'fencing',
    'fencing': 'fencing',
    
    // Landscaping
    'landscaper': 'landscaping',
    'landscaping': 'landscaping',
    'landscape': 'landscaping',
    
    // Welding
    'welder': 'welding',
    'welding': 'welding',
    
    // Air Conditioning
    'air conditioning': 'airConditioning',
    'airconditioning': 'airConditioning',
    'ac': 'airConditioning',
    'ac repair': 'airConditioning',
    'air conditioning repair': 'airConditioning',
    
    // Generator Repair
    'generator repair': 'generatorRepair',
    'generator': 'generatorRepair',
    
    // Cleaning
    'cleaner': 'cleaning',
    'cleaning service': 'cleaning',
    'cleaning': 'cleaning',
    'housekeeping': 'cleaning',
    'maid': 'cleaning',
    
    // Mechanic
    'mechanic': 'mechanicRepair',
    'mechanic repair': 'mechanicRepair',
    'auto repair': 'mechanicRepair',
    'car repair': 'mechanicRepair',
    'vehicle repair': 'mechanicRepair',
    
    // Gardening
    'gardener': 'gardening',
    'gardening': 'gardening',
    'garden': 'gardening',
    
    // Pest Control
    'pest control': 'pestControl',
    'pest': 'pestControl',
    
    // Glass Work
    'glass work': 'glassWork',
    'glass': 'glassWork',
    'glazier': 'glassWork',
    
    // Aluminum Fabrication
    'aluminum fabrication': 'aluminumFabrication',
    'aluminum': 'aluminumFabrication',
    
    // Water Treatment
    'water treatment': 'waterTreatment',
    'water': 'waterTreatment',
    
    // CCTV Installation
    'cctv installation': 'cctvInstallation',
    'cctv': 'cctvInstallation',
    'security camera': 'cctvInstallation',
    
    // Security
    'security': 'security',
    'security service': 'security',
    
    // Gate Fabrication
    'gate fabrication': 'gateFabrication',
    'gate': 'gateFabrication',
    
    // Borehole Drilling
    'borehole drilling': 'boreholeDrilling',
    'borehole': 'boreholeDrilling',
    'well drilling': 'boreholeDrilling',
    
    // Scaffolding
    'scaffolding': 'scaffolding',
    'scaffold': 'scaffolding',
    
    // Pool Construction
    'pool construction': 'poolConstruction',
    'pool': 'poolConstruction',
    'swimming pool': 'poolConstruction',
    
    // Solar Installation
    'solar installation': 'solarInstallation',
    'solar': 'solarInstallation',
    'solar panel': 'solarInstallation',
    
    // Upholstery
    'upholstery': 'upholstery',
    'upholsterer': 'upholstery',
    
    // Door Installation
    'door installation': 'doorInstallation',
    'door': 'doorInstallation',
    
    // Window Installation
    'window installation': 'windowInstallation',
    'window': 'windowInstallation',
    
    // Interlocking Paving
    'interlocking paving': 'interlockingPaving',
    'paving': 'interlockingPaving',
    'interlock': 'interlockingPaving',
    
    // Metal Work
    'metal work': 'metalWork',
    'metalwork': 'metalWork',
    'metal': 'metalWork',
    
    // Waste Disposal
    'waste disposal': 'wasteDisposal',
    'waste': 'wasteDisposal',
    'garbage': 'wasteDisposal',
    
    // Water Proofing
    'water proofing': 'waterProofing',
    'waterproofing': 'waterProofing',
    'waterproof': 'waterProofing',
    
    // Pest Fumigation
    'pest fumigation': 'pestFumigation',
    'fumigation': 'pestFumigation',
    
    // Appliance Repair
    'appliance repair': 'applianceRepair',
    'appliance': 'applianceRepair',
    
    // Curtain Installation
    'curtain installation': 'curtainInstallation',
    'curtain': 'curtainInstallation',
    
    // Blinds Installation
    'blinds installation': 'blindsInstallation',
    'blinds': 'blindsInstallation',
    'blind': 'blindsInstallation',
    
    // Glass Installation
    'glass installation': 'glassInstallation',
    
    // Insulation
    'insulation': 'insulation',
    'insulate': 'insulation',
    
    // POP Ceiling
    'pop ceiling': 'popCeiling',
    'pop': 'popCeiling',
    'ceiling': 'popCeiling',
    
    // Fridge Repair
    'fridge repair': 'fridgeRepair',
    'refrigerator repair': 'fridgeRepair',
    'fridge': 'fridgeRepair',
  };

  // First, try exact match in mapping
  if (categoryMapping[normalized]) {
    return categoryMapping[normalized];
  }

  // Try removing "service" suffix and matching again
  const withoutService = normalized.replace(/\s+service$/, '').trim();
  if (categoryMapping[withoutService]) {
    return categoryMapping[withoutService];
  }

  // Try removing common suffixes like "-er", "-ian", "-ist" and matching
  const withoutSuffix = withoutService.replace(/(er|ian|ist|ing)$/, '').trim();
  if (categoryMapping[withoutSuffix]) {
    return categoryMapping[withoutSuffix];
  }

  // If no mapping found, check if it's already a valid API category name
  // Valid API category names from documentation (exact format expected by API)
  const validCategoryNames = [
    'plumbing', 'electrical', 'carpentry', 'painting', 'masonry', 'tiling', 'flooring', 'roofing',
    'fencing', 'landscaping', 'welding', 'airConditioning', 'generatorRepair',
    'aluminumFabrication', 'glassWork', 'gardening', 'pestControl', 'cleaning',
    'fridgeRepair', 'waterTreatment', 'popCeiling', 'cctvInstallation', 'security',
    'gateFabrication', 'boreholeDrilling', 'scaffolding', 'poolConstruction',
    'solarInstallation', 'upholstery', 'doorInstallation', 'windowInstallation',
    'interlockingPaving', 'metalWork', 'wasteDisposal', 'waterProofing',
    'pestFumigation', 'applianceRepair', 'curtainInstallation', 'blindsInstallation',
    'glassInstallation', 'insulation', 'mechanicRepair'
  ];

  // Normalize for comparison (remove spaces, handle camelCase)
  const normalizedForComparison = normalized.replace(/\s+/g, '');
  
  // Check if it matches any valid category (case-insensitive, no spaces)
  for (const validName of validCategoryNames) {
    if (normalizedForComparison.toLowerCase() === validName.toLowerCase()) {
      return validName; // Return exact API format (preserving camelCase)
    }
  }

  // If still no match, return the original normalized string
  // (might be a valid category name we haven't mapped yet)
  return normalized.replace(/\s+/g, '');
};

/**
 * Validates if a category name is a valid API category name
 */
export const isValidCategoryName = (categoryName: string): boolean => {
  if (!categoryName) return false;
  
  const normalized = normalizeCategoryName(categoryName);
  const validCategoryNames = [
    'plumbing', 'electrical', 'carpentry', 'painting', 'masonry', 'tiling', 'flooring', 'roofing',
    'fencing', 'landscaping', 'welding', 'airConditioning', 'generatorRepair',
    'aluminumFabrication', 'glassWork', 'gardening', 'pestControl', 'cleaning',
    'fridgeRepair', 'waterTreatment', 'popCeiling', 'cctvInstallation', 'security',
    'gateFabrication', 'boreholeDrilling', 'scaffolding', 'poolConstruction',
    'solarInstallation', 'upholstery', 'doorInstallation', 'windowInstallation',
    'interlockingPaving', 'metalWork', 'wasteDisposal', 'waterProofing',
    'pestFumigation', 'applianceRepair', 'curtainInstallation', 'blindsInstallation',
    'glassInstallation', 'insulation', 'mechanicRepair'
  ];
  
  const normalizedForComparison = normalized.replace(/\s+/g, '');
  return validCategoryNames.some(name => normalizedForComparison.toLowerCase() === name.toLowerCase());
};
