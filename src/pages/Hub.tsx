import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Truck, 
  Fuel, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Calendar, 
  Settings, 
  Users, 
  Car, 
  Wrench, 
  UserCog, 
  AlertTriangle, 
  FileText, 
  Receipt, 
  HelpCircle,
  LayoutDashboard,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEntregas } from '@/hooks/useEntregas';
import { useAbastecimentos } from '@/hooks/useAbastecimentos';
import { useManutencoes } from '@/hooks/useManutencoes';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useMontadores } from '@/hooks/useMontadores';
import { useAcertosViagem } from '@/hooks/useAcertosViagem';
import { getStatusVencimento, getVencimentoToxicologico } from '@/types/motorista';

import { ModuleLayout } from '@/components/layout/ModuleLayout';

const Hub = () => {
  const { data: entregas = [] } = useEntregas();
  const { data: abastecimentos = [] } = useAbastecimentos();
  const { data: manutencoes = [] } = useManutencoes();
  const { data: motoristas = [] } = useMotoristas(true);
  const { data: veiculos = [] } = useVeiculos();
  const { data: montadores = [] } = useMontadores();
  const { data: acertosViagem = [] } = useAcertosViagem();

  // --- LÓGICA DE DADOS (MANTIDA INTEGRALMENTE) ---

  // Separar motoristas e condutores por função (apenas ativos)
  const motoristasAtivos = motoristas.filter(m => m.ativo && (m.funcao === 'Motorista' || !m.funcao));
  const condutoresAtivos = motoristas.filter(m => m.ativo && m.funcao === 'Condutor');

  // Calcular alertas de documentação
  const alertasDocumentacao = useMemo(() => {
    const ativos = motoristas.filter(m => m.ativo);
    let vencidos = 0;
    let proximos = 0;

    ativos.forEach(m => {
      const statusCNH = getStatusVencimento(m.data_vencimento_cnh);
      const vencTox = getVencimentoToxicologico(m.data_exame_toxicologico);
      const statusTox = getStatusVencimento(vencTox);

      if (statusCNH === 'vencido' || statusTox === 'vencido') {
        vencidos++;
      } else if (statusCNH === 'proximo' || statusTox === 'proximo') {
        proximos++;
      }
    });

    return { vencidos, proximos };
  }, [motoristas]);

  // KPIs de Entregas
  const entregasPendentes = entregas.filter(e => e.status === 'PENDENTE').length;
  const entregasEmRota = entregas.filter(e => e.status === 'EM ROTA').length;
  const entregasConcluidas = entregas.filter(e => e.status === 'CONCLUIDO').length;
  const valorTotalEntregas = entregas.reduce((acc, e) => acc + (e.valor || 0), 0);

  // KPIs de Abastecimento
  const totalAbastecimentos = abastecimentos.length;
  const totalLitros = abastecimentos.reduce((acc, a) => acc + (a.litros || 0), 0);
  const totalGastoAbastecimento = abastecimentos.reduce((acc, a) => acc + (a.valor_total || 0), 0);

  // KPIs de Manutenção
  const totalManutencoes = manutencoes.length;
  const totalGastoManutencao = manutencoes.reduce((acc, m) => acc + (m.custo_total || 0), 0);
  const veiculosComManutencao = new Set(manutencoes.map(m => m.veiculo_id)).size;

  // KPIs de Acerto de Viagem
  const totalAcertos = acertosViagem.length;
  const totalDespesasAcertos = acertosViagem.reduce((acc, a) => {
    const despesas = (a.despesa_combustivel || 0) + (a.despesa_veiculo || 0) + 
      (a.despesa_material_montagem || 0) + (a.despesa_ajudante || 0) + 
      (a.despesa_passagem_onibus || 0) + (a.despesa_cartao_telefonico || 0) + 
      (a.despesa_hotel || 0) + (a.despesa_alimentacao || 0) + 
      (a.despesa_lavanderia || 0) + (a.despesa_diaria_motorista || 0) + 
      (a.despesa_taxi_transporte || 0) + (a.despesa_diaria_montador || 0) + 
      (a.despesa_outros || 0);
    return acc + despesas;
  }, 0);
  const totalAdiantamentos = acertosViagem.reduce((acc, a) => acc + (a.valor_adiantamento || 0), 0);

  // KPIs para o card Resumo Geral (mês atual)
  const currentDate = new Date();
  const faturamentoMesAtual = useMemo(() => {
    return entregas.filter(e => {
      if (!e.data_saida) return false;
      const date = new Date(e.data_saida);
      return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
    }).reduce((acc, e) => acc + (e.valor || 0), 0);
  }, [entregas, currentDate]);

  const gastosTotaisMesAtual = useMemo(() => {
    const gastoAbastecimento = abastecimentos.filter(a => {
      const date = new Date(a.data);
      return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
    }).reduce((acc, a) => acc + (a.valor_total || 0), 0);

    const gastoManutencao = manutencoes.filter(m => {
      const date = new Date(m.data);
      return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
    }).reduce((acc, m) => acc + (m.custo_total || 0), 0);

    return gastoAbastecimento + gastoManutencao;
  }, [abastecimentos, manutencoes, currentDate]);

  // --- COMPONENTES VISUAIS ---

  const SidebarItem = ({ icon: Icon, label, to, active = false }: { icon: any, label: string, to: string, active?: boolean }) => (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        active 
          ? 'bg-primary text-primary-foreground shadow-md' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
      <span className="font-medium text-sm tracking-wide">{label}</span>
      {active && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
    </Link>
  );

  const StatCard = ({ title, value, icon: Icon, colorClass, subtext }: { title: string, value: string, icon: any, colorClass: string, subtext: string }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
        <p className={`text-xs font-medium mt-2 ${colorClass} bg-opacity-10 px-2 py-1 rounded-full inline-block`}>
          {subtext}
        </p>
      </div>
      <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('700', '100')} ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );

  const OperationalCard = ({ title, icon: Icon, linkTo, color, children }: { title: string, icon: any, linkTo: string, color: string, children: React.ReactNode }) => (
    <Link to={linkTo} className="group h-full">
      <Card className="h-full border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 group-hover:-translate-y-1">
        <CardHeader className="pb-4 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '50').replace('700', '50')}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-5">
            {children}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const StatusRow = ({ label, value, colorDot, icon: StatusIcon }: { label: string, value: number | string, colorDot: string, icon?: any }) => (
    <div className="flex items-center justify-between group/row">
      <div className="flex items-center gap-2.5">
        {StatusIcon ? (
          <StatusIcon className={`h-4 w-4 ${colorDot}`} />
        ) : (
          <div className={`h-2.5 w-2.5 rounded-full ${colorDot}`} />
        )}
        <span className="text-sm font-medium text-slate-600 group-hover/row:text-slate-900 transition-colors">{label}</span>
      </div>
      <span className="text-lg font-bold text-slate-800 tabular-nums">{value}</span>
    </div>
  );

  return (
    <ModuleLayout>
      <div className="p-8 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* HEADER DA DASHBOARD */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Visão Geral da Frota</h2>
              <p className="text-slate-500 mt-1">Acompanhe indicadores financeiros e operacionais em tempo real.</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* 2. HIERARQUIA: STAT CARDS FINANCEIROS (TOPO) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Faturamento (Mês)" 
              value={`R$ ${faturamentoMesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
              icon={DollarSign} 
              colorClass="text-emerald-600"
              subtext="Receita de Entregas"
            />
            <StatCard 
              title="Gastos Totais (Mês)" 
              value={`R$ ${gastosTotaisMesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
              icon={TrendingUp} 
              colorClass="text-rose-600"
              subtext="Abast. + Manutenção"
            />
            <StatCard 
              title="Total de Entregas" 
              value={entregas.length.toString()} 
              icon={Package} 
              colorClass="text-blue-600"
              subtext="Histórico Completo"
            />
            <StatCard 
              title="Total Manutenções" 
              value={totalManutencoes.toString()} 
              icon={Wrench} 
              colorClass="text-amber-600"
              subtext="Histórico Completo"
            />
          </div>

          {/* 3. GRID OPERACIONAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            
            {/* CARD ENTREGAS */}
            <OperationalCard title="Controle de Entregas" icon={Truck} linkTo="/entregas" color="text-blue-600">
              <StatusRow label="Pendentes" value={entregasPendentes} colorDot="text-amber-500" icon={AlertTriangle} />
              <StatusRow label="Em Rota" value={entregasEmRota} colorDot="text-blue-500" icon={Truck} />
              <StatusRow label="Concluídas" value={entregasConcluidas} colorDot="text-emerald-500" icon={CheckCircleIcon} />
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-sm font-semibold text-slate-700">R$ {valorTotalEntregas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </OperationalCard>

            {/* CARD ABASTECIMENTO */}
            <OperationalCard title="Abastecimento" icon={Fuel} linkTo="/abastecimento" color="text-amber-600">
              <StatusRow label="Registros Totais" value={totalAbastecimentos} colorDot="bg-slate-300" icon={null} />
              <StatusRow label="Litros Totais" value={totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} colorDot="bg-slate-300" icon={null} />
              <StatusRow label="Diesel S-10" value={abastecimentos.filter(a => a.produto === 'Diesel S-10').length} colorDot="bg-emerald-500" icon={null} />
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Custo Total</span>
                <span className="text-sm font-semibold text-slate-700">R$ {totalGastoAbastecimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </OperationalCard>

            {/* CARD MANUTENÇÃO */}
            <OperationalCard title="Manutenção" icon={Wrench} linkTo="/manutencao" color="text-rose-600">
              <StatusRow label="Ordens de Serviço" value={totalManutencoes} colorDot="bg-slate-300" icon={null} />
              <StatusRow label="Veículos Atendidos" value={veiculosComManutencao} colorDot="bg-slate-300" icon={null} />
              <StatusRow label="Neste Mês" value={manutencoes.filter(m => { const date = new Date(m.data); const now = new Date(); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).length} colorDot="bg-blue-500" icon={null} />
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Custo Total</span>
                <span className="text-sm font-semibold text-slate-700">R$ {totalGastoManutencao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </OperationalCard>

            {/* CARD ACERTO VIAGEM */}
            <OperationalCard title="Acerto de Viagem" icon={Receipt} linkTo="/acerto-viagem" color="text-cyan-600">
              <StatusRow label="Acertos Totais" value={totalAcertos} colorDot="bg-slate-300" icon={null} />
              <StatusRow label="Pendentes" value={acertosViagem.filter(a => a.status === 'PENDENTE').length} colorDot="text-amber-500" icon={AlertTriangle} />
              <StatusRow label="Finalizados" value={acertosViagem.filter(a => a.status === 'ACERTADO').length} colorDot="text-emerald-500" icon={CheckCircleIcon} />
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Adiantamentos</span>
                <span className="text-sm font-semibold text-slate-700">R$ {totalAdiantamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </OperationalCard>

            {/* CARD CADASTROS */}
            <OperationalCard title="Cadastros & Alertas" icon={Settings} linkTo="/cadastros" color="text-violet-600">
              <StatusRow label="Motoristas Ativos" value={motoristasAtivos.length} colorDot="bg-slate-300" icon={null} />
              <StatusRow label="Veículos na Frota" value={veiculos.length} colorDot="bg-slate-300" icon={null} />
              
              <div className="pt-3 pb-1">
                {(alertasDocumentacao.vencidos > 0 || alertasDocumentacao.proximos > 0) ? (
                  <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-100 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <div className="text-xs">
                      <span className="font-bold text-rose-600 block">{alertasDocumentacao.vencidos} docs vencidos</span>
                      <span className="text-rose-500">{alertasDocumentacao.proximos} a vencer</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600">Documentação em dia</span>
                  </div>
                )}
              </div>
              
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Registros</span>
                <span className="text-sm font-semibold text-slate-700">{motoristasAtivos.length + condutoresAtivos.length + veiculos.length + montadores.length}</span>
              </div>
            </OperationalCard>

          </div>
        </div>
      </div>
    </ModuleLayout>
  );
};

// Ícone auxiliar para check
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

export default Hub;
