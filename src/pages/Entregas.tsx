import { useState, useMemo } from 'react';
import { Plus, Truck, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KPICards } from '@/components/dashboard/KPICards';
import { EntregaFilters } from '@/components/dashboard/EntregaFilters';
import { EntregaTable } from '@/components/dashboard/EntregaTable';
import { EntregaFormModal } from '@/components/dashboard/EntregaFormModal';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { TablePrintModal, TableColumn } from '@/components/shared/TablePrintModal';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useEntregas, useCreateEntrega, useUpdateEntrega, useDeleteEntrega } from '@/hooks/useEntregas';
import { Entrega, EntregaFormData } from '@/types/entrega';
import { format } from 'date-fns';

const Entregas = () => {
  const { data: entregas = [], isLoading } = useEntregas();
  const createEntrega = useCreateEntrega();
  const updateEntrega = useUpdateEntrega();
  const deleteEntrega = useDeleteEntrega();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [motoristaFilter, setMotoristaFilter] = useState('all');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entregaToDelete, setEntregaToDelete] = useState<Entrega | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const motoristas = useMemo(() => {
    const uniqueMotoristas = new Set(
      entregas
        .map(e => e.motorista)
        .filter((m): m is string => m !== null && m !== '')
    );
    return Array.from(uniqueMotoristas).sort();
  }, [entregas]);

  const filteredEntregas = useMemo(() => {
    return entregas.filter(entrega => {
      const matchesSearch = 
        searchTerm === '' ||
        entrega.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entrega.nf?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        entrega.status === statusFilter;
      
      const matchesMotorista = 
        motoristaFilter === 'all' || 
        entrega.motorista === motoristaFilter;

      return matchesSearch && matchesStatus && matchesMotorista;
    });
  }, [entregas, searchTerm, statusFilter, motoristaFilter]);

  // Configuração de colunas para impressão
  const printColumns: TableColumn<Entrega>[] = useMemo(() => [
    { key: 'nf', label: 'NF' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'uf', label: 'UF' },
    { 
      key: 'data_saida', 
      label: 'Data Saída',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy') : '-'
    },
    { key: 'motorista', label: 'Motorista' },
    { key: 'tipo_transporte', label: 'Tipo' },
    { 
      key: 'valor', 
      label: 'Valor',
      render: (value) => value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
      className: 'text-right'
    },
    { key: 'status', label: 'Status' },
  ], []);

  // Texto descritivo dos filtros aplicados
  const filtersText = useMemo(() => {
    const filters: string[] = [];
    if (searchTerm) filters.push(`Busca: "${searchTerm}"`);
    if (statusFilter !== 'all') filters.push(`Status: ${statusFilter}`);
    if (motoristaFilter !== 'all') filters.push(`Motorista: ${motoristaFilter}`);
    return filters.length > 0 ? filters.join(' | ') : 'Todos os registros';
  }, [searchTerm, statusFilter, motoristaFilter]);

  const handleOpenForm = (entrega?: Entrega) => {
    setSelectedEntrega(entrega || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEntrega(null);
  };

  const handleSubmit = (data: Partial<EntregaFormData> & { montadores?: string; montador_1?: string; montador_2?: string; data_saida?: Date; data_montagem?: Date }) => {
    // Remover o campo 'montadores' pois o banco usa montador_1 e montador_2
    const { montadores, ...restData } = data;
    
    const formattedData = {
      ...restData,
      data_saida: data.data_saida ? format(data.data_saida, 'yyyy-MM-dd') : null,
      data_montagem: data.data_montagem ? format(data.data_montagem, 'yyyy-MM-dd') : null,
      percentual_gastos: data.valor && data.gastos_entrega 
        ? ((data.gastos_entrega / data.valor) * 100)
        : 0,
    };

    if (selectedEntrega) {
      updateEntrega.mutate(
        { id: selectedEntrega.id, data: formattedData },
        { onSuccess: handleCloseForm }
      );
    } else {
      createEntrega.mutate(formattedData, { onSuccess: handleCloseForm });
    }
  };

  const handleOpenDeleteDialog = (entrega: Entrega) => {
    setEntregaToDelete(entrega);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (entregaToDelete) {
      deleteEntrega.mutate(entregaToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setEntregaToDelete(null);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <ModuleLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout>
      <div className="p-8 lg:p-10 space-y-8">
        {/* HEADER DA PÁGINA PADRONIZADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Controle de Entregas</h2>
            <p className="text-slate-500 mt-1">Gerenciamento de rotas e entregas</p>
          </div>
          <Button onClick={() => handleOpenForm()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Entrega
          </Button>
        </div>

        <div className="space-y-6">
          <KPICards entregas={entregas} />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <EntregaFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                motoristaFilter={motoristaFilter}
                onMotoristaChange={setMotoristaFilter}
                motoristas={motoristas}
              />
              <Button 
                variant="outline" 
                onClick={() => setIsPrintModalOpen(true)}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir / PDF
              </Button>
            </div>
            
            <EntregaTable
              entregas={filteredEntregas}
              onEdit={handleOpenForm}
              onDelete={handleOpenDeleteDialog}
            />
          </div>
        </div>

        <EntregaFormModal
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          entrega={selectedEntrega}
          onSubmit={handleSubmit}
          isLoading={createEntrega.isPending || updateEntrega.isPending}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteEntrega.isPending}
          clienteName={entregaToDelete?.cliente || ''}
        />

        <TablePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Relatório de Entregas"
          subtitle="Listagem completa de entregas"
          data={filteredEntregas}
          columns={printColumns}
          filters={filtersText}
        />
      </div>
    </ModuleLayout>
  );
};

export default Entregas;
