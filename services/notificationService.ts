// Servicio para gestionar notificaciones del navegador y PWA

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  data?: any;
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default';

class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    // Singleton
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Verifica si el navegador soporta notificaciones
   */
  public isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Obtiene el estado actual de los permisos de notificación
   */
  public getPermissionStatus(): NotificationPermissionStatus {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Verifica si las notificaciones están habilitadas
   */
  public isEnabled(): boolean {
    return this.getPermissionStatus() === 'granted';
  }

  /**
   * Solicita permiso para mostrar notificaciones
   */
  public async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      console.warn('Las notificaciones no son soportadas en este navegador');
      return 'denied';
    }

    if (this.getPermissionStatus() !== 'default') {
      return this.getPermissionStatus();
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return 'denied';
    }
  }

  /**
   * Muestra una notificación
   */
  public async show(options: NotificationOptions): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Las notificaciones no son soportadas');
      return;
    }

    if (!this.isEnabled()) {
      console.warn('Las notificaciones no están habilitadas');
      return;
    }

    try {
      // Si hay un service worker registrado, usar su API
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icon.svg',
          badge: options.badge || '/icon.svg',
          tag: options.tag,
          requireInteraction: options.requireInteraction,
          silent: options.silent,
          vibrate: options.vibrate,
          data: options.data,
        });
      } else {
        // Fallback a notificación estándar
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon.svg',
          tag: options.tag,
          requireInteraction: options.requireInteraction,
          silent: options.silent,
          vibrate: options.vibrate,
          data: options.data,
        });

        // Auto-cerrar después de 5 segundos si no requiere interacción
        if (!options.requireInteraction) {
          setTimeout(() => notification.close(), 5000);
        }
      }
    } catch (error) {
      console.error('Error al mostrar notificación:', error);
    }
  }

  /**
   * Notificación para fin de periodo de trabajo
   */
  public async notifyWorkPeriodEnd(technique: string, breakDuration: number): Promise<void> {
    await this.show({
      title: '⏰ ¡Tiempo de Descanso!',
      body: `¡Excelente trabajo con ${technique}! Tómate ${Math.floor(breakDuration / 60)} minutos de descanso.`,
      tag: 'work-end',
      vibrate: [200, 100, 200],
      requireInteraction: false,
    });
  }

  /**
   * Notificación para fin de periodo de descanso
   */
  public async notifyBreakPeriodEnd(): Promise<void> {
    await this.show({
      title: '🚀 ¡Vuelve al Trabajo!',
      body: 'Tu descanso ha terminado. ¡Es hora de continuar con tu sesión de estudio!',
      tag: 'break-end',
      vibrate: [200, 100, 200],
      requireInteraction: false,
    });
  }

  /**
   * Notificación para ciclo completado
   */
  public async notifyCycleComplete(
    cycleNumber: number,
    dailyCount: number,
    weeklyCount: number
  ): Promise<void> {
    await this.show({
      title: '🎉 ¡Ciclo Completado!',
      body: `¡Felicidades! Has completado el ciclo ${cycleNumber}.\nHoy: ${dailyCount} ciclos | Semana: ${weeklyCount} ciclos`,
      tag: 'cycle-complete',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: false,
    });
  }

  /**
   * Notificación personalizada para logros
   */
  public async notifyAchievement(title: string, message: string): Promise<void> {
    await this.show({
      title: `🏆 ${title}`,
      body: message,
      tag: 'achievement',
      vibrate: [100, 50, 100, 50, 100, 50, 100],
      requireInteraction: false,
    });
  }

  /**
   * Notificación de recordatorio (para cuando la app está en background)
   */
  public async notifyReminder(message: string): Promise<void> {
    await this.show({
      title: '⏱️ FocusFlow - Recordatorio',
      body: message,
      tag: 'reminder',
      vibrate: [200],
      requireInteraction: false,
    });
  }
}

// Exportar instancia singleton
export const notificationService = NotificationService.getInstance();
