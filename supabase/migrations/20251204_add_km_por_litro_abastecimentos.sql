-- Adiciona coluna km_por_litro na tabela abastecimentos
ALTER TABLE abastecimentos ADD COLUMN IF NOT EXISTS km_por_litro NUMERIC;

-- Script para recalcular km_por_litro do histórico existente
-- Calcula com base no km_inicial atual menos o km_inicial do abastecimento anterior do mesmo veículo
WITH ordered_abastecimentos AS (
  SELECT 
    id,
    veiculo_id,
    data,
    km_inicial,
    litros,
    LAG(km_inicial) OVER (PARTITION BY veiculo_id ORDER BY data, created_at) as km_anterior
  FROM abastecimentos
  ORDER BY veiculo_id, data, created_at
),
calculated AS (
  SELECT 
    id,
    CASE 
      WHEN km_anterior IS NULL THEN NULL  -- Primeiro abastecimento do veículo
      WHEN km_inicial < km_anterior THEN NULL  -- KM inválido (menor que anterior)
      WHEN litros > 0 THEN ROUND(((km_inicial - km_anterior)::NUMERIC / litros::NUMERIC), 2)
      ELSE NULL
    END as km_por_litro_calc
  FROM ordered_abastecimentos
)
UPDATE abastecimentos a
SET km_por_litro = c.km_por_litro_calc
FROM calculated c
WHERE a.id = c.id;

-- Comentário na coluna
COMMENT ON COLUMN abastecimentos.km_por_litro IS 'KM por litro calculado com base na diferença de KM desde o último abastecimento dividido pelos litros';
