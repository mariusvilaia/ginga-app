
import { DanceClass, SkillLevel, DanceStyle, AttendanceSession } from '../types';
import { AVATARS, getNextDay } from './general';

// --- MOCK CLASSES ---
export const MOCK_CLASSES: DanceClass[] = [
  // === MILLE 18: LUNI (MONDAY) ===
  {
    id: 'c_mon_1830_bachata',
    title: 'Bachata Începători',
    instructors: [{ name: 'Robert', avatarUrl: AVATARS.Robert, id: 'instr_robert' }, { name: 'Agata', avatarUrl: AVATARS.Agata, id: 'instr_agata' }],
    time: '18:30',
    duration: '60 min',
    room: 'Mille 18',
    level: SkillLevel.BEGINNER,
    style: DanceStyle.BACHATA,
    date: getNextDay(1),
    occupancy: { current: 25, max: 40 },
    energyLevel: 'High'
  },
  {
    id: 'c_mon_1930_bachata',
    title: 'Bachata Intermediari 1',
    instructors: [{ name: 'Robert', avatarUrl: AVATARS.Robert, id: 'instr_robert' }, { name: 'Agata', avatarUrl: AVATARS.Agata, id: 'instr_agata' }],
    time: '19:30',
    duration: '60 min',
    room: 'Mille 18',
    level: SkillLevel.INTERMEDIATE,
    style: DanceStyle.BACHATA,
    date: getNextDay(1),
    occupancy: { current: 28, max: 40 },
    energyLevel: 'High'
  },
  {
    id: 'c_mon_2030_lady',
    title: 'Lady Styling Intermediari',
    instructors: [{ name: 'Agata', avatarUrl: AVATARS.Agata, id: 'instr_agata' }],
    time: '20:30',
    duration: '60 min',
    room: 'Mille 18',
    level: SkillLevel.INTERMEDIATE,
    style: DanceStyle.LADY_STYLING,
    date: getNextDay(1),
    occupancy: { current: 15, max: 40 },
    energyLevel: 'Medium'
  },

  // === VICTORIEI BALLROOM: LUNI (MONDAY) ===
  {
    id: 'c_mon_1930_kizomba',
    title: 'Kizomba Începători',
    instructors: [{ name: 'Marius V.', avatarUrl: AVATARS.MariusVilaia, id: 'instr_marius_vilaia' }, { name: 'Diana', avatarUrl: AVATARS.Diana, id: 'instr_diana' }],
    time: '19:30',
    duration: '60 min',
    room: 'Victoriei Ballroom',
    level: SkillLevel.BEGINNER,
    style: DanceStyle.KIZOMBA,
    date: getNextDay(1),
    occupancy: { current: 18, max: 30 },
    energyLevel: 'Medium'
  },
  {
    id: 'c_mon_2030_kizomba',
    title: 'Kizomba Inter-Advanced',
    instructors: [{ name: 'Marius V.', avatarUrl: AVATARS.MariusVilaia, id: 'instr_marius_vilaia' }, { name: 'Diana', avatarUrl: AVATARS.Diana, id: 'instr_diana' }],
    time: '20:30',
    duration: '60 min',
    room: 'Victoriei Ballroom',
    level: SkillLevel.ADVANCED,
    style: DanceStyle.KIZOMBA,
    date: getNextDay(1),
    occupancy: { current: 12, max: 30 },
    energyLevel: 'High'
  },

  // === MILLE 18: MARȚI (TUESDAY) ===
  {
    id: 'c_tue_1830_salsa',
    title: 'Salsa On1 Intermediari',
    instructors: [{ name: 'Adrian', avatarUrl: AVATARS.Adrian, id: 'instr_adrian' }, { name: 'Andreea', avatarUrl: AVATARS.Andreea, id: 'instr_andreea' }],
    time: '18:30',
    duration: '60 min',
    room: 'Mille 18',
    level: SkillLevel.INTERMEDIATE,
    style: DanceStyle.SALSA,
    date: getNextDay(2),
    occupancy: { current: 20, max: 40 },
    energyLevel: 'High'
  },
  {
    id: 'c_tue_1930_salsa',
    title: 'Salsa On1 Începători',
    instructors: [{ name: 'Adrian', avatarUrl: AVATARS.Adrian, id: 'instr_adrian' }, { name: 'Andreea', avatarUrl: AVATARS.Andreea, id: 'instr_andreea' }],
    time: '19:30',
    duration: '60 min',
    room: 'Mille 18',
    level: SkillLevel.BEGINNER,
    style: DanceStyle.SALSA,
    date: getNextDay(2),
    occupancy: { current: 22, max: 40 },
    energyLevel: 'Medium'
  },
  {
    id: 'c_tue_2030_bachata',
    title: 'Bachata Începători',
    instructors: [{ name: 'Marius C.', avatarUrl: AVATARS.MariusComan, id: 'instr_marius_coman' }, { name: 'Andra', avatarUrl: AVATARS.Andra, id: 'instr_andra' }],
    time: '20:30',
    duration: '60 min',
    room: 'Mille 18',
    level: SkillLevel.BEGINNER,
    style: DanceStyle.BACHATA,
    date: getNextDay(2),
    occupancy: { current: 13, max: 40 },
    energyLevel: 'Medium'
  },

  // === MILLE 18: MIERCURI (WEDNESDAY) ===
  {
    id: 'c_wed_1830_salsa',
    title: 'Salsa On1 Improvers',
    instructors: [{ name: 'Adrian', avatarUrl: AVATARS.Adrian, id: 'instr_adrian' }, { name: 'Andreea', avatarUrl: AVATARS.Andreea, id: 'instr_andreea' }],
    time: '18:30',
    duration: '60 min',
    room: 'Mille 18',
    level: SkillLevel.IMPROVERS,
    style: DanceStyle.SALSA,
    date: getNextDay(3),
    occupancy: { current: 18, max: 40 },
    energyLevel: 'High'
  },
  {
    id: 'c_wed_1930_bachata',
    title: 'Bachata Improvers',
    instructors: [{ name: 'Marius C.', avatarUrl: AVATARS.MariusComan, id: 'instr_marius_coman' }, { name: 'Andra', avatarUrl: AVATARS.Andra, id: 'instr_andra' }],
    time: '19:30',
    duration: '60 min',
    room: 'Mille 18',
    level: SkillLevel.IMPROVERS,
    style: DanceStyle.BACHATA,
    date: getNextDay(3),
    occupancy: { current: 24, max: 40 },
    energyLevel: 'High'
  },
  {
    id: 'c_wed_2030_bachata',
    title: 'Bachata Intermediari',
    instructors: [{ name: 'Marius C.', avatarUrl: AVATARS.MariusComan, id: 'instr_marius_coman' }, { name: 'Andra', avatarUrl: AVATARS.Andra, id: 'instr_andra' }],
    time: '20:30',
    duration: '60 min',
    room: 'Mille 18',
    level: SkillLevel.INTERMEDIATE,
    style: DanceStyle.BACHATA,
    date: getNextDay(3),
    occupancy: { current: 20, max: 40 },
    energyLevel: 'High'
  },

  // === VICTORIEI BALLROOM: MIERCURI (WEDNESDAY) ===
  {
    id: 'c_wed_1930_kizomba',
    title: 'Kizomba Intermediari',
    instructors: [{ name: 'Marius V.', avatarUrl: AVATARS.MariusVilaia, id: 'instr_marius_vilaia' }, { name: 'Diana', avatarUrl: AVATARS.Diana, id: 'instr_diana' }],
    time: '19:30',
    duration: '60 min',
    room: 'Victoriei Ballroom',
    level: SkillLevel.INTERMEDIATE,
    style: DanceStyle.KIZOMBA,
    date: getNextDay(3),
    occupancy: { current: 16, max: 30 },
    energyLevel: 'Medium'
  },
  // Added Missing Class
  {
    id: 'c_wed_2130_kizomba',
    title: 'Kizomba Avansați',
    instructors: [{ name: 'Marius V.', avatarUrl: AVATARS.MariusVilaia, id: 'instr_marius_vilaia' }, { name: 'Diana', avatarUrl: AVATARS.Diana, id: 'instr_diana' }],
    time: '21:30',
    duration: '60 min',
    room: 'Victoriei Ballroom',
    level: SkillLevel.ADVANCED,
    style: DanceStyle.KIZOMBA,
    date: getNextDay(3),
    occupancy: { current: 14, max: 30 },
    energyLevel: 'High'
  },

  // === MILLE 18: JOI (THURSDAY) ===
  {
    id: 'c_thu_1930_salsa',
    title: 'Salsa On2 Începători',
    instructors: [{ name: 'Adelin', avatarUrl: AVATARS.Adelin, id: 'instr_adelin' }, { name: 'Laura', avatarUrl: AVATARS.Laura, id: 'instr_laura' }],
    time: '19:30',
    duration: '60 min',
    room: 'Mille 18',
    level: SkillLevel.BEGINNER,
    style: DanceStyle.SALSA,
    date: getNextDay(4),
    occupancy: { current: 14, max: 40 },
    energyLevel: 'Medium'
  }
];

export const MOCK_ATTENDANCE_SESSIONS: AttendanceSession[] = [
    { id: 'sess_1', classId: 'c_tue_1930_salsa', date: 'Azi', status: 'live', totalExpected: 20, totalPresent: 18, unpaidPresent: 2, riskStudentsPresent: 1 },
    { id: 'sess_2', classId: 'c_mon_1830_bachata', date: 'Ieri', status: 'completed', totalExpected: 25, totalPresent: 22, unpaidPresent: 0, riskStudentsPresent: 0 }
];
