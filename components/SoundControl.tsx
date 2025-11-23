import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundService } from "../services/soundService";
import { SoundSettings } from "../types";

const SoundControl: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(
    soundService.getSettings().enabled
  );

  const toggleSound = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    soundService.updateSettings({ enabled: newEnabled });

    // Reproducir sonido de prueba si se activa
    if (newEnabled) {
      soundService.playSound("start");
    }
  };

  return (
    <button
      onClick={toggleSound}
      className={`
        p-2 rounded-lg transition-all
        ${
          enabled
            ? "text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
            : "text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        }
      `}
      title={enabled ? "Desactivar sonidos" : "Activar sonidos"}
    >
      {enabled ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </button>
  );
};

export default SoundControl;
