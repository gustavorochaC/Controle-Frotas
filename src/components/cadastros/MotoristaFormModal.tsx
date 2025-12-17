import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateMotorista, useUpdateMotorista } from '@/hooks/useMotoristas';
import { Motorista, CATEGORIAS_CNH, CategoriaCNH } from '@/types/motorista';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  eh_motorista: z.boolean().default(false),
  eh_montador: z.boolean().default(false),
  numero_cnh: z.string().optional(),
  categoria_cnh: z.string().optional(),
  data_vencimento_cnh: z.string().optional(),
  data_exame_toxicologico: z.string().optional(),
}).refine(data => data.eh_motorista || data.eh_montador, {
  message: 'Selecione pelo menos uma função (Motorista ou Montador)',
  path: ['eh_motorista'],
});

type FormData = z.infer<typeof formSchema>;

interface MotoristaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorista: Motorista | null;
}

export function MotoristaFormModal({
  open,
  onOpenChange,
  motorista,
}: MotoristaFormModalProps) {
  const createMotorista = useCreateMotorista();
  const updateMotorista = useUpdateMotorista();
  
  const isLoading = createMotorista.isPending || updateMotorista.isPending;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      eh_motorista: true,
      eh_montador: false,
      numero_cnh: '',
      categoria_cnh: '',
      data_vencimento_cnh: '',
      data_exame_toxicologico: '',
    },
  });

  useEffect(() => {
    if (motorista) {
      form.reset({
        nome: motorista.nome,
        eh_motorista: motorista.eh_motorista ?? (motorista.funcao === 'Motorista' || motorista.funcao === 'Condutor') ?? true,
        eh_montador: motorista.eh_montador || false,
        numero_cnh: motorista.numero_cnh || '',
        categoria_cnh: motorista.categoria_cnh || '',
        data_vencimento_cnh: motorista.data_vencimento_cnh || '',
        data_exame_toxicologico: motorista.data_exame_toxicologico || '',
      });
    } else {
      form.reset({
        nome: '',
        eh_motorista: true,
        eh_montador: false,
        numero_cnh: '',
        categoria_cnh: '',
        data_vencimento_cnh: '',
        data_exame_toxicologico: '',
      });
    }
  }, [motorista, form]);

  const handleSubmit = (data: FormData) => {
    const formData = { 
      nome: data.nome, 
      eh_motorista: data.eh_motorista || false,
      eh_montador: data.eh_montador || false,
      numero_cnh: data.numero_cnh || undefined,
      categoria_cnh: (data.categoria_cnh as CategoriaCNH) || undefined,
      data_vencimento_cnh: data.data_vencimento_cnh || undefined,
      data_exame_toxicologico: data.data_exame_toxicologico || undefined,
    };
    if (motorista) {
      updateMotorista.mutate(
        { id: motorista.id, data: formData },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMotorista.mutate(formData, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {motorista ? 'Editar Cadastro' : 'Novo Cadastro'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Nome completo"
                      className="bg-background border-border" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="eh_motorista"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-foreground">
                        É Motorista / Condutor
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Marque esta opção se a pessoa exerce a função de motorista ou condutor
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eh_montador"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-foreground">
                        É Montador
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Marque esta opção se a pessoa exerce a função de montador
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-medium text-foreground mb-4">Documentação CNH</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="numero_cnh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da CNH</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="00000000000"
                          className="bg-background border-border" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoria_cnh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIAS_CNH.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_vencimento_cnh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimento CNH</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          className="bg-background border-border" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-medium text-foreground mb-4">Exame Toxicológico</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data_exame_toxicologico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Exame</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          className="bg-background border-border" 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Validade: 2 anos e 6 meses a partir da data do exame
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : motorista ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
