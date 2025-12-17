/**
 * Parser robusto de Excel para importação de entregas
 * Trata coluna aglutinada (PV FOCO + NF), mapeia montadores dinamicamente e valida com Zod
 */

import * as XLSX from 'xlsx';
import { z } from 'zod';
import { EntregaFormData, StatusEntrega, ESTADOS_BRASILEIROS } from '@/types/entrega';
import { normalizeNumber, normalizeDate, normalizeText, normalizeBoolean, normalizeStatus } from '@/utils/importacao/normalizer';

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
export interface ParsedEntregaRow {
  pv_foco: string | null;
  nf: string | null;
  valor: number | null;
  cliente: string | null;
  uf: string | null;
  data_saida: string | null;
  motorista: string | null;
  carro: string | null;
  tipo_transporte: string | null;
  status: StatusEntrega | null;
  precisa_montagem: boolean | null;
  data_montagem: string | null;
  montador_1: string | null;
  montador_2: string | null;
  gastos_entrega: number | null;
  gastos_montagem: number | null;
  produtividade: number | null;
  erros: string | null;
  percentual_gastos: number | null;
  descricao_erros: string | null;
  parsingErrors?: string[];
}

/**
 * Resultado do parsing
 */
export interface ParseResult {
  rows: ParsedEntregaRow[];
  errors: ParsingError[];
}

/**
 * Schema Zod para validação de EntregaFormData
 */
const entregaFormSchema = z.object({
  pv_foco: z.string().optional(),
  nf: z.string().min(1, 'NF é obrigatória'),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres').refine(
    (val) => ESTADOS_BRASILEIROS.includes(val as any),
    'UF inválida'
  ),
  data_saida: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  motorista: z.string().min(1, 'Motorista é obrigatório'),
  carro: z.string().optional(),
  tipo_transporte: z.string().optional(),
  status: z.enum(['PENDENTE', 'EM ROTA', 'CONCLUIDO', 'CANCELADO']),
  precisa_montagem: z.boolean(),
  data_montagem: z.string().optional(),
  montador_1: z.string().optional(),
  montador_2: z.string().optional(),
  gastos_entrega: z.number().min(0).optional(),
  gastos_montagem: z.number().min(0).optional(),
  produtividade: z.number().optional(),
  erros: z.string().optional(),
  percentual_gastos: z.number().min(0).max(100).optional(),
  descricao_erros: z.string().optional(),
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
 * Separa primeira coluna aglutinada (PV FOCO + NF)
 * Exemplo: "5134 DECLARAÇÃO" -> { pv_foco: "5134", nf: "DECLARAÇÃO" }
 */
function parseAglutinatedColumn(value: any): { pv_foco: string | null; nf: string | null; error?: string } {
  if (!value || value === '') {
    return { pv_foco: null, nf: null };
  }

  const strValue = String(value).trim();
  const regex = /^(\d+)\s+(.*)$/;
  const match = strValue.match(regex);

  if (!match) {
    return {
      pv_foco: null,
      nf: null,
      error: `Não foi possível separar PV FOCO e NF da coluna aglutinada: "${strValue}"`,
    };
  }

  return {
    pv_foco: match[1],
    nf: match[2].trim(),
  };
}

/**
 * Processa montadores das colunas MONTADOR 1-7
 * Retorna montador_1, montador_2 e montadores excedentes para descricao_erros
 */
function processMontadores(row: Record<string, any>): {
  montador_1: string | null;
  montador_2: string | null;
  excessMontadores: string[];
} {
  const montadores: string[] = [];

  // Ler colunas MONTADOR 1 até MONTADOR 7
  for (let i = 1; i <= 7; i++) {
    const key = `montador_${i}`;
    const value = row[key];
    if (value && String(value).trim() !== '') {
      montadores.push(String(value).trim());
    }
  }

  return {
    montador_1: montadores[0] || null,
    montador_2: montadores[1] || null,
    excessMontadores: montadores.slice(2), // Montadores 3, 4, 5, 6, 7
  };
}

/**
 * Calcula percentual de gastos se não estiver preenchido
 */
function calculatePercentualGastos(
  percentualGastos: number | null,
  gastosEntrega: number | null,
  gastosMontagem: number | null,
  valor: number | null
): number | null {
  // Se já tem valor, retornar
  if (percentualGastos !== null && percentualGastos !== undefined) {
    return percentualGastos;
  }

  // Se não tem valor ou valor é zero, não calcular
  if (!valor || valor === 0) {
    return null;
  }

  const totalGastos = (gastosEntrega || 0) + (gastosMontagem || 0);
  if (totalGastos === 0) {
    return null;
  }

  return (totalGastos / valor) * 100;
}

/**
 * Busca valor em row usando múltiplas variações de chaves possíveis
 */
function findValueByVariations(
  row: Record<string, any>,
  variations: string[]
): any {
  for (const variation of variations) {
    if (row[variation] !== undefined && row[variation] !== null && row[variation] !== '') {
      return row[variation];
    }
  }
  // Tentar busca case-insensitive
  const rowKeys = Object.keys(row);
  for (const variation of variations) {
    const found = rowKeys.find(k => k.toLowerCase() === variation.toLowerCase());
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
  lineNumber: number,
  firstColumnIsAglutinated: boolean
): { row: ParsedEntregaRow; errors: ParsingError[] } {
  const errors: ParsingError[] = [];
  const parsedRow: ParsedEntregaRow = {
    pv_foco: null,
    nf: null,
    valor: null,
    cliente: null,
    uf: null,
    data_saida: null,
    motorista: null,
    carro: null,
    tipo_transporte: null,
    status: null,
    precisa_montagem: null,
    data_montagem: null,
    montador_1: null,
    montador_2: null,
    gastos_entrega: null,
    gastos_montagem: null,
    produtividade: null,
    erros: null,
    percentual_gastos: null,
    descricao_erros: null,
    parsingErrors: [],
  };

  // 1. Processar primeira coluna aglutinada (se detectada)
  if (firstColumnIsAglutinated && normalizedHeaders[0]) {
    const firstColumnValue = row[normalizedHeaders[0]];
    const parsed = parseAglutinatedColumn(firstColumnValue);
    parsedRow.pv_foco = parsed.pv_foco;
    parsedRow.nf = parsed.nf;
    if (parsed.error) {
      errors.push({
        lineNumber,
        field: rawHeaders[0] || 'Primeira coluna',
        message: parsed.error,
      });
      parsedRow.parsingErrors?.push(parsed.error);
    }
  } else {
    // Se não for aglutinada, ler campos separados
    parsedRow.pv_foco = normalizeText(row.pv_foco || row.pv || row.pvfoco);
    parsedRow.nf = normalizeText(row.nf || row.nota_fiscal);
  }

  // 2. Processar campos básicos
  parsedRow.valor = normalizeNumber(row.valor);
  parsedRow.cliente = normalizeText(row.cliente);
  
  // UF: tentar múltiplas variações de headers normalizados
  const ufValue = findValueByVariations(row, ['uf', 'estado']);
  parsedRow.uf = normalizeText(ufValue, { uppercase: true });
  
  // DATA SAÍDA: tentar múltiplas variações
  const dataSaidaValue = findValueByVariations(row, [
    'data_de_saida',
    'data_saida', 
    'datasaida',
    'data_de_saida',
    'data_saida'
  ]);
  // Se não encontrou, tentar buscar por padrão parcial
  if (!dataSaidaValue) {
    const dataSaidaKey = Object.keys(row).find(k => 
      k.toLowerCase().includes('data') && 
      (k.toLowerCase().includes('saida') || k.toLowerCase().includes('saída'))
    );
    if (dataSaidaKey) {
      parsedRow.data_saida = normalizeDate(row[dataSaidaKey]);
    } else {
      parsedRow.data_saida = null;
    }
  } else {
    parsedRow.data_saida = normalizeDate(dataSaidaValue);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'excelParser.ts:processRow:data_saida',message:'data_saida processada',data:{input:dataSaidaValue,inputType:typeof dataSaidaValue,output:parsedRow.data_saida,lineNumber},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }
  
  parsedRow.motorista = normalizeText(row.motorista, { titleCase: true });
  
  // CARRO: tentar múltiplas variações
  // Usar normalizeText para preservar valor original (fabricante)
  // O match com veículos será feito posteriormente na importação
  const carroValue = findValueByVariations(row, ['carro', 'veiculo']);
  parsedRow.carro = normalizeText(carroValue);
  
  // TIPO TRANSPORTE: tentar múltiplas variações (incluindo "tipo_de_transporte" que vem da normalização)
  const tipoTransporteValue = findValueByVariations(row, [
    'tipo_de_transporte',
    'tipo_transporte',
    'tipo',
    'tipotransporte'
  ]);
  // Se não encontrou, tentar buscar por padrão parcial
  if (!tipoTransporteValue) {
    const tipoTransporteKey = Object.keys(row).find(k => 
      k.toLowerCase().includes('tipo') && 
      (k.toLowerCase().includes('transporte') || k.toLowerCase().includes('transporte'))
    );
    if (tipoTransporteKey) {
      parsedRow.tipo_transporte = normalizeText(row[tipoTransporteKey]);
    } else {
      parsedRow.tipo_transporte = null;
    }
  } else {
    parsedRow.tipo_transporte = normalizeText(tipoTransporteValue);
  }
  
  parsedRow.status = normalizeStatus(row.status) as StatusEntrega | null;
  parsedRow.precisa_montagem = normalizeBoolean(row.precisa_de_montagem || row.precisa_montagem || row.precisamontagem);
  
  // DATA MONTAGEM: tentar múltiplas variações
  const dataMontagemValue = findValueByVariations(row, [
    'data_da_montagem',
    'data_montagem', 
    'datamontagem'
  ]);
  // Se não encontrou, tentar buscar por padrão parcial
  if (!dataMontagemValue) {
    const dataMontagemKey = Object.keys(row).find(k => 
      k.toLowerCase().includes('data') && 
      k.toLowerCase().includes('montagem')
    );
    if (dataMontagemKey) {
      parsedRow.data_montagem = normalizeDate(row[dataMontagemKey]);
    } else {
      parsedRow.data_montagem = null;
    }
  } else {
    parsedRow.data_montagem = normalizeDate(dataMontagemValue);
  }

  // 3. Processar montadores (MONTADOR 1-7)
  const montadoresData = processMontadores(row);
  parsedRow.montador_1 = normalizeText(montadoresData.montador_1, { titleCase: true });
  parsedRow.montador_2 = normalizeText(montadoresData.montador_2, { titleCase: true });

  // Adicionar montadores excedentes ao descricao_erros
  if (montadoresData.excessMontadores.length > 0) {
    const excessText = `Montadores adicionais: ${montadoresData.excessMontadores.join(', ')}`;
    const existingDescricao = parsedRow.descricao_erros || '';
    parsedRow.descricao_erros = existingDescricao
      ? `${existingDescricao}. ${excessText}`
      : excessText;
  }

  // 4. Processar gastos e produtividade
  parsedRow.gastos_entrega = normalizeNumber(
    row.gastos_com_entrega || row.gastos_entrega || row.gastosentrega
  );
  parsedRow.gastos_montagem = normalizeNumber(
    row.gastos_com_montagem || row.gastos_montagem || row.gastosmontagem
  );
  parsedRow.produtividade = normalizeNumber(row.produtividade);
  
  // ERROS: tentar múltiplas variações
  const errosValue = findValueByVariations(row, ['erros']);
  parsedRow.erros = normalizeText(errosValue);

  // 5. Calcular % GASTOS se não estiver preenchido
  parsedRow.percentual_gastos = calculatePercentualGastos(
    normalizeNumber(row.percentual_gastos || row.gastos || row['%_gastos']),
    parsedRow.gastos_entrega,
    parsedRow.gastos_montagem,
    parsedRow.valor
  );

  // 6. Processar descrição de erros (se não foi preenchida pelos montadores excedentes)
  if (!parsedRow.descricao_erros) {
    parsedRow.descricao_erros = normalizeText(
      row.descricao_dos_erros || row.descricao_erros || row.descricaoerros
    );
  }

  return { row: parsedRow, errors };
}

/**
 * Detecta se a primeira coluna é aglutinada (PV FOCO + NF)
 */
function detectAglutinatedColumn(headers: string[]): boolean {
  if (headers.length === 0) return false;

  const firstHeader = headers[0].toLowerCase();
  // Verificar se o header contém "pv" ou "foco" mas não tem coluna separada "nf"
  const hasPVFoco = firstHeader.includes('pv') || firstHeader.includes('foco');
  const hasSeparateNF = headers.some((h) => h.toLowerCase().includes('nf') || h.toLowerCase().includes('nota'));

  // Se tem PV FOCO mas não tem NF separado, provavelmente é aglutinado
  return hasPVFoco && !hasSeparateNF;
}

/**
 * Parse arquivo Excel de entregas
 */
export async function parseExcelEntregas(file: File): Promise<ParseResult> {
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

        // Detectar se primeira coluna é aglutinada
        const firstColumnIsAglutinated = detectAglutinatedColumn(rawHeaders);

        // Criar mapeamento de headers normalizados para índices e também mapeamento reverso
        const headerMap: Record<string, number> = {};
        const headerVariations: Record<string, string[]> = {};
        
        normalizedHeaders.forEach((header, idx) => {
          // Mapear variações de montadores
          if (header.includes('montador')) {
            const match = header.match(/montador[_\s]*(\d+)/);
            if (match) {
              headerMap[`montador_${match[1]}`] = idx;
            }
          }
          headerMap[header] = idx;
          
          // Criar variações comuns para busca flexível
          // UF
          if (header === 'uf' || header.includes('uf') && !header.includes('foco')) {
            if (!headerVariations['uf']) headerVariations['uf'] = [];
            headerVariations['uf'].push(header);
          }
          if (header === 'estado') {
            if (!headerVariations['uf']) headerVariations['uf'] = [];
            headerVariations['uf'].push(header);
          }
          
          // DATA DE SAÍDA
          if (header.includes('data') && (header.includes('saida') || header.includes('saída'))) {
            if (!headerVariations['data_saida']) headerVariations['data_saida'] = [];
            headerVariations['data_saida'].push(header);
          }
          
          // DATA DA MONTAGEM
          if (header.includes('data') && header.includes('montagem')) {
            if (!headerVariations['data_montagem']) headerVariations['data_montagem'] = [];
            headerVariations['data_montagem'].push(header);
          }
        });

        // Processar linhas
        const rows: ParsedEntregaRow[] = [];
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
            // Excel armazena datas como número de dias desde 01/01/1900
            if (typeof value === 'number' && value > 1 && value < 100000) {
              try {
                // Excel epoch: 01/01/1900, mas Excel conta 01/01/1900 como dia 1
                const excelEpoch = new Date(1899, 11, 30); // 30/12/1899
                const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
                if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
                  value = formatDateLocal(date);
                }
              } catch (e) {
                // Manter valor original se conversão falhar
              }
            }

            // Mapear montadores
            if (header.includes('montador')) {
              const match = header.match(/montador[_\s]*(\d+)/);
              if (match) {
                row[`montador_${match[1]}`] = value ?? null;
              }
            }

            row[header] = value ?? null;
            
            // Adicionar também variações conhecidas para facilitar busca
            if (headerVariations['uf']?.includes(header)) {
              row['uf'] = value ?? null;
              row['estado'] = value ?? null;
            }
            if (headerVariations['data_saida']?.includes(header)) {
              row['data_saida'] = value ?? null;
              row['data_de_saida'] = value ?? null;
            }
            if (headerVariations['data_montagem']?.includes(header)) {
              row['data_montagem'] = value ?? null;
              row['data_da_montagem'] = value ?? null;
            }
            
            // Adicionar aliases para CARRO
            if (header === 'carro' || header === 'veiculo') {
              row['carro'] = value ?? null;
              row['veiculo'] = value ?? null;
            }
            
            // Adicionar aliases para TIPO TRANSPORTE
            if (header.includes('tipo') && header.includes('transporte')) {
              row['tipo_transporte'] = value ?? null;
              row['tipo_de_transporte'] = value ?? null;
              row['tipo'] = value ?? null;
            }
            
            // Adicionar aliases para ERROS
            if (header === 'erros') {
              row['erros'] = value ?? null;
            }
          });

          // Processar linha
          const { row: parsedRow, errors } = processRow(
            row,
            rawHeaders,
            normalizedHeaders,
            i + 1,
            firstColumnIsAglutinated
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

