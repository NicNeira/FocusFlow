import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Timer as TimerIcon,
  History as HistoryIcon,
  Moon,
  Sun,
  BookOpen,
} from "lucide-react";
import {
  StudySession,
  ViewState,
  TimerState,
  Objective,
  StudyTechnique,
} from "./types";
import {
  loadSessions,
  saveSessions,
  loadTimerState,
  saveTimerState,
  loadObjectives,
  saveObjectives,
  loadWeeklyTarget,
  saveWeeklyTarget,
  savePomodoroStats,
  updatePomodoroCount,
  loadCategories,
  saveCategories,
} from "./services/storageService";
import {
  getTechniqueConfig,
  shouldTransitionToBreak,
  shouldTransitionToWork,
  startBreakTime,
  startWorkTime,
  incrementCycle,
  resetCycles,
} from "./services/techniqueService";
import { faviconService } from "./services/faviconService";
import Timer from "./components/Timer";
import History from "./components/History";
import Dashboard from "./components/Dashboard";

function App() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>("timer");
  const [darkMode, setDarkMode] = useState(true);

  // New State for Goals
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(10);
  const [categories, setCategories] = useState<string[]>(() =>
    loadCategories()
  );

  // Lifted Timer State
  const [timerState, setTimerState] = useState<TimerState>(() =>
    loadTimerState()
  );
  const [now, setNow] = useState(Date.now()); // State to force re-render for timer tick

  useEffect(() => {
    // Load initial data
    setSessions(loadSessions());
    setObjectives(loadObjectives());
    setWeeklyTarget(loadWeeklyTarget());

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setDarkMode(true);
    }
  }, []);

  // Persistence Effects
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveObjectives(objectives);
  }, [objectives]);

  useEffect(() => {
    saveWeeklyTarget(weeklyTarget);
  }, [weeklyTarget]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Timer Logic: Persistence and Tick
  useEffect(() => {
    saveTimerState(timerState);
  }, [timerState]);

  useEffect(() => {
    let interval: number;
    if (timerState.isRunning) {
      interval = window.setInterval(() => {
        setNow(Date.now());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerState.isRunning]);

  // Calculate elapsed seconds based on accumulated time + current segment
  const elapsedSeconds = useMemo(() => {
    if (timerState.isRunning && timerState.startTime) {
      // Calculate seconds passed since start time + previously accumulated time
      return (
        timerState.accumulatedTime +
        Math.floor((now - timerState.startTime) / 1000)
      );
    }
    return timerState.accumulatedTime;
  }, [timerState, now]);

  // Verificar transiciones automáticas entre trabajo y descanso
  useEffect(() => {
    if (!timerState.isRunning || timerState.technique.type === "libre") return;

    const technique = timerState.technique;

    // Transición a descanso
    if (shouldTransitionToBreak(elapsedSeconds, technique)) {
      setTimerState((prev) => ({
        ...prev,
        isRunning: false,
        startTime: null,
        accumulatedTime: 0,
        technique: startBreakTime(prev.technique),
      }));

      // Notificación
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("FocusFlow - ¡Tiempo de Descanso!", {
          body: `¡Excelente trabajo! Tómate ${
            technique.breakDuration / 60
          } minutos de descanso.`,
          icon: "/favicon.png",
        });
      }
      return;
    }

    // Transición a trabajo (completar ciclo)
    if (shouldTransitionToWork(elapsedSeconds, technique)) {
      // Incrementar contador de ciclos completados
      const updatedStats = updatePomodoroCount(timerState.pomodoroStats);
      const updatedTechnique = incrementCycle(technique);

      setTimerState((prev) => ({
        ...prev,
        isRunning: false,
        startTime: null,
        accumulatedTime: 0,
        technique: startWorkTime(updatedTechnique),
        pomodoroStats: updatedStats,
      }));

      savePomodoroStats(updatedStats);

      // Notificación de ciclo completado
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("FocusFlow - ¡Ciclo Completado!", {
          body: `¡Felicidades! Has completado el ciclo ${updatedTechnique.cyclesCompleted}. ¡Sigue así!`,
          icon: "/favicon.png",
        });
      }
    }
  }, [
    elapsedSeconds,
    timerState.isRunning,
    timerState.technique,
    timerState.pomodoroStats,
  ]);

  // Update favicon and page title based on timer state
  useEffect(() => {
    const isRunning = timerState.isRunning;
    const isPaused = !timerState.isRunning && timerState.accumulatedTime > 0;
    const hasTime = elapsedSeconds > 0;

    // Update favicon
    faviconService.updateFaviconState(isRunning, isPaused, hasTime);

    // Update page title
    let title = "FocusFlow";
    if (isRunning) {
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;
      const timeStr = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      title = `⏱️ ${timeStr} - ${
        timerState.subject || "Estudiando"
      } | FocusFlow`;
    } else if (isPaused && hasTime) {
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      title = `⏸️ Pausado (${timeStr}) | FocusFlow`;
    }

    document.title = title;
  }, [
    timerState.isRunning,
    timerState.accumulatedTime,
    timerState.subject,
    elapsedSeconds,
  ]);

  // Cleanup favicon service on unmount
  useEffect(() => {
    return () => {
      faviconService.destroy();
    };
  }, []);

  const addSession = (session: StudySession) => {
    setSessions((prev) => [session, ...prev]);
  };

  const deleteSession = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Objectives Handlers
  const handleAddObjective = (text: string) => {
    const newObjective: Objective = {
      id: crypto.randomUUID(),
      text,
      isCompleted: false,
      createdAt: Date.now(),
    };
    setObjectives((prev) => [newObjective, ...prev]);
  };

  const handleToggleObjective = (id: string) => {
    setObjectives((prev) =>
      prev.map((obj) =>
        obj.id === id ? { ...obj, isCompleted: !obj.isCompleted } : obj
      )
    );
  };

  const handleDeleteObjective = (id: string) => {
    setObjectives((prev) => prev.filter((obj) => obj.id !== id));
  };

  const handleUpdateWeeklyTarget = (hours: number) => {
    setWeeklyTarget(hours);
  };

  const handleAddCategory = (category: string) => {
    const value = category.trim();
    if (!value) return;
    setCategories((prev) => {
      const exists = prev.some((c) => c.toLowerCase() === value.toLowerCase());
      if (exists) return prev;
      return [value, ...prev].slice(0, 20);
    });
  };

  const handleTechniqueChange = (technique: StudyTechnique) => {
    setTimerState((prev) => ({
      ...prev,
      technique: getTechniqueConfig(technique),
    }));
  };

  // Timer Handlers
  const handleStartTimer = () => {
    console.log("🟢 [App] handleStartTimer ejecutado");
    console.log("🟢 [App] Estado previo:", {
      isRunning: timerState.isRunning,
      accumulatedTime: timerState.accumulatedTime,
      technique: timerState.technique.type,
    });

    setTimerState((prev) => {
      console.log("🟢 [App] setTimerState ejecutándose...");
      const newState = {
        ...prev,
        isRunning: true,
        startTime: Date.now(),
      };
      console.log("🟢 [App] Nuevo estado:", newState);
      return newState;
    });

    console.log("🟢 [App] handleStartTimer completado");
  };

  const handlePauseTimer = () => {
    setTimerState((prev) => {
      if (!prev.startTime) return prev;
      // Calculate time passed in this segment
      const currentSegment = Math.floor((Date.now() - prev.startTime) / 1000);
      return {
        ...prev,
        isRunning: false,
        startTime: null,
        accumulatedTime: prev.accumulatedTime + currentSegment,
      };
    });
  };

  const handleResetTimer = () => {
    // Only ask for confirmation if there is significant time recorded
    if (
      elapsedSeconds > 10 &&
      !confirm(
        "¿Estás seguro de reiniciar el contador? Se perderá el progreso actual."
      )
    ) {
      return;
    }
    setTimerState((prev) => ({
      isRunning: false,
      startTime: null,
      accumulatedTime: 0,
      subject: "General",
      notes: "",
      technique: resetCycles(getTechniqueConfig(prev.technique.type)),
      pomodoroStats: prev.pomodoroStats,
    }));
  };

  const handleSaveSession = () => {
    if (elapsedSeconds < 10) {
      alert("La sesión es muy corta para guardarse (< 10 segundos).");
      return;
    }

    const newSession: StudySession = {
      id: crypto.randomUUID(),
      subject: timerState.subject || "General",
      startTime: Date.now() - elapsedSeconds * 1000,
      endTime: Date.now(),
      durationSeconds: elapsedSeconds,
      notes: timerState.notes,
    };

    addSession(newSession);

    // Reset timer after save
    setTimerState((prev) => ({
      isRunning: false,
      startTime: null,
      accumulatedTime: 0,
      subject: "General",
      notes: "",
      technique: resetCycles(getTechniqueConfig(prev.technique.type)),
      pomodoroStats: prev.pomodoroStats,
    }));

    // Optionally go to history or show a success message?
    // For now stay on timer to allow next session immediately.
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  const HeaderNavButton = ({
    view,
    icon: Icon,
    label,
  }: {
    view: ViewState;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
        currentView === view
          ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium hidden sm:block">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="relative flex items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div
              className={`p-2 rounded-lg transition-colors ${
                timerState.isRunning
                  ? "bg-green-500 animate-pulse"
                  : "bg-primary-600"
              }`}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400">
              FocusFlow
            </h1>
          </div>

          {/* Navigation - Centered */}
          <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            <HeaderNavButton
              view="dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
            />

            {/* Timer Button with active indicator */}
            <button
              onClick={() => setCurrentView("timer")}
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === "timer"
                  ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {timerState.isRunning && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white dark:border-slate-950"></span>
              )}
              <TimerIcon className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:block">Timer</span>
            </button>

            <HeaderNavButton
              view="history"
              icon={HistoryIcon}
              label="Historial"
            />
          </nav>

          {/* Right side - Mini Timer and Theme Toggle */}
          <div className="ml-auto flex items-center space-x-3">
            {/* Mini Timer Display in Header if not on Timer View */}
            {currentView !== "timer" && elapsedSeconds > 0 && (
              <div
                onClick={() => setCurrentView("timer")}
                className="hidden lg:flex items-center px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-600 dark:text-primary-400 text-sm font-mono font-bold cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    timerState.isRunning
                      ? "bg-green-500 animate-pulse"
                      : "bg-amber-500"
                  }`}
                ></div>
                {Math.floor(elapsedSeconds / 3600)
                  .toString()
                  .padStart(2, "0")}
                :
                {Math.floor((elapsedSeconds % 3600) / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(elapsedSeconds % 60).toString().padStart(2, "0")}
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        {currentView === "timer" && (
          <div className="flex flex-col items-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">
              Tu tiempo de enfoque
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Elige una categoría y comienza a medir tu progreso.
            </p>
            <Timer
              isRunning={timerState.isRunning}
              elapsedSeconds={elapsedSeconds}
              subject={timerState.subject}
              technique={timerState.technique}
              pomodoroStats={timerState.pomodoroStats}
              savedCategories={categories}
              onSubjectChange={(val) =>
                setTimerState((prev) => ({ ...prev, subject: val }))
              }
              onAddCategory={handleAddCategory}
              onTechniqueChange={handleTechniqueChange}
              onStart={handleStartTimer}
              onPause={handlePauseTimer}
              onReset={handleResetTimer}
              onSave={handleSaveSession}
            />
          </div>
        )}
        {currentView === "dashboard" && (
          <Dashboard
            sessions={sessions}
            objectives={objectives}
            weeklyTarget={weeklyTarget}
            onAddObjective={handleAddObjective}
            onToggleObjective={handleToggleObjective}
            onDeleteObjective={handleDeleteObjective}
            onUpdateWeeklyTarget={handleUpdateWeeklyTarget}
          />
        )}
        {currentView === "history" && (
          <History sessions={sessions} onDeleteSession={deleteSession} />
        )}
      </main>
    </div>
  );
}

export default App;
