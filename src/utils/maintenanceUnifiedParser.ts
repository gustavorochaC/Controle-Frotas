/**
 * Parser UNIFICADO de Excel para importação de manutenções
 * Aplica regras de sanitização específicas linha a linha (sem agrupamento)
 * 
 * Regras de Sanitização:
 * - NOTA FISCAL: Remove prefixos "NF", "NFS", "No", "Nota" (case insensitive)
 * - VALORES MONETÁRIOS: Remove "R$", espaços, pontos de milhar, converte vírgula→ponto
 * - KM MANUTENÇÃO: "S/KM" ou vazio → null (não 0)
 * - DATA: Converte DD/MM/AAAA para ISO (YYYY-MM-DD)
 * - PLACA: Normaliza removendo espaços e hífens para match com banco
 */

import * as XLSX from 'xlsx';
import { loadCache, findVeiculoId } from '@/utils/importacao/importer';

/**
 * Erro de parsing específico de uma linha
 */
export interface UnifiedParsingError {
    lineNumber: number;
    field?: string;
    message: string;
}

/**
 * Linha parseada (uma linha do Excel = um registro)
 */
export interface UnifiedParsedRow {
    data: string | null;
    veiculo: string | null; // Placa normalizada
    estabelecimento: string | null;
    tipo_servico: string | null;
    descricao_servico: string | null;
    custo_total: number | null;
    km_manutencao: number | null;
    nota_fiscal: string | null; // JÁ LIMPO (sem prefixos)
    tipo_manutencao: 'preventiva' | 'corretiva' | null; // Tipo de manutenção
    parsingErrors: string[];
    lineNumber: number;
}

/**
 * Resultado do parsing unificado
 */
export interface UnifiedParseResult {
    rows: UnifiedParsedRow[]; // Uma linha por registro
    errors: UnifiedParsingError[];
    totalRows: number; // Total de linhas processadas
    validRows: number;
    errorRows: number;
}

// ============================================================================
// FUNÇÕES DE SANITIZAÇÃO ESPECÍFICAS
// ============================================================================

/**
 * Sanitiza Nota Fiscal removendo prefixos
 * Entrada: "NF 56779" → "56779"
 * Entrada: "NFS-999" → "999"
 */
function sanitizeNotaFiscal(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;
    
    let strValue = String(value).trim();
    
    // Remove prefixos: NF, NFS, No, Nota (case insensitive)
    // Também remove espaços, hífens e pontos após o prefixo
    strValue = strValue.replace(/^(NF|NFS|No|Nota)\s*[-.]?\s*/i, '');
    
    return strValue || null;
}

/**
 * Sanitiza valores monetários (CUSTO TOTAL)
 * Entrada: "R$ 1.644,30" ou "1,644.30"
 * Processo: Detecta formato brasileiro/americano e converte
 */
function sanitizeMonetaryValue(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;

    // Se já for número, retornar
    if (typeof value === 'number') {
        return isNaN(value) ? null : value;
    }

    let strValue = String(value).trim();

    // 1. Remove "R$" e espaços extras
    strValue = strValue.replace(/R\$\s*/gi, '').trim();

    // 2. Detectar formato (brasileiro vs americano)
    const hasComma = strValue.includes(',');
    const hasDot = strValue.includes('.');

    if (hasComma && hasDot) {
        // Tem ambos: verificar qual está mais à direita (é o decimal)
        const lastCommaIndex = strValue.lastIndexOf(',');
        const lastDotIndex = strValue.lastIndexOf('.');
        
        if (lastCommaIndex > lastDotIndex) {
            // Vírgula está mais à direita = formato brasileiro (1.644,30)
            strValue = strValue.replace(/\./g, '');
            strValue = strValue.replace(',', '.');
        } else {
            // Ponto está mais à direita = formato americano (1,644.30)
            strValue = strValue.replace(/,/g, '');
        }
    } else if (hasComma) {
        // Só tem vírgula: assumir formato brasileiro (decimal)
        strValue = strValue.replace(',', '.');
    } else if (hasDot) {
        // Verificar se é milhar ou decimal
        const dotCount = (strValue.match(/\./g) || []).length;
        if (dotCount > 1) {
            // Múltiplos pontos = separadores de milhar
            strValue = strValue.replace(/\./g, '');
        } else {
            const parts = strValue.split('.');
            if (parts.length === 2) {
                const afterDot = parts[1];
                if (afterDot.length === 3 && parts[0].length <= 3) {
                    // Formato "1.900" - é milhar
                    strValue = strValue.replace(/\./g, '');
                }
            }
        }
    }

    // Remover caracteres não numéricos exceto ponto e sinal negativo
    strValue = strValue.replace(/[^0-9.\-]/g, '');

    const num = parseFloat(strValue);
    return isNaN(num) ? null : num;
}

/**
 * Sanitiza KM Manutenção
 * "S/KM" ou vazio → null (não 0)
 * Número → inteiro
 */
function sanitizeKmManutencao(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    
    const strValue = String(value).trim().toLowerCase();
    
    // Se for "S/KM" ou vazio, retornar null (não 0)
    if (strValue === 's/km' || strValue === '') {
        return null;
    }
    
    // Tentar converter para inteiro
    const num = parseInt(strValue, 10);
    return isNaN(num) ? null : num;
}

/**
 * Sanitiza Tipo de Manutenção
 * Normaliza para 'preventiva' ou 'corretiva'
 */
function sanitizeTipoManutencao(value: any): 'preventiva' | 'corretiva' | null {
    if (value === null || value === undefined || value === '') return null;
    
    const strValue = String(value).trim().toLowerCase();
    
    // Normalizar variações comuns
    if (strValue === 'preventiva' || strValue === 'preventivo' || strValue === 'prevent') {
        return 'preventiva';
    }
    
    if (strValue === 'corretiva' || strValue === 'corretivo' || strValue === 'corret') {
        return 'corretiva';
    }
    
    // Se não reconhecer, retornar null (será definido via UI ou padrão)
    return null;
}

/**
 * Converte DATA de DD/MM/AAAA para ISO (YYYY-MM-DD)
 */
function sanitizeDate(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;

    // Se já for uma string ISO válida
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.split('T')[0];
    }

    // Se for Date object
    if (value instanceof Date) {
        if (isNaN(value.getTime())) return null;
        return formatDateLocal(value);
    }

    const strValue = String(value).trim();

    // Formato DD/MM/YYYY ou DD-MM-YYYY
    const brFormat = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const match = strValue.match(brFormat);

    if (match) {
        const [, day, month, year] = match;
        const d = parseInt(day, 10);
        const m = parseInt(month, 10);
        const y = parseInt(year, 10);

        if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    // Formato DD.MM.YY (com ponto e ano de 2 dígitos)
    const brFormatShortYear = /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/;
    const matchShortYear = strValue.match(brFormatShortYear);

    if (matchShortYear) {
        const [, day, month, yearShort] = matchShortYear;
        const d = parseInt(day, 10);
        const m = parseInt(month, 10);
        const yShort = parseInt(yearShort, 10);
        const year = yShort < 50 ? 2000 + yShort : 1900 + yShort;

        if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && year >= 1900 && year <= 2100) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    // Tentar parse genérico
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
        return formatDateLocal(date);
    }

    return null;
}

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
 * Normaliza texto genérico
 */
function sanitizeText(value: any, options?: { uppercase?: boolean; titleCase?: boolean }): string | null {
    if (value === null || value === undefined || value === '') return null;

    let strValue = String(value).trim();

    if (options?.uppercase) {
        strValue = strValue.toUpperCase();
    } else if (options?.titleCase) {
        strValue = strValue
            .toLowerCase()
            .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
    }

    return strValue || null;
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
 */
function findValueByVariations(row: Record<string, any>, variations: string[]): any {
    const normalizedVariations = variations.map((v) => normalizeHeader(v));

    for (const normalizedVariation of normalizedVariations) {
        if (
            row[normalizedVariation] !== undefined &&
            row[normalizedVariation] !== null &&
            row[normalizedVariation] !== ''
        ) {
            return row[normalizedVariation];
        }
    }

    // Tentar busca case-insensitive nas chaves existentes
    const rowKeys = Object.keys(row);
    for (const normalizedVariation of normalizedVariations) {
        const found = rowKeys.find((k) => k.toLowerCase() === normalizedVariation.toLowerCase());
        if (found && row[found] !== undefined && row[found] !== null && row[found] !== '') {
            return row[found];
        }
    }

    return null;
}

// ============================================================================
// PROCESSAMENTO DE LINHA
// ============================================================================

/**
 * Processa uma linha do Excel aplicando todas as regras de sanitização
 */
function processRow(
    row: Record<string, any>,
    lineNumber: number,
    veiculoCache: Awaited<ReturnType<typeof loadCache>> | null
): { parsedRow: UnifiedParsedRow; errors: UnifiedParsingError[] } {
    const errors: UnifiedParsingError[] = [];
    const parsingErrors: string[] = [];

    const parsedRow: UnifiedParsedRow = {
        data: null,
        veiculo: null,
        estabelecimento: null,
        tipo_servico: null,
        descricao_servico: null,
        custo_total: null,
    km_manutencao: null,
    nota_fiscal: null,
    tipo_manutencao: null,
    parsingErrors: [],
    lineNumber,
};

    // DATA
    const dataValue = findValueByVariations(row, ['data', 'data_manutencao']);
    parsedRow.data = sanitizeDate(dataValue);
    if (!parsedRow.data) {
        errors.push({ lineNumber, field: 'data', message: 'Data não encontrada ou inválida' });
        parsingErrors.push('Data inválida');
    }

    // PLACA (VEÍCULO) - Normalizar removendo espaços e hífens
    // Buscar por "placa" primeiro (conforme especificação), depois variações
    const placaValue = findValueByVariations(row, ['placa', 'veiculo', 'veículo', 'carro']);
    const placaText = sanitizeText(placaValue);
    // Normalizar placa: remover espaços e hífens, converter para uppercase
    parsedRow.veiculo = placaText ? placaText.toUpperCase().replace(/[\s\-]/g, '') : null;
    if (!parsedRow.veiculo) {
        errors.push({ lineNumber, field: 'veiculo', message: 'Placa é obrigatória' });
        parsingErrors.push('Placa é obrigatória');
    } else if (veiculoCache) {
        // Validar se veículo existe no banco
        const veiculoId = findVeiculoId(parsedRow.veiculo, veiculoCache);
        if (!veiculoId) {
            errors.push({
                lineNumber,
                field: 'veiculo',
                message: `Veículo não cadastrado: ${parsedRow.veiculo}`,
            });
            parsingErrors.push(`Veículo não cadastrado: ${parsedRow.veiculo}`);
        }
    }

    // ESTABELECIMENTO
    const estabelecimentoValue = findValueByVariations(row, ['estabelecimento', 'oficina', 'posto']);
    parsedRow.estabelecimento = sanitizeText(estabelecimentoValue);

    // TIPO DE SERVIÇO
    const tipoServicoValue = findValueByVariations(row, ['tipo_servico', 'tipo_de_servico', 'tipo', 'servico', 'serviço']);
    parsedRow.tipo_servico = sanitizeText(tipoServicoValue);

    // DESCRIÇÃO DO SERVIÇO
    const descricaoValue = findValueByVariations(row, ['descricao_servico', 'descricao_do_servico', 'descricao', 'descrição', 'detalhes']);
    parsedRow.descricao_servico = sanitizeText(descricaoValue);

    // CUSTO TOTAL (monetário) - Buscar por "Custo total R$" e variações
    const custoTotalValue = findValueByVariations(row, ['custo_total', 'custo_total_r', 'custo', 'valor', 'valor_total', 'total']);
    parsedRow.custo_total = sanitizeMonetaryValue(custoTotalValue);
    if (parsedRow.custo_total === null) {
        errors.push({ lineNumber, field: 'custo_total', message: 'Custo total é obrigatório' });
        parsingErrors.push('Custo total é obrigatório');
    }

    // KM MANUTENÇÃO
    const kmValue = findValueByVariations(row, ['km_manutencao', 'km_manutenção', 'km', 'quilometragem']);
    parsedRow.km_manutencao = sanitizeKmManutencao(kmValue);
    // KM não é obrigatório (pode ser null)

    // NOTA FISCAL (com limpeza de prefixos)
    const notaFiscalValue = findValueByVariations(row, ['nota_fiscal', 'nf', 'nfs', 'nota']);
    parsedRow.nota_fiscal = sanitizeNotaFiscal(notaFiscalValue);
    // Nota fiscal não é obrigatória (pode ser null)

    // TIPO DE MANUTENÇÃO
    const tipoManutencaoValue = findValueByVariations(row, ['tipo_manutencao', 'tipo_manutenção', 'tipo', 'manutencao', 'manutenção']);
    parsedRow.tipo_manutencao = sanitizeTipoManutencao(tipoManutencaoValue);
    // Tipo não é obrigatório no Excel (pode ser definido via UI se não houver)

    parsedRow.parsingErrors = parsingErrors;

    return { parsedRow, errors };
}

// ============================================================================
// FUNÇÃO PRINCIPAL DE PARSING
// ============================================================================

/**
 * Parse arquivo Excel de manutenções com regras de sanitização unificadas (sem agrupamento)
 */
export async function parseUnifiedExcel(file: File): Promise<UnifiedParseResult> {
    return new Promise(async (resolve, reject) => {
        try {
            // Carregar cache de veículos para validação
            const cache = await loadCache();

            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    // Desabilitar cellDates para evitar conversão automática de valores monetários em datas
                    const workbook = XLSX.read(data, { type: 'binary', cellDates: false });

                    // Pegar primeira planilha
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Obter range da planilha
                    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                    
                    // Processar headers (primeira linha)
                    const rawHeaders: string[] = [];
                    const normalizedHeaders: string[] = [];
                    
                    for (let col = range.s.c; col <= range.e.c; col++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                        const cell = worksheet[cellAddress];
                        const headerValue = cell?.w || cell?.v || '';
                        rawHeaders.push(String(headerValue));
                        normalizedHeaders.push(normalizeHeader(String(headerValue)));
                    }

                    // Processar linhas de dados (sem agrupamento - uma linha = um registro)
                    const parsedRows: UnifiedParsedRow[] = [];
                    const allErrors: UnifiedParsingError[] = [];

                    for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex++) {
                        // Verificar se a linha tem algum valor
                        let hasAnyValue = false;
                        const row: Record<string, any> = {};

                        for (let col = range.s.c; col <= range.e.c; col++) {
                            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
                            const cell = worksheet[cellAddress];
                            const header = normalizedHeaders[col];

                            // Priorizar valor formatado (w) se existir, senão usar valor bruto (v)
                            let value: any = null;
                            if (cell) {
                                value = cell.w || cell.v || null;
                                
                                if (value !== null && value !== undefined && value !== '') {
                                    hasAnyValue = true;
                                }
                            }

                            row[header] = value;
                        }

                        // Pular linhas vazias
                        if (!hasAnyValue) {
                            continue;
                        }

                        // Processar linha (retorna UnifiedParsedRow diretamente)
                        const { parsedRow, errors } = processRow(row, rowIndex + 1, cache);
                        parsedRows.push(parsedRow);
                        allErrors.push(...errors);
                    }

                    // Calcular estatísticas
                    const errorRows = parsedRows.filter((r) => r.parsingErrors.length > 0).length;

                    resolve({
                        rows: parsedRows,
                        errors: allErrors,
                        totalRows: parsedRows.length,
                        validRows: parsedRows.length - errorRows,
                        errorRows,
                    });
                } catch (error) {
                    reject(new Error(`Erro ao processar Excel: ${(error as Error).message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Erro ao ler arquivo'));
            };

            reader.readAsBinaryString(file);
        } catch (error) {
            reject(new Error(`Erro ao carregar cache: ${(error as Error).message}`));
        }
    });
}

