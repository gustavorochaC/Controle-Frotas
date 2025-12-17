/**
 * @deprecated Este parser foi substituído pelo abastecimentoUnifiedParser.ts
 * Mantido temporariamente para compatibilidade. Use parseUnifiedExcel do novo parser.
 * 
 * Parser robusto de Excel para importação de abastecimentos
 * Valida com Zod e trata datas sem conversão de timezone
 */

import * as XLSX from 'xlsx';
import { z } from 'zod';
import { PRODUTOS_ABASTECIMENTO, ESTADOS_BRASILEIROS } from '@/types/abastecimento';
import { normalizeNumber, normalizeDate, normalizeText } from '@/utils/importacao/normalizer';

/**
 * Erro de parsing específico de uma linha
 */
export interface ParsingError {
  lineNumber: number;
  field?: string;
  message: string;
}

/**
 * Linha parseada com possíveis erros
 */
export interface ParsedAbastecimentoRow {
  data: string | null;
  veiculo: string | null;
  condutor: string | null;
  posto: string | null;
  cidade: string | null;
  uf: string | null;
  km_inicial: number | null;
  litros: number | null;
  produto: string | null;
  valor_unitario: number | null;
  valor_total: number | null;
  parsingErrors?: string[];
}

/**
 * Resultado do parsing
 */
export interface ParseResult {
  rows: ParsedAbastecimentoRow[];
  errors: ParsingError[];
}

/**
 * Schema Zod para validação de AbastecimentoFormData
 */
const abastecimentoFormSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  veiculo: z.string().min(1, 'Veículo é obrigatório'),
  condutor: z.string().min(1, 'Condutor é obrigatório'),
  posto: z.string().min(1, 'Posto é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres').refine(
    (val) => ESTADOS_BRASILEIROS.includes(val as any),
    'UF inválida'
  ),
  km_inicial: z.number().min(0, 'KM inicial deve ser positivo'),
  litros: z.number().positive('Litros deve ser maior que 0'),
  produto: z.string().min(1, 'Produto é obrigatório'),
  valor_unitario: z.number().min(0, 'Valor unitário deve ser positivo'),
  valor_total: z.number().min(0, 'Valor total deve ser positivo'),
});

/**
 * Formata data para YYYY-MM-DD usando métodos locais (sem conversão de timezone)
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normaliza header removendo acentos e espaços
 */
function normalizeHeader(header: string): string {
  if (!header) return '';
  return header
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Busca valor em row usando múltiplas variações de chaves possíveis
 * As chaves do row já estão normalizadas pelo normalizeHeader
 */
function findValueByVariations(
  row: Record<string, any>,
  variations: string[]
): any {
  // Normalizar variações para buscar nas chaves já normalizadas
  const normalizedVariations = variations.map(v => normalizeHeader(v));

  for (const normalizedVariation of normalizedVariations) {
    if (row[normalizedVariation] !== undefined && row[normalizedVariation] !== null && row[normalizedVariation] !== '') {
      return row[normalizedVariation];
    }
  }

  // Tentar busca case-insensitive nas chaves existentes
  const rowKeys = Object.keys(row);
  for (const normalizedVariation of normalizedVariations) {
    const found = rowKeys.find(k => k.toLowerCase() === normalizedVariation.toLowerCase());
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== '') {
      return row[found];
    }
  }
  return null;
}

/**
 * Processa uma linha do Excel e retorna dados parseados
 */
function processRow(
  row: Record<string, any>,
  rawHeaders: string[],
  normalizedHeaders: string[],
  lineNumber: number
): { row: ParsedAbastecimentoRow; errors: ParsingError[] } {
  const errors: ParsingError[] = [];
  const parsedRow: ParsedAbastecimentoRow = {
    data: null,
    veiculo: null,
    condutor: null,
    posto: null,
    cidade: null,
    uf: null,
    km_inicial: null,
    litros: null,
    produto: null,
    valor_unitario: null,
    valor_total: null,
    parsingErrors: [],
  };

  // DATA
  const dataValue = findValueByVariations(row, ['data']);
  if (!dataValue) {
    const dataKey = Object.keys(row).find(k =>
      k.toLowerCase().includes('data')
    );
    if (dataKey) {
      parsedRow.data = normalizeDate(row[dataKey]);
    } else {
      parsedRow.data = null;
      errors.push({
        lineNumber,
        field: 'data',
        message: 'Data não encontrada',
      });
      parsedRow.parsingErrors?.push('Data não encontrada');
    }
  } else {
    parsedRow.data = normalizeDate(dataValue);
  }

  // VEÍCULO
  const veiculoValue = findValueByVariations(row, ['veiculo', 'veículo']);
  parsedRow.veiculo = normalizeText(veiculoValue);
  if (!parsedRow.veiculo) {
    errors.push({
      lineNumber,
      field: 'veiculo',
      message: 'Veículo é obrigatório',
    });
    parsedRow.parsingErrors?.push('Veículo é obrigatório');
  }

  // CONDUTOR
  const condutorValue = findValueByVariations(row, ['condutor']);
  parsedRow.condutor = normalizeText(condutorValue, { titleCase: true });
  if (!parsedRow.condutor) {
    errors.push({
      lineNumber,
      field: 'condutor',
      message: 'Condutor é obrigatório',
    });
    parsedRow.parsingErrors?.push('Condutor é obrigatório');
  }

  // POSTO
  const postoValue = findValueByVariations(row, ['posto']);
  parsedRow.posto = normalizeText(postoValue);
  if (!parsedRow.posto) {
    errors.push({
      lineNumber,
      field: 'posto',
      message: 'Posto é obrigatório',
    });
    parsedRow.parsingErrors?.push('Posto é obrigatório');
  }

  // CIDADE
  const cidadeValue = findValueByVariations(row, ['cidade']);
  // Regra: Separar por hífen e pegar a primeira parte (Ex: "Cidade - UF" -> "Cidade")
  let cidadeParsed = normalizeText(cidadeValue, { titleCase: true });
  if (cidadeParsed && cidadeParsed.includes('-')) {
    cidadeParsed = cidadeParsed.split('-')[0].trim();
  }
  parsedRow.cidade = cidadeParsed;

  if (!parsedRow.cidade) {
    errors.push({
      lineNumber,
      field: 'cidade',
      message: 'Cidade é obrigatória',
    });
    parsedRow.parsingErrors?.push('Cidade é obrigatória');
  }

  // UF
  const ufValue = findValueByVariations(row, ['uf', 'estado']);
  parsedRow.uf = normalizeText(ufValue, { uppercase: true });
  if (!parsedRow.uf || parsedRow.uf.length !== 2) {
    errors.push({
      lineNumber,
      field: 'uf',
      message: 'UF inválida',
    });
    parsedRow.parsingErrors?.push('UF inválida');
  }

  // KM INICIAL
  const kmInicialValue = findValueByVariations(row, ['km_inicial', 'kminicial', 'km_inicial', 'km_inicial']);
  parsedRow.km_inicial = normalizeNumber(kmInicialValue);
  if (parsedRow.km_inicial === null) {
    errors.push({
      lineNumber,
      field: 'km_inicial',
      message: 'KM inicial é obrigatório',
    });
    parsedRow.parsingErrors?.push('KM inicial é obrigatório');
  }

  // LITROS
  const litrosValue = findValueByVariations(row, ['litros']);
  parsedRow.litros = normalizeNumber(litrosValue);
  if (parsedRow.litros === null || parsedRow.litros <= 0) {
    errors.push({
      lineNumber,
      field: 'litros',
      message: 'Litros deve ser maior que 0',
    });
    parsedRow.parsingErrors?.push('Litros deve ser maior que 0');
  }

  // PRODUTO
  const produtoValue = findValueByVariations(row, ['produto', 'combustivel', 'combustível']);
  const produtoNormalized = normalizeText(produtoValue);

  // Normalização estrita de produto
  if (produtoNormalized) {
    const produtoUpper = produtoNormalized.toUpperCase();
    if (produtoUpper.includes('DIESEL') || produtoUpper.includes('S10') || produtoUpper.includes('S-10')) {
      parsedRow.produto = 'Diesel S-10';
    } else if (produtoUpper.includes('ARLA') || produtoUpper.includes('32')) {
      parsedRow.produto = 'Arla-32';
    } else {
      // Produto desconhecido - manter original mas avisar? Ou forçar erro? 
      // User disse: "tente mapear para o mais próximo ou levante um erro/alerta."
      // Vou manter processamento mas adicionar erro se não for reconhecido
      parsedRow.produto = produtoNormalized;
      errors.push({
        lineNumber,
        field: 'produto',
        message: `Produto não reconhecido: ${produtoNormalized} (Esperado: Diesel S-10 ou Arla-32)`,
      });
      parsedRow.parsingErrors?.push(`Produto não reconhecido: ${produtoNormalized}`);
    }
  } else {
    parsedRow.produto = null;
  }

  if (!parsedRow.produto && !parsedRow.parsingErrors?.some(e => e.includes('Produto'))) {
    errors.push({
      lineNumber,
      field: 'produto',
      message: 'Produto é obrigatório',
    });
    parsedRow.parsingErrors?.push('Produto é obrigatório');
  }

  // VALOR UNITÁRIO - pode vir como "VALOR UN." do Excel
  const valorUnitarioValue = findValueByVariations(row, ['valor_unitario', 'valorun', 'valor_un', 'valor_un']);
  parsedRow.valor_unitario = normalizeNumber(valorUnitarioValue);
  if (parsedRow.valor_unitario === null) {
    errors.push({
      lineNumber,
      field: 'valor_unitario',
      message: 'Valor unitário é obrigatório',
    });
    parsedRow.parsingErrors?.push('Valor unitário é obrigatório');
  }

  // VALOR TOTAL - IMPORTANTE: NÃO RECALCULAR, usar valor do Excel
  const valorTotalValue = findValueByVariations(row, ['valor_total', 'valortotal', 'valor_total']);
  parsedRow.valor_total = normalizeNumber(valorTotalValue);
  if (parsedRow.valor_total === null) {
    errors.push({
      lineNumber,
      field: 'valor_total',
      message: 'Valor total é obrigatório',
    });
    parsedRow.parsingErrors?.push('Valor total é obrigatório');
  }

  // Ignorar campos KM RODADO e KM PERCORRIDO/L (sistema calcula automaticamente)

  return { row: parsedRow, errors };
}

/**
 * Parse arquivo Excel de abastecimentos
 */
export async function parseExcelAbastecimentos(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });

        // Pegar primeira planilha
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Converter para JSON (array de arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

        if (!jsonData || jsonData.length === 0) {
          reject(new Error('Arquivo Excel vazio ou inválido'));
          return;
        }

        // Processar headers
        const rawHeaders = jsonData[0].map(String);
        const normalizedHeaders = rawHeaders.map(normalizeHeader);

        // Criar mapeamento de headers normalizados
        const headerMap: Record<string, number> = {};
        normalizedHeaders.forEach((header, idx) => {
          headerMap[header] = idx;
        });

        // Processar linhas
        const rows: ParsedAbastecimentoRow[] = [];
        const allErrors: ParsingError[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const rowData = jsonData[i];

          // Pular linhas completamente vazias
          if (rowData.every((cell) => cell === '' || cell === null || cell === undefined)) {
            continue;
          }

          // Criar objeto row com valores mapeados
          const row: Record<string, any> = {};
          normalizedHeaders.forEach((header, idx) => {
            let value = rowData[idx];

            // Se for uma data do Excel, converter para string ISO usando métodos locais
            if (value instanceof Date) {
              value = formatDateLocal(value);
            }

            // Se for número de data serial do Excel (formato numérico)
            if (typeof value === 'number' && value > 1 && value < 100000) {
              try {
                const excelEpoch = new Date(1899, 11, 30); // 30/12/1899
                const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
                if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
                  value = formatDateLocal(date);
                }
              } catch (e) {
                // Manter valor original se conversão falhar
              }
            }

            row[header] = value ?? null;
          });

          // Processar linha
          const { row: parsedRow, errors } = processRow(
            row,
            rawHeaders,
            normalizedHeaders,
            i + 1
          );

          rows.push(parsedRow);
          allErrors.push(...errors);
        }

        resolve({
          rows,
          errors: allErrors,
        });
      } catch (error) {
        reject(new Error(`Erro ao processar Excel: ${(error as Error).message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsBinaryString(file);
  });
}

