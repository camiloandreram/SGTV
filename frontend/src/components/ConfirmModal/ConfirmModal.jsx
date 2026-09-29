import React from 'react';

const ConfirmModal = ({
  isOpen,
  title = 'Confirmar acción',
  message = '',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  type = 'warning', // 'warning' | 'danger' | 'success'
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const styles = {
    warning: { icon: 'fa-triangle-exclamation', color: 'text-amber-600', bg: 'bg-amber-100', btn: 'bg-red-600 hover:bg-red-700' },
    danger:  { icon: 'fa-circle-exclamation',   color: 'text-red-600',   bg: 'bg-red-100',   btn: 'bg-red-600 hover:bg-red-700' },
    success: { icon: 'fa-circle-check',         color: 'text-green-600', bg: 'bg-green-100', btn: 'bg-green-600 hover:bg-green-700' }
  }[type] || { icon: 'fa-triangle-exclamation', color: 'text-amber-600', bg: 'bg-amber-100', btn: 'bg-red-600 hover:bg-red-700' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-start gap-4">
          <div className={`${styles.bg} ${styles.color} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0`}>
            <i className={`fa-solid ${styles.icon} text-xl`}></i>
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="font-bold text-gray-800 text-base mb-1">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors ${styles.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;