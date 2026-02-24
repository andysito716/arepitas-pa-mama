
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between safe-top">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
          AM
        </div>
        <h1 className="text-lg font-black text-slate-800 tracking-tighter">Ventas Master Arepitas pa mama</h1>
      </div>
      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
        <img src="https://picsum.photos/32/32?random=1" alt="Profile" />
      </div>
    </header>
  );
};