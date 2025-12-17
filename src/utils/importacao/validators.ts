/**
 * Validadores que geram AVISOS (não erros bloqueantes)
 */

import { ImportType } from './normalizer';
import { ESTADOS_BRASILEIROS } from '@/types/abastecimento';
import { TIPOS_VEICULO } from '@/types/veiculo';

export type WarningType = 'critical' | 'moderate' | 'info';

export interface ValidationWarning {
  type: WarningType;
  field: string;
  message: string;
  lineNumber: number;
}

export interface ValidationResult {
  warnings: ValidationWarning[];
  lineNumber: number;
  data: Record<string, any>;
}

export interface ValidationCache {
  veiculos: Map<string, string>; // placa -> id
  motoristas: Map<string, string>; // nome -> id
}

/**
 * Verifica se campo está vazio
 */
function isEmpty(value: any): boolean {
  return value === null || value === undefined || value === '';
}

/**
 * Valida formato de placa
 */
function isValidPlaca(placa: string): boolean {
  if (!placa) return false;
  // Formato antigo: ABC1234 ou ABC-1234
  // Formato Mercosul: ABC1D23
  const regex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
  return regex.test(placa.replace('-', ''));
}

/**
 * Valida veículos
 */
export function validateVeiculo(
  row: Record<string, any>,
  lineNumber: number,
  existingPlacas: Set<string>
): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // Placa - campo essencial
  if (isEmpty(row.placa)) {
    warnings.push({
      type: 'critical',
      field: 'placa',
      message: 'Campo PLACA está vazio (essencial)',
      lineNumber,
    });
  } else if (!isValidPlaca(row.placa)) {
    warnings.push({
      type: 'moderate',
      field: 'placa',
      message: `Formato de placa inválido: ${row.placa}`,
      lineNumber,
    });
  } else if (existingPlacas.has(row.placa)) {
    warnings.push({
      type: 'info',
      field: 'placa',
      message: `Veículo ${row.placa} já existe e será ATUALIZADO`,
      lineNumber,
    });
  }

  // Ano
  if (!isEmpty(row.ano)) {
    const ano = Number(row.ano);
    const anoAtual = new Date().getFullYear();
    if (ano < 1900 || ano > anoAtual + 1) {
      warnings.push({
        type: 'moderate',
        field: 'ano',
        message: `Ano fora do range válido: ${ano}`,
        lineNumber,
      });
    }
  } else {
    warnings.push({
      type: 'info',
      field: 'ano',
      message: 'Campo ANO está vazio',
      lineNumber,
    });
  }

  // Tipo
  if (!isEmpty(row.tipo)) {
    const tiposValidos = TIPOS_VEICULO.map(t => t.toLowerCase());
    if (!tiposValidos.includes(row.tipo?.toLowerCase())) {
      warnings.push({
        type: 'moderate',
        field: 'tipo',
        message: `Tipo de veículo não reconhecido: ${row.tipo}`,
        lineNumber,
      });
    }
  }

  // Campos opcionais vazios
  if (isEmpty(row.fabricante)) {
    warnings.push({
      type: 'info',
      field: 'fabricante',
      message: 'Campo FABRICANTE está vazio',
      lineNumber,
    });
  }

  if (isEmpty(row.modelo)) {
    warnings.push({
      type: 'info',
      field: 'modelo',
      message: 'Campo MODELO está vazio',
      lineNumber,
    });
  }

  return { warnings, lineNumber, data: row };
}

/**
 * Valida entregas
 */
export function validateEntrega(
  row: Record<string, any>,
  lineNumber: number
): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // Campos essenciais do template simplificado
  if (isEmpty(row.nf)) {
    warnings.push({
      type: 'critical',
      field: 'nf',
      message: 'Campo NF está vazio (essencial)',
      lineNumber,
    });
  }

  if (isEmpty(row.cliente)) {
    warnings.push({
      type: 'critical',
      field: 'cliente',
      message: 'Campo CLIENTE está vazio (essencial)',
      lineNumber,
    });
  }

  // Data de saída
  if (isEmpty(row.data_saida)) {
    warnings.push({
      type: 'critical',
      field: 'data_saida',
      message: 'Campo DATA DE SAÍDA está vazio (essencial)',
      lineNumber,
    });
  }

  // Valor
  if (isEmpty(row.valor)) {
    warnings.push({
      type: 'moderate',
      field: 'valor',
      message: 'Campo VALOR está vazio',
      lineNumber,
    });
  } else if (Number(row.valor) <= 0) {
    warnings.push({
      type: 'moderate',
      field: 'valor',
      message: `VALOR inválido: ${row.valor}`,
      lineNumber,
    });
  }

  // UF
  if (isEmpty(row.uf)) {
    warnings.push({
      type: 'moderate',
      field: 'uf',
      message: 'Campo UF está vazio',
      lineNumber,
    });
  } else if (!ESTADOS_BRASILEIROS.includes(row.uf as any)) {
    warnings.push({
      type: 'moderate',
      field: 'uf',
      message: `UF inválida: ${row.uf}`,
      lineNumber,
    });
  }

  // Status
  if (!isEmpty(row.status)) {
    const statusValidos = ['PENDENTE', 'EM ROTA', 'CONCLUIDO', 'CANCELADO'];
    if (!statusValidos.includes(row.status)) {
      warnings.push({
        type: 'moderate',
        field: 'status',
        message: `Status não reconhecido: ${row.status}`,
        lineNumber,
      });
    }
  }

  // Montagem
  if (row.precisa_montagem === true && isEmpty(row.data_montagem)) {
    warnings.push({
      type: 'moderate',
      field: 'data_montagem',
      message: 'PRECISA MONTAGEM = SIM mas DATA MONTAGEM está vazia',
      lineNumber,
    });
  }

  return { warnings, lineNumber, data: row };
}

/**
 * Valida abastecimentos
 */
export function validateAbastecimento(
  row: Record<string, any>,
  lineNumber: number,
  cache: ValidationCache
): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // Data - essencial
  if (isEmpty(row.data)) {
    warnings.push({
      type: 'critical',
      field: 'data',
      message: 'Campo DATA está vazio (essencial)',
      lineNumber,
    });
  }

  // Veículo
  if (isEmpty(row.veiculo)) {
    warnings.push({
      type: 'critical',
      field: 'veiculo',
      message: 'Campo VEÍCULO está vazio (essencial)',
      lineNumber,
    });
  } else if (!cache.veiculos.has(row.veiculo)) {
    warnings.push({
      type: 'critical',
      field: 'veiculo',
      message: `Veículo "${row.veiculo}" não existe. O registro será IGNORADO.`,
      lineNumber,
    });
  }

  // Condutor
  if (isEmpty(row.condutor)) {
    warnings.push({
      type: 'critical',
      field: 'condutor',
      message: 'Campo CONDUTOR está vazio (essencial)',
      lineNumber,
    });
  } else if (!cache.motoristas.has(row.condutor.toLowerCase())) {
    warnings.push({
      type: 'info',
      field: 'condutor',
      message: `Condutor "${row.condutor}" não existe e será CRIADO automaticamente`,
      lineNumber,
    });
  }

  // Litros
  if (isEmpty(row.litros)) {
    warnings.push({
      type: 'moderate',
      field: 'litros',
      message: 'Campo LITROS está vazio',
      lineNumber,
    });
  } else if (Number(row.litros) <= 0) {
    warnings.push({
      type: 'moderate',
      field: 'litros',
      message: `LITROS inválido: ${row.litros}`,
      lineNumber,
    });
  }

  // Valor unitário
  if (isEmpty(row.valor_unitario)) {
    warnings.push({
      type: 'moderate',
      field: 'valor_unitario',
      message: 'Campo VALOR UN. está vazio',
      lineNumber,
    });
  } else if (Number(row.valor_unitario) <= 0) {
    warnings.push({
      type: 'moderate',
      field: 'valor_unitario',
      message: `VALOR UN. inválido: ${row.valor_unitario}`,
      lineNumber,
    });
  }

  // Valor total - validar se bate com litros * valor_unitario
  if (!isEmpty(row.litros) && !isEmpty(row.valor_unitario) && !isEmpty(row.valor_total)) {
    const calculado = Number(row.litros) * Number(row.valor_unitario);
    const informado = Number(row.valor_total);
    const diferenca = Math.abs(calculado - informado);

    if (diferenca > 0.05) {
      warnings.push({
        type: 'moderate',
        field: 'valor_total',
        message: `VALOR TOTAL (${informado.toFixed(2)}) difere do calculado (${calculado.toFixed(2)})`,
        lineNumber,
      });
    }
  }

  // UF
  if (!isEmpty(row.estado) && !ESTADOS_BRASILEIROS.includes(row.estado as any)) {
    warnings.push({
      type: 'moderate',
      field: 'estado',
      message: `UF inválida: ${row.estado}`,
      lineNumber,
    });
  }

  // Produto
  if (!isEmpty(row.produto)) {
    const produtosValidos = ['Arla-32', 'Diesel S-10'];
    if (!produtosValidos.includes(row.produto)) {
      warnings.push({
        type: 'moderate',
        field: 'produto',
        message: `Produto não reconhecido: ${row.produto}`,
        lineNumber,
      });
    }
  }

  return { warnings, lineNumber, data: row };
}

/**
 * Valida manutenções
 */
export function validateManutencao(
  row: Record<string, any>,
  lineNumber: number,
  cache: ValidationCache
): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // Data - essencial
  if (isEmpty(row.data)) {
    warnings.push({
      type: 'critical',
      field: 'data',
      message: 'Campo DATA está vazio (essencial)',
      lineNumber,
    });
  } else {
    const dataManutencao = new Date(row.data);
    const hoje = new Date();
    if (dataManutencao > hoje) {
      warnings.push({
        type: 'moderate',
        field: 'data',
        message: 'DATA é futura',
        lineNumber,
      });
    }
  }

  // Placa - essencial
  if (isEmpty(row.placa)) {
    warnings.push({
      type: 'critical',
      field: 'placa',
      message: 'Campo PLACA está vazio (essencial)',
      lineNumber,
    });
  } else if (!cache.veiculos.has(row.placa)) {
    warnings.push({
      type: 'info',
      field: 'placa',
      message: `Veículo "${row.placa}" não existe e será CRIADO automaticamente`,
      lineNumber,
    });
  }

  // Custo total
  if (isEmpty(row.custo_total)) {
    warnings.push({
      type: 'moderate',
      field: 'custo_total',
      message: 'Campo CUSTO TOTAL está vazio',
      lineNumber,
    });
  } else if (Number(row.custo_total) <= 0) {
    warnings.push({
      type: 'moderate',
      field: 'custo_total',
      message: `CUSTO TOTAL inválido: ${row.custo_total}`,
      lineNumber,
    });
  }

  // KM Manutenção
  if (isEmpty(row.km_manutencao)) {
    warnings.push({
      type: 'moderate',
      field: 'km_manutencao',
      message: 'Campo KM MANUTENÇÃO está vazio',
      lineNumber,
    });
  } else if (Number(row.km_manutencao) <= 0) {
    warnings.push({
      type: 'moderate',
      field: 'km_manutencao',
      message: `KM MANUTENÇÃO inválido: ${row.km_manutencao}`,
      lineNumber,
    });
  }

  return { warnings, lineNumber, data: row };
}

/**
 * Valida motoristas
 */
export function validateMotorista(
  row: Record<string, any>,
  lineNumber: number
): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // Nome - essencial
  if (isEmpty(row.nome)) {
    warnings.push({
      type: 'critical',
      field: 'nome',
      message: 'Campo NOME está vazio (essencial)',
      lineNumber,
    });
  }

  // Função (mantido para compatibilidade com importações antigas)
  if (!isEmpty(row.funcao)) {
    const funcoesValidas = ['Motorista', 'Condutor'];
    if (!funcoesValidas.includes(row.funcao)) {
      warnings.push({
        type: 'moderate',
        field: 'funcao',
        message: `Função não reconhecida: ${row.funcao}. Será convertida para "Motorista".`,
        lineNumber,
      });
    }
  }

  // Categoria CNH
  if (!isEmpty(row.categoria_cnh)) {
    const categoriasValidas = ['A', 'B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE'];
    if (!categoriasValidas.includes(row.categoria_cnh)) {
      warnings.push({
        type: 'moderate',
        field: 'categoria_cnh',
        message: `Categoria CNH inválida: ${row.categoria_cnh}`,
        lineNumber,
      });
    }
  }

  return { warnings, lineNumber, data: row };
}

/**
 * Valida montadores
 */
export function validateMontador(
  row: Record<string, any>,
  lineNumber: number
): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // Nome - essencial
  if (isEmpty(row.nome)) {
    warnings.push({
      type: 'critical',
      field: 'nome',
      message: 'Campo NOME está vazio (essencial)',
      lineNumber,
    });
  }

  return { warnings, lineNumber, data: row };
}

/**
 * Valida todas as linhas de acordo com o tipo
 */
export function validateAll(
  rows: Record<string, any>[],
  type: ImportType,
  cache: ValidationCache,
  existingPlacas?: Set<string>
): ValidationResult[] {
  return rows.map((row, index) => {
    const lineNumber = index + 2; // +2 porque linha 1 é header e index começa em 0

    switch (type) {
      case 'veiculos':
        return validateVeiculo(row, lineNumber, existingPlacas || new Set());
      case 'entregas':
        return validateEntrega(row, lineNumber);
      case 'abastecimentos':
        return validateAbastecimento(row, lineNumber, cache);
      case 'manutencoes':
        return validateManutencao(row, lineNumber, cache);
      case 'motoristas':
        return validateMotorista(row, lineNumber);
      case 'montadores':
        return validateMontador(row, lineNumber);
      default:
        return { warnings: [], lineNumber, data: row };
    }
  });
}

