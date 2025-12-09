-- =====================================================
-- MÓDULO: ABASTECIMENTO
-- Migration retroativa para documentar estrutura da tabela abastecimentos
-- (Tabela já existe no banco de dados - esta migration é apenas para documentação)
-- =====================================================

-- Tabela de Abastecimentos
CREATE TABLE IF NOT EXISTS abastecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Data do abastecimento
  data DATE NOT NULL,
  
  -- Veículo (referência)
  veiculo_id UUID NOT NULL REFERENCES veiculos(id),
  
  -- Condutor (referência à tabela motoristas)
  condutor_id UUID NOT NULL REFERENCES motoristas(id),
  
  -- Dados do posto
  posto TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  
  -- Dados do abastecimento
  km_inicial NUMERIC NOT NULL,
  litros NUMERIC NOT NULL,
  produto TEXT NOT NULL,
  valor_unitario NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  
  -- Campo calculado: consumo médio (km/litro)
  -- Calculado automaticamente baseado no km_inicial do abastecimento anterior
  km_por_litro NUMERIC,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_abastecimentos_updated_at
  BEFORE UPDATE ON abastecimentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_abastecimentos_veiculo ON abastecimentos(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_condutor ON abastecimentos(condutor_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_data ON abastecimentos(data);

-- RLS Policies (acesso público para o sistema interno)
ALTER TABLE abastecimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on abastecimentos" ON abastecimentos
  FOR ALL USING (true) WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE abastecimentos IS 'Registro de abastecimentos de veículos';
COMMENT ON COLUMN abastecimentos.km_inicial IS 'Quilometragem do veículo no momento do abastecimento';
COMMENT ON COLUMN abastecimentos.km_por_litro IS 'Consumo calculado (KM rodados desde último abastecimento / litros)';
COMMENT ON COLUMN abastecimentos.condutor_id IS 'Referência ao motorista/condutor que realizou o abastecimento';
