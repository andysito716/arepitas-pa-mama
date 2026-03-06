
import React, { useState } from 'react';
import { Booking } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingsViewProps {
  bookings: Booking[];
  onAddBooking: (data: Omit<Booking, 'id' | 'business_id'>) => void;
  onDeleteBooking: (id: string) => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({ bookings, onAddBooking, onDeleteBooking }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: '',
    buyerName: '',
    quantity: 1,
    reference: 'blanco' as 'blanco' | 'amarillo',
    isDistributor: false,
    cashPayment: 0,
    transferPayment: 0,
    location: '',
    cityNeighborhood: '',
    deliveryFee: 0,
    noDeliveryFee: false,
    isHalfDeliveryPaid: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBooking({
      ...formData,
      deliveryFee: formData.noDeliveryFee ? null : formData.deliveryFee
    });
    setIsFormOpen(false);
    setFormData({
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryTime: '',
      buyerName: '',
      quantity: 1,
      reference: 'blanco',
      isDistributor: false,
      cashPayment: 0,
      transferPayment: 0,
      location: '',
      cityNeighborhood: '',
      deliveryFee: 0,
      noDeliveryFee: false,
      isHalfDeliveryPaid: false
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Agendación</h2>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all"
        >
          + Nueva Agenda
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white p-6 rounded-[32px] border-2 border-blue-100 shadow-xl space-y-4"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Fecha de Pedido (Hoy)</label>
                <input 
                  type="date" 
                  required
                  value={formData.orderDate}
                  onChange={e => setFormData({...formData, orderDate: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 text-slate-400 rounded-xl font-bold outline-none border border-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-600 uppercase ml-2">Fecha de Entrega</label>
                  <input 
                    type="date" 
                    required
                    value={formData.deliveryDate}
                    onChange={e => setFormData({...formData, deliveryDate: e.target.value})}
                    className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-xl font-bold outline-none border border-blue-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-600 uppercase ml-2">Hora de Entrega</label>
                  <input 
                    type="time" 
                    required
                    value={formData.deliveryTime}
                    onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
                    className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-xl font-bold outline-none border border-blue-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre y Apellido</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Juan Pérez"
                  value={formData.buyerName}
                  onChange={e => setFormData({...formData, buyerName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Cantidad</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Referencia</label>
                  <select 
                    value={formData.reference}
                    onChange={e => setFormData({...formData, reference: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="blanco">Blanco</option>
                    <option value="amarillo">Amarillo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Tipo de Cliente</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isDistributor: false})}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!formData.isDistributor ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                  >
                    Comprador
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isDistributor: true})}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${formData.isDistributor ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                  >
                    Distribuidor
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Pago Efectivo $</label>
                  <input 
                    type="number" 
                    value={formData.cashPayment}
                    onChange={e => setFormData({...formData, cashPayment: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 bg-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Pago Transferencia $</label>
                  <input 
                    type="number" 
                    value={formData.transferPayment}
                    onChange={e => setFormData({...formData, transferPayment: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 bg-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Ubicación (Dirección)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Calle 123 #45-67"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Ciudad y Barrio</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Medellín, El Poblado"
                  value={formData.cityNeighborhood}
                  onChange={e => setFormData({...formData, cityNeighborhood: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Domicilio</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.noDeliveryFee}
                      onChange={e => setFormData({...formData, noDeliveryFee: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sin Domicilio</span>
                  </label>
                </div>
                
                {!formData.noDeliveryFee && (
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Valor Domicilio $</label>
                      <input 
                        type="number" 
                        value={formData.deliveryFee}
                        onChange={e => setFormData({...formData, deliveryFee: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-white rounded-xl font-bold outline-none border border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">¿50% Pagado?</label>
                      <select 
                        value={formData.isHalfDeliveryPaid ? 'si' : 'no'}
                        onChange={e => setFormData({...formData, isHalfDeliveryPaid: e.target.value === 'si'})}
                        className="w-full px-4 py-2 bg-white rounded-xl font-bold outline-none border border-slate-200"
                      >
                        <option value="no">No</option>
                        <option value="si">Sí</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-100"
                >
                  Agendar Pedido
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[40px] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-400 font-bold">No hay pedidos agendados.</p>
          </div>
        ) : (
          bookings.map(booking => (
            <motion.div 
              key={booking.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4 relative group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded-full">
                      Entrega: {booking.deliveryDate} - {booking.deliveryTime}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black uppercase rounded-full">
                      Pedido: {booking.orderDate}
                    </span>
                    {booking.isDistributor && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-full">
                        Distribuidor
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-800">{booking.buyerName}</h3>
                </div>
                <button 
                  onClick={() => onDeleteBooking(booking.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Pedido</p>
                  <p className="text-sm font-bold text-slate-700">
                    {booking.quantity} Unidades - <span className="capitalize">{booking.reference}</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Pagos</p>
                  <div className="text-xs font-bold text-slate-600">
                    {booking.cashPayment > 0 && <div>Efectivo: ${booking.cashPayment.toLocaleString()}</div>}
                    {booking.transferPayment > 0 && <div>Transf: ${booking.transferPayment.toLocaleString()}</div>}
                    {booking.cashPayment === 0 && booking.transferPayment === 0 && <div className="text-slate-300 italic">Pendiente</div>}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase">Ubicación</p>
                <p className="text-xs font-bold text-slate-600">{booking.location}</p>
                <p className="text-[10px] font-medium text-slate-400">{booking.cityNeighborhood}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${booking.deliveryFee === null ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] font-black text-slate-500 uppercase">
                    {booking.deliveryFee === null ? 'Sin Domicilio' : `Domicilio: $${booking.deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                {booking.deliveryFee !== null && (
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${booking.isHalfDeliveryPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {booking.isHalfDeliveryPaid ? '50% Pagado' : '50% Pendiente'}
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
