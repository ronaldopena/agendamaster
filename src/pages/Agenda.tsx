import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Plus, User, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, subDays, startOfDay, addMinutes, parse, isBefore, areIntervalsOverlapping, differenceInMinutes, parseISO, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { scheduleService } from '@/services/scheduleService';
import { doctorService, MedicoComEspecialidade } from '@/services/doctorService';
import { AppointmentDialog } from '@/components/schedule/AppointmentDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  DndContext, 
  DragOverlay, 
  useDraggable, 
  useDroppable, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useToast } from '@/hooks/use-toast';

// --- Components for DnD ---

function DraggableAppointment({ 
  appointment, 
  onClick, 
  onRemarcar,
  onEncaixe,
  className 
}: { 
  appointment: any, 
  onClick: (e: React.MouseEvent) => void, 
  onRemarcar: (appt: any) => void,
  onEncaixe: (appt: any) => void,
  className?: string 
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(appointment.id), // Garantir que seja string
    data: appointment,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: 0.5,
    zIndex: 999,
  } : undefined;

  // Calcular idade
  const idade = appointment.pacientes?.data_nascimento 
    ? differenceInYears(new Date(), parseISO(appointment.pacientes.data_nascimento)) 
    : null;

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full flex-1 h-full">
        <div 
          ref={setNodeRef} 
          style={style} 
          {...listeners} 
          {...attributes}
          className={cn(className, isDragging && "opacity-50", "h-full flex flex-col justify-between w-full")}
          onClick={onClick}
        >
          <div className="flex justify-between items-start mb-1 w-full">
              <span className="font-bold truncate text-slate-700 flex-1">
                 {appointment.pacientes?.nome}
              </span>
              {appointment.encaixe && (
                  <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-1 rounded shrink-0 ml-1">Encaixe</span>
              )}
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-xs">
              <User className="h-3 w-3" />
              {idade !== null ? `${idade} anos` : 'Idade N/I'}
          </div>
          <div className="mt-1 text-xs text-slate-500 truncate w-full">
              {appointment.tipos_consulta?.nome}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onRemarcar(appointment)}>Remarcar</ContextMenuItem>
        <ContextMenuItem onClick={() => onEncaixe(appointment)}>Encaixe</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function DroppableCell({ 
  slot, 
  doctorId, 
  children, 
  onClick, 
  className 
}: { 
  slot: Date, 
  doctorId: string, 
  children: React.ReactNode, 
  onClick: () => void, 
  className?: string 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${slot.toISOString()}|${doctorId}`,
    data: { slot, doctorId }
  });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(className, isOver && "bg-blue-50 ring-2 ring-inset ring-blue-300")}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// --- Main Component ---

export default function Agenda() {
  const { organizacao, unidadeAtual } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [doctors, setDoctors] = useState<MedicoComEspecialidade[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEncaixe, setIsEncaixe] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [clickedDoctorId, setClickedDoctorId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeAppointment, setActiveAppointment] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // Enable click on drag items without dragging immediately
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

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

  const handleNewAppointment = (slotDate?: Date, doctorId?: string, encaixe: boolean = false) => {
    setEditingAppointment(null);
    setSelectedSlot(slotDate || null);
    setClickedDoctorId(doctorId || null);
    setIsEncaixe(encaixe);
    setIsDialogOpen(true);
  };

  const handleEditAppointment = (appointment: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event bubbling to prevent cell click
    setEditingAppointment(appointment);
    setSelectedSlot(null);
    setClickedDoctorId(appointment.medico_id);
    setIsEncaixe(false);
    setIsDialogOpen(true);
  };

  const handleRemarcar = (appointment: any) => {
    console.log('Remarcar solicitado para:', appointment);
    toast({
        title: "Remarcar",
        description: `Funcionalidade de remarcar selecionada para ${appointment.pacientes?.nome || 'o paciente'}.`,
    });
  };

  const handleEncaixe = (appointment: any) => {
    const slot = new Date(appointment.data_hora_inicio);
    handleNewAppointment(slot, appointment.medico_id, true);
  };

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const appointment = appointments.find(a => a.id === event.active.id);
    setActiveAppointment(appointment);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveAppointment(null);

    if (!over) return;

    const appointmentId = active.id as string;
    const appointment = appointments.find(a => a.id === appointmentId);
    
    if (!appointment) return;

    const { slot: newStartTime, doctorId: newDoctorId } = over.data.current as { slot: Date, doctorId: string };

    // Calculate new end time
    const oldStart = new Date(appointment.data_hora_inicio);
    const oldEnd = new Date(appointment.data_hora_fim);
    const durationMinutes = differenceInMinutes(oldEnd, oldStart);
    
    const newEndTime = addMinutes(newStartTime, durationMinutes);

    // Check if changed
    if (oldStart.getTime() === newStartTime.getTime() && appointment.medico_id === newDoctorId) {
        return;
    }

    // Optimistic Update
    const oldAppointments = [...appointments];
    setAppointments(prev => prev.map(appt => {
        if (appt.id === appointmentId) {
            return {
                ...appt,
                data_hora_inicio: newStartTime.toISOString(),
                data_hora_fim: newEndTime.toISOString(),
                medico_id: newDoctorId,
                medicos: doctors.find(d => d.id === newDoctorId) || appt.medicos // Optimistic doctor update
            };
        }
        return appt;
    }));

    try {
        await scheduleService.updateAppointment(appointmentId, {
            data_hora_inicio: newStartTime.toISOString(),
            data_hora_fim: newEndTime.toISOString(),
            medico_id: newDoctorId
        });
        console.log('Agendamento atualizado com sucesso (Drag & Drop)');
        // Optionally refetch to ensure consistency
        // await fetchAppointments(); 
    } catch (error) {
        console.error('Erro ao atualizar agendamento via Drag & Drop:', error);
        // Revert on error
        setAppointments(oldAppointments);
        // Show toast/alert
        alert("Erro ao mover agendamento. Tente novamente.");
    }
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

    // Debug apenas se houver agendamentos e for o primeiro slot para não poluir
    // if (appointments.length > 0 && slotTime.getHours() === 8 && slotTime.getMinutes() === 0) {
    //    console.log('Checking slot:', slotTime, 'Doctor:', doctorId, 'Appointments:', appointments.length);
    // }

    return appointments.filter(appt => {
      // Verificar se o agendamento pertence a este médico
      if (appt.medico_id !== doctorId) return false;

      // Parse seguro das datas
      let apptStart: Date;
      let apptEnd: Date;

      try {
          apptStart = typeof appt.data_hora_inicio === 'string' 
              ? parseISO(appt.data_hora_inicio) 
              : new Date(appt.data_hora_inicio);
              
          apptEnd = typeof appt.data_hora_fim === 'string' 
              ? parseISO(appt.data_hora_fim) 
              : new Date(appt.data_hora_fim);
      } catch (e) {
          console.error('Erro ao fazer parse da data do agendamento:', appt, e);
          return false;
      }

      // Verificar sobreposição
      // Usamos inclusive: false para evitar que um agendamento que termina às 10:00 apareça no slot das 10:00
      // Mas precisamos garantir que ele apareça no slot correto.
      // areIntervalsOverlapping padrão é inclusivo nas bordas.
      
      const isOverlapping = areIntervalsOverlapping(
        { start: slotTime, end: slotEnd },
        { start: apptStart, end: apptEnd },
        { inclusive: false } // Evita duplicidade em bordas exatas
      );

      // Debug específico para entender por que não está aparecendo
      if (appointments.length > 0 && !isOverlapping) {
         // Verificar se deveria aparecer (ex: começa dentro do slot)
         // Se o agendamento começa >= slotStart e < slotEnd
         if (apptStart >= slotTime && apptStart < slotEnd) {
             console.log('DEBUG: Agendamento deveria aparecer neste slot mas areIntervalsOverlapping retornou false', {
                 slot: { start: slotTime.toISOString(), end: slotEnd.toISOString() },
                 appt: { start: apptStart.toISOString(), end: apptEnd.toISOString(), id: appt.id },
                 inclusive: false
             });
             return true; // Forçar true se começar dentro do slot
         }
      }

      return isOverlapping;
    });
  };

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
        {/* Header da Agenda */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border shrink-0">
          <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handlePrevDay}>
                  <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal h-auto py-2",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                        <span className="font-semibold text-sm capitalize leading-none">
                            {format(selectedDate, "EEEE", { locale: ptBR })}
                        </span>
                        <span className="text-xs text-muted-foreground leading-none mt-1">
                            {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="icon" onClick={handleNextDay}>
                  <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="default" 
                onClick={handleToday} 
                className="text-sm"
              >
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
                                          <DroppableCell 
                                              key={doc.id} 
                                              slot={slot}
                                              doctorId={doc.id}
                                              className={cn(
                                                  "flex-1 min-w-[200px] border-r relative p-1 min-h-[60px] transition-colors",
                                                  !hasAppointments && "hover:bg-slate-100 cursor-pointer group/cell"
                                              )}
                                              onClick={() => !hasAppointments && handleNewAppointment(slot, doc.id)}
                                          >
                                              {/* Add Button (Invisible unless hover/empty) */}
                                              {!hasAppointments && (
                                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none">
                                                       <Plus className="h-4 w-4 text-slate-400" />
                                                  </div>
                                              )}

                                              {/* Appointments */}
                                              <div className="flex gap-1 overflow-x-auto h-full items-start">
                                                  {slotAppointments.map(appt => (
                                                      <DraggableAppointment
                                                          key={appt.id}
                                                          appointment={appt}
                                                          onClick={(e) => handleEditAppointment(appt, e)}
                                                          onRemarcar={handleRemarcar}
                                                          onEncaixe={handleEncaixe}
                                                          className={cn(
                                                              "p-2 rounded text-xs cursor-grab active:cursor-grabbing border shadow-sm hover:shadow-md transition-all touch-none select-none min-w-[140px] flex-1",
                                                              appt.encaixe ? "bg-orange-100 border-orange-200 text-orange-900" : 
                                                              appt.status === 'confirmado' ? "bg-green-100 border-green-200 text-green-900" :
                                                              "bg-blue-100 border-blue-200 text-blue-900"
                                                          )}
                                                      />
                                                  ))}
                                              </div>
                                          </DroppableCell>
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
          isEncaixe={isEncaixe}
        />

        <DragOverlay>
           {activeAppointment ? (
               <div className={cn(
                  "p-2 rounded text-xs border shadow-lg w-[200px]",
                  activeAppointment.encaixe ? "bg-orange-100 border-orange-200 text-orange-900" : 
                  activeAppointment.status === 'confirmado' ? "bg-green-100 border-green-200 text-green-900" :
                  "bg-blue-100 border-blue-200 text-blue-900"
              )}>
                  <div className="flex justify-between items-start mb-1">
                      <span className="font-bold truncate text-slate-700">
                         {activeAppointment.pacientes?.nome}
                      </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <Clock className="h-3 w-3" />
                      {format(new Date(activeAppointment.data_hora_inicio), 'HH:mm')}
                  </div>
               </div>
           ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
