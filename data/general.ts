
import { UserProfile, DanceStyle } from '../types';

// Helper to get specific date for current week/month logic
export const getDateForDayOfWeek = (dayIndex: number, offsetWeeks: number = 0): string => {
    const today = new Date();
    const resultDate = new Date(today);
    // 0 = Sunday, 1 = Monday...
    const currentDay = today.getDay();
    const distance = dayIndex - currentDay + (offsetWeeks * 7);
    resultDate.setDate(today.getDate() + distance);
    return resultDate.toISOString().split('T')[0];
};

// Helper to find the next occurrence of a specific day of the week (0=Sunday, 1=Monday, etc.)
export const getNextDay = (dayIndex: number): string => {
  const today = new Date();
  const resultDate = new Date();
  
  // Calculate difference: (TargetDay + 7 - CurrentDay) % 7
  let diff = (dayIndex + 7 - today.getDay()) % 7;
  
  // If today is the target day, we assume it counts as the upcoming one (or today)
  if (diff === 0 && today.getHours() > 22) {
      diff = 7; // If it's late at night, move to next week
  }
  
  resultDate.setDate(today.getDate() + diff);
  return resultDate.toISOString().split('T')[0];
};

export const COMPANY_DETAILS = {
  name: "Ginga Social Hub SRL",
  cui: "RO12345678",
  regCom: "J40/1234/2023",
  address: "Strada Constantin Mille nr. 18, București",
  iban: "RO98INGB0000999988887777",
  bank: "ING Bank"
};

// Individual Avatar URLs
export const AVATARS = {
  // Bachata Instructors
  Robert: "",
  Agata: "",
  MariusComan: "",
  Andra: "",
  
  // Salsa Instructors
  Adrian: "",
  Andreea: "",
  Adelin: "",
  Laura: "",

  // Kizomba Instructors
  MariusVilaia: "",
  Diana: "",

  // Others
  Maria: "",
  GingaTeam: "https://ui-avatars.com/api/?name=Ginga+Team&background=e11d48&color=fff",
  GingaTeam_Group: "https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80", 
};

export const INITIAL_USER = {
    id: 'user_1',
    name: 'Mihnea Matei',
    avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    role: 'student', // Default role
    email: 'mihnea.matei@gmail.com',
    phone: '0774 819 714',
    age: 28,
    gender: 'M',
    enrollments: [],
    favoriteStyle: DanceStyle.BACHATA,
    goal: 'Socializare',
    subscription: { 
        active: true, 
        type: 'Silver', 
        sessionsLeft: 999, // Unlimited
        sessionsTotal: 999, // Unlimited
        planId: 'sub_silver', 
        expiryDate: '2024-12-31', 
        socialPartiesUsed: 1 
    },
    billingDetails: {
        name: 'Mihnea Matei',
        address: 'Str. Victoriei 1, București',
        email: 'mihnea.matei@gmail.com'
    },
    paymentMethods: [
        { id: 'pm_1', type: 'card', last4: '4242', brand: 'Visa', isDefault: true }
    ],
    stats: { streakWeeks: 4, totalClasses: 12, hoursDanced: 12, points: 150 },
    achievements: [
        { id: 'ach_1', title: 'Primul Pas', description: 'Ai participat la prima clasă', icon: '🎉', unlocked: true, dateUnlocked: '2024-11-01' }
    ],
    personalVideos: [],
    attendedClasses: ['c_mon_1830_bachata', 'c_tue_1930_salsa'],
    preferences: { 
      notificationsEnabled: true, 
      reminderMinutes: 60,
      notificationSettings: {
        account_payments: { push: true, email: true },
        account_invoices: { push: false, email: true },
        account_subscription: { push: true, email: true },
        security_logins: { push: true, email: true },
        schedule_cancellations: { push: true, email: false },
        schedule_changes: { push: true, email: false },
        schedule_substitutions: { push: true, email: false },
        reminders_24h: { push: true, email: false },
        reminders_1h: { push: true, email: false },
        news_events: { push: false, email: true },
        news_workshops: { push: false, email: true },
        news_general: { push: false, email: false }
      }
    }
} as UserProfile;
