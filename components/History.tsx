import React, { useState, useMemo } from "react";
import { StudySession, MonthlySummary } from "../types";
import {
  Clock,
  Calendar,
  BookOpen,
  Trash2,
  TrendingUp,
  Target,
  Award,
  ChevronDown,
} from "lucide-react";
import {
  getLast6Months,
  getSessionsByMonth,
} from "../services/supabaseService";

interface HistoryProps {
  sessions: StudySession[];
  onDeleteSession: (id: string) => void;
}

const COLORS = [
  "#00f5ff", // cyan
  "#ff00ff", // magenta
  "#00ff88", // lime
  "#8b5cf6", // violet
  "#fbbf24", // amber
  "#ef4444", // red
];

const History: React.FC<HistoryProps> = ({ sessions, onDeleteSession }) => {
  const months = useMemo(() => getLast6Months(), []);
  const [selectedMonth, setSelectedMonth] = useState(months[0]);

  const filteredSessions = useMemo(() => {
    return getSessionsByMonth(
      sessions,
      selectedMonth.month,
      selectedMonth.year
    ).sort((a, b) => b.endTime - a.endTime);
  }, [sessions, selectedMonth]);

  const monthlySummary: MonthlySummary = useMemo(() => {
    const monthSessions = filteredSessions;
    const totalSeconds = monthSessions.reduce(
      (acc, s) => acc + s.durationSeconds,
      0
    );

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

  const statsCards = [
    {
      icon: Clock,
      value: `${formatHours(monthlySummary.totalSeconds)}h`,
      label: "Total Horas",
      color: "var(--accent-cyan)",
      bg: "rgba(0, 245, 255, 0.1)",
    },
    {
      icon: Target,
      value: monthlySummary.totalSessions.toString(),
      label: "Sesiones",
      color: "var(--accent-magenta)",
      bg: "rgba(255, 0, 255, 0.1)",
    },
    {
      icon: Award,
      value: monthlySummary.daysActive.toString(),
      label: "Días Activos",
      color: "var(--accent-lime)",
      bg: "rgba(0, 255, 136, 0.1)",
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h2
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Historial
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          Revisa tus sesiones de estudio anteriores
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <select
            value={`${selectedMonth.month}-${selectedMonth.year}`}
            onChange={(e) => {
              const [month, year] = e.target.value.split("-").map(Number);
              const found = months.find(
                (m) => m.month === month && m.year === year
              );
              if (found) setSelectedMonth(found);
            }}
            className="appearance-none px-6 py-3 pr-12 rounded-xl text-sm font-semibold cursor-pointer outline-none transition-all"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-primary)",
            }}
          >
            {months.map((m) => (
              <option key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </div>

      {/* Monthly Summary */}
      <div
        className="glass-card p-6 animate-fade-in-up"
        style={{ animationDelay: "0.1s" }}
      >
        <h3
          className="text-lg font-semibold mb-6 flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(139, 92, 246, 0.1)" }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: "var(--accent-violet)" }} />
          </div>
          Resumen de {selectedMonth.label}
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {statsCards.map(({ icon: Icon, value, label, color, bg }) => (
            <div
              key={label}
              className="rounded-xl p-4 text-center transition-transform hover:scale-105"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div
                className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ background: bg }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p
                className="text-2xl font-bold font-mono"
                style={{ color: "var(--text-primary)" }}
              >
                {value}
              </p>
              <p
                className="text-xs uppercase tracking-wider mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Category Distribution */}
        {Object.keys(monthlySummary.byCategory).length > 0 && (
          <div
            className="pt-6"
            style={{ borderTop: "1px solid var(--glass-border)" }}
          >
            <h4
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text-secondary)" }}
            >
              Por Categoría
            </h4>
            <div className="space-y-3">
              {Object.entries(monthlySummary.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, seconds], index) => {
                  const percentage =
                    (seconds / monthlySummary.totalSeconds) * 100;
                  return (
                    <div key={category} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                              boxShadow: `0 0 8px ${COLORS[index % COLORS.length]}`,
                            }}
                          />
                          <span
                            className="text-sm truncate max-w-[150px]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-sm font-mono"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {formatHours(seconds)}h
                          </span>
                          <span
                            className="text-xs w-10 text-right"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div
                        className="w-full h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-elevated)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            background: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {monthlySummary.totalSessions === 0 && (
          <div
            className="text-center py-8"
            style={{ color: "var(--text-muted)" }}
          >
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay actividad registrada en este mes</p>
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        <h3
          className="text-lg font-semibold flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          Sesiones
          <span
            className="text-sm font-mono px-2 py-0.5 rounded-full"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-muted)",
            }}
          >
            {filteredSessions.length}
          </span>
        </h3>

        {filteredSessions.length === 0 ? (
          <div
            className="glass-card flex flex-col items-center justify-center py-12 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <BookOpen
              className="w-12 h-12 mb-3 opacity-30"
              style={{ color: "var(--text-muted)" }}
            />
            <p style={{ color: "var(--text-muted)" }}>
              No hay sesiones en este mes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session, index) => (
              <div
                key={session.id}
                className="glass-card p-4 flex items-center justify-between group animate-fade-in-up hover:scale-[1.01] transition-transform"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0, 245, 255, 0.1)" }}
                  >
                    <BookOpen
                      className="w-5 h-5"
                      style={{ color: "var(--accent-cyan)" }}
                    />
                  </div>

                  {/* Info */}
                  <div>
                    <h4
                      className="font-semibold text-base"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {session.subject}
                    </h4>
                    <div
                      className="flex items-center gap-3 text-sm mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.endTime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {session.notes && (
                      <p
                        className="text-xs mt-1 line-clamp-1 italic"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {session.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Duration & Delete */}
                <div className="flex items-center gap-4">
                  <span
                    className="font-mono font-bold text-lg"
                    style={{ color: "var(--accent-cyan)" }}
                  >
                    {formatDuration(session.durationSeconds)}
                  </span>
                  <button
                    onClick={() => onDeleteSession(session.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all hover:scale-110"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--status-error)",
                    }}
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
