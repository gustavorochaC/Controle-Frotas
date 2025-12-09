import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Condutor } from '@/types/condutor';

// Hook que busca motoristas com função "Condutor" da tabela motoristas
// Retorna tipo Condutor (alias de Motorista) para clareza semântica no módulo de Abastecimento
export function useCondutores() {
  return useQuery({
    queryKey: ['condutores'],
    queryFn: async (): Promise<Condutor[]> => {
      const { data, error } = await supabase
        .from('motoristas')
        .select('*')
        .filter('funcao', 'eq', 'Condutor')
        .filter('ativo', 'eq', true)
        .order('nome');
      
      if (error) throw error;
      return (data || []) as Condutor[];
    },
  });
}
