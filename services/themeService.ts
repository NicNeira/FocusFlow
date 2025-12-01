import { ColorPalette, ColorPaletteId, ThemeSettings } from '../types';

const THEME_STORAGE_KEY = 'focusflow_theme_settings_v1';

// 5 paletas de colores predefinidas
export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'violet',
    name: 'Violeta',
    colors: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
  },
  {
    id: 'blue',
    name: 'Azul',
    colors: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    colors: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
  },
  {
    id: 'rose',
    name: 'Rosa',
    colors: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    },
  },
  {
    id: 'amber',
    name: 'Ámbar',
    colors: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
  },
];

const DEFAULT_THEME: ThemeSettings = {
  darkMode: true,
  colorPalette: 'violet',
};

class ThemeService {
  private settings: ThemeSettings;

  constructor() {
    this.settings = this.loadSettings();
    this.applyTheme();
  }

  private loadSettings(): ThemeSettings {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_THEME, ...parsed };
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
    return DEFAULT_THEME;
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving theme settings:', error);
    }
  }

  getSettings(): ThemeSettings {
    return { ...this.settings };
  }

  getPalette(id?: ColorPaletteId): ColorPalette {
    const paletteId = id || this.settings.colorPalette;
    return COLOR_PALETTES.find((p) => p.id === paletteId) || COLOR_PALETTES[0];
  }

  getAllPalettes(): ColorPalette[] {
    return COLOR_PALETTES;
  }

  setDarkMode(enabled: boolean): void {
    this.settings.darkMode = enabled;
    this.saveSettings();
    this.applyDarkMode();
  }

  setColorPalette(paletteId: ColorPaletteId): void {
    this.settings.colorPalette = paletteId;
    this.saveSettings();
    this.applyColorPalette();
  }

  applyTheme(): void {
    this.applyDarkMode();
    this.applyColorPalette();
  }

  private applyDarkMode(): void {
    if (this.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private applyColorPalette(): void {
    const palette = this.getPalette();
    const root = document.documentElement;

    // Aplicar CSS variables para los colores primarios
    Object.entries(palette.colors).forEach(([shade, color]) => {
      root.style.setProperty(`--color-primary-${shade}`, color);
    });

    // Actualizar también el theme-color del PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', palette.colors[600]);
    }
  }
}

export const themeService = new ThemeService();
