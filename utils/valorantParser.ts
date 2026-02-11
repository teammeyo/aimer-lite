
import { GameSettings } from "../types";

// Valorant Color Map
const VAL_COLORS = [
  '#ffffff', // 0: White
  '#00ff00', // 1: Green
  '#7fff00', // 2: Yellow Green
  '#dfff00', // 3: Green Yellow
  '#ffff00', // 4: Yellow
  '#00ffff', // 5: Cyan
  '#ff00ff', // 6: Pink
  '#ff0000', // 7: Red
];

export const parseValorantCode = (code: string, currentSettings: GameSettings): Partial<GameSettings> => {
  if (!code.startsWith('0;')) {
    throw new Error("Invalid code format");
  }

  const parts = code.split(';');
  const updates: Partial<GameSettings> = {};

  // Default to primary mode parsing
  let isPrimary = false;

  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    const value = parts[i + 1];

    if (key === 'P') {
      isPrimary = true;
      continue;
    }

    if (!isPrimary) continue; // Simplification: Only parsing primary crosshair for now

    // Color
    if (key === 'c' && value) {
      const colorIdx = parseInt(value);
      if (VAL_COLORS[colorIdx]) updates.crosshairColor = VAL_COLORS[colorIdx];
      i++;
    }
    // Custom Color
    if (key === 'u' && value) {
      updates.crosshairColor = `#${value}`;
      i++;
    }
    
    // Outlines
    if (key === 'h' && value) {
      updates.crosshairOutline = value !== '0';
      i++;
    }
    if (key === 't' && value) {
      updates.crosshairOutlineThickness = parseFloat(value);
      i++;
    }
    if (key === 'o' && value) {
      updates.crosshairOutlineOpacity = parseFloat(value);
      i++;
    }

    // Center Dot
    if (key === 'd' && value) {
      updates.crosshairDot = value !== '0';
      i++;
    }
    if (key === 'z' && value) {
      updates.crosshairDotSize = parseFloat(value);
      i++;
    }
    if (key === 'a' && value) {
      updates.crosshairDotOpacity = parseFloat(value);
      i++;
    }

    // Inner Lines (0 series)
    if (key === '0b' && value) {
      updates.crosshairInnerShow = value !== '0';
      i++;
    }
    if (key === '0l' && value) {
      updates.crosshairInnerLength = parseFloat(value);
      i++;
    }
    if (key === '0t' && value) {
      updates.crosshairInnerThickness = parseFloat(value);
      i++;
    }
    if (key === '0o' && value) {
      updates.crosshairInnerOffset = parseFloat(value);
      i++;
    }
    if (key === '0a' && value) {
      updates.crosshairInnerOpacity = parseFloat(value);
      i++;
    }

    // Outer Lines (1 series)
    if (key === '1b' && value) {
      updates.crosshairOuterShow = value !== '0';
      i++;
    }
    if (key === '1l' && value) {
      updates.crosshairOuterLength = parseFloat(value);
      i++;
    }
    if (key === '1t' && value) {
      updates.crosshairOuterThickness = parseFloat(value);
      i++;
    }
    if (key === '1o' && value) {
      updates.crosshairOuterOffset = parseFloat(value);
      i++;
    }
    if (key === '1a' && value) {
      updates.crosshairOuterOpacity = parseFloat(value);
      i++;
    }
  }

  return updates;
};
