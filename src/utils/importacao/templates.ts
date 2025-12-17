/**
 * Geração de templates CSV para importação
 */

import { ImportType } from './normalizer';

interface TemplateConfig {
  headers: string[];
  examples: string[][];
  filename: string;
}

const TEMPLATES: Record<ImportType, TemplateConfig> = {
  veiculos: {
    headers: ['Placa', 'Fabricante', 'Modelo', 'Tipo', 'Ano'],
    examples: [
      ['ABC1D23', 'Fiat', 'Ducato', 'Van', '2020'],
      ['XYZ9W87', 'Mercedes', 'Sprinter', 'Van', '2019'],
      ['DEF4E56', 'Volkswagen', 'Delivery', 'Caminhão', '2021'],
    ],
    filename: 'template_veiculos.csv',
  },
  entregas: {
    headers: [
      'NF',
      'Cliente',
      'UF',
      'Data Saída',
      'Motorista',
      'Tipo',
      'Valor',
      'Status',
    ],
    examples: [
      [
        'NF12345',
        'Cliente Exemplo 1',
        'SP',
        '01/12/2024',
        'João Silva',
        'FROTA PROPRIA',
        '5000.00',
        'CONCLUIDO',
      ],
      [
        'NF12346',
        'Cliente Exemplo 2',
        'RJ',
        '03/12/2024',
        'Maria Santos',
        'TERCEIRO',
        '3500.00',
        'PENDENTE',
      ],
    ],
    filename: 'template_entregas.csv',
  },
  abastecimentos: {
    headers: [
      'Data',
      'Veículo',
      'Condutor',
      'Posto/Manutenção',
      'Cidade',
      'UF',
      'Km Inicial',
      'Litros',
      'Produto',
      'Valor Un.',
      'Valor Total',
    ],
    examples: [
      [
        '01/12/2024',
        'ABC1D23',
        'João Silva',
        '36687900 - POSTO FORMOSA',
        'São Paulo',
        'SP',
        '50000',
        '50.5',
        'Diesel S-10',
        '5.89',
        '297.45',
      ],
      [
        '02/12/2024',
        'XYZ9W87',
        'Maria Santos',
        'Shell',
        'Campinas',
        'SP',
        '32000',
        '42.0',
        'Diesel S-10',
        '5.95',
        '249.90',
      ],
      [
        '03/12/2024',
        'DEF4E56',
        'Pedro Oliveira',
        'BR',
        'Rio de Janeiro',
        'RJ',
        '15000',
        '10.0',
        'Arla-32',
        '4.50',
        '45.00',
      ],
    ],
    filename: 'template_abastecimentos.csv',
  },
  manutencoes: {
    headers: [
      'Data',
      'Placa',
      'Estabelecimento',
      'Tipo de serviço',
      'Descrição do serviço',
      'Custo total R$',
      'KM Manutenção',
      'Nota Fiscal',
    ],
    examples: [
      [
        '01/12/2024',
        'ABC1D23',
        'Oficina Central',
        'Troca de Óleo',
        'Óleo 15W40 + filtro',
        '350.00',
        '50000',
        'NF001',
      ],
      [
        '05/12/2024',
        'XYZ9W87',
        'AutoPeças SP',
        'Troca de Pneus',
        '4 pneus 195/65R15',
        '1200.00',
        '32000',
        'NF002',
      ],
    ],
    filename: 'template_manutencoes.csv',
  },
  motoristas: {
    headers: ['Nome', 'Função', 'Número CNH', 'Categoria CNH', 'Data Vencimento CNH'],
    examples: [
      ['João Silva', 'Motorista', '12345678900', 'D', '15/06/2025'],
      ['Maria Santos', 'Condutor', '98765432100', 'B', '20/03/2026'],
      ['Pedro Oliveira', 'Motorista', '11122233344', 'E', '10/12/2024'],
    ],
    filename: 'template_motoristas.csv',
  },
  montadores: {
    headers: ['Nome'],
    examples: [['Carlos Montador'], ['Pedro Montador'], ['Lucas Montador']],
    filename: 'template_montadores.csv',
  },
};

/**
 * Gera conteúdo CSV com BOM para UTF-8
 */
function generateCSV(headers: string[], rows: string[][]): string {
  const BOM = '\uFEFF'; // UTF-8 BOM para Excel abrir corretamente
  
  const headerLine = headers.map(h => `"${h}"`).join(',');
  const dataLines = rows.map(row => row.map(cell => `"${cell}"`).join(','));
  
  return BOM + [headerLine, ...dataLines].join('\r\n');
}

/**
 * Faz download do template CSV
 */
export function downloadTemplate(type: ImportType): void {
  const template = TEMPLATES[type];
  if (!template) {
    throw new Error(`Template não encontrado para tipo: ${type}`);
  }
  
  const csvContent = generateCSV(template.headers, template.examples);
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = template.filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Retorna informações do template
 */
export function getTemplateInfo(type: ImportType): TemplateConfig {
  return TEMPLATES[type];
}

/**
 * Retorna todos os tipos disponíveis para importação
 */
export function getImportTypes(): { value: ImportType; label: string }[] {
  return [
    { value: 'veiculos', label: 'Veículos' },
    { value: 'entregas', label: 'Entregas e Montagem' },
    { value: 'abastecimentos', label: 'Abastecimentos' },
    { value: 'manutencoes', label: 'Manutenções' },
    { value: 'motoristas', label: 'Motoristas/Condutores' },
    { value: 'montadores', label: 'Montadores' },
  ];
}

