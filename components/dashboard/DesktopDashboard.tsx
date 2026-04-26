
import React, { useState, useEffect } from 'react';
import { UserProfile, ChatMember } from '../../types';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { MobileNav } from './layout/MobileNav';
import { useData } from '../../contexts/DataContext';
import { Gamepad2, ScanFace } from 'lucide-react';
import { fetchStripeCustomers, fetchStripeSubscriptions, fetchStripePayments, syncStripePayments, StripeCustomer } from '../../src/services/stripeService';
import { StudentDetailedProfile } from '../../types';
import { calculateSubscriptionExpiryDate } from '../../utils/dateUtils';

import { OverviewView } from '../../features/overview/OverviewView';
import { StudentsView } from '../../features/students/StudentsView';
import { GroupsView } from '../../features/groups/GroupsView';
import { AttendanceView } from '../../features/attendance/AttendanceView';
import { InstructorAttendanceView } from '../../features/instructor-attendance/InstructorAttendanceView';
import { InstructorsView } from '../../features/instructors/InstructorsView';
import { LeadsView } from '../../features/leads/LeadsView';
import { CommunicationsView } from '../../features/communications/CommunicationsView';
import { ScheduleView } from '../../features/schedule/ScheduleView';
import { SettingsView } from '../../features/settings/SettingsView';
import { TasksView } from '../../features/tasks/TasksView';
import { FinanceView } from '../../features/finance/FinanceView';
import { StripeLiveView } from '../../features/stripe/StripeLiveView';
import { NameQuizGame } from '../../features/students/components/NameQuizGame';
import { FaceQuizGame } from '../../features/students/components/FaceQuizGame';

interface DesktopDashboardProps {
  user: UserProfile;
  members: ChatMember[];
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({ 
  user, 
  members, 
  onLogout, 
  isDarkMode, 
  toggleDarkMode, 
  onUpdateProfile
}) => {
  // Use tasks from DataContext instead of local state
  const { students, groups, tasks, addTask, updateTask, deleteTask, vacationPeriods, updateStudent } = useData();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'games' | 'groups' | 'attendance' | 'instructor_attendance' | 'schedule' | 'instructors' | 'leads' | 'communications' | 'settings' | 'tasks' | 'finance' | 'stripe'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [gameMode, setGameMode] = useState<'name' | 'face'>('name');
  
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [targetInstructorId, setTargetInstructorId] = useState<string | null>(null);
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);
  const [targetConversationId, setTargetConversationId] = useState<string | null>(null);

  const syncAllStripeData = async (silent = true) => {
      try {
        const [customers, subscriptions, payments] = await Promise.all([
          fetchStripeCustomers(),
          fetchStripeSubscriptions(),
          fetchStripePayments(),
        ]);

        const matchedData = customers.map(customer => {
          let student = students.find(s => s.stripeCustomerId === customer.id) || students.find(s => s.email.toLowerCase() === customer.email.toLowerCase());
          return { customer, student, isMatched: !!student };
        });

        const matchedStudents = matchedData.filter(item => item.isMatched && item.student && item.customer);

        const handleSyncPayments = async (student: StudentDetailedProfile, customer: StripeCustomer, silent = false) => {
          try {
            const { payments: syncedPayments, subscription: syncedSubscription } = await syncStripePayments({
              stripeCustomerId: customer.id,
              email: customer.email,
              name: customer.name,
              phone: customer.phone,
            });
      
            let updatedSubscription = { ...student.subscription };
            let hasSubscriptionChanges = false;

            if (syncedSubscription) {
              let newPlan = updatedSubscription.type;
              if (syncedSubscription.planName?.includes('Bronze')) newPlan = 'Bronze';
              else if (syncedSubscription.planName?.includes('Silver')) newPlan = 'Silver';
              else if (syncedSubscription.planName?.includes('Gold')) newPlan = 'Gold';
              else if (syncedSubscription.planName?.includes('Platinum')) newPlan = 'Platinum';

              if (newPlan !== updatedSubscription.type) {
                updatedSubscription.type = newPlan;
                hasSubscriptionChanges = true;
              }
              
              if (syncedSubscription.status === 'active') {
                updatedSubscription.active = true;
                hasSubscriptionChanges = true;
              }
            }

            if (!syncedPayments || syncedPayments.length === 0) {
              if (hasSubscriptionChanges) {
                updateStudent(student.id, { subscription: updatedSubscription });
              }
              return;
            }
      
            const existingPayments = student.paymentHistory || [];
            const uniqueNewPaymentsMap = new Map<string, any>();
            
            for (const sp of syncedPayments) {
                const spDate = new Date(sp.date).getTime();
                
                // Check if there's an existing payment with the same amount within +/- 3 days
                const isDuplicate = existingPayments.some(ep => {
                    if (ep.id === sp.id) return true; // Exact match by Stripe ID
                    if (ep.amount !== sp.amount) return false;
                    
                    const epDate = new Date(ep.date).getTime();
                    const diffDays = Math.abs(spDate - epDate) / (1000 * 3600 * 24);
                    return diffDays <= 3;
                });

                if (!isDuplicate && !uniqueNewPaymentsMap.has(sp.id)) {
                    uniqueNewPaymentsMap.set(sp.id, sp);
                }
            }
            const newPayments = Array.from(uniqueNewPaymentsMap.values());
      
            if (newPayments.length === 0) {
              if (hasSubscriptionChanges) {
                updateStudent(student.id, { subscription: updatedSubscription });
              }
              return;
            }
      
            let updatedPaymentHistory: any[] = [...(student.paymentHistory || []), ...newPayments];
            updatedPaymentHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
            const latestPayment = updatedPaymentHistory[0];
            let newExpiryDateStr = updatedSubscription.expiryDate;
            let newLastPaymentDate = updatedSubscription.lastPaymentDate;
      
            if (latestPayment) {
              const adjustedExpiryDate = calculateSubscriptionExpiryDate(updatedPaymentHistory, updatedSubscription.expiryDate, vacationPeriods);
              newExpiryDateStr = adjustedExpiryDate.toISOString().split('T')[0];
              newLastPaymentDate = latestPayment.date;
            }
      
            updateStudent(student.id, {
              paymentHistory: updatedPaymentHistory,
              subscription: {
                ...updatedSubscription,
                active: true,
                lastPaymentDate: newLastPaymentDate,
                expiryDate: newExpiryDateStr,
              },
            });
          } catch (err: any) {
            console.error(`Eroare la sincronizarea plăților pentru ${student.name}:`, err);
          }
        };

        for (const item of matchedStudents) {
          await handleSyncPayments(item.student!, item.customer, true);
        }

        if (!silent) {
          alert(`Sincronizare în masă finalizată pentru ${matchedStudents.length} clienți!`);
        }
      } catch (error) {
        console.error("Eroare la sincronizarea automată Stripe:", error);
      }
    };


  const syncAllStripeDataRef = React.useRef(syncAllStripeData);
  
  useEffect(() => {
    syncAllStripeDataRef.current = syncAllStripeData;
  }, [syncAllStripeData]);

  useEffect(() => {
    // Run once on mount after a short delay to ensure data is loaded
    const initialTimeout = setTimeout(() => {
      syncAllStripeDataRef.current(true);
    }, 5000);

    // Then run every hour
    const intervalId = setInterval(() => {
      syncAllStripeDataRef.current(true);
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, []);

  // Helper for adding tasks via shortcut
  const handleQuickAddTask = (title: string, priority: 'high' | 'medium' | 'low' = 'medium', tag: string = '', assignee?: {name: string, avatarUrl: string}, description?: string, status: 'inbox' | 'pending' | 'done' | 'archived' = 'inbox', projectId?: string) => {
      // Rule: must have assignee, date, and tag to be pending
      const hasAllInfo = !!assignee && !!tag; // date is 'Azi' by default here
      const finalStatus = (status === 'inbox' || status === 'pending') ? (hasAllInfo ? 'pending' : 'inbox') : status;

      const newTask = { 
          id: `t_${Date.now()}`, 
          title, 
          status: finalStatus, 
          priority, 
          date: 'Azi', 
          tag: tag || 'General', 
          assignee,
          description,
          projectId
      };
      addTask(newTask);
  };

  const toggleTaskStatus = (id: string) => { 
      const task = tasks.find(t => t.id === id);
      if (task) {
          if (task.status === 'done') {
              // Toggling back from done: check if it has all info to be pending
              const hasAllInfo = !!task.assignee && !!task.date && !!task.tag;
              updateTask({ ...task, status: hasAllInfo ? 'pending' : 'inbox' });
          } else {
              // Moving to done
              updateTask({ ...task, status: 'done' });
          }
      }
  };

  const handleNavigateToGroup = (groupId: string) => { setTargetGroupId(groupId); setActiveTab('groups'); };
  const handleNavigateToInstructor = (instructorId: string) => { setTargetInstructorId(instructorId); setActiveTab('instructors'); };
  const handleNavigateToStudent = (studentId: string) => { setTargetStudentId(studentId); setActiveTab('members'); };

  const handleOverviewNavigation = (tab: any, id?: string) => {
      if (id) {
          if (tab === 'groups') setTargetGroupId(id);
          if (tab === 'members') setTargetStudentId(id);
          if (tab === 'instructors') setTargetInstructorId(id);
          if (tab === 'communications') setTargetConversationId(id);
      }
      setActiveTab(tab);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-white overflow-hidden transition-colors duration-300">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={onLogout}
        isMobileOpen={isMobileMenuOpen}
        closeMobile={() => setIsMobileMenuOpen(false)}
      />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode} 
          toggleDarkMode={toggleDarkMode} 
          onNavigateToSettings={() => setActiveTab('settings')}
          user={user}
          onLogout={onLogout}
          tasks={tasks}
          onNavigate={handleOverviewNavigation}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 no-scrollbar space-y-8">
          {activeTab === 'overview' && <OverviewView isDarkMode={isDarkMode} onNavigate={handleOverviewNavigation} tasks={tasks} onAddTask={handleQuickAddTask} onUpdateTask={updateTask} />}
          {activeTab === 'members' && <StudentsView currentUser={user} initialStudentId={targetStudentId} onClearInitial={() => setTargetStudentId(null)} onAddTask={handleQuickAddTask} onNavigateToGroup={handleNavigateToGroup} />}
          {activeTab === 'games' && (
              <div className="h-full flex flex-col animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
                      <div>
                          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                              {gameMode === 'name' ? 'Numește Cursantul' : 'Recunoaște Fața'}
                          </h2>
                          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                              {gameMode === 'name' ? 'Cât de bine cunoști comunitatea?' : 'Asociază numele cu fața corectă.'}
                          </p>
                      </div>
                      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                          <button 
                              onClick={() => setGameMode('name')}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${gameMode === 'name' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
                          >
                              <Gamepad2 size={16} className="inline mr-2"/> Quiz Nume
                          </button>
                          <button 
                              onClick={() => setGameMode('face')}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${gameMode === 'face' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
                          >
                              <ScanFace size={16} className="inline mr-2"/> Quiz Fețe
                          </button>
                      </div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                      {gameMode === 'name' ? (
                          <NameQuizGame students={students} allGroups={groups} currentUser={user} onNavigateToProfile={handleNavigateToStudent} />
                      ) : (
                          <FaceQuizGame students={students} allGroups={groups} currentUser={user} />
                      )}
                  </div>
              </div>
          )}
          {activeTab === 'groups' && <GroupsView initialGroupId={targetGroupId} onClearInitialGroup={() => setTargetGroupId(null)} onNavigateToStudent={handleNavigateToStudent} onAddTask={handleQuickAddTask} />}
          {activeTab === 'attendance' && <AttendanceView onNavigateToStudent={handleNavigateToStudent} onNavigateToGroup={handleNavigateToGroup} />}
          {activeTab === 'instructor_attendance' && <InstructorAttendanceView />}
          {activeTab === 'schedule' && <ScheduleView onNavigateToClass={(id) => { /* Optional: Navigate to class detail */ }} />}
          {activeTab === 'instructors' && <InstructorsView initialInstructorId={targetInstructorId} onClearInitial={() => setTargetInstructorId(null)} />}
          {activeTab === 'leads' && <LeadsView onNavigateToStudent={handleNavigateToStudent} onAddTask={handleQuickAddTask} />}
          {activeTab === 'communications' && <CommunicationsView onNavigateToStudent={handleNavigateToStudent} initialConversationId={targetConversationId} />}
          {activeTab === 'settings' && <SettingsView user={user} onUpdateProfile={onUpdateProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
          {activeTab === 'tasks' && <TasksView tasks={tasks} onAddTask={handleQuickAddTask} onUpdateTask={updateTask} onToggleTask={(id) => toggleTaskStatus(id)} onDeleteTask={(id) => deleteTask(id)} />}
          {activeTab === 'finance' && <FinanceView />}
          {activeTab === 'stripe' && <StripeLiveView />}
        </div>
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
    </div>
  );
};
