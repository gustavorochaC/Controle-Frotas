import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Manutencao, ManutencaoFormData } from '@/types/manutencao';
import { useToast } from '@/hooks/use-toast';

// Tipo auxiliar para dados com relacionamentos
type ManutencaoComRelacionamentos = {
  id: string;
  data: string;
  veiculo_id: string;
  estabelecimento: string;
  tipo_servico: string;
  descricao_servico: string | null;
  custo_total: number;
  km_manutencao: number;
  nota_fiscal: string | null;
  tipo_manutencao: string;
  status: string;
  problema_detectado: string | null;
  created_at: string;
  updated_at: string;
  veiculo: { placa: string } | null;
};

export function useManutencoes() {
  return useQuery({
    queryKey: ['manutencoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manutencoes')
        .select(`
          *,
          veiculo:veiculo_id(placa)
        `)
        .order('data', { ascending: false });

      if (error) throw error;

      const typedData = data as unknown as ManutencaoComRelacionamentos[];
      return typedData.map((item) => ({
        ...item,
        veiculo_placa: item.veiculo?.placa || '',
        // Garantir valores padrão para campos novos
        tipo_manutencao: item.tipo_manutencao || 'corretiva',
        status: item.status || 'resolvida',
      })) as Manutencao[];
    },
  });
}

export function useCreateManutencao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (manutencao: ManutencaoFormData) => {
      const { data, error } = await supabase
        .from('manutencoes')
        .insert([manutencao])
        .select()
        .single();

      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      toast({
        title: 'Sucesso',
        description: 'Manutenção registrada com sucesso!',
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

export function useUpdateManutencao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ManutencaoFormData }) => {
      const { data: result, error } = await supabase
        .from('manutencoes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      toast({
        title: 'Sucesso',
        description: 'Manutenção atualizada com sucesso!',
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

export function useDeleteManutencao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('manutencoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] });
      toast({
        title: 'Sucesso',
        description: 'Manutenção excluída com sucesso!',
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
