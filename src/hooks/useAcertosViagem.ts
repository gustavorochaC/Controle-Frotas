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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAcertosViagem.ts:60',message:'Query iniciada',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Buscar acertos sem join com montadores (causa erro no Supabase)
      const { data, error } = await supabase
        .from('acertos_viagem')
        .select(`
          *,
          veiculos:veiculo_id (placa, modelo),
          motoristas:motorista_id (nome)
        `)
        .order('data_saida', { ascending: false });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAcertosViagem.ts:72',message:'Query resultado',data:{hasError:!!error,errorMessage:error?.message,dataLength:data?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (error) throw error;

      // Buscar nomes dos montadores separadamente se houver montador_id
      const typedData = data as unknown as AcertoComRelacionamentos[];
      const montadorIds = [...new Set(typedData.filter(item => item.montador_id).map(item => item.montador_id))] as string[];
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAcertosViagem.ts:82',message:'Processando montadores',data:{typedDataLength:typedData.length,montadorIdsCount:montadorIds.length,montadorIdsSample:montadorIds.slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      let montadoresMap: Record<string, string> = {};
      if (montadorIds.length > 0) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAcertosViagem.ts:88',message:'Buscando montadores separadamente',data:{montadorIdsCount:montadorIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        const { data: montadores, error: montadoresError } = await supabase
          .from('montadores')
          .select('id, nome')
          .in('id', montadorIds);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAcertosViagem.ts:96',message:'Montadores buscados',data:{hasError:!!montadoresError,errorMessage:montadoresError?.message,montadoresLength:montadores?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        if (!montadoresError && montadores) {
          montadoresMap = montadores.reduce((acc, m) => {
            acc[m.id] = m.nome;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const result = (typedData || []).map((item) => ({
        ...item,
        veiculo_placa: item.veiculos?.placa,
        veiculo_modelo: item.veiculos?.modelo,
        motorista_nome: item.motoristas?.nome,
        montador_nome: item.montador_id ? montadoresMap[item.montador_id] : undefined,
      })) as AcertoViagem[];

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAcertosViagem.ts:81',message:'Query finalizada',data:{resultLength:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      return result;
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
          motoristas:motorista_id (nome, eh_montador)
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregasDisponiveis.ts:146',message:'Query entregas iniciada',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const { data: vinculadas, error: vinculadasError } = await supabase
        .from('acerto_viagem_entregas')
        .select('entrega_id');

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregasDisponiveis.ts:151',message:'Vinculadas carregadas',data:{hasError:!!vinculadasError,errorMessage:vinculadasError?.message,vinculadasLength:vinculadas?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (vinculadasError) throw vinculadasError;

      const idsVinculados = (vinculadas || []).map((v) => v.entrega_id) || [];
      const idsVinculadosSet = new Set(idsVinculados);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregasDisponiveis.ts:158',message:'IDs vinculados',data:{idsVinculadosLength:idsVinculados.length,idsVinculadosSample:idsVinculados.slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Buscar todas as entregas e filtrar no JavaScript (mais seguro que usar .not com múltiplos IDs)
      const { data: todasEntregas, error } = await supabase
        .from('controle_entregas')
        .select('id, pv_foco, cliente, uf, valor, data_saida, motorista, carro')
        .order('data_saida', { ascending: false });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregasDisponiveis.ts:168',message:'Todas entregas carregadas',data:{hasError:!!error,errorMessage:error?.message,errorCode:error?.code,todasEntregasLength:todasEntregas?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (error) throw error;

      // Filtrar entregas não vinculadas
      const data = (todasEntregas || []).filter(entrega => !idsVinculadosSet.has(entrega.id));

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEntregasDisponiveis.ts:175',message:'Query entregas resultado final',data:{dataLength:data?.length||0,idsVinculadosLength:idsVinculados.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

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

      // Sanitização de dados - converter strings vazias para null
      const payload = {
        ...acertoData,
        motorista_id: acertoData.motorista_id || null,
        data_chegada: acertoData.data_chegada || null,
      };

      const { data: acerto, error: acertoError } = await supabase
        .from('acertos_viagem')
        .insert(payload)
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
    onSuccess: (data) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCreateAcertoViagem.ts:210',message:'Criação sucesso',data:{acertoId:data?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      queryClient.invalidateQueries({ queryKey: ['acertos_viagem'] });
      queryClient.invalidateQueries({ queryKey: ['entregas_disponiveis_acerto'] });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCreateAcertoViagem.ts:213',message:'Queries invalidadas',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      toast({
        title: 'Sucesso!',
        description: 'Acerto de viagem criado com sucesso.',
      });
    },
    onError: (error: any) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCreateAcertoViagem.ts:218',message:'Erro ao criar',data:{errorMessage:error?.message,errorCode:error?.code,errorDetails:error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('Erro ao criar acerto:', error);
      toast({
        title: 'Erro ao criar',
        description: error.message || 'Verifique os dados e tente novamente.',
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

      // Sanitização de dados - converter strings vazias para null
      const payload = {
        ...acertoData,
        motorista_id: acertoData.motorista_id || null,
        data_chegada: acertoData.data_chegada || null,
      };

      const { error: acertoError } = await supabase
        .from('acertos_viagem')
        .update(payload)
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
    onError: (error: any) => {
      console.error('Erro ao atualizar acerto:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Verifique os dados e tente novamente.',
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
