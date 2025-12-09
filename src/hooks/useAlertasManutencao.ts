import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AlertaManutencao {
  id: string;
  veiculo_id: string;
  veiculo_placa: string;
  veiculo_modelo: string | null;
  nome_servico: string;
  km_atual: number;
  km_proxima_manutencao: number;
  margem_alerta_km: number;
  km_restante: number;
  status: 'ok' | 'proximo' | 'vencido';
}

// Tipo auxiliar para dados com relacionamentos
type ConfigComVeiculo = {
  id: string;
  veiculo_id: string;
  nome_servico: string;
  km_proxima_manutencao: number | null;
  margem_alerta_km: number;
  aguardando_primeira_manutencao: boolean;
  veiculo: { placa: string; modelo: string | null; km_atual: number } | null;
};

export function useAlertasManutencao() {
  return useQuery({
    queryKey: ['alertas_manutencao'],
    queryFn: async () => {
      // Buscar configurações preventivas com dados do veículo
      // Ignorar configs que ainda aguardam a primeira manutenção
      const { data, error } = await supabase
        .from('manutencoes_preventivas_config')
        .select(`
          id,
          veiculo_id,
          nome_servico,
          km_proxima_manutencao,
          margem_alerta_km,
          aguardando_primeira_manutencao,
          veiculo:veiculo_id(placa, modelo, km_atual)
        `)
        .eq('ativo', true)
        .eq('aguardando_primeira_manutencao', false);

      if (error) throw error;

      // Calcular alertas
      const typedData = data as unknown as ConfigComVeiculo[];
      const alertas: AlertaManutencao[] = typedData
        .map((config) => {
          const kmAtual = config.veiculo?.km_atual || 0;
          const kmProxima = config.km_proxima_manutencao || 0;
          const kmRestante = kmProxima - kmAtual;
          
          let status: 'ok' | 'proximo' | 'vencido' = 'ok';
          if (kmRestante <= 0) {
            status = 'vencido';
          } else if (kmRestante <= config.margem_alerta_km) {
            status = 'proximo';
          }

          return {
            id: config.id,
            veiculo_id: config.veiculo_id,
            veiculo_placa: config.veiculo?.placa || '',
            veiculo_modelo: config.veiculo?.modelo || null,
            nome_servico: config.nome_servico,
            km_atual: kmAtual,
            km_proxima_manutencao: kmProxima,
            margem_alerta_km: config.margem_alerta_km,
            km_restante: kmRestante,
            status,
          };
        })
        .filter((alerta) => alerta.status !== 'ok')
        .sort((a, b) => a.km_restante - b.km_restante);

      return alertas;
    },
    refetchInterval: 60000, // Recarregar a cada 1 minuto
  });
}

// Hook para contar alertas (útil para mostrar badge no menu)
export function useContadorAlertasManutencao() {
  const { data: alertas = [] } = useAlertasManutencao();
  
  return {
    total: alertas.length,
    vencidos: alertas.filter(a => a.status === 'vencido').length,
    proximos: alertas.filter(a => a.status === 'proximo').length,
  };
}
