
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
          <p className="text-sm font-bold text-slate-500 leading-relaxed">
            {message}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={onCancel}
              className="py-4 bg-slate-100 text-slate-500 font-black rounded-2xl active:scale-95 transition-all uppercase text-xs"
            >
              No, cancelar
            </button>
            <button
              onClick={onConfirm}
              className="py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all uppercase text-xs"
            >
              Sí, reabrir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
