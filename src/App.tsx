import { useCallback, useEffect, useState } from 'react';
import Layout from './components/Layout';
import InputForm from './components/InputForm';
import Chart from './components/Chart';
import SavedChartsModal from './components/SavedChartsModal';
import ErrorBoundary from './components/ErrorBoundary';
import type { ChartData, SavedChart } from './types';

const STORAGE_KEY = 'zwds-saved-charts';

const loadSavedCharts = (): SavedChart[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as SavedChart[]) : [];
  } catch (error) {
    console.error('Failed to load saved charts:', error);
    return [];
  }
};

function App() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [showSavedChartsModal, setShowSavedChartsModal] = useState(false);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('zwds-theme') === 'dark';
    } catch (error) {
      console.error('Failed to load theme:', error);
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('zwds-theme', isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, [isDark]);

  useEffect(() => {
    setSavedCharts(loadSavedCharts());
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setSavedCharts(loadSavedCharts());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleFormSubmit = (data: ChartData) => {
    setChartData(data);
  };

  const handleReset = () => {
    setChartData(null);
  };

  const handleLoadChartData = (data: ChartData) => {
    setChartData(data);
  };

  const handleLoadSavedChart = (chart: SavedChart) => {
    const loadedData: ChartData = {
      solarDate: new Date(chart.data.solarDate),
      gender: chart.data.gender,
      name: chart.data.name,
      raw: chart.data.raw,
    };
    setChartData(loadedData);
    setShowSavedChartsModal(false);
  };

  const handleDeleteChart = useCallback((chartId: string) => {
    try {
      const updatedCharts = savedCharts.filter((chart) => chart.id !== chartId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCharts));
      setSavedCharts(updatedCharts);
    } catch (error) {
      console.error('Failed to delete chart:', error);
    }
  }, [savedCharts]);

  const handleNavigateHome = () => {
    setChartData(null);
  };

  const handleOpenSavedCharts = () => {
    setSavedCharts(loadSavedCharts());
    setShowSavedChartsModal(true);
  };

  return (
    <ErrorBoundary>
      <Layout
        onNavigateHome={handleNavigateHome}
        onOpenSavedCharts={handleOpenSavedCharts}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      >
        <div className={`flex flex-col items-center flex-1 w-full ${chartData ? 'pt-10 md:pt-12' : 'pt-12 md:pt-16 justify-center'}`}>
          <header className={`text-center ${chartData ? 'mb-6 md:mb-7' : 'mb-10 md:mb-14'}`}>
            <h1
              className={`font-bold text-lz-ink drop-shadow-sm ${chartData
                ? 'text-2xl md:text-3xl tracking-[0.2em]'
                : 'text-5xl md:text-7xl tracking-[0.35em] mb-3'
                }`}
            >
              {chartData ? '星盘' : '紫微斗数'}
            </h1>
          </header>

          <div className={`w-full ${chartData ? 'flex-1 flex flex-col max-w-6xl' : 'max-w-4xl'}`}>
            {!chartData ? (
              <InputForm onSubmit={handleFormSubmit} />
            ) : (
              <Chart data={chartData} onReset={handleReset} onLoadChart={handleLoadChartData} />
            )}
          </div>
        </div>

        <SavedChartsModal
          isOpen={showSavedChartsModal}
          onClose={() => setShowSavedChartsModal(false)}
          savedCharts={savedCharts}
          onLoadChart={handleLoadSavedChart}
          onDeleteChart={handleDeleteChart}
        />
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
