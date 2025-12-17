export type FuncaoMotorista = 'Motorista' | 'Condutor';

export const FUNCOES_MOTORISTA: FuncaoMotorista[] = ['Motorista', 'Condutor'];

export const CATEGORIAS_CNH = [
  'A',
  'B', 
  'AB',
  'C',
  'D',
  'E',
  'AC',
  'AD',
  'AE',
] as const;

export type CategoriaCNH = typeof CATEGORIAS_CNH[number];

export interface Motorista {
  id: string;
  nome: string;
  funcao?: FuncaoMotorista; // DEPRECATED: Use eh_motorista
  eh_motorista: boolean;
  eh_montador: boolean;
  numero_cnh: string | null;
  categoria_cnh: CategoriaCNH | null;
  data_vencimento_cnh: string | null;
  data_exame_toxicologico: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MotoristaFormData {
  nome: string;
  eh_motorista?: boolean;
  eh_montador?: boolean;
  numero_cnh?: string;
  categoria_cnh?: CategoriaCNH;
  data_vencimento_cnh?: string;
  data_exame_toxicologico?: string;
  ativo?: boolean;
}

// Função para calcular status de vencimento
export type StatusVencimento = 'ok' | 'proximo' | 'vencido';

export function getStatusVencimento(dataVencimento: string | null, diasAlerta: number = 30): StatusVencimento {
  if (!dataVencimento) return 'ok';
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  
  const diffTime = vencimento.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'vencido';
  if (diffDays <= diasAlerta) return 'proximo';
  return 'ok';
}

// Função para calcular vencimento do exame toxicológico (2 anos e 6 meses = 912 dias)
export function getVencimentoToxicologico(dataExame: string | null): string | null {
  if (!dataExame) return null;
  
  const data = new Date(dataExame);
  data.setMonth(data.getMonth() + 30); // 2 anos e 6 meses = 30 meses
  return data.toISOString().split('T')[0];
}
