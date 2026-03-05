
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialStep {
  title: string;
  description: string;
  targetTab?: string;
  elementId?: string;
  waitForAction?: 'openSalesForm' | 'closeSalesForm';
  hideNext?: boolean;
}

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
  isSalesFormOpen: boolean;
}

export const Tutorial: React.FC<TutorialProps> = ({ isOpen, onClose, activeTab, onTabChange, isSalesFormOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const steps: TutorialStep[] = [
    {
      title: "¡Bienvenido a Ventas Master!",
      description: "Esta aplicación está diseñada para ayudarte a controlar las ventas y ganancias de 'Arepitas pa' Mamá'. Vamos a darte un recorrido interactivo.",
      targetTab: "ventas"
    },
    // SECCIÓN VENTAS
    {
      title: "Panel de Ganancias",
      description: "Aquí ves tu utilidad real. El color verde indica que estás ganando dinero después de descontar todos los costos.",
      targetTab: "ventas",
      elementId: "tutorial-profit-card"
    },
    {
      title: "Registrar una Venta",
      description: "Dale click al botón azul '+' para registrar una nueva venta. Yo te esperaré aquí.",
      targetTab: "ventas",
      elementId: "tutorial-add-sale",
      waitForAction: 'openSalesForm',
      hideNext: true
    },
    {
      title: "Formulario de Venta",
      description: "¡Excelente! Ahora estás en la ventana de ventas. Aquí puedes escribir qué vendiste (ej: Arepa de Queso).",
      elementId: "tutorial-product-input"
    },
    {
      title: "Cantidad",
      description: "Indica cuántas unidades vendiste. Por defecto es 1.",
      elementId: "tutorial-quantity-input"
    },
    {
      title: "Nombre del Cliente",
      description: "Escribe el nombre de la persona que te compró. Esto ayuda a llevar un mejor control.",
      elementId: "tutorial-client-input"
    },
    {
      title: "Tipo de Cliente",
      description: "Diferencia entre un cliente final o un distribuidor. Los distribuidores suelen comprar al por mayor.",
      elementId: "tutorial-client-type-select"
    },
    {
      title: "Precio y Confirmación",
      description: "Ingresa el precio y cuando estés listo, dale a 'CONFIRMAR VENTA' para guardarla. El tutorial seguirá cuando cierres esta ventana.",
      elementId: "tutorial-confirm-sale",
      waitForAction: 'closeSalesForm',
      hideNext: true
    },
    {
      title: "Cierre de Caja",
      description: "¡Muy importante! Al final del día, presiona este botón. Esto guarda todas tus ventas y gastos en el historial y deja la pantalla limpia para mañana.",
      targetTab: "ventas",
      elementId: "tutorial-close-day"
    },
    // SECCIÓN COSTOS
    {
      title: "Costos e Insumos",
      description: "En esta pestaña configuras cuánto te cuesta cada arepa y registras gastos como harina o queso.",
      targetTab: "costos",
      elementId: "nav-costos"
    },
    {
      title: "Registrar Gastos",
      description: "Usa este botón naranja para anotar compras de materiales o cualquier gasto extra del negocio.",
      targetTab: "costos",
      elementId: "tutorial-add-expense"
    },
    {
      title: "Calculadora de Precios",
      description: "Si no sabes a cuánto vender algo, usa esta herramienta para calcular el precio ideal basado en tus costos.",
      targetTab: "costos",
      elementId: "tutorial-calculator-btn"
    },
    // SECCIÓN NOTAS
    {
      title: "Bloc de Notas y Sugerencias",
      description: "Esta es tu nueva sección para recordatorios y buzón de ideas.",
      targetTab: "notas",
      elementId: "nav-notas"
    },
    {
      title: "Notas Interactivas",
      description: "Anota pedidos o recordatorios aquí. ¡Las notas parecen hojas de libreta y puedes moverlas arrastrándolas!",
      targetTab: "notas",
      elementId: "tutorial-add-note"
    },
    {
      title: "Buzón de Sugerencias",
      description: "Aquí puedes dejar ideas para mejorar. ¡Se borran solas cada semana para no ocupar espacio!",
      targetTab: "notas",
      elementId: "tutorial-add-suggestion"
    },
    // OTRAS SECCIONES
    {
      title: "Historial de Cierres",
      description: "Aquí puedes ver todos tus días anteriores y descargar reportes profesionales de tus ganancias.",
      targetTab: "historial",
      elementId: "nav-historial"
    },
    {
      title: "Inteligencia Artificial",
      description: "Nuestra IA analiza tus ventas y te da consejos personalizados para ganar más dinero.",
      targetTab: "ia",
      elementId: "nav-ia"
    },
    {
      title: "Navegación Principal",
      description: "Usa esta barra inferior para moverte rápidamente entre todas las secciones que acabamos de ver.",
      elementId: "tutorial-nav-bar"
    },
    {
      title: "¡Todo listo!",
      description: "Ya conoces todas las herramientas de tu negocio. ¡Mucho éxito con tus ventas de hoy!",
      targetTab: "ventas"
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      updateSpotlight(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const step = steps[currentStep];
      if (step.waitForAction === 'openSalesForm' && isSalesFormOpen) {
        handleNext();
      } else if (step.waitForAction === 'closeSalesForm' && !isSalesFormOpen) {
        handleNext();
      }
    }
  }, [isSalesFormOpen, isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        updateSpotlight(currentStep);
      }, 300);

      // Fix: Update spotlight on scroll so it follows the element
      const handleScroll = () => updateSpotlight(currentStep);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [currentStep, activeTab, isSalesFormOpen, isOpen]);

  const updateSpotlight = (stepIndex: number) => {
    const step = steps[stepIndex];
    if (step.elementId) {
      const el = document.getElementById(step.elementId);
      if (el) {
        setSpotlightRect(el.getBoundingClientRect());
        return;
      }
    }
    setSpotlightRect(null);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      if (steps[nextStep].targetTab && steps[nextStep].targetTab !== activeTab) {
        onTabChange(steps[nextStep].targetTab);
      }
      setCurrentStep(nextStep);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      if (steps[prevStep].targetTab && steps[prevStep].targetTab !== activeTab) {
        onTabChange(steps[prevStep].targetTab);
      }
      setCurrentStep(prevStep);
    }
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[300] overflow-hidden pointer-events-none">
      {/* Solo la Flecha indicadora */}
      {spotlightRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            top: spotlightRect.top - 60,
            left: spotlightRect.left + (spotlightRect.width / 2) - 20
          }}
          className="absolute z-30 text-blue-600 drop-shadow-[0_4px_8px_rgba(37,99,235,0.4)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      )}

      {/* Contenido del Tutorial (Caja de texto) */}
      <div className="absolute inset-x-0 bottom-24 flex flex-col items-center justify-center p-6 pointer-events-none">
        <motion.div 
          drag
          dragMomentum={false}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-sm rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 border-blue-100 overflow-hidden z-20 pointer-events-auto cursor-default"
        >
          {/* Drag Handle */}
          <div className="h-6 bg-slate-50 flex items-center justify-center cursor-move border-b border-slate-100">
            <div className="w-12 h-1 bg-slate-300 rounded-full" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="p-6 pt-4 space-y-4"
            >
            <div className="flex justify-between items-center">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded-full tracking-tighter">
                {currentStepData.waitForAction ? "Acción Requerida" : `Guía ${currentStep + 1} / ${steps.length}`}
              </span>
              <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800 leading-tight">
                {currentStepData.title}
              </h3>
              <p className="text-slate-500 font-bold text-xs leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              {currentStep > 0 && !currentStepData.waitForAction && (
                <button 
                  onClick={handlePrev}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  Atrás
                </button>
              )}
              {!currentStepData.hideNext && (
                <button 
                  onClick={handleNext}
                  className="flex-[2] py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  {currentStep === steps.length - 1 ? "¡Empezar!" : "Siguiente"}
                </button>
              )}
            </div>
          </motion.div>
          </AnimatePresence>
          <div className="h-1 w-full bg-slate-100">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              className="h-full bg-blue-600"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
