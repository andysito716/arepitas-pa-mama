
import React, { useState, useRef, useEffect } from 'react';
import { getBusinessInsights, askBusinessChat } from '../services/geminiService';
import { Sale, DailyArchive } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface AIInsightsProps {
  sales: Sale[];
  history: DailyArchive[];
  advancedAIEnabled: boolean;
  onToggleAdvancedAI: (enabled: boolean) => void;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ sales, history, advancedAIEnabled, onToggleAdvancedAI }) => {
  const [insight, setInsight] = useState<string | null>(() => {
    return localStorage.getItem('ai_last_insight');
  });
  const [loading, setLoading] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('ai_chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ai_chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (insight) {
      localStorage.setItem('ai_last_insight', insight);
    }
  }, [insight]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleGenerate = async () => {
    if (sales.length === 0) return;
    setLoading(true);
    const result = await getBusinessInsights(sales, advancedAIEnabled);
    setInsight(result);
    setLoading(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const aiResponse = await askBusinessChat(userMsg, { sales, history });
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', content: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', content: "Lo siento, tuve un problema al procesar tu duda. ¿Podrías repetirme la pregunta?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Selector IA Avanzada */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${advancedAIEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.631.285a2 2 0 01-1.558 0l-.63-.285a6 6 0 00-3.86-.517l-2.388.477a2 2 0 00-1.022.547V21h17.428v-5.572z" />
              </svg>
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">IA Avanzada</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asesor de Precios y Predicciones</p>
            </div>
          </div>
          <button 
            onClick={() => onToggleAdvancedAI(!advancedAIEnabled)}
            className={`w-14 h-8 rounded-full transition-all relative ${advancedAIEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${advancedAIEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <div className={`bg-gradient-to-br transition-all duration-500 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden ${advancedAIEnabled ? 'from-indigo-600 via-purple-600 to-indigo-700' : 'from-slate-700 to-slate-800'}`}>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                <div className="p-2 bg-white/20 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                Gemini AI {advancedAIEnabled ? 'PRO' : 'Lite'}
              </h2>
              <p className="text-white/70 text-sm font-bold mt-2">
                {advancedAIEnabled 
                  ? 'Análisis profundo de márgenes, predicción de masa y estrategia VIP.' 
                  : 'Consejos rápidos para mejorar tus ventas de hoy.'}
              </p>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={loading || sales.length === 0}
              className={`w-full sm:w-auto px-8 py-4 bg-white text-indigo-700 font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-widest`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {advancedAIEnabled ? 'Ejecutar Análisis Avanzado' : 'Obtener Consejos'}
                </>
              )}
            </button>
          </div>

          <div className="min-h-[200px]">
            {insight ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full prose prose-invert max-w-none prose-sm sm:prose-base font-bold text-white/90 leading-relaxed">
                <div className="whitespace-pre-wrap">{insight}</div>
              </div>
            ) : (
              <div className="text-center p-10 opacity-40">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-white/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="uppercase text-xs font-black tracking-[0.2em]">Cámara de Estrategia</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat con Asesor */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[500px] h-[600px] max-h-[70vh]">
        <div className="bg-slate-800 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-lg">Chat con el Asesor</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pregúntame sobre tus ventas o el programa</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if(confirm("¿Quieres borrar toda la conversación?")) {
                setMessages([]);
                localStorage.removeItem('ai_chat_messages');
              }
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            title="Borrar chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50">
          <AnimatePresence initial={false}>
            {messages.length === 0 && !isTyping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                  ¿Tienes dudas sobre tus ventas?<br/>¿O sobre cómo funciona el Excel?
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {['¿Cómo voy hoy?', '¿Cómo subo mi Excel?', 'Dime un consejo'].map(hint => (
                    <button 
                      key={hint}
                      onClick={() => { setInputMessage(hint); }}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-[24px] text-sm font-bold leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'}`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white p-4 rounded-[24px] rounded-bl-none border border-slate-200 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </AnimatePresence>
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input 
            type="text" 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-slate-50 border-none rounded-2xl px-6 font-bold text-sm focus:ring-2 focus:ring-indigo-100"
          />
          <button 
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 active:scale-90 transition-all disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
      
      {sales.length === 0 && (
        <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-[28px] flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-amber-800 font-bold text-xs uppercase leading-tight">Necesitas registrar al menos una venta para un análisis completo.</p>
        </div>
      )}
    </div>
  );
};
