import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Unidade } from '@/types';
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
import { unitService } from '@/services/unitService';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  horario_abertura: z.string().optional(),
  horario_fechamento: z.string().optional(),
  duracao_consulta: z.coerce.number().min(5, 'Duração mínima de 5 minutos'),
});

interface UnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitToEdit?: Unidade | null;
  onSuccess: () => void;
}

export function UnitDialog({ open, onOpenChange, unitToEdit, onSuccess }: UnitDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { organizacao } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      nome: '',
      endereco: '',
      telefone: '',
      horario_abertura: '',
      horario_fechamento: '',
      duracao_consulta: 15,
    },
  });

  useEffect(() => {
    if (unitToEdit) {
      form.reset({
        nome: unitToEdit.nome,
        endereco: unitToEdit.endereco || '',
        telefone: unitToEdit.telefone || '',
        horario_abertura: unitToEdit.horario_abertura || '',
        horario_fechamento: unitToEdit.horario_fechamento || '',
        duracao_consulta: unitToEdit.duracao_consulta || 15,
      });
    } else {
      form.reset({
        nome: '',
        endereco: '',
        telefone: '',
        horario_abertura: '',
        horario_fechamento: '',
        duracao_consulta: 15,
      });
    }
  }, [unitToEdit, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!organizacao) return;
    setLoading(true);

    try {
      const unitData = {
        ...values,
        organizacao_id: organizacao.id,
      };

      if (unitToEdit) {
        await unitService.updateUnit(unitToEdit.id, unitData);
        toast({ title: 'Unidade atualizada com sucesso!' });
      } else {
        await unitService.createUnit(unitData);
        toast({ title: 'Unidade criada com sucesso!' });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar unidade',
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
          <DialogTitle>{unitToEdit ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
          <DialogDescription>
            Preencha os dados da unidade clínica abaixo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Unidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Matriz - Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua das Flores, 123" {...field} />
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
                    <Input placeholder="(00) 0000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="horario_abertura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abertura</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="horario_fechamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fechamento</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="duracao_consulta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração da Consulta (minutos)</FormLabel>
                  <FormControl>
                    <Input type="number" min="5" step="5" {...field} />
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
