
import { AdminTask, TaskProject } from '../types';
import { AVATARS } from './general';

export const MOCK_TASK_PROJECTS: TaskProject[] = [
  { id: 'p1', name: 'Ginga Festival', color: '#EF4444', icon: 'Sparkles' },
  { id: 'p2', name: 'Marketing Q1', color: '#3B82F6', icon: 'Megaphone' },
  { id: 'p3', name: 'Studio Maintenance', color: '#10B981', icon: 'Home' }
];

export const MOCK_ADMIN_TASKS: AdminTask[] = [
  { 
      id: 't1', 
      title: 'Sună lead-urile noi de azi', 
      status: 'pending', 
      priority: 'high', 
      date: 'Azi', 
      tag: 'Calls', 
      assignee: { name: 'Admin Ginga', avatarUrl: 'https://ui-avatars.com/api/?name=Admin+Ginga&background=000&color=fff' },
      projectId: 'p2'
  },
  {
      id: 't2',
      title: 'Confirmă sala pentru eveniment Crăciun',
      status: 'pending',
      priority: 'high',
      date: '15 Dec',
      tag: 'Evenimente',
      assignee: undefined, // Unassigned
      projectId: 'p1'
  },
  {
      id: 't3',
      title: 'Verifică plățile restante grupa Bachata',
      status: 'pending',
      priority: 'medium',
      date: 'Azi',
      tag: 'Finance',
      assignee: { name: 'Robert', avatarUrl: AVATARS.Robert }
  },
  {
      id: 't4',
      title: 'Comandă apă pentru studio',
      status: 'pending',
      priority: 'low',
      date: 'Mâine',
      tag: 'Admin',
      assignee: { name: 'Admin Ginga', avatarUrl: 'https://ui-avatars.com/api/?name=Admin+Ginga&background=000&color=fff' },
      projectId: 'p3'
  },
  {
      id: 't5',
      title: 'Trimite email info workshop weekend',
      status: 'done',
      priority: 'medium',
      date: 'Ieri',
      tag: 'Social Media Posts',
      assignee: { name: 'Agata', avatarUrl: AVATARS.Agata },
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  }
];
