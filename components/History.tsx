import React from 'react';
import { StudySession } from '../types';
import { Clock, Calendar, BookOpen, Trash2 } from 'lucide-react';

interface HistoryProps {
  sessions: StudySession[];
  onDeleteSession: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ sessions, onDeleteSession }) => {
  const sortedSessions = [...sessions].sort((a, b) => b.endTime - a.endTime);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <BookOpen className="w-12 h-12 mb-4 opacity-50" />
        <p>No hay sesiones registradas.</p>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Calendar className="mr-2" /> Historial
      </h2>
      <div className="space-y-3">
        {sortedSessions.map((session) => (
          <div 
            key={session.id} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{session.subject}</h3>
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 space-x-3">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {new Date(session.endTime).toLocaleDateString()}</span>
                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                {session.notes && <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">{session.notes}</p>}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="font-mono font-bold text-lg text-primary-600 dark:text-primary-400">
                {formatDuration(session.durationSeconds)}
              </span>
              <button 
                onClick={() => onDeleteSession(session.id)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Eliminar registro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;