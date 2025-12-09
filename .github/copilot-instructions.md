# Copilot Instructions - SCV Logistics Hub

## Visão Geral do Projeto

Sistema de controle de veículos (SCV) para logística com módulos de **Entregas**, **Abastecimento** e **Manutenção**. Criado com [Lovable.dev](https://lovable.dev), usa React + TypeScript + Vite + Supabase.

## Arquitetura

```
src/
├── pages/           # Rotas principais (Hub.tsx, Entregas.tsx, etc.)
├── components/      # Componentes organizados por módulo
│   ├── layout/      # AppSidebar, ModuleLayout
│   ├── dashboard/   # Componentes de Entregas
│   ├── abastecimento/
│   └── manutencao/
├── hooks/           # Custom hooks para dados (use[Entity].ts)
├── types/           # TypeScript interfaces e constantes
└── integrations/supabase/  # Cliente e tipos gerados do Supabase
```

## Padrões de Código

### Data Fetching com React Query + Supabase
Sempre siga o padrão existente em `src/hooks/`:
```typescript
// Padrão: useQuery para leitura, useMutation para escrita
export function useVeiculos() {
  return useQuery({
    queryKey: ['veiculos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('veiculos').select('*');
      if (error) throw error;
      return data as Veiculo[];
    }
  });
}
```

### Mutations com Toast Feedback
Todas as mutations devem invalidar cache e mostrar feedback:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['veiculos'] });
  toast({ title: 'Sucesso!', description: 'Operação concluída.' });
},
onError: () => {
  toast({ title: 'Erro', description: 'Falha na operação.', variant: 'destructive' });
}
```

### Tipos e Interfaces
- Definir em `src/types/[entity].ts`
- Exportar interface para dados (`Entrega`) e para formulário (`EntregaFormData`)
- Incluir constantes relacionadas no mesmo arquivo (ex: `STATUS_OPTIONS`, `ESTADOS_BRASILEIROS`)

### Formulários
- Usar **react-hook-form** + **zod** para validação
- Pattern em `EntregaFormModal.tsx` e similares

### Componentes UI
- Usar componentes do **shadcn/ui** em `src/components/ui/`
- Imports com path alias: `import { Button } from '@/components/ui/button'`

## Comandos de Desenvolvimento

```bash
npm run dev      # Dev server na porta 8080
npm run build    # Build de produção
npm run lint     # ESLint
```

## Banco de Dados (Supabase)

### Tabelas Principais
- `controle_entregas` - Entregas de pedidos
- `veiculos` - Cadastro de veículos
- `motoristas` - Motoristas e condutores (campo `funcao`)
- `montadores` - Equipe de montagem
- `abastecimentos` - Registro de abastecimentos
- `manutencoes` - Manutenções corretivas/preventivas
- `manutencao_preventiva_config` - Configurações de manutenção por veículo

### Convenções
- IDs são UUIDs
- Timestamps: `created_at`, `updated_at` (auto-gerenciados por triggers)
- Soft delete via campo `ativo: boolean`
- Tipos gerados automaticamente em `src/integrations/supabase/types.ts`

### Migrations
Localização: `supabase/migrations/`
- Incluem RLS policies públicas
- Triggers para `updated_at`

## Convenções Importantes

1. **Path Alias**: Sempre usar `@/` para imports do src
2. **Idioma**: UI em português brasileiro
3. **Feedback**: Toda ação do usuário deve ter feedback visual (toast)
4. **Módulos**: Cada módulo tem seu próprio layout via `ModuleLayout`
5. **Hub**: Página inicial (`Hub.tsx`) é um dashboard consolidado de todos os módulos

## Não Fazer

- Não editar `src/integrations/supabase/types.ts` (gerado automaticamente)
- Não usar `any` sem necessidade - tipos estão bem definidos em `src/types/`
- Não criar componentes UI do zero - usar shadcn/ui
