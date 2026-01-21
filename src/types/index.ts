/**
 * 紫微斗数排盘系统 - 核心类型定义
 *
 * 统一类型，保障数据结构一致。
 */

// ============================================
// 基础类型定义
// ============================================

/** 性别类型 */
export type Gender = 'male' | 'female';

/** 历法类型 */
export type CalendarType = 'solar' | 'lunar';

/** 年分界类型 */
export type YearDivide = 'normal' | 'exact';

/** 运限分界类型 */
export type HoroscopeDivide = 'normal' | 'exact';

/** 岁数分界类型 */
export type AgeDivide = 'normal' | 'birthday';

/** 日分界类型 */
export type DayDivide = 'current' | 'forward';

/** 安星算法类型 */
export type Algorithm = 'default' | 'zhongzhou';

/** Toast 类型 */
export type ToastType = 'success' | 'error' | 'info';

// ============================================
// 表单数据类型
// ============================================

/** 表单原始数据 */
export interface FormRawData {
  name: string;
  gender: Gender;
  type: CalendarType;
  year: string;
  month: string;
  day: string;
  hour: number;
  fixLeap: boolean;
}

// ============================================
// 命盘数据类型
// ============================================

/** 命盘数据 */
export interface ChartData {
  /** 姓名 */
  name: string;
  /** 性别 */
  gender: Gender;
  /** 阳历日期（含时辰） */
  solarDate: Date;
  /** 原始表单数据 */
  raw: FormRawData;
}

/** 已保存的命盘 */
export interface SavedChart {
  /** 唯一标识（时间戳字符串） */
  id: string;
  /** 命盘名称 */
  name: string;
  /** 保存时间戳 */
  savedAt: number;
  /** 解读信息（可选） */
  interpretation?: {
    /** 解读内容（Markdown） */
    content: string;
    /** 解读时间戳 */
    savedAt: number;
  };
  /** 命盘数据（solarDate 为 ISO 字符串） */
  data: {
    solarDate: string;
    gender: Gender;
    name: string;
    raw: FormRawData;
  };
}

// ============================================
// 设置类型
// ============================================

/** 命盘设置 */
export interface Settings {
  /** 隐藏辅星（小星） */
  hideTransitStars: boolean;
  /** 隐藏运限 */
  hideHoroscope: boolean;
  /** 隐藏出生时间 */
  hideBirthTime: boolean;
  /** 年份分界（正月初一 / 立春） */
  yearDivide: YearDivide;
  /** 运限分界（正月初一 / 立春） */
  horoscopeDivide: HoroscopeDivide;
  /** 岁数分界（自然年/生日） */
  ageDivide: AgeDivide;
  /** 日分界（当日/来日） */
  dayDivide: DayDivide;
  /** 安星算法 */
  algorithm: Algorithm;
}

// ============================================
// Toast 类型
// ============================================

/** Toast 状态 */
export interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
}

// ============================================
// 时辰映射类型
// ============================================

/** 时辰映射项 */
export interface ShichenItem {
  name: string;
  value: number;
}

// ============================================
// 组件 Props 类型
// ============================================

/** Layout 组件 Props */
export interface LayoutProps {
  children: React.ReactNode;
  onNavigateHome?: () => void;
  onOpenSavedCharts?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

/** Navbar 组件 Props */
export interface NavbarProps {
  onNavigateHome?: () => void;
  onOpenSavedCharts?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

/** InputForm 组件 Props */
export interface InputFormProps {
  onSubmit: (data: ChartData) => void;
}

/** Chart 组件 Props */
export interface ChartProps {
  data: ChartData;
  onReset?: () => void;
  onLoadChart?: (data: ChartData) => void;
}

/** ChartToolbar 组件 Props */
export interface ChartToolbarProps {
  onShowSavedCharts?: () => void;
  onToggleFullscreen?: () => void;
  onSettings?: () => void;
  onDownload?: () => void;
  onSave?: () => void;
  onInterpret?: () => void;
  interpretLabel?: string;
  isFullscreen?: boolean;
}

/** SettingsModal 组件 Props */
export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

/** SavedChartsModal 组件 Props */
export interface SavedChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCharts?: SavedChart[];
  onLoadChart: (chart: SavedChart) => void;
  onDeleteChart?: (chartId: string) => void;
}

/** Toast 组件 Props */
export interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

/** AIInterpret 组件 Props */
export interface AIInterpretProps {
  data: ChartData;
  startSignal?: number;
  initialResult?: string | null;
  onInterpretComplete?: (content: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

/** ErrorBoundary 组件 Props */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** ErrorBoundary 组件 State */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================
// 导航链接类型
// ============================================

/** 导航链接项 */
export interface NavLink {
  name: string;
  action?: () => void;
  href?: string;
  external?: boolean;
}

// ============================================
// 工具栏项类型
// ============================================

/** 工具栏按钮项 */
export interface ToolbarItem {
  id: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  shortcut: string;
  onClick?: () => void;
}
