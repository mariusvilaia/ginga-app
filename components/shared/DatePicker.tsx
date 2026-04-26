
import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DatePickerProps {
  date: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ date, onChange, className }) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-900 dark:text-white w-full min-w-[220px]",
            className
          )}
        >
          <span>{format(date, 'd MMMM yyyy', { locale: ro })}</span>
          <CalendarIcon size={18} className="text-gray-400" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 bg-white dark:bg-gray-950 p-0 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200"
          align="end"
          sideOffset={8}
        >
          <div className="p-3">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(d) => d && onChange(d)}
              locale={ro}
              showOutsideDays
              components={{
                Chevron: (props) => {
                  if (props.orientation === 'left') return <ChevronLeft className="h-4 w-4" />;
                  return <ChevronRight className="h-4 w-4" />;
                }
              }}
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
