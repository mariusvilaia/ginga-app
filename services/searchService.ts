
import { 
    GlobalSearchResult, 
    StudentDetailedProfile, 
    InstructorProfile, 
    GroupDetailedProfile, 
    Lead, 
    AdminTask, 
    ChatConversation,
    SearchResultType
} from '../types';
import { normalizeText, smartSearch } from '../utils/searchUtils';

interface SearchContext {
    students: StudentDetailedProfile[];
    instructors: InstructorProfile[];
    groups: GroupDetailedProfile[];
    leads: Lead[];
    tasks: AdminTask[];
    conversations: ChatConversation[];
}

export const searchGlobal = (query: string, data: SearchContext): Record<SearchResultType, GlobalSearchResult[]> => {
    if (!query || query.trim().length < 2) {
        return {
            student: [],
            instructor: [],
            group: [],
            lead: [],
            task: [],
            message: []
        };
    }

    const q = normalizeText(query);
    const results: Record<SearchResultType, GlobalSearchResult[]> = {
        student: [],
        instructor: [],
        group: [],
        lead: [],
        task: [],
        message: []
    };

    // 1. Students (Members)
    data.students.forEach(s => {
        const nameMatch = smartSearch(query, s.name);
        const emailMatch = smartSearch(query, s.email);
        const phoneMatch = String(s.phone || '').replace(/\s/g, '').includes(q.replace(/\s/g, ''));
        const subMatch = normalizeText(s.subscription?.type).includes(q);

        if (nameMatch || emailMatch || phoneMatch || subMatch) {
            let subtitle = s.mainGroup || 'Student';
            if (subMatch) subtitle = `Abonament ${s.subscription.type}`;
            else if (phoneMatch) subtitle = s.phone;
            
            results.student.push({
                id: s.id,
                type: 'student',
                title: s.name,
                subtitle,
                route: 'members',
                avatarUrl: s.avatarUrl,
                metadata: { status: s.status }
            });
        }
    });

    // 2. Instructors
    data.instructors.forEach(i => {
        if (smartSearch(query, i.name) || smartSearch(query, i.email)) {
            results.instructor.push({
                id: i.id,
                type: 'instructor',
                title: i.name,
                subtitle: `Instructor • ${(i.styles || []).join(', ')}`,
                route: 'instructors',
                avatarUrl: i.avatarUrl,
                metadata: { status: i.status }
            });
        }
    });

    // 3. Groups
    data.groups.forEach(g => {
        if (smartSearch(query, g.name) || normalizeText(g.style).includes(q)) {
            results.group.push({
                id: g.id,
                type: 'group',
                title: g.name,
                subtitle: `${g.schedule.day} • ${g.schedule.time}`,
                route: 'groups',
                metadata: { status: g.level }
            });
        }
    });

    // 4. Leads
    data.leads.forEach(l => {
        if (smartSearch(query, l.name) || smartSearch(query, l.email) || normalizeText(l.phone).includes(q)) {
            results.lead.push({
                id: l.id,
                type: 'lead',
                title: l.name,
                subtitle: `Lead • ${l.stage}`,
                route: 'leads',
                avatarUrl: l.avatarUrl,
                metadata: { status: l.stage }
            });
        }
    });

    // 5. Tasks
    data.tasks.forEach(t => {
        if (smartSearch(query, t.title) || normalizeText(t.tag).includes(q)) {
            results.task.push({
                id: t.id,
                type: 'task',
                title: t.title,
                subtitle: `Task • ${t.priority}`,
                route: 'tasks',
                metadata: { priority: t.priority, status: t.status }
            });
        }
    });

    // 6. Messages (Conversations)
    data.conversations.forEach(c => {
        if (smartSearch(query, c.name) || normalizeText(c.lastMessage).includes(q)) {
            results.message.push({
                id: c.id,
                type: 'message',
                title: c.name,
                subtitle: c.lastMessage,
                route: 'communications',
                avatarUrl: c.avatarUrl,
                metadata: { tag: c.type }
            });
        }
    });

    // Limit results per category for performance and UI cleanliness
    const LIMIT = 5;
    return {
        student: results.student.slice(0, LIMIT),
        instructor: results.instructor.slice(0, LIMIT),
        group: results.group.slice(0, LIMIT),
        lead: results.lead.slice(0, LIMIT),
        task: results.task.slice(0, LIMIT),
        message: results.message.slice(0, LIMIT)
    };
};

export const getHighlightedText = (text: any, highlight: any) => {
    if (text === null || text === undefined) return '';
    const strText = String(text);
    const strHighlight = String(highlight || '');
    
    if (!strHighlight.trim()) return strText;
    
    // Escape regex special characters
    const escapedHighlight = strHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = strText.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    
    return parts.map((part, i) => {
        if (part.toLowerCase() === strHighlight.toLowerCase()) {
            return `<span class="bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 font-bold rounded-sm px-0.5">${part}</span>`;
        }
        return part;
    }).join('');
};
