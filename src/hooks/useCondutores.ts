import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Condutor } from '@/types/condutor';

// Hook que busca motoristas/condutores da tabela motoristas
// Condutor e Motorista são a mesma função, então busca onde eh_motorista = true
// Retorna tipo Condutor (alias de Motorista) para clareza semântica no módulo de Abastecimento
export function useCondutores() {
  return useQuery({
    queryKey: ['condutores'],
    queryFn: async (): Promise<Condutor[]> => {
      const { data, error } = await supabase
        .from('motoristas')
        .select('*')
        .eq('eh_motorista', true)
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return (data || []) as Condutor[];
    },
  });
}
