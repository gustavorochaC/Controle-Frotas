import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Motorista, MotoristaFormData } from '@/types/motorista';
import { toast } from '@/hooks/use-toast';

export function useMotoristas(includeInactive = false) {
  return useQuery({
    queryKey: ['motoristas', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('motoristas')
        .select('*')
        .order('nome', { ascending: true });
      
      if (!includeInactive) {
        query = query.eq('ativo', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Motorista[];
    }
  });
}

export function useCreateMotorista() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (motorista: MotoristaFormData) => {
      const { data, error } = await supabase
        .from('motoristas')
        .insert([motorista])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoristas'] });
      toast({
        title: 'Sucesso!',
        description: 'Motorista cadastrado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar motorista.',
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateMotorista() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MotoristaFormData> }) => {
      const { data: updatedData, error } = await supabase
        .from('motoristas')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoristas'] });
      toast({
        title: 'Sucesso!',
        description: 'Motorista atualizado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar motorista.',
        variant: 'destructive',
      });
    }
  });
}

export function useToggleMotoristaAtivo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from('motoristas')
        .update({ ativo })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['motoristas'] });
      toast({
        title: 'Sucesso!',
        description: data.ativo ? 'Motorista reativado.' : 'Motorista desativado.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status do motorista.',
        variant: 'destructive',
      });
    }
  });
}
