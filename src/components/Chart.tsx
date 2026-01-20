import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Iztrolabe } from 'react-iztro';
import html2canvas from 'html2canvas';
import ChartToolbar from './ChartToolbar';
import SettingsModal from './SettingsModal';
import SavedChartsModal from './SavedChartsModal';
import AIInterpret from './AIInterpret';
import Toast from './Toast';
import type { ChartProps, SavedChart, Settings, ToastState, ToastType } from '../types';

const STORAGE_KEY = 'zwds-saved-charts';
const SETTINGS_STORAGE_KEY = 'zwds-settings';

const DEFAULT_SETTINGS: Settings = {
  hideTransitStars: false,
  hideHoroscope: false,
  hideBirthTime: false,
  yearDivide: 'normal',
  horoscopeDivide: 'exact',
  ageDivide: 'normal',
  dayDivide: 'current',
  algorithm: 'default',
};

export default function Chart({ data, onLoadChart }: ChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [savedChartsModalOpen, setSavedChartsModalOpen] = useState(false);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<ToastState>({ isVisible: false, message: '', type: 'success' });
  const [showAI, setShowAI] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const iztrolabeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSavedCharts(JSON.parse(saved) as SavedChart[]);
      }

      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(savedSettings) as Settings) });
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getChineseHourIndex = (hour: number) => {
    if (hour >= 23 || hour < 1) return 0;
    return Math.floor((hour + 1) / 2);
  };

  const timeIndex = getChineseHourIndex(data.solarDate.getHours());
  const dateStr = data.solarDate.toISOString().split('T')[0];
  const birthdayType = data.raw?.type === 'lunar' ? 'lunar' : 'solar';

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ isVisible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const handleSettingsChange = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, []);

  const handleSave = useCallback(() => {
    const chartName = data.name ? `${data.name}-命盘` : '未命名命盘';

    const chartToSave: SavedChart = {
      id: Date.now().toString(),
      name: chartName,
      savedAt: Date.now(),
      data: {
        solarDate: data.solarDate.toISOString(),
        gender: data.gender,
        name: data.name,
        raw: data.raw,
      },
    };

    try {
      const updatedCharts = [chartToSave, ...savedCharts];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCharts));
      setSavedCharts(updatedCharts);
      showToast(`"${chartName}" 保存成功`, 'success');
    } catch (error) {
      console.error('Failed to save chart:', error);
      showToast('保存失败，请重试', 'error');
    }
  }, [data, savedCharts, showToast]);

  const handleShowSavedCharts = useCallback(() => {
    setSavedChartsModalOpen(true);
  }, []);

  const handleLoadChart = useCallback((chart: SavedChart) => {
    setSavedChartsModalOpen(false);
    if (onLoadChart) {
      const loadedData = {
        solarDate: new Date(chart.data.solarDate),
        gender: chart.data.gender,
        name: chart.data.name,
        raw: chart.data.raw,
      };
      onLoadChart(loadedData);
      showToast(`已加载 "${chart.name}"`, 'info');
    }
  }, [onLoadChart, showToast]);

  const handleDeleteChart = useCallback((chartId: string) => {
    try {
      const updatedCharts = savedCharts.filter((chart) => chart.id !== chartId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCharts));
      setSavedCharts(updatedCharts);
      showToast('已删除', 'success');
    } catch (error) {
      console.error('Failed to delete chart:', error);
      showToast('删除失败', 'error');
    }
  }, [savedCharts, showToast]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleSettings = useCallback(() => {
    setSettingsModalOpen(true);
  }, []);

  const handleStartAI = useCallback(() => {
    setShowAI(true);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!iztrolabeRef.current) {
      showToast('无法获取命盘内容', 'error');
      return;
    }

    try {
      showToast('正在生成图片...', 'info');

      const astrolabe = iztrolabeRef.current.querySelector('.iztro-astrolabe') as HTMLElement | null;
      if (!astrolabe) {
        showToast('无法找到命盘元素', 'error');
        return;
      }

      const computedStyle = window.getComputedStyle(astrolabe);
      const originalWidth = computedStyle.width;
      const originalHeight = computedStyle.height;
      const extraPadding = 20;
      const captureHeight = parseInt(originalHeight, 10) + extraPadding;

      const canvas = await html2canvas(astrolabe, {
        backgroundColor: '#F7F7F7',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: parseInt(originalWidth, 10),
        height: captureHeight,
        onclone: (clonedDoc) => {
          const clonedAstrolabe = clonedDoc.querySelector('.iztro-astrolabe') as HTMLElement | null;
          if (clonedAstrolabe) {
            clonedAstrolabe.style.width = originalWidth;
            clonedAstrolabe.style.height = `${captureHeight}px`;
            clonedAstrolabe.style.minWidth = originalWidth;
            clonedAstrolabe.style.minHeight = `${captureHeight}px`;
            clonedAstrolabe.style.filter = 'none';
            clonedAstrolabe.style.overflow = 'visible';
            clonedAstrolabe.style.paddingBottom = `${extraPadding}px`;
            const allElements = clonedAstrolabe.querySelectorAll<HTMLElement>('*');
            allElements.forEach((element) => {
              element.style.filter = 'none';
              element.style.webkitFilter = 'none';
            });
          }
        },
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${data.name || '命盘'}-${dateStr}.png`;
      link.href = dataUrl;
      link.click();

      showToast('图片已下载', 'success');
    } catch (error) {
      console.error('Failed to download:', error);
      showToast('下载失败，请重试', 'error');
    }
  }, [data.name, dateStr, showToast]);

  const iztroOptions = useMemo(() => ({
    yearDivide: settings.yearDivide,
    horoscopeDivide: settings.horoscopeDivide,
    ageDivide: settings.ageDivide,
    dayDivide: settings.dayDivide,
    algorithm: settings.algorithm,
  }), [settings.yearDivide, settings.horoscopeDivide, settings.ageDivide, settings.dayDivide, settings.algorithm]);

  const iztroKey = useMemo(() =>
    `${dateStr}-${timeIndex}-${birthdayType}-${data.gender}-${JSON.stringify(iztroOptions)}`,
    [dateStr, timeIndex, birthdayType, data.gender, iztroOptions]);

  const hiddenClasses = [
    settings.hideTransitStars && 'hide-transit-stars',
    settings.hideHoroscope && 'hide-horoscope',
    settings.hideBirthTime && 'hide-birth-time',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={chartContainerRef}
      className={`w-full h-full flex flex-col items-center ${isFullscreen ? 'bg-lz-paper' : ''}`}
    >
      {!isFullscreen && (
        <ChartToolbar
          onShowSavedCharts={handleShowSavedCharts}
          onToggleFullscreen={handleToggleFullscreen}
          onSettings={handleSettings}
          onDownload={handleDownload}
          onSave={handleSave}
          onInterpret={handleStartAI}
          isFullscreen={isFullscreen}
        />
      )}

      <div
        ref={iztrolabeRef}
        className={`card-frame iztro-theme-override p-0! ${hiddenClasses} ${isFullscreen ? 'fullscreen-chart' : 'w-full'}`}
        onClick={isFullscreen ? handleToggleFullscreen : undefined}
      >
        <Iztrolabe
          key={iztroKey}
          birthday={dateStr}
          birthTime={timeIndex}
          birthdayType={birthdayType}
          gender={data.gender}
          horoscopeDate={new Date()}
          options={iztroOptions}
        />
      </div>

      {!isFullscreen && showAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <AIInterpret
            data={data}
            onClose={() => setShowAI(false)}
            isModal
          />
        </div>
      )}

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      <SavedChartsModal
        isOpen={savedChartsModalOpen}
        onClose={() => setSavedChartsModalOpen(false)}
        savedCharts={savedCharts}
        onLoadChart={handleLoadChart}
        onDeleteChart={handleDeleteChart}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

    </div>
  );
}
