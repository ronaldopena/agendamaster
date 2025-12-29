import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Plus } from 'lucide-react';
import { format, addDays, subDays, startOfDay, isSameDay, addMinutes, parse, isBefore, isWithinInterval, areIntervalsOverlapping } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { scheduleService } from '@/services/scheduleService';
import { doctorService, MedicoComEspecialidade } from '@/services/doctorService';
import { AppointmentDialog } from '@/components/schedule/AppointmentDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Agenda() {
  const { organizacao, unidadeAtual } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [doctors, setDoctors] = useState<MedicoComEspecialidade[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  // Carregar médicos
  useEffect(() => {
    if (organizacao) {
      doctorService.getDoctors(organizacao.id).then(setDoctors);
    }
  }, [organizacao]);

  // Carregar agendamentos
  const fetchAppointments = async () => {
    if (!organizacao || !unidadeAtual) return;
    setLoading(true);
    try {
      const start = startOfDay(selectedDate).toISOString();
      const end = startOfDay(addDays(selectedDate, 1)).toISOString();
      
      const data = await scheduleService.getAppointments(
        organizacao.id,
        unidadeAtual.id,
        start,
        end,
        selectedDoctorId === 'all' ? undefined : selectedDoctorId
      );
      setAppointments(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, selectedDoctorId, organizacao, unidadeAtual]);

  const handlePrevDay = () => setSelectedDate(curr => subDays(curr, 1));
  const handleNextDay = () => setSelectedDate(curr => addDays(curr, 1));
  const handleToday = () => setSelectedDate(new Date());

  const handleNewAppointment = (slotDate?: Date) => {
    console.log('handleNewAppointment called', { slotDate });
    setEditingAppointment(null);
    setSelectedSlot(slotDate || null);
    setIsDialogOpen(true);
  };

  const handleEditAppointment = (appointment: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAppointment(appointment);
    setSelectedSlot(null);
    setIsDialogOpen(true);
  };

  // Gerar Slots de Horário
  const timeSlots = useMemo(() => {
    if (!unidadeAtual) return [];

    const slots: Date[] = [];
    const openTime = unidadeAtual.horario_abertura || '08:00';
    const closeTime = unidadeAtual.horario_fechamento || '18:00';
    const duration = unidadeAtual.duracao_consulta || 15;

    // Criar datas baseadas no dia selecionado
    const start = parse(openTime, 'HH:mm', selectedDate);
    let end = parse(closeTime, 'HH:mm', selectedDate);
    
    // Se o horário de fechamento for menor que abertura, assume que é dia seguinte (ex: 02:00)
    // Mas para simplificar, vamos assumir horários no mesmo dia por enquanto.
    if (isBefore(end, start)) {
        end = addDays(end, 1);
    }

    let current = start;
    while (isBefore(current, end)) {
      slots.push(current);
      current = addMinutes(current, duration);
    }

    return slots;
  }, [unidadeAtual, selectedDate]);

  // Função para encontrar agendamentos em um slot
  const getAppointmentsForSlot = (slotTime: Date) => {
    if (!unidadeAtual) return [];
    const duration = unidadeAtual.duracao_consulta || 15;
    const slotEnd = addMinutes(slotTime, duration);

    return appointments.filter(appt => {
      const apptStart = new Date(appt.data_hora_inicio);
      const apptEnd = new Date(appt.data_hora_fim);

      // Verifica intersecção de horários
      // O slot começa em T e termina em T+Duration.
      // O agendamento deve começar dentro desse intervalo OU cobrir esse intervalo.
      // Simplificando: Se o agendamento começa exatamente no slot, ou se ele cobre o slot.
      
      // Lógica de intersecção:
      return areIntervalsOverlapping(
        { start: slotTime, end: slotEnd },
        { start: apptStart, end: apptEnd }
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header da Agenda */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevDay}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col items-center min-w-[150px]">
                <span className="font-semibold text-lg capitalize">
                    {format(selectedDate, "EEEE", { locale: ptBR })}
                </span>
                <span className="text-sm text-muted-foreground">
                    {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </span>
            </div>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={handleToday} className="text-sm">
                Hoje
            </Button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por Médico" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Médicos</SelectItem>
                    {doctors.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>{doc.nome}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={() => handleNewAppointment()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Agendamento
            </Button>
        </div>
      </div>

      {/* Grid de Horários */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
            <div className="flex justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <div className="divide-y">
                {timeSlots.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Nenhum horário disponível configurado para esta unidade.
                        Verifique os horários de abertura e fechamento.
                    </div>
                ) : (
                    timeSlots.map((slot, index) => {
                        const slotAppointments = getAppointmentsForSlot(slot);
                        const hasAppointments = slotAppointments.length > 0;
                        const isPast = isBefore(slot, new Date());

                        return (
                            <div 
                                key={index} 
                                className={cn(
                                    "flex min-h-[80px] group transition-colors",
                                    hasAppointments ? "bg-white" : "hover:bg-slate-50"
                                )}
                            >
                                {/* Coluna da Hora */}
                                <div className="w-20 md:w-24 border-r p-4 flex flex-col items-center justify-center bg-slate-50 text-sm font-medium text-muted-foreground">
                                    {format(slot, 'HH:mm')}
                                </div>

                                {/* Coluna do Conteúdo */}
                                <div className="flex-1 p-2 relative">
                                    {/* Botão de adicionar invisível que aparece no hover (se vazio) */}
                                    {!hasAppointments && (
                                        <button 
                                            className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleNewAppointment(slot)}
                                        >
                                            <div className="flex items-center gap-2 text-primary font-medium bg-primary/10 px-4 py-2 rounded-full">
                                                <Plus className="h-4 w-4" />
                                                Agendar
                                            </div>
                                        </button>
                                    )}

                                    {/* Lista de Agendamentos no Slot */}
                                    <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                        {slotAppointments.map(appt => (
                                            <div 
                                                key={appt.id}
                                                onClick={(e) => handleEditAppointment(appt, e)}
                                                className={cn(
                                                    "p-3 rounded-md border text-sm cursor-pointer transition-all hover:shadow-md",
                                                    appt.encaixe ? "bg-orange-50 border-orange-200" : 
                                                    appt.status === 'confirmado' ? "bg-green-50 border-green-200" :
                                                    "bg-blue-50 border-blue-200"
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-slate-700">
                                                        {format(new Date(appt.data_hora_inicio), 'HH:mm')} - {appt.pacientes?.nome}
                                                    </span>
                                                    {appt.encaixe && (
                                                        <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-1 rounded">Encaixe</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-500 text-xs">
                                                    <User className="h-3 w-3" />
                                                    Dr. {appt.medicos?.nome}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {appt.tipos_consulta?.nome}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        )}
      </div>

      <AppointmentDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedSlot || selectedDate} // Usa o slot selecionado ou o dia atual
        selectedDoctorId={selectedDoctorId !== 'all' ? selectedDoctorId : undefined}
        appointmentToEdit={editingAppointment}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}
