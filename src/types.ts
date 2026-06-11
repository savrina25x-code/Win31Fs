export type AppId = 'progman' | 'notepad' | 'paintbrush' | 'minesweeper' | 'calculator' | 'clock' | 'cpanel' | 'media';

export interface WindowState {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  zIndex: number;
}

export type ThemeScheme = 'default' | 'hotdog' | 'emerald' | 'highcontrast' | 'plum' | 'pixelart';

export interface ColorTheme {
  name: string;
  desktopBg: string; // Background color of the desktop
  windowBg: string;  // Background of client area
  titleActiveBg: string; // Active titlebar background
  titleActiveText: string;
  titleInactiveBg: string; // Inactive titlebar background
  titleInactiveText: string;
  buttonFace: string; // Bevel / dialog body color
  buttonShadow: string;
  buttonHighlight: string;
  textColor: string;
  textMuted: string;
}

export const THEME_SCHEMES: Record<ThemeScheme, ColorTheme> = {
  default: {
    name: 'Windows Default (Teal)',
    desktopBg: '#008080',
    windowBg: '#FFFFFF',
    titleActiveBg: '#000080',
    titleActiveText: '#FFFFFF',
    titleInactiveBg: '#C0C0C0',
    titleInactiveText: '#808080',
    buttonFace: '#C0C0C0',
    buttonShadow: '#808080',
    buttonHighlight: '#FFFFFF',
    textColor: '#000000',
    textMuted: '#808080',
  },
  pixelart: {
    name: 'Pixel Art (8-Bit Neon)',
    desktopBg: '#2a0845',
    windowBg: '#111116',
    titleActiveBg: '#ff007f',
    titleActiveText: '#00ffff',
    titleInactiveBg: '#441151',
    titleInactiveText: '#888888',
    buttonFace: '#32103c',
    buttonShadow: '#000000',
    buttonHighlight: '#ff007f',
    textColor: '#00ffff',
    textMuted: '#ffff00',
  },
  hotdog: {
    name: 'Hotdog Stand',
    desktopBg: '#000000',
    windowBg: '#FFFFFF',
    titleActiveBg: '#FF0000',
    titleActiveText: '#FFFF00',
    titleInactiveBg: '#000000',
    titleInactiveText: '#FFFFFF',
    buttonFace: '#FF0000',
    buttonShadow: '#FF8000',
    buttonHighlight: '#FFFF00',
    textColor: '#000000',
    textMuted: '#800000',
  },
  emerald: {
    name: 'Emerald Forest',
    desktopBg: '#105B34',
    windowBg: '#E6F4EA',
    titleActiveBg: '#0F7C46',
    titleActiveText: '#FFFFFF',
    titleInactiveBg: '#A3D9C9',
    titleInactiveText: '#3B685C',
    buttonFace: '#D0E9E1',
    buttonShadow: '#79AFAA',
    buttonHighlight: '#FFFFFF',
    textColor: '#0B221E',
    textMuted: '#79AFAA',
  },
  highcontrast: {
    name: 'High Contrast Black',
    desktopBg: '#000000',
    windowBg: '#000000',
    titleActiveBg: '#FFFFFF',
    titleActiveText: '#000000',
    titleInactiveBg: '#000000',
    titleInactiveText: '#C0C0C0',
    buttonFace: '#000000',
    buttonShadow: '#808080',
    buttonHighlight: '#FFFFFF',
    textColor: '#FFFFFF',
    textMuted: '#808080',
  },
  plum: {
    name: 'Plum Classic',
    desktopBg: '#400040',
    windowBg: '#FCEBF5',
    titleActiveBg: '#7A1C49',
    titleActiveText: '#FFFFFF',
    titleInactiveBg: '#D8B3C8',
    titleInactiveText: '#7A1C49',
    buttonFace: '#E8CCD8',
    buttonShadow: '#9A6B85',
    buttonHighlight: '#FFFFFF',
    textColor: '#2E081B',
    textMuted: '#9A6B85',
  }
};
