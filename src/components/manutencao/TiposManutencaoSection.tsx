import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Settings, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useVeiculos } from '@/hooks/useVeiculos';
import {
  useManutencaoPreventivConfig,
  useCreateManutencaoPreventivConfig,
  useUpdateManutencaoPreventivConfig,
  useDeleteManutencaoPreventivConfig,
} from '@/hooks/useManutencaoPreventiva';
import { SERVICOS_PREVENTIVOS_SUGESTOES, ManutencaoPreventivConfig } from '@/types/manutencao';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';

const formSchema = z.object({
  veiculo_id: z.string().min(1, 'Veículo é obrigatório'),
  nome_servico: z.string().min(1, 'Tipo de serviço é obrigatório'),
  intervalo_km: z.coerce.number().min(100, 'Intervalo deve ser no mínimo 100 km'),
  margem_alerta_km: z.coerce.number().min(100, 'Margem deve ser no mínimo 100 km'),
  km_ultima_manutencao: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ConfigFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: ManutencaoPreventivConfig;
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

function ConfigFormModal({ open, onOpenChange, config, onSubmit, isLoading }: ConfigFormModalProps) {
  const { data: veiculos = [] } = useVeiculos();
  const [customServico, setCustomServico] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      veiculo_id: config?.veiculo_id || '',
      nome_servico: config?.nome_servico || '',
      intervalo_km: config?.intervalo_km || 10000,
      margem_alerta_km: config?.margem_alerta_km || 1000,
      km_ultima_manutencao: config?.km_ultima_manutencao || 0,
    },
  });

  const veiculosAtivos = veiculos.filter((v) => v.ativo);

  const handleServicoChange = (value: string) => {
    if (value === '__custom__') {
      setCustomServico(true);
      form.setValue('nome_servico', '');
    } else {
      setCustomServico(false);
      form.setValue('nome_servico', value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {config ? 'Editar' : 'Novo'} Tipo de Manutenção Preventiva
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Veículo */}
            <FormField
              control={form.control}
              name="veiculo_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Veículo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!config}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {veiculosAtivos.map((veiculo) => (
                        <SelectItem key={veiculo.id} value={veiculo.id}>
                          {veiculo.modelo || veiculo.fabricante || 'Sem modelo'} - {veiculo.placa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Serviço */}
            <FormField
              control={form.control}
              name="nome_servico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Tipo de Serviço</FormLabel>
                  {!customServico ? (
                    <Select onValueChange={handleServicoChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue placeholder="Selecione o tipo de serviço" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICOS_PREVENTIVOS_SUGESTOES.map((servico) => (
                          <SelectItem key={servico} value={servico}>
                            {servico}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">+ Outro (personalizado)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input
                        placeholder="Digite o nome do serviço"
                        className="bg-background border-input"
                        {...field}
                      />
                    </FormControl>
                  )}
                  {customServico && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => setCustomServico(false)}
                    >
                      Voltar para lista
                    </Button>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Intervalo KM */}
            <FormField
              control={form.control}
              name="intervalo_km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Intervalo (KM)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="100"
                      placeholder="Ex: 10000"
                      className="bg-background border-input"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A cada quantos KM este serviço deve ser realizado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Margem de Alerta */}
            <FormField
              control={form.control}
              name="margem_alerta_km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Margem de Alerta (KM)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="100"
                      placeholder="Ex: 1000"
                      className="bg-background border-input"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Alertar quando faltar esta quantidade de KM para a próxima manutenção
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* KM Última Manutenção (apenas para novo) */}
            {!config && (
              <FormField
                control={form.control}
                name="km_ultima_manutencao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">KM da Última Manutenção (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Deixe vazio para usar KM atual do veículo"
                        className="bg-background border-input"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Se não informado, será usado o KM atual do veículo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Tipo estendido para configs com dados do veículo
type ConfigComVeiculo = ManutencaoPreventivConfig & {
  veiculo_modelo?: string;
  veiculo_km_atual?: number;
};

export function TiposManutencaoSection() {
  const { data: configs = [], isLoading } = useManutencaoPreventivConfig();
  const createConfig = useCreateManutencaoPreventivConfig();
  const updateConfig = useUpdateManutencaoPreventivConfig();
  const deleteConfig = useDeleteManutencaoPreventivConfig();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ConfigComVeiculo | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<ConfigComVeiculo | null>(null);

  const handleOpenForm = (config?: ConfigComVeiculo) => {
    setSelectedConfig(config || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedConfig(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (data: FormData) => {
    if (selectedConfig) {
      updateConfig.mutate(
        { id: selectedConfig.id, data },
        { onSuccess: handleCloseForm }
      );
    } else {
      // Garantir que os campos obrigatórios estão presentes
      const configData = {
        veiculo_id: data.veiculo_id,
        nome_servico: data.nome_servico,
        intervalo_km: data.intervalo_km,
        margem_alerta_km: data.margem_alerta_km,
        km_ultima_manutencao: data.km_ultima_manutencao,
      };
      createConfig.mutate(configData, { onSuccess: handleCloseForm });
    }
  };

  const handleOpenDelete = (config: ConfigComVeiculo) => {
    setConfigToDelete(config);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (configToDelete) {
      deleteConfig.mutate(configToDelete.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setConfigToDelete(null);
        },
      });
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getStatusBadge = (config: ConfigComVeiculo) => {
    // Se está aguardando a primeira manutenção, mostrar status neutro
    if (config.aguardando_primeira_manutencao) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Aguardando</Badge>;
    }
    
    const kmAtual = config.veiculo_km_atual || 0;
    const kmProxima = config.km_proxima_manutencao || 0;
    const kmRestante = kmProxima - kmAtual;

    if (kmRestante <= 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    } else if (kmRestante <= config.margem_alerta_km) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Próximo</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">OK</Badge>;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-foreground">Tipos de Manutenção</CardTitle>
        </div>
        <Button
          size="sm"
          onClick={() => handleOpenForm()}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Novo Tipo
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Carregando...</div>
        ) : configs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum tipo de manutenção preventiva configurado.</p>
            <p className="text-sm mt-2">
              Configure aqui os serviços preventivos (ex: Troca de Óleo a cada 10.000km)
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-muted-foreground font-semibold">Veículo</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Serviço</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-right">Intervalo</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-right">Última</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-right">Próxima</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-right">KM Atual</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-center">Status</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => {
                  const aguardando = config.aguardando_primeira_manutencao;
                  const kmAtual = config.veiculo_km_atual || 0;
                  const kmProxima = config.km_proxima_manutencao || 0;
                  const kmRestante = aguardando ? 0 : (kmProxima - kmAtual);

                  return (
                    <TableRow key={config.id} className="border-border hover:bg-muted/50">
                      <TableCell className="text-foreground font-medium">
                        {config.veiculo_placa}
                        {config.veiculo_modelo && (
                          <span className="text-muted-foreground text-sm ml-1">
                            ({config.veiculo_modelo})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground">{config.nome_servico}</TableCell>
                      <TableCell className="text-foreground text-right">
                        {formatNumber(config.intervalo_km)} km
                      </TableCell>
                      <TableCell className="text-foreground text-right">
                        {aguardando ? <span className="text-muted-foreground">—</span> : `${formatNumber(config.km_ultima_manutencao)} km`}
                      </TableCell>
                      <TableCell className="text-foreground text-right">
                        {aguardando ? <span className="text-muted-foreground">—</span> : `${formatNumber(kmProxima)} km`}
                      </TableCell>
                      <TableCell className="text-foreground text-right">
                        {aguardando ? <span className="text-muted-foreground">—</span> : `${formatNumber(kmAtual)} km`}
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {getStatusBadge(config)}
                            </TooltipTrigger>
                            <TooltipContent>
                              {aguardando ? (
                                <p>Aguardando 1ª manutenção ser registrada</p>
                              ) : kmRestante <= 0 ? (
                                <p>Vencido há {formatNumber(Math.abs(kmRestante))} km</p>
                              ) : (
                                <p>Faltam {formatNumber(kmRestante)} km</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(config)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(config)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ConfigFormModal
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        config={selectedConfig}
        onSubmit={handleSubmit}
        isLoading={createConfig.isPending || updateConfig.isPending}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        isLoading={deleteConfig.isPending}
        title="Remover Tipo de Manutenção"
        description="Tem certeza que deseja remover este tipo de manutenção? Esta ação não pode ser desfeita."
      />
    </Card>
  );
}
