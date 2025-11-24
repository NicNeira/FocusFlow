import { StudyTechnique, TechniqueConfig } from '../types';

// Técnicas predefinidas
const TECHNIQUES: Record<
  StudyTechnique,
  Omit<TechniqueConfig, 'isBreakTime' | 'cyclesCompleted' | 'currentCycle'>
> = {
  libre: {
    type: 'libre',
    workDuration: 0, // Sin límite
    breakDuration: 0,
  },
  pomodoro: {
    type: 'pomodoro',
    workDuration: 25 * 60, // 25 minutos
    breakDuration: 5 * 60, // 5 minutos
  },
  '52-17': {
    type: '52-17',
    workDuration: 52 * 60, // 52 minutos
    breakDuration: 17 * 60, // 17 minutos
  },
};

/**
 * Obtiene la configuración inicial de una técnica
 */
export const getTechniqueConfig = (type: StudyTechnique): TechniqueConfig => {
  const base = TECHNIQUES[type];
  return {
    ...base,
    isBreakTime: false,
    cyclesCompleted: 0,
    currentCycle: 1,
  };
};

/**
 * Verifica si debe transicionar a tiempo de descanso
 */
export const shouldTransitionToBreak = (
  elapsed: number,
  config: TechniqueConfig
): boolean => {
  // Solo aplica a técnicas con duración definida
  if (config.workDuration === 0) return false;
  // Solo si no está en descanso
  if (config.isBreakTime) return false;
  // Si el tiempo transcurrido alcanzó la duración de trabajo
  return elapsed >= config.workDuration;
};

/**
 * Verifica si debe transicionar a tiempo de trabajo
 */
export const shouldTransitionToWork = (
  elapsed: number,
  config: TechniqueConfig
): boolean => {
  // Solo aplica a técnicas con duración definida
  if (config.breakDuration === 0) return false;
  // Solo si está en descanso
  if (!config.isBreakTime) return false;
  // Si el tiempo transcurrido alcanzó la duración de descanso
  return elapsed >= config.breakDuration;
};

/**
 * Incrementa el contador de ciclos
 */
export const incrementCycle = (config: TechniqueConfig): TechniqueConfig => {
  return {
    ...config,
    cyclesCompleted: config.cyclesCompleted + 1,
    currentCycle: config.currentCycle + 1,
  };
};

/**
 * Resetea los ciclos
 */
export const resetCycles = (config: TechniqueConfig): TechniqueConfig => {
  return {
    ...config,
    cyclesCompleted: 0,
    currentCycle: 1,
    isBreakTime: false,
  };
};

/**
 * Marca el inicio del tiempo de descanso
 */
export const startBreakTime = (config: TechniqueConfig): TechniqueConfig => {
  return {
    ...config,
    isBreakTime: true,
  };
};

/**
 * Marca el inicio del tiempo de trabajo
 */
export const startWorkTime = (config: TechniqueConfig): TechniqueConfig => {
  return {
    ...config,
    isBreakTime: false,
  };
};

/**
 * Obtiene el tiempo restante en segundos para la fase actual
 */
export const getRemainingTime = (
  elapsed: number,
  config: TechniqueConfig
): number | null => {
  if (config.type === 'libre') return null;
  
  const targetDuration = config.isBreakTime 
    ? config.breakDuration 
    : config.workDuration;
  
  return Math.max(0, targetDuration - elapsed);
};

/**
 * Obtiene el progreso de la fase actual (0-1)
 */
export const getPhaseProgress = (
  elapsed: number,
  config: TechniqueConfig
): number => {
  if (config.type === 'libre') return 0;
  
  const targetDuration = config.isBreakTime 
    ? config.breakDuration 
    : config.workDuration;
  
  return Math.min(1, elapsed / targetDuration);
};
