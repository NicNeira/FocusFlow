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
  Tag,
  History,
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
  onDeleteCategory: (category: string) => void;
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
  onDeleteCategory,
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

      {/* Control Panel - Minimalist Command Center */}
      <div
        className="w-full max-w-2xl animate-fade-in-up"
        style={{ animationDelay: "0.3s" }}
      >
        <div
          className="relative group"
          style={{
            background: "rgba(255, 255, 255, 0.01)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "24px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Subtle glow effect on hover */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="p-8 space-y-8">
            {/* Top Section: Integrated Input and Technique */}
            <div className="flex flex-col md:flex-row items-end gap-8">
              {/* Category Input: The focus point */}
              <div className="flex-1 w-full space-y-4">
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-bold text-white/30 px-1">
                  <Tag className="w-3 h-3" />
                  <span>Enfoque actual</span>
                </div>
                <div className="relative group/input">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => onSubjectChange(e.target.value)}
                    disabled={isRunning || elapsedSeconds > 0}
                    className="w-full bg-transparent text-xl md:text-2xl font-display tracking-tight text-white transition-all duration-300 outline-none placeholder:text-white/10"
                    placeholder="¿En qué vas a trabajar?"
                  />
                  {/* Minimalistic focus line */}
                  <div className="absolute -bottom-2 left-0 right-0 h-[1px] bg-white/5 transition-all duration-500 group-focus-within/input:bg-gradient-to-r group-focus-within/input:from-transparent group-focus-within/input:via-cyan-400/50 group-focus-within/input:to-transparent" />
                </div>
              </div>

              {/* Technique Selection: Secondary focus */}
              <div className="w-full md:w-auto space-y-4 min-w-[180px]">
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-bold text-white/30 px-1">
                  <Zap className="w-3 h-3" />
                  <span>Modo</span>
                </div>
                <TechniqueSelector
                  currentTechnique={technique.type}
                  onSelectTechnique={onTechniqueChange}
                  disabled={isRunning || elapsedSeconds > 0}
                />
              </div>
            </div>

            {/* Bottom Section: Recent History as subtle chips */}
            {savedCategories.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/[0.03]">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-bold text-white/20">
                    <History className="w-3 h-3" />
                    <span>Sugerencias recientes</span>
                    <span className="text-white/10">({savedCategories.length})</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {savedCategories.map((category) => {
                    const isSelected = subject === category;
                    return (
                      <div key={category} className="relative inline-block group/chip-container">
                        <button
                          type="button"
                          onClick={() => onSubjectChange(category)}
                          disabled={isRunning || elapsedSeconds > 0}
                          className="group/chip relative px-4 py-2 rounded-full transition-all duration-300"
                          style={{
                            background: isSelected ? "rgba(0, 245, 255, 0.1)" : "transparent",
                            opacity: isRunning || elapsedSeconds > 0 ? 0.4 : 1,
                            cursor: isRunning || elapsedSeconds > 0 ? "not-allowed" : "pointer",
                          }}
                        >
                          <span className={`text-xs font-medium transition-colors duration-300 ${isSelected ? "text-cyan-400" : "text-white/40 group-hover/chip:text-white/70"}`}>
                            {category}
                          </span>
                          {!isSelected && (
                            <div className="absolute inset-0 border border-white/5 rounded-full group-hover/chip:border-white/10 transition-colors" />
                          )}
                        </button>

                        {/* Delete button */}
                        {!isRunning && elapsedSeconds === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCategory(category);
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/chip-container:opacity-100 transition-all hover:scale-110"
                            style={{
                              background: "var(--status-error)",
                              color: "var(--bg-base)",
                              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
                            }}
                            title={`Eliminar ${category}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;
