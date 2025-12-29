import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { format, addDays, subDays, startOfDay, addMinutes, parse, isBefore, areIntervalsOverlapping } from 'date-fns';
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
  const [clickedDoctorId, setClickedDoctorId] = useState<string | null>(null);

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
      
      console.log('Fetching appointments:', { 
        org: organizacao.id, 
        unit: unidadeAtual.id, 
        start, 
        end, 
        doctor: selectedDoctorId 
      });

      const data = await scheduleService.getAppointments(
        organizacao.id,
        unidadeAtual.id,
        start,
        end,
        selectedDoctorId === 'all' ? undefined : selectedDoctorId
      );
      console.log('Appointments found:', data);
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

  const handleNewAppointment = (slotDate?: Date, doctorId?: string) => {
    setEditingAppointment(null);
    setSelectedSlot(slotDate || null);
    setClickedDoctorId(doctorId || null);
    setIsDialogOpen(true);
  };

  const handleEditAppointment = (appointment: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAppointment(appointment);
    setSelectedSlot(null);
    setClickedDoctorId(appointment.medico_id);
    setIsDialogOpen(true);
  };

  // Filtrar médicos visíveis nas colunas
  const visibleDoctors = useMemo(() => {
    if (selectedDoctorId === 'all') return doctors;
    return doctors.filter(d => d.id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  // Gerar Slots de Horário
  const timeSlots = useMemo(() => {
    if (!unidadeAtual) return [];

    const slots: Date[] = [];
    const openTime = unidadeAtual.horario_abertura?.substring(0, 5) || '08:00';
    const closeTime = unidadeAtual.horario_fechamento?.substring(0, 5) || '18:00';
    const duration = unidadeAtual.duracao_consulta || 15;

    // Criar datas baseadas no dia selecionado
    const start = parse(openTime, 'HH:mm', selectedDate);
    let end = parse(closeTime, 'HH:mm', selectedDate);
    
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

  // Função para encontrar agendamentos em um slot e médico específico
  const getAppointmentsForSlotAndDoctor = (slotTime: Date, doctorId: string) => {
    if (!unidadeAtual) return [];
    const duration = unidadeAtual.duracao_consulta || 15;
    const slotEnd = addMinutes(slotTime, duration);

    return appointments.filter(appt => {
      if (appt.medico_id !== doctorId) return false;

      const apptStart = new Date(appt.data_hora_inicio);
      const apptEnd = new Date(appt.data_hora_fim);

      return areIntervalsOverlapping(
        { start: slotTime, end: slotEnd },
        { start: apptStart, end: apptEnd }
      );
    });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      {/* Header da Agenda */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border shrink-0">
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

      {/* Grid de Horários - Layout de Tabela/Matriz */}
      <div className="bg-white rounded-lg border shadow-sm flex-1 overflow-hidden flex flex-col">
        {loading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <div className="overflow-auto flex-1">
                <div className="min-w-max">
                    {/* Header Row: Time + Doctors */}
                    <div className="flex border-b sticky top-0 bg-white z-20 shadow-sm">
                        <div className="w-20 md:w-24 shrink-0 p-4 border-r bg-slate-50 font-medium text-muted-foreground flex items-center justify-center sticky left-0 z-30 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                            <Clock className="w-4 h-4" />
                        </div>
                        {visibleDoctors.map(doc => (
                            <div key={doc.id} className="flex-1 min-w-[200px] p-3 text-center border-r font-semibold text-slate-700 bg-slate-50 flex flex-col items-center justify-center">
                                <span>{doc.nome}</span>
                                <span className="text-xs text-muted-foreground font-normal mt-0.5">
                                    {doc.especialidades?.nome || 'Especialidade não inf.'}
                                </span>
                            </div>
                        ))}
                        {visibleDoctors.length === 0 && (
                            <div className="flex-1 p-4 text-center text-muted-foreground">
                                Nenhum médico encontrado para esta unidade.
                            </div>
                        )}
                    </div>

                    {/* Body Rows */}
                    {timeSlots.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Nenhum horário disponível configurado para esta unidade.
                            Verifique os horários de abertura e fechamento.
                        </div>
                    ) : (
                        timeSlots.map((slot, index) => (
                            <div key={index} className="flex border-b hover:bg-slate-50/30 transition-colors group/row">
                                {/* Time Column */}
                                <div className="w-20 md:w-24 shrink-0 border-r p-2 flex items-center justify-center bg-slate-50 text-sm font-medium text-muted-foreground sticky left-0 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] group-hover/row:bg-slate-100 transition-colors">
                                    {format(slot, 'HH:mm')}
                                </div>

                                {/* Doctor Columns */}
                                {visibleDoctors.map(doc => {
                                    const slotAppointments = getAppointmentsForSlotAndDoctor(slot, doc.id);
                                    const hasAppointments = slotAppointments.length > 0;

                                    return (
                                        <div 
                                            key={doc.id} 
                                            className={cn(
                                                "flex-1 min-w-[200px] border-r relative p-1 min-h-[60px] transition-colors",
                                                !hasAppointments && "hover:bg-slate-100 cursor-pointer group/cell"
                                            )}
                                            onClick={() => !hasAppointments && handleNewAppointment(slot, doc.id)}
                                        >
                                            {/* Add Button (Invisible unless hover/empty) */}
                                            {!hasAppointments && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                     <Plus className="h-4 w-4 text-slate-400" />
                                                </div>
                                            )}

                                            {/* Appointments */}
                                            <div className="space-y-1">
                                                {slotAppointments.map(appt => (
                                                    <div 
                                                        key={appt.id}
                                                        onClick={(e) => handleEditAppointment(appt, e)}
                                                        className={cn(
                                                            "p-2 rounded text-xs cursor-pointer border shadow-sm hover:shadow-md transition-all",
                                                            appt.encaixe ? "bg-orange-100 border-orange-200 text-orange-900" : 
                                                            appt.status === 'confirmado' ? "bg-green-100 border-green-200 text-green-900" :
                                                            "bg-blue-100 border-blue-200 text-blue-900"
                                                        )}
                                                    >
                                                        <div className="font-semibold truncate" title={appt.pacientes?.nome}>
                                                            {appt.pacientes?.nome}
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="truncate max-w-[100px]" title={appt.tipos_consulta?.nome}>
                                                                {appt.tipos_consulta?.nome}
                                                            </span>
                                                            {appt.encaixe && (
                                                                <span className="text-[10px] font-bold px-1 bg-white/50 rounded shrink-0 ml-1">
                                                                    Encaixe
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
      </div>

      <AppointmentDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedSlot || selectedDate}
        selectedDoctorId={clickedDoctorId || (selectedDoctorId !== 'all' ? selectedDoctorId : undefined)}
        appointmentToEdit={editingAppointment}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}
