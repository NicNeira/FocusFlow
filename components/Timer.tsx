import React from 'react';
import { Play, Pause, StopCircle, Save } from 'lucide-react';

interface TimerProps {
  isRunning: boolean;
  elapsedSeconds: number;
  subject: string;
  notes: string;
  onSubjectChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSave: () => void;
}

const Timer: React.FC<TimerProps> = ({ 
  isRunning, 
  elapsedSeconds, 
  subject, 
  notes,
  onSubjectChange,
  onNotesChange,
  onStart, 
  onPause, 
  onReset, 
  onSave 
}) => {
  
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-6 animate-fade-in">
      <div className="relative mb-8 group">
        <div className={`absolute -inset-1 bg-gradient-to-r from-primary-600 to-blue-600 rounded-full blur transition duration-1000 ${isRunning ? 'opacity-75' : 'opacity-25'}`}></div>
        <div className="relative bg-white dark:bg-slate-900 rounded-full w-72 h-72 flex items-center justify-center border-4 border-slate-100 dark:border-slate-800 shadow-xl">
           <span className="text-5xl font-mono font-bold text-slate-800 dark:text-slate-100 tracking-wider">
             {formatTime(elapsedSeconds)}
           </span>
        </div>
      </div>

      <div className="w-full space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Asignatura</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            disabled={isRunning || elapsedSeconds > 0}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all disabled:opacity-60"
            placeholder="Ej. Matemáticas"
          />
        </div>

        <div className="flex justify-center space-x-4 pt-4">
          {!isRunning ? (
             <button
              onClick={onStart}
              className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-bold shadow-lg transform active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 mr-2" fill="currentColor" />
              {elapsedSeconds > 0 ? 'Reanudar' : 'Iniciar'}
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold shadow-lg transform active:scale-95 transition-all"
            >
              <Pause className="w-5 h-5 mr-2" fill="currentColor" />
              Pausar
            </button>
          )}

          {elapsedSeconds > 0 && !isRunning && (
             <button
             onClick={onSave}
             className="flex items-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold shadow-lg transform active:scale-95 transition-all"
           >
             <Save className="w-5 h-5 mr-2" />
             Guardar
           </button>
          )}
           
           {elapsedSeconds > 0 && !isRunning && (
            <button
              onClick={onReset}
              className="flex items-center px-4 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-bold transition-all"
              title="Reiniciar"
            >
              <StopCircle className="w-5 h-5" />
            </button>
           )}
        </div>
        
        <div className="pt-4">
            <textarea 
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Notas de la sesión (opcional)..."
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                rows={2}
            />
        </div>
      </div>
    </div>
  );
};

export default Timer;