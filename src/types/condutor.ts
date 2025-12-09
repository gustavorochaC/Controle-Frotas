import { Motorista, MotoristaFormData } from './motorista';

// Condutor é um alias para Motorista (motoristas com funcao = 'Condutor')
// Mantido para compatibilidade e clareza semântica no módulo de abastecimento
export type Condutor = Motorista;
export type CondutorFormData = MotoristaFormData;
