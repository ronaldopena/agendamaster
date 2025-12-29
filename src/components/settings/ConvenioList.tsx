import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { scheduleService, Convenio, Plano } from '@/services/scheduleService';
import { configService } from '@/services/configService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Loader2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ConvenioList() {
  const { organizacao } = useAuth();
  const { toast } = useToast();
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [planosPorConvenio, setPlanosPorConvenio] = useState<Record<string, Plano[]>>({});
  const [loading, setLoading] = useState(true);
  const [novoConvenio, setNovoConvenio] = useState('');
  const [novoPlano, setNovoPlano] = useState<Record<string, string>>({}); // Map convenioId -> novoPlanoName
  const [adding, setAdding] = useState(false);

  const loadData = async () => {
    if (!organizacao) return;
    try {
      const convs = await scheduleService.getConvenios(organizacao.id);
      setConvenios(convs);
      
      // Carregar planos para cada convênio
      const planosMap: Record<string, Plano[]> = {};
      await Promise.all(convs.map(async (c) => {
        const planos = await scheduleService.getPlanos(c.id);
        planosMap[c.id] = planos;
      }));
      setPlanosPorConvenio(planosMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizacao]);

  const handleAddConvenio = async () => {
    if (!novoConvenio.trim() || !organizacao) return;
    setAdding(true);
    try {
      const novo = await configService.createConvenio({
        organizacao_id: organizacao.id,
        nome: novoConvenio,
      });
      setConvenios([...convenios, novo]);
      setPlanosPorConvenio({ ...planosPorConvenio, [novo.id]: [] });
      setNovoConvenio('');
      toast({ title: 'Convênio adicionado!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar convênio' });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteConvenio = async (id: string) => {
    try {
      await configService.deleteConvenio(id);
      setConvenios(convenios.filter(c => c.id !== id));
      // Limpar planos do estado
      const newPlanos = { ...planosPorConvenio };
      delete newPlanos[id];
      setPlanosPorConvenio(newPlanos);
      toast({ title: 'Convênio removido' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao remover' });
    }
  };

  const handleAddPlano = async (convenioId: string) => {
    const nomePlano = novoPlano[convenioId];
    if (!nomePlano?.trim()) return;

    try {
      const novo = await configService.createPlano({
        convenio_id: convenioId,
        nome: nomePlano,
      });
      
      setPlanosPorConvenio({
        ...planosPorConvenio,
        [convenioId]: [...(planosPorConvenio[convenioId] || []), novo]
      });
      
      setNovoPlano({ ...novoPlano, [convenioId]: '' });
      toast({ title: 'Plano adicionado!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar plano' });
    }
  };

  const handleDeletePlano = async (convenioId: string, planoId: string) => {
    try {
      await configService.deletePlano(planoId);
      setPlanosPorConvenio({
        ...planosPorConvenio,
        [convenioId]: planosPorConvenio[convenioId].filter(p => p.id !== planoId)
      });
      toast({ title: 'Plano removido' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao remover plano' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convênios e Planos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input 
            placeholder="Novo Convênio (Ex: Unimed)" 
            value={novoConvenio}
            onChange={(e) => setNovoConvenio(e.target.value)}
          />
          <Button onClick={handleAddConvenio} disabled={adding || !novoConvenio.trim()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {convenios.map((convenio) => (
              <AccordionItem key={convenio.id} value={convenio.id}>
                <div className="flex items-center justify-between pr-4">
                    <AccordionTrigger className="hover:no-underline flex-1">{convenio.nome}</AccordionTrigger>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleDeleteConvenio(convenio.id); }}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                <AccordionContent className="bg-gray-50/50 p-4 rounded-md space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Novo Plano (Ex: Enfermaria)" 
                            value={novoPlano[convenio.id] || ''}
                            onChange={(e) => setNovoPlano({ ...novoPlano, [convenio.id]: e.target.value })}
                            className="h-8 text-sm"
                        />
                        <Button size="sm" onClick={() => handleAddPlano(convenio.id)} disabled={!novoPlano[convenio.id]?.trim()}>
                            Adicionar
                        </Button>
                    </div>
                    <div className="space-y-1">
                        {planosPorConvenio[convenio.id]?.map((plano) => (
                            <div key={plano.id} className="flex items-center justify-between py-1 px-2 hover:bg-white rounded border border-transparent hover:border-gray-200">
                                <span className="text-sm">{plano.nome}</span>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeletePlano(convenio.id, plano.id)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        {planosPorConvenio[convenio.id]?.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">Nenhum plano cadastrado.</p>
                        )}
                    </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            {convenios.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum convênio cadastrado.</p>}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
