export interface Montador {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MontadorFormData {
  nome: string;
  ativo?: boolean;
}
