import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string | null;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'CONCLUIDO':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/30';
      case 'EM ROTA':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30';
      case 'PENDENTE':
        return 'bg-amber-500/20 text-amber-700 border-amber-500/30 hover:bg-amber-500/30';
      case 'CANCELADO':
        return 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn('font-medium', getStatusStyles(status))}
    >
      {status || 'N/A'}
    </Badge>
  );
}
