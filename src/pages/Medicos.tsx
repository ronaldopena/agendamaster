import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doctorService, MedicoComEspecialidade } from '@/services/doctorService';
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
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import { DoctorDialog } from '@/components/doctors/DoctorDialog';
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

export default function Medicos() {
  const { organizacao } = useAuth();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<MedicoComEspecialidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<MedicoComEspecialidade | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<MedicoComEspecialidade | null>(null);

  const fetchDoctors = async () => {
    if (!organizacao) return;
    setLoading(true);
    try {
      const data = await doctorService.getDoctors(organizacao.id);
      setDoctors(data);
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar médicos",
        description: "Não foi possível carregar a lista de médicos.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [organizacao]);

  const handleEdit = (doctor: MedicoComEspecialidade) => {
    setEditingDoctor(doctor);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!doctorToDelete) return;
    try {
      await doctorService.deleteDoctor(doctorToDelete.id);
      toast({ title: "Médico excluído com sucesso" });
      fetchDoctors();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o médico.",
      });
    } finally {
      setDoctorToDelete(null);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.crm?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Médicos</h2>
          <p className="text-muted-foreground mt-2">
            Gerencie o corpo clínico ({doctors.length} total).
          </p>
        </div>
        <Button onClick={() => { setEditingDoctor(null); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Médico
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CRM..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CRM</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Carregando...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDoctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Nenhum médico encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.nome}</TableCell>
                  <TableCell>{doctor.crm || '-'}</TableCell>
                  <TableCell>{doctor.especialidades?.nome || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(doctor)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDoctorToDelete(doctor)}>
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

      <DoctorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        doctorToEdit={editingDoctor}
        onSuccess={fetchDoctors}
      />

      <AlertDialog open={!!doctorToDelete} onOpenChange={(open) => !open && setDoctorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o médico
              <strong> {doctorToDelete?.nome}</strong> e seus dados associados.
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
