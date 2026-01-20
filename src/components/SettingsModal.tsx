import { X } from 'lucide-react';
import type { SettingsModalProps, Settings } from '../types';

/**
 * 设置面板弹窗组件
 */
export default function SettingsModal({ isOpen, onClose, settings, onSettingsChange }: SettingsModalProps) {
  if (!isOpen) return null;

  const handleToggle = (key: keyof Settings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleRadioChange = (key: keyof Settings, value: Settings[keyof Settings]) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          <h2 className="modal-title">设置</h2>
        </div>

        <div className="settings-body">
          <div className="settings-group">
            <div className="settings-item">
              <label className="settings-label">隐藏流耀</label>
              <button
                className={`toggle-switch ${settings.hideTransitStars ? 'active' : ''}`}
                onClick={() => handleToggle('hideTransitStars')}
              >
                <span className="toggle-slider"></span>
              </button>
            </div>

            <div className="settings-item">
              <label className="settings-label">隐藏运限</label>
              <button
                className={`toggle-switch ${settings.hideHoroscope ? 'active' : ''}`}
                onClick={() => handleToggle('hideHoroscope')}
              >
                <span className="toggle-slider"></span>
              </button>
            </div>

            <div className="settings-item">
              <label className="settings-label">隐藏时间</label>
              <button
                className={`toggle-switch ${settings.hideBirthTime ? 'active' : ''}`}
                onClick={() => handleToggle('hideBirthTime')}
              >
                <span className="toggle-slider"></span>
              </button>
            </div>
          </div>

          <div className="settings-group">
            <div className="settings-item radio-group">
              <label className="settings-label">年分界：</label>
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="yearDivide"
                    checked={settings.yearDivide === 'normal'}
                    onChange={() => handleRadioChange('yearDivide', 'normal')}
                  />
                  <span className="radio-custom"></span>
                  <span>按正月初一</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="yearDivide"
                    checked={settings.yearDivide === 'exact'}
                    onChange={() => handleRadioChange('yearDivide', 'exact')}
                  />
                  <span className="radio-custom"></span>
                  <span>按立春</span>
                </label>
              </div>
            </div>

            <div className="settings-item radio-group">
              <label className="settings-label">运限分界：</label>
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="horoscopeDivide"
                    checked={settings.horoscopeDivide === 'normal'}
                    onChange={() => handleRadioChange('horoscopeDivide', 'normal')}
                  />
                  <span className="radio-custom"></span>
                  <span>按正月初一</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="horoscopeDivide"
                    checked={settings.horoscopeDivide === 'exact'}
                    onChange={() => handleRadioChange('horoscopeDivide', 'exact')}
                  />
                  <span className="radio-custom"></span>
                  <span>按立春</span>
                </label>
              </div>
            </div>

            <div className="settings-item radio-group">
              <label className="settings-label">岁数分界：</label>
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="ageDivide"
                    checked={settings.ageDivide === 'normal'}
                    onChange={() => handleRadioChange('ageDivide', 'normal')}
                  />
                  <span className="radio-custom"></span>
                  <span>按自然年</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="ageDivide"
                    checked={settings.ageDivide === 'birthday'}
                    onChange={() => handleRadioChange('ageDivide', 'birthday')}
                  />
                  <span className="radio-custom"></span>
                  <span>按生日</span>
                </label>
              </div>
            </div>

            <div className="settings-item radio-group">
              <label className="settings-label">晚子时：</label>
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="dayDivide"
                    checked={settings.dayDivide === 'current'}
                    onChange={() => handleRadioChange('dayDivide', 'current')}
                  />
                  <span className="radio-custom"></span>
                  <span>算当日</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="dayDivide"
                    checked={settings.dayDivide === 'forward'}
                    onChange={() => handleRadioChange('dayDivide', 'forward')}
                  />
                  <span className="radio-custom"></span>
                  <span>算来日</span>
                </label>
              </div>
            </div>

            <div className="settings-item radio-group">
              <label className="settings-label">安星方法：</label>
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="algorithm"
                    checked={settings.algorithm === 'default'}
                    onChange={() => handleRadioChange('algorithm', 'default')}
                  />
                  <span className="radio-custom"></span>
                  <span>通用版本</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="algorithm"
                    checked={settings.algorithm === 'zhongzhou'}
                    onChange={() => handleRadioChange('algorithm', 'zhongzhou')}
                  />
                  <span className="radio-custom"></span>
                  <span>中州派</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
