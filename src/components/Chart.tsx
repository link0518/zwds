import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Iztrolabe } from 'react-iztro';
import html2canvas from 'html2canvas';
import ChartToolbar from './ChartToolbar';
import SettingsModal from './SettingsModal';
import SavedChartsModal from './SavedChartsModal';
import AIInterpret from './AIInterpret';
import Toast from './Toast';
import type { ChartData, ChartProps, SavedChart, Settings, ToastState, ToastType } from '../types';

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

const isSameChartData = (savedChart: SavedChart, data: ChartData) => {
  const savedRaw = savedChart.data.raw;
  const currentRaw = data.raw;
  return (
    savedChart.data.solarDate === data.solarDate.toISOString() &&
    savedChart.data.gender === data.gender &&
    savedChart.data.name === data.name &&
    savedRaw.name === currentRaw.name &&
    savedRaw.gender === currentRaw.gender &&
    savedRaw.type === currentRaw.type &&
    savedRaw.year === currentRaw.year &&
    savedRaw.month === currentRaw.month &&
    savedRaw.day === currentRaw.day &&
    savedRaw.hour === currentRaw.hour &&
    savedRaw.fixLeap === currentRaw.fixLeap
  );
};

export default function Chart({ data, onLoadChart }: ChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [savedChartsModalOpen, setSavedChartsModalOpen] = useState(false);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<ToastState>({ isVisible: false, message: '', type: 'success' });
  const [showAI, setShowAI] = useState(false);
  const [activeSavedChartId, setActiveSavedChartId] = useState<string | null>(null);

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

  const persistSavedCharts = useCallback((charts: SavedChart[], errorMessage?: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
      setSavedCharts(charts);
      return true;
    } catch (error) {
      console.error('Failed to save charts:', error);
      if (errorMessage) {
        showToast(errorMessage, 'error');
      }
      return false;
    }
  }, [showToast]);

  const buildSavedChart = useCallback((): SavedChart => {
    const chartName = data.name ? `${data.name}-命盘` : '未命名命盘';
    return {
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
  }, [data]);

  const handleSettingsChange = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, []);

  const handleSave = useCallback(() => {
    const chartToSave = buildSavedChart();
    const updatedCharts = [chartToSave, ...savedCharts];
    const saved = persistSavedCharts(updatedCharts, '保存失败，请重试');
    if (saved) {
      showToast(`"${chartToSave.name}" 保存成功`, 'success');
    }
  }, [buildSavedChart, persistSavedCharts, savedCharts, showToast]);

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
    const matchedChart = savedCharts.find((chart) => isSameChartData(chart, data));
    if (matchedChart) {
      setActiveSavedChartId(matchedChart.id);
      setShowAI(true);
      return;
    }

    const newChart = buildSavedChart();
    const updatedCharts = [newChart, ...savedCharts];
    const saved = persistSavedCharts(updatedCharts, '自动保存失败，请重试');
    if (saved) {
      setActiveSavedChartId(newChart.id);
    }
    setShowAI(true);
  }, [buildSavedChart, data, persistSavedCharts, savedCharts]);

  const handleInterpretComplete = useCallback((content: string) => {
    const interpretedAt = Date.now();
    const applyInterpretation = (chartId: string) => savedCharts.map((chart) => (
      chart.id === chartId
        ? { ...chart, interpretation: { content, savedAt: interpretedAt } }
        : chart
    ));

    if (activeSavedChartId) {
      const updatedCharts = applyInterpretation(activeSavedChartId);
      const hasTarget = updatedCharts.some((chart) => chart.id === activeSavedChartId);
      if (hasTarget) {
        persistSavedCharts(updatedCharts, '保存解读失败，请重试');
        return;
      }
    }

    const matchedChart = savedCharts.find((chart) => isSameChartData(chart, data));
    if (matchedChart) {
      const updatedCharts = applyInterpretation(matchedChart.id);
      persistSavedCharts(updatedCharts, '保存解读失败，请重试');
      setActiveSavedChartId(matchedChart.id);
      return;
    }

    const newChart = buildSavedChart();
    const updatedCharts = [
      { ...newChart, interpretation: { content, savedAt: interpretedAt } },
      ...savedCharts,
    ];
    persistSavedCharts(updatedCharts, '保存解读失败，请重试');
    setActiveSavedChartId(newChart.id);
  }, [activeSavedChartId, buildSavedChart, data, persistSavedCharts, savedCharts]);

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

  const currentSavedChart = useMemo(
    () => savedCharts.find((chart) => isSameChartData(chart, data)),
    [savedCharts, data],
  );
  const currentInterpretation = currentSavedChart?.interpretation ?? null;

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
          interpretLabel={currentInterpretation ? '查看解读' : '解读命盘'}
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
            initialResult={currentInterpretation?.content ?? null}
            onInterpretComplete={handleInterpretComplete}
            onClose={() => {
              setShowAI(false);
              setActiveSavedChartId(null);
            }}
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
