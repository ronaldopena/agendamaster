import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Perfil, Unidade, TipoPerfil } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { profileService } from '@/services/profileService';
import { unitService } from '@/services/unitService';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  tipo: z.enum(['admin', 'gerente', 'supervisor', 'atendente', 'medico']),
  unidade_padrao_id: z.string().optional(),
  password: z.string().optional(),
});

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileToEdit?: Perfil | null;
  onSuccess: () => void;
}

export function ProfileDialog({ open, onOpenChange, profileToEdit, onSuccess }: ProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unidade[]>([]);
  const { toast } = useToast();
  const { organizacao } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      nome: '',
      email: '',
      tipo: 'atendente',
      unidade_padrao_id: '',
    },
  });

  useEffect(() => {
    if (open && organizacao) {
      loadUnits();
    }
  }, [open, organizacao]);

  const loadUnits = async () => {
    if (!organizacao) return;
    try {
      const data = await unitService.getUnits(organizacao.id);
      setUnits(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (profileToEdit) {
      form.reset({
        nome: profileToEdit.nome,
        email: profileToEdit.email,
        tipo: profileToEdit.tipo,
        unidade_padrao_id: profileToEdit.unidade_padrao_id || 'none',
      });
    } else {
      form.reset({
        nome: '',
        email: '',
        tipo: 'atendente',
        unidade_padrao_id: 'none',
      });
    }
  }, [profileToEdit, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!organizacao) return;
    setLoading(true);

    try {
      const profileData = {
        ...values,
        organizacao_id: organizacao.id,
        unidade_padrao_id: (values.unidade_padrao_id === 'none' || !values.unidade_padrao_id) ? null : values.unidade_padrao_id,
      };

      if (profileToEdit) {
        // Se estiver editando E tiver senha preenchida, tentamos criar o usuário no Auth (vincular)
        if ((values as any).password) {
            await profileService.createProfileWithAuth({
                ...profileData,
                password: (values as any).password
            });
             toast({ title: 'Perfil atualizado e acesso de usuário habilitado!' });
        } else {
            await profileService.updateProfile(profileToEdit.id, profileData);
            toast({ title: 'Perfil atualizado com sucesso!' });
        }
      } else {
        if ((values as any).password) {
            // Cria usuário no Auth via Edge Function
            await profileService.createProfileWithAuth({
                ...profileData,
                password: (values as any).password
            });
            toast({ 
                title: 'Usuário e Perfil criados com sucesso!', 
                description: 'O usuário já pode fazer login no sistema.' 
            });
        } else {
            // Cria apenas o perfil (sem login)
            await profileService.createProfile(profileData as any);
            toast({ 
              title: 'Perfil criado com sucesso!', 
              description: 'Para acessar o sistema, será necessário vincular um usuário posteriormente.' 
            });
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar perfil',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{profileToEdit ? 'Editar Perfil' : 'Novo Perfil'}</DialogTitle>
          <DialogDescription>
            Gerencie os dados do usuário e suas permissões.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="joao@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!profileToEdit && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Perfil</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="atendente">Atendente</SelectItem>
                      <SelectItem value="medico">Médico</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unidade_padrao_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade Padrão</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
