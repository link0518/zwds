import { useCallback, useEffect, useState } from 'react';
import { List, Maximize2, Minimize2, Settings, Download, Save, Sparkles } from 'lucide-react';
import type { ChartToolbarProps } from '../types';

/**
 * 命盘工具栏组件
 * 功能：
 * 1. 保存的命盘 (Shift + L)
 * 2. 全屏/退出 (Shift + F)
 * 3. 设置 (Shift + P)
 * 4. 下载 (Shift + D)
 * 5. 保存 (Shift + S)
 * 6. 解读命盘 (Shift + I)
 */
export default function ChartToolbar({
  onShowSavedCharts,
  onToggleFullscreen,
  onSettings,
  onDownload,
  onSave,
  onInterpret,
  isFullscreen = false,
}: ChartToolbarProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const toolbarItems = [
    {
      id: 'saved',
      icon: List,
      label: '保存的命盘',
      shortcut: 'L',
      onClick: onShowSavedCharts,
    },
    {
      id: 'fullscreen',
      icon: isFullscreen ? Minimize2 : Maximize2,
      label: isFullscreen ? '退出全屏' : '全屏',
      shortcut: 'F',
      onClick: onToggleFullscreen,
    },
    {
      id: 'settings',
      icon: Settings,
      label: '设置',
      shortcut: 'P',
      onClick: onSettings,
    },
    {
      id: 'download',
      icon: Download,
      label: '下载',
      shortcut: 'D',
      onClick: onDownload,
    },
    {
      id: 'save',
      icon: Save,
      label: '保存',
      shortcut: 'S',
      onClick: onSave,
    },
  ];

  if (onInterpret) {
    toolbarItems.push({
      id: 'interpret',
      icon: Sparkles,
      label: '解读命盘',
      shortcut: 'I',
      onClick: onInterpret,
    });
  }

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!event.shiftKey) return;

    const keyMap: Record<string, (() => void) | undefined> = {
      L: onShowSavedCharts,
      F: onToggleFullscreen,
      P: onSettings,
      D: onDownload,
      S: onSave,
      I: onInterpret,
    };

    const key = event.key.toUpperCase();
    if (keyMap[key]) {
      event.preventDefault();
      keyMap[key]?.();
    }
  }, [onShowSavedCharts, onToggleFullscreen, onSettings, onDownload, onSave, onInterpret]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="chart-toolbar">
      {toolbarItems.map((item) => (
        <div
          key={item.id}
          className="toolbar-item-wrapper"
          onMouseEnter={() => setShowTooltip(item.id)}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <button
            className="toolbar-btn"
            onClick={item.onClick}
          >
            <item.icon size={18} strokeWidth={1.5} />
          </button>

          {showTooltip === item.id && (
            <div className="toolbar-tooltip">
              <span className="tooltip-label">{item.label}</span>
              <span className="tooltip-shortcut">
                <kbd>shift</kbd>
                <span>+</span>
                <kbd>{item.shortcut}</kbd>
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
