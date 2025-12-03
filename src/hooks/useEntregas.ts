import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Entrega, EntregaFormData } from '@/types/entrega';
import { toast } from '@/hooks/use-toast';

export function useEntregas() {
  return useQuery({
    queryKey: ['entregas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('controle_entregas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Entrega[];
    }
  });
}

export function useCreateEntrega() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entrega: EntregaFormData) => {
      const { data, error } = await supabase
        .from('controle_entregas')
        .insert([entrega])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      toast({
        title: 'Sucesso!',
        description: 'Entrega cadastrada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar entrega.',
        variant: 'destructive',
      });
      console.error('Error creating entrega:', error);
    }
  });
}

export function useUpdateEntrega() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EntregaFormData> }) => {
      const { data: updatedData, error } = await supabase
        .from('controle_entregas')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      toast({
        title: 'Sucesso!',
        description: 'Entrega atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar entrega.',
        variant: 'destructive',
      });
      console.error('Error updating entrega:', error);
    }
  });
}

export function useDeleteEntrega() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('controle_entregas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      toast({
        title: 'Sucesso!',
        description: 'Entrega excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir entrega.',
        variant: 'destructive',
      });
      console.error('Error deleting entrega:', error);
    }
  });
}
