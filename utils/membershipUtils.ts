import { StudentDetailedProfile } from '../types';

export type MembershipStatus = 'ACTIVE' | 'RESTANT' | 'INACTIV' | 'ARHIVAT';

export const getMembershipStatus = (student: StudentDetailedProfile, today: Date = new Date()): MembershipStatus => {
    if (!student.subscription?.expiryDate) return 'ARHIVAT';
    
    const expiryDate = new Date(student.subscription.expiryDate);
    // Normalize to start of day for comparison
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const expiryNormalized = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
    
    const diffTime = todayNormalized.getTime() - expiryNormalized.getTime();
    const expirationDays = Math.floor(diffTime / (1000 * 3600 * 24));

    if (expiryNormalized >= todayNormalized) {
        return 'ACTIVE';
    } else if (expirationDays <= 14) {
        return 'RESTANT';
    } else if (expirationDays <= 45) {
        return 'INACTIV';
    } else {
        return 'ARHIVAT';
    }
};
