/**
 * Feature flags para controlar funcionalidades do sistema
 */

/**
 * Verifica se a funcionalidade de importação está habilitada
 * Controlado pela variável de ambiente VITE_ENABLE_IMPORT
 * 
 * Retorna true apenas se o valor for exatamente a string 'true' (case-sensitive)
 * Qualquer outro valor (false, undefined, '', etc) retorna false
 */
export function isImportEnabled(): boolean {
  const value = import.meta.env.VITE_ENABLE_IMPORT;
  
  // Se não estiver definido, retorna false
  if (value === undefined || value === null) {
    return false;
  }
  
  // Converte para string e remove espaços, depois compara
  const normalizedValue = String(value).trim().toLowerCase();
  
  // Retorna true apenas se for exatamente 'true'
  return normalizedValue === 'true';
}

