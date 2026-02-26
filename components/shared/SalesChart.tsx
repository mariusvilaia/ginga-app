
import React from 'react';

interface SalesChartProps {
  isDarkMode: boolean;
}

export const SalesChart: React.FC<SalesChartProps> = ({ isDarkMode }) => {
  // Mock Data Points for "This Year" and "Last Year"
  const dataThisYear = [10, 25, 45, 30, 60, 75, 50, 80, 95, 85, 100, 110];
  const dataLastYear = [15, 20, 30, 25, 40, 45, 35, 50, 60, 55, 65, 70];
  
  const width = 1000;
  const height = 300;
  const padding = 20;
  const maxX = dataThisYear.length - 1;
  const maxY = 120; // Scale max

  // Bezier Curve Logic for smoother lines
  const getBezierPath = (data: number[]) => {
    let path = `M ${(0 / maxX) * (width - padding * 2) + padding} ${height - ((data[0] / maxY) * (height - padding * 2)) - padding}`;
    for (let i = 0; i < data.length - 1; i++) {
        const x0 = (i / maxX) * (width - padding * 2) + padding;
        const y0 = height - ((data[i] / maxY) * (height - padding * 2)) - padding;
        const x1 = ((i + 1) / maxX) * (width - padding * 2) + padding;
        const y1 = height - ((data[i + 1] / maxY) * (height - padding * 2)) - padding;
        const cp1x = x0 + (x1 - x0) / 2;
        const cp1y = y0;
        const cp2x = x1 - (x1 - x0) / 2;
        const cp2y = y1;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1}`;
    }
    return path;
  };

  const pathThisYear = getBezierPath(dataThisYear);
  const pathLastYear = getBezierPath(dataLastYear);

  const gridColor = isDarkMode ? "#374151" : "#f3f4f6"; // gray-700 vs gray-100
  const lastYearColor = isDarkMode ? "#6b7280" : "#cbd5e1"; // gray-500 vs slate-300
  const axisTextColor = isDarkMode ? "#9ca3af" : "#9ca3af"; // gray-400

  // Gradient definitions
  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id="gradientThisYear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines (Vertical) */}
        {dataThisYear.map((_, i) => (
          <line 
            key={i} 
            x1={(i / maxX) * (width - padding * 2) + padding} 
            y1={padding} 
            x2={(i / maxX) * (width - padding * 2) + padding} 
            y2={height - padding} 
            stroke={gridColor} 
            strokeWidth="1" 
          />
        ))}

        {/* Last Year Line */}
        <path d={pathLastYear} fill="none" stroke={lastYearColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* This Year Area Fill */}
        <path d={`${pathThisYear} L ${width - padding} ${height} L ${padding} ${height} Z`} fill="url(#gradientThisYear)" stroke="none" />
        
        {/* This Year Line */}
        <path d={pathThisYear} fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dot on the end */}
         <circle cx={(width - padding * 2) + padding} cy={height - ((dataThisYear[dataThisYear.length - 1] / maxY) * (height - padding * 2)) - padding} r="6" fill="#6366f1" stroke="white" strokeWidth="2" />

      </svg>
      <div className="flex justify-between text-xs mt-2 px-1 font-medium" style={{ color: axisTextColor }}>
        <span>Ian</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Mai</span><span>Iun</span><span>Iul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
      </div>
      <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300"><div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div> Anul curent</div>
          <div className="flex items-center text-sm font-medium text-gray-400 dark:text-gray-500"><div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></div> Anul trecut</div>
      </div>
    </div>
  );
};
