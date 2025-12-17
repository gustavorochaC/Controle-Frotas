 -- =====================================================
-- UNIFICAÇÃO: Motoristas e Montadores
-- Unificar cadastros em uma única tabela motoristas
-- =====================================================

-- 1. Adicionar campo eh_montador na tabela motoristas
ALTER TABLE motoristas ADD COLUMN IF NOT EXISTS eh_montador BOOLEAN DEFAULT false;

-- Comentário da coluna
COMMENT ON COLUMN motoristas.eh_montador IS 'Indica se a pessoa também é montador';

-- 2. Migrar dados de montadores para motoristas
-- Para cada montador, verificar se já existe motorista com mesmo nome
DO $$
DECLARE
    montador_record RECORD;
    motorista_existente RECORD;
BEGIN
    FOR montador_record IN SELECT * FROM montadores LOOP
        -- Buscar motorista com mesmo nome (case-insensitive)
        SELECT * INTO motorista_existente
        FROM motoristas
        WHERE LOWER(TRIM(nome)) = LOWER(TRIM(montador_record.nome))
        LIMIT 1;
        
        IF motorista_existente IS NOT NULL THEN
            -- Se já existe, apenas marcar como montador
            UPDATE motoristas
            SET eh_montador = true
            WHERE id = motorista_existente.id;
        ELSE
            -- Se não existe, criar novo registro como motorista que também é montador
            INSERT INTO motoristas (nome, funcao, eh_montador, ativo, created_at, updated_at)
            VALUES (
                montador_record.nome,
                'Motorista', -- Função padrão
                true,
                montador_record.ativo,
                montador_record.created_at,
                montador_record.updated_at
            );
        END IF;
    END LOOP;
END $$;

-- 3. Migrar montador_id para motorista_id em acertos_viagem
-- Atualizar acertos que têm montador_id mas não têm motorista_id
UPDATE acertos_viagem av
SET motorista_id = (
    SELECT m.id
    FROM motoristas m
    INNER JOIN montadores mt ON LOWER(TRIM(m.nome)) = LOWER(TRIM(mt.nome))
    WHERE mt.id = av.montador_id
    AND m.eh_montador = true
    LIMIT 1
)
WHERE av.montador_id IS NOT NULL
AND av.motorista_id IS NULL;

-- 4. Remover constraint que exige motorista OU montador
ALTER TABLE acertos_viagem DROP CONSTRAINT IF EXISTS responsavel_obrigatorio;

-- 5. Adicionar nova constraint que exige apenas motorista (que pode ser montador também)
ALTER TABLE acertos_viagem 
ADD CONSTRAINT responsavel_obrigatorio CHECK (motorista_id IS NOT NULL);

-- 6. Remover foreign key de montador_id
ALTER TABLE acertos_viagem DROP CONSTRAINT IF EXISTS acertos_viagem_montador_id_fkey;

-- 7. Remover coluna montador_id de acertos_viagem
ALTER TABLE acertos_viagem DROP COLUMN IF EXISTS montador_id;

-- 8. Remover índice de montador_id se existir
DROP INDEX IF EXISTS idx_acertos_viagem_montador;

-- 9. Comentários finais
COMMENT ON COLUMN motoristas.eh_montador IS 'Indica se a pessoa também exerce a função de montador. Uma pessoa pode ser Motorista/Condutor E Montador ao mesmo tempo.';

-- Nota: A tabela montadores será mantida vazia para compatibilidade, mas não será mais usada.
-- Os dados foram migrados para motoristas com eh_montador = true.

