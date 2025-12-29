import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { scheduleService, TipoConsulta, Convenio, Plano } from '@/services/scheduleService';
import { patientService } from '@/services/patientService';
import { doctorService, MedicoComEspecialidade } from '@/services/doctorService';
import { useAuth } from '@/contexts/AuthContext';
import { Paciente, Agendamento } from '@/types';
import { format, parseISO } from 'date-fns';
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

const formSchema = z.object({
  paciente_id: z.string().min(1, 'Selecione um paciente'),
  medico_id: z.string().min(1, 'Selecione um médico'),
  tipo_consulta_id: z.string().min(1, 'Selecione o tipo'),
  convenio_id: z.string().optional(),
  plano_id: z.string().optional(),
  data_hora_inicio: z.string().min(1, 'Horário obrigatório'),
  observacoes: z.string().optional(),
  encaixe: z.boolean().default(false),
  status: z.enum(['agendado', 'confirmado', 'cancelado', 'realizado', 'falta']).optional(),
});

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  selectedDoctorId?: string;
  appointmentToEdit?: any | null; // Usando any por enquanto pois o tipo Agendamento do banco tem joins
  onSuccess: () => void;
}

export function AppointmentDialog({ open, onOpenChange, selectedDate, selectedDoctorId, appointmentToEdit, onSuccess }: AppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<MedicoComEspecialidade[]>([]);
  const [tiposConsulta, setTiposConsulta] = useState<TipoConsulta[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  
  const { toast } = useToast();
  const { organizacao, unidadeAtual, perfil } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paciente_id: '',
      medico_id: selectedDoctorId || '',
      tipo_consulta_id: '',
      convenio_id: '',
      plano_id: '',
      data_hora_inicio: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : '',
      observacoes: '',
      encaixe: false,
      status: 'agendado',
    },
  });

  const selectedConvenioId = form.watch('convenio_id');

  useEffect(() => {
    if (open && organizacao && unidadeAtual) {
      loadData();
    }
  }, [open, organizacao, unidadeAtual]);

  useEffect(() => {
    if (selectedConvenioId) {
      loadPlanos(selectedConvenioId);
    } else {
      setPlanos([]);
    }
  }, [selectedConvenioId]);
  
  useEffect(() => {
    if (appointmentToEdit) {
      // Preencher formulário com dados existentes
      form.reset({
        paciente_id: appointmentToEdit.paciente_id,
        medico_id: appointmentToEdit.medico_id,
        tipo_consulta_id: appointmentToEdit.tipo_consulta_id || '',
        convenio_id: appointmentToEdit.convenio_id || '',
        plano_id: appointmentToEdit.plano_id || '',
        data_hora_inicio: format(parseISO(appointmentToEdit.data_hora_inicio), "yyyy-MM-dd'T'HH:mm"),
        observacoes: appointmentToEdit.observacoes || '',
        encaixe: appointmentToEdit.encaixe || false,
        status: appointmentToEdit.status,
      });
      // Carregar planos se tiver convenio
      if (appointmentToEdit.convenio_id) {
        loadPlanos(appointmentToEdit.convenio_id);
      }
    } else {
      // Resetar para novo
      form.reset({
        paciente_id: '',
        medico_id: selectedDoctorId || '',
        tipo_consulta_id: '',
        convenio_id: '',
        plano_id: '',
        data_hora_inicio: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : '',
        observacoes: '',
        encaixe: false,
        status: 'agendado',
      });
    }
  }, [appointmentToEdit, selectedDate, selectedDoctorId, form, open]);

  const loadData = async () => {
    if (!organizacao) return;
    try {
      const [pacs, meds, tipos, convs] = await Promise.all([
        patientService.getPatients(organizacao.id),
        doctorService.getDoctors(organizacao.id),
        scheduleService.getTiposConsulta(organizacao.id),
        scheduleService.getConvenios(organizacao.id),
      ]);
      setPacientes(pacs);
      setMedicos(meds);
      setTiposConsulta(tipos);
      setConvenios(convs);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao carregar dados' });
    }
  };

  const loadPlanos = async (convenioId: string) => {
    try {
      const data = await scheduleService.getPlanos(convenioId);
      setPlanos(data);
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!organizacao || !unidadeAtual || !perfil) return;
    setLoading(true);

    try {
      // Calcular data fim baseado na duração da consulta da unidade
      const start = new Date(values.data_hora_inicio);
      const duration = unidadeAtual.duracao_consulta || 15;
      const end = new Date(start.getTime() + duration * 60000);

      const payload = {
        organizacao_id: organizacao.id,
        unidade_id: unidadeAtual.id,
        medico_id: values.medico_id,
        paciente_id: values.paciente_id,
        tipo_consulta_id: values.tipo_consulta_id,
        convenio_id: values.convenio_id || null,
        plano_id: values.plano_id || null,
        data_hora_inicio: start.toISOString(),
        data_hora_fim: end.toISOString(),
        status: values.status as any,
        observacoes: values.observacoes,
        encaixe: values.encaixe,
      };

      if (appointmentToEdit) {
        await scheduleService.updateAppointment(appointmentToEdit.id, payload);
        toast({ title: 'Agendamento atualizado com sucesso!' });
      } else {
        await scheduleService.createAppointment({
          ...payload,
          agendado_por_id: perfil.id,
        });
        toast({ title: 'Agendamento realizado com sucesso!' });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointmentToEdit) return;
    setLoading(true);
    try {
        await scheduleService.deleteAppointment(appointmentToEdit.id);
        toast({ title: 'Agendamento excluído' });
        onSuccess();
        onOpenChange(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{appointmentToEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
          <DialogDescription>
            {appointmentToEdit ? 'Atualize os dados ou mude o status.' : 'Preencha os detalhes da consulta.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Status Field - Only visible when editing */}
            {appointmentToEdit && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={
                            field.value === 'confirmado' ? 'bg-green-50 text-green-700 border-green-200' :
                            field.value === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                            field.value === 'realizado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            ''
                          }>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="realizado">Realizado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                          <SelectItem value="falta">Falta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="medico_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Médico</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {medicos.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_hora_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data e Hora</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <FormField
              control={form.control}
              name="paciente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo_consulta_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Consulta</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposConsulta.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                    control={form.control}
                    name="encaixe"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-auto">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                            Encaixe
                            </FormLabel>
                        </div>
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="convenio_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Convênio</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Particular" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Particular</SelectItem>
                          {convenios.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plano_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedConvenioId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {planos.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
                {appointmentToEdit && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" className="mr-auto">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {appointmentToEdit ? 'Atualizar' : 'Agendar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
