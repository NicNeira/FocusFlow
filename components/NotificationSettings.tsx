import React, { useState, useEffect } from "react";
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Vibrate,
  X,
  CheckCircle,
  Check,
  Loader2,
  Settings,
  Zap,
} from "lucide-react";
import {
  NotificationSettings as NotificationSettingsType,
} from "../types";
import { notificationService } from "../services/notificationService";
import { audioService } from "../services/audioService";

interface SettingsProps {
  settings: NotificationSettingsType;
  onSettingsChange: (settings: NotificationSettingsType) => void;
}

const SettingsComponent: React.FC<SettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string>("default");
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [testingWorkEnd, setTestingWorkEnd] = useState(false);
  const [testingBreakEnd, setTestingBreakEnd] = useState(false);
  const [testingCycleComplete, setTestingCycleComplete] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    notificationPermission: "default",
    vibrationSupported: false,
    audioContextState: "unknown",
    serviceWorkerRegistered: false,
  });

  useEffect(() => {
    const status = notificationService.getPermissionStatus();
    setPermissionStatus(status);

    if (status === "default" && settings.enabled) {
      setShowPermissionBanner(true);
    }
  }, [settings.enabled]);

  const handleRequestPermission = async () => {
    const status = await notificationService.requestPermission();
    setPermissionStatus(status);

    if (status === "granted") {
      setShowPermissionBanner(false);
      onSettingsChange({ ...settings, enabled: true });

      await notificationService.show({
        title: "Notificaciones Activadas!",
        body: "Recibirás alertas cuando terminen tus sesiones de estudio.",
      });
    }
  };

  const handleToggleNotifications = async () => {
    if (!settings.enabled) {
      if (permissionStatus !== "granted") {
        await handleRequestPermission();
      } else {
        onSettingsChange({ ...settings, enabled: true });
      }
    } else {
      onSettingsChange({ ...settings, enabled: false });
    }
  };

  const handleToggleSound = () => {
    const newSoundEnabled = !settings.soundEnabled;
    audioService.setEnabled(newSoundEnabled);
    onSettingsChange({ ...settings, soundEnabled: newSoundEnabled });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    audioService.setVolume(volume);
    onSettingsChange({ ...settings, soundVolume: volume });
  };

  const handleTestSound = async () => {
    setTestingSound(true);
    await audioService.playCycleComplete();
    setTimeout(() => setTestingSound(false), 1000);
  };

  const handleToggleVibration = () => {
    onSettingsChange({
      ...settings,
      vibrationEnabled: !settings.vibrationEnabled,
    });
  };

  const handleTestWorkEnd = async () => {
    setTestingWorkEnd(true);

    if (
      settings.enabled &&
      settings.workEndEnabled &&
      permissionStatus === "granted"
    ) {
      await notificationService.notifyWorkPeriodEnd("Pomodoro", 300);
    }

    if (settings.soundEnabled) {
      await audioService.play("work-end");
    }

    if (settings.vibrationEnabled) {
      audioService.vibrate([200, 100, 200]);
    }

    setTimeout(() => setTestingWorkEnd(false), 2000);
  };

  const handleTestBreakEnd = async () => {
    setTestingBreakEnd(true);

    if (
      settings.enabled &&
      settings.breakEndEnabled &&
      permissionStatus === "granted"
    ) {
      await notificationService.notifyBreakPeriodEnd();
    }

    if (settings.soundEnabled) {
      await audioService.play("break-end");
    }

    if (settings.vibrationEnabled) {
      audioService.vibrate([200, 100, 200]);
    }

    setTimeout(() => setTestingBreakEnd(false), 2000);
  };

  const handleTestCycleComplete = async () => {
    setTestingCycleComplete(true);

    if (
      settings.enabled &&
      settings.cycleCompleteEnabled &&
      permissionStatus === "granted"
    ) {
      await notificationService.notifyCycleComplete(5, 3, 12);
    }

    if (settings.soundEnabled) {
      await audioService.play("cycle-complete");
    }

    if (settings.vibrationEnabled) {
      audioService.vibrate([200, 100, 200, 100, 200]);
    }

    setTimeout(() => setTestingCycleComplete(false), 2000);
  };

  const updateDiagnostics = async () => {
    const swRegistration =
      "serviceWorker" in navigator && navigator.serviceWorker.controller;

    setDiagnostics({
      notificationPermission: notificationService.getPermissionStatus(),
      vibrationSupported: audioService.isVibrationSupported(),
      audioContextState:
        (audioService as any).audioContext?.state || "unknown",
      serviceWorkerRegistered: !!swRegistration,
    });
  };

  useEffect(() => {
    updateDiagnostics();
  }, []);

  // Toggle Switch component
  const ToggleSwitch = ({
    enabled,
    onToggle,
    color = "cyan",
  }: {
    enabled: boolean;
    onToggle: () => void;
    color?: "cyan" | "magenta" | "lime" | "violet";
  }) => {
    const colors = {
      cyan: {
        bg: "var(--accent-cyan)",
        glow: "var(--glow-cyan)",
      },
      magenta: {
        bg: "var(--accent-magenta)",
        glow: "var(--glow-magenta)",
      },
      lime: {
        bg: "var(--accent-lime)",
        glow: "var(--glow-lime)",
      },
      violet: {
        bg: "var(--accent-violet)",
        glow: "0 0 20px rgba(139, 92, 246, 0.4)",
      },
    };

    return (
      <button
        onClick={onToggle}
        className="relative w-14 h-7 rounded-full transition-all duration-300"
        style={{
          background: enabled ? colors[color].bg : "var(--bg-elevated)",
          boxShadow: enabled ? colors[color].glow : "none",
        }}
      >
        <span
          className="absolute top-1 w-5 h-5 rounded-full transition-all duration-300"
          style={{
            background: enabled ? "var(--bg-base)" : "var(--text-muted)",
            left: enabled ? "calc(100% - 24px)" : "4px",
            boxShadow: enabled ? "none" : "0 2px 4px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    );
  };

  // Custom Checkbox component
  const CustomCheckbox = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
  }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        className="relative w-5 h-5 rounded-md transition-all duration-200"
        style={{
          background: checked
            ? "var(--accent-cyan)"
            : "var(--bg-elevated)",
          border: checked
            ? "none"
            : "1px solid var(--glass-border)",
          boxShadow: checked ? "var(--glow-cyan)" : "none",
        }}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <Check
            className="w-4 h-4 absolute top-0.5 left-0.5"
            style={{ color: "var(--bg-base)" }}
          />
        )}
      </div>
      <span
        className="text-sm transition-colors group-hover:text-white"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
    </label>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      {/* Header */}
      {/* Permission Banner */}
      {showPermissionBanner && permissionStatus === "default" && (
        <div
          className="glass-card p-5 animate-fade-in-up"
          style={{
            background:
              "linear-gradient(135deg, rgba(0, 245, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
            border: "1px solid rgba(0, 245, 255, 0.3)",
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0, 245, 255, 0.2)" }}
              >
                <Bell className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
              </div>
              <div className="flex-1">
                <h4
                  className="font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  ¿Activar notificaciones?
                </h4>
                <p
                  className="text-sm mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Recibe alertas cuando terminen tus sesiones de trabajo y
                  descanso, incluso si la app está en segundo plano.
                </p>
                <button
                  onClick={handleRequestPermission}
                  className="glow-btn px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                >
                  Activar Notificaciones
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowPermissionBanner(false)}
              className="p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Blocked Notifications Banner */}
      {permissionStatus === "denied" && settings.enabled && (
        <div
          className="glass-card p-5 animate-fade-in-up"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(239, 68, 68, 0.2)" }}
            >
              <BellOff className="w-5 h-5" style={{ color: "var(--status-error)" }} />
            </div>
            <div>
              <h4
                className="font-semibold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Notificaciones bloqueadas
              </h4>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Has bloqueado las notificaciones. Para activarlas, ve a la
                configuración de tu navegador.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Section */}
      <div
        className="glass-card p-6 animate-fade-in-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: settings.enabled
                  ? "rgba(0, 245, 255, 0.1)"
                  : "var(--bg-elevated)",
              }}
            >
              {settings.enabled ? (
                <Bell className="w-5 h-5" style={{ color: "var(--accent-cyan)" }} />
              ) : (
                <BellOff className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
              )}
            </div>
            <div>
              <h3
                className="font-semibold text-base"
                style={{ color: "var(--text-primary)" }}
              >
                Notificaciones
              </h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {settings.enabled ? "Activadas" : "Desactivadas"}
              </p>
            </div>
          </div>
          <ToggleSwitch
            enabled={settings.enabled}
            onToggle={handleToggleNotifications}
          />
        </div>

        {settings.enabled && (
          <div
            className="space-y-4 pt-5"
            style={{ borderTop: "1px solid var(--glass-border)" }}
          >
            <CustomCheckbox
              checked={settings.workEndEnabled}
              onChange={(checked) =>
                onSettingsChange({ ...settings, workEndEnabled: checked })
              }
              label="Fin de periodo de trabajo"
            />
            <CustomCheckbox
              checked={settings.breakEndEnabled}
              onChange={(checked) =>
                onSettingsChange({ ...settings, breakEndEnabled: checked })
              }
              label="Fin de periodo de descanso"
            />
            <CustomCheckbox
              checked={settings.cycleCompleteEnabled}
              onChange={(checked) =>
                onSettingsChange({ ...settings, cycleCompleteEnabled: checked })
              }
              label="Ciclo completado"
            />
          </div>
        )}
      </div>

      {/* Sound Section */}
      <div
        className="glass-card p-6 animate-fade-in-up"
        style={{ animationDelay: "0.15s" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: settings.soundEnabled
                  ? "rgba(255, 0, 255, 0.1)"
                  : "var(--bg-elevated)",
              }}
            >
              {settings.soundEnabled ? (
                <Volume2
                  className="w-5 h-5"
                  style={{ color: "var(--accent-magenta)" }}
                />
              ) : (
                <VolumeX className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
              )}
            </div>
            <div>
              <h3
                className="font-semibold text-base"
                style={{ color: "var(--text-primary)" }}
              >
                Sonido
              </h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {settings.soundEnabled ? "Activado" : "Desactivado"}
              </p>
            </div>
          </div>
          <ToggleSwitch
            enabled={settings.soundEnabled}
            onToggle={handleToggleSound}
            color="magenta"
          />
        </div>

        {settings.soundEnabled && (
          <div
            className="space-y-5 pt-5"
            style={{ borderTop: "1px solid var(--glass-border)" }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Volumen
                </span>
                <span
                  className="text-sm font-mono px-2 py-0.5 rounded-md"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--accent-magenta)",
                  }}
                >
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.soundVolume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--accent-magenta) 0%, var(--accent-magenta) ${
                      settings.soundVolume * 100
                    }%, var(--bg-elevated) ${settings.soundVolume * 100}%, var(--bg-elevated) 100%)`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleTestSound}
              disabled={testingSound}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{
                background: "var(--bg-elevated)",
                color: testingSound
                  ? "var(--accent-lime)"
                  : "var(--text-secondary)",
                border: "1px solid var(--glass-border)",
              }}
            >
              {testingSound ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Reproduciendo...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Probar Sonido</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Vibration Section */}
      <div
        className="glass-card p-6 animate-fade-in-up"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  audioService.isVibrationSupported() && settings.vibrationEnabled
                    ? "rgba(0, 255, 136, 0.1)"
                    : "var(--bg-elevated)",
              }}
            >
              <Vibrate
                className="w-5 h-5"
                style={{
                  color: audioService.isVibrationSupported()
                    ? settings.vibrationEnabled
                      ? "var(--accent-lime)"
                      : "var(--text-muted)"
                    : "var(--text-dim)",
                }}
              />
            </div>
            <div>
              <h3
                className="font-semibold text-base"
                style={{
                  color: audioService.isVibrationSupported()
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                }}
              >
                Vibración
              </h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {audioService.isVibrationSupported() ? (
                  settings.vibrationEnabled ? (
                    "Activada"
                  ) : (
                    "Desactivada"
                  )
                ) : (
                  <>
                    No disponible
                    {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
                      <span className="block text-xs mt-0.5">
                        (iOS/Safari no soporta vibración)
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
          {audioService.isVibrationSupported() && (
            <ToggleSwitch
              enabled={settings.vibrationEnabled}
              onToggle={handleToggleVibration}
              color="lime"
            />
          )}
        </div>

        {audioService.isVibrationSupported() && settings.vibrationEnabled && (
          <div
            className="pt-5 mt-5"
            style={{ borderTop: "1px solid var(--glass-border)" }}
          >
            <button
              onClick={() => audioService.vibrate([200, 100, 200])}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <Vibrate className="w-4 h-4" />
              <span>Probar Vibración</span>
            </button>
          </div>
        )}
      </div>

      {/* Test Notifications Section */}
      <div
        className="glass-card p-6 animate-fade-in-up"
        style={{ animationDelay: "0.25s" }}
      >
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(139, 92, 246, 0.1)" }}
          >
            <Zap className="w-5 h-5" style={{ color: "var(--accent-violet)" }} />
          </div>
          <div>
            <h3
              className="font-semibold text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Probar Notificaciones
            </h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Verifica que todo funcione correctamente
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleTestWorkEnd}
            disabled={testingWorkEnd}
            className="flex items-center justify-between w-full py-3.5 px-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] disabled:opacity-50"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <span>Probar Fin de Trabajo</span>
            {testingWorkEnd ? (
              <Loader2
                className="w-4 h-4 animate-spin"
                style={{ color: "var(--accent-cyan)" }}
              />
            ) : (
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--accent-cyan)" }}
              />
            )}
          </button>

          <button
            onClick={handleTestBreakEnd}
            disabled={testingBreakEnd}
            className="flex items-center justify-between w-full py-3.5 px-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] disabled:opacity-50"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <span>Probar Fin de Descanso</span>
            {testingBreakEnd ? (
              <Loader2
                className="w-4 h-4 animate-spin"
                style={{ color: "var(--accent-lime)" }}
              />
            ) : (
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--accent-lime)" }}
              />
            )}
          </button>

          <button
            onClick={handleTestCycleComplete}
            disabled={testingCycleComplete}
            className="flex items-center justify-between w-full py-3.5 px-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] disabled:opacity-50"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <span>Probar Ciclo Completado</span>
            {testingCycleComplete ? (
              <Loader2
                className="w-4 h-4 animate-spin"
                style={{ color: "var(--accent-magenta)" }}
              />
            ) : (
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--accent-magenta)" }}
              />
            )}
          </button>
        </div>
      </div>

      {/* System Diagnostics Section */}
      <div
        className="glass-card p-6 animate-fade-in-up"
        style={{
          animationDelay: "0.35s",
          background: "rgba(255, 255, 255, 0.02)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Settings
              className="w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <h3
              className="font-semibold text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Información del Sistema
            </h3>
          </div>
          <button
            onClick={updateDiagnostics}
            className="text-xs px-3 py-1 rounded-lg transition-all hover:bg-white/5"
            style={{ color: "var(--accent-cyan)" }}
          >
            Actualizar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div
            className="p-3 rounded-xl"
            style={{ background: "var(--bg-elevated)" }}
          >
            <span
              className="text-xs block mb-1"
              style={{ color: "var(--text-dim)" }}
            >
              Permisos
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color:
                  diagnostics.notificationPermission === "granted"
                    ? "var(--accent-lime)"
                    : diagnostics.notificationPermission === "denied"
                    ? "var(--status-error)"
                    : "#fbbf24",
              }}
            >
              {diagnostics.notificationPermission}
            </span>
          </div>

          <div
            className="p-3 rounded-xl"
            style={{ background: "var(--bg-elevated)" }}
          >
            <span
              className="text-xs block mb-1"
              style={{ color: "var(--text-dim)" }}
            >
              Vibración
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: diagnostics.vibrationSupported
                  ? "var(--accent-lime)"
                  : "var(--text-muted)",
              }}
            >
              {diagnostics.vibrationSupported ? "Sí" : "No"}
            </span>
          </div>

          <div
            className="p-3 rounded-xl"
            style={{ background: "var(--bg-elevated)" }}
          >
            <span
              className="text-xs block mb-1"
              style={{ color: "var(--text-dim)" }}
            >
              Audio
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {diagnostics.audioContextState}
            </span>
          </div>

          <div
            className="p-3 rounded-xl"
            style={{ background: "var(--bg-elevated)" }}
          >
            <span
              className="text-xs block mb-1"
              style={{ color: "var(--text-dim)" }}
            >
              Service Worker
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: diagnostics.serviceWorkerRegistered
                  ? "var(--accent-lime)"
                  : "var(--text-muted)",
              }}
            >
              {diagnostics.serviceWorkerRegistered ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;
