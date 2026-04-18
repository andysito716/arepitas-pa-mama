
import React from 'react';
import { DailyArchive } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

interface HistoryViewProps {
  history: DailyArchive[];
  onDeleteDay: (archive: DailyArchive) => void;
  onEditDay: (archive: DailyArchive) => void;
  onQuickAdd: (archive: DailyArchive) => void;
  onUpdateDate: (archiveId: string, newDate: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onDeleteDay, onEditDay, onQuickAdd, onUpdateDate }) => {
  const [editingDateId, setEditingDateId] = React.useState<string | null>(null);
  const [tempDate, setTempDate] = React.useState("");
  const [expandedSales, setExpandedSales] = React.useState<Record<string, boolean>>({});
  const [expandedExpenses, setExpandedExpenses] = React.useState<Record<string, boolean>>({});

  const getContrastColor = (hexcolor: string | undefined): { text: string, muted: string, border: string } => {
    if (!hexcolor) return { 
      text: 'text-slate-700', 
      muted: 'text-slate-400', 
      border: 'border-slate-200'
    };
    
    // Normalize hex
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    const isDark = yiq < 128;

    return {
      text: isDark ? 'text-white' : 'text-slate-900',
      muted: isDark ? 'text-white/60' : 'text-slate-500',
      border: isDark ? 'border-white/10' : 'border-black/5'
    };
  };

  const toggleSales = (id: string) => {
    setExpandedSales(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpenses = (id: string) => {
    setExpandedExpenses(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDateEdit = (archive: DailyArchive) => {
    setEditingDateId(archive.id);
    setTempDate(archive.date);
  };

  const handleSaveDate = (archiveId: string) => {
    if (tempDate.trim()) {
      onUpdateDate(archiveId, tempDate);
    }
    setEditingDateId(null);
  };

  const downloadExcel = async () => {
    const lastMonth = history.filter(day => {
      const timestamp = parseInt(day.id.split('-')[1]);
      return !isNaN(timestamp) && (Date.now() - timestamp) <= 30 * 24 * 60 * 60 * 1000;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Mensual');

    // Definir columnas
    worksheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Cliente', key: 'cliente', width: 25 },
      { header: 'Producto', key: 'producto', width: 25 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Precio', key: 'precio', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Costo', key: 'costo', width: 15 },
      { header: 'Utilidad', key: 'utilidad', width: 15 }
    ];

    // Estilo de cabecera
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };

    // Añadir datos
    lastMonth.forEach(day => {
      day.sales.forEach(s => {
        worksheet.addRow({
          fecha: day.date,
          cliente: s.buyerName,
          producto: s.productName,
          cantidad: s.quantity,
          precio: s.price,
          total: s.price * s.quantity,
          costo: s.cost * s.quantity,
          utilidad: (s.price - s.cost) * s.quantity
        });
      });
    });

    // Proteger la hoja (Bloqueado para no ser modificado)
    // Esto evita que se editen las celdas sin "Desproteger Hoja"
    await worksheet.protect('arepitas_mama', {
      selectLockedCells: true,
      selectUnlockedCells: false,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      insertHyperlinks: false,
      deleteColumns: false,
      deleteRows: false,
      sort: false,
      autoFilter: false,
      pivotTables: false
    });

    // Generar y descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Reporte_Ventas_${new Date().toLocaleDateString()}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const lastMonth = history.filter(day => {
      const timestamp = parseInt(day.id.split('-')[1]);
      return !isNaN(timestamp) && (Date.now() - timestamp) <= 30 * 24 * 60 * 60 * 1000;
    });

    doc.setFontSize(18);
    doc.text("Reporte de Ventas - Último Mes", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = lastMonth.map(day => [
      day.date,
      `$${day.totalRevenue.toLocaleString()}`,
      `$${day.totalProfit.toLocaleString()}`,
      day.totalItems.toString()
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Fecha', 'Ingresos', 'Utilidad', 'Items']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`Reporte_Ventas_${new Date().toLocaleDateString()}.pdf`);
  };

  if (history.length === 0) {
    return (
      <div className="py-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm font-medium">Historial vacío.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Historial</h2>
        <div className="flex gap-2">
          <button 
            onClick={downloadExcel}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase border border-emerald-200 active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase border border-red-200 active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
      {history.map((day) => (
        <div key={day.id} className="group bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all relative">
          {/* Cabecera del Día */}
          <div className="bg-slate-800 p-4 text-white">
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Cierre de Caja</p>
                {editingDateId === day.id ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="bg-slate-700 text-white text-sm font-black px-2 py-1 rounded border border-slate-600 outline-none focus:border-blue-500 w-32"
                      autoFocus
                    />
                    <button 
                      onClick={() => handleSaveDate(day.id)}
                      className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setEditingDateId(null)}
                      className="p-1 bg-slate-600 text-white rounded hover:bg-slate-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/date">
                    <h4 className="text-sm font-black truncate capitalize">{day.date}</h4>
                    <button 
                      onClick={() => handleDateEdit(day)}
                      className="opacity-0 group-hover/date:opacity-100 p-1 text-slate-500 hover:text-blue-400 transition-all"
                      title="Editar fecha de este cierre"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2 flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-tighter">Utilidad</p>
                    <p className="text-sm font-black text-white leading-none">${day.totalProfit.toLocaleString()}</p>
                  </div>
                  <div className="text-right border-l border-white/10 pl-3">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Total Vendido</p>
                    <p className="text-lg font-black text-emerald-400 leading-none">${day.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {/* BOTÓN AÑADIR VENTA (Signo +) */}
                  <button
                    onClick={() => onQuickAdd(day)}
                    className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all border border-emerald-500/30 active:scale-90"
                    title="Añadir nueva venta a este día"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>

                  {/* BOTÓN REABRIR/EDITAR (Lápiz) */}
                  <button
                    onClick={() => onEditDay(day)}
                    className="flex items-center justify-center w-8 h-8 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all border border-blue-500/30 active:scale-90"
                    title="Reabrir este día para editar todo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>

                  {/* BOTÓN DE BORRADO */}
                  <button
                    onClick={() => onDeleteDay(day)}
                    className="flex items-center justify-center w-8 h-8 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-all border border-red-500/30 active:scale-90"
                    title="Borrar esta jornada permanentemente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contenedor de Listas Side-by-Side */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-100/50">
            {/* Columna Ventas */}
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ventas ({day.sales.length})</p>
              <div className="space-y-1.5">
                {(expandedSales[day.id] ? day.sales : day.sales.slice(0, 4)).map((s) => {
                  const theme = getContrastColor(s.color);
                  return (
                    <div 
                      key={s.id} 
                      className={`flex justify-between items-center text-[10px] ${s.color ? '' : 'bg-white'} p-2 rounded-xl border ${theme.border} shadow-sm transition-all`}
                      style={s.color ? { backgroundColor: s.color } : {}}
                    >
                      <div className="truncate pr-1">
                        <span className={`font-black ${theme.text} block leading-tight`}>{s.buyerName}</span>
                        <span className={`${theme.muted} italic leading-tight`}>{s.productName}</span>
                      </div>
                      <span className={`font-black ${theme.text} ml-1`}>
                        ${(s.price * s.quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
                {day.sales.length > 4 && (
                  <button 
                    onClick={() => toggleSales(day.id)}
                    className="w-full py-1 text-[8px] text-center text-blue-500 font-black uppercase tracking-widest hover:bg-blue-50 rounded-lg transition-all"
                  >
                    {expandedSales[day.id] ? 'Mostrar Menos' : `+ ${day.sales.length - 4} más`}
                  </button>
                )}
              </div>
            </div>

            {/* Columna Costos/Gastos */}
            <div className="space-y-2">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest ml-1">Costos y Gastos</p>
              <div className="space-y-1.5">
                {/* Gastos Directos */}
                {(expandedExpenses[day.id] ? day.expenses : day.expenses.slice(0, 2)).map((e) => (
                  <div key={e.id} className="flex justify-between items-center text-[10px] bg-amber-50 p-2 rounded-xl border border-amber-100 shadow-sm">
                    <div className="truncate pr-1">
                      <span className="font-black text-amber-800 block leading-tight">{e.description}</span>
                      <span className="text-amber-600/70 leading-tight uppercase text-[8px] font-bold">{e.category}</span>
                    </div>
                    <span className="font-black text-amber-900 ml-1">
                      ${e.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                
                {/* Resumen de COGS (Costo de lo vendido) */}
                <div className="flex justify-between items-center text-[10px] bg-slate-200 p-2 rounded-xl border border-slate-300 shadow-sm">
                  <div className="truncate pr-1">
                    <span className="font-black text-slate-700 block leading-tight">Costo Producción</span>
                    <span className="text-slate-500 leading-tight text-[8px] font-bold">TOTAL VENDIDO</span>
                  </div>
                  <span className="font-black text-slate-900 ml-1">
                    ${day.sales.reduce((acc, s) => acc + (s.cost * s.quantity), 0).toLocaleString()}
                  </span>
                </div>

                {(day.expenses.length > 2) && (
                  <button 
                    onClick={() => toggleExpenses(day.id)}
                    className="w-full py-1 text-[8px] text-center text-amber-600 font-black uppercase tracking-widest hover:bg-amber-100 rounded-lg transition-all"
                  >
                    {expandedExpenses[day.id] ? 'Mostrar Menos' : `+ ${day.expenses.length - 2} más`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};
