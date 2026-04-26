import { VacationPeriod } from '../types';

export const calculateSubscriptionExpiryDate = (paymentHistory: any[], initialExpiryDate: string, vacationPeriods: VacationPeriod[]): Date => {
    const sortedPayments = [...(paymentHistory || [])]
        .filter(p => p.status === 'success')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedPayments.length > 0) {
        let expiry = calculateAdjustedExpiryDate(sortedPayments[0].date, vacationPeriods);
        for (let i = 1; i < sortedPayments.length; i++) {
            const paymentDate = new Date(sortedPayments[i].date);
            const baseDate = paymentDate > expiry ? sortedPayments[i].date : expiry.toISOString().split('T')[0];
            expiry = calculateAdjustedExpiryDate(baseDate, vacationPeriods);
        }
        return expiry;
    }
    return initialExpiryDate ? new Date(initialExpiryDate) : new Date();
};

export const calculateAdjustedExpiryDate = (paymentDateStr: string, vacationPeriods: VacationPeriod[]): Date => {
    const paymentDate = new Date(paymentDateStr);
    let expiryDate = new Date(paymentDate);
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    
    // Handle month overflow (e.g., Jan 31 -> Feb 28)
    if (expiryDate.getDate() !== paymentDate.getDate()) {
        expiryDate.setDate(0);
    }

    let previousExpiryDate = new Date(expiryDate);
    let iterations = 0;
    const MAX_ITERATIONS = 10; // Prevent infinite loops

    while (iterations < MAX_ITERATIONS) {
        let totalVacationDays = 0;
        
        for (const period of vacationPeriods) {
            const vacStart = new Date(period.startDate);
            const vacEnd = new Date(period.endDate);
            
            // Check intersection between [paymentDate, currentExpiry] and [vacStart, vacEnd]
            const start = vacStart > paymentDate ? vacStart : paymentDate;
            const end = vacEnd < expiryDate ? vacEnd : expiryDate;
            
            if (start <= end) {
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
                totalVacationDays += diffDays;
            }
        }

        const newExpiryDate = new Date(paymentDate);
        newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
        if (newExpiryDate.getDate() !== paymentDate.getDate()) {
            newExpiryDate.setDate(0);
        }
        newExpiryDate.setDate(newExpiryDate.getDate() + totalVacationDays);

        if (newExpiryDate.getTime() === previousExpiryDate.getTime()) {
            break;
        }

        previousExpiryDate = new Date(newExpiryDate);
        expiryDate = newExpiryDate;
        iterations++;
    }

    return expiryDate;
};
