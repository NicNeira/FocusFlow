import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Save,
  Coffee,
  Brain,
  Target,
  Plus,
  PictureInPicture2,
  X,
  Zap,
} from "lucide-react";
import { StudyTechnique, TechniqueConfig } from "../types";
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
  isPiPSupported?: boolean;
  isPiPActive?: boolean;
  onTogglePiP?: () => void;
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
  isPiPSupported = false,
  isPiPActive = false,
  onTogglePiP = () => {},
}) => {
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getRemainingTime = () => {
    if (technique.type === "libre") return null;
    const targetDuration = technique.isBreakTime
      ? technique.breakDuration
      : technique.workDuration;
    const remaining = Math.max(0, targetDuration - elapsedSeconds);
    return formatTime(remaining);
  };

  const getProgress = () => {
    if (technique.type === "libre") return 0;
    const targetDuration = technique.isBreakTime
      ? technique.breakDuration
      : technique.workDuration;
    return Math.min(100, (elapsedSeconds / targetDuration) * 100);
  };

  const isBreakTime = technique.isBreakTime;
  const hasTimeLimit = technique.type !== "libre";
  const progress = getProgress();

  // Get display time
  const displayTime = hasTimeLimit && isRunning
    ? getRemainingTime() || formatTime(elapsedSeconds)
    : formatTime(elapsedSeconds);

  // Calculate SVG progress circle values
  const circleRadius = 130;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Stats Pills - Compact */}
      {technique.type !== "libre" && (
        <div
          className="flex gap-2 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Today stats */}
          <div className="glass-card px-3 py-1.5 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" style={{ color: "var(--accent-cyan)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Hoy</span>
            <span className="text-sm font-bold font-mono" style={{ color: "var(--accent-cyan)" }}>
              {pomodoroStats.daily}
            </span>
          </div>

          {/* Week stats */}
          <div className="glass-card px-3 py-1.5 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5" style={{ color: "var(--accent-magenta)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Semana</span>
            <span className="text-sm font-bold font-mono" style={{ color: "var(--accent-magenta)" }}>
              {pomodoroStats.weekly}
            </span>
          </div>

          {/* Cycles stats */}
          {technique.cyclesCompleted > 0 && (
            <div className="glass-card px-3 py-1.5 flex items-center gap-2">
              <Coffee className="w-3.5 h-3.5" style={{ color: "var(--accent-lime)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Ciclos</span>
              <span className="text-sm font-bold font-mono" style={{ color: "var(--accent-lime)" }}>
                {technique.cyclesCompleted}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Timer Circle - Neumorphic Design */}
      <div
        className="relative animate-fade-in-up"
        style={{ animationDelay: "0.2s" }}
      >
        {/* Outer glow */}
        <div
          className="absolute -inset-4 rounded-full blur-2xl transition-opacity duration-500"
          style={{
            background: isBreakTime
              ? "radial-gradient(circle, rgba(0, 255, 136, 0.2) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(0, 245, 255, 0.2) 0%, transparent 70%)",
            opacity: isRunning ? 1 : 0.3,
          }}
        />

        {/* Main timer container */}
        <div
          className="relative w-80 h-80 rounded-full flex items-center justify-center neu-card"
          style={{
            background: "var(--bg-surface)",
          }}
        >
          {/* Progress ring SVG */}
          {hasTimeLimit && (
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 320 320"
            >
              {/* Background track */}
              <circle
                cx="160"
                cy="160"
                r={145}
                fill="none"
                stroke="var(--bg-elevated)"
                strokeWidth="6"
              />
              {/* Progress arc */}
              <circle
                cx="160"
                cy="160"
                r={145}
                fill="none"
                stroke={isBreakTime ? "var(--accent-lime)" : "var(--accent-cyan)"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 145}
                strokeDashoffset={2 * Math.PI * 145 - (progress / 100) * 2 * Math.PI * 145}
                className="transition-all duration-300"
                style={{
                  filter: isRunning
                    ? `drop-shadow(0 0 8px ${isBreakTime ? "rgba(0, 255, 136, 0.6)" : "rgba(0, 245, 255, 0.6)"})`
                    : "none",
                }}
              />
            </svg>
          )}

          {/* Inner content */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Status badge - compact */}
            {hasTimeLimit && (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: isBreakTime
                    ? "rgba(0, 255, 136, 0.1)"
                    : "rgba(0, 245, 255, 0.1)",
                  border: `1px solid ${isBreakTime ? "rgba(0, 255, 136, 0.2)" : "rgba(0, 245, 255, 0.2)"}`,
                  color: isBreakTime ? "var(--accent-lime)" : "var(--accent-cyan)",
                }}
              >
                {isBreakTime ? (
                  <>
                    <Coffee className="w-3 h-3" />
                    <span>Descanso</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    <span>Enfoque</span>
                  </>
                )}
              </div>
            )}

            {/* Time display */}
            <span
              className="font-mono font-bold tracking-tight transition-all duration-300 text-5xl"
              style={{
                color: "var(--text-primary)",
                textShadow: isRunning
                  ? isBreakTime
                    ? "0 0 30px rgba(0, 255, 136, 0.4)"
                    : "0 0 30px rgba(0, 245, 255, 0.4)"
                  : "none",
              }}
            >
              {displayTime}
            </span>

            {/* Elapsed time or mode indicator */}
            {hasTimeLimit && isRunning ? (
              <span
                className="text-xs font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                {formatTime(elapsedSeconds)}
              </span>
            ) : !hasTimeLimit ? (
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Modo Libre
              </span>
            ) : null}

            {/* Control Buttons - Inside Circle */}
            <div className="flex items-center gap-2 mt-2">
              {/* Play/Pause Button */}
              {!isRunning ? (
                <button
                  onClick={onStart}
                  aria-label={elapsedSeconds > 0 ? "Reanudar" : "Iniciar"}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    background: "var(--accent-cyan)",
                    color: "var(--bg-base)",
                    boxShadow: "var(--glow-cyan)",
                  }}
                >
                  <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={onPause}
                  aria-label="Pausar"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    background: "var(--status-warning)",
                    color: "var(--bg-base)",
                    boxShadow: "0 0 20px rgba(251, 191, 36, 0.4)",
                  }}
                >
                  <Pause className="w-5 h-5" fill="currentColor" />
                </button>
              )}

              {/* Save Button */}
              {elapsedSeconds > 0 && !isRunning && (
                <button
                  onClick={onSave}
                  aria-label="Guardar sesión"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    background: "var(--accent-lime)",
                    color: "var(--bg-base)",
                    boxShadow: "var(--glow-lime)",
                  }}
                >
                  <Save className="w-4 h-4" />
                </button>
              )}

              {/* Reset Button */}
              {elapsedSeconds > 0 && !isRunning && (
                <button
                  onClick={onReset}
                  aria-label="Reiniciar"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--status-error)",
                    color: "var(--status-error)",
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* PiP Button */}
              {isPiPSupported && (
                <button
                  onClick={onTogglePiP}
                  aria-label={isPiPActive ? "Cerrar Picture-in-Picture" : "Abrir Picture-in-Picture"}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    background: isPiPActive ? "var(--accent-magenta)" : "rgba(255, 255, 255, 0.05)",
                    border: isPiPActive ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
                    color: isPiPActive ? "var(--bg-base)" : "var(--text-secondary)",
                    boxShadow: isPiPActive ? "var(--glow-magenta)" : "none",
                  }}
                  title="Picture-in-Picture"
                >
                  {isPiPActive ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <PictureInPicture2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel - Compact */}
      <div
        className="w-full max-w-xl animate-fade-in-up"
        style={{ animationDelay: "0.3s" }}
      >
        <div
          className="glass-card p-4 space-y-3"
          style={{ borderRadius: "16px" }}
        >
          {/* Category and Technique Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Input */}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                disabled={isRunning || elapsedSeconds > 0}
                className="flex-1 px-3 py-2 rounded-lg text-sm transition-all duration-200 outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-primary)",
                }}
                placeholder="Categoría..."
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
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-30"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--accent-current)",
                }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Technique Selector */}
            <div className="sm:w-48">
              <TechniqueSelector
                currentTechnique={technique.type}
                onSelectTechnique={onTechniqueChange}
                disabled={isRunning || elapsedSeconds > 0}
              />
            </div>
          </div>

          {/* Category Pills - Compact */}
          {savedCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {savedCategories.slice(0, 6).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => onSubjectChange(category)}
                  disabled={isRunning || elapsedSeconds > 0}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
                  style={{
                    background: subject === category
                      ? "var(--accent-current)"
                      : "var(--bg-elevated)",
                    color: subject === category
                      ? "var(--bg-base)"
                      : "var(--text-secondary)",
                    border: `1px solid ${subject === category ? "var(--accent-current)" : "var(--glass-border)"}`,
                    opacity: isRunning || elapsedSeconds > 0 ? 0.5 : 1,
                    cursor: isRunning || elapsedSeconds > 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {category}
                </button>
              ))}
              {savedCategories.length > 6 && (
                <span
                  className="px-2.5 py-1 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  +{savedCategories.length - 6}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timer;
