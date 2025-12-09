import { useState, useMemo } from 'react';
import { BarChart3, DollarSign, Wrench, ArrowUpDown, MapPin, Car, TrendingUp, Fuel, Package, Filter, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { ResumoGeralPrintModal } from '@/components/shared/ResumoGeralPrintModal';
import { useEntregas } from '@/hooks/useEntregas';
import { useAbastecimentos } from '@/hooks/useAbastecimentos';
import { useManutencoes } from '@/hooks/useManutencoes';

const MESES = [
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
];

const METRICAS_DISPONIVEIS = [
  { id: 'valor-expedido', label: 'Valor Expedido x Custo Manutenção' },
  { id: 'km-rodado', label: 'KM Rodado por Veículo' },
  { id: 'entregas-veiculo', label: 'Entregas por Veículo' },
  { id: 'entregas-uf', label: 'Entregas por UF' },
  { id: 'custo-abastecimento', label: 'Custo Abastecimento por Veículo' },
  { id: 'custo-manutencao', label: 'Custo Manutenção por Veículo' },
  { id: 'combustivel-estado', label: 'Combustível por Estado' },
  { id: 'controle-status', label: 'Controle de Status' },
];

const ResumoGeral = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [metricasSelecionadas, setMetricasSelecionadas] = useState<string[]>(
    METRICAS_DISPONIVEIS.map(m => m.id)
  );
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const { data: entregas = [] } = useEntregas();
  const { data: abastecimentos = [] } = useAbastecimentos();
  const { data: manutencoes = [] } = useManutencoes();

  // Filtrar dados pelo período selecionado
  const filteredEntregas = useMemo(() => {
    return entregas.filter(e => {
      if (!e.data_saida) return false;
      const date = new Date(e.data_saida);
      return date.getMonth() === parseInt(selectedMonth) && date.getFullYear() === parseInt(selectedYear);
    });
  }, [entregas, selectedMonth, selectedYear]);

  const filteredAbastecimentos = useMemo(() => {
    return abastecimentos.filter(a => {
      const date = new Date(a.data);
      return date.getMonth() === parseInt(selectedMonth) && date.getFullYear() === parseInt(selectedYear);
    });
  }, [abastecimentos, selectedMonth, selectedYear]);

  const filteredManutencoes = useMemo(() => {
    return manutencoes.filter(m => {
      const date = new Date(m.data);
      return date.getMonth() === parseInt(selectedMonth) && date.getFullYear() === parseInt(selectedYear);
    });
  }, [manutencoes, selectedMonth, selectedYear]);

  // Métricas calculadas
  const valorExpedidoMes = filteredEntregas.reduce((acc, e) => acc + (e.valor || 0), 0);
  const custoManutencaoGeralMes = filteredManutencoes.reduce((acc, m) => acc + (m.custo_total || 0), 0);
  const custoAbastecimentoGeralMes = filteredAbastecimentos.reduce((acc, a) => acc + (a.valor_total || 0), 0);
  const margemOperacional = valorExpedidoMes - custoManutencaoGeralMes - custoAbastecimentoGeralMes;

  // KM Rodado por Veículo (usando km_inicial dos abastecimentos)
  const kmRodadoPorVeiculo = useMemo(() => {
    const kmMap: Record<string, { placa: string; kmMin: number; kmMax: number }> = {};
    filteredAbastecimentos.forEach(a => {
      if (a.veiculo_id && a.km_inicial) {
        if (!kmMap[a.veiculo_id]) {
          kmMap[a.veiculo_id] = { placa: a.veiculo_placa || 'N/A', kmMin: a.km_inicial, kmMax: a.km_inicial };
        } else {
          kmMap[a.veiculo_id].kmMin = Math.min(kmMap[a.veiculo_id].kmMin, a.km_inicial);
          kmMap[a.veiculo_id].kmMax = Math.max(kmMap[a.veiculo_id].kmMax, a.km_inicial);
        }
      }
    });
    return Object.entries(kmMap).map(([id, data]) => ({
      id,
      placa: data.placa,
      kmRodado: data.kmMax - data.kmMin,
      kmInicial: data.kmMin,
      kmFinal: data.kmMax,
    })).filter(v => v.kmRodado > 0).sort((a, b) => b.kmRodado - a.kmRodado);
  }, [filteredAbastecimentos]);

  // Entregas por Veículo
  const entregasPorVeiculo = useMemo(() => {
    const entregaMap: Record<string, { carro: string; qtd: number; valor: number }> = {};
    filteredEntregas.forEach(e => {
      const carro = e.carro || 'Não informado';
      if (!entregaMap[carro]) {
        entregaMap[carro] = { carro, qtd: 0, valor: 0 };
      }
      entregaMap[carro].qtd += 1;
      entregaMap[carro].valor += e.valor || 0;
    });
    return Object.values(entregaMap).sort((a, b) => b.qtd - a.qtd);
  }, [filteredEntregas]);

  // Entregas por UF
  const entregasPorUF = useMemo(() => {
    const ufMap: Record<string, { uf: string; qtd: number; valor: number }> = {};
    filteredEntregas.forEach(e => {
      const uf = e.uf || 'N/A';
      if (!ufMap[uf]) {
        ufMap[uf] = { uf, qtd: 0, valor: 0 };
      }
      ufMap[uf].qtd += 1;
      ufMap[uf].valor += e.valor || 0;
    });
    return Object.values(ufMap).sort((a, b) => b.valor - a.valor);
  }, [filteredEntregas]);

  // Custo de Abastecimento por Veículo
  const custoAbastecimentoPorVeiculo = useMemo(() => {
    const custoMap: Record<string, { placa: string; custo: number; litros: number }> = {};
    filteredAbastecimentos.forEach(a => {
      if (!custoMap[a.veiculo_id]) {
        custoMap[a.veiculo_id] = { placa: a.veiculo_placa || 'N/A', custo: 0, litros: 0 };
      }
      custoMap[a.veiculo_id].custo += a.valor_total || 0;
      custoMap[a.veiculo_id].litros += a.litros || 0;
    });
    return Object.entries(custoMap).map(([id, data]) => ({ id, ...data }));
  }, [filteredAbastecimentos]);

  // Custo de Manutenção por Veículo
  const custoManutencaoPorVeiculo = useMemo(() => {
    const custoMap: Record<string, { placa: string; custo: number; qtd: number }> = {};
    filteredManutencoes.forEach(m => {
      if (!custoMap[m.veiculo_id]) {
        custoMap[m.veiculo_id] = { placa: m.veiculo_placa || 'N/A', custo: 0, qtd: 0 };
      }
      custoMap[m.veiculo_id].custo += m.custo_total || 0;
      custoMap[m.veiculo_id].qtd += 1;
    });
    return Object.entries(custoMap).map(([id, data]) => ({ id, ...data }));
  }, [filteredManutencoes]);

  // Combustível por Estado
  const custoCombustivelPorEstado = useMemo(() => {
    const estadoMap: Record<string, { estado: string; totalValor: number; totalLitros: number; qtd: number }> = {};
    filteredAbastecimentos.forEach(a => {
      const estado = a.estado || 'N/A';
      if (!estadoMap[estado]) {
        estadoMap[estado] = { estado, totalValor: 0, totalLitros: 0, qtd: 0 };
      }
      estadoMap[estado].totalValor += a.valor_unitario || 0;
      estadoMap[estado].totalLitros += a.litros || 0;
      estadoMap[estado].qtd += 1;
    });
    return Object.values(estadoMap).map(e => ({
      ...e,
      mediaPreco: e.qtd > 0 ? e.totalValor / e.qtd : 0,
    })).sort((a, b) => b.totalLitros - a.totalLitros);
  }, [filteredAbastecimentos]);

  // Controle de Status
  const statusCounts = useMemo(() => {
    const statusMap: Record<string, number> = {
      'PENDENTE': 0,
      'EM ROTA': 0,
      'CONCLUIDO': 0,
      'ENTREGUE': 0,
      'EM MONTAGEM': 0,
      'AGUARDANDO MONTAGEM': 0,
      'MONTAGEM PARCIAL': 0,
    };
    filteredEntregas.forEach(e => {
      const status = e.status || 'PENDENTE';
      if (statusMap[status] !== undefined) {
        statusMap[status] += 1;
      } else {
        statusMap[status] = 1;
      }
    });
    return statusMap;
  }, [filteredEntregas]);

  // Anos disponíveis
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentDate.getFullYear());
    years.add(currentDate.getFullYear() - 1);
    entregas.forEach(e => {
      if (e.data_saida) years.add(new Date(e.data_saida).getFullYear());
    });
    abastecimentos.forEach(a => {
      if (a.data) years.add(new Date(a.data).getFullYear());
    });
    manutencoes.forEach(m => {
      if (m.data) years.add(new Date(m.data).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [entregas, abastecimentos, manutencoes, currentDate]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDENTE': 'bg-yellow-500',
      'EM ROTA': 'bg-blue-500',
      'CONCLUIDO': 'bg-green-500',
      'ENTREGUE': 'bg-emerald-500',
      'EM MONTAGEM': 'bg-purple-500',
      'AGUARDANDO MONTAGEM': 'bg-orange-500',
      'MONTAGEM PARCIAL': 'bg-pink-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const toggleMetrica = (id: string) => {
    setMetricasSelecionadas(prev =>
      prev.includes(id)
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  const isMetricaVisivel = (id: string) => metricasSelecionadas.includes(id);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <ModuleLayout>
      <div className="p-8 lg:p-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resumo Geral</h1>
            <p className="text-slate-500 mt-1">Visualize métricas e relatórios consolidados</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsPrintModalOpen(true)}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </Button>
        </div>
        {/* Filtros */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Filtros</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map(mes => (
                      <SelectItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">Selecione as métricas que deseja visualizar:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {METRICAS_DISPONIVEIS.map(metrica => (
                  <div key={metrica.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={metrica.id}
                      checked={isMetricaVisivel(metrica.id)}
                      onCheckedChange={() => toggleMetrica(metrica.id)}
                    />
                    <Label htmlFor={metrica.id} className="text-sm cursor-pointer">
                      {metrica.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Principais - Valor Expedido x Custo */}
        {isMetricaVisivel('valor-expedido') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Valor Expedido</span>
                </div>
                <p className="text-3xl font-bold text-green-500">
                  R$ {formatNumber(valorExpedidoMes)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Custos (Manutenção + Abastecimento)</span>
                </div>
                <p className="text-3xl font-bold text-orange-500">
                  R$ {formatNumber(custoManutencaoGeralMes + custoAbastecimentoGeralMes)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpDown className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Margem Operacional</span>
                </div>
                <p className={`text-3xl font-bold ${margemOperacional >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                  R$ {formatNumber(margemOperacional)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KM Rodado por Veículo */}
        {isMetricaVisivel('km-rodado') && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-500" />
                KM Rodado por Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead className="text-right">KM Inicial</TableHead>
                      <TableHead className="text-right">KM Final</TableHead>
                      <TableHead className="text-right">KM Rodado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kmRodadoPorVeiculo.length > 0 ? (
                      kmRodadoPorVeiculo.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.placa}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.kmInicial)} km</TableCell>
                          <TableCell className="text-right">{formatNumber(item.kmFinal)} km</TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-blue-500">{formatNumber(item.kmRodado)} km</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhum dado de KM no período (necessário ao menos 2 abastecimentos por veículo)
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entregas por Veículo */}
        {isMetricaVisivel('entregas-veiculo') && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-500" />
                Entregas por Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead className="text-center">Qtd. Entregas</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entregasPorVeiculo.length > 0 ? (
                      entregasPorVeiculo.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.carro}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{item.qtd}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-green-500 font-semibold">
                            R$ {formatNumber(item.valor)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nenhuma entrega no período selecionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entregas por UF */}
        {isMetricaVisivel('entregas-uf') && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-500" />
                Entregas por UF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>UF</TableHead>
                      <TableHead className="text-center">Qtd. Entregas</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entregasPorUF.length > 0 ? (
                      entregasPorUF.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {item.uf}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{item.qtd}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-green-500 font-semibold">
                            R$ {formatNumber(item.valor)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nenhuma entrega no período selecionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custo Abastecimento por Veículo */}
        {isMetricaVisivel('custo-abastecimento') && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-orange-500" />
                Custo de Abastecimento por Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead className="text-center">Litros</TableHead>
                      <TableHead className="text-right">Custo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {custoAbastecimentoPorVeiculo.length > 0 ? (
                      custoAbastecimentoPorVeiculo.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.placa}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{formatNumber(item.litros)} L</Badge>
                          </TableCell>
                          <TableCell className="text-right text-orange-500 font-semibold">
                            R$ {formatNumber(item.custo)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nenhum abastecimento no período selecionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custo Manutenção por Veículo */}
        {isMetricaVisivel('custo-manutencao') && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-red-500" />
                Custo de Manutenção por Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead className="text-center">Qtd. Serviços</TableHead>
                      <TableHead className="text-right">Custo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {custoManutencaoPorVeiculo.length > 0 ? (
                      custoManutencaoPorVeiculo.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.placa}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{item.qtd}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-red-500 font-semibold">
                            R$ {formatNumber(item.custo)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nenhuma manutenção no período selecionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Combustível por Estado */}
        {isMetricaVisivel('combustivel-estado') && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Média de Combustível por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center">Abastecimentos</TableHead>
                      <TableHead className="text-center">Total Litros</TableHead>
                      <TableHead className="text-right">Média R$/L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {custoCombustivelPorEstado.length > 0 ? (
                      custoCombustivelPorEstado.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {item.estado}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{item.qtd}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {formatNumber(item.totalLitros)} L
                          </TableCell>
                          <TableCell className="text-right text-blue-500 font-semibold">
                            R$ {item.mediaPreco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhum abastecimento no período selecionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controle de Status */}
        {isMetricaVisivel('controle-status') && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Controle de Status - Pedidos do Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 border">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                    <span className="text-sm text-foreground">{status}</span>
                    <Badge variant="secondary" className="ml-2">{count}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Total de pedidos no período: <span className="font-semibold text-foreground">{filteredEntregas.length}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando nenhuma métrica selecionada */}
        {metricasSelecionadas.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                Selecione pelo menos uma métrica para visualizar os dados.
              </p>
            </CardContent>
          </Card>
        )}

        <ResumoGeralPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          metricasSelecionadas={metricasSelecionadas}
          valorExpedidoMes={valorExpedidoMes}
          custoManutencaoGeralMes={custoManutencaoGeralMes}
          custoAbastecimentoGeralMes={custoAbastecimentoGeralMes}
          margemOperacional={margemOperacional}
          kmRodadoPorVeiculo={kmRodadoPorVeiculo}
          entregasPorVeiculo={entregasPorVeiculo}
          entregasPorUF={entregasPorUF}
          custoAbastecimentoPorVeiculo={custoAbastecimentoPorVeiculo}
          custoManutencaoPorVeiculo={custoManutencaoPorVeiculo}
          custoCombustivelPorEstado={custoCombustivelPorEstado}
          statusCounts={statusCounts}
          totalEntregas={filteredEntregas.length}
        />
      </div>
    </ModuleLayout>
  );
};

export default ResumoGeral;
