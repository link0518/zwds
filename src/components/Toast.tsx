import { useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import type { ToastProps, ToastType } from '../types';

/**
 * Toast 提示组件
 */
export default function Toast({ message, type = 'success', isVisible, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const icons: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle size={20} />,
        error: <XCircle size={20} />,
        info: <Info size={20} />
    };

    return (
        <div className={`toast toast-${type}`}>
            <span className="toast-icon">{icons[type]}</span>
            <span className="toast-message">{message}</span>
        </div>
    );
}
