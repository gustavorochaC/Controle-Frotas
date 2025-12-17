import { useState, useMemo } from 'react';
import { Plus, Fuel, Gauge, Search, Printer, Filter, CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AbastecimentoTable } from '@/components/abastecimento/AbastecimentoTable';
import { AbastecimentoFormModal } from '@/components/abastecimento/AbastecimentoFormModal';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { TablePrintModal, TableColumn } from '@/components/shared/TablePrintModal';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  useAbastecimentos, 
  useCreateAbastecimento, 
  useUpdateAbastecimento, 
  useDeleteAbastecimento 
} from '@/hooks/useAbastecimentos';
import type { Abastecimento as AbastecimentoType, AbastecimentoFormData } from '@/types/abastecimento';

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

const AbastecimentoPage = () => {
  const { data: abastecimentos = [], isLoading } = useAbastecimentos();
  const createAbastecimento = useCreateAbastecimento();
  const updateAbastecimento = useUpdateAbastecimento();
  const deleteAbastecimento = useDeleteAbastecimento();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAbastecimento, setSelectedAbastecimento] = useState<AbastecimentoType | null>(null);
  const [searchPlaca, setSearchPlaca] = useState('');
  
  // Estados de filtro de data
  const currentDate = new Date();
  const [filterType, setFilterType] = useState<'month-year' | 'date-range' | 'none'>('none');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [abastecimentoToDelete, setAbastecimentoToDelete] = useState<AbastecimentoType | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleOpenForm = (abastecimento?: AbastecimentoType) => {
    setSelectedAbastecimento(abastecimento || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedAbastecimento(null);
  };

  const handleSubmit = (data: AbastecimentoFormData) => {
    if (selectedAbastecimento) {
      updateAbastecimento.mutate(
        { id: selectedAbastecimento.id, data },
        { onSuccess: handleCloseForm }
      );
    } else {
      createAbastecimento.mutate(data, { onSuccess: handleCloseForm });
    }
  };

  const handleOpenDeleteDialog = (abastecimento: AbastecimentoType) => {
    setAbastecimentoToDelete(abastecimento);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (abastecimentoToDelete) {
      deleteAbastecimento.mutate(abastecimentoToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setAbastecimentoToDelete(null);
        }
      });
    }
  };

  // Obter anos disponíveis baseado nas datas dos abastecimentos
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    abastecimentos.forEach(a => {
      if (a.data) {
        const year = new Date(a.data).getFullYear();
        years.add(year);
      }
    });
    const yearsArray = Array.from(years).sort((a, b) => b - a);
    return yearsArray.length > 0 ? yearsArray : [currentDate.getFullYear()];
  }, [abastecimentos, currentDate]);

  // Filtrar abastecimentos por placa e data
  const filteredAbastecimentos = useMemo(() => {
    let filtered = abastecimentos;

    // Filtro por placa
    if (searchPlaca.trim()) {
      filtered = filtered.filter(a => 
        a.veiculo_placa?.toLowerCase().includes(searchPlaca.toLowerCase())
      );
    }

    // Filtro por data
    if (filterType === 'month-year') {
      filtered = filtered.filter(a => {
        if (!a.data) return false;
        const date = new Date(a.data);
        return date.getMonth() === parseInt(selectedMonth) && 
               date.getFullYear() === parseInt(selectedYear);
      });
    } else if (filterType === 'date-range') {
      filtered = filtered.filter(a => {
        if (!a.data) return false;
        const date = new Date(a.data);
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (dateFrom && dateTo) {
          const fromOnly = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
          const toOnly = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
          return dateOnly >= fromOnly && dateOnly <= toOnly;
        } else if (dateFrom) {
          const fromOnly = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
          return dateOnly >= fromOnly;
        } else if (dateTo) {
          const toOnly = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
          return dateOnly <= toOnly;
        }
        return true;
      });
    }

    return filtered;
  }, [abastecimentos, searchPlaca, filterType, selectedMonth, selectedYear, dateFrom, dateTo]);

  // Calcular totais (usando dados filtrados)
  const totalLitros = filteredAbastecimentos.reduce((acc, a) => acc + (a.litros || 0), 0);
  const totalValor = filteredAbastecimentos.reduce((acc, a) => acc + (a.valor_total || 0), 0);
  
  // Calcular média de consumo (KM/L) - apenas registros com valor válido (usando dados filtrados)
  const abastecimentosComKmPorLitro = filteredAbastecimentos.filter(a => a.km_por_litro != null && a.km_por_litro > 0);
  const mediaConsumo = abastecimentosComKmPorLitro.length > 0
    ? abastecimentosComKmPorLitro.reduce((acc, a) => acc + (a.km_por_litro || 0), 0) / abastecimentosComKmPorLitro.length
    : 0;

  // Configuração de colunas para impressão
  const printColumns: TableColumn<AbastecimentoType>[] = useMemo(() => [
    { 
      key: 'data', 
      label: 'Data',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy') : '-'
    },
    { key: 'veiculo_placa', label: 'Veículo' },
    { key: 'condutor_nome', label: 'Condutor' },
    { key: 'posto', label: 'Posto/Manutenção' },
    { 
      key: 'cidade', 
      label: 'Cidade',
      render: (value, row) => row.cidade && row.estado ? `${row.cidade} - ${row.estado}` : '-'
    },
    { 
      key: 'km_inicial', 
      label: 'Km Inicial',
      render: (value) => value ? value.toLocaleString('pt-BR') : '0'
    },
    { 
      key: 'litros', 
      label: 'Litros',
      render: (value) => value ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0'
    },
    { 
      key: 'km_por_litro', 
      label: 'KM/L',
      render: (value) => value ? `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} km/l` : 'N/A'
    },
    { key: 'produto', label: 'Produto' },
    { 
      key: 'valor_unitario', 
      label: 'Valor Un.',
      render: (value) => value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
      className: 'text-right'
    },
    { 
      key: 'valor_total', 
      label: 'Valor Total',
      render: (value) => value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
      className: 'text-right font-semibold'
    },
  ], []);

  // Texto descritivo dos filtros aplicados
  const filtersText = useMemo(() => {
    const filters: string[] = [];
    
    if (searchPlaca.trim()) {
      filters.push(`Placa: "${searchPlaca}"`);
    }
    
    if (filterType === 'month-year') {
      const monthName = MESES.find(m => m.value === selectedMonth)?.label || '';
      filters.push(`Período: ${monthName}/${selectedYear}`);
    } else if (filterType === 'date-range') {
      if (dateFrom && dateTo) {
        filters.push(`Período: ${format(dateFrom, 'dd/MM/yyyy')} a ${format(dateTo, 'dd/MM/yyyy')}`);
      } else if (dateFrom) {
        filters.push(`A partir de: ${format(dateFrom, 'dd/MM/yyyy')}`);
      } else if (dateTo) {
        filters.push(`Até: ${format(dateTo, 'dd/MM/yyyy')}`);
      }
    }
    
    return filters.length > 0 ? filters.join(' | ') : 'Todos os registros';
  }, [searchPlaca, filterType, selectedMonth, selectedYear, dateFrom, dateTo]);

  // Função para limpar filtros de data
  const handleClearDateFilters = () => {
    setFilterType('none');
    setDateFrom(null);
    setDateTo(null);
    setSelectedMonth(currentDate.getMonth().toString());
    setSelectedYear(currentDate.getFullYear().toString());
  };

  return (
    <ModuleLayout>
      <div className="p-8 lg:p-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Controle de Abastecimento</h2>
            <p className="text-slate-500 mt-1">Controle de abastecimentos e consumo</p>
          </div>
          <Button onClick={() => handleOpenForm()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Abastecimento
          </Button>
        </div>

        <div className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Registros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{filteredAbastecimentos.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Litros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Média de Consumo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-500">
                  {mediaConsumo > 0 
                    ? `${mediaConsumo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km/l`
                    : 'N/A'}
                </p>
                {abastecimentosComKmPorLitro.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Baseado em {abastecimentosComKmPorLitro.length} registro(s)
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">
                  R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros de Data */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Filtros de Data</CardTitle>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={filterType} onValueChange={(value: 'month-year' | 'date-range' | 'none') => {
                    setFilterType(value);
                    if (value === 'none') {
                      handleClearDateFilters();
                    }
                  }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo de filtro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem filtro de data</SelectItem>
                      <SelectItem value="month-year">Filtro por Mês/Ano</SelectItem>
                      <SelectItem value="date-range">Filtro por Período</SelectItem>
                    </SelectContent>
                  </Select>

                  {filterType === 'month-year' && (
                    <>
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
                    </>
                  )}

                  {filterType === 'date-range' && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[180px] justify-start text-left font-normal",
                              !dateFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data inicial"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateFrom || undefined}
                            onSelect={(date) => {
                              setDateFrom(date || null);
                              if (date && dateTo && date > dateTo) {
                                setDateTo(null);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[180px] justify-start text-left font-normal",
                              !dateTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data final"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateTo || undefined}
                            onSelect={(date) => {
                              setDateTo(date || null);
                              if (date && dateFrom && date < dateFrom) {
                                setDateFrom(null);
                              }
                            }}
                            disabled={(date) => dateFrom ? date < dateFrom : false}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </>
                  )}

                  {(filterType !== 'none' || dateFrom || dateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearDateFilters}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Tabela */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50 mb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Registros</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por placa..."
                    value={searchPlaca}
                    onChange={(e) => setSearchPlaca(e.target.value)}
                    className="pl-9 bg-white"
                  />
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
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 pb-6">
                <AbastecimentoTable
                  abastecimentos={filteredAbastecimentos}
                  onEdit={handleOpenForm}
                  onDelete={handleOpenDeleteDialog}
                  isLoading={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <AbastecimentoFormModal
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          abastecimento={selectedAbastecimento}
          onSubmit={handleSubmit}
          isLoading={createAbastecimento.isPending || updateAbastecimento.isPending}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteAbastecimento.isPending}
          title="Excluir Abastecimento"
          description="Tem certeza que deseja excluir este abastecimento? Esta ação não pode ser desfeita."
        />

        <TablePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Relatório de Abastecimentos"
          subtitle="Listagem completa de abastecimentos"
          data={filteredAbastecimentos}
          columns={printColumns}
          filters={filtersText}
        />
      </div>
    </ModuleLayout>
  );
};

export default AbastecimentoPage;
