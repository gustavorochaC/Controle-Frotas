import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Veiculo, VeiculoFormData } from '@/types/veiculo';
import { toast } from '@/hooks/use-toast';

export function useVeiculos(includeInactive = false) {
  return useQuery({
    queryKey: ['veiculos', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('veiculos')
        .select('*')
        .order('placa', { ascending: true });
      
      if (!includeInactive) {
        query = query.eq('ativo', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Veiculo[];
    }
  });
}

export function useCreateVeiculo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (veiculo: VeiculoFormData) => {
      const { data, error } = await supabase
        .from('veiculos')
        .insert([veiculo])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast({
        title: 'Sucesso!',
        description: 'Veículo cadastrado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar veículo.',
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateVeiculo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VeiculoFormData> }) => {
      const { data: updatedData, error } = await supabase
        .from('veiculos')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast({
        title: 'Sucesso!',
        description: 'Veículo atualizado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar veículo.',
        variant: 'destructive',
      });
    }
  });
}

export function useToggleVeiculoAtivo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from('veiculos')
        .update({ ativo })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast({
        title: 'Sucesso!',
        description: data.ativo ? 'Veículo reativado.' : 'Veículo desativado.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status do veículo.',
        variant: 'destructive',
      });
    }
  });
}
