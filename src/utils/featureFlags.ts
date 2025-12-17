/**
 * Feature flags para controlar funcionalidades do sistema
 */

/**
 * Verifica se a funcionalidade de importação está habilitada
 * Controlado pela variável de ambiente VITE_ENABLE_IMPORT
 */
export function isImportEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_IMPORT === 'true';
}

