import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { Entrega } from '@/types/entrega';

interface EntregaTableProps {
  entregas: Entrega[];
  onEdit: (entrega: Entrega) => void;
  onDelete: (entrega: Entrega) => void;
}

export function EntregaTable({ entregas, onEdit, onDelete }: EntregaTableProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-foreground font-semibold">NF</TableHead>
            <TableHead className="text-foreground font-semibold">Cliente</TableHead>
            <TableHead className="text-foreground font-semibold">UF</TableHead>
            <TableHead className="text-foreground font-semibold">Data Saída</TableHead>
            <TableHead className="text-foreground font-semibold">Motorista</TableHead>
            <TableHead className="text-foreground font-semibold">Tipo</TableHead>
            <TableHead className="text-foreground font-semibold">Valor</TableHead>
            <TableHead className="text-foreground font-semibold">Status</TableHead>
            <TableHead className="text-foreground font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entregas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                Nenhuma entrega encontrada.
              </TableCell>
            </TableRow>
          ) : (
            entregas.map((entrega) => (
              <TableRow key={entrega.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{entrega.nf || '-'}</TableCell>
                <TableCell>{entrega.cliente || '-'}</TableCell>
                <TableCell>{entrega.uf || '-'}</TableCell>
                <TableCell>{formatDate(entrega.data_saida)}</TableCell>
                <TableCell>{entrega.motorista || '-'}</TableCell>
                <TableCell>{entrega.tipo_transporte || '-'}</TableCell>
                <TableCell>{formatCurrency(entrega.valor)}</TableCell>
                <TableCell>
                  <StatusBadge status={entrega.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(entrega)}
                      className="h-8 w-8 hover:bg-primary/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(entrega)}
                      className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
