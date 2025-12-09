import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AcertoViagem, AcertoViagemFormData, AcertoViagemEntrega } from '@/types/acertoViagem';

// Tipos auxiliares para os relacionamentos nas queries
type AcertoComRelacionamentos = {
  id: string;
  veiculo_id: string | null;
  motorista_id: string | null;
  montador_id: string | null;
  destino: string;
  data_saida: string;
  data_chegada: string | null;
  km_saida: number | null;
  km_chegada: number | null;
  valor_adiantamento: number;
  despesa_combustivel: number;
  despesa_material_montagem: number;
  despesa_passagem_onibus: number;
  despesa_hotel: number;
  despesa_lavanderia: number;
  despesa_taxi_transporte: number;
  despesa_veiculo: number;
  despesa_ajudante: number;
  despesa_cartao_telefonico: number;
  despesa_alimentacao: number;
  despesa_diaria_motorista: number;
  despesa_diaria_montador: number;
  despesa_outros: number;
  despesa_outros_descricao: string | null;
  observacoes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  veiculos: { placa: string; modelo: string | null } | null;
  motoristas: { nome: string } | null;
  montadores: { nome: string } | null;
};

type EntregaComRelacionamento = {
  id: string;
  acerto_id: string;
  entrega_id: string;
  created_at: string;
  controle_entregas: {
    id: string;
    pv_foco: string | null;
    cliente: string | null;
    uf: string | null;
    valor: number | null;
  } | null;
};

// ==================== QUERIES ====================

export function useAcertosViagem() {
  return useQuery({
    queryKey: ['acertos_viagem'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acertos_viagem')
        .select(`
          *,
          veiculos:veiculo_id (placa, modelo),
          motoristas:motorista_id (nome),
          montadores:montador_id (nome)
        `)
        .order('data_saida', { ascending: false });

      if (error) throw error;

      const typedData = data as unknown as AcertoComRelacionamentos[];
      return (typedData || []).map((item) => ({
        ...item,
        veiculo_placa: item.veiculos?.placa,
        veiculo_modelo: item.veiculos?.modelo,
        motorista_nome: item.motoristas?.nome,
        montador_nome: item.montadores?.nome,
      })) as AcertoViagem[];
    },
  });
}

export function useAcertoViagem(id: string | null) {
  return useQuery({
    queryKey: ['acertos_viagem', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: acerto, error: acertoError } = await supabase
        .from('acertos_viagem')
        .select(`
          *,
          veiculos:veiculo_id (placa, modelo),
          motoristas:motorista_id (nome),
          montadores:montador_id (nome)
        `)
        .eq('id', id)
        .single();

      if (acertoError) throw acertoError;

      const { data: entregas, error: entregasError } = await supabase
        .from('acerto_viagem_entregas')
        .select(`
          *,
          controle_entregas:entrega_id (
            id, pv_foco, cliente, uf, valor
          )
        `)
        .eq('acerto_id', id);

      if (entregasError) throw entregasError;

      const typedAcerto = acerto as unknown as AcertoComRelacionamentos;
      const typedEntregas = entregas as unknown as EntregaComRelacionamento[];
      
      return {
        ...typedAcerto,
        veiculo_placa: typedAcerto.veiculos?.placa,
        veiculo_modelo: typedAcerto.veiculos?.modelo,
        motorista_nome: typedAcerto.motoristas?.nome,
        montador_nome: typedAcerto.montadores?.nome,
        entregas: typedEntregas?.map((e): AcertoViagemEntrega => ({
          id: e.id,
          acerto_id: e.acerto_id,
          entrega_id: e.entrega_id,
          created_at: e.created_at,
          entrega: e.controle_entregas ? {
            id: e.controle_entregas.id,
            pv_foco: e.controle_entregas.pv_foco,
            nota_fiscal: null,
            cliente: e.controle_entregas.cliente,
            uf: e.controle_entregas.uf,
            valor: e.controle_entregas.valor,
          } : undefined,
        })),
      } as AcertoViagem;
    },
    enabled: !!id,
  });
}

export function useEntregasDisponiveis() {
  return useQuery({
    queryKey: ['entregas_disponiveis_acerto'],
    queryFn: async () => {
      const { data: vinculadas } = await supabase
        .from('acerto_viagem_entregas')
        .select('entrega_id');

      const idsVinculados = (vinculadas || []).map((v) => v.entrega_id) || [];

      let query = supabase
        .from('controle_entregas')
        .select('id, pv_foco, cliente, uf, valor, data_saida, motorista, carro')
        .order('data_saida', { ascending: false });

      if (idsVinculados.length > 0) {
        query = query.not('id', 'in', `(${idsVinculados.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
  });
}

// ==================== MUTATIONS ====================

export function useCreateAcertoViagem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: AcertoViagemFormData) => {
      const { entregas_ids, ...acertoData } = formData;

      const { data: acerto, error: acertoError } = await supabase
        .from('acertos_viagem')
        .insert({
          ...acertoData,
          motorista_id: acertoData.motorista_id || null,
          montador_id: acertoData.montador_id || null,
        })
        .select()
        .single();

      if (acertoError) throw acertoError;

      if (entregas_ids.length > 0) {
        const entregasVinculos = entregas_ids.map(entrega_id => ({
          acerto_id: acerto.id,
          entrega_id,
        }));

        const { error: entregasError } = await supabase
          .from('acerto_viagem_entregas')
          .insert(entregasVinculos);

        if (entregasError) throw entregasError;
      }

      return acerto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acertos_viagem'] });
      queryClient.invalidateQueries({ queryKey: ['entregas_disponiveis_acerto'] });
      toast({
        title: 'Sucesso!',
        description: 'Acerto de viagem criado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o acerto de viagem.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAcertoViagem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: AcertoViagemFormData }) => {
      const { entregas_ids, ...acertoData } = formData;

      const { error: acertoError } = await supabase
        .from('acertos_viagem')
        .update({
          ...acertoData,
          motorista_id: acertoData.motorista_id || null,
          montador_id: acertoData.montador_id || null,
        })
        .eq('id', id);

      if (acertoError) throw acertoError;

      const { error: deleteError } = await supabase
        .from('acerto_viagem_entregas')
        .delete()
        .eq('acerto_id', id);

      if (deleteError) throw deleteError;

      if (entregas_ids.length > 0) {
        const entregasVinculos = entregas_ids.map(entrega_id => ({
          acerto_id: id,
          entrega_id,
        }));

        const { error: entregasError } = await supabase
          .from('acerto_viagem_entregas')
          .insert(entregasVinculos);

        if (entregasError) throw entregasError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acertos_viagem'] });
      queryClient.invalidateQueries({ queryKey: ['entregas_disponiveis_acerto'] });
      toast({
        title: 'Sucesso!',
        description: 'Acerto de viagem atualizado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o acerto de viagem.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAcertoViagem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('acertos_viagem')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acertos_viagem'] });
      queryClient.invalidateQueries({ queryKey: ['entregas_disponiveis_acerto'] });
      toast({
        title: 'Sucesso!',
        description: 'Acerto de viagem excluido com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o acerto de viagem.',
        variant: 'destructive',
      });
    },
  });
}
