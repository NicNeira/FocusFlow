import React, { useState, useEffect } from "react";
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Vibrate,
  X,
  CheckCircle,
  Palette,
  Check,
} from "lucide-react";
import {
  NotificationSettings as NotificationSettingsType,
  ColorPaletteId,
} from "../types";
import { notificationService } from "../services/notificationService";
import { audioService } from "../services/audioService";
import { themeService, COLOR_PALETTES } from "../services/themeService";

interface SettingsProps {
  settings: NotificationSettingsType;
  onSettingsChange: (settings: NotificationSettingsType) => void;
  currentPalette: ColorPaletteId;
  onPaletteChange: (palette: ColorPaletteId) => void;
}

const SettingsComponent: React.FC<SettingsProps> = ({
  settings,
  onSettingsChange,
  currentPalette,
  onPaletteChange,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string>("default");
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [testingSound, setTestingSound] = useState(false);

  useEffect(() => {
    // Verificar estado de permisos al montar
    const status = notificationService.getPermissionStatus();
    setPermissionStatus(status);

    // Mostrar banner si los permisos no han sido concedidos
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

      // Mostrar notificación de prueba
      await notificationService.show({
        title: "🎉 ¡Notificaciones Activadas!",
        body: "Recibirás alertas cuando terminen tus sesiones de estudio.",
      });
    }
  };

  const handleToggleNotifications = async () => {
    if (!settings.enabled) {
      // Intentar activar - solicitar permisos si es necesario
      if (permissionStatus !== "granted") {
        await handleRequestPermission();
      } else {
        onSettingsChange({ ...settings, enabled: true });
      }
    } else {
      // Desactivar
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

  return (
    <div className="space-y-4">
      {/* Banner de solicitud de permisos */}
      {showPermissionBanner && permissionStatus === "default" && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-1">
                  ¿Activar notificaciones?
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  Recibe alertas cuando terminen tus sesiones de trabajo y
                  descanso, incluso si la app está en segundo plano.
                </p>
                <button
                  onClick={handleRequestPermission}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Activar Notificaciones
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowPermissionBanner(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Notificaciones bloqueadas */}
      {permissionStatus === "denied" && settings.enabled && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <BellOff className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-white mb-1">
                Notificaciones bloqueadas
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Has bloqueado las notificaciones. Para activarlas, ve a la
                configuración de tu navegador.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuración de Notificaciones */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {settings.enabled ? (
              <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">
                Notificaciones
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {settings.enabled ? "Activadas" : "Desactivadas"}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled
                ? "bg-primary-600"
                : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {settings.enabled && (
          <div className="space-y-3 pl-8 border-l-2 border-primary-200 dark:border-primary-800 ml-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.workEndEnabled}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    workEndEnabled: e.target.checked,
                  })
                }
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Fin de periodo de trabajo
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.breakEndEnabled}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    breakEndEnabled: e.target.checked,
                  })
                }
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Fin de periodo de descanso
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cycleCompleteEnabled}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    cycleCompleteEnabled: e.target.checked,
                  })
                }
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Ciclo completado
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Configuración de Sonido */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">
                Sonido
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {settings.soundEnabled ? "Activado" : "Desactivado"}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleSound}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.soundEnabled
                ? "bg-primary-600"
                : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.soundEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {settings.soundEnabled && (
          <div className="space-y-4 pl-8 border-l-2 border-primary-200 dark:border-primary-800 ml-2">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300 mb-2 block">
                Volumen: {Math.round(settings.soundVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.soundVolume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>

            <button
              onClick={handleTestSound}
              disabled={testingSound}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
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

      {/* Configuración de Vibración */}
      {audioService.isVibrationSupported() ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Vibrate className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Vibración
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {settings.vibrationEnabled ? "Activada" : "Desactivada"}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleVibration}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.vibrationEnabled
                  ? "bg-primary-600"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.vibrationEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {settings.vibrationEnabled && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => audioService.vibrate([200, 100, 200])}
                className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Vibrate className="w-4 h-4" />
                <span>Probar Vibración</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-3">
            <Vibrate className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            <div>
              <h3 className="font-semibold text-slate-500 dark:text-slate-400">
                Vibración
              </h3>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No disponible en este dispositivo
                {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
                  <span className="block mt-1">
                    (iOS/Safari no soporta vibración)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuración de Paleta de Colores */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <Palette className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Paleta de Colores
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Personaliza el aspecto de la aplicación
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {COLOR_PALETTES.map((palette) => (
            <button
              key={palette.id}
              onClick={() => onPaletteChange(palette.id)}
              className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                currentPalette === palette.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
              title={palette.name}
            >
              {/* Color Preview */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm mb-2">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${palette.colors[400]} 0%, ${palette.colors[600]} 100%)`,
                  }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center">
                {palette.name}
              </span>
              {/* Checkmark */}
              {currentPalette === palette.id && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Preview de colores */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Vista previa:
          </p>
          <div className="flex space-x-1">
            {[400, 500, 600, 700].map((shade) => {
              const palette = COLOR_PALETTES.find(
                (p) => p.id === currentPalette
              );
              const color =
                palette?.colors[shade as keyof typeof palette.colors] ||
                "#8b5cf6";
              return (
                <div
                  key={shade}
                  className="flex-1 h-6 rounded transition-colors"
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;
