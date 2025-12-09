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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateVeiculo, useUpdateVeiculo } from '@/hooks/useVeiculos';
import { Veiculo, TIPOS_VEICULO } from '@/types/veiculo';

const formSchema = z.object({
  placa: z.string().min(1, 'Placa é obrigatória'),
  fabricante: z.string().optional(),
  modelo: z.string().optional(),
  tipo: z.string().optional(),
  ano: z.coerce.number().min(1900).max(2100).optional().or(z.literal('')),
  km_atual: z.coerce.number().min(0).optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface VeiculoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veiculo: Veiculo | null;
}

export function VeiculoFormModal({
  open,
  onOpenChange,
  veiculo,
}: VeiculoFormModalProps) {
  const createVeiculo = useCreateVeiculo();
  const updateVeiculo = useUpdateVeiculo();
  
  const isLoading = createVeiculo.isPending || updateVeiculo.isPending;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      placa: '',
      fabricante: '',
      modelo: '',
      tipo: '',
      ano: '',
      km_atual: '',
    },
  });

  useEffect(() => {
    if (veiculo) {
      form.reset({
        placa: veiculo.placa,
        fabricante: veiculo.fabricante || '',
        modelo: veiculo.modelo || '',
        tipo: veiculo.tipo || '',
        ano: veiculo.ano || '',
        km_atual: veiculo.km_atual || 0,
      });
    } else {
      form.reset({
        placa: '',
        fabricante: '',
        modelo: '',
        tipo: '',
        ano: '',
        km_atual: '',
      });
    }
  }, [veiculo, form]);

  const handleSubmit = (data: FormData) => {
    const formData = {
      placa: data.placa,
      fabricante: data.fabricante || null,
      modelo: data.modelo || null,
      tipo: data.tipo || null,
      ano: data.ano ? Number(data.ano) : null,
      km_atual: data.km_atual ? Number(data.km_atual) : 0,
    };
    if (veiculo) {
      updateVeiculo.mutate(
        { id: veiculo.id, data: formData },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createVeiculo.mutate(formData, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {veiculo ? 'Editar Veículo' : 'Novo Veículo'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="placa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="ABC-1234"
                        className="bg-background border-border uppercase" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ano"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        placeholder="2024"
                        className="bg-background border-border" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="km_atual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KM Atual</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      placeholder="0"
                      className="bg-background border-border" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fabricante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabricante</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ex: Fiat, Ford, VW"
                        className="bg-background border-border" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ex: Fiorino, Sprinter"
                        className="bg-background border-border" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border-border">
                      {TIPOS_VEICULO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {isLoading ? 'Salvando...' : veiculo ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
