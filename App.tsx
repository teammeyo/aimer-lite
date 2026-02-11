
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameScene from './components/GameScene';
import { UIOverlay } from './components/UIOverlay';
import { GameState, GameStats, GameSettings, GameMode } from './types';

const STORAGE_KEY = 'liteaim_settings_v7'; // Bump version for language support

const DEFAULT_SETTINGS: GameSettings = {
  language: 'ja',
  fov: 103, // Standard competitive FOV
  duration: 60,
  sensitivity: 1.0,
  volume: 0.5,
  targetSize: 1.0, // Default scale multiplier
  
  // Mode Specifics
  trackingJump: true,

  // Environment (Default: Day)
  skyColor: '#e0f2fe',
  gridColor: '#06b6d4', // Mizuiro
  groundColor: '#f1f5f9',
  targetColor: '#06b6d4', // Cyan (High visibility)
  enemyOutlineColor: '#ffff00', // Valorant Yellow (Deuteranopia)

  // Crosshair Defaults (Cyan Cross)
  crosshairColor: '#00ffff',
  crosshairOutline: true,
  crosshairOutlineThickness: 1,
  crosshairOutlineOpacity: 0.5,
  
  crosshairDot: false,
  crosshairDotSize: 2,
  crosshairDotOpacity: 1,

  crosshairInnerShow: true,
  crosshairInnerOpacity: 1,
  crosshairInnerLength: 6,
  crosshairInnerThickness: 2,
  crosshairInnerOffset: 3,

  crosshairOuterShow: false,
  crosshairOuterOpacity: 0.5,
  crosshairOuterLength: 2,
  crosshairOuterThickness: 2,
  crosshairOuterOffset: 10,
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.GRID_SHOT);
  
  // The "Active" mode represents the actual behavior currently playing.
  // In Marathon, this changes dynamically. In others, it matches selectedMode.
  const [activeBehaviorMode, setActiveBehaviorMode] = useState<GameMode>(GameMode.GRID_SHOT);

  // Initialize settings from localStorage or defaults
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const loaded = JSON.parse(saved);
        // Deep merge to ensure new fields are populated
        return { ...DEFAULT_SETTINGS, ...loaded };
      }
    } catch (e) {
      console.warn("Failed to load settings:", e);
    }
    return DEFAULT_SETTINGS;
  });

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const [timeLeft, setTimeLeft] = useState(settings.duration * 1000);
  const [countdown, setCountdown] = useState(3);
  
  // Stats refs for high-frequency updates without re-renders for every single click
  const statsRef = useRef<GameStats>({
    score: 0,
    totalClicks: 0,
    hits: 0,
    misses: 0,
    accuracy: 0,
    startTime: 0,
    endTime: 0,
    mode: GameMode.GRID_SHOT
  });

  // State for UI display
  const [displayScore, setDisplayScore] = useState(0);
  const [displayAccuracy, setDisplayAccuracy] = useState(0);

  // Marathon Mode Logic
  const marathonIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Ref to track if game is ending intentionally to prevent Pause trigger
  const isGameEnding = useRef(false);

  // Keep a ref synced with gameState for event listeners to avoid stale closures
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  const startGame = useCallback((mode: GameMode = GameMode.GRID_SHOT) => {
    setSelectedMode(mode);
    setGameState(GameState.COUNTDOWN);
    setCountdown(3);
    isGameEnding.current = false;
    
    // Clear any existing intervals
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (marathonIntervalRef.current) clearInterval(marathonIntervalRef.current);

    const isMarathon = mode === GameMode.MARATHON;
    
    // If Marathon, infinite time. Else, use settings duration.
    setTimeLeft(isMarathon ? Number.MAX_SAFE_INTEGER : settings.duration * 1000);
    
    // Set initial behavior
    if (isMarathon) {
      setActiveBehaviorMode(GameMode.GRID_SHOT); // Start with grid
    } else {
      setActiveBehaviorMode(mode);
    }

    setDisplayScore(0);
    setDisplayAccuracy(100);
    
    statsRef.current = {
      score: 0,
      totalClicks: 0,
      hits: 0,
      misses: 0,
      accuracy: 100,
      startTime: Date.now(),
      endTime: 0,
      mode: mode
    };
  }, [settings.duration]);

  const resumeGame = useCallback(() => {
    setGameState(GameState.PLAYING);
    isGameEnding.current = false;
  }, []);

  const endGame = useCallback(() => {
    isGameEnding.current = true; // Set flag before exiting pointer lock
    statsRef.current.endTime = Date.now();
    
    // Clear Marathon interval immediately
    if (marathonIntervalRef.current) {
        window.clearInterval(marathonIntervalRef.current);
        marathonIntervalRef.current = null;
    }
    
    setGameState(GameState.FINISHED);
    
    // Force exit lock
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
  }, []);

  const goHome = useCallback(() => {
    setGameState(GameState.MENU);
  }, []);

  const updateStats = useCallback(() => {
    const s = statsRef.current;
    if (s.totalClicks > 0) {
      s.accuracy = (s.hits / s.totalClicks) * 100;
    } else {
      s.accuracy = 100;
    }
    setDisplayScore(s.score);
    setDisplayAccuracy(s.accuracy);
  }, []);

  const handleHit = useCallback((points: number = 100) => {
    if (gameState !== GameState.PLAYING) return;
    statsRef.current.hits += 1;
    statsRef.current.totalClicks += 1;
    statsRef.current.score += points; // Use dynamic points
    updateStats();
  }, [gameState, updateStats]);

  const handleMiss = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    statsRef.current.misses += 1;
    statsRef.current.totalClicks += 1;
    updateStats();
  }, [gameState, updateStats]);

  // Countdown Logic
  useEffect(() => {
    if (gameState === GameState.COUNTDOWN) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState(GameState.PLAYING);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      countdownIntervalRef.current = timer;
      return () => clearInterval(timer);
    }
  }, [gameState]);

  // Handle Pause via Pointer Lock
  useEffect(() => {
    const handleLockChange = () => {
      // 1. If we are intentionally ending the game, ignore this event to prevent switching to PAUSED
      if (isGameEnding.current) return;

      // 2. If we are already finished, ignore (covers race conditions where state updated but event fired late)
      if (gameStateRef.current === GameState.FINISHED) return;

      if (document.pointerLockElement === null) {
        // Lock lost
        if (gameStateRef.current === GameState.PLAYING) {
          setGameState(GameState.PAUSED);
        } else if (gameStateRef.current === GameState.COUNTDOWN) {
           setGameState(GameState.PAUSED);
           if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        }
      }
    };

    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []); // Empty dependency array ensures we don't re-bind, relying on Refs for current state

  // Handle 'R' to Retry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow retry if Playing, Paused, Countdown, or Finished
      if (
        gameState === GameState.PLAYING || 
        gameState === GameState.PAUSED || 
        gameState === GameState.FINISHED ||
        gameState === GameState.COUNTDOWN
      ) {
        if (e.key.toLowerCase() === 'r') {
          startGame(selectedMode);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedMode, startGame]);


  // Marathon Mode Switcher
  useEffect(() => {
    if (gameState === GameState.PLAYING && selectedMode === GameMode.MARATHON) {
      // Switch mode every 15 seconds
      const switchInterval = window.setInterval(() => {
         const modes = [
             GameMode.GRID_SHOT, 
             GameMode.MICRO_SHOT, 
             GameMode.SPIDER_SHOT, 
             GameMode.BLINK_SHOT,
             GameMode.HUMAN_STRAFE,
             GameMode.TRACKING // Add tracking to mix
         ];
         const nextMode = modes[Math.floor(Math.random() * modes.length)];
         setActiveBehaviorMode(nextMode);
      }, 15000);
      
      marathonIntervalRef.current = switchInterval;
      
      return () => clearInterval(switchInterval);
    }
  }, [gameState, selectedMode]);

  // Timer Logic: Decrement (Only if not Marathon)
  useEffect(() => {
    let interval: number;
    if (gameState === GameState.PLAYING && selectedMode !== GameMode.MARATHON) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) return 0;
          return prev - 100;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameState, selectedMode]);

  // Timer Logic: End Game Check
  useEffect(() => {
    if (gameState === GameState.PLAYING && selectedMode !== GameMode.MARATHON && timeLeft <= 0) {
        endGame();
    }
  }, [timeLeft, gameState, selectedMode, endGame]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden" style={{ backgroundColor: settings.skyColor }}>
      <GameScene 
        gameState={gameState} 
        gameMode={activeBehaviorMode} // Pass the BEHAVIOR mode, not the container mode
        settings={settings}
        onHit={handleHit} 
        onMiss={handleMiss}
        setGameState={setGameState}
      />
      
      <UIOverlay 
        gameState={gameState}
        selectedMode={selectedMode}
        activeBehaviorMode={activeBehaviorMode}
        settings={settings}
        onUpdateSettings={setSettings}
        score={displayScore}
        timeLeft={timeLeft}
        stats={statsRef.current}
        onStart={startGame}
        onRestart={() => startGame(statsRef.current.mode)}
        onResume={resumeGame}
        onHome={goHome}
        countdown={countdown}
      />
    </div>
  );
};

export default App;
