import { Truck, Users, Car, Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MotoristasTab } from '@/components/cadastros/MotoristasTab';
import { VeiculosTab } from '@/components/cadastros/VeiculosTab';
import { MontadoresTab } from '@/components/cadastros/MontadoresTab';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

const Cadastros = () => {
  return (
    <ModuleLayout>
      <div className="p-8 lg:p-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Cadastros
          </h1>
          <p className="text-slate-500 mt-1">
            Gerenciamento de dados do sistema
          </p>
        </div>

        <Tabs defaultValue="motoristas" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 shadow-sm">
            <TabsTrigger value="motoristas" className="gap-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
              <Users className="h-4 w-4" />
              Motoristas / Condutores
            </TabsTrigger>
            <TabsTrigger value="veiculos" className="gap-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
              <Car className="h-4 w-4" />
              Veículos
            </TabsTrigger>
            <TabsTrigger value="montadores" className="gap-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
              <Wrench className="h-4 w-4" />
              Montadores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="motoristas" className="mt-6">
            <MotoristasTab />
          </TabsContent>

          <TabsContent value="veiculos" className="mt-6">
            <VeiculosTab />
          </TabsContent>

          <TabsContent value="montadores" className="mt-6">
            <MontadoresTab />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
};

export default Cadastros;
