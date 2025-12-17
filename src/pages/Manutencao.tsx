import { useState, useMemo } from 'react';
import { Plus, Wrench, DollarSign, Car, Calendar, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ManutencaoTable } from '@/components/manutencao/ManutencaoTable';
import { ManutencaoFormModal } from '@/components/manutencao/ManutencaoFormModal';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { TablePrintModal, TableColumn } from '@/components/shared/TablePrintModal';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { format } from 'date-fns';
import {
  useManutencoes,
  useCreateManutencao,
  useUpdateManutencao,
  useDeleteManutencao,
} from '@/hooks/useManutencoes';
import type { Manutencao as ManutencaoType, ManutencaoFormData, TipoManutencao } from '@/types/manutencao';

const Manutencao = () => {
  const { data: manutencoes = [], isLoading } = useManutencoes();
  const createManutencao = useCreateManutencao();
  const updateManutencao = useUpdateManutencao();
  const deleteManutencao = useDeleteManutencao();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedManutencao, setSelectedManutencao] = useState<ManutencaoType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [manutencaoToDelete, setManutencaoToDelete] = useState<ManutencaoType | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // Valores padrão para o formulário
  const [defaultFormValues, setDefaultFormValues] = useState<{
    tipo?: TipoManutencao;
    veiculoId?: string;
    tipoServico?: string;
  }>({});

  const handleOpenForm = (manutencao?: ManutencaoType) => {
    setSelectedManutencao(manutencao || null);
    setDefaultFormValues({});
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedManutencao(null);
    setDefaultFormValues({});
    setIsFormOpen(false);
  };


  const handleSubmit = (data: ManutencaoFormData) => {
    if (selectedManutencao) {
      updateManutencao.mutate(
        { id: selectedManutencao.id, data },
        { onSuccess: handleCloseForm }
      );
    } else {
      createManutencao.mutate(data, { onSuccess: handleCloseForm });
    }
  };

  const handleOpenDeleteDialog = (manutencao: ManutencaoType) => {
    setManutencaoToDelete(manutencao);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (manutencaoToDelete) {
      deleteManutencao.mutate(manutencaoToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setManutencaoToDelete(null);
        },
      });
    }
  };

  // Cálculos para os cards de resumo
  const totalManutencoes = manutencoes.length;
  const custoTotalGeral = manutencoes.reduce((acc, m) => acc + (m.custo_total || 0), 0);
  
  // Manutenções do mês atual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const manutencoesMes = manutencoes.filter((m) => {
    const date = new Date(m.data);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const custoMes = manutencoesMes.reduce((acc, m) => acc + (m.custo_total || 0), 0);

  // Veículos únicos com manutenção
  const veiculosUnicos = new Set(manutencoes.map((m) => m.veiculo_id)).size;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Configuração de colunas para impressão
  const printColumns: TableColumn<ManutencaoType>[] = useMemo(() => [
    { 
      key: 'data', 
      label: 'Data',
      render: (value) => value ? format(new Date(value + 'T00:00:00'), 'dd/MM/yyyy') : '-'
    },
    { key: 'veiculo_placa', label: 'Veículo' },
    { 
      key: 'tipo_manutencao', 
      label: 'Tipo',
      render: (value) => value === 'preventiva' ? 'Preventiva' : 'Corretiva'
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => {
        switch (value) {
          case 'pendente': return 'Pendente';
          case 'em_andamento': return 'Em Andamento';
          case 'resolvida': return 'Resolvida';
          default: return String(value);
        }
      }
    },
    { key: 'tipo_servico', label: 'Serviço' },
    { key: 'estabelecimento', label: 'Estabelecimento' },
    { 
      key: 'custo_total', 
      label: 'Custo',
      render: (value) => formatCurrency(value || 0),
      className: 'text-right font-medium'
    },
    { 
      key: 'km_manutencao', 
      label: 'KM',
      render: (value) => value ? `${value.toLocaleString('pt-BR')} km` : '0 km',
      className: 'text-right'
    },
  ], []);

  return (
    <ModuleLayout>
      <div className="p-8 lg:p-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Controle de Manutenção</h2>
            <p className="text-slate-500 mt-1">Gerenciamento de manutenções da frota</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <Wrench className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Manutenções</p>
                    <p className="text-2xl font-bold text-foreground">{totalManutencoes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Custo Total</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(custoTotalGeral)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <Calendar className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Custo do Mês</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(custoMes)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Car className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Veículos Atendidos</p>
                    <p className="text-2xl font-bold text-foreground">{veiculosUnicos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de manutenções */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50 mb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Registros</CardTitle>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / PDF
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleOpenForm()}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  Nova Manutenção
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 pb-6">
                <ManutencaoTable
                  manutencoes={manutencoes}
                  onEdit={handleOpenForm}
                  onDelete={handleOpenDeleteDialog}
                  isLoading={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal de formulário */}
        <ManutencaoFormModal
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          manutencao={selectedManutencao}
          onSubmit={handleSubmit}
          isLoading={createManutencao.isPending || updateManutencao.isPending}
          defaultTipo={defaultFormValues.tipo}
          defaultVeiculoId={defaultFormValues.veiculoId}
          defaultTipoServico={defaultFormValues.tipoServico}
        />

        {/* Dialog de confirmação de exclusão */}
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteManutencao.isPending}
          title="Excluir Manutenção"
          description="Tem certeza que deseja excluir este registro de manutenção? Esta ação não pode ser desfeita."
        />

        <TablePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Relatório de Manutenções"
          subtitle="Listagem completa de manutenções"
          data={manutencoes}
          columns={printColumns}
        />
      </div>
    </ModuleLayout>
  );
};

export default Manutencao;
