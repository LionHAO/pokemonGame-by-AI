import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  label?: string;
}

const HealthBar: React.FC<HealthBarProps> = ({ current, max, label }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  let colorClass = 'bg-green-500';
  if (percentage < 50) colorClass = 'bg-yellow-400';
  if (percentage < 20) colorClass = 'bg-red-500';

  return (
    <div className="w-full max-w-xs bg-gray-800 bg-opacity-80 rounded-lg p-3 border-2 border-gray-600 shadow-lg">
      <div className="flex justify-between items-end mb-1">
        <span className="text-white font-bold text-sm tracking-wider uppercase">{label}</span>
        <span className="text-gray-300 text-xs">{current}/{max} HP</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4 border border-gray-600 overflow-hidden relative">
         {/* Background HP text pattern or shine could go here */}
        <div 
          className={`h-full ${colorClass} transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default HealthBar;