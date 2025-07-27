// Avenue mapping configuration for different years
// Maps theme names to traditional avenue letters

const avenueMappings = {
  2024: {
    // Wonder/amazement themed names
    nameToLetter: {
      'Agog': 'A',
      'Baffle': 'B',
      'Captivate': 'C',
      'Delight': 'D',
      'Enchant': 'E',
      'Fascinate': 'F',
      'Gobsmack': 'G',
      'Hypnotic': 'H',
      'Intriguing': 'I',
      'Jabberwock': 'J',
      'Kelter': 'K',
      'Route 66': 'L',
      'Esplanade': 'Esplanade'
    },
    letterToName: {
      'A': 'Agog',
      'B': 'Baffle',
      'C': 'Captivate',
      'D': 'Delight',
      'E': 'Enchant',
      'F': 'Fascinate',
      'G': 'Gobsmack',
      'H': 'Hypnotic',
      'I': 'Intriguing',
      'J': 'Jabberwock',
      'K': 'Kelter',
      'L': 'Route 66',
      'Esplanade': 'Esplanade'
    },
    // Accurate distances from 2024 GIS analysis (in feet)
    avenueDistances: {
      'Esplanade': 2600,
      'A': 3037,
      'B': 3316,
      'C': 3596,
      'D': 3876,
      'E': 4156,
      'F': 4436,
      'G': 4716,
      'H': 4996,
      'I': 5276,
      'J': 5556,
      'K': 5836,
      'L': 6116
    }
  },
  2025: {
    // Sci-fi author themed names
    nameToLetter: {
      'Atwood': 'A',
      'Bradbury': 'B',
      'Cherryh': 'C',
      'Dick': 'D',
      'Ellison': 'E',
      'Farmer': 'F',
      'Gibson': 'G',
      'Herbert': 'H',
      'Ishiguro': 'I',
      'Jemison': 'J',
      'Kilgore': 'K',
      'Esplanade': 'Esplanade'
    },
    letterToName: {
      'A': 'Atwood',
      'B': 'Bradbury',
      'C': 'Cherryh',
      'D': 'Dick',
      'E': 'Ellison',
      'F': 'Farmer',
      'G': 'Gibson',
      'H': 'Herbert',
      'I': 'Ishiguro',
      'J': 'Jemison',
      'K': 'Kilgore',
      'Esplanade': 'Esplanade'
    },
    // Accurate distances from 2025 GIS analysis
    avenueDistances: {
      'Esplanade': 2471,
      'A': 2937,
      'B': 3217,
      'C': 3497,
      'D': 3777,
      'E': 4062,
      'F': 4548,
      'G': 4828,
      'H': 5108,
      'I': 5388,
      'J': 5568,
      'K': 5758
      // Note: L avenue not present in 2025 GIS data
    }
  }
};

// Get avenue theme name from letter for a specific year
export function getAvenueNameFromLetter(letter, year) {
  const mapping = avenueMappings[year];
  if (!mapping) {
    console.warn(`No avenue mapping found for year ${year}`);
    return letter;
  }
  return mapping.letterToName[letter] || letter;
}

// Get avenue letter from theme name for a specific year
export function getAvenueLetterFromName(name, year) {
  const mapping = avenueMappings[year];
  if (!mapping) {
    console.warn(`No avenue mapping found for year ${year}`);
    return name;
  }
  return mapping.nameToLetter[name] || name;
}

// Get accurate distance for an avenue
export function getAvenueDistance(avenue, year) {
  const mapping = avenueMappings[year];
  if (!mapping || !mapping.avenueDistances) {
    console.warn(`No avenue distances found for year ${year}`);
    return null;
  }
  
  // Check if input is a letter or name
  let letter = avenue;
  if (mapping.nameToLetter[avenue]) {
    letter = mapping.nameToLetter[avenue];
  }
  
  return mapping.avenueDistances[letter] || null;
}

// Get all avenue letters for a year
export function getAvenueLetters(year) {
  const mapping = avenueMappings[year];
  if (!mapping) {
    return ['Esplanade', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  }
  return Object.keys(mapping.letterToName);
}

// Get all avenue theme names for a year
export function getAvenueNames(year) {
  const mapping = avenueMappings[year];
  if (!mapping) {
    return [];
  }
  return Object.keys(mapping.nameToLetter);
}

// Check if a string is an avenue (letter or theme name)
export function isAvenue(str, year) {
  if (!str) return false;
  const mapping = avenueMappings[year];
  if (!mapping) return false;
  
  return !!(mapping.letterToName[str] || mapping.nameToLetter[str]);
}

// Export the full mapping for direct access if needed
export { avenueMappings };