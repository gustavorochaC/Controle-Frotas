-- =====================================================
-- Migration: Sistema de Manutenção Preventiva e Corretiva
-- Data: 2024-12-04
-- =====================================================

-- 1. Adicionar campo km_atual na tabela veiculos
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS km_atual INTEGER DEFAULT 0;

-- 2. Adicionar novos campos na tabela manutencoes
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS tipo_manutencao TEXT DEFAULT 'corretiva' CHECK (tipo_manutencao IN ('preventiva', 'corretiva'));
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'resolvida'));
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS problema_detectado TEXT;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS config_preventiva_id UUID;

-- 3. Criar tabela de configurações de manutenção preventiva por veículo
CREATE TABLE IF NOT EXISTS manutencoes_preventivas_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  nome_servico TEXT NOT NULL, -- Ex: "Troca de Óleo", "Alinhamento"
  intervalo_km INTEGER NOT NULL, -- A cada quantos KM
  margem_alerta_km INTEGER NOT NULL DEFAULT 1000, -- Alertar X km antes
  km_ultima_manutencao INTEGER DEFAULT 0, -- KM da última vez que foi feito
  km_proxima_manutencao INTEGER, -- Calculado: km_ultima + intervalo
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para evitar duplicatas do mesmo serviço para o mesmo veículo
  UNIQUE(veiculo_id, nome_servico)
);

-- 4. Adicionar FK para config_preventiva_id
ALTER TABLE manutencoes ADD CONSTRAINT manutencoes_config_preventiva_id_fkey 
  FOREIGN KEY (config_preventiva_id) REFERENCES manutencoes_preventivas_config(id) ON DELETE SET NULL;

-- 5. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_manutencoes_tipo ON manutencoes(tipo_manutencao);
CREATE INDEX IF NOT EXISTS idx_manutencoes_status ON manutencoes(status);
CREATE INDEX IF NOT EXISTS idx_manutencoes_config_preventiva ON manutencoes(config_preventiva_id);
CREATE INDEX IF NOT EXISTS idx_config_preventiva_veiculo ON manutencoes_preventivas_config(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_config_preventiva_proxima ON manutencoes_preventivas_config(km_proxima_manutencao);

-- 6. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_manutencoes_preventivas_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_manutencoes_preventivas_config_updated_at ON manutencoes_preventivas_config;
CREATE TRIGGER trigger_update_manutencoes_preventivas_config_updated_at
  BEFORE UPDATE ON manutencoes_preventivas_config
  FOR EACH ROW
  EXECUTE FUNCTION update_manutencoes_preventivas_config_updated_at();

-- 7. Atualizar km_atual dos veículos baseado no último abastecimento
UPDATE veiculos v
SET km_atual = COALESCE((
  SELECT MAX(a.km_inicial)
  FROM abastecimentos a
  WHERE a.veiculo_id = v.id
), 0);

-- 8. Atualizar manutenções existentes para tipo 'corretiva' e status 'resolvida'
UPDATE manutencoes SET tipo_manutencao = 'corretiva', status = 'resolvida' WHERE tipo_manutencao IS NULL;
