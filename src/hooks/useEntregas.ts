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
      // #region agent log
      if (data && data.length > 0) {
        const sample = data[0];
        fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregas.ts:useEntregas',message:'dados recuperados do banco',data:{sampleDataSaida:sample?.data_saida,samplePvFoco:sample?.pv_foco,totalRecords:data.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      }
      // #endregion
      return data as Entrega[];
    }
  });
}

export function useCreateEntrega() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entrega: Partial<EntregaFormData>) => {
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
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar entrega.',
        variant: 'destructive',
      });
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
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar entrega.',
        variant: 'destructive',
      });
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
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir entrega.',
        variant: 'destructive',
      });
    }
  });
}
