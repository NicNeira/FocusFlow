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
  onUpdateWeeklyTarget: (hours: number) => void;
  onUpdateCategoryGoals: (goals: WeeklyGoalsByCategory) => void;
}

const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#6366f1",
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
  onUpdateWeeklyTarget,
  onUpdateCategoryGoals,
}) => {
  const [newObjective, setNewObjective] = useState("");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(weeklyTarget.toString());
  const [editingCategoryGoal, setEditingCategoryGoal] = useState<string | null>(null);
  const [tempCategoryGoal, setTempCategoryGoal] = useState("");

  // Stats Calculations
  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const totalSessions = sessions.length;

  // Calculate Weekly Progress
  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    // Adjust to Monday (1) or Sunday (0). Assuming Monday is start of week for study logic
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const weeklySeconds = sessions
      .filter((s) => s.endTime >= startOfWeek.getTime())
      .reduce((acc, s) => acc + s.durationSeconds, 0);

    return {
      seconds: weeklySeconds,
      hours: parseFloat((weeklySeconds / 3600).toFixed(1)),
      percentage: Math.min(100, (weeklySeconds / 3600 / weeklyTarget) * 100),
    };
  }, [sessions, weeklyTarget]);

  // Calculate Streak
  const daysActive = useMemo(() => {
    if (sessions.length === 0) return 0;
    const sortedDates = [
      ...new Set(sessions.map((s) => new Date(s.endTime).toDateString())),
    ];
    return sortedDates.length;
  }, [sessions]);

  // Objectives Progress
  const objectivesStats = useMemo(() => {
    const total = objectives.length;
    const completed = objectives.filter((o) => o.isCompleted).length;
    const percentage = total === 0 ? 0 : (completed / total) * 100;
    return { total, completed, percentage };
  }, [objectives]);

  // Data for Charts
  const subjectData = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      map[s.subject] = (map[s.subject] || 0) + s.durationSeconds;
    });
    return Object.keys(map)
      .map((key) => ({
        name: key,
        value: parseFloat((map[key] / 3600).toFixed(2)), // hours
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
      const dayTotal = sessions
        .filter((s) => new Date(s.endTime).toLocaleDateString() === dateStr)
        .reduce((acc, s) => acc + s.durationSeconds, 0);
      return {
        day: days[date.getDay()],
        hours: parseFloat((dayTotal / 3600).toFixed(2)),
      };
    });
  }, [sessions]);

  // Calcular progreso por categoría para la semana actual
  const categoryProgress = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const weekSessions = sessions.filter((s) => s.endTime >= startOfWeek.getTime());
    
    const progress: Record<string, { current: number; target: number }> = {};
    
    categories.forEach((cat) => {
      const catSeconds = weekSessions
        .filter((s) => s.subject === cat)
        .reduce((acc, s) => acc + s.durationSeconds, 0);
      progress[cat] = {
        current: parseFloat((catSeconds / 3600).toFixed(2)),
        target: categoryGoals[cat] || 0,
      };
    });
    
    return progress;
  }, [sessions, categories, categoryGoals]);

  // Formatter para tooltip que muestra formato largo
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

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tiempo Total
            </p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {totalHours} hrs
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sesiones
            </p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {totalSessions}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Días Activos
            </p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {daysActive}
            </h3>
          </div>
        </div>
      </div>

      {/* Goals & Objectives Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Goal Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Target className="w-5 h-5 mr-2 text-primary-500" /> Meta Semanal
            </h3>
            {!isEditingTarget ? (
              <button
                onClick={() => setIsEditingTarget(true)}
                className="text-slate-400 hover:text-primary-500 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={saveTarget}
                className="text-green-500 font-bold text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded"
              >
                Guardar
              </button>
            )}
          </div>

          <div className="flex flex-col items-center">
            {isEditingTarget ? (
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="number"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(e.target.value)}
                  className="w-20 p-2 border rounded text-center dark:bg-slate-800 dark:border-slate-700"
                  autoFocus
                />
                <span className="text-slate-500">hrs</span>
              </div>
            ) : (
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {weeklyProgress.hours}{" "}
                <span className="text-base font-normal text-slate-500">
                  / {weeklyTarget} hrs
                </span>
              </div>
            )}

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-violet-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${weeklyProgress.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 text-center">
              {weeklyProgress.percentage >= 100
                ? "¡Felicidades! Has alcanzado tu meta semanal. 🎉"
                : `Te faltan ${(weeklyTarget - weeklyProgress.hours).toFixed(
                    1
                  )} horas para tu meta.`}
            </p>
          </div>
        </div>

        {/* To-Do List / Objectives */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-lg font-semibold flex items-center">
              <ListTodo className="w-5 h-5 mr-2 text-pink-500" /> To-Do List
            </h3>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {Math.round(objectivesStats.percentage)}%
            </span>
          </div>

          {/* Objectives Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-4">
            <div
              className="bg-pink-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${objectivesStats.percentage}%` }}
            ></div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-60 space-y-2 mb-4 pr-1 custom-scrollbar">
            {objectives.length === 0 ? (
              <p className="text-slate-400 text-sm italic text-center py-4">
                Agrega tareas para mantenerte organizado.
              </p>
            ) : (
              objectives.map((obj) => (
                <div
                  key={obj.id}
                  className="group flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <button
                      onClick={() => onToggleObjective(obj.id)}
                      className="flex-shrink-0 text-slate-400 hover:text-pink-500 transition-colors"
                    >
                      {obj.isCompleted ? (
                        <CheckSquare className="w-5 h-5 text-pink-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <span
                      className={`text-sm truncate ${
                        obj.isCompleted
                          ? "line-through text-slate-400"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {obj.text}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteObjective(obj.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleAddObjectiveSubmit}
            className="relative mt-auto"
          >
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Nueva tarea..."
              className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-600 dark:text-primary-400 hover:scale-110 transition-transform"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-500" /> Actividad
            Semanal (hrs)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ fill: "transparent" }}
                  formatter={(value: number) => [formatHoursLong(value), "Tiempo"]}
                />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Por Categoría (hrs)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatHoursLong(value), "Tiempo"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Metas por Categoría */}
      {categories.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Layers className="w-5 h-5 mr-2 text-emerald-500" /> Metas Semanales por Categoría
          </h3>
          <div className="space-y-4">
            {categories.map((category) => {
              const progress = categoryProgress[category] || { current: 0, target: 0 };
              const percentage = progress.target > 0 
                ? Math.min(100, (progress.current / progress.target) * 100) 
                : 0;
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {category}
                    </span>
                    <div className="flex items-center space-x-2">
                      {editingCategoryGoal === category ? (
                        <>
                          <input
                            type="number"
                            value={tempCategoryGoal}
                            onChange={(e) => setTempCategoryGoal(e.target.value)}
                            className="w-16 p-1 text-sm border rounded text-center dark:bg-slate-800 dark:border-slate-700"
                            min="0"
                            step="0.5"
                            autoFocus
                          />
                          <span className="text-xs text-slate-500">hrs</span>
                          <button
                            onClick={() => handleSaveCategoryGoal(category)}
                            className="text-green-500 text-xs font-bold bg-green-100 dark:bg-green-900 px-2 py-1 rounded"
                          >
                            OK
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {progress.current}h / {progress.target > 0 ? `${progress.target}h` : 'Sin meta'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingCategoryGoal(category);
                              setTempCategoryGoal(progress.target.toString());
                            }}
                            className="text-slate-400 hover:text-primary-500 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        percentage >= 100 ? 'bg-emerald-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
