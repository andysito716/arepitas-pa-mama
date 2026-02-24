
import React, { useState, useEffect } from 'react';

interface SyncManagerProps {
  businessId: string;
  onSetBusinessId: (id: string) => void;
  isSyncing: boolean;
}

export const SyncManager: React.FC<SyncManagerProps> = ({ businessId, onSetBusinessId, isSyncing }) => {
  const [tempId, setTempId] = useState(businessId);

  // Sincronizar el estado local con el prop si este cambia externamente
  useEffect(() => {
    setTempId(businessId);
  }, [businessId]);

  const handleConnect = () => {
    const cleanId = tempId.trim().toLowerCase();
    if (!cleanId) return alert("Por favor, ingresa un nombre para tu negocio.");
    
    // Si es el mismo ID, solo forzamos un refresco visual
    onSetBusinessId(cleanId);
  };

  const handleLogout = () => {
    if (confirm("¿Cerrar sesión? Esto no borrará tus datos en la nube, pero dejarás de verlos en este dispositivo.")) {
      onSetBusinessId('');
      setTempId('');
      localStorage.removeItem('business_id');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors ${businessId ? 'bg-green-600 shadow-green-100' : 'bg-blue-600 shadow-blue-100'}`}>
            {isSyncing ? (
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : businessId ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-black text-slate-800 leading-tight">
              {businessId ? 'Sesión Activa' : 'Nube de Negocio'}
            </h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
              {businessId ? businessId : 'Configura tu cuenta'}
            </p>
          </div>
          {businessId && (
            <button 
              onClick={handleLogout}
              className="p-3 bg-red-50 text-red-500 rounded-xl active:bg-red-500 active:text-white transition-all"
              title="Cerrar Sesión"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1.5 block tracking-widest">Nombre del Negocio (ID)</label>
            <div className="relative">
              <input 
                type="text"
                value={tempId}
                onChange={(e) => setTempId(e.target.value)}
                placeholder="Ej: carniceria-juan"
                className="w-full px-5 py-4 bg-slate-100 rounded-2xl font-bold text-slate-900 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all"
              />
              {tempId !== businessId && tempId.length > 0 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                   <span className="text-[9px] font-black text-blue-500 uppercase animate-pulse">Sin guardar</span>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleConnect}
            disabled={isSyncing || !tempId.trim()}
            className={`w-full py-5 font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
              tempId !== businessId 
              ? 'bg-blue-600 text-white shadow-blue-200' 
              : 'bg-slate-800 text-white shadow-slate-200 opacity-80'
            }`}
          >
            {isSyncing ? 'CONECTANDO...' : businessId ? 'ACTUALIZAR / CAMBIAR' : 'CONECTAR MI NEGOCIO'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100">
        <h4 className="font-black text-blue-800 text-sm mb-2 flex items-center gap-2 uppercase tracking-tight">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          ¿Cómo funciona?
        </h4>
        <p className="text-[11px] text-blue-700 leading-relaxed font-bold uppercase opacity-80">
          Usa el mismo ID en varios dispositivos para ver las ventas en tiempo real. Si te equivocas de nombre, simplemente edita el cuadro de arriba y dale a "Cambiar".
        </p>
      </div>

      {businessId && (
        <p className="text-center px-6">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
            Estás conectado como:<br/>
            <span className="text-blue-500">{businessId}</span>
          </span>
        </p>
      )}
    </div>
  );
};
