// Servicio para manejar el favicon dinámico basado en el estado del timer

export class FaviconService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentFavicon: HTMLLinkElement | null = null;
  private animationFrame: number | null = null;
  private isBlinking = false;
  private blinkState = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 32;
    this.canvas.height = 32;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Crear o encontrar el elemento link del favicon
    this.currentFavicon = document.querySelector('link[rel="icon"]') || 
                         document.querySelector('link[rel="shortcut icon"]');
    
    if (!this.currentFavicon) {
      this.currentFavicon = document.createElement('link');
      this.currentFavicon.rel = 'icon';
      document.head.appendChild(this.currentFavicon);
    }
  }

  private drawIcon(color: string, isBlinking: boolean = false, blinkState: boolean = false) {
    // Limpiar canvas
    this.ctx.clearRect(0, 0, 32, 32);
    
    // Si está parpadeando y el estado de parpadeo es false, no dibujar nada (efecto parpadeo)
    if (isBlinking && !blinkState) {
      this.updateFavicon();
      return;
    }

    // Dibujar círculo de fondo
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(16, 16, 14, 0, 2 * Math.PI);
    this.ctx.fill();

    // Dibujar icono de reloj (líneas del reloj)
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';

    // Manecilla de hora (línea corta)
    this.ctx.beginPath();
    this.ctx.moveTo(16, 16);
    this.ctx.lineTo(16, 8);
    this.ctx.stroke();

    // Manecilla de minuto (línea más larga)
    this.ctx.beginPath();
    this.ctx.moveTo(16, 16);
    this.ctx.lineTo(22, 10);
    this.ctx.stroke();

    // Punto central
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(16, 16, 2, 0, 2 * Math.PI);
    this.ctx.fill();

    this.updateFavicon();
  }

  private updateFavicon() {
    if (this.currentFavicon) {
      this.currentFavicon.href = this.canvas.toDataURL('image/png');
    }
  }

  private startBlinking(color: string) {
    if (this.isBlinking) return;
    
    this.isBlinking = true;
    this.blinkState = true;

    const blink = () => {
      this.blinkState = !this.blinkState;
      this.drawIcon(color, true, this.blinkState);
      
      if (this.isBlinking) {
        this.animationFrame = window.setTimeout(blink, 800); // Parpadeo cada 800ms
      }
    };

    blink();
  }

  private stopBlinking() {
    this.isBlinking = false;
    if (this.animationFrame) {
      clearTimeout(this.animationFrame);
      this.animationFrame = null;
    }
  }

  // Método público para actualizar el favicon según el estado del timer
  public updateFaviconState(isRunning: boolean, isPaused: boolean, hasTime: boolean) {
    this.stopBlinking();

    if (isRunning) {
      // Timer en funcionamiento - verde parpadeante
      this.startBlinking('#10b981'); // verde
    } else if (isPaused || hasTime) {
      // Timer pausado o con tiempo acumulado - rojo sólido
      this.drawIcon('#ef4444'); // rojo
    } else {
      // Sin timer iniciado - gris sólido
      this.drawIcon('#6b7280'); // gris
    }
  }

  // Método para limpiar recursos
  public destroy() {
    this.stopBlinking();
  }
}

// Instancia singleton del servicio
export const faviconService = new FaviconService();