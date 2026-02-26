
/**
 * Normalizes a Romanian phone number to E.164 format (+40...).
 * 
 * Rules:
 * - Strips all non-digit characters (except preserving leading + logic).
 * - 07xx... (10 digits) -> +407xx...
 * - 7xx... (9 digits) -> +407xx...
 * - 0040... -> +40...
 * - 40... (11 digits) -> +40...
 * 
 * @param input The raw input string
 * @returns The normalized string if a pattern is matched, otherwise the trimmed original input.
 */
export const normalizeRoPhone = (input: string | undefined | null): string => {
    if (!input) return '';
    
    // Remove spaces, dashes, parentheses
    const raw = input.toString().trim();
    const clean = raw.replace(/[\s\-\(\)\.]/g, '');
    
    // Extract digits only
    let digits = clean.replace(/\D/g, '');

    // Handle '00' prefix (international) -> treat as nothing (we want to detect 40)
    if (digits.startsWith('00')) {
        digits = digits.substring(2);
    }

    // Rule 1: Starts with 40 and has 11 digits (e.g. 40723123456)
    if (digits.startsWith('40') && digits.length === 11) {
        return `+${digits}`;
    }

    // Rule 2: Starts with 0 and has 10 digits (e.g. 0723123456)
    if (digits.startsWith('0') && digits.length === 10) {
        return `+40${digits.substring(1)}`;
    }

    // Rule 3: Starts with 7 and has 9 digits (e.g. 723123456) -> Assume RO Mobile
    if (digits.startsWith('7') && digits.length === 9) {
        return `+40${digits}`;
    }

    // Fallback: If it doesn't match RO rules, return the raw trimmed input
    // This ensures we don't corrupt international numbers that don't match RO patterns
    // or incomplete numbers that the user is still editing (though this runs on blur).
    return raw;
};

/**
 * Validates if a string matches the normalized Romanian E.164 format.
 */
export const isValidRoPhone = (phone: string): boolean => {
    return /^\+40[0-9]{9}$/.test(phone);
};
