import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TipoConsultaList } from "@/components/settings/TipoConsultaList";
import { ConvenioList } from "@/components/settings/ConvenioList";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground mt-2">
          Gerencie os cadastros auxiliares do sistema.
        </p>
      </div>

      <Tabs defaultValue="tipos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tipos">Tipos de Consulta</TabsTrigger>
          <TabsTrigger value="convenios">Convênios e Planos</TabsTrigger>
          {/* Futuro: <TabsTrigger value="horarios">Horários dos Médicos</TabsTrigger> */}
        </TabsList>
        
        <TabsContent value="tipos" className="space-y-4">
          <TipoConsultaList />
        </TabsContent>
        
        <TabsContent value="convenios" className="space-y-4">
          <ConvenioList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
