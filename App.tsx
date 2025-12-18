import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  Timer as TimerIcon,
  History as HistoryIcon,
  BookOpen,
  Settings,
  LogOut,
  User,
  Loader2,
  Zap,
} from "lucide-react";
import {
  StudySession,
  ViewState,
  TimerState,
  Objective,
  StudyTechnique,
  NotificationSettings as NotificationSettingsType,
  WeeklyGoalsByCategory,
} from "./types";
import {
  getSessions,
  saveSession,
  deleteSession as deleteSessionFromDB,
  getObjectives,
  saveObjective,
  updateObjective,
  deleteObjective as deleteObjectiveFromDB,
  getTimerState,
  saveTimerState,
  clearTimerState,
  getDefaultTimerState,
  getNotificationSettings,
  saveNotificationSettings,
  getDefaultNotificationSettings,
} from "./services/supabaseService";
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
import { notificationService } from "./services/notificationService";
import { audioService } from "./services/audioService";
import { themeService } from "./services/themeService";
import { usePictureInPicture } from "./hooks/usePictureInPicture";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Timer from "./components/Timer";
import History from "./components/History";
import Dashboard from "./components/Dashboard";
import SettingsComponent from "./components/NotificationSettings";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";

const SYNC_INTERVAL = 60 * 60 * 1000;

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register">("login");

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>("timer");
  const [viewKey, setViewKey] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(10);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryGoals, setCategoryGoals] = useState<WeeklyGoalsByCategory>({});

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettingsType>(getDefaultNotificationSettings());

  const [timerState, setTimerState] =
    useState<TimerState>(getDefaultTimerState);
  const [now, setNow] = useState(Date.now());

  const [dataLoadedForUser, setDataLoadedForUser] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      setDataLoadedForUser(null);
      return;
    }

    if (dataLoadedForUser === user.id) {
      setDataLoading(false);
      return;
    }

    const loadUserData = async () => {
      setDataLoading(true);
      try {
        const [loadedSessions, loadedObjectives, loadedTimerState, loadedNotificationSettings] =
          await Promise.all([
            getSessions(user.id),
            getObjectives(user.id),
            getTimerState(user.id),
            getNotificationSettings(user.id),
          ]);

        setSessions(loadedSessions);
        setObjectives(loadedObjectives);

        const uniqueCategories = [
          ...new Set(loadedSessions.map((s) => s.subject)),
        ];
        setCategories(uniqueCategories);

        if (loadedTimerState) {
          if (loadedTimerState.isRunning && loadedTimerState.startTime) {
            const timeSinceStart = Math.floor(
              (Date.now() - loadedTimerState.startTime) / 1000
            );
            setTimerState({
              ...loadedTimerState,
              accumulatedTime:
                loadedTimerState.accumulatedTime + timeSinceStart,
              isRunning: false,
              startTime: null,
            });
          } else {
            setTimerState(loadedTimerState);
          }
        }

        if (loadedNotificationSettings) {
          setNotificationSettings(loadedNotificationSettings);
        }

        setDataLoadedForUser(user.id);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    loadUserData();
  }, [user, dataLoadedForUser]);

  useEffect(() => {
    themeService.applyTheme();
  }, []);

  // Trigger animation on view change
  useEffect(() => {
    setViewKey(prev => prev + 1);
  }, [currentView]);

  useEffect(() => {
    audioService.setVolume(notificationSettings.soundVolume);
    audioService.setEnabled(notificationSettings.soundEnabled);
  }, [notificationSettings]);

  useEffect(() => {
    if (!user) return;

    const saveSettings = async () => {
      await saveNotificationSettings(user.id, notificationSettings);
    };

    saveSettings();
  }, [user, notificationSettings]);

  useEffect(() => {
    let interval: number;
    if (timerState.isRunning) {
      interval = window.setInterval(() => {
        setNow(Date.now());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerState.isRunning]);

  useEffect(() => {
    if (!user || !timerState.isRunning) return;

    const syncInterval = window.setInterval(async () => {
      console.log("Syncing timer state to Supabase...");
      await saveTimerState(user.id, timerState);
    }, SYNC_INTERVAL);

    return () => clearInterval(syncInterval);
  }, [user, timerState.isRunning, timerState]);

  const elapsedSeconds = useMemo(() => {
    if (timerState.isRunning && timerState.startTime) {
      return (
        timerState.accumulatedTime +
        Math.floor((now - timerState.startTime) / 1000)
      );
    }
    return timerState.accumulatedTime;
  }, [timerState, now]);

  useEffect(() => {
    if (!timerState.isRunning || timerState.technique.type === "libre") return;

    const technique = timerState.technique;

    if (shouldTransitionToBreak(elapsedSeconds, technique)) {
      if (notificationSettings.enabled && notificationSettings.workEndEnabled) {
        notificationService.notifyWorkPeriodEnd(
          technique.type,
          technique.breakDuration
        );
      }

      if (notificationSettings.soundEnabled) {
        audioService.play('work-end');
      }

      if (notificationSettings.vibrationEnabled) {
        audioService.vibrate([200, 100, 200]);
      }

      setTimerState((prev) => ({
        ...prev,
        isRunning: true,
        startTime: Date.now(),
        accumulatedTime: 0,
        technique: startBreakTime(prev.technique),
      }));

      setTimeout(() => {
        if (notificationSettings.soundEnabled) {
          audioService.play('achievement');
        }
        if (notificationSettings.vibrationEnabled) {
          audioService.vibrate([100, 50, 100]);
        }
      }, 1500);

      return;
    }

    if (shouldTransitionToWork(elapsedSeconds, technique)) {
      const updatedTechnique = incrementCycle(technique);
      const updatedStats = {
        ...timerState.pomodoroStats,
        daily: timerState.pomodoroStats.daily + 1,
        weekly: timerState.pomodoroStats.weekly + 1,
      };

      if (notificationSettings.enabled && notificationSettings.breakEndEnabled) {
        notificationService.notifyBreakPeriodEnd();
      }

      if (notificationSettings.enabled && notificationSettings.cycleCompleteEnabled) {
        notificationService.notifyCycleComplete(
          updatedTechnique.cyclesCompleted,
          updatedStats.daily,
          updatedStats.weekly
        );
      }

      if (notificationSettings.soundEnabled) {
        audioService.play('cycle-complete');
      }

      if (notificationSettings.vibrationEnabled) {
        audioService.vibrate([200, 100, 200, 100, 200]);
      }

      setTimerState((prev) => ({
        ...prev,
        isRunning: true,
        startTime: Date.now(),
        accumulatedTime: 0,
        technique: startWorkTime(updatedTechnique),
        pomodoroStats: updatedStats,
      }));

      setTimeout(() => {
        if (notificationSettings.soundEnabled) {
          audioService.play('achievement');
        }
        if (notificationSettings.vibrationEnabled) {
          audioService.vibrate([100, 50, 100]);
        }
      }, 1500);
    }
  }, [
    elapsedSeconds,
    timerState.isRunning,
    timerState.technique,
    timerState.pomodoroStats,
    notificationSettings,
  ]);

  useEffect(() => {
    const isRunning = timerState.isRunning;
    const isPaused = !timerState.isRunning && timerState.accumulatedTime > 0;
    const hasTime = elapsedSeconds > 0;

    faviconService.updateFaviconState(isRunning, isPaused, hasTime);

    let title = "FocusFlow";
    if (isRunning) {
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;
      const timeStr = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      title = `${timeStr} - ${
        timerState.subject || "Estudiando"
      } | FocusFlow`;
    } else if (isPaused && hasTime) {
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      title = `Pausado (${timeStr}) | FocusFlow`;
    }

    document.title = title;
  }, [
    timerState.isRunning,
    timerState.accumulatedTime,
    timerState.subject,
    elapsedSeconds,
  ]);

  useEffect(() => {
    return () => {
      faviconService.destroy();
    };
  }, []);

  const addSession = useCallback(
    async (sessionData: Omit<StudySession, "id">) => {
      if (!user) return;

      const savedSession = await saveSession(user.id, sessionData);
      if (savedSession) {
        setSessions((prev) => [savedSession, ...prev]);
      }
    },
    [user]
  );

  const handleDeleteSession = useCallback(async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este registro?")) return;

    const success = await deleteSessionFromDB(id);
    if (success) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  }, []);

  const handleAddObjective = useCallback(
    async (text: string) => {
      if (!user) return;

      const newObjective = {
        text,
        isCompleted: false,
        createdAt: Date.now(),
      };

      const saved = await saveObjective(user.id, newObjective);
      if (saved) {
        setObjectives((prev) => [saved, ...prev]);
      }
    },
    [user]
  );

  const handleToggleObjective = useCallback(
    async (id: string) => {
      const objective = objectives.find((o) => o.id === id);
      if (!objective) return;

      const success = await updateObjective(id, {
        isCompleted: !objective.isCompleted,
      });
      if (success) {
        setObjectives((prev) =>
          prev.map((obj) =>
            obj.id === id ? { ...obj, isCompleted: !obj.isCompleted } : obj
          )
        );
      }
    },
    [objectives]
  );

  const handleDeleteObjective = useCallback(async (id: string) => {
    const success = await deleteObjectiveFromDB(id);
    if (success) {
      setObjectives((prev) => prev.filter((obj) => obj.id !== id));
    }
  }, []);

  const handleUpdateWeeklyTarget = (hours: number) => {
    setWeeklyTarget(hours);
  };

  const handleUpdateCategoryGoals = (goals: WeeklyGoalsByCategory) => {
    setCategoryGoals(goals);
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

  const handleNotificationSettingsChange = (
    settings: NotificationSettingsType
  ) => {
    setNotificationSettings(settings);
  };

  const handleStartTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      startTime: Date.now(),
    }));

    if (notificationSettings.soundEnabled) {
      audioService.play('achievement');
    }

    if (notificationSettings.vibrationEnabled) {
      audioService.vibrate([100, 50, 100]);
    }
  };

  const handlePauseTimer = () => {
    setTimerState((prev) => {
      if (!prev.startTime) return prev;
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

  const handleSaveSession = async () => {
    if (!user) return;

    if (elapsedSeconds < 10) {
      alert("La sesión es muy corta para guardarse (< 10 segundos).");
      return;
    }

    const newSession = {
      subject: timerState.subject || "General",
      startTime: Date.now() - elapsedSeconds * 1000,
      endTime: Date.now(),
      durationSeconds: elapsedSeconds,
      notes: timerState.notes,
    };

    await addSession(newSession);
    await clearTimerState(user.id);

    setTimerState((prev) => ({
      isRunning: false,
      startTime: null,
      accumulatedTime: 0,
      subject: "General",
      notes: "",
      technique: resetCycles(getTechniqueConfig(prev.technique.type)),
      pomodoroStats: prev.pomodoroStats,
    }));

    if (newSession.subject && !categories.includes(newSession.subject)) {
      setCategories((prev) => [newSession.subject, ...prev].slice(0, 20));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setSessions([]);
    setObjectives([]);
    setCategories([]);
    setTimerState(getDefaultTimerState());
  };

  // Helper functions for PiP
  const formatTime = useCallback((totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const getRemainingTime = useCallback(() => {
    if (timerState.technique.type === "libre") return null;
    const targetDuration = timerState.technique.isBreakTime
      ? timerState.technique.breakDuration
      : timerState.technique.workDuration;
    const remaining = Math.max(0, targetDuration - elapsedSeconds);
    return formatTime(remaining);
  }, [timerState.technique, elapsedSeconds, formatTime]);

  const isBreakTime = timerState.technique.isBreakTime;
  const hasTimeLimit = timerState.technique.type !== "libre";
  const displayTime = hasTimeLimit && timerState.isRunning
    ? getRemainingTime() || formatTime(elapsedSeconds)
    : formatTime(elapsedSeconds);
  const statusText = isBreakTime
    ? "Descanso"
    : hasTimeLimit
      ? "Enfoque"
      : "Libre";

  // Picture-in-Picture hook - persists across view changes
  const {
    isSupported: isPiPSupported,
    isActive: isPiPActive,
    togglePiP,
  } = usePictureInPicture({
    time: displayTime,
    isRunning: timerState.isRunning,
    isBreakTime,
    status: statusText,
    hasElapsedTime: elapsedSeconds > 0,
    onPlay: handleStartTimer,
    onPause: handlePauseTimer,
    onSave: handleSaveSession,
    onReset: handleResetTimer,
  });

  const isFullyLoading = authLoading || (user && dataLoading);

  // Loading screen with new design
  if (isFullyLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="flex flex-col items-center space-y-6 animate-fade-in">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{ background: "var(--accent-cyan)", opacity: 0.3 }}
            />
            <Loader2
              className="w-16 h-16 animate-spin relative"
              style={{ color: "var(--accent-cyan)" }}
            />
          </div>
          <p style={{ color: "var(--text-secondary)" }}>
            {authLoading ? "Verificando sesión..." : "Cargando tus datos..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === "login") {
      return <Login onSwitchToRegister={() => setAuthView("register")} />;
    }
    return <Register onSwitchToLogin={() => setAuthView("login")} />;
  }

  const navItems = [
    { view: "timer" as ViewState, icon: TimerIcon, label: "Timer" },
    { view: "dashboard" as ViewState, icon: LayoutDashboard, label: "Dashboard" },
    { view: "history" as ViewState, icon: HistoryIcon, label: "Historial" },
    { view: "settings" as ViewState, icon: Settings, label: "Ajustes" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col font-display"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-4"
        style={{
          background: "rgba(10, 10, 15, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{
                background: timerState.isRunning
                  ? "var(--accent-lime)"
                  : "var(--accent-cyan)",
                boxShadow: timerState.isRunning
                  ? "var(--glow-lime)"
                  : "var(--glow-cyan)",
              }}
            >
              <BookOpen className="w-5 h-5" style={{ color: "var(--bg-base)" }} />
            </div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              FocusFlow
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ view, icon: Icon, label }) => {
              const isActive = currentView === view;
              const isTimerRunning = view === "timer" && timerState.isRunning;

              return (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className="relative px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200"
                  style={{
                    background: isActive ? "var(--glass-bg)" : "transparent",
                    border: isActive ? "1px solid var(--glass-border)" : "1px solid transparent",
                    color: isActive ? "var(--accent-current)" : "var(--text-muted)",
                  }}
                >
                  {isTimerRunning && (
                    <span
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                      style={{
                        background: "var(--accent-lime)",
                        boxShadow: "var(--glow-lime)",
                      }}
                    />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Mini Timer - Hidden when PiP is active */}
            {currentView !== "timer" && elapsedSeconds > 0 && !isPiPActive && (
              <button
                onClick={() => setCurrentView("timer")}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: timerState.isRunning
                      ? "var(--accent-lime)"
                      : "var(--status-warning)",
                    boxShadow: timerState.isRunning
                      ? "var(--glow-lime)"
                      : "0 0 10px rgba(251, 191, 36, 0.4)",
                  }}
                />
                <span
                  className="font-mono font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {Math.floor(elapsedSeconds / 3600)
                    .toString()
                    .padStart(2, "0")}
                  :
                  {Math.floor((elapsedSeconds % 3600) / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(elapsedSeconds % 60).toString().padStart(2, "0")}
                </span>
              </button>
            )}

            {/* User info */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <User className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <span
                className="text-sm max-w-32 truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {user.email}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-muted)",
              }}
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl pb-28 md:pb-8">
        {currentView === "timer" && (
          <div key={`timer-${viewKey}`} className="flex flex-col items-center animate-view-enter">
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
              isPiPSupported={isPiPSupported}
              isPiPActive={isPiPActive}
              onTogglePiP={togglePiP}
            />
          </div>
        )}

        {currentView === "dashboard" && (
          <div key={`dashboard-${viewKey}`} className="animate-view-enter">
            <Dashboard
              sessions={sessions}
              objectives={objectives}
              weeklyTarget={weeklyTarget}
              categories={categories}
              categoryGoals={categoryGoals}
              onAddObjective={handleAddObjective}
              onToggleObjective={handleToggleObjective}
              onDeleteObjective={handleDeleteObjective}
              onUpdateWeeklyTarget={handleUpdateWeeklyTarget}
              onUpdateCategoryGoals={handleUpdateCategoryGoals}
            />
          </div>
        )}

        {currentView === "history" && (
          <div key={`history-${viewKey}`} className="animate-view-enter">
            <History
              sessions={sessions}
              onDeleteSession={handleDeleteSession}
            />
          </div>
        )}

        {currentView === "settings" && (
          <div key={`settings-${viewKey}`} className="max-w-2xl mx-auto animate-view-enter">
            <div className="text-center mb-8">
              <h2
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Ajustes
              </h2>
              <p style={{ color: "var(--text-muted)" }}>
                Configura notificaciones, sonidos y preferencias.
              </p>
            </div>
            <SettingsComponent
              settings={notificationSettings}
              onSettingsChange={handleNotificationSettingsChange}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 py-3 safe-area-bottom"
        style={{
          background: "rgba(10, 10, 15, 0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--glass-border)",
        }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map(({ view, icon: Icon, label }) => {
            const isActive = currentView === view;
            const isTimerRunning = view === "timer" && timerState.isRunning;

            return (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className="relative flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200"
                style={{
                  color: isActive ? "var(--accent-current)" : "var(--text-muted)",
                }}
              >
                {isTimerRunning && (
                  <span
                    className="absolute top-1 right-3 w-2 h-2 rounded-full animate-pulse"
                    style={{
                      background: "var(--accent-lime)",
                      boxShadow: "var(--glow-lime)",
                    }}
                  />
                )}
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1 font-medium">{label}</span>
                {isActive && (
                  <div
                    className="absolute -bottom-1 w-1 h-1 rounded-full"
                    style={{
                      background: "var(--accent-current)",
                      boxShadow: "var(--glow-current)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
