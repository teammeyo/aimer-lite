
import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameStats, GameSettings, GameMode } from '../types';
import { Play, RotateCcw, Award, AlertCircle, Settings as SettingsIcon, X, Check, MousePointer2, Palette, Sun, Moon, CloudSun, Volume2, Download, Crosshair, Grid3X3, Activity, Infinity as InfinityIcon, Gamepad2, Eye, Monitor, Zap, Home, User, Pause, Target, ArrowLeft, Globe } from 'lucide-react';
import { parseValorantCode } from '../utils/valorantParser';
import { translations, getModeName, Language } from '../utils/translations';

interface UIOverlayProps {
  gameState: GameState;
  score: number;
  timeLeft: number;
  stats: GameStats;
  settings: GameSettings;
  selectedMode: GameMode;
  activeBehaviorMode: GameMode;
  onUpdateSettings: (settings: GameSettings) => void;
  onStart: (mode: GameMode) => void;
  onRestart: () => void;
  onResume: () => void;
  onHome: () => void;
  countdown: number;
}

const formatTime = (ms: number) => (ms / 1000).toFixed(1);

// Improved Slider Control with local state for smooth typing
const SliderControl: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  suffix?: string;
}> = ({ label, value, min, max, step, onChange, suffix = '' }) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(val);
    }
  };

  const handleBlur = () => {
    let val = parseFloat(localValue);
    if (isNaN(val)) val = value;
    if (val < min) val = min;
    if (val > max) val = max;
    onChange(val);
    setLocalValue(val.toString());
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
        <span>{label}</span>
        <div className="flex items-center gap-1">
          <input 
            ref={inputRef}
            type="number"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-20 px-2 py-0.5 text-right bg-slate-100 border border-slate-300 rounded hover:border-blue-400 focus:border-blue-500 focus:outline-none font-mono text-blue-600 transition-colors"
          />
          <span className="w-4 text-slate-400">{suffix}</span>
        </div>
      </div>
      <input 
        type="range" min={min} max={max} step={step} 
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(v);
        }}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 hover:accent-blue-500 transition-colors"
      />
    </div>
  );
};

const CrosshairRenderer: React.FC<{ settings: GameSettings }> = ({ settings }) => {
  const {
    crosshairColor,
    crosshairOutline, crosshairOutlineThickness, crosshairOutlineOpacity,
    crosshairDot, crosshairDotSize, crosshairDotOpacity,
    crosshairInnerShow, crosshairInnerOpacity, crosshairInnerLength, crosshairInnerThickness, crosshairInnerOffset,
    crosshairOuterShow, crosshairOuterOpacity, crosshairOuterLength, crosshairOuterThickness, crosshairOuterOffset,
  } = settings;

  const outlineStyle = crosshairOutline 
    ? `0 0 0 ${crosshairOutlineThickness}px rgba(0,0,0,${crosshairOutlineOpacity})` 
    : 'none';

  const renderLines = (length: number, thickness: number, offset: number, opacity: number) => {
    const style: React.CSSProperties = {
      backgroundColor: crosshairColor,
      opacity: opacity,
      boxShadow: outlineStyle,
      position: 'absolute',
    };
    return (
      <>
        <div style={{ ...style, width: length, height: thickness, right: offset + thickness / 2 }} />
        <div style={{ ...style, width: length, height: thickness, left: offset + thickness / 2 }} />
        <div style={{ ...style, width: thickness, height: length, bottom: offset + thickness / 2 }} />
        <div style={{ ...style, width: thickness, height: length, top: offset + thickness / 2 }} />
      </>
    );
  };

  return (
    <div className="relative flex items-center justify-center pointer-events-none w-0 h-0">
      {crosshairDot && (
        <div style={{
          width: crosshairDotSize,
          height: crosshairDotSize,
          backgroundColor: crosshairColor,
          opacity: crosshairDotOpacity,
          boxShadow: outlineStyle,
          borderRadius: '50%',
          position: 'absolute',
        }} />
      )}
      {crosshairInnerShow && renderLines(crosshairInnerLength, crosshairInnerThickness, crosshairInnerOffset, crosshairInnerOpacity)}
      {crosshairOuterShow && renderLines(crosshairOuterLength, crosshairOuterThickness, crosshairOuterOffset, crosshairOuterOpacity)}
    </div>
  );
};

const SettingsScreen: React.FC<{ 
  settings: GameSettings; 
  onUpdate: (s: GameSettings) => void; 
  onClose: () => void;
}> = ({ settings, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState<'gameplay' | 'appearance' | 'crosshair'>('gameplay');
  const t = translations[settings.language];

  const colors = ['#ffffff', '#00ff00', '#7fff00', '#dfff00', '#ffff00', '#00ffff', '#ff00ff', '#ff0000', '#000000'];
  const outlineColors = [
      { name: 'Yellow', value: '#ffff00' }, 
      { name: 'Red', value: '#ef4444' }, 
      { name: 'Purple', value: '#a855f7' }, 
      { name: 'Cyan', value: '#06b6d4' }
  ];
  const targetColors = [
      { name: 'Cyan', value: '#06b6d4' },
      { name: 'Red', value: '#ef4444' }, 
      { name: 'Green', value: '#10b981' }, 
      { name: 'White', value: '#ffffff' }
  ];
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const handleImport = () => {
    try {
      setImportError('');
      const updates = parseValorantCode(importCode, settings);
      onUpdate({ ...settings, ...updates });
      setImportCode('');
    } catch (e) {
      setImportError(t.err_invalid_code);
    }
  };
  const timePresets = [
    { name: t.theme_day, sky: '#e0f2fe', ground: '#f1f5f9', icon: Sun },
    { name: t.theme_night, sky: '#0f172a', ground: '#020617', icon: Moon },
  ];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm z-[60]">
      <div className="w-full max-w-5xl h-[85vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white z-10">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <SettingsIcon className="text-blue-600" />
            {t.settings_title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-red-500">
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between p-4">
            <div className="space-y-2">
              {[
                { id: 'gameplay', label: t.tab_gameplay, icon: Gamepad2 },
                { id: 'appearance', label: t.tab_appearance, icon: Eye },
                { id: 'crosshair', label: t.tab_crosshair, icon: Crosshair },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold w-full transition-all ${
                    activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="border-t border-slate-200 pt-4">
                <span className="text-xs font-bold text-slate-500 mb-2 block uppercase px-2">{t.lbl_language}</span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => onUpdate({...settings, language: 'ja'})}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border ${settings.language === 'ja' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'border-transparent text-slate-500 hover:bg-white'}`}
                    >
                        日本語
                    </button>
                    <button 
                        onClick={() => onUpdate({...settings, language: 'en'})}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border ${settings.language === 'en' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'border-transparent text-slate-500 hover:bg-white'}`}
                    >
                        English
                    </button>
                </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white">
            {activeTab === 'gameplay' && (
              <div className="space-y-8 max-w-2xl">
                 <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">{t.sec_targets}</h3>
                    <div className="grid grid-cols-2 gap-8">
                       <SliderControl label={t.lbl_target_size} value={settings.targetSize} min={0.1} max={2.0} step={0.1} suffix="x" onChange={(v: number) => onUpdate({...settings, targetSize: v})} />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded-xl border-slate-100">
                        <span className="text-sm font-bold text-slate-700">{t.lbl_tracking_jump}</span>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input 
                                type="checkbox" 
                                name="toggle" 
                                id="trackingJump" 
                                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-blue-600"
                                style={{ right: settings.trackingJump ? '0' : 'auto', left: settings.trackingJump ? 'auto' : '0' }}
                                checked={settings.trackingJump}
                                onChange={(e) => onUpdate({...settings, trackingJump: e.target.checked})}
                            />
                            <label 
                                htmlFor="trackingJump" 
                                className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${settings.trackingJump ? 'bg-blue-600' : 'bg-slate-300'}`}
                            ></label>
                        </div>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">{t.sec_mouse_view}</h3>
                    <div className="grid grid-cols-2 gap-8">
                       <SliderControl label={t.lbl_sensitivity} value={settings.sensitivity} min={0.001} max={10.0} step={0.001} onChange={(v: number) => onUpdate({...settings, sensitivity: v})} />
                       <SliderControl label={t.lbl_fov} value={settings.fov} min={60} max={130} step={1} onChange={(v: number) => onUpdate({...settings, fov: v})} />
                    </div>
                 </div>
                 <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">{t.sec_rules}</h3>
                    <div className="grid grid-cols-2 gap-8">
                       <SliderControl label={t.lbl_duration} value={settings.duration} min={10} max={300} step={10} suffix="s" onChange={(v: number) => onUpdate({...settings, duration: v})} />
                       <div className="pt-6 text-xs text-slate-400">{t.note_marathon}</div>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">{t.sec_audio}</h3>
                    <div className="grid grid-cols-2 gap-8">
                       <SliderControl label={t.lbl_volume} value={settings.volume} min={0} max={1} step={0.05} suffix="" onChange={(v: number) => onUpdate({...settings, volume: v})} />
                    </div>
                 </div>
              </div>
            )}
            {activeTab === 'appearance' && (
              <div className="space-y-8 max-w-2xl">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">{t.sec_theme}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {timePresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => onUpdate({...settings, skyColor: preset.sky, groundColor: preset.ground})}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                          settings.skyColor === preset.sky ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <preset.icon size={32} className="mb-2" />
                        <span className="font-bold">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">{t.sec_target_vis}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <span className="text-sm font-bold text-slate-700">{t.lbl_body_color}</span>
                      <div className="flex flex-wrap gap-2">
                          {targetColors.map((col) => (
                              <button
                                  key={col.name}
                                  onClick={() => onUpdate({...settings, targetColor: col.value})}
                                  className={`w-10 h-10 rounded-full border border-slate-200 hover:border-slate-300 flex items-center justify-center transition-all ${
                                      settings.targetColor === col.value 
                                      ? 'border-slate-900 scale-110 shadow-md' 
                                      : ''
                                  }`}
                                  style={{ backgroundColor: col.value }}
                                  title={col.name}
                              >
                                {settings.targetColor === col.value && <Check size={16} className={col.name === 'White' || col.name === 'Cyan' || col.name === '白' || col.name === 'シアン' ? 'text-black' : 'text-white'} />}
                              </button>
                          ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <span className="text-sm font-bold text-slate-700">{t.lbl_outline_color}</span>
                      <div className="flex flex-wrap gap-2">
                          {outlineColors.map((col) => (
                              <button
                                  key={col.name}
                                  onClick={() => onUpdate({...settings, enemyOutlineColor: col.value})}
                                  className={`w-10 h-10 rounded-full border border-slate-200 hover:border-slate-300 flex items-center justify-center transition-all ${
                                      settings.enemyOutlineColor === col.value 
                                      ? 'border-slate-900 scale-110 shadow-md' 
                                      : ''
                                  }`}
                                  style={{ backgroundColor: col.value }}
                                  title={col.name}
                              >
                                {settings.enemyOutlineColor === col.value && <Check size={16} className={col.name === 'Yellow' || col.name === 'Cyan' || col.name === '黄' || col.name === 'シアン' ? 'text-black' : 'text-white'} />}
                              </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'crosshair' && (
              <div className="flex flex-col h-full gap-8">
                <div className="flex gap-8">
                   <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">{t.sec_preview}</h3>
                      <div className="h-48 bg-slate-200 rounded-xl relative overflow-hidden flex items-center justify-center border-2 border-slate-300">
                         <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-400 to-slate-800"></div>
                         <div className="w-16 h-16 rounded-full absolute" style={{ backgroundColor: settings.targetColor, border: `4px solid ${settings.enemyOutlineColor}` }}></div>
                         <div className="z-10">
                            <CrosshairRenderer settings={settings} />
                         </div>
                      </div>
                   </div>
                   <div className="w-1/3 space-y-2">
                      <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">{t.sec_import}</h3>
                      <textarea 
                        placeholder={t.ph_import}
                        value={importCode}
                        onChange={(e) => setImportCode(e.target.value)}
                        className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <button onClick={handleImport} className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">{t.btn_import}</button>
                      {importError && <p className="text-red-500 text-xs font-bold text-center">{importError}</p>}
                   </div>
                </div>
                <div className="space-y-3 border-b border-slate-100 pb-6">
                    <span className="text-sm font-bold text-slate-900">{t.lbl_crosshair_color}</span>
                    <div className="flex gap-3">
                        {colors.map(color => (
                            <button
                            key={color}
                            onClick={() => onUpdate({...settings, crosshairColor: color})}
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${settings.crosshairColor === color ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2' : 'border-slate-300'}`}
                            style={{ backgroundColor: color }}
                            >
                                {settings.crosshairColor === color && <Check size={14} className={color === '#ffffff' || color === '#ffff00' || color === '#00ffff' || color === '#7fff00' || color === '#dfff00' ? 'text-black' : 'text-white'} />}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-12 pb-12">
                   <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900">{t.lbl_outline}</h4>
                            <input type="checkbox" className="w-5 h-5 accent-blue-600 cursor-pointer" checked={settings.crosshairOutline} onChange={(e) => onUpdate({...settings, crosshairOutline: e.target.checked})} />
                        </div>
                        {settings.crosshairOutline && (
                            <div className="space-y-4 pl-2 border-l-2 border-slate-100">
                                <SliderControl label={t.lbl_opacity} value={settings.crosshairOutlineOpacity} min={0} max={1} step={0.1} onChange={(v: number) => onUpdate({...settings, crosshairOutlineOpacity: v})} />
                                <SliderControl label={t.lbl_thickness} value={settings.crosshairOutlineThickness} min={1} max={6} step={1} onChange={(v: number) => onUpdate({...settings, crosshairOutlineThickness: v})} />
                            </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900">{t.lbl_dot}</h4>
                            <input type="checkbox" className="w-5 h-5 accent-blue-600 cursor-pointer" checked={settings.crosshairDot} onChange={(e) => onUpdate({...settings, crosshairDot: e.target.checked})} />
                        </div>
                        {settings.crosshairDot && (
                            <div className="space-y-4 pl-2 border-l-2 border-slate-100">
                                <SliderControl label={t.lbl_opacity} value={settings.crosshairDotOpacity} min={0} max={1} step={0.1} onChange={(v: number) => onUpdate({...settings, crosshairDotOpacity: v})} />
                                <SliderControl label={t.lbl_size} value={settings.crosshairDotSize} min={1} max={6} step={1} onChange={(v: number) => onUpdate({...settings, crosshairDotSize: v})} />
                            </div>
                        )}
                      </div>
                   </div>
                   <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900">{t.lbl_inner}</h4>
                            <input type="checkbox" className="w-5 h-5 accent-blue-600 cursor-pointer" checked={settings.crosshairInnerShow} onChange={(e) => onUpdate({...settings, crosshairInnerShow: e.target.checked})} />
                        </div>
                        {settings.crosshairInnerShow && (
                            <div className="space-y-4 pl-2 border-l-2 border-slate-100">
                                <SliderControl label={t.lbl_opacity} value={settings.crosshairInnerOpacity} min={0} max={1} step={0.1} onChange={(v: number) => onUpdate({...settings, crosshairInnerOpacity: v})} />
                                <SliderControl label={t.lbl_length} value={settings.crosshairInnerLength} min={0} max={20} step={1} onChange={(v: number) => onUpdate({...settings, crosshairInnerLength: v})} />
                                <SliderControl label={t.lbl_thickness} value={settings.crosshairInnerThickness} min={1} max={10} step={1} onChange={(v: number) => onUpdate({...settings, crosshairInnerThickness: v})} />
                                <SliderControl label={t.lbl_offset} value={settings.crosshairInnerOffset} min={0} max={20} step={1} onChange={(v: number) => onUpdate({...settings, crosshairInnerOffset: v})} />
                            </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900">{t.lbl_outer}</h4>
                            <input type="checkbox" className="w-5 h-5 accent-blue-600 cursor-pointer" checked={settings.crosshairOuterShow} onChange={(e) => onUpdate({...settings, crosshairOuterShow: e.target.checked})} />
                        </div>
                        {settings.crosshairOuterShow && (
                            <div className="space-y-4 pl-2 border-l-2 border-slate-100">
                                <SliderControl label={t.lbl_opacity} value={settings.crosshairOuterOpacity} min={0} max={1} step={0.1} onChange={(v: number) => onUpdate({...settings, crosshairOuterOpacity: v})} />
                                <SliderControl label={t.lbl_length} value={settings.crosshairOuterLength} min={0} max={20} step={1} onChange={(v: number) => onUpdate({...settings, crosshairOuterLength: v})} />
                                <SliderControl label={t.lbl_thickness} value={settings.crosshairOuterThickness} min={1} max={10} step={1} onChange={(v: number) => onUpdate({...settings, crosshairOuterThickness: v})} />
                                <SliderControl label={t.lbl_offset} value={settings.crosshairOuterOffset} min={0} max={40} step={1} onChange={(v: number) => onUpdate({...settings, crosshairOuterOffset: v})} />
                            </div>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
           <button onClick={onClose} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors shadow-lg shadow-slate-200 text-sm tracking-wide">
              {t.btn_save}
           </button>
        </div>
      </div>
    </div>
  );
}

const MenuScreen: React.FC<{ onStart: (mode: GameMode) => void; onOpenSettings: () => void; settings: GameSettings }> = ({ onStart, onOpenSettings, settings }) => {
  const [view, setView] = useState<'title' | 'modes'>('title');
  const t = translations[settings.language];

  // Modes View Data
  const modes = [
    { 
      mode: GameMode.GRID_SHOT, 
      label: t.mode_grid_label, 
      desc: t.mode_grid_desc, 
      icon: Grid3X3, 
      color: 'text-indigo-500', 
      bg: 'bg-indigo-500',
      tag: 'SPEED'
    },
    { 
      mode: GameMode.MICRO_SHOT, 
      label: t.mode_micro_label, 
      desc: t.mode_micro_desc, 
      icon: MousePointer2, 
      color: 'text-green-500', 
      bg: 'bg-green-500',
      tag: 'PRECISION'
    },
    { 
      mode: GameMode.SPIDER_SHOT, 
      label: t.mode_spider_label, 
      desc: t.mode_spider_desc, 
      icon: Activity, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500',
      tag: 'FLICKING'
    },
    { 
      mode: GameMode.BLINK_SHOT, 
      label: t.mode_blink_label, 
      desc: t.mode_blink_desc, 
      icon: Zap, 
      color: 'text-orange-500', 
      bg: 'bg-orange-500',
      tag: 'REACTION'
    },
    { 
      mode: GameMode.HUMAN_STRAFE, 
      label: t.mode_strafe_label, 
      desc: t.mode_strafe_desc, 
      icon: User, 
      color: 'text-red-500', 
      bg: 'bg-red-500',
      tag: 'SWITCHING'
    },
    { 
      mode: GameMode.TRACKING, 
      label: t.mode_tracking_label, 
      desc: t.mode_tracking_desc, 
      icon: Target, 
      color: 'text-cyan-500', 
      bg: 'bg-cyan-500',
      tag: 'TRACKING'
    },
  ];

  const isTitle = view === 'title';

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-md z-50">
      
      {/* Container expands smoothly */}
      <div 
        className={`bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col relative
          ${isTitle ? 'w-[550px] h-[420px]' : 'w-[900px] h-[80vh]'}
        `}
      >
        
        {/* === TITLE SCREEN VIEW === */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center space-y-8 transition-all duration-500 ${isTitle ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
             <div className="text-center pt-4">
                <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tighter drop-shadow-sm select-none mb-1 pb-2">
                  LightAIM
                </h1>
                <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">{t.menu_subtitle}</p>
             </div>
             
             <div className="flex flex-col gap-3 w-60">
                <button 
                  onClick={() => setView('modes')}
                  className="w-full py-3.5 bg-slate-900 text-white hover:bg-slate-800 font-black rounded-xl transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play fill="currentColor" size={20} />
                  {t.menu_start}
                </button>
                <button 
                  onClick={onOpenSettings}
                  className="w-full py-3.5 bg-white text-slate-600 hover:text-slate-900 font-bold rounded-xl transition-all border-2 border-slate-100 hover:border-slate-300 flex items-center justify-center gap-2"
                >
                  <SettingsIcon size={18} />
                  {t.menu_settings}
                </button>
             </div>
        </div>

        {/* === MODES LIST VIEW === */}
        <div className={`absolute inset-0 flex flex-col transition-all duration-500 delay-100 ${!isTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white z-10 shrink-0">
              <button 
                onClick={() => setView('title')}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.mode_select}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
              {modes.map((m) => (
                <button
                  key={m.mode}
                  onClick={() => onStart(m.mode)}
                  className="w-full group bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-6 hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left"
                >
                  <div className={`w-12 h-12 rounded-lg ${m.bg} bg-opacity-10 flex items-center justify-center shrink-0`}>
                    <m.icon className={`${m.color}`} size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-900">{m.label}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.bg} bg-opacity-10 ${m.color}`}>
                        {m.tag}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{m.desc}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                    <Play size={24} fill="currentColor" />
                  </div>
                </button>
              ))}

              <div className="my-4 border-t border-slate-100"></div>

              <button
                onClick={() => onStart(GameMode.MARATHON)}
                className="w-full group bg-slate-900 text-white rounded-xl p-5 flex items-center gap-6 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all text-left shadow-lg shadow-slate-200"
              >
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <InfinityIcon className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold">{t.mode_marathon_label}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                      {t.mode_endless}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{t.mode_marathon_desc}</p>
                </div>
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <Play size={24} fill="currentColor" />
                  </div>
              </button>
            </div>
        </div>

      </div>
    </div>
  );
};

const HUD: React.FC<{ 
  score: number; 
  timeLeft: number; 
  accuracy: number;
  selectedMode: GameMode;
  activeBehaviorMode: GameMode;
  settings: GameSettings;
}> = ({ score, timeLeft, accuracy, selectedMode, activeBehaviorMode, settings }) => {
  const isDark = settings.skyColor === '#0f172a' || settings.skyColor === '#1e1b4b' || settings.skyColor.toLowerCase().includes('#0f17');
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const labelColor = isDark ? 'text-blue-200' : 'text-slate-400';
  const iconColor = isDark ? 'text-white' : 'text-slate-900';
  const marathonBoxColor = isDark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white';
  const t = translations[settings.language];

  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-8 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className={`text-6xl font-mono font-bold tracking-widest drop-shadow-sm ${textColor}`}>{score}</span>
          <span className={`${labelColor} text-sm font-bold tracking-wider`}>{t.hud_score}</span>
        </div>
        {selectedMode === GameMode.MARATHON && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-pulse">
                <span className={`${textColor} font-black tracking-tighter text-2xl uppercase opacity-20`}>MARATHON</span>
                <div className={`${marathonBoxColor} px-3 py-1 rounded text-xs font-bold shadow-lg`}>
                    {t.hud_current}: {getModeName(activeBehaviorMode, settings.language)}
                </div>
            </div>
        )}
        <div className="flex flex-col items-end">
          {selectedMode === GameMode.MARATHON ? (
              <div className="flex items-center gap-2">
                  <InfinityIcon size={40} className={iconColor} />
              </div>
          ) : (
              <span className={`text-6xl font-mono font-bold tracking-widest drop-shadow-sm ${timeLeft < 10000 ? 'text-red-500' : textColor}`}>
                  {formatTime(timeLeft)}
              </span>
          )}
          <span className={`${labelColor} text-sm font-bold tracking-wider`}>{t.hud_time}</span>
        </div>
      </div>
      <div className="flex justify-center">
          <div className={`${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'} backdrop-blur px-6 py-2 rounded-full border shadow-sm flex gap-4`}>
              <span className={`${isDark ? 'text-blue-100' : 'text-slate-600'} text-sm font-mono font-bold`}>{t.hud_mode}: {getModeName(selectedMode, settings.language)}</span>
              <div className={`w-px ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
              <span className={`${isDark ? 'text-blue-100' : 'text-slate-600'} text-sm font-mono font-bold`}>{t.hud_accuracy}: {accuracy.toFixed(1)}%</span>
          </div>
      </div>
    </div>
  );
};

const ResultScreen: React.FC<{ stats: GameStats; settings: GameSettings; onRestart: () => void; onHome: () => void }> = ({ stats, settings, onRestart, onHome }) => {
  const [isClickable, setIsClickable] = useState(false);
  const t = translations[settings.language];

  // Prevent accidental clicks immediately after game end
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClickable(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-md z-50 overflow-y-auto py-10">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
        <div className="text-center border-b border-slate-100 pb-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-2">{t.res_title}</h2>
          <div className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-bold tracking-wider mb-6">
              {getModeName(stats.mode, settings.language)}
          </div>
          <div className="grid grid-cols-3 gap-6 mt-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-slate-400 text-xs font-bold tracking-wider mb-1">{t.hud_score}</div>
              <div className="text-3xl font-mono font-bold text-blue-600">{stats.score}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-slate-400 text-xs font-bold tracking-wider mb-1">{t.hud_accuracy}</div>
              <div className="text-3xl font-mono font-bold text-indigo-600">{stats.accuracy.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-slate-400 text-xs font-bold tracking-wider mb-1">{t.res_hits_misses}</div>
              <div className="text-3xl font-mono font-bold text-slate-800">{stats.hits} <span className="text-slate-400 text-lg">/ {stats.misses}</span></div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 flex justify-center gap-4">
            <button 
              onClick={onHome} 
              disabled={!isClickable}
              className={`px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center gap-2 ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-slate-300'}`}
            >
              <Home size={20} />
              {t.btn_home}
            </button>
            <button 
              onClick={onRestart} 
              disabled={!isClickable}
              className={`px-8 py-4 bg-slate-900 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-slate-300 ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
            >
              <RotateCcw size={20} />
              {t.btn_retry}
            </button>
        </div>
      </div>
    </div>
  );
}

const CountdownScreen: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 bg-slate-900/10 backdrop-blur-sm">
      <div className="text-9xl font-black text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
        {count}
      </div>
    </div>
  );
};

const PauseScreen: React.FC<{ settings: GameSettings; onResume: () => void; onRestart: () => void; onHome: () => void }> = ({ settings, onResume, onRestart, onHome }) => {
  const t = translations[settings.language];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center">
           <Pause size={48} className="text-blue-500 mb-2" />
           <h2 className="text-3xl font-black text-slate-900">{t.pause_title}</h2>
           <p className="text-slate-400 text-sm font-bold">{t.pause_desc}</p>
        </div>
        <div className="space-y-3">
          <button onClick={onResume} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
             <Play size={20} fill="currentColor" />
             {t.btn_resume}
          </button>
          <button onClick={onRestart} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
             <RotateCcw size={20} />
             {t.btn_restart}
          </button>
          <button onClick={onHome} className="w-full py-4 bg-white border-2 border-slate-100 hover:border-slate-300 text-slate-500 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
             <Home size={20} />
             {t.btn_menu}
          </button>
        </div>
      </div>
    </div>
  );
};

export const UIOverlay: React.FC<UIOverlayProps> = (props) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {(props.gameState === GameState.PLAYING || props.gameState === GameState.COUNTDOWN || props.gameState === GameState.PAUSED) && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
             <CrosshairRenderer settings={props.settings} />
         </div>
      )}
      {showSettings && (
        <SettingsScreen settings={props.settings} onUpdate={props.onUpdateSettings} onClose={() => setShowSettings(false)} />
      )}
      {props.gameState === GameState.MENU && !showSettings && (
        <MenuScreen onStart={props.onStart} onOpenSettings={() => setShowSettings(true)} settings={props.settings} />
      )}
      {(props.gameState === GameState.PLAYING || props.gameState === GameState.PAUSED || props.gameState === GameState.COUNTDOWN) && (
        <HUD 
            score={props.score} 
            timeLeft={props.timeLeft} 
            accuracy={props.stats.accuracy}
            selectedMode={props.selectedMode}
            activeBehaviorMode={props.activeBehaviorMode}
            settings={props.settings}
        />
      )}
      {props.gameState === GameState.COUNTDOWN && (
        <CountdownScreen count={props.countdown} />
      )}
      {props.gameState === GameState.PAUSED && (
        <PauseScreen settings={props.settings} onResume={props.onResume} onRestart={props.onRestart} onHome={props.onHome} />
      )}
      {props.gameState === GameState.FINISHED && (
        <ResultScreen stats={props.stats} settings={props.settings} onRestart={props.onRestart} onHome={props.onHome} />
      )}
    </>
  );
};
