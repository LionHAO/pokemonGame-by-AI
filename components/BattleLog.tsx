import React, { useEffect, useRef } from 'react';

interface BattleLogProps {
  logs: string[];
}

const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-gray-900 border-2 border-blue-500 rounded-lg p-4 h-32 overflow-y-auto shadow-inner bg-opacity-90">
      {logs.length === 0 ? (
        <p className="text-gray-500 italic text-sm">等待战斗开始...</p>
      ) : (
        logs.map((log, idx) => (
          <div key={idx} className="mb-2 last:mb-0">
            <p className="text-white text-sm font-medium tracking-wide leading-relaxed">
              <span className="text-blue-400 mr-2">➤</span>
              {log}
            </p>
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
};

export default BattleLog;