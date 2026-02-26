
/**
 * Normalizes text for search purposes:
 * 1. Decomposes combined characters (NFD)
 * 2. Removes diacritical marks (regex)
 * 3. Converts to lowercase
 * 4. Trims whitespace
 */
export const normalizeText = (text: any): string => {
  if (text === null || text === undefined) return '';
  const str = String(text);
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

/**
 * Checks if all words in the search query are present in the target text, regardless of order.
 * Both inputs are normalized.
 * Example: query "puha petru" matches target "Puha Razvan Petru"
 */
export const smartSearch = (query: string, target: string | undefined | null): boolean => {
    if (!query) return true;
    if (!target) return false;

    const normalizedQuery = normalizeText(query);
    const normalizedTarget = normalizeText(target);

    // Split query into distinct words
    const queryParts = normalizedQuery.split(/\s+/).filter(Boolean);
    
    // Check if every part of the query exists in the target
    return queryParts.every(part => normalizedTarget.includes(part));
};
