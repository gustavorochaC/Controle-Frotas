-- Adicionar campos de CNH e Exame Toxicológico na tabela motoristas
ALTER TABLE motoristas ADD COLUMN IF NOT EXISTS numero_cnh TEXT;
ALTER TABLE motoristas ADD COLUMN IF NOT EXISTS categoria_cnh TEXT;
ALTER TABLE motoristas ADD COLUMN IF NOT EXISTS data_vencimento_cnh DATE;
ALTER TABLE motoristas ADD COLUMN IF NOT EXISTS data_exame_toxicologico DATE;

-- Comentários das colunas
COMMENT ON COLUMN motoristas.numero_cnh IS 'Número da CNH do motorista/condutor';
COMMENT ON COLUMN motoristas.categoria_cnh IS 'Categoria da CNH (A, B, C, D, E, AB, AC, AD, AE)';
COMMENT ON COLUMN motoristas.data_vencimento_cnh IS 'Data de vencimento da CNH';
COMMENT ON COLUMN motoristas.data_exame_toxicologico IS 'Data de realização do exame toxicológico (validade: 2 anos e 6 meses)';
