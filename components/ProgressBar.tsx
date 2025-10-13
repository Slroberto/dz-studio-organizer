
import React from 'react';

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-granite-gray-light">Progresso</span>
        <span className="text-xs font-bold text-gray-300">{clampedProgress}%</span>
      </div>
      <div className="w-full bg-granite-gray/20 rounded-full h-2">
        <div
          className="bg-cadmium-yellow h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
    </div>
  );
};