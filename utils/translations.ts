
import { GameMode } from "../types";

export type Language = 'ja' | 'en';

export const translations = {
  ja: {
    menu_subtitle: "Professional Browser Trainer",
    menu_start: "トレーニング開始",
    menu_settings: "設定 (SETTINGS)",
    mode_select: "モード選択",
    
    // Modes
    mode_grid_label: "グリッドショット",
    mode_grid_desc: "グリッド状に出現。スピードと正確性の強化。",
    mode_micro_label: "マイクロショット",
    mode_micro_desc: "密集して出現。精密な微調整エイムの練習。",
    mode_spider_label: "スパイダーショット",
    mode_spider_desc: "中央と外側を交互に撃つ。フリック練習。",
    mode_blink_label: "ブリンクショット",
    mode_blink_desc: "的が素早く消滅。反射神経トレーニング。",
    mode_strafe_label: "ヒューマンストレーフ",
    mode_strafe_desc: "スイッチング練習。HSは即死、胴は2発。",
    mode_tracking_label: "トラッキング",
    mode_tracking_desc: "動く敵を追い続ける。追いエイム強化。",
    mode_marathon_label: "マラソンモード",
    mode_marathon_desc: "全モードのミックス。エンドレスで練習。",
    mode_endless: "エンドレス",

    // Settings
    settings_title: "設定 (SETTINGS)",
    tab_gameplay: "ゲームプレイ",
    tab_appearance: "外観",
    tab_crosshair: "クロスヘア",
    
    sec_targets: "ターゲット (Targets)",
    lbl_target_size: "ターゲットサイズ",
    lbl_tracking_jump: "トラッキングモードのジャンプ",
    
    sec_mouse_view: "操作・視点 (Mouse & View)",
    lbl_sensitivity: "感度 (Sensitivity)",
    lbl_fov: "視野角 (FOV)",
    
    sec_rules: "ルール (Rules)",
    lbl_duration: "制限時間",
    note_marathon: "*マラソンモードには適用されません。",
    
    sec_audio: "オーディオ (Audio)",
    lbl_volume: "マスター音量",
    
    sec_theme: "環境テーマ (Theme)",
    theme_day: "昼 (Day)",
    theme_night: "夜 (Night)",
    
    sec_target_vis: "ターゲット表示 (Target Visibility)",
    lbl_body_color: "本体色",
    lbl_outline_color: "輪郭色 (ハイライト)",
    
    sec_preview: "プレビュー (Preview)",
    sec_import: "プロファイル読み込み",
    ph_import: "Valorantのコードを貼り付け...",
    btn_import: "読み込む (IMPORT)",
    err_invalid_code: "無効なコードです",
    
    lbl_crosshair_color: "クロスヘア色",
    lbl_outline: "アウトライン",
    lbl_opacity: "不透明度",
    lbl_thickness: "太さ",
    lbl_dot: "ドット (Center Dot)",
    lbl_size: "サイズ",
    lbl_inner: "インナーライン (Inner)",
    lbl_length: "長さ",
    lbl_offset: "オフセット",
    lbl_outer: "アウターライン (Outer)",
    btn_save: "保存して閉じる",

    // HUD
    hud_score: "スコア",
    hud_time: "タイム",
    hud_mode: "モード",
    hud_accuracy: "命中率",
    hud_current: "現在",

    // Results
    res_title: "セッション終了",
    res_hits_misses: "ヒット / ミス",
    btn_home: "ホームへ",
    btn_retry: "もう一度",

    // Pause
    pause_title: "一時停止",
    pause_desc: "中断中",
    btn_resume: "再開",
    btn_restart: "リスタート (R)",
    btn_menu: "メニューへ",
    
    // Misc
    lbl_language: "言語 (Language)"
  },
  en: {
    menu_subtitle: "Professional Browser Trainer",
    menu_start: "START TRAINING",
    menu_settings: "SETTINGS",
    mode_select: "SELECT MODE",
    
    // Modes
    mode_grid_label: "GRIDSHOT",
    mode_grid_desc: "Grid layout. Improve speed and accuracy.",
    mode_micro_label: "MICROSHOT",
    mode_micro_desc: "Clustered targets. Micro-adjustment practice.",
    mode_spider_label: "SPIDERSHOT",
    mode_spider_desc: "Center and outer targets. Flick practice.",
    mode_blink_label: "BLINKSHOT",
    mode_blink_desc: "Targets vanish quickly. Reaction training.",
    mode_strafe_label: "HUMAN STRAFE",
    mode_strafe_desc: "Switching practice. HS instakill, 2 body shots.",
    mode_tracking_label: "TRACKING",
    mode_tracking_desc: "Follow moving targets. Tracking aim.",
    mode_marathon_label: "MARATHON",
    mode_marathon_desc: "Mix of all modes. Endless practice.",
    mode_endless: "ENDLESS",

    // Settings
    settings_title: "SETTINGS",
    tab_gameplay: "GAMEPLAY",
    tab_appearance: "APPEARANCE",
    tab_crosshair: "CROSSHAIR",
    
    sec_targets: "TARGETS",
    lbl_target_size: "Target Size",
    lbl_tracking_jump: "Tracking Jump",
    
    sec_mouse_view: "MOUSE & VIEW",
    lbl_sensitivity: "Sensitivity",
    lbl_fov: "FOV",
    
    sec_rules: "RULES",
    lbl_duration: "Duration",
    note_marathon: "*Not applicable to Marathon mode.",
    
    sec_audio: "AUDIO",
    lbl_volume: "Master Volume",
    
    sec_theme: "THEME",
    theme_day: "Day",
    theme_night: "Night",
    
    sec_target_vis: "TARGET VISIBILITY",
    lbl_body_color: "Body Color",
    lbl_outline_color: "Outline Color",
    
    sec_preview: "PREVIEW",
    sec_import: "IMPORT PROFILE",
    ph_import: "Paste Valorant code...",
    btn_import: "IMPORT",
    err_invalid_code: "Invalid code",
    
    lbl_crosshair_color: "Crosshair Color",
    lbl_outline: "Outline",
    lbl_opacity: "Opacity",
    lbl_thickness: "Thickness",
    lbl_dot: "Center Dot",
    lbl_size: "Size",
    lbl_inner: "Inner Lines",
    lbl_length: "Length",
    lbl_offset: "Offset",
    lbl_outer: "Outer Lines",
    btn_save: "SAVE & CLOSE",

    // HUD
    hud_score: "SCORE",
    hud_time: "TIME",
    hud_mode: "MODE",
    hud_accuracy: "ACCURACY",
    hud_current: "CURRENT",

    // Results
    res_title: "SESSION FINISHED",
    res_hits_misses: "HITS / MISSES",
    btn_home: "HOME",
    btn_retry: "PLAY AGAIN",

    // Pause
    pause_title: "PAUSED",
    pause_desc: "Game Suspended",
    btn_resume: "RESUME",
    btn_restart: "RESTART (R)",
    btn_menu: "MENU",

    // Misc
    lbl_language: "Language"
  }
};

export const getModeName = (mode: GameMode, lang: Language): string => {
  const t = translations[lang];
  switch (mode) {
    case GameMode.GRID_SHOT: return t.mode_grid_label;
    case GameMode.MICRO_SHOT: return t.mode_micro_label;
    case GameMode.SPIDER_SHOT: return t.mode_spider_label;
    case GameMode.BLINK_SHOT: return t.mode_blink_label;
    case GameMode.HUMAN_STRAFE: return t.mode_strafe_label;
    case GameMode.TRACKING: return t.mode_tracking_label;
    case GameMode.MARATHON: return t.mode_marathon_label;
    default: return mode;
  }
};
