-- =====================================================
-- Migration: Remover Sistema de Manutenções Preventivas Config
-- Data: 2024-12-16
-- =====================================================

-- 1. Remover constraint FK de manutencoes.config_preventiva_id
ALTER TABLE manutencoes 
DROP CONSTRAINT IF EXISTS manutencoes_config_preventiva_id_fkey;

-- 2. Remover coluna config_preventiva_id de manutencoes
ALTER TABLE manutencoes 
DROP COLUMN IF EXISTS config_preventiva_id;

-- 3. Deletar tabela manutencoes_preventivas_config
DROP TABLE IF EXISTS manutencoes_preventivas_config;

-- 4. Remover índices relacionados (se existirem)
DROP INDEX IF EXISTS idx_manutencoes_config_preventiva;

