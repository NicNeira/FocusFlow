import React, { useState, useMemo } from "react";
import { StudySession, Objective, WeeklyGoalsByCategory } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Clock,
  Target,
  Award,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  ListTodo,
  Layers,
  Sparkles,
} from "lucide-react";

interface DashboardProps {
  sessions: StudySession[];
  objectives: Objective[];
  weeklyTarget: number;
  categories: string[];
  categoryGoals: WeeklyGoalsByCategory;
  onAddObjective: (text: string) => void;
  onToggleObjective: (id: string) => void;
  onDeleteObjective: (id: string) => void;
  onDeleteCategory: (category: string) => void;
  onUpdateWeeklyTarget: (hours: number) => void;
  onUpdateCategoryGoals: (goals: WeeklyGoalsByCategory) => void;
}

const COLORS = [
  "#00f5ff", // cyan
  "#ff00ff", // magenta
  "#00ff88", // lime
  "#8b5cf6", // violet
  "#fbbf24", // amber
  "#ef4444", // red
];

const Dashboard: React.FC<DashboardProps> = ({
  sessions,
  objectives,
  weeklyTarget,
  categories,
  categoryGoals,
  onAddObjective,
  onToggleObjective,
  onDeleteObjective,
  onDeleteCategory,
  onUpdateWeeklyTarget,
  onUpdateCategoryGoals,
}) => {
  const [newObjective, setNewObjective] = useState("");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(weeklyTarget.toString());
  const [editingCategoryGoal, setEditingCategoryGoal] = useState<string | null>(
    null
  );
  const [tempCategoryGoal, setTempCategoryGoal] = useState("");

  // Helper function: obtiene el tiempo de trabajo efectivo (para retrocompatibilidad)
  const getWorkDuration = (session: StudySession): number => {
    return session.workDurationSeconds ?? session.durationSeconds;
  };

  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const totalSessions = sessions.length;

  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    // Usar workDurationSeconds para las metas (solo tiempo de trabajo efectivo)
    const weeklySeconds = sessions
      .filter((s) => s.endTime >= startOfWeek.getTime())
      .reduce((acc, s) => acc + getWorkDuration(s), 0);

    return {
      seconds: weeklySeconds,
      hours: parseFloat((weeklySeconds / 3600).toFixed(1)),
      percentage: Math.min(100, (weeklySeconds / 3600 / weeklyTarget) * 100),
    };
  }, [sessions, weeklyTarget]);

  const daysActive = useMemo(() => {
    if (sessions.length === 0) return 0;
    const sortedDates = [
      ...new Set(sessions.map((s) => new Date(s.endTime).toDateString())),
    ];
    return sortedDates.length;
  }, [sessions]);

  const objectivesStats = useMemo(() => {
    const total = objectives.length;
    const completed = objectives.filter((o) => o.isCompleted).length;
    const percentage = total === 0 ? 0 : (completed / total) * 100;
    return { total, completed, percentage };
  }, [objectives]);

  const subjectData = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      // Usar tiempo de trabajo efectivo para las estadísticas
      map[s.subject] = (map[s.subject] || 0) + getWorkDuration(s);
    });
    return Object.keys(map)
      .map((key) => ({
        name: key,
        value: parseFloat((map[key] / 3600).toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [sessions]);

  const weeklyData = useMemo(() => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    return last7Days.map((date) => {
      const dateStr = date.toLocaleDateString();
      // Usar tiempo de trabajo efectivo para los gráficos
      const dayTotal = sessions
        .filter((s) => new Date(s.endTime).toLocaleDateString() === dateStr)
        .reduce((acc, s) => acc + getWorkDuration(s), 0);
      return {
        day: days[date.getDay()],
        hours: parseFloat((dayTotal / 3600).toFixed(2)),
      };
    });
  }, [sessions]);

  const categoryProgress = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const weekSessions = sessions.filter(
      (s) => s.endTime >= startOfWeek.getTime()
    );

    const progress: Record<string, { current: number; target: number }> = {};

    categories.forEach((cat) => {
      // Usar tiempo de trabajo efectivo para las metas por categoría
      const catSeconds = weekSessions
        .filter((s) => s.subject === cat)
        .reduce((acc, s) => acc + getWorkDuration(s), 0);
      progress[cat] = {
        current: parseFloat((catSeconds / 3600).toFixed(2)),
        target: categoryGoals[cat] || 0,
      };
    });

    return progress;
  }, [sessions, categories, categoryGoals]);

  const formatHoursLong = (value: number): string => {
    const h = Math.floor(value);
    const m = Math.round((value % 1) * 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const handleSaveCategoryGoal = (category: string) => {
    const val = parseFloat(tempCategoryGoal);
    if (!isNaN(val) && val >= 0) {
      onUpdateCategoryGoals({ ...categoryGoals, [category]: val });
    }
    setEditingCategoryGoal(null);
  };

  const handleAddObjectiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newObjective.trim()) {
      onAddObjective(newObjective.trim());
      setNewObjective("");
    }
  };

  const saveTarget = () => {
    const val = parseFloat(tempTarget);
    if (!isNaN(val) && val > 0) {
      onUpdateWeeklyTarget(val);
    }
    setIsEditingTarget(false);
  };

  const statsCards = [
    {
      icon: Clock,
      label: "Tiempo Total",
      value: `${totalHours}h`,
      color: "var(--accent-cyan)",
      bg: "rgba(0, 245, 255, 0.1)",
    },
    {
      icon: CheckCircle2,
      label: "Sesiones",
      value: totalSessions.toString(),
      color: "var(--accent-magenta)",
      bg: "rgba(255, 0, 255, 0.1)",
    },
    {
      icon: Award,
      label: "Días Activos",
      value: daysActive.toString(),
      color: "var(--accent-lime)",
      bg: "rgba(0, 255, 136, 0.1)",
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h2
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Dashboard
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          Visualiza tu progreso y mantén el enfoque
        </p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map(({ icon: Icon, label, value, color, bg }, index) => (
          <div
            key={label}
            className="glass-card p-6 flex items-center gap-4 hover:scale-[1.02] transition-transform animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: bg }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div>
              <p
                className="text-xs uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </p>
              <h3
                className="text-3xl font-bold font-mono"
                style={{ color: "var(--text-primary)" }}
              >
                {value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Goals & Objectives Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Goal Card */}
        <div
          className="glass-card p-6 animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3
              className="text-lg font-semibold flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(0, 245, 255, 0.1)" }}
              >
                <Target className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
              </div>
              Meta Semanal
            </h3>
            {!isEditingTarget ? (
              <button
                onClick={() => setIsEditingTarget(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-muted)",
                }}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={saveTarget}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: "var(--accent-lime)",
                  color: "var(--bg-base)",
                }}
              >
                Guardar
              </button>
            )}
          </div>

          <div className="flex flex-col items-center">
            {isEditingTarget ? (
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="number"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(e.target.value)}
                  className="w-24 p-3 rounded-xl text-center font-mono font-bold text-xl"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-primary)",
                  }}
                  autoFocus
                />
                <span style={{ color: "var(--text-muted)" }}>hrs</span>
              </div>
            ) : (
              <div className="mb-4">
                <span
                  className="text-5xl font-bold font-mono"
                  style={{ color: "var(--accent-cyan)" }}
                >
                  {weeklyProgress.hours}
                </span>
                <span
                  className="text-xl ml-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  / {weeklyTarget}h
                </span>
              </div>
            )}

            {/* Progress Bar */}
            <div
              className="w-full h-3 rounded-full overflow-hidden mb-3"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${weeklyProgress.percentage}%`,
                  background: weeklyProgress.percentage >= 100
                    ? "var(--accent-lime)"
                    : "linear-gradient(90deg, var(--accent-cyan), var(--accent-magenta))",
                  boxShadow: weeklyProgress.percentage >= 100
                    ? "var(--glow-lime)"
                    : "0 0 20px rgba(0, 245, 255, 0.4)",
                }}
              />
            </div>

            <p
              className="text-sm text-center flex items-center gap-2"
              style={{ color: "var(--text-muted)" }}
            >
              {weeklyProgress.percentage >= 100 ? (
                <>
                  <Sparkles className="w-4 h-4" style={{ color: "var(--accent-lime)" }} />
                  <span style={{ color: "var(--accent-lime)" }}>
                    ¡Meta alcanzada!
                  </span>
                </>
              ) : (
                `Te faltan ${(weeklyTarget - weeklyProgress.hours).toFixed(1)}h para tu meta`
              )}
            </p>
          </div>

          {/* Category Goals */}
          {categories.length > 0 && (
            <div
              className="mt-6 pt-6"
              style={{ borderTop: "1px solid var(--glass-border)" }}
            >
              <h4
                className="text-sm font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--text-secondary)" }}
              >
                <Layers className="w-4 h-4" style={{ color: "var(--accent-lime)" }} />
                Por Categoría
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {categories.map((category) => {
                  const progress = categoryProgress[category] || {
                    current: 0,
                    target: 0,
                  };
                  const percentage =
                    progress.target > 0
                      ? Math.min(100, (progress.current / progress.target) * 100)
                      : 0;

                  return (
                    <div key={category} className="space-y-1.5 group/category-item">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className="text-sm font-medium truncate max-w-[120px]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {category}
                          </span>

                          {/* Delete button */}
                          <button
                            onClick={() => onDeleteCategory(category)}
                            className="opacity-0 group-hover/category-item:opacity-100 p-1 rounded transition-all hover:scale-110"
                            style={{ color: "var(--status-error)" }}
                            title={`Eliminar ${category}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {editingCategoryGoal === category ? (
                            <>
                              <input
                                type="number"
                                value={tempCategoryGoal}
                                onChange={(e) => setTempCategoryGoal(e.target.value)}
                                className="w-14 p-1.5 text-xs rounded-lg text-center font-mono"
                                style={{
                                  background: "var(--bg-elevated)",
                                  border: "1px solid var(--glass-border)",
                                  color: "var(--text-primary)",
                                }}
                                min="0"
                                step="0.5"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveCategoryGoal(category)}
                                className="px-2 py-1 rounded text-xs font-semibold"
                                style={{
                                  background: "var(--accent-lime)",
                                  color: "var(--bg-base)",
                                }}
                              >
                                OK
                              </button>
                            </>
                          ) : (
                            <>
                              <span
                                className="text-xs font-mono"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {progress.current}h / {progress.target > 0 ? `${progress.target}h` : "-"}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingCategoryGoal(category);
                                  setTempCategoryGoal(progress.target.toString());
                                }}
                                className="p-1 rounded hover:scale-110 transition-transform"
                                style={{ color: "var(--text-muted)" }}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
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
                            background: percentage >= 100 ? "var(--accent-lime)" : "var(--accent-cyan)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* To-Do List */}
        <div
          className="glass-card p-6 flex flex-col animate-fade-in-up"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className="text-lg font-semibold flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255, 0, 255, 0.1)" }}
              >
                <ListTodo className="w-4 h-4" style={{ color: "var(--accent-magenta)" }} />
              </div>
              To-Do List
            </h3>
            <span
              className="text-sm font-bold font-mono px-3 py-1 rounded-full"
              style={{
                background: "rgba(255, 0, 255, 0.1)",
                color: "var(--accent-magenta)",
              }}
            >
              {Math.round(objectivesStats.percentage)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className="w-full h-2 rounded-full overflow-hidden mb-4"
            style={{ background: "var(--bg-elevated)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${objectivesStats.percentage}%`,
                background: "var(--accent-magenta)",
                boxShadow: "var(--glow-magenta)",
              }}
            />
          </div>

          {/* Objectives List */}
          <div className="flex-1 overflow-y-auto max-h-60 space-y-2 mb-4 pr-1">
            {objectives.length === 0 ? (
              <div
                className="text-center py-8"
                style={{ color: "var(--text-muted)" }}
              >
                <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Agrega tareas para mantenerte organizado</p>
              </div>
            ) : (
              objectives.map((obj) => (
                <div
                  key={obj.id}
                  className="group flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{
                    background: obj.isCompleted ? "var(--bg-elevated)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!obj.isCompleted) {
                      e.currentTarget.style.background = "var(--bg-elevated)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!obj.isCompleted) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button
                      onClick={() => onToggleObjective(obj.id)}
                      className="flex-shrink-0 transition-transform hover:scale-110"
                    >
                      {obj.isCompleted ? (
                        <CheckSquare
                          className="w-5 h-5"
                          style={{ color: "var(--accent-magenta)" }}
                        />
                      ) : (
                        <Square
                          className="w-5 h-5"
                          style={{ color: "var(--text-muted)" }}
                        />
                      )}
                    </button>
                    <span
                      className={`text-sm truncate ${obj.isCompleted ? "line-through" : ""}`}
                      style={{
                        color: obj.isCompleted ? "var(--text-muted)" : "var(--text-secondary)",
                      }}
                    >
                      {obj.text}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteObjective(obj.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all hover:scale-110"
                    style={{ color: "var(--status-error)" }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Task Form */}
          <form onSubmit={handleAddObjectiveSubmit} className="relative mt-auto">
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Nueva tarea..."
              className="w-full pl-4 pr-12 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: "var(--accent-magenta)",
                color: "var(--bg-base)",
              }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <div
          className="glass-card p-6 animate-fade-in-up"
          style={{ animationDelay: "0.5s" }}
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
            Actividad Semanal
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis
                  dataKey="day"
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--bg-surface)",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
                  }}
                  labelStyle={{
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    marginBottom: "4px"
                  }}
                  itemStyle={{
                    color: "var(--accent-cyan)",
                    fontSize: "14px"
                  }}
                  cursor={{ fill: "rgba(0, 245, 255, 0.1)" }}
                  formatter={(value: number) => [formatHoursLong(value), "Tiempo"]}
                />
                <Bar
                  dataKey="hours"
                  fill="var(--accent-cyan)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Distribution */}
        <div
          className="glass-card p-6 animate-fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          <h3
            className="text-lg font-semibold mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            Distribución por Categoría
          </h3>
          <div className="h-64">
            {subjectData.length === 0 ? (
              <div
                className="h-full flex flex-col items-center justify-center"
                style={{ color: "var(--text-muted)" }}
              >
                <Layers className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Sin datos aún</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {subjectData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--glass-border)",
                      background: "var(--bg-surface)",
                      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
                    }}
                    labelStyle={{
                      color: "var(--text-primary)",
                      fontWeight: 600,
                      marginBottom: "4px"
                    }}
                    itemStyle={{
                      color: "var(--text-secondary)",
                      fontSize: "14px"
                    }}
                    formatter={(value: number) => [formatHoursLong(value), "Tiempo"]}
                  />
                  <Legend
                    wrapperStyle={{ color: "var(--text-secondary)" }}
                    formatter={(value) => (
                      <span style={{ color: "var(--text-secondary)" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
