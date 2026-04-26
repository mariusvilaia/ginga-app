
export enum DanceStyle {
  SALSA = 'Salsa',
  BACHATA = 'Bachata',
  KIZOMBA = 'Kizomba',
  LADY_STYLING = 'Lady Styling',
  MEN_STYLING = 'Men Styling',
  TRUPE = 'Trupe'
}

export enum SkillLevel {
  START = 'Start',
  BEGINNER = 'Începător',
  IMPROVERS = 'Improvers',
  INTERMEDIATE = 'Intermediar',
  ADVANCED = 'Avansat'
}

// ... (Existing types remain unchanged) ...

export interface Enrollment {
  id?: string;
  style: DanceStyle;
  level: SkillLevel;
  groupId?: string;
  groupName?: string;
  role?: string;
  schedule?: string;
  start_date?: string;
  end_date?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  dateUnlocked?: string;
}

export type NotificationCategory = 
  | 'payment_success' 
  | 'payment_failed' 
  | 'payment_upcoming'
  | 'reminder_24h' 
  | 'reminder_1h' 
  | 'class_cancelled' 
  | 'class_moved' 
  | 'room_change' 
  | 'inactivity' 
  | 'urgent' 
  | 'policy' 
  | 'holiday'
  | 'general';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'critical';
  category?: NotificationCategory;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  avatarColor: string;
  isCurrentUser?: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  status: 'success' | 'failed' | 'pending';
  invoiceUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiry?: string;
  isDefault: boolean;
}

export interface BillingDetails {
  name: string;
  cui?: string;
  address: string;
  email: string;
}

export interface PersonalMoment {
  id: string;
  thumbnailUrl: string;
  videoUrl?: string;
  eventName: string;
  date: string;
}

export interface AdminNote {
  id: string;
  text: string;
  date: string;
  author: string;
}

export interface TaskProject {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  order?: number;
}

export interface AdminTask {
  id: string;
  title: string;
  status: 'inbox' | 'pending' | 'done' | 'archived';
  priority: 'high' | 'medium' | 'low';
  date: string;
  tag?: string;
  description?: string; // New field for task details
  order?: number; 
  assignee?: {
    name: string;
    avatarUrl: string;
  };
  completedAt?: string;
  projectId?: string;
}

export interface ChannelPreferences {
  push: boolean;
  email: boolean;
}

export interface NotificationSettings {
  account_payments: ChannelPreferences;
  account_invoices: ChannelPreferences;
  account_subscription: ChannelPreferences;
  security_logins: ChannelPreferences;
  schedule_cancellations: ChannelPreferences;
  schedule_changes: ChannelPreferences;
  schedule_substitutions: ChannelPreferences;
  reminders_24h: ChannelPreferences;
  reminders_1h: ChannelPreferences;
  news_events: ChannelPreferences;
  news_workshops: ChannelPreferences;
  news_general: ChannelPreferences;
}

export interface UserProfile {
  id: string;
  name: string;
  middleName?: string;
  nickname?: string;
  avatarUrl?: string;
  email: string;
  phone: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  role: 'student' | 'instructor' | 'admin';
  enrollments: Enrollment[]; 
  past_enrollments?: Enrollment[];
  favoriteStyle: DanceStyle; 
  goal: string;
  subscription: {
    type: string;
    planId: string;
    lastPaymentDate?: string;
    expiryDate: string;
    sessionsTotal: number;
    sessionsLeft: number;
    socialPartiesUsed: number;
    active: boolean;
    isPaused?: boolean;
    autoPayEnabled?: boolean;
    freezePeriods?: { id: string; startDate: string; endDate: string; reason?: string }[];
  };
  memberships?: {
    id: string;
    planId: string;
    status: 'active' | 'expired' | 'cancelled';
    startDate: string;
    endDate: string;
    sessionsTotal: number;
    sessionsLeft: number;
    supportedEnrollments?: string[]; // Array of enrollment IDs
  }[];
  billingDetails?: BillingDetails;
  paymentMethods?: PaymentMethod[];
  stats: {
    streakWeeks: number;
    totalClasses: number;
    hoursDanced: number;
    points: number; 
    quizHighScore?: number;
  };
  achievements: Achievement[];
  personalVideos: PersonalMoment[];
  attendedClasses: string[];
  preferences: {
    notificationsEnabled: boolean;
    reminderMinutes: number; 
    notificationSettings?: NotificationSettings;
  };
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
  adminNotes?: AdminNote[];
  medicalInfo?: string;
  isOnboarded?: boolean;
}

export interface StudentDetailedProfile extends UserProfile {
  stripeCustomerId?: string;
  joinDate: string;
  mainGroup: string;
  status: 'active' | 'inactive' | 'paused';
  kpi: {
    lastAttendanceDays: number;
    consecutiveAbsences: number;
    paymentStatus: 'paid' | 'unpaid' | 'expiring_soon';
    retentionRate: number;
    engagementScore: number;
    hasFeedback: boolean;
  };
  risk: {
    level: 'high' | 'medium' | 'low';
    reason?: string;
    aiRecommendation?: string;
  };
  feedbackHistory: {
    date: string;
    type: 'positive' | 'neutral' | 'negative';
    text: string;
    category: 'Technique' | 'Atmosphere' | 'Instructor';
  }[];
  attendanceHistory: {
    date: string;
    className: string;
    status: 'present' | 'absent' | 'late';
    session_id?: string;
    enrollment_id?: string;
  }[];
  paymentHistory: Transaction[];
  photos?: string[];
}

export interface InstructorInfo {
  id?: string;
  name: string;
  avatarUrl: string;
}

export interface SchoolAvgMetrics {
  ratingAvg: number;
  retentionPct: number;
  newStudents30d: number;
  revenueMonth: number;
  profitMonth: number;
}

export interface InstructorMetrics {
  ratingAvg: number;
  ratingTrend: number[];
  ratingDelta: number;
  
  retentionPct: number;
  retentionTrend: number[];
  retentionDelta: number;
  
  punctualityPct: number;
  punctualityTrend: number[];
  
  activeStudents: number;
  activeStudentsTrend: number[];
  activeStudentsDelta: number;
  
  newStudents30d: number;
  newStudentsTrend: number[];
  newStudentsDelta: number;
  
  lostStudents30d: number;
  lostStudentsDelta: number;
  
  revenueMonth: number;
  revenueTrend: number[];
  revenueDelta: number;
  
  costMonth: number;
  costTrend: number[];
  
  profitMonth: number;
  profitTrend: number[];
  profitDelta: number;
  
  occupancyPct: number;
  instructorScore: number;
  instructorScoreLabel: string;
  
  forecastStudents: number;
  forecastRevenue: number;
  
  schoolAverages: SchoolAvgMetrics;
}

export interface GroupSummary {
  id: string;
  name: string;
  level: SkillLevel;
  studentsCount: number;
  studentsChange30d: number;
  dropouts30d: number;
  retentionPct: number;
  capacity: number;
  occupancyPct: number;
  trendStudentsByMonth: number[];
  revenueMonth: number;
  statusComputed: 'Growing' | 'Stable' | 'Declining';
  riskComputed: boolean;
  opportunityComputed: boolean;
}

export interface InstructorSummary {
  id: string;
  name: string;
  avatarUrl: string;
  styles: DanceStyle[];
  activeStudents: number;
  monthlyRevenue: number;
  occupancyPct: number;
  studentGrowth30d: number;
  instructorScore: number;
  riskReason?: string;
  performanceBadge?: 'Top Performer' | 'Creștere Rapidă' | 'Retenție Scăzută' | 'Feedback Negativ';
}

export interface InstructorProfile {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  phone: string;
  bio?: string;
  specialization?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
  };
  styles: DanceStyle[];
  levels: SkillLevel[];
  status: 'active' | 'break' | 'inactive';
  joinDate: string;
  seniority: string;
  availability: string;
  riskScore: number;
  riskReason?: string;
  kpi: {
    retentionRate: number;
    newStudentsThisMonth: number;
    lostStudentsThisMonth: number;
    averageRating: number;
    punctuality: number;
    reliabilityScore: number;
  };
  schedule: {
    day: string;
    time: string;
    className: string;
    level: string;
  }[];
  recentFeedback: {
    text: string;
    type: 'positive' | 'negative' | 'neutral';
    date?: string;
  }[];
  contract: {
    hourlyRate: number;
    hoursThisMonth: number;
    totalToPay: number;
  };
  groups: {
    name: string;
    students: number;
    attendanceRate: number;
    energyLevel: 'High' | 'Medium' | 'Low';
    status: 'growing' | 'stable' | 'declining' | 'risk';
    trend?: 'up' | 'down';
  }[];
  adminNotes?: AdminNote[];
  stats?: {
    streakWeeks: number;
    totalClasses: number;
    hoursDanced: number;
    points: number; 
    quizHighScore?: number;
  };
  // Manager-centric additions
  managerMetrics?: InstructorMetrics;
  managerGroups?: GroupSummary[];
  aiRecommendations?: string[];
}

export interface ScheduleVersion {
  id: string;
  startDate: string;
  endDate?: string;
  schedule: { day: string; time: string; duration: string; room: string };
  instructors: InstructorInfo[];
  createdAt: string;
}

export interface GroupDetailedProfile {
  id: string;
  name: string;
  style: DanceStyle;
  level: SkillLevel;
  instructors: InstructorInfo[];
  schedule: { day: string; time: string; duration: string; room: string };
  scheduleVersions?: ScheduleVersion[];
  startDate?: string; // New field for group start date
  status: 'active' | 'closed' | 'recycling' | 'launching';
  createdAt: string;
  stats: {
    enrolledCount: number;
    maxCapacity: number;
    averageAttendance: number;
    consecutiveAbsencesCount: number;
    engagementScore: number;
    energyLevel: 'High' | 'Medium' | 'Low';
    trend: 'growing' | 'declining' | 'stable';
  };
  risk: {
    level: 'high' | 'medium' | 'low';
    reason?: string;
    actionRequired?: string;
  };
  students: StudentDetailedProfile[];
  energyHistory: { session: number; level: number }[];
  attendanceHistory: { date: string; count: number }[];
  aiInsights: {
    type: 'growth' | 'risk' | 'optimization';
    text: string;
  }[];
  feedbackSummary: {
    rating: number;
    topIssues: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

export interface DanceClass {
  id: string;
  title: string;
  instructors: InstructorInfo[];
  time: string;
  duration: string;
  room: string;
  level: SkillLevel;
  style: DanceStyle;
  date: string; 
  groupId?: string;
  scheduleVersionId?: string;
  instructorAvatar?: string;
  occupancy?: { current: number, max: number };
  energyLevel?: 'High' | 'Medium' | 'Low';
  riskStatus?: 'Normal' | 'High Absenteeism' | 'Overcrowded';
  trend?: 'up' | 'down' | 'stable';
}

// ... Rest of the file remains unchanged
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  style: DanceStyle;
  duration: string;
  spotifyId?: string;
  appleMusicId?: string;
  coverUrl?: string;
  dateAdded?: string;
}

export interface VideoRecap {
  id: string;
  title: string;
  instructor: string;
  thumbnailUrl: string;
  duration: string;
  date: string;
  videoUrl?: string;
  source?: 'instructor' | 'community';
}

export type ChannelType = 'class' | 'event' | 'community' | 'private_ai';
export type MemberRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface ChatMember {
  userId: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string;
  role: MemberRole;
  isMuted?: boolean;
  joinedAt: string;
  riskScore?: number;
  sentiment?: 'happy' | 'neutral' | 'sad';
}

export interface ChatChannel {
  id: string;
  name: string;
  type: ChannelType;
  description?: string;
  icon?: string;
  unreadCount: number;
  pinnedMessageId?: string;
  members: ChatMember[];
  settings: {
    isReadOnly: boolean;
    slowMode?: number;
    allowReactions: boolean;
  };
  associatedEntityId?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole?: MemberRole;
  senderAvatarUrl?: string;
  text: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'system' | 'poll';
  systemType?: 'enrollment' | 'schedule_change' | 'subscription_alert';
  attachmentUrl?: string;
  thumbnailUrl?: string;
  reactions?: { emoji: string, count: number, userIds: string[] }[];
  replyTo?: { id: string, senderName: string, text: string };
  isDeleted?: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface ChatConversation {
  id: string;
  type: 'direct' | 'group' | 'instructor';
  name: string;
  avatarUrl: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
  status?: 'active' | 'archived';
  relatedStudentId?: string;
  relatedGroupId?: string;
  tags?: string[];
}

export interface SubscriptionPlan {
  id: string;
  stripeProductId?: string;
  stripePriceId?: string;
  category: 'monthly' | 'payg';
  name: string;
  sessions: number;
  price: number;
  currency: string;
  interval?: 'month' | 'year' | 'one_time';
  durationDays: number;
  allowedStylesCount: number; 
  socialPartiesIncluded: number;
  isActive: boolean;
}

export interface Feedback {
  classId: string;
  instructorName: string;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  timestamp: string;
}

export interface ScheduleFilter {
  style: DanceStyle | 'All';
  level: SkillLevel | 'All';
  room: string | 'All';
  instructor: string | 'All';
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  status: 'live' | 'completed' | 'upcoming';
  totalExpected: number;
  totalPresent: number;
  unpaidPresent: number;
  riskStudentsPresent: number;
}

export interface AttendanceRecord {
  studentId: string;
  sessionId: string;
  status: 'present' | 'absent' | 'late';
  checkInTime?: string;
  checkInMethod?: 'qr' | 'manual' | 'beacon';
}

export interface ActivityLog {
  id: string;
  type: 'call' | 'message' | 'meeting' | 'note' | 'status_change' | 'transcription' | 'recording';
  date: string;
  description: string;
  performedBy: string;
  recordingUrl?: string;
}

export enum LeadStage {
  NEW = 'Nou',
  SCHEDULED = 'Programat',
  ATTENDED = 'Prezent',
  ENROLLED = 'Înrolat',
  PAID = 'Plătit'
}

export enum LeadCategory {
  TODO = 'To-do',
  IN_PROGRESS = 'In progress',
  COMPLETE = 'Complete'
}

export const STAGE_TO_CATEGORY: Record<LeadStage, LeadCategory> = {
  [LeadStage.NEW]: LeadCategory.TODO,
  [LeadStage.SCHEDULED]: LeadCategory.IN_PROGRESS,
  [LeadStage.ATTENDED]: LeadCategory.IN_PROGRESS,
  [LeadStage.ENROLLED]: LeadCategory.COMPLETE,
  [LeadStage.PAID]: LeadCategory.COMPLETE,
};

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'call' | 'whatsapp' | 'sms' | 'email' | 'reminder' | 'note';
  outcome: string;
  content: string;
  createdAt: string;
}

export interface StageHistory {
  id: string;
  leadId: string;
  fromStage: LeadStage | null;
  toStage: LeadStage;
  changedAt: string;
}

export type LeadSource = 'Website form' | 'Facebook Lead Ads' | 'Instagram DM' | 'Referral' | 'Direct call' | 'Walk-in' | 'Phone' | 'Whatsapp';

export interface ScheduledClass {
  date: string;
  style: string;
  groupId?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: 'M' | 'F';
  avatarUrl?: string;
  source: LeadSource;
  entryDate: string;
  stage: LeadStage;
  scheduledClassDateTime?: string;
  scheduledClasses?: ScheduledClass[];
  activities: LeadActivity[];
  stageHistory: StageHistory[];
  interest: {
    styles: DanceStyle[];
    style: DanceStyle;
    level: SkillLevel;
    preferredDays: string[];
    groupId?: string;
    groupIds?: string[];
  };
  ownerId: string;
  lastActionDate: string;
  nextActionDate?: string;
  nextActionType?: 'call' | 'message' | 'follow_up';
  riskLevel: 'low' | 'medium' | 'high';
  probability: number;
  activityLog: ActivityLog[];
  notes: string;
  createdAt?: string;
  scheduledAt?: string;
  attendedAt?: string;
  enrolledAt?: string;
  paidAt?: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'payment' | 'retention' | 'welcome' | 'schedule';
}

export interface AutomationRule {
  id: string;
  name: string;
  isActive: boolean;
  trigger: 'absent_consecutive' | 'subscription_expired' | 'new_lead' | 'low_attendance';
  triggerValue: number;
  action: 'send_message' | 'send_notification' | 'assign_task';
  templateId?: string;
}

export interface BroadcastCampaign {
  id: string;
  name: string;
  targetSegment: 'all_students' | 'beginners' | 'expired' | 'active';
  scheduledDate?: string;
  status: 'draft' | 'scheduled' | 'sent';
  channel: 'app_notification' | 'sms' | 'email' | 'whatsapp';
  content: string;
  stats?: {
    sent: number;
    opened: number;
  };
}

export type AttendanceStatusType = 'titular' | 'substitute' | 'absent' | 'cancelled' | 'unset';

export interface InstructorAttendanceRecord {
  id: string;
  date: string;
  time: string;
  instructorId: string;
  actualInstructorId?: string;
  substituteForId?: string;
  status: AttendanceStatusType;
  classId: string;
  className: string;
  room: string;
  hourlyRate?: number;
  note?: string;
}

export interface InstructorMonthlyStats {
  instructorId: string;
  month: string;
  scheduledHours: number;
  titularHours: number;
  substituteHours: number;
  missedHours: number;
}

export interface InstructorUnavailability {
  id: string;
  instructorId: string;
  startDate: string;
  endDate: string;
  reason: string;
  approvedBy?: string;
}

export interface FinancialCategory {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense' | 'cogs';
  subCategories?: { name: string; amount: number }[];
}

export interface InstructorROI {
  name: string;
  cost: number;
  revenueGenerated: number;
  roi: number;
}

export interface FinancialSummary {
  month: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  operatingProfit: number;
  taxes: number;
  netIncome: number;
  incomeStreams: FinancialCategory[];
  expenseStreams: FinancialCategory[];
  transactions: Transaction[];
  budgetVariance: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  cashflowForecast: {
    currentBalance: number;
    estimatedInflow30d: number;
    recurringOutflow30d: number;
    runwayDays: number;
  };
  subscriptionHealth: {
    activeTotal: number;
    renewalRate: number;
    churnRate: number;
    newSubs30d: number;
  };
  instructorRoi: InstructorROI[];
  costStructure: {
    fixed: number;
    variable: number;
  };
  breakEven: {
    subscribersTarget: number;
    subscribersActual: number;
  };
  trends: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    subscribers: number;
  }[];
  alerts: string[];
}

// --- GLOBAL SEARCH TYPES ---
export type SearchResultType = 'student' | 'instructor' | 'group' | 'lead' | 'task' | 'message';

export interface GlobalSearchResult {
    id: string;
    type: SearchResultType;
    title: string;
    subtitle: string;
    icon?: any; // LucideIcon
    route: string; // The tab to navigate to
    avatarUrl?: string;
    metadata?: {
        status?: string;
        tag?: string;
        priority?: string;
    };
}

export interface VacationPeriod {
  id: string;
  startDate: string;
  endDate: string;
  name: string;
}
