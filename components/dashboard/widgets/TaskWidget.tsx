
import React, { useState } from 'react';
import { ListTodo, Check, Plus, X } from 'lucide-react';
import { AdminTask } from '../../../types';

interface TaskWidgetProps {
    tasks: AdminTask[];
    onAddTask: (title: string) => void;
    onTaskClick?: (task: AdminTask) => void;
}

export const TaskWidget: React.FC<TaskWidgetProps> = ({ tasks, onAddTask, onTaskClick }) => {
   const [isAdding, setIsAdding] = useState(false);
   const [newTaskTitle, setNewTaskTitle] = useState('');

   const handleAdd = () => {
       if (newTaskTitle.trim()) {
           onAddTask(newTaskTitle);
           setNewTaskTitle('');
           setIsAdding(false);
       }
   };

   return (
       <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
             <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><ListTodo size={18}/> Task Manager</h3>
             <button onClick={() => setIsAdding(!isAdding)} className="text-xs font-bold text-blue-600 hover:underline">+ Add</button>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
             {isAdding && (
                 <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-top-2">
                     <input 
                        autoFocus
                        type="text" 
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="Task nou..." 
                        className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                     />
                     <button onClick={handleAdd} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={14}/></button>
                     <button onClick={() => setIsAdding(false)} className="p-2 text-gray-400 hover:text-gray-600"><X size={14}/></button>
                 </div>
             )}

             {tasks.filter(t => t.status !== 'archived').length > 0 ? tasks.filter(t => t.status !== 'archived').map(task => (
                <div 
                    key={task.id} 
                    onClick={() => onTaskClick?.(task)}
                    className={`flex items-start gap-3 group ${onTaskClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-1 -m-1 transition-colors' : ''}`}
                >
                   <button className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'}`}>
                      {task.status === 'done' && <Check size={10} className="text-white"/>}
                   </button>
                   <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate transition-all ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-200'}`}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${task.priority === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>{task.priority}</span>
                         <span className="text-[10px] text-gray-400 font-medium bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded truncate max-w-[80px]">{task.tag}</span>
                         {task.assignee && (
                             <img src={task.assignee.avatarUrl} alt={task.assignee.name} className="w-4 h-4 rounded-full ml-auto" title={task.assignee.name}/>
                         )}
                      </div>
                   </div>
                </div>
             )) : (
                 <div className="text-center py-8 text-gray-400 text-sm">
                     <p>Nu ai niciun task.</p>
                     <button onClick={() => setIsAdding(true)} className="text-blue-500 font-bold mt-2">Adaugă unul</button>
                 </div>
             )}
          </div>
       </div>
   );
};