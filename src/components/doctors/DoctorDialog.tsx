import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Medico } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doctorService } from '@/services/doctorService';
import { specialtyService, Especialidade } from '@/services/specialtyService';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  crm: z.string().min(1, 'CRM é obrigatório'),
  especialidade_id: z.string().optional(),
});

interface DoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorToEdit?: Medico | null;
  onSuccess: () => void;
}

export function DoctorDialog({ open, onOpenChange, doctorToEdit, onSuccess }: DoctorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState<Especialidade[]>([]);
  const [newSpecialtyName, setNewSpecialtyName] = useState('');
  const [isAddingSpecialty, setIsAddingSpecialty] = useState(false);
  
  const { toast } = useToast();
  const { organizacao } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      crm: '',
      especialidade_id: undefined,
    },
  });

  useEffect(() => {
    if (open && organizacao) {
      loadSpecialties();
    }
  }, [open, organizacao]);

  useEffect(() => {
    if (doctorToEdit) {
      form.reset({
        nome: doctorToEdit.nome,
        crm: doctorToEdit.crm || '',
        especialidade_id: doctorToEdit.especialidade_id || undefined,
      });
    } else {
      form.reset({
        nome: '',
        crm: '',
        especialidade_id: undefined,
      });
    }
  }, [doctorToEdit, form, open]);

  const loadSpecialties = async () => {
    if (!organizacao) return;
    try {
      const data = await specialtyService.getSpecialties(organizacao.id);
      setSpecialties(data);
    } catch (error) {
      console.error('Erro ao carregar especialidades', error);
    }
  };

  const handleCreateSpecialty = async () => {
    if (!newSpecialtyName.trim() || !organizacao) return;
    try {
      setLoading(true);
      const newSpecialty = await specialtyService.createSpecialty({
        organizacao_id: organizacao.id,
        nome: newSpecialtyName,
      });
      setSpecialties([...specialties, newSpecialty]);
      form.setValue('especialidade_id', newSpecialty.id);
      setNewSpecialtyName('');
      setIsAddingSpecialty(false);
      toast({ title: 'Especialidade criada!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao criar especialidade' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!organizacao) return;
    setLoading(true);

    try {
      const doctorData = {
        ...values,
        organizacao_id: organizacao.id,
      };

      if (doctorToEdit) {
        await doctorService.updateDoctor(doctorToEdit.id, doctorData);
        toast({ title: 'Médico atualizado com sucesso!' });
      } else {
        await doctorService.createDoctor(doctorData);
        toast({ title: 'Médico criado com sucesso!' });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar médico',
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
          <DialogTitle>{doctorToEdit ? 'Editar Médico' : 'Novo Médico'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do médico abaixo.
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
                    <Input placeholder="Dr. Fulano de Tal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="crm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CRM</FormLabel>
                  <FormControl>
                    <Input placeholder="12345/UF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="especialidade_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade</FormLabel>
                  <div className="flex gap-2">
                     {!isAddingSpecialty ? (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione uma especialidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {specialties.map((spec) => (
                              <SelectItem key={spec.id} value={spec.id}>
                                {spec.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     ) : (
                        <Input 
                            placeholder="Nova especialidade..." 
                            value={newSpecialtyName}
                            onChange={(e) => setNewSpecialtyName(e.target.value)}
                        />
                     )}
                     
                     {!isAddingSpecialty ? (
                         <Button type="button" variant="outline" size="icon" onClick={() => setIsAddingSpecialty(true)}>
                             <Plus className="h-4 w-4" />
                         </Button>
                     ) : (
                         <Button type="button" onClick={handleCreateSpecialty} disabled={loading}>
                             OK
                         </Button>
                     )}
                  </div>
                  {isAddingSpecialty && (
                      <Button type="button" variant="ghost" size="sm" className="mt-1 h-auto p-0 text-xs text-muted-foreground" onClick={() => setIsAddingSpecialty(false)}>
                          Cancelar
                      </Button>
                  )}
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
