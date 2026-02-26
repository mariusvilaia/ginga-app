
import React from 'react';
import { ListTodo, Check } from 'lucide-react';
import { MOCK_ADMIN_TASKS } from '../../../../constants';

export const TaskWidget: React.FC = () => (
   <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 h-full">
      <div className="flex justify-between items-center mb-4">
         <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><ListTodo size={18}/> Task Manager</h3>
         <button className="text-xs font-bold text-blue-600 hover:underline">+ Add</button>
      </div>
      <div className="space-y-3">
         {MOCK_ADMIN_TASKS.slice(0, 4).map(task => (
            <div key={task.id} className="flex items-start gap-3 group">
               <button className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'}`}>
                  {task.status === 'done' && <Check size={10} className="text-white"/>}
               </button>
               <div className="flex-1">
                  <p className={`text-sm font-medium transition-all ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-200'}`}>{task.title}</p>
                  <div className="flex gap-2 mt-1">
                     <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${task.priority === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>{task.priority}</span>
                     <span className="text-[10px] text-gray-400 font-medium bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">{task.tag}</span>
                  </div>
               </div>
            </div>
         ))}
      </div>
   </div>
);
