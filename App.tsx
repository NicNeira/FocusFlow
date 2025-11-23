import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Timer as TimerIcon, History as HistoryIcon, Moon, Sun, BookOpen } from 'lucide-react';
import { StudySession, ViewState, TimerState, Objective } from './types';
import { 
  loadSessions, saveSessions, 
  loadTimerState, saveTimerState,
  loadObjectives, saveObjectives,
  loadWeeklyTarget, saveWeeklyTarget
} from './services/storageService';
import Timer from './components/Timer';
import History from './components/History';
import Dashboard from './components/Dashboard';

function App() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('timer');
  const [darkMode, setDarkMode] = useState(true);

  // New State for Goals
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(10);

  // Lifted Timer State
  const [timerState, setTimerState] = useState<TimerState>(() => loadTimerState());
  const [now, setNow] = useState(Date.now()); // State to force re-render for timer tick

  useEffect(() => {
    // Load initial data
    setSessions(loadSessions());
    setObjectives(loadObjectives());
    setWeeklyTarget(loadWeeklyTarget());
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
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
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
      return timerState.accumulatedTime + Math.floor((now - timerState.startTime) / 1000);
    }
    return timerState.accumulatedTime;
  }, [timerState, now]);


  const addSession = (session: StudySession) => {
    setSessions(prev => [session, ...prev]);
  };

  const deleteSession = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
        setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  // Objectives Handlers
  const handleAddObjective = (text: string) => {
    const newObjective: Objective = {
      id: crypto.randomUUID(),
      text,
      isCompleted: false,
      createdAt: Date.now()
    };
    setObjectives(prev => [newObjective, ...prev]);
  };

  const handleToggleObjective = (id: string) => {
    setObjectives(prev => prev.map(obj => 
      obj.id === id ? { ...obj, isCompleted: !obj.isCompleted } : obj
    ));
  };

  const handleDeleteObjective = (id: string) => {
    setObjectives(prev => prev.filter(obj => obj.id !== id));
  };

  const handleUpdateWeeklyTarget = (hours: number) => {
    setWeeklyTarget(hours);
  };

  // Timer Handlers
  const handleStartTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now()
    }));
  };

  const handlePauseTimer = () => {
    setTimerState(prev => {
      if (!prev.startTime) return prev;
      // Calculate time passed in this segment
      const currentSegment = Math.floor((Date.now() - prev.startTime) / 1000);
      return {
        ...prev,
        isRunning: false,
        startTime: null,
        accumulatedTime: prev.accumulatedTime + currentSegment
      };
    });
  };

  const handleResetTimer = () => {
    // Only ask for confirmation if there is significant time recorded
    if (elapsedSeconds > 10 && !confirm("¿Estás seguro de reiniciar el contador? Se perderá el progreso actual.")) {
        return;
    }
    setTimerState({
      isRunning: false,
      startTime: null,
      accumulatedTime: 0,
      subject: 'General',
      notes: ''
    });
  };

  const handleSaveSession = () => {
    if (elapsedSeconds < 10) {
      alert("La sesión es muy corta para guardarse (< 10 segundos).");
      return;
    }

    const newSession: StudySession = {
      id: crypto.randomUUID(),
      subject: timerState.subject || 'General',
      startTime: Date.now() - (elapsedSeconds * 1000),
      endTime: Date.now(),
      durationSeconds: elapsedSeconds,
      notes: timerState.notes
    };

    addSession(newSession);

    // Reset timer after save
    setTimerState({
      isRunning: false,
      startTime: null,
      accumulatedTime: 0,
      subject: 'General',
      notes: ''
    });

    // Optionally go to history or show a success message? 
    // For now stay on timer to allow next session immediately.
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  const NavButton = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-20 ${
        currentView === view 
          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg transition-colors ${timerState.isRunning ? 'bg-green-500 animate-pulse' : 'bg-primary-600'}`}>
                <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400">
                FocusFlow
            </h1>
        </div>
        
        {/* Mini Timer Display in Header if not on Timer View */}
        {currentView !== 'timer' && elapsedSeconds > 0 && (
            <div 
                onClick={() => setCurrentView('timer')}
                className="hidden md:flex items-center px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-600 dark:text-primary-400 text-sm font-mono font-bold cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
            >
                <div className={`w-2 h-2 rounded-full mr-2 ${timerState.isRunning ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                {Math.floor(elapsedSeconds / 3600).toString().padStart(2,'0')}:
                {Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2,'0')}:
                {(elapsedSeconds % 60).toString().padStart(2,'0')}
            </div>
        )}

        <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
        >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {currentView === 'timer' && (
             <div className="flex flex-col items-center animate-fade-in">
                 <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">Tu tiempo de enfoque</h2>
                 <p className="text-slate-500 dark:text-slate-400 mb-8">Elige una asignatura y comienza a medir tu progreso.</p>
                 <Timer 
                    isRunning={timerState.isRunning}
                    elapsedSeconds={elapsedSeconds}
                    subject={timerState.subject}
                    notes={timerState.notes}
                    onSubjectChange={(val) => setTimerState(prev => ({...prev, subject: val}))}
                    onNotesChange={(val) => setTimerState(prev => ({...prev, notes: val}))}
                    onStart={handleStartTimer}
                    onPause={handlePauseTimer}
                    onReset={handleResetTimer}
                    onSave={handleSaveSession}
                 />
             </div>
        )}
        {currentView === 'dashboard' && (
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
        {currentView === 'history' && <History sessions={sessions} onDeleteSession={deleteSession} />}
      </main>

      {/* Bottom Navigation for Mobile / Tab Bar style */}
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 px-6 flex justify-around md:justify-center md:space-x-12 z-40 md:relative md:border-t-0 md:bg-transparent md:dark:bg-transparent md:pb-8">
        <NavButton view="dashboard" icon={LayoutDashboard} label="Dashboard" />
        
        {/* Timer Button with active indicator */}
        <button
          onClick={() => setCurrentView('timer')}
          className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all w-20 ${
            currentView === 'timer'
              ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
            {timerState.isRunning && (
                <span className="absolute top-2 right-4 w-2 h-2 bg-green-500 rounded-full animate-pulse border border-white dark:border-slate-900"></span>
            )}
          <TimerIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Timer</span>
        </button>

        <NavButton view="history" icon={HistoryIcon} label="Historial" />
      </nav>
      
      {/* Mobile safe area spacing */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
}

export default App;