import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { scheduleService, TipoConsulta } from '@/services/scheduleService';
import { configService } from '@/services/configService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TipoConsultaList() {
  const { organizacao } = useAuth();
  const { toast } = useToast();
  const [tipos, setTipos] = useState<TipoConsulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoTipo, setNovoTipo] = useState('');
  const [adding, setAdding] = useState(false);

  const loadTipos = async () => {
    if (!organizacao) return;
    try {
      const data = await scheduleService.getTiposConsulta(organizacao.id);
      setTipos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTipos();
  }, [organizacao]);

  const handleAdd = async () => {
    if (!novoTipo.trim() || !organizacao) return;
    setAdding(true);
    try {
      const novo = await configService.createTipoConsulta({
        organizacao_id: organizacao.id,
        nome: novoTipo,
      });
      setTipos([...tipos, novo]);
      setNovoTipo('');
      toast({ title: 'Tipo de consulta adicionado!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar' });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await configService.deleteTipoConsulta(id);
      setTipos(tipos.filter(t => t.id !== id));
      toast({ title: 'Removido com sucesso' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao remover' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de Consulta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            placeholder="Ex: Consulta, Retorno, Exame..." 
            value={novoTipo}
            onChange={(e) => setNovoTipo(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={adding || !novoTipo.trim()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {tipos.map((tipo) => (
              <div key={tipo.id} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                <span>{tipo.nome}</span>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(tipo.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {tipos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum tipo cadastrado.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
