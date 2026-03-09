import React from 'react';
import { ShoppingBag, Heart, Clock, Star } from 'lucide-react';

export default function CustomerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-stone-900">Olá, Cliente!</h1>
        <p className="text-stone-500">Acesse suas compras e gerencie seus favoritos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Minhas Compras', value: '5', icon: ShoppingBag, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Favoritos', value: '12', icon: Heart, color: 'bg-rose-50 text-rose-600' },
          { label: 'Horas de Estudo', value: '24h', icon: Clock, color: 'bg-amber-50 text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="text-2xl font-bold text-stone-900">{stat.value}</div>
            <div className="text-sm text-stone-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Meus Cursos</h2>
          <button className="text-sm text-indigo-600 font-medium hover:underline">Ver todos</button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((_, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-4">
                <div className="h-32 w-full sm:w-48 bg-stone-200 rounded-xl flex-shrink-0 overflow-hidden relative">
                  <img 
                    src={`https://picsum.photos/seed/course${i}/400/300`} 
                    alt="Course" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                    CONCLUÍDO {i * 25}%
                  </div>
                </div>
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-stone-900">Masterclass de Design UI/UX</h3>
                    <p className="text-sm text-stone-500 line-clamp-2">Domine as ferramentas e processos de design.</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                      Continuar Assistindo
                    </button>
                    <button className="p-2 rounded-xl border border-stone-200 text-stone-400 hover:text-rose-500 transition-colors">
                      <Heart className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
