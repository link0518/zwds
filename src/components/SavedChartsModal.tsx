import { useState, type MouseEvent } from 'react';
import { X, Trash2, User, Calendar } from 'lucide-react';
import type { SavedChart, SavedChartsModalProps } from '../types';

/**
 * 已保存命盘列表弹窗组件
 */
export default function SavedChartsModal({
  isOpen,
  onClose,
  savedCharts = [],
  onLoadChart,
  onDeleteChart,
}: SavedChartsModalProps) {
  if (!isOpen) return null;

  const [pendingDelete, setPendingDelete] = useState<SavedChart | null>(null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = (event: MouseEvent<HTMLButtonElement>, chart: SavedChart) => {
    event.stopPropagation();
    setPendingDelete(chart);
  };

  const handleConfirmDelete = () => {
    if (pendingDelete) {
      onDeleteChart?.(pendingDelete.id);
    }
    setPendingDelete(null);
  };

  const handleCancelDelete = () => {
    setPendingDelete(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content saved-charts-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          <h2 className="modal-title">保存的命盘</h2>
        </div>

        <div className="saved-charts-body">
          {savedCharts.length === 0 ? (
            <div className="empty-state">
              <p>暂无保存的命盘</p>
              <p className="empty-hint">点击工具栏的保存按钮来保存命盘</p>
            </div>
          ) : (
            <div className="saved-charts-list">
              {savedCharts.map((chart) => (
                <div
                  key={chart.id}
                  className="saved-chart-item"
                  onClick={() => onLoadChart(chart)}
                >
                  <div className="chart-info">
                    <div className="chart-name">
                      <User size={16} />
                      <span>{chart.name}</span>
                    </div>
                    <div className="chart-date">
                      <Calendar size={14} />
                      <span>{formatDate(chart.savedAt)}</span>
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(event) => handleDelete(event, chart)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content confirm-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">确认删除</h3>
            </div>
            <div className="confirm-body">
              <p className="confirm-text">确定要删除“{pendingDelete.name}”吗？</p>
            </div>
            <div className="confirm-actions">
              <button className="btn-outline" onClick={handleCancelDelete}>
                取消
              </button>
              <button className="btn-primary" onClick={handleConfirmDelete}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
