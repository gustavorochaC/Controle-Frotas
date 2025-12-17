/**
 * Exportações centralizadas do módulo de importação
 */

export { parseFile, parseCSV, parseExcel, type ParsedData } from './parser';
export { normalizeRow, type ImportType } from './normalizer';
export {
  validateAll,
  type ValidationWarning,
  type ValidationResult,
  type WarningType,
  type ValidationCache,
} from './validators';
export {
  loadCache,
  importVeiculos,
  importEntregas,
  importAbastecimentos,
  importManutencoes,
  importMotoristas,
  importMontadores,
  type ImportProgress,
  type ImportResult,
} from './importer';
export { downloadTemplate, getTemplateInfo, getImportTypes } from './templates';

