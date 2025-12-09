import { Link, useLocation } from 'react-router-dom';
import { 
  Truck, 
  Fuel, 
  Wrench, 
  TrendingUp, 
  Receipt, 
  Settings, 
  HelpCircle, 
  LogOut,
  LayoutDashboard,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  module?: string; // Mantido para compatibilidade, mas não usado para renderização condicional pesada
}

export function AppSidebar({ module }: AppSidebarProps) {
  const location = useLocation();

  const SidebarItem = ({ icon: Icon, label, to }: { icon: any, label: string, to: string }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive 
            ? 'bg-primary text-primary-foreground shadow-md' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
        <span className="font-medium text-sm tracking-wide">{label}</span>
        {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-xl z-20 h-screen">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">SCV</h1>
        </div>
        <p className="text-xs text-slate-400 pl-11">Controle de Veículos</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 mt-2">Principal</p>
        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
        <SidebarItem icon={Truck} label="Entregas" to="/entregas" />
        <SidebarItem icon={Fuel} label="Abastecimento" to="/abastecimento" />
        <SidebarItem icon={Wrench} label="Manutenção" to="/manutencao" />
        <SidebarItem icon={Receipt} label="Acerto de Viagem" to="/acerto-viagem" />
        
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 mt-6">Administração</p>
        <SidebarItem icon={Settings} label="Cadastros" to="/cadastros" />
        <SidebarItem icon={TrendingUp} label="Relatórios" to="/resumo-geral" />
        
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 mt-6">Suporte</p>
        <SidebarItem icon={HelpCircle} label="Ajuda" to="/ajuda" />
      </nav>

      <div className="p-4 border-t border-white/10">
        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5 gap-3">
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
