import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Montador, MontadorFormData } from '@/types/montador';
import { toast } from '@/hooks/use-toast';

export function useMontadores(includeInactive = false) {
  return useQuery({
    queryKey: ['montadores', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('motoristas')
        .select('*')
        .eq('eh_montador', true)
        .order('nome', { ascending: true });
      
      if (!includeInactive) {
        query = query.eq('ativo', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      // Mapear para o formato Montador esperado
      return (data || []).map(m => ({
        id: m.id,
        nome: m.nome,
        ativo: m.ativo,
        created_at: m.created_at,
        updated_at: m.updated_at,
      })) as Montador[];
    }
  });
}

export function useCreateMontador() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (montador: MontadorFormData) => {
      const { data, error } = await supabase
        .from('motoristas')
        .insert([{
          nome: montador.nome,
          eh_montador: true,
          eh_motorista: false,
          ativo: montador.ativo ?? true,
        }])
        .select()
        .single();
      
      if (error) throw error;
      // Mapear para formato Montador
      return {
        id: data.id,
        nome: data.nome,
        ativo: data.ativo,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as Montador;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['montadores'] });
      queryClient.invalidateQueries({ queryKey: ['motoristas'] });
      toast({
        title: 'Sucesso!',
        description: 'Montador cadastrado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar montador.',
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateMontador() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MontadorFormData> }) => {
      const { data: updatedData, error } = await supabase
        .from('motoristas')
        .update({
          nome: data.nome,
          ativo: data.ativo,
        })
        .eq('id', id)
        .eq('eh_montador', true)
        .select()
        .single();
      
      if (error) throw error;
      // Mapear para formato Montador
      return {
        id: updatedData.id,
        nome: updatedData.nome,
        ativo: updatedData.ativo,
        created_at: updatedData.created_at,
        updated_at: updatedData.updated_at,
      } as Montador;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['montadores'] });
      queryClient.invalidateQueries({ queryKey: ['motoristas'] });
      toast({
        title: 'Sucesso!',
        description: 'Montador atualizado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar montador.',
        variant: 'destructive',
      });
    }
  });
}

export function useToggleMontadorAtivo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from('motoristas')
        .update({ ativo })
        .eq('id', id)
        .eq('eh_montador', true)
        .select()
        .single();
      
      if (error) throw error;
      // Mapear para formato Montador
      return {
        id: data.id,
        nome: data.nome,
        ativo: data.ativo,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as Montador;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['montadores'] });
      queryClient.invalidateQueries({ queryKey: ['motoristas'] });
      toast({
        title: 'Sucesso!',
        description: data.ativo ? 'Montador reativado.' : 'Montador desativado.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status do montador.',
        variant: 'destructive',
      });
    }
  });
}
