-- Adicionar coluna para controlar se é a primeira manutenção
ALTER TABLE public.manutencoes_preventivas_config 
ADD COLUMN IF NOT EXISTS aguardando_primeira_manutencao BOOLEAN DEFAULT true;

-- Atualizar registros existentes: se já tem km_ultima_manutencao > 0, não está mais aguardando
UPDATE public.manutencoes_preventivas_config 
SET aguardando_primeira_manutencao = false 
WHERE km_ultima_manutencao IS NOT NULL AND km_ultima_manutencao > 0;

-- Comentário para documentação
COMMENT ON COLUMN public.manutencoes_preventivas_config.aguardando_primeira_manutencao 
IS 'Indica se o tipo de manutenção ainda aguarda o primeiro registro. Quando true, não gera alertas de vencimento.';
