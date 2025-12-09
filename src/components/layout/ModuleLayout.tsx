import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

// Tipos dos módulos disponíveis - Mantidos para compatibilidade, mas não estritamente necessários para a sidebar
type ModuleType = 'entregas' | 'abastecimento' | 'manutencao' | 'resumo-geral' | 'acerto-viagem';

interface ModuleLayoutProps {
  children: ReactNode;
  module?: ModuleType; // Tornado opcional
}

export function ModuleLayout({ children, module }: ModuleLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <AppSidebar module={module} />
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
