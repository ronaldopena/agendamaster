import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Paciente } from '@/types';
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
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { patientService } from '@/services/patientService';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF inválido').optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().min(8, 'Telefone inválido').optional().or(z.literal('')),
  data_nascimento: z.string().optional().or(z.literal('')),
});

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientToEdit?: Paciente | null;
  onSuccess: () => void;
}

export function PatientDialog({ open, onOpenChange, patientToEdit, onSuccess }: PatientDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { organizacao } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      data_nascimento: '',
    },
  });

  useEffect(() => {
    if (patientToEdit) {
      form.reset({
        nome: patientToEdit.nome,
        cpf: patientToEdit.cpf || '',
        email: patientToEdit.email || '',
        telefone: patientToEdit.telefone || '',
        data_nascimento: patientToEdit.data_nascimento || '',
      });
    } else {
      form.reset({
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        data_nascimento: '',
      });
    }
  }, [patientToEdit, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!organizacao) return;
    setLoading(true);

    try {
      const patientData = {
        ...values,
        organizacao_id: organizacao.id,
        // Limpar campos vazios para undefined ou null se necessário, mas o supabase lida bem com string vazia ou null dependendo da coluna
        // Aqui vamos mandar como está, ajustando data se vazia
        data_nascimento: values.data_nascimento || undefined,
      };

      if (patientToEdit) {
        await patientService.updatePatient(patientToEdit.id, patientData);
        toast({ title: 'Paciente atualizado com sucesso!' });
      } else {
        await patientService.createPatient(patientData);
        toast({ title: 'Paciente criado com sucesso!' });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar paciente',
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
          <DialogTitle>{patientToEdit ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do paciente abaixo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="joao@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
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
