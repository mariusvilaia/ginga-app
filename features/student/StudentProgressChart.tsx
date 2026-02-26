
import React, { useState, useRef, useEffect } from 'react';

interface ChartPoint {
  label: string;
  value: number;
}

interface StudentProgressChartProps {
  data: ChartPoint[];
  color?: string;
  title: string;
  activeMetric: 'hours' | 'classes';
  onMetricChange: (metric: 'hours' | 'classes') => void;
}

export const StudentProgressChart: React.FC<StudentProgressChartProps> = ({ 
  data, 
  color = '#6366f1', 
  title,
  activeMetric,
  onMetricChange
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
        if(containerRef.current) setWidth(containerRef.current.offsetWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const height = 200;
  const paddingX = 20;
  const paddingY = 40;
  const effectiveWidth = width - (paddingX * 2);
  const effectiveHeight = height - (paddingY * 2);

  const maxValue = Math.max(...data.map(d => d.value)) * 1.2 || 10;

  const getX = (index: number) => paddingX + (index / (data.length - 1)) * effectiveWidth;
  const getY = (value: number) => height - paddingY - (value / maxValue) * effectiveHeight;

  const generatePath = (isArea = false) => {
    if (data.length === 0) return '';
    let path = `M ${getX(0)} ${getY(data[0].value)}`;
    for (let i = 0; i < data.length - 1; i++) {
        const x0 = getX(i);
        const y0 = getY(data[i].value);
        const x1 = getX(i + 1);
        const y1 = getY(data[i + 1].value);
        const cp1x = x0 + (x1 - x0) / 2;
        const cp1y = y0;
        const cp2x = x1 - (x1 - x0) / 2;
        const cp2y = y1;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1}`;
    }
    if (isArea) {
        path += ` L ${getX(data.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`;
    }
    return path;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left - paddingX;
      const index = Math.round((x / effectiveWidth) * (data.length - 1));
      if (index >= 0 && index < data.length) setHoveredIndex(index);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h3 className="text-lg font-black text-gray-900">{title}</h3>
                <p className="text-xs text-gray-500 font-medium">Evoluție lunară (Engagement)</p>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                <button 
                    onClick={() => onMetricChange('hours')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeMetric === 'hours' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Ore
                </button>
                <button 
                    onClick={() => onMetricChange('classes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeMetric === 'classes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Clase
                </button>
            </div>
        </div>

        <div 
            ref={containerRef} 
            className="w-full relative h-[200px] cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
        >
            {width > 0 && (
                <svg width={width} height={height} className="overflow-visible">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {[0, 0.5, 1].map((tick) => {
                        const y = height - paddingY - (tick * effectiveHeight);
                        return (
                            <line key={tick} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />
                        );
                    })}
                    <path d={generatePath(true)} fill="url(#chartGradient)" stroke="none" />
                    <path d={generatePath(false)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {data.map((point, i) => (
                        <g key={i}>
                            <text x={getX(i)} y={height - 10} textAnchor="middle" fontSize="10" fill={hoveredIndex === i ? '#111827' : '#9ca3af'} fontWeight="700">
                                {point.label}
                            </text>
                            <circle cx={getX(i)} cy={getY(point.value)} r={hoveredIndex === i ? 6 : 0} fill="white" stroke={color} strokeWidth={3} className="transition-all" />
                        </g>
                    ))}
                    {hoveredIndex !== null && (
                        <g transform={`translate(${getX(hoveredIndex)}, ${getY(data[hoveredIndex].value) - 35})`}>
                            <rect x="-30" y="-15" width="60" height="30" rx="8" fill="#111827" />
                            <text x="0" y="4" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                                {data[hoveredIndex].value}
                            </text>
                        </g>
                    )}
                </svg>
            )}
        </div>
    </div>
  );
};
