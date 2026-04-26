
/**
 * Guesses gender based on Romanian name conventions.
 * Most female names in Romanian end in 'a'.
 * Exceptions (male names ending in 'a'): Luca, Mircea, Horia, Toma, Nicola, Isaia.
 */
export const guessGenderByName = (name: string): 'M' | 'F' => {
  if (!name) return 'M';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'M';

  // We usually look at the first name for gender
  // In Romania, the first name is often the first part, but sometimes people write Last Name First Name.
  // We'll check all parts, if any part ends in 'a' and is not in the exception list, it's likely female.
  
  const maleExceptions = [
    'luca', 'mircea', 'horia', 'toma', 'nicola', 'isaia', 'boma', 'attila', 'musa', 'sasha', 'mihnea', 'horea', 'minea', 'minnea'
  ];
  
  // Common Romanian surnames ending in 'a' that are NOT female first names
  const surnamesEndingInA = [
    'popa', 'oancea', 'gaina', 'manea', 'dragnea', 'rizea', 'hanta', 'mihalcea', 'olaru'
  ];

  // Common male names to override the 'a' rule
  const maleMarkers = [
    'bogdan', 'andrei', 'marius', 'adrian', 'ion', 'stefan', 'matei', 'liviu', 
    'razvan', 'constantin', 'victor', 'radu', 'teodor', 'cristian', 'florin', 
    'claudiu', 'robert', 'lucian', 'tudor', 'sergiu', 'mihai', 'paul', 'ionut', 
    'george', 'fabian', 'dragos', 'petru', 'georgian', 'valentin', 'alexandru',
    'iustinian', 'mihut', 'cosmin', 'gheorghe', 'vasile', 'ilie', 'nistor', 
    'matache', 'rizea', 'benetatos', 'scutelnicu', 'stanescu', 'georgescu', 
    'munteanu', 'muntean', 'vlase', 'nicolae', 'ene'
  ];

  const lowerParts = parts.map(p => p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

  // If any part is a known male name, it's a man
  if (lowerParts.some(part => maleMarkers.includes(part) || maleExceptions.includes(part))) {
    return 'M';
  }

  // Otherwise, check for the 'a' suffix
  for (const part of lowerParts) {
    if (part.endsWith('a')) {
      // If it ends in 'a' and isn't a known surname, it's likely female
      if (!surnamesEndingInA.includes(part)) {
        return 'F';
      }
    }
  }

  return 'M';
};

export const guessRoleByGender = (gender: 'M' | 'F' | string | undefined): 'Leader' | 'Follower' => {
  return gender === 'M' ? 'Leader' : 'Follower';
};
