
import { ChatConversation, NotificationItem, MessageTemplate, AutomationRule, BroadcastCampaign } from '../types';
import { AVATARS } from './general';

export const MOCK_CONVERSATIONS: ChatConversation[] = [
    { 
        id: 'c_bachata_beginners', 
        type: 'group', 
        name: 'Bachata Începători Luni', 
        avatarUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80', 
        lastMessage: 'Vă așteptăm cu drag disear...', 
        lastMessageTime: '10:30', 
        unreadCount: 2, 
        tags: ['General', 'Reminder']
    },
    { 
        id: 'c_andrei_popescu', 
        type: 'direct', 
        name: 'Andrei Popescu', 
        avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg', 
        lastMessage: 'Pot recupera ședința de luni?', 
        lastMessageTime: '09:15', 
        unreadCount: 1, 
        isOnline: true, 
        relatedStudentId: 's1',
        tags: ['Payment', 'Request']
    },
    {
        id: 'c_maria_ionescu',
        type: 'direct',
        name: 'Maria Ionescu',
        avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        lastMessage: 'Mulțumesc pentru feedback!',
        lastMessageTime: 'Ieri',
        unreadCount: 0,
        isOnline: false,
        tags: ['Feedback', 'Active']
    },
    {
        id: 'c_salsa_adv',
        type: 'group',
        name: 'Salsa Advanced Team',
        avatarUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        lastMessage: 'Schimbare sală pentru joi.',
        lastMessageTime: 'Ieri',
        unreadCount: 5,
        tags: ['Announcements', 'Urgent']
    },
    {
        id: 'c_elena_dumitru',
        type: 'direct',
        name: 'Elena Dumitru',
        avatarUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
        lastMessage: 'Am trimis dovada plății prin R...',
        lastMessageTime: 'Luni',
        unreadCount: 0,
        tags: ['Payment', 'Membership']
    },
    {
        id: 'c_marius_vilaia',
        type: 'instructor',
        name: 'Marius Vilaia',
        avatarUrl: AVATARS.MariusVilaia,
        lastMessage: 'Pot întârzia 5 min la cursul ...',
        lastMessageTime: 'Acum 10m',
        unreadCount: 1,
        tags: ['Internal', 'Urgent']
    }
];

export const MOCK_NOTIFICATIONS_HISTORY: NotificationItem[] = [
    { 
        id: 'n1', 
        title: 'Debit Card Următor', 
        message: 'Ne pregătim să îți debităm cardul pentru reînnoirea abonamentului Loyalty Silver.', 
        timestamp: 'Acum 2 ore', 
        read: false, 
        type: 'info',
        category: 'payment_upcoming'
    },
    { 
        id: 'n2', 
        title: 'Reminder Curs', 
        message: 'Nu uita, mâine la 19:30 ai curs de Bachata Intermediari.', 
        timestamp: 'Acum 5 ore', 
        read: false, 
        type: 'info',
        category: 'reminder_24h'
    },
    { 
        id: 'n3', 
        title: 'Ne vedem curând!', 
        message: 'Cursul de Salsa începe într-o oră la Mille 18.', 
        timestamp: 'Acum 30 min', 
        read: false, 
        type: 'info',
        category: 'reminder_1h'
    },
    { 
        id: 'n4', 
        title: 'Curs Anulat', 
        message: 'Din păcate, cursul de Lady Styling de azi a fost anulat din motive medicale.', 
        timestamp: 'Ieri', 
        read: true, 
        type: 'warning',
        category: 'class_cancelled'
    },
    { 
        id: 'n5', 
        title: 'Modificare Orar', 
        message: 'Cursul de Kizomba de joi s-a mutat la ora 20:30.', 
        timestamp: 'Ieri', 
        read: true, 
        type: 'warning',
        category: 'class_moved'
    },
    { 
        id: 'n6', 
        title: 'Schimbare Sală', 
        message: 'Atenție! Cursul de diseară se ține în Sala Victoriei Ballroom.', 
        timestamp: 'Acum 2 zile', 
        read: true, 
        type: 'info',
        category: 'room_change'
    },
    { 
        id: 'n7', 
        title: 'Plată Eșuată', 
        message: 'Nu am putut procesa plata pentru abonamentul tău. Te rugăm să actualizezi datele cardului.', 
        timestamp: 'Acum 3 zile', 
        read: true, 
        type: 'critical',
        category: 'payment_failed'
    },
    { 
        id: 'n8', 
        title: 'Ne e dor de tine!', 
        message: 'Nu ai mai ajuns la cursuri de 7 zile. Te așteptăm înapoi pe ringul de dans!', 
        timestamp: 'Săptămâna trecută', 
        read: true, 
        type: 'info',
        category: 'inactivity'
    },
    { 
        id: 'n9', 
        title: 'Anunț Important', 
        message: 'Repetițiile pentru spectacolul de Crăciun încep sâmbătă!', 
        timestamp: 'Acum 1 săptămână', 
        read: true, 
        type: 'warning',
        category: 'urgent'
    },
    { 
        id: 'n10', 
        title: 'Actualizare Regulament', 
        message: 'Am actualizat politica de recuperare a ședințelor. Vezi noile detalii.', 
        timestamp: 'Acum 2 săptămâni', 
        read: true, 
        type: 'info',
        category: 'policy'
    },
    { 
        id: 'n11', 
        title: 'Sărbători Fericite!', 
        message: 'Școala va fi închisă în perioada 24-26 Decembrie. Sărbători luminate!', 
        timestamp: 'Acum 2 săptămâni', 
        read: true, 
        type: 'info',
        category: 'holiday'
    }
];

export const MOCK_TEMPLATES: MessageTemplate[] = [
    { id: 'tpl_1', title: 'Bun venit', description: 'Mesaj standard de întâmpinare', content: 'Salut {name}, bine ai venit în comunitatea Ginga! Abia așteptăm să te vedem la dans.', category: 'welcome' },
    { id: 'tpl_2', title: 'Reminder Plată', description: 'Când expiră abonamentul', content: 'Salut {name}, abonamentul tău expiră în 3 zile. Poți reînnoi direct din app.', category: 'payment' }
];

export const MOCK_AUTOMATIONS: AutomationRule[] = [
    { id: 'auto_1', name: 'Alertă Risc Absențe', isActive: true, trigger: 'absent_consecutive', triggerValue: 3, action: 'send_notification' },
    { id: 'auto_2', name: 'Mesaj Bun Venit', isActive: true, trigger: 'new_lead', triggerValue: 1, action: 'send_message', templateId: 'tpl_1' }
];

export const MOCK_BROADCASTS: BroadcastCampaign[] = [
    { id: 'bc_1', name: 'Promoție Crăciun', targetSegment: 'all_students', status: 'sent', channel: 'email', content: 'Discount 20% la Full Pass', stats: { sent: 120, opened: 85 } },
    { id: 'bc_2', name: 'Workshop Weekend', targetSegment: 'active', status: 'scheduled', channel: 'app_notification', content: 'Workshop Bachata cu invitați speciali', scheduledDate: '2024-12-01' }
];
