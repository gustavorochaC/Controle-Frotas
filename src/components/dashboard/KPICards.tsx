import { Package, DollarSign, Wrench, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Entrega } from '@/types/entrega';

interface KPICardsProps {
  entregas: Entrega[];
}

export function KPICards({ entregas }: KPICardsProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const entregasDoMes = entregas.filter(e => {
    if (!e.data_saida) return false;
    const date = new Date(e.data_saida);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalEntregas = entregasDoMes.length;
  
  const custoTotalEntregas = entregasDoMes.reduce((acc, e) => 
    acc + (e.gastos_entrega || 0), 0
  );
  
  const custoTotalMontagem = entregasDoMes.reduce((acc, e) => 
    acc + (e.gastos_montagem || 0), 0
  );
  
  const percentualMedioGastos = entregasDoMes.length > 0
    ? entregasDoMes.reduce((acc, e) => acc + (e.percentual_gastos || 0), 0) / entregasDoMes.length
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const kpis = [
    {
      title: 'Entregas no Mês',
      value: totalEntregas.toString(),
      icon: Package,
      description: 'Total de entregas realizadas'
    },
    {
      title: 'Custo de Entregas',
      value: formatCurrency(custoTotalEntregas),
      icon: DollarSign,
      description: 'Gastos totais com transporte'
    },
    {
      title: 'Custo de Montagem',
      value: formatCurrency(custoTotalMontagem),
      icon: Wrench,
      description: 'Gastos totais com montagem'
    },
    {
      title: '% Médio de Gastos',
      value: `${percentualMedioGastos.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Percentual médio de gastos'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
