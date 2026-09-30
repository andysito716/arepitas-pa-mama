import React, { useState } from 'react';

interface WeeklySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  onSaveBusinessId: (newId: string) => void;
  isSyncing: boolean;
  onManualSync: () => void;
  lastSyncTime: Date | null;
  salesCount: number;
}

export const WeeklySyncModal: React.FC<WeeklySyncModalProps> = ({
  isOpen,
  onClose,
  businessId,
  onSaveBusinessId,
  isSyncing,
  onManualSync,
  lastSyncTime,
  salesCount
}) => {
  const [tempId, setTempId] = useState(businessId);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const clean = tempId.trim().toLowerCase();
    if (!clean) return;
    onSaveBusinessId(clean);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(businessId || 'arepitas-pa-mama');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 sm:p-5 space-y-3.5 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top blue accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">
                Sincronización en la Nube
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Varios celulares conectados a la misma base
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status card */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                Base de Datos Conectada
              </span>
            </div>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
              {salesCount} ventas
            </span>
          </div>

          <p className="text-[11px] text-slate-700 font-medium leading-snug">
            Cualquier venta registrada se guarda en la nube y aparece <strong>automáticamente en los otros celulares</strong> con este mismo ID.
          </p>

          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-semibold border-t border-blue-100">
            <span>Última sincronización:</span>
            <span className="text-slate-700 font-bold">
              {lastSyncTime ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Activa'}
            </span>
          </div>
        </div>

        {/* ID Config */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider ml-1">
            ID del Negocio
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={tempId}
              onChange={(e) => setTempId(e.target.value)}
              placeholder="arepitas-pa-mama"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
            {tempId !== businessId && (
              <button
                onClick={handleSave}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 shadow-xs"
              >
                Conectar
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopy}
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{copied ? '¡Copiado!' : 'Copiar ID'}</span>
          </button>

          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isSyncing ? 'Cargando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
