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
import { useCreateMontador, useUpdateMontador } from '@/hooks/useMontadores';
import { Montador } from '@/types/montador';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface MontadorFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  montador: Montador | null;
}

export function MontadorFormModal({
  open,
  onOpenChange,
  montador,
}: MontadorFormModalProps) {
  const createMontador = useCreateMontador();
  const updateMontador = useUpdateMontador();
  
  const isLoading = createMontador.isPending || updateMontador.isPending;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
    },
  });

  useEffect(() => {
    if (montador) {
      form.reset({
        nome: montador.nome,
      });
    } else {
      form.reset({
        nome: '',
      });
    }
  }, [montador, form]);

  const handleSubmit = (data: FormData) => {
    const formData = { nome: data.nome };
    if (montador) {
      updateMontador.mutate(
        { id: montador.id, data: formData },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMontador.mutate(formData, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {montador ? 'Editar Montador' : 'Novo Montador'}
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
                      placeholder="Nome do montador"
                      className="bg-background border-border" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : montador ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
