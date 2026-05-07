/**
 * Calculate EAN-13 check digit
 */
export const calculateEAN13CheckDigit = (digits: string): number => {
	if (digits.length !== 12) return 0;
	
	let sum = 0;
	for (let i = 0; i < 12; i++) {
		const digit = parseInt(digits[i], 10);
		sum += (i % 2 === 0) ? digit : digit * 3;
	}
	
	const remainder = sum % 10;
	return remainder === 0 ? 0 : 10 - remainder;
};

/**
 * Validate EAN-13 check digit
 */
export const validateEAN13 = (ean: string): { isValid: boolean; correctEAN?: string; currentCheckDigit?: number; correctCheckDigit?: number } => {
	if (ean.length !== 13) {
		return { isValid: false };
	}
	
	const baseDigits = ean.slice(0, 12);
	const currentCheckDigit = parseInt(ean[12], 10);
	const correctCheckDigit = calculateEAN13CheckDigit(baseDigits);
	const isValid = currentCheckDigit === correctCheckDigit;
	
	return {
		isValid,
		correctEAN: isValid ? undefined : baseDigits + correctCheckDigit,
		currentCheckDigit,
		correctCheckDigit
	};
};

/**
 * Fix EAN check digit (returns corrected EAN)
 */
export const fixEANCheckDigit = (ean: string): string => {
	if (ean.length === 13) {
		const baseDigits = ean.slice(0, 12);
		const checkDigit = calculateEAN13CheckDigit(baseDigits);
		return baseDigits + checkDigit;
	} else if (ean.length < 12) {
		const baseDigits = ean.padStart(12, '0');
		const checkDigit = calculateEAN13CheckDigit(baseDigits);
		return baseDigits + checkDigit;
	} else if (ean.length === 12) {
		const checkDigit = calculateEAN13CheckDigit(ean);
		return ean + checkDigit;
	}
	return ean;
};

