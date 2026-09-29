import React from 'react';
import { DaySummary, WeekInfo } from '../../types/weekly';
import { formatCurrency } from '../../services/weeklyDateUtils';
import * as XLSX from 'xlsx';

interface WeeklyChartWidgetProps {
  daySummaries: DaySummary[];
  currentWeek: WeekInfo;
}

export const WeeklyChartWidget: React.FC<WeeklyChartWidgetProps> = ({
  daySummaries,
  currentWeek
}) => {
  const maxRevenue = Math.max(...daySummaries.map(d => d.totalRevenue), 1000);

  const handleExportExcel = () => {
    try {
      const dataToExport: any[] = [];
      daySummaries.forEach(day => {
        day.sales.forEach(s => {
          dataToExport.push({
            'Semana': currentWeek.label,
            'Fecha': s.date,
            'Día': s.dayName,
            'Producto': s.productName,
            'Cantidad': s.quantity,
            'Precio Unitario': s.price,
            'Costo Unitario': s.cost,
            'Total Venta': s.price * s.quantity,
            'Total Costo': s.cost * s.quantity,
            'Ganancia Neta': (s.price - s.cost) * s.quantity,
            'Cliente': s.buyerName,
            'Tipo': s.buyerType,
            'Notas': s.notes || ''
          });
        });
      });

      if (dataToExport.length === 0) {
        alert("No hay ventas registradas en esta semana para exportar.");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Ventas_${currentWeek.id}`);
      XLSX.writeFile(wb, `Reporte_Semana_${currentWeek.id}.xlsx`);
    } catch (e) {
      console.error("Error exporting to Excel:", e);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 leading-tight">
              Gráfica y Rendimiento Semanal
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Comparativa de ventas y utilidades por día
            </p>
          </div>
        </div>

        {/* Export Excel Button */}
        <button
          onClick={handleExportExcel}
          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Descargar Excel</span>
        </button>
      </div>

      {/* Bar Chart Container */}
      <div className="pt-2">
        <div className="grid grid-cols-7 gap-2 items-end h-44 pb-2 border-b border-slate-200">
          {daySummaries.map((day) => {
            const heightPercent = maxRevenue > 0 ? (day.totalRevenue / maxRevenue) * 100 : 0;
            const hasSales = day.totalRevenue > 0;

            return (
              <div key={day.date} className="flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                  <p>{day.dayName}: {formatCurrency(day.totalRevenue)}</p>
                  <p className="text-emerald-400">Ganancia: +{formatCurrency(day.totalProfit)}</p>
                </div>

                {/* Bars */}
                <div className="w-full flex items-end justify-center h-32 px-1">
                  <div
                    style={{ height: `${Math.max(hasSales ? 12 : 4, heightPercent)}%` }}
                    className={`w-full max-w-[36px] rounded-t-xl transition-all duration-500 relative ${
                      hasSales
                        ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-sm group-hover:from-blue-700 group-hover:to-indigo-600'
                        : 'bg-slate-100'
                    }`}
                  >
                    {hasSales && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-600">
                        ${Math.round(day.totalRevenue / 1000)}k
                      </span>
                    )}
                  </div>
                </div>

                {/* Day label */}
                <div className="text-center pt-2">
                  <span className="text-[11px] font-black text-slate-700 block">
                    {day.dayName.substring(0, 3)}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-medium">
                    {day.shortDate.split(' ')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
