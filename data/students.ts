import { StudentDetailedProfile, DanceStyle, SkillLevel } from '../types';

const BASE_STUDENTS: StudentDetailedProfile[] = [
    // --- SPECIAL STATUS: ANULAT (Active but AutoPay False) ---
    {
        id: 's_spec_1',
        name: 'Carmen-Andrea Baboi',
        avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        email: 'carmen.baboi@gmail.com',
        phone: '0722 000 001',
        age: 29,
        gender: 'F',
        role: 'student',
        enrollments: [{ style: DanceStyle.BACHATA, level: SkillLevel.INTERMEDIATE, groupId: 'g_bachata_int_mon', groupName: 'Bachata Intermediari Luni' }],
        favoriteStyle: DanceStyle.BACHATA,
        goal: 'Hobby',
        joinDate: '2023-01-15',
        mainGroup: 'Bachata Intermediari Luni',
        status: 'active',
        subscription: { type: 'Silver', planId: 'silver', expiryDate: '2024-11-28', sessionsTotal: 8, sessionsLeft: 4, socialPartiesUsed: 1, active: true, autoPayEnabled: false },
        kpi: { lastAttendanceDays: 3, consecutiveAbsences: 0, paymentStatus: 'paid', retentionRate: 85, engagementScore: 80, hasFeedback: false },
        risk: { level: 'low' },
        stats: { streakWeeks: 3, totalClasses: 24, hoursDanced: 24, points: 240 },
        achievements: [],
        personalVideos: [],
        attendedClasses: [],
        preferences: { notificationsEnabled: true, reminderMinutes: 60 },
        feedbackHistory: [],
        attendanceHistory: [],
        paymentHistory: [],
        photos: []
    },
    {
        id: 's_spec_2',
        name: 'Razvan Cucos',
        avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
        email: 'razvan.cucos@yahoo.com',
        phone: '0722 000 002',
        age: 32,
        gender: 'M',
        role: 'student',
        enrollments: [{ style: DanceStyle.SALSA, level: SkillLevel.INTERMEDIATE, groupId: 'g_salsa_int_tue', groupName: 'Salsa Intermediari Marți' }],
        favoriteStyle: DanceStyle.SALSA,
        goal: 'Performanță',
        joinDate: '2022-06-10',
        mainGroup: 'Salsa Intermediari Marți',
        status: 'active',
        subscription: { type: 'Gold', planId: 'gold', expiryDate: '2024-12-05', sessionsTotal: 12, sessionsLeft: 8, socialPartiesUsed: 2, active: true, autoPayEnabled: false },
        kpi: { lastAttendanceDays: 1, consecutiveAbsences: 0, paymentStatus: 'paid', retentionRate: 92, engagementScore: 90, hasFeedback: true },
        risk: { level: 'low' },
        stats: { streakWeeks: 10, totalClasses: 80, hoursDanced: 90, points: 900 },
        achievements: [],
        personalVideos: [],
        attendedClasses: [],
        preferences: { notificationsEnabled: true, reminderMinutes: 30 },
        feedbackHistory: [],
        attendanceHistory: [],
        paymentHistory: [],
        photos: []
    },
    {
        id: 's_spec_3',
        name: 'Selena Rost',
        avatarUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
        email: 'selena.rost@gmail.com',
        phone: '0722 000 003',
        age: 26,
        gender: 'F',
        role: 'student',
        enrollments: [{ style: DanceStyle.KIZOMBA, level: SkillLevel.BEGINNER, groupId: 'g_kizomba_beg_mon', groupName: 'Kizomba Începători Luni' }],
        favoriteStyle: DanceStyle.KIZOMBA,
        goal: 'Socializare',
        joinDate: '2024-02-20',
        mainGroup: 'Kizomba Începători Luni',
        status: 'active',
        subscription: { type: 'Bronze', planId: 'bronze', expiryDate: '2024-11-30', sessionsTotal: 4, sessionsLeft: 1, socialPartiesUsed: 0, active: true, autoPayEnabled: false },
        kpi: { lastAttendanceDays: 7, consecutiveAbsences: 1, paymentStatus: 'expiring_soon', retentionRate: 60, engagementScore: 50, hasFeedback: false },
        risk: { level: 'medium', reason: 'Abonament anulat, expiră curând' },
        stats: { streakWeeks: 0, totalClasses: 15, hoursDanced: 15, points: 150 },
        achievements: [],
        personalVideos: [],
        attendedClasses: [],
        preferences: { notificationsEnabled: true, reminderMinutes: 60 },
        feedbackHistory: [],
        attendanceHistory: [],
        paymentHistory: [],
        photos: []
    },
    
    // --- EXISTING BASE STUDENTS ---
    {
        id: 's1',
        name: 'Mihnea Matei',
        avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
        email: 'mihnea.matei@gmail.com',
        phone: '0774 819 714',
        age: 28,
        gender: 'M',
        role: 'student',
        enrollments: [{ style: DanceStyle.BACHATA, level: SkillLevel.BEGINNER, groupId: 'g_bachata_beg_mon', groupName: 'Bachata Începători Luni' }],
        favoriteStyle: DanceStyle.BACHATA,
        goal: 'Socializare',
        joinDate: '2024-11-01',
        mainGroup: 'Bachata Începători Luni',
        status: 'active',
        subscription: { type: 'Silver', planId: 'silver', expiryDate: '2024-12-31', sessionsTotal: 999, sessionsLeft: 999, socialPartiesUsed: 1, active: true, autoPayEnabled: true },
        kpi: { lastAttendanceDays: 2, consecutiveAbsences: 0, paymentStatus: 'paid', retentionRate: 100, engagementScore: 95, hasFeedback: true },
        socialMedia: { instagram: 'https://instagram.com/mihnea.matei', facebook: 'https://facebook.com/mihnea.matei' },
        risk: { level: 'low' },
        stats: { streakWeeks: 4, totalClasses: 12, hoursDanced: 12, points: 150 },
        achievements: [],
        personalVideos: [],
        attendedClasses: ['c_mon_1830_bachata', 'c_tue_1930_salsa'], 
        preferences: { notificationsEnabled: true, reminderMinutes: 60 },
        feedbackHistory: [],
        attendanceHistory: [],
        paymentHistory: [],
        photos: []
    },
    {
        id: 's2',
        name: 'Paul Oprea',
        avatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
        email: 'paul.oprea@yahoo.com',
        phone: '0740 629 956',
        age: 30,
        gender: 'M',
        role: 'student',
        enrollments: [{ style: DanceStyle.SALSA, level: SkillLevel.INTERMEDIATE, groupId: 'g_salsa_int_tue', groupName: 'Salsa Intermediari Marți' }],
        favoriteStyle: DanceStyle.SALSA,
        goal: 'Performanță',
        joinDate: '2023-05-15',
        mainGroup: 'Salsa Intermediari Marți',
        status: 'active',
        subscription: { type: 'Gold', planId: 'gold', expiryDate: '2024-11-30', sessionsTotal: 999, sessionsLeft: 999, socialPartiesUsed: 3, active: true, autoPayEnabled: true },
        kpi: { lastAttendanceDays: 5, consecutiveAbsences: 2, paymentStatus: 'expiring_soon', retentionRate: 64, engagementScore: 64, hasFeedback: false },
        risk: { level: 'high', reason: 'Prezență scăzută' },
        stats: { streakWeeks: 1, totalClasses: 45, hoursDanced: 50, points: 400 },
        achievements: [],
        personalVideos: [],
        attendedClasses: [],
        preferences: { notificationsEnabled: true, reminderMinutes: 30 },
        feedbackHistory: [],
        attendanceHistory: [],
        paymentHistory: [],
        photos: []
    },
    {
        id: 's3',
        name: 'Ionut Constantin',
        avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
        email: 'ionut.constantin@gmail.com',
        phone: '0774 863 379',
        age: 26,
        gender: 'M',
        role: 'student',
        enrollments: [{ style: DanceStyle.KIZOMBA, level: SkillLevel.ADVANCED, groupId: 'g_kizomba_adv_mon', groupName: 'Kizomba Avansați' }],
        favoriteStyle: DanceStyle.KIZOMBA,
        goal: 'Relaxare',
        joinDate: '2022-09-10',
        mainGroup: 'Kizomba Avansați',
        status: 'active',
        subscription: { type: 'Gold', planId: 'gold', expiryDate: '2024-12-15', sessionsTotal: 999, sessionsLeft: 999, socialPartiesUsed: 0, active: true, autoPayEnabled: true },
        kpi: { lastAttendanceDays: 1, consecutiveAbsences: 0, paymentStatus: 'paid', retentionRate: 89, engagementScore: 89, hasFeedback: true },
        risk: { level: 'low' },
        stats: { streakWeeks: 5, totalClasses: 80, hoursDanced: 90, points: 800 },
        achievements: [],
        personalVideos: [],
        attendedClasses: [],
        preferences: { notificationsEnabled: false, reminderMinutes: 0 },
        feedbackHistory: [],
        attendanceHistory: [],
        paymentHistory: [],
        photos: []
    },
    {
        id: 's4',
        name: 'Iulia Munteanu',
        avatarUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
        email: 'iulia.munteanu@gmail.com',
        phone: '0775 418 387',
        age: 24,
        gender: 'F',
        role: 'student',
        enrollments: [{ style: DanceStyle.BACHATA, level: SkillLevel.BEGINNER, groupId: 'g_bachata_beg_mon', groupName: 'Bachata Începători Luni' }],
        favoriteStyle: DanceStyle.BACHATA,
        goal: 'Fun',
        joinDate: '2023-01-20',
        mainGroup: 'Bachata Începători Luni',
        status: 'active',
        subscription: { type: 'Bronze', planId: 'bronze', expiryDate: '2024-12-20', sessionsTotal: 999, sessionsLeft: 999, socialPartiesUsed: 0, active: true, autoPayEnabled: true },
        kpi: { lastAttendanceDays: 10, consecutiveAbsences: 3, paymentStatus: 'paid', retentionRate: 64, engagementScore: 64, hasFeedback: false },
        risk: { level: 'high', reason: 'Prezență scăzută' },
        stats: { streakWeeks: 0, totalClasses: 10, hoursDanced: 10, points: 100 },
        achievements: [],
        personalVideos: [],
        attendedClasses: [],
        preferences: { notificationsEnabled: true, reminderMinutes: 60 },
        feedbackHistory: [],
        attendanceHistory: [],
        paymentHistory: [],
        photos: []
    }
];

// Helper to create new students from raw data
const createImportedStudent = (
    index: number, 
    name: string, 
    expiryDate: string, 
    plan: string,
    groupId: string,
    groupName: string,
    style: DanceStyle,
    level: SkillLevel
): StudentDetailedProfile => {
    // Gender & Avatar Logic
    const firstName = name.split(' ')[0];
    // Simple heuristic for gender based on Romanian names (ending in 'a' usually female)
    const isFemale = firstName.endsWith('a') || firstName.endsWith('ia') || firstName.endsWith('na') || firstName.endsWith('ca');
    const gender = isFemale ? 'F' : 'M';
    const avatarSet = isFemale ? 'women' : 'men';
    // Deterministic random image based on index to keep it consistent on re-renders
    const imgId = index % 99;

    // Distribute join dates over the last 6 months to avoid everyone showing as "NEW"
    const today = new Date();
    const monthsAgo = index % 6; // 0 to 5 months back (0 = current month = NEW)
    const joinDateObj = new Date(today);
    joinDateObj.setMonth(today.getMonth() - monthsAgo);
    // Ensure we don't go into the future if today is early in the month
    if (joinDateObj > today) joinDateObj.setDate(today.getDate());
    const calculatedJoinDate = joinDateObj.toISOString().split('T')[0];

    return {
        id: `imp_${index}`,
        name: name,
        // Use RandomUser.me for realistic photos
        avatarUrl: `https://randomuser.me/api/portraits/${avatarSet}/${imgId}.jpg`,
        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`,
        phone: `07${Math.floor(Math.random() * 90000000 + 10000000)}`,
        age: 20 + (index % 25), // Random age 20-45
        gender: gender, 
        role: 'student',
        enrollments: [{ style, level, groupId, groupName }],
        favoriteStyle: style,
        goal: 'Distracție',
        joinDate: calculatedJoinDate,
        mainGroup: groupName,
        status: 'active',
        subscription: {
            type: plan,
            planId: `sub_${plan.toLowerCase()}`,
            expiryDate: expiryDate,
            sessionsTotal: 999,
            sessionsLeft: 999,
            socialPartiesUsed: 0,
            active: true,
            autoPayEnabled: true
        },
        kpi: { lastAttendanceDays: 3, consecutiveAbsences: 0, paymentStatus: 'paid', retentionRate: 100, engagementScore: 100, hasFeedback: false },
        risk: { level: 'low' },
        stats: { streakWeeks: 0, totalClasses: 0, hoursDanced: 0, points: 0 },
        achievements: [],
        personalVideos: [],
        attendedClasses: [],
        preferences: { notificationsEnabled: true, reminderMinutes: 60 },
        feedbackHistory: [],
        attendanceHistory: [],
        paymentHistory: [],
        photos: []
    };
};

// REMOVED 'Ana Marinescu', 'Ana Maria Savoiu', 'Daniel Arhire' (Dan?) to comply with deletion request for "Ana" and "Dan"
const RAW_LIST = [
  { name: "Andrada Olaru", date: "2026-02-11", plan: "Bronze" },
  { name: "Fabian Iustinian Hanță", date: "2026-02-11", plan: "Bronze" },
  { name: "Predescu Dragos", date: "2026-02-11", plan: "Bronze" },
  { name: "Puha Razvan Petru", date: "2026-02-11", plan: "Platinum" },
  { name: "Rosoiu Andrei", date: "2026-02-11", plan: "Bronze" },
  { name: "Tibu Speranta Lavinia", date: "2026-02-11", plan: "Bronze" },
  { name: "Denisa Dumitrica", date: "2026-02-10", plan: "Bronze" },
  { name: "Popa Bogdan", date: "2026-02-10", plan: "Bronze" },
  { name: "Adrian Bradea", date: "2026-02-09", plan: "Silver" },
  { name: "Andrei Clopotel", date: "2026-02-09", plan: "Silver" },
  { name: "Diaconu Daniela", date: "2026-02-09", plan: "Bronze" },
  { name: "Mihut mihalcea", date: "2026-02-08", plan: "Silver" },
  { name: "Sabina Mihai", date: "2026-02-08", plan: "Silver" },
  { name: "Bianca Serban", date: "2026-02-07", plan: "Bronze" },
  { name: "ION ENE", date: "2026-02-07", plan: "Bronze" },
  { name: "Reza Pramananda", date: "2026-02-07", plan: "Bronze" },
  { name: "STEFAN-GABRIEL GITIN", date: "2026-02-07", plan: "Silver" },
  { name: "Popa Matei Teofan", date: "2026-02-06", plan: "Silver" },
  { name: "Ionescu Liviu Georgian", date: "2026-02-05", plan: "Bronze" },
  { name: "Marius Petre", date: "2026-02-05", plan: "Bronze" },
  { name: "Sipoteanu Razvan", date: "2026-02-05", plan: "Silver" },
  { name: "Voinea Andrei Ionut", date: "2026-02-05", plan: "Silver" },
  { name: "Ionescu Constantin", date: "2026-02-03", plan: "Platinum" },
  { name: "Mihaela Nedelea", date: "2026-02-03", plan: "Platinum" },
  { name: "Rezmerita Mihnea", date: "2026-02-03", plan: "Gold" },
  { name: "Cristina Udrescu", date: "2026-02-01", plan: "Bronze" },
  { name: "Oancea Spotlight", date: "2026-02-01", plan: "Bronze" },
  { name: "Alexandra Apostu", date: "2026-01-31", plan: "Gold" },
  { name: "Andrei Breana", date: "2026-01-31", plan: "Silver" },
  { name: "Gaina Ileana", date: "2026-01-31", plan: "Bronze" },
  { name: "Gheorghe Alina", date: "2026-01-31", plan: "Bronze" },
  { name: "Mitrache Ana-Ilinca", date: "2026-01-31", plan: "Bronze" },
  { name: "Rares Dragnea", date: "2026-01-31", plan: "Bronze" },
  { name: "Alina Gorghiu", date: "2026-01-30", plan: "Bronze" },
  { name: "Florea Ioana", date: "2026-01-30", plan: "Silver" },
  { name: "GEORGIAN BENETATOS", date: "2026-01-30", plan: "Bronze" },
  { name: "Irina Iordache", date: "2026-01-30", plan: "Bronze" },
  { name: "Petru Scutelnicu", date: "2026-01-30", plan: "Bronze" },
  { name: "Burceanu Diana", date: "2026-01-29", plan: "Silver" },
  { name: "Ursateanu Adelina Veronica", date: "2026-01-29", plan: "Bronze" },
  { name: "George Rizea", date: "2026-01-28", plan: "Silver" },
  { name: "Marius Matache", date: "2026-01-28", plan: "Silver" },
  { name: "Speranța-Lavinia Tibu", date: "2026-01-28", plan: "Bronze" },
  { name: "Victor Stanescu", date: "2026-01-27", plan: "Silver" },
  { name: "Camelia Dumitrescu", date: "2026-01-27", plan: "Gold" },
  { name: "Radu Georgescu", date: "2026-01-26", plan: "Bronze" },
  { name: "Simona Marin", date: "2026-01-26", plan: "Silver" },
  { name: "Teodor Vasile", date: "2026-01-25", plan: "Platinum" },
  { name: "Valentin Nistor", date: "2026-01-25", plan: "Bronze" },
  { name: "Roxana Dobre", date: "2026-01-24", plan: "Gold" },
  { name: "Mihai Ionescu", date: "2026-01-24", plan: "Silver" },
  { name: "Elena Popa", date: "2026-01-23", plan: "Bronze" },
  { name: "Cristian Radu", date: "2026-01-23", plan: "Silver" },
  { name: "Gabriela Stoica", date: "2026-01-22", plan: "Bronze" },
  { name: "Alexandru Munteanu", date: "2026-01-22", plan: "Gold" },
  { name: "Ioana Dumitru", date: "2026-01-21", plan: "Silver" },
  { name: "Florin Gheorghe", date: "2026-01-21", plan: "Bronze" },
  { name: "Nicoleta Stan", date: "2026-01-20", plan: "Platinum" },
  { name: "Bogdan Marin", date: "2026-01-20", plan: "Silver" },
  { name: "Andreea Diaconu", date: "2026-01-19", plan: "Bronze" },
  { name: "Claudiu Popescu", date: "2026-01-19", plan: "Gold" },
  { name: "Robert Ionescu", date: "2026-01-18", plan: "Silver" },
  { name: "Diana Muntean", date: "2026-01-18", plan: "Bronze" },
  { name: "Lucian Popa", date: "2026-01-17", plan: "Gold" },
  { name: "Carmen Stanciu", date: "2026-01-17", plan: "Bronze" },
  { name: "Florin Dumitru", date: "2026-01-16", plan: "Silver" },
  { name: "Alice Grigore", date: "2026-01-16", plan: "Bronze" },
  { name: "Tudor Vlase", date: "2026-01-15", plan: "Gold" },
  { name: "Monica Albu", date: "2026-01-15", plan: "Silver" },
  { name: "Sergiu Nicolae", date: "2026-01-14", plan: "Bronze" }
];

// No duplication, just the raw list
const IMPORTED_RAW_DATA = RAW_LIST;

// Distribute imported students into groups to ensure the group list view is populated.
// We map them to specific groups found in data/groups.ts
export const IMPORTED_STUDENTS = IMPORTED_RAW_DATA.map((d, i) => {
    let groupId = '';
    let groupName = '';
    let style = DanceStyle.BACHATA;
    let level = SkillLevel.BEGINNER;

    // Distribute roughly 40% to Bachata Beginners
    if (i % 10 < 4) {
        groupId = 'g_bachata_beg_mon';
        groupName = 'Bachata Începători Luni';
        style = DanceStyle.BACHATA;
        level = SkillLevel.BEGINNER;
    } 
    // Distribute 20% to Bachata Intermediate
    else if (i % 10 < 6) {
        groupId = 'g_bachata_int_mon';
        groupName = 'Bachata Intermediari Luni';
        style = DanceStyle.BACHATA;
        level = SkillLevel.INTERMEDIATE;
    }
    // Distribute 20% to Salsa Intermediate
    else if (i % 10 < 8) {
        groupId = 'g_salsa_int_tue';
        groupName = 'Salsa Intermediari Marți';
        style = DanceStyle.SALSA;
        level = SkillLevel.INTERMEDIATE;
    }
    // Remainder to Kizomba Beginners
    else {
        groupId = 'g_kizomba_beg_mon';
        groupName = 'Kizomba Începători Luni';
        style = DanceStyle.KIZOMBA;
        level = SkillLevel.BEGINNER;
    }

    return createImportedStudent(i, d.name, d.date, d.plan, groupId, groupName, style, level);
});

export const MOCK_ADMIN_STUDENTS: StudentDetailedProfile[] = [
    ...BASE_STUDENTS,
    ...IMPORTED_STUDENTS
];

export const MOCK_STUDENTS_POOL = [];
export const MOCK_ACHIEVEMENTS = [];
export const MOCK_LEADERBOARD = [];
export const MOCK_PERSONAL_VIDEOS = [];
