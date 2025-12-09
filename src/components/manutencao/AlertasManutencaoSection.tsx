import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAlertasManutencao, AlertaManutencao } from '@/hooks/useAlertasManutencao';

interface AlertasManutencaoSectionProps {
  onRegistrarManutencao?: (alerta: AlertaManutencao) => void;
}

export function AlertasManutencaoSection({ onRegistrarManutencao }: AlertasManutencaoSectionProps) {
  const { data: alertas = [], isLoading } = useAlertasManutencao();

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const alertasVencidos = alertas.filter((a) => a.status === 'vencido');
  const alertasProximos = alertas.filter((a) => a.status === 'proximo');

  if (isLoading) {
    return null;
  }

  if (alertas.length === 0) {
    return (
      <Card className="bg-card border-border border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground">
                Não há manutenções preventivas pendentes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border border-yellow-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-foreground text-base">
            Alertas de Manutenção
            <Badge variant="secondary" className="ml-2">
              {alertas.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertasVencidos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-destructive uppercase tracking-wide">
              Vencidas ({alertasVencidos.length})
            </p>
            {alertasVencidos.map((alerta) => (
              <div
                key={alerta.id}
                className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {alerta.veiculo_placa} - {alerta.nome_servico}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vencido há {formatNumber(Math.abs(alerta.km_restante))} km
                    </p>
                  </div>
                </div>
                {onRegistrarManutencao && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => onRegistrarManutencao(alerta)}
                  >
                    Registrar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {alertasProximos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">
              Próximas ({alertasProximos.length})
            </p>
            {alertasProximos.map((alerta) => (
              <div
                key={alerta.id}
                className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {alerta.veiculo_placa} - {alerta.nome_servico}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Faltam {formatNumber(alerta.km_restante)} km para próxima manutenção
                    </p>
                  </div>
                </div>
                {onRegistrarManutencao && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => onRegistrarManutencao(alerta)}
                  >
                    Registrar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
