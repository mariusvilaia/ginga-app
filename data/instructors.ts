
import { InstructorProfile, DanceStyle, SkillLevel, InstructorAttendanceRecord, InstructorUnavailability } from '../types';
import { AVATARS, getDateForDayOfWeek } from './general';

export const MOCK_INSTRUCTORS_DATA: InstructorProfile[] = [
  {
    id: 'instr_robert',
    name: 'Robert Dragomir',
    avatarUrl: AVATARS.Robert,
    email: 'robert@ginga.ro',
    phone: '0722 999 888',
    styles: [DanceStyle.BACHATA],
    levels: [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE],
    status: 'active',
    joinDate: '2021-06-15',
    seniority: '3 ani',
    availability: 'Luni',
    riskScore: 5,
    kpi: { retentionRate: 98, newStudentsThisMonth: 20, lostStudentsThisMonth: 0, averageRating: 5.0, punctuality: 100, reliabilityScore: 100 },
    schedule: [
      { day: 'Luni', time: '18:30', className: 'Bachata', level: 'Începători' },
      { day: 'Luni', time: '19:30', className: 'Bachata', level: 'Intermediari' }
    ],
    recentFeedback: [{ text: 'Energie fantastică!', type: 'positive', date: 'Acum 2 zile' }],
    contract: { hourlyRate: 150, hoursThisMonth: 16, totalToPay: 2400 },
    groups: [{ name: 'Bachata Luni Beg', students: 25, attendanceRate: 95, energyLevel: 'High', status: 'growing', trend: 'up' }],
    aiRecommendations: ['Potențial pentru o grupă nouă de avansați.'],
    adminNotes: [{id: 'n1', author: 'Admin Ginga', date: '12 Nov 2024', text: 'Discutat despre noul format de curs. Este de acord.'}]
  },
  {
    id: 'instr_agata',
    name: 'Agata Faye',
    avatarUrl: AVATARS.Agata,
    email: 'agata@ginga.ro',
    phone: '0777 444 555',
    styles: [DanceStyle.BACHATA, DanceStyle.LADY_STYLING],
    levels: [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE],
    status: 'active',
    joinDate: '2022-06-01',
    seniority: '2 ani',
    availability: 'Luni',
    riskScore: 2,
    kpi: { retentionRate: 96, newStudentsThisMonth: 10, lostStudentsThisMonth: 1, averageRating: 4.9, punctuality: 100, reliabilityScore: 99 },
    schedule: [
      { day: 'Luni', time: '18:30', className: 'Bachata', level: 'Începători' },
      { day: 'Luni', time: '19:30', className: 'Bachata', level: 'Intermediari' },
      { day: 'Luni', time: '20:30', className: 'Lady Styling', level: 'Intermediari' }
    ],
    recentFeedback: [{ text: 'Explică minunat detaliile de styling.', type: 'positive', date: 'Acum 1 zi' }],
    contract: { hourlyRate: 145, hoursThisMonth: 20, totalToPay: 2900 },
    groups: [{ name: 'Lady Styling', students: 15, attendanceRate: 90, energyLevel: 'Medium', status: 'stable', trend: 'up' }],
    aiRecommendations: [],
    adminNotes: []
  },
  {
      id: 'instr_adrian',
      name: 'Adrian Popita',
      avatarUrl: AVATARS.Adrian,
      email: 'adrian@ginga.ro',
      phone: '0755 111 222',
      styles: [DanceStyle.SALSA],
      levels: [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.IMPROVERS],
      status: 'active',
      joinDate: '2023-01-10',
      seniority: '1 an',
      availability: 'Marți, Miercuri',
      riskScore: 10,
      kpi: { retentionRate: 92, newStudentsThisMonth: 15, lostStudentsThisMonth: 3, averageRating: 4.8, punctuality: 100, reliabilityScore: 98 },
      schedule: [
          { day: 'Marți', time: '18:30', className: 'Salsa On1', level: 'Intermediari' },
          { day: 'Marți', time: '19:30', className: 'Salsa On1', level: 'Începători' },
          { day: 'Miercuri', time: '18:30', className: 'Salsa On1', level: 'Improvers' }
      ],
      recentFeedback: [{ text: 'Foarte tehnic și clar.', type: 'positive', date: 'Acum 3 zile' }],
      contract: { hourlyRate: 140, hoursThisMonth: 24, totalToPay: 3360 },
      groups: [{ name: 'Salsa Marți', students: 20, attendanceRate: 88, energyLevel: 'High', status: 'growing', trend: 'up' }],
      aiRecommendations: ['Menține ritmul actual.'],
      adminNotes: []
  },
  {
      id: 'instr_andreea',
      name: 'Andreea',
      avatarUrl: AVATARS.Andreea,
      email: 'andreea@ginga.ro',
      phone: '0700 111 222',
      styles: [DanceStyle.SALSA],
      levels: [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE],
      status: 'active',
      joinDate: '2023-01-10',
      seniority: '1 an',
      availability: 'Marți, Miercuri',
      riskScore: 0,
      kpi: { retentionRate: 95, newStudentsThisMonth: 5, lostStudentsThisMonth: 0, averageRating: 5.0, punctuality: 100, reliabilityScore: 100 },
      schedule: [],
      recentFeedback: [],
      contract: { hourlyRate: 130, hoursThisMonth: 10, totalToPay: 1300 },
      groups: [],
      aiRecommendations: [],
      adminNotes: []
  },
  {
      id: 'instr_marius_vilaia',
      name: 'Marius Vilaia',
      avatarUrl: AVATARS.MariusVilaia,
      email: 'marius.vilaia@ginga.ro',
      phone: '0733 555 111',
      styles: [DanceStyle.KIZOMBA],
      levels: [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED],
      status: 'active',
      joinDate: '2020-09-01',
      seniority: '4 ani',
      availability: 'Luni, Miercuri',
      riskScore: 5,
      kpi: { retentionRate: 95, newStudentsThisMonth: 12, lostStudentsThisMonth: 1, averageRating: 4.9, punctuality: 100, reliabilityScore: 70 },
      schedule: [
        { day: 'Luni', time: '19:30', className: 'Kizomba', level: 'Începători' },
        { day: 'Luni', time: '20:30', className: 'Kizomba', level: 'Inter-Adv' },
        { day: 'Miercuri', time: '19:30', className: 'Kizomba', level: 'Intermediari' }
      ],
      recentFeedback: [{ text: 'Nu a venit la timp la oră.', type: 'negative', date: 'Acum 2 zile' }, {text: 'Nu prea explică la avansați, doar dansează.', type: 'negative', date: 'Acum 2 zile'}, {text: 'Muzica e bună.', type: 'positive', date: 'Acum 2 zile'}],
      contract: { hourlyRate: 160, hoursThisMonth: 24, totalToPay: 2400 },
      groups: [
        { name: 'Kizomba Începători', students: 15, attendanceRate: 60, energyLevel: 'Low', status: 'risk', trend: 'down' },
        { name: 'Kizomba Avansati', students: 8, attendanceRate: 50, energyLevel: 'Low', status: 'risk', trend: 'down' }
      ],
      aiRecommendations: ['URGENT: Discuție 1-la-1 necesară.'],
      adminNotes: []
  },
  {
      id: 'instr_diana',
      name: 'Diana',
      avatarUrl: AVATARS.Diana,
      email: 'diana@ginga.ro',
      phone: '0700 333 444',
      styles: [DanceStyle.KIZOMBA],
      levels: [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE],
      status: 'active',
      joinDate: '2021-01-01',
      seniority: '3 ani',
      availability: 'Luni, Miercuri',
      riskScore: 0,
      kpi: { retentionRate: 100, newStudentsThisMonth: 0, lostStudentsThisMonth: 0, averageRating: 5.0, punctuality: 100, reliabilityScore: 100 },
      schedule: [],
      recentFeedback: [],
      contract: { hourlyRate: 140, hoursThisMonth: 10, totalToPay: 1400 },
      groups: [],
      aiRecommendations: [],
      adminNotes: []
  },
  {
      id: 'instr_marius_coman',
      name: 'Marius Coman',
      avatarUrl: AVATARS.MariusComan,
      email: 'marius.coman@ginga.ro',
      phone: '0700 888 777',
      styles: [DanceStyle.BACHATA],
      levels: [SkillLevel.BEGINNER, SkillLevel.IMPROVERS, SkillLevel.INTERMEDIATE],
      status: 'active',
      joinDate: '2022-01-01',
      seniority: '2 ani',
      availability: 'Marți, Miercuri',
      riskScore: 0,
      kpi: { retentionRate: 98, newStudentsThisMonth: 5, lostStudentsThisMonth: 0, averageRating: 5.0, punctuality: 100, reliabilityScore: 100 },
      schedule: [],
      recentFeedback: [],
      contract: { hourlyRate: 140, hoursThisMonth: 12, totalToPay: 1680 },
      groups: [],
      aiRecommendations: [],
      adminNotes: []
  },
  {
      id: 'instr_andra',
      name: 'Andra',
      avatarUrl: AVATARS.Andra,
      email: 'andra@ginga.ro',
      phone: '0700 666 555',
      styles: [DanceStyle.BACHATA],
      levels: [SkillLevel.BEGINNER, SkillLevel.IMPROVERS, SkillLevel.INTERMEDIATE],
      status: 'active',
      joinDate: '2022-01-01',
      seniority: '2 ani',
      availability: 'Marți, Miercuri',
      riskScore: 0,
      kpi: { retentionRate: 98, newStudentsThisMonth: 5, lostStudentsThisMonth: 0, averageRating: 5.0, punctuality: 100, reliabilityScore: 100 },
      schedule: [],
      recentFeedback: [],
      contract: { hourlyRate: 130, hoursThisMonth: 12, totalToPay: 1560 },
      groups: [],
      aiRecommendations: [],
      adminNotes: []
  },
  {
      id: 'instr_adelin',
      name: 'Adelin',
      avatarUrl: AVATARS.Adelin,
      email: 'adelin@ginga.ro',
      phone: '0700 444 333',
      styles: [DanceStyle.SALSA],
      levels: [SkillLevel.BEGINNER],
      status: 'active',
      joinDate: '2023-06-01',
      seniority: '6 luni',
      availability: 'Joi',
      riskScore: 0,
      kpi: { retentionRate: 90, newStudentsThisMonth: 2, lostStudentsThisMonth: 0, averageRating: 4.8, punctuality: 100, reliabilityScore: 95 },
      schedule: [],
      recentFeedback: [],
      contract: { hourlyRate: 120, hoursThisMonth: 8, totalToPay: 960 },
      groups: [],
      aiRecommendations: [],
      adminNotes: []
  },
  {
      id: 'instr_laura',
      name: 'Laura',
      avatarUrl: AVATARS.Laura,
      email: 'laura@ginga.ro',
      phone: '0700 222 111',
      styles: [DanceStyle.SALSA],
      levels: [SkillLevel.BEGINNER],
      status: 'active',
      joinDate: '2023-06-01',
      seniority: '6 luni',
      availability: 'Joi',
      riskScore: 0,
      kpi: { retentionRate: 92, newStudentsThisMonth: 2, lostStudentsThisMonth: 0, averageRating: 4.9, punctuality: 100, reliabilityScore: 98 },
      schedule: [],
      recentFeedback: [],
      contract: { hourlyRate: 120, hoursThisMonth: 8, totalToPay: 960 },
      groups: [],
      aiRecommendations: [],
      adminNotes: []
  }
];

export const MOCK_INSTRUCTOR_ATTENDANCE: InstructorAttendanceRecord[] = [
    // 1. PAST SUBSTITUTION (e.g., Last Monday)
    // Marius Coman taught Bachata instead of Robert
    { 
        id: 'att_sub_1', 
        date: getDateForDayOfWeek(1, -1), // Last Monday
        time: '18:30', 
        instructorId: 'instr_robert', // Should have been Robert
        actualInstructorId: 'instr_marius_coman', // But Marius Coman taught it
        status: 'substitute', 
        classId: 'c_mon_1830_bachata', 
        className: 'Bachata Începători', 
        room: 'Mille 18',
        substituteForId: 'instr_robert'
    },

    // 2. RECENT SUBSTITUTION (e.g., Last Thursday)
    // Adrian taught Salsa On2 instead of Adelin
    {
        id: 'att_sub_2',
        date: getDateForDayOfWeek(4, -1), // Last Thursday
        time: '19:30',
        instructorId: 'instr_adelin',
        actualInstructorId: 'instr_adrian',
        status: 'substitute',
        classId: 'c_thu_1930_salsa',
        className: 'Salsa On2 Începători',
        room: 'Mille 18',
        substituteForId: 'instr_adelin'
    },

    // 3. RECENT SUBSTITUTION (e.g., Last Wednesday)
    // Marius Vilaia taught for Diana
    {
        id: 'att_sub_3',
        date: getDateForDayOfWeek(3, -1), // Last Wednesday
        time: '19:30',
        instructorId: 'instr_diana',
        actualInstructorId: 'instr_marius_vilaia',
        status: 'substitute',
        classId: 'c_wed_1930_kizomba',
        className: 'Kizomba Intermediari',
        room: 'Victoriei Ballroom',
        substituteForId: 'instr_diana'
    },
    
    // 4. FUTURE ABSENCE (e.g., Next Monday) - Red Hollow
    { 
        id: 'att_abs_1', 
        date: getDateForDayOfWeek(1, 1), // Next Monday
        time: '20:30', 
        instructorId: 'instr_agata', 
        status: 'absent', 
        classId: 'c_mon_2030_lady', 
        className: 'Lady Styling Intermediari', 
        room: 'Mille 18', 
        note: 'Concediu Medical' 
    },

    // 5. FUTURE CANCELLATION (e.g., Next Wednesday) - Dashed
    {
        id: 'att_canc_1',
        date: getDateForDayOfWeek(3, 1), // Next Wednesday
        time: '19:30',
        instructorId: 'instr_marius_vilaia',
        status: 'cancelled',
        classId: 'c_wed_1930_kizomba',
        className: 'Kizomba Intermediari',
        room: 'Victoriei Ballroom',
        note: 'Sală indisponibilă'
    },

    // 6. ACTION NEEDED: TOMORROW ABSENT BUT NO SUBSTITUTE
    {
        id: 'att_action_needed_1',
        date: getDateForDayOfWeek(new Date().getDay() + 1), // Tomorrow
        time: '19:30',
        instructorId: 'instr_agata',
        status: 'absent',
        classId: 'c_mon_1930_bachata',
        className: 'Bachata Intermediari 1',
        room: 'Mille 18',
        note: 'Urgent: Concediu Medical'
    },

    // 7. FUTURE SUBSTITUTION PLANNED (Next Tuesday)
    {
        id: 'att_fut_sub_1',
        date: getDateForDayOfWeek(2, 1), // Next Tuesday
        time: '18:30',
        instructorId: 'instr_adrian',
        actualInstructorId: 'instr_adelin',
        status: 'substitute',
        classId: 'c_tue_1830_salsa',
        className: 'Salsa On1 Intermediari',
        room: 'Mille 18',
        substituteForId: 'instr_adrian'
    }
];

export const MOCK_INSTRUCTOR_UNAVAILABILITY: InstructorUnavailability[] = [
    { 
        id: 'un_1', 
        instructorId: 'instr_adrian', 
        startDate: getDateForDayOfWeek(2, 2), // 2 Weeks from now (Tue)
        endDate: getDateForDayOfWeek(2, 3), // 3 Weeks from now
        reason: 'Concediu Odihnă' 
    }
];
