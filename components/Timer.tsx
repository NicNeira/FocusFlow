import React from "react";
import {
  Play,
  Pause,
  StopCircle,
  Save,
  Coffee,
  Brain,
  Target,
  Plus,
  AlertCircle,
  X,
} from "lucide-react";
import {
  StudyTechnique,
  TechniqueConfig,
  InterruptedSessionInfo,
} from "../types";
import TechniqueSelector from "./TechniqueSelector";

interface TimerProps {
  isRunning: boolean;
  elapsedSeconds: number;
  subject: string;
  technique: TechniqueConfig;
  pomodoroStats: { daily: number; weekly: number };
  savedCategories: string[];
  onSubjectChange: (value: string) => void;
  onAddCategory: (value: string) => void;
  onTechniqueChange: (technique: StudyTechnique) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSave: () => void;
  // Interrupted session props
  interruptedSession: InterruptedSessionInfo | null;
  onDismissInterrupted: () => void;
  onResumeInterrupted: () => void;
  onSaveInterrupted: () => void;
}

const Timer: React.FC<TimerProps> = ({
  isRunning,
  elapsedSeconds,
  subject,
  technique,
  pomodoroStats,
  savedCategories,
  onSubjectChange,
  onAddCategory,
  onTechniqueChange,
  onStart,
  onPause,
  onReset,
  onSave,
  interruptedSession,
  onDismissInterrupted,
  onResumeInterrupted,
  onSaveInterrupted,
}) => {
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Calcular tiempo restante si hay límite
  const getRemainingTime = () => {
    if (technique.type === "libre") return null;
    const targetDuration = technique.isBreakTime
      ? technique.breakDuration
      : technique.workDuration;
    const remaining = Math.max(0, targetDuration - elapsedSeconds);
    return formatTime(remaining);
  };

  // Calcular progreso
  const getProgress = () => {
    if (technique.type === "libre") return 0;
    const targetDuration = technique.isBreakTime
      ? technique.breakDuration
      : technique.workDuration;
    return Math.min(100, (elapsedSeconds / targetDuration) * 100);
  };

  // Formatear minutos para el banner
  const formatMinutesAway = (minutes: number) => {
    if (minutes < 60) return `${minutes} minuto${minutes !== 1 ? "s" : ""}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hora${hours !== 1 ? "s" : ""}`;
    return `${hours}h ${mins}m`;
  };

  const isBreakTime = technique.isBreakTime;
  const hasTimeLimit = technique.type !== "libre";
  const progress = getProgress();

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-6 animate-fade-in space-y-6">
      {/* Banner de sesión interrumpida */}
      {interruptedSession && interruptedSession.hasInterruptedSession && (
        <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 shadow-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-amber-100 dark:bg-amber-800/50 rounded-full">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                Temporizador restaurado
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                Tu temporizador estuvo corriendo por{" "}
                <span className="font-bold">
                  {formatMinutesAway(interruptedSession.minutesWhileAway)}
                </span>{" "}
                mientras la app estaba cerrada.
                {interruptedSession.subject !== "General" && (
                  <span>
                    {" "}
                    Categoría:{" "}
                    <span className="font-medium">
                      {interruptedSession.subject}
                    </span>
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onResumeInterrupted}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" fill="currentColor" />
                  Reanudar
                </button>
                <button
                  onClick={onSaveInterrupted}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar sesión
                </button>
                <button
                  onClick={onDismissInterrupted}
                  className="flex items-center gap-1.5 px-3 py-2 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/50 text-sm font-medium rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Descartar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Estadísticas de Pomodoros */}
      {technique.type !== "libre" && (
        <div className="flex gap-4 w-full justify-center flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Hoy:{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {pomodoroStats.daily}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Semana:{" "}
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {pomodoroStats.weekly}
              </span>
            </span>
          </div>
          {technique.cyclesCompleted > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 animate-bounce-subtle">
              <Coffee className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Ciclos:{" "}
                <span className="font-bold text-green-600 dark:text-green-400">
                  {technique.cyclesCompleted}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Indicador de Estado */}
      {hasTimeLimit && (
        <div
          className={`
          px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-all duration-500
          ${
            isBreakTime
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              : "bg-gradient-to-r from-primary-500 to-violet-600 text-white"
          }
          ${isRunning ? "animate-pulse" : ""}
        `}
        >
          {isBreakTime ? (
            <span className="flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              Tiempo de Descanso
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Tiempo de Enfoque
            </span>
          )}
        </div>
      )}

      {/* Círculo del Timer */}
      <div className="relative mb-8 group">
        <div
          className={`
          absolute -inset-1 rounded-full blur transition duration-1000
          ${isRunning ? "opacity-75" : "opacity-25"}
          ${
            isBreakTime
              ? "bg-gradient-to-r from-emerald-500 to-teal-600"
              : "bg-gradient-to-r from-primary-600 to-blue-600"
          }
        `}
        ></div>
        <div className="relative bg-white dark:bg-slate-900 rounded-full w-72 h-72 flex items-center justify-center border-4 border-slate-100 dark:border-slate-800 shadow-xl">
          {/* Barra de progreso circular */}
          {hasTimeLimit && progress > 0 && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="144"
                cy="144"
                r="138"
                stroke={isBreakTime ? "#10b981" : "#8b5cf6"}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(progress / 100) * 867} 867`}
                strokeLinecap="round"
                className="transition-all duration-300"
                opacity="0.3"
              />
            </svg>
          )}

          <div className="flex flex-col items-center">
            <span className="text-5xl font-mono font-bold text-slate-800 dark:text-slate-100 tracking-wider">
              {hasTimeLimit && isRunning
                ? getRemainingTime()
                : formatTime(elapsedSeconds)}
            </span>
            {hasTimeLimit && isRunning && (
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Transcurrido: {formatTime(elapsedSeconds)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-5 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Categoría
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                disabled={isRunning || elapsedSeconds > 0}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 disabled:opacity-60"
                placeholder="Ej. Investigación"
              />
              <button
                type="button"
                aria-label="Guardar categoría"
                disabled={
                  isRunning ||
                  elapsedSeconds > 0 ||
                  subject.trim().length === 0 ||
                  savedCategories.some(
                    (category) =>
                      category.toLowerCase() === subject.trim().toLowerCase()
                  )
                }
                onClick={() => onAddCategory(subject)}
                className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {savedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {savedCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onSubjectChange(category)}
                    disabled={isRunning || elapsedSeconds > 0}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      subject === category
                        ? "bg-primary-600 text-white border-primary-600"
                        : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-400"
                    } ${
                      isRunning || elapsedSeconds > 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:max-w-xs">
              <TechniqueSelector
                currentTechnique={technique.type}
                onSelectTechnique={onTechniqueChange}
                disabled={isRunning || elapsedSeconds > 0}
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:justify-end">
              {!isRunning ? (
                <button
                  onClick={() => {
                    console.log("🔵 [Timer] Botón Iniciar clickeado");
                    console.log("🔵 [Timer] isRunning:", isRunning);
                    console.log("🔵 [Timer] elapsedSeconds:", elapsedSeconds);
                    console.log("🔵 [Timer] Llamando a onStart...");
                    onStart();
                    console.log("🔵 [Timer] onStart ejecutado");
                  }}
                  aria-label={elapsedSeconds > 0 ? "Reanudar" : "Iniciar"}
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus:ring-2 focus:ring-primary-500/40"
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    console.log("🟡 [Timer] Botón Pausar clickeado");
                    onPause();
                  }}
                  aria-label="Pausar"
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500 text-white shadow-sm hover:bg-amber-600 focus:ring-2 focus:ring-amber-500/40"
                >
                  <Pause className="w-5 h-5" fill="currentColor" />
                </button>
              )}

              {elapsedSeconds > 0 && !isRunning && (
                <button
                  onClick={onSave}
                  aria-label="Guardar"
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/40"
                >
                  <Save className="w-5 h-5" />
                </button>
              )}

              {elapsedSeconds > 0 && !isRunning && (
                <button
                  onClick={onReset}
                  aria-label="Reiniciar"
                  className="flex items-center justify-center w-12 h-12 rounded-xl border border-rose-400 text-rose-500 dark:border-rose-500 dark:text-rose-300 hover:bg-rose-500/10 focus:ring-2 focus:ring-rose-500/40"
                  title="Reiniciar"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;
