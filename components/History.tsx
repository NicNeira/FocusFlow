import React, { useState, useMemo } from 'react';
import { StudySession, MonthlySummary } from '../types';
import { Clock, Calendar, BookOpen, Trash2, TrendingUp, Target, Award } from 'lucide-react';
import { getLast6Months, getSessionsByMonth } from '../services/storageService';

interface HistoryProps {
  sessions: StudySession[];
  onDeleteSession: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ sessions, onDeleteSession }) => {
  const months = useMemo(() => getLast6Months(), []);
  const [selectedMonth, setSelectedMonth] = useState(months[0]);

  // Filtrar sesiones por mes seleccionado
  const filteredSessions = useMemo(() => {
    return getSessionsByMonth(sessions, selectedMonth.month, selectedMonth.year)
      .sort((a, b) => b.endTime - a.endTime);
  }, [sessions, selectedMonth]);

  // Calcular resumen mensual
  const monthlySummary: MonthlySummary = useMemo(() => {
    const monthSessions = filteredSessions;
    const totalSeconds = monthSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    
    const byCategory: Record<string, number> = {};
    monthSessions.forEach((s) => {
      byCategory[s.subject] = (byCategory[s.subject] || 0) + s.durationSeconds;
    });

    const uniqueDays = new Set(
      monthSessions.map((s) => new Date(s.endTime).toDateString())
    );

    return {
      month: selectedMonth.month,
      year: selectedMonth.year,
      totalSeconds,
      totalSessions: monthSessions.length,
      byCategory,
      daysActive: uniqueDays.size,
    };
  }, [filteredSessions, selectedMonth]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  const formatHours = (seconds: number) => {
    return (seconds / 3600).toFixed(1);
  };

  // Colores para categorías
  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Calendar className="mr-2" /> Historial
        </h2>
        
        {/* Selector de Mes */}
        <select
          value={`${selectedMonth.month}-${selectedMonth.year}`}
          onChange={(e) => {
            const [month, year] = e.target.value.split('-').map(Number);
            const found = months.find((m) => m.month === month && m.year === year);
            if (found) setSelectedMonth(found);
          }}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
        >
          {months.map((m) => (
            <option key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Resumen Mensual */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary-500" /> Resumen de {selectedMonth.label}
        </h3>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {formatHours(monthlySummary.totalSeconds)}h
            </p>
            <p className="text-xs text-slate-500">Total Horas</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-pink-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {monthlySummary.totalSessions}
            </p>
            <p className="text-xs text-slate-500">Sesiones</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {monthlySummary.daysActive}
            </p>
            <p className="text-xs text-slate-500">Días Activos</p>
          </div>
        </div>

        {/* Distribución por Categoría */}
        {Object.keys(monthlySummary.byCategory).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
              Por Categoría
            </h4>
            <div className="space-y-2">
              {Object.entries(monthlySummary.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, seconds], index) => {
                  const percentage = (seconds / monthlySummary.totalSeconds) * 100;
                  return (
                    <div key={category} className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">
                        {category}
                      </span>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {formatHours(seconds)}h
                      </span>
                      <span className="text-xs text-slate-400 w-12 text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {monthlySummary.totalSessions === 0 && (
          <p className="text-slate-400 text-sm italic text-center py-4">
            No hay actividad registrada en este mes.
          </p>
        )}
      </div>

      {/* Lista de Sesiones */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          Sesiones ({filteredSessions.length})
        </h3>
        
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No hay sesiones en este mes.</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
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
          ))
        )}
      </div>
    </div>
  );
};

export default History;