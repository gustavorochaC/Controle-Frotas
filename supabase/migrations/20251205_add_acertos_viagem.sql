-- =====================================================
-- MÓDULO: ACERTO DE VIAGEM
-- Criação das tabelas para registro de acertos de viagem
-- =====================================================

-- Tabela principal de Acertos de Viagem
CREATE TABLE IF NOT EXISTS acertos_viagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do Veículo
  veiculo_id UUID REFERENCES veiculos(id),
  
  -- Responsável (pode ser motorista OU montador)
  motorista_id UUID REFERENCES motoristas(id),
  montador_id UUID REFERENCES montadores(id),
  
  -- Dados da Viagem
  destino TEXT NOT NULL,
  data_saida DATE NOT NULL,
  data_chegada DATE,
  
  -- Quilometragem
  km_saida NUMERIC,
  km_chegada NUMERIC,
  
  -- Valor adiantado (Valor Especificado no documento)
  valor_adiantamento NUMERIC DEFAULT 0,
  
  -- ========== 14 CATEGORIAS DE DESPESAS ==========
  -- Coluna 1
  despesa_combustivel NUMERIC DEFAULT 0,
  despesa_material_montagem NUMERIC DEFAULT 0,
  despesa_passagem_onibus NUMERIC DEFAULT 0,
  despesa_hotel NUMERIC DEFAULT 0,
  despesa_lavanderia NUMERIC DEFAULT 0,
  despesa_taxi_transporte NUMERIC DEFAULT 0,
  
  -- Coluna 2
  despesa_veiculo NUMERIC DEFAULT 0,
  despesa_ajudante NUMERIC DEFAULT 0,
  despesa_cartao_telefonico NUMERIC DEFAULT 0,
  despesa_alimentacao NUMERIC DEFAULT 0,
  despesa_diaria_motorista NUMERIC DEFAULT 0,
  despesa_diaria_montador NUMERIC DEFAULT 0,
  
  -- Despesas extras (outras não categorizadas)
  despesa_outros NUMERIC DEFAULT 0,
  despesa_outros_descricao TEXT,
  
  -- Observações gerais
  observacoes TEXT,
  
  -- Status do acerto
  status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'ACERTADO')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: deve ter pelo menos motorista OU montador
  CONSTRAINT responsavel_obrigatorio CHECK (motorista_id IS NOT NULL OR montador_id IS NOT NULL)
);

-- Tabela de vínculo N:N entre Acertos e Entregas
CREATE TABLE IF NOT EXISTS acerto_viagem_entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acerto_id UUID NOT NULL REFERENCES acertos_viagem(id) ON DELETE CASCADE,
  entrega_id UUID NOT NULL REFERENCES controle_entregas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evita duplicatas
  UNIQUE(acerto_id, entrega_id)
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_acertos_viagem_updated_at
  BEFORE UPDATE ON acertos_viagem
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_acertos_viagem_veiculo ON acertos_viagem(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_acertos_viagem_motorista ON acertos_viagem(motorista_id);
CREATE INDEX IF NOT EXISTS idx_acertos_viagem_montador ON acertos_viagem(montador_id);
CREATE INDEX IF NOT EXISTS idx_acertos_viagem_data_saida ON acertos_viagem(data_saida);
CREATE INDEX IF NOT EXISTS idx_acertos_viagem_status ON acertos_viagem(status);
CREATE INDEX IF NOT EXISTS idx_acerto_viagem_entregas_acerto ON acerto_viagem_entregas(acerto_id);
CREATE INDEX IF NOT EXISTS idx_acerto_viagem_entregas_entrega ON acerto_viagem_entregas(entrega_id);

-- RLS Policies (acesso público para o sistema interno)
ALTER TABLE acertos_viagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE acerto_viagem_entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on acertos_viagem" ON acertos_viagem
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on acerto_viagem_entregas" ON acerto_viagem_entregas
  FOR ALL USING (true) WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE acertos_viagem IS 'Registro de acertos de viagem com despesas detalhadas';
COMMENT ON TABLE acerto_viagem_entregas IS 'Vínculo entre acertos de viagem e entregas realizadas';
COMMENT ON COLUMN acertos_viagem.valor_adiantamento IS 'Valor especificado/adiantado antes da viagem';
COMMENT ON COLUMN acertos_viagem.despesa_combustivel IS 'Gasto com combustível durante a viagem';
COMMENT ON COLUMN acertos_viagem.despesa_material_montagem IS 'Gasto com materiais para montagem';
COMMENT ON COLUMN acertos_viagem.despesa_passagem_onibus IS 'Gasto com passagem de ônibus';
COMMENT ON COLUMN acertos_viagem.despesa_hotel IS 'Gasto com hospedagem em hotel';
COMMENT ON COLUMN acertos_viagem.despesa_lavanderia IS 'Gasto com lavanderia';
COMMENT ON COLUMN acertos_viagem.despesa_taxi_transporte IS 'Gasto com taxi ou transporte';
COMMENT ON COLUMN acertos_viagem.despesa_veiculo IS 'Despesas gerais do veículo';
COMMENT ON COLUMN acertos_viagem.despesa_ajudante IS 'Pagamento de ajudante';
COMMENT ON COLUMN acertos_viagem.despesa_cartao_telefonico IS 'Gasto com cartão telefônico';
COMMENT ON COLUMN acertos_viagem.despesa_alimentacao IS 'Gasto com alimentação';
COMMENT ON COLUMN acertos_viagem.despesa_diaria_motorista IS 'Diária do motorista';
COMMENT ON COLUMN acertos_viagem.despesa_diaria_montador IS 'Diária do montador';
