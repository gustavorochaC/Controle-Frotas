import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ManutencaoPreventivConfig, 
  ManutencaoPreventivConfigFormData 
} from '@/types/manutencao';
import { useToast } from '@/hooks/use-toast';

// Tipo auxiliar para dados com relacionamentos
type ConfigComRelacionamentos = {
  id: string;
  veiculo_id: string;
  nome_servico: string;
  intervalo_km: number;
  margem_alerta_km: number;
  km_ultima_manutencao: number | null;
  km_proxima_manutencao: number | null;
  aguardando_primeira_manutencao: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  veiculo: { placa: string; modelo: string | null; km_atual: number } | null;
};

export function useManutencaoPreventivConfig() {
  return useQuery({
    queryKey: ['manutencoes_preventivas_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manutencoes_preventivas_config')
        .select(`
          *,
          veiculo:veiculo_id(placa, modelo, km_atual)
        `)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = data as unknown as ConfigComRelacionamentos[];
      return typedData.map((item) => ({
        ...item,
        veiculo_placa: item.veiculo?.placa || '',
        veiculo_modelo: item.veiculo?.modelo || '',
        veiculo_km_atual: item.veiculo?.km_atual || 0,
      })) as (ManutencaoPreventivConfig & { veiculo_modelo?: string; veiculo_km_atual?: number })[];
    },
  });
}

export function useCreateManutencaoPreventivConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: ManutencaoPreventivConfigFormData) => {
      // Verificar se foi informado KM da última manutenção
      const temHistorico = config.km_ultima_manutencao !== undefined && config.km_ultima_manutencao > 0;
      
      // Se tem histórico, calcular próxima manutenção; senão, aguarda primeira
      const kmUltimaManutencao = temHistorico ? config.km_ultima_manutencao : null;
      const kmProximaManutencao = temHistorico 
        ? (config.km_ultima_manutencao! + config.intervalo_km) 
        : null;

      const { data, error } = await supabase
        .from('manutencoes_preventivas_config')
        .insert([{
          veiculo_id: config.veiculo_id,
          nome_servico: config.nome_servico,
          intervalo_km: config.intervalo_km,
          margem_alerta_km: config.margem_alerta_km,
          km_ultima_manutencao: kmUltimaManutencao,
          km_proxima_manutencao: kmProximaManutencao,
          aguardando_primeira_manutencao: !temHistorico,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manutencoes_preventivas_config'] });
      queryClient.invalidateQueries({ queryKey: ['alertas_manutencao'] });
      toast({
        title: 'Sucesso',
        description: 'Tipo de manutenção preventiva criado com sucesso!',
      });
    },
    onError: (error: Error & { code?: string }) => {
      // Verificar se é erro de duplicata
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast({
          title: 'Erro',
          description: 'Este tipo de manutenção já existe para este veículo.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

export function useUpdateManutencaoPreventivConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ManutencaoPreventivConfigFormData> }) => {
      // Buscar config atual
      const { data: configAtual } = await supabase
        .from('manutencoes_preventivas_config')
        .select('km_ultima_manutencao, intervalo_km, aguardando_primeira_manutencao')
        .eq('id', id)
        .single();
      
      const updateData: Partial<ManutencaoPreventivConfigFormData> & {
        aguardando_primeira_manutencao?: boolean;
        km_proxima_manutencao?: number;
      } = { ...data };
      
      // Verificar se está informando km_ultima_manutencao pela primeira vez
      const novoKmUltima = data.km_ultima_manutencao;
      const intervaloAtual = data.intervalo_km || configAtual?.intervalo_km || 0;
      
      if (novoKmUltima !== undefined && novoKmUltima > 0) {
        // Se informou KM da última manutenção, sai do estado "aguardando"
        updateData.aguardando_primeira_manutencao = false;
        updateData.km_proxima_manutencao = novoKmUltima + intervaloAtual;
      } else if (data.intervalo_km && configAtual?.km_ultima_manutencao) {
        // Se só alterou o intervalo e já tem histórico, recalcular próxima
        updateData.km_proxima_manutencao = configAtual.km_ultima_manutencao + data.intervalo_km;
      }

      const { data: result, error } = await supabase
        .from('manutencoes_preventivas_config')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manutencoes_preventivas_config'] });
      queryClient.invalidateQueries({ queryKey: ['alertas_manutencao'] });
      toast({
        title: 'Sucesso',
        description: 'Configuração atualizada com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteManutencaoPreventivConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - apenas desativa
      const { error } = await supabase
        .from('manutencoes_preventivas_config')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manutencoes_preventivas_config'] });
      queryClient.invalidateQueries({ queryKey: ['alertas_manutencao'] });
      toast({
        title: 'Sucesso',
        description: 'Tipo de manutenção removido com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Função para registrar que uma manutenção preventiva foi realizada
export function useRegistrarManutencaoPreventiva() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      configId, 
      kmManutencao 
    }: { 
      configId: string; 
      kmManutencao: number;
    }) => {
      // Buscar config atual
      const { data: config } = await supabase
        .from('manutencoes_preventivas_config')
        .select('intervalo_km')
        .eq('id', configId)
        .single();

      if (!config) throw new Error('Configuração não encontrada');

      // Atualizar a configuração com novo KM
      const { error } = await supabase
        .from('manutencoes_preventivas_config')
        .update({
          km_ultima_manutencao: kmManutencao,
          km_proxima_manutencao: kmManutencao + config.intervalo_km,
        })
        .eq('id', configId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manutencoes_preventivas_config'] });
      queryClient.invalidateQueries({ queryKey: ['alertas_manutencao'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
