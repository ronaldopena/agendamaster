import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { unitService } from '@/services/unitService';
import { Unidade } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Pencil, Trash2, Loader2, Building2 } from 'lucide-react';
import { UnitDialog } from '@/components/units/UnitDialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Unidades() {
  const { organizacao } = useAuth();
  const { toast } = useToast();
  const [units, setUnits] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unidade | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unidade | null>(null);

  const fetchUnits = async () => {
    if (!organizacao) return;
    setLoading(true);
    try {
      const data = await unitService.getUnits(organizacao.id);
      setUnits(data);
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar unidades",
        description: "Não foi possível carregar a lista de unidades.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [organizacao]);

  const handleEdit = (unit: Unidade) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!unitToDelete) return;
    try {
      await unitService.deleteUnit(unitToDelete.id);
      toast({ title: "Unidade excluída com sucesso" });
      fetchUnits();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir a unidade.",
      });
    } finally {
      setUnitToDelete(null);
    }
  };

  const filteredUnits = units.filter(unit =>
    unit.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.endereco?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Unidades</h2>
          <p className="text-muted-foreground mt-2">
            Gerencie as unidades da clínica ({units.length} total).
          </p>
        </div>
        <Button onClick={() => { setEditingUnit(null); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Unidade
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou endereço..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
            <div className="col-span-full flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : filteredUnits.length === 0 ? (
            <div className="col-span-full text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                Nenhuma unidade encontrada.
            </div>
        ) : (
            filteredUnits.map((unit) => (
                <div key={unit.id} className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold leading-none tracking-tight">{unit.nome}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{unit.endereco || 'Sem endereço cadastrado'}</p>
                        <div className="text-xs text-muted-foreground pt-2">
                            {unit.horario_abertura && unit.horario_fechamento ? (
                                <span>Horário: {unit.horario_abertura.slice(0, 5)} - {unit.horario_fechamento.slice(0, 5)}</span>
                            ) : (
                                <span>Horário não definido</span>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(unit)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setUnitToDelete(unit)}>
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Excluir
                        </Button>
                    </div>
                </div>
            ))
        )}
      </div>

      <UnitDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        unitToEdit={editingUnit}
        onSuccess={fetchUnits}
      />

      <AlertDialog open={!!unitToDelete} onOpenChange={(open) => !open && setUnitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a unidade
              <strong> {unitToDelete?.nome}</strong> e seus dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
