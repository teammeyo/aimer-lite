
export enum GameState {
  MENU = 'MENU',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export enum GameMode {
  STANDARD = 'STANDARD',
  GRID_SHOT = 'GRID_SHOT',
  SPIDER_SHOT = 'SPIDER_SHOT',
  MICRO_SHOT = 'MICRO_SHOT',
  BLINK_SHOT = 'BLINK_SHOT',
  HUMAN_STRAFE = 'HUMAN_STRAFE', // New Human mode
  TRACKING = 'TRACKING', // New Tracking mode
  MARATHON = 'MARATHON'
}

export interface GameSettings {
  language: 'ja' | 'en'; // Language setting

  fov: number;
  duration: number; // seconds
  sensitivity: number;
  volume: number;
  targetSize: number; // Multiplier (0.5 - 2.0)
  
  // Mode Specifics
  trackingJump: boolean;

  // Environment
  skyColor: string;
  gridColor: string;
  groundColor: string;
  targetColor: string;
  enemyOutlineColor: string;

  // Crosshair - General
  crosshairColor: string;
  crosshairOutline: boolean;
  crosshairOutlineThickness: number;
  crosshairOutlineOpacity: number;

  // Crosshair - Center Dot
  crosshairDot: boolean;
  crosshairDotSize: number;
  crosshairDotOpacity: number;

  // Crosshair - Inner Lines
  crosshairInnerShow: boolean;
  crosshairInnerOpacity: number;
  crosshairInnerLength: number;
  crosshairInnerThickness: number;
  crosshairInnerOffset: number; // Gap

  // Crosshair - Outer Lines
  crosshairOuterShow: boolean;
  crosshairOuterOpacity: number;
  crosshairOuterLength: number;
  crosshairOuterThickness: number;
  crosshairOuterOffset: number;
}

export interface GameStats {
  score: number;
  totalClicks: number;
  hits: number;
  misses: number;
  accuracy: number;
  startTime: number;
  endTime: number;
  mode: GameMode; // Record which mode was played
}

export interface TargetData {
  id: number;
  position: [number, number, number];
  spawnTime: number;
  hp: number; // Current HP
  maxHp: number; // Max HP (1 for spheres, 2 for humans, 50 for tracking)
  velocity?: [number, number, number]; // For tracking mode
}
