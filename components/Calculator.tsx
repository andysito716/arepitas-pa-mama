
import React, { useState } from 'react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    setDisplay(prev => prev === '0' ? digit : prev + digit);
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      // Se utiliza Function para evaluar la expresión aritmética de forma controlada
      const result = new Function(`return ${equation + display}`)();
      setDisplay(String(result));
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
      <div className="bg-slate-900 w-full max-w-xs rounded-[32px] p-6 shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-xs font-black uppercase tracking-widest opacity-50">Calculadora</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 mb-4 text-right">
          <div className="text-[10px] text-white/30 font-mono h-4 truncate mb-1">{equation}</div>
          <div className="text-3xl text-white font-mono font-bold truncate">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Fix: Explicitly cast color props to match the component's union type and use React.FC for key support */}
          {['7', '8', '9', '/'].map(btn => (
            <CalcBtn key={btn} val={btn} onClick={() => isNaN(Number(btn)) ? handleOperator(btn) : handleDigit(btn)} color={(isNaN(Number(btn)) ? 'amber' : 'gray') as 'amber' | 'gray'} />
          ))}
          {['4', '5', '6', '*'].map(btn => (
            <CalcBtn key={btn} val={btn} onClick={() => isNaN(Number(btn)) ? handleOperator(btn) : handleDigit(btn)} color={(isNaN(Number(btn)) ? 'amber' : 'gray') as 'amber' | 'gray'} />
          ))}
          {['1', '2', '3', '-'].map(btn => (
            <CalcBtn key={btn} val={btn} onClick={() => isNaN(Number(btn)) ? handleOperator(btn) : handleDigit(btn)} color={(isNaN(Number(btn)) ? 'amber' : 'gray') as 'amber' | 'gray'} />
          ))}
          {['C', '0', '=', '+'].map(btn => (
            <CalcBtn key={btn} val={btn} onClick={() => btn === 'C' ? clear() : btn === '=' ? calculate() : isNaN(Number(btn)) ? handleOperator(btn) : handleDigit(btn)} color={(btn === '=' ? 'blue' : btn === 'C' ? 'red' : isNaN(Number(btn)) ? 'amber' : 'gray') as 'amber' | 'gray' | 'blue' | 'red'} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface CalcBtnProps {
  val: string;
  onClick: () => void;
  color: 'amber' | 'gray' | 'blue' | 'red';
}

// Fix: Use React.FC to ensure standard props like 'key' are correctly recognized by TypeScript
const CalcBtn: React.FC<CalcBtnProps> = ({ val, onClick, color }) => {
  const colors = {
    amber: 'bg-amber-500 text-white',
    gray: 'bg-white/10 text-white hover:bg-white/20',
    blue: 'bg-blue-600 text-white',
    red: 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
  };

  return (
    <button onClick={onClick} className={`h-14 rounded-xl font-bold text-lg active:scale-90 transition-all ${colors[color]}`}>
      {val === '*' ? '×' : val === '/' ? '÷' : val}
    </button>
  );
};
