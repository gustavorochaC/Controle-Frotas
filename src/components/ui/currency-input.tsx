import * as React from "react";
import CurrencyInputField from "react-currency-input-field";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value?: number | string;
  onValueChange?: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  prefix?: string;
  decimalsLimit?: number;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, placeholder = "0,00", prefix = "", decimalsLimit = 2, disabled, ...props }, ref) => {
    // Usa estado local para permitir digitação livre sem sobrescrever valores parciais
    const [localValue, setLocalValue] = React.useState<string>('');
    const isUserTyping = React.useRef(false);
    const isFocused = React.useRef(false);

    // Sincroniza valor externo quando:
    // 1. O campo está desabilitado (valor calculado)
    // 2. O usuário não está digitando
    // 3. O campo não está focado
    React.useEffect(() => {
      const shouldSync = disabled || (!isUserTyping.current && !isFocused.current);
      
      if (shouldSync && value !== undefined && value !== null) {
        // Verifica se é um número válido antes de formatar
        if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
          const formatted = value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: decimalsLimit });
          setLocalValue(formatted);
        } else if (typeof value === 'string') {
          setLocalValue(value);
        } else {
          setLocalValue('');
        }
      } else if (shouldSync && (value === undefined || value === null || value === 0)) {
        setLocalValue('');
      }
    }, [value, decimalsLimit, disabled]);

    return (
      <CurrencyInputField
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        value={localValue}
        disabled={disabled}
        onFocus={() => {
          isFocused.current = true;
        }}
        onValueChange={(stringValue, _, values) => {
          if (disabled) return;
          
          isUserTyping.current = true;
          
          // Atualiza o valor local imediatamente (permite digitar vírgula)
          setLocalValue(stringValue || '');
          
          // Se o valor está vazio, retorna undefined
          if (!stringValue || stringValue.trim() === '') {
            onValueChange?.(undefined);
            // Reset typing flag após um pequeno delay
            setTimeout(() => { isUserTyping.current = false; }, 100);
            return;
          }
          
          // Verifica se o usuário ainda está digitando (valor termina com vírgula)
          if (stringValue.endsWith(',') || stringValue.endsWith('.')) {
            // Não atualiza o form ainda - deixa o usuário continuar digitando
            setTimeout(() => { isUserTyping.current = false; }, 100);
            return;
          }
          
          // Usa o floatValue da biblioteca
          const floatValue = values?.float;
          
          if (floatValue !== undefined && floatValue !== null && !isNaN(floatValue)) {
            onValueChange?.(floatValue);
          }
          
          // Reset typing flag após um pequeno delay
          setTimeout(() => { isUserTyping.current = false; }, 100);
        }}
        onBlur={() => {
          // Quando perde o foco, garante que o valor é sincronizado
          isUserTyping.current = false;
          isFocused.current = false;
          
          // Força a sincronização com o valor externo
          if (value !== undefined && value !== null) {
            if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
              const formatted = value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: decimalsLimit });
              setLocalValue(formatted);
            } else if (typeof value === 'string') {
              setLocalValue(value);
            }
          }
        }}
        placeholder={placeholder}
        prefix={prefix}
        decimalsLimit={decimalsLimit}
        decimalSeparator=","
        groupSeparator="."
        allowNegativeValue={false}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
