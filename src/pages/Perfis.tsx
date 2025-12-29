import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, UserCog, Building2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { profileService } from '@/services/profileService';
import { ProfileDialog } from '@/components/profiles/ProfileDialog';
import { useToast } from '@/hooks/use-toast';
import { Perfil } from '@/types';

export default function Perfis() {
  const [profiles, setProfiles] = useState<(Perfil & { unidade_padrao?: { nome: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<Perfil | null>(null);
  const { organizacao } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (organizacao) {
      loadProfiles();
    }
  }, [organizacao]);

  const loadProfiles = async () => {
    if (!organizacao) return;
    setLoading(true);
    try {
      const data = await profileService.getProfiles(organizacao.id);
      setProfiles(data);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao carregar perfis' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile: Perfil) => {
    setProfileToEdit(profile);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await profileService.deleteProfile(id);
      toast({ title: 'Perfil excluído com sucesso' });
      loadProfiles();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao excluir perfil' });
    }
  };

  const handleNew = () => {
    setProfileToEdit(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Perfis de Usuário</h1>
            <p className="text-muted-foreground">Gerencie os usuários e permissões do sistema.</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Perfil
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidade Padrão</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Nenhum perfil encontrado.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                    {profile.nome}
                  </TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${profile.tipo === 'admin' ? 'bg-purple-100 text-purple-800' :
                          profile.tipo === 'medico' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {profile.tipo}
                    </span>
                  </TableCell>
                  <TableCell>
                    {profile.unidade_padrao ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {profile.unidade_padrao.nome}
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-xs italic">Não definida</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(profile)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir perfil?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação excluirá o perfil de <strong>{profile.nome}</strong>. 
                                    Isso pode impedir o acesso do usuário ao sistema.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(profile.id)} className="bg-destructive text-destructive-foreground">
                                    Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProfileDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        profileToEdit={profileToEdit}
        onSuccess={loadProfiles}
      />
    </div>
  );
}
