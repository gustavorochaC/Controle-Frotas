export interface Veiculo {
  id: string;
  placa: string;
  fabricante: string | null;
  modelo: string | null;
  tipo: string | null;
  ano: number | null;
  km_atual: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface VeiculoFormData {
  placa: string;
  fabricante?: string;
  modelo?: string;
  tipo?: string;
  ano?: number;
  km_atual?: number;
  ativo?: boolean;
}

export const TIPOS_VEICULO = [
  'Carro',
  'Van',
  'Caminhão',
  'Moto',
  'Utilitário',
] as const;
