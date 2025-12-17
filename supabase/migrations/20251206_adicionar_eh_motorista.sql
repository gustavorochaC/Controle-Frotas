-- =====================================================
-- ADICIONAR CAMPO eh_motorista
-- Transformar funcao em checkbox eh_motorista
-- =====================================================

-- 1. Adicionar campo eh_motorista na tabela motoristas
ALTER TABLE motoristas ADD COLUMN IF NOT EXISTS eh_motorista BOOLEAN DEFAULT false;

-- Comentário da coluna
COMMENT ON COLUMN motoristas.eh_motorista IS 'Indica se a pessoa exerce a função de motorista';

-- 2. Migrar dados: se funcao = 'Motorista' ou 'Condutor', então eh_motorista = true
UPDATE motoristas
SET eh_motorista = true
WHERE funcao IN ('Motorista', 'Condutor');

-- 3. Atualizar comentário do campo funcao (agora será opcional/deprecated)
COMMENT ON COLUMN motoristas.funcao IS 'DEPRECATED: Use eh_motorista ao invés deste campo. Mantido apenas para compatibilidade.';

-- Nota: O campo funcao será mantido na tabela para não quebrar queries existentes,
-- mas o sistema passará a usar eh_motorista e eh_montador como campos principais.

