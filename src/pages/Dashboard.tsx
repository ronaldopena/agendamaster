import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Calendar, Users, Stethoscope, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { organizacao, unidadeAtual } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    consultasHoje: 0,
    pacientesTotal: 0,
    medicosTotal: 0,
    consultasConfirmadas: 0,
    consultasPendentes: 0,
  });

  const fetchStats = async () => {
    if (!organizacao) return;
    setLoading(true);
    try {
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      // Consultas Hoje
      let queryConsultasHoje = supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacao.id)
        .gte('data_hora_inicio', todayStart)
        .lte('data_hora_inicio', todayEnd);
      
      if (unidadeAtual) {
        queryConsultasHoje = queryConsultasHoje.eq('unidade_id', unidadeAtual.id);
      }
      const { count: consultasHoje } = await queryConsultasHoje;

      // Pacientes Total
      const { count: pacientesTotal } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacao.id);

      // Médicos Total
      const { count: medicosTotal } = await supabase
        .from('medicos')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacao.id);

      // Status das Consultas (Hoje)
      let queryConfirmadas = supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacao.id)
        .eq('status', 'confirmado')
        .gte('data_hora_inicio', todayStart)
        .lte('data_hora_inicio', todayEnd);

      if (unidadeAtual) {
        queryConfirmadas = queryConfirmadas.eq('unidade_id', unidadeAtual.id);
      }
      const { count: consultasConfirmadas } = await queryConfirmadas;

      let queryPendentes = supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacao.id)
        .eq('status', 'agendado')
        .gte('data_hora_inicio', todayStart)
        .lte('data_hora_inicio', todayEnd);
        
      if (unidadeAtual) {
        queryPendentes = queryPendentes.eq('unidade_id', unidadeAtual.id);
      }
      const { count: consultasPendentes } = await queryPendentes;

      setStats({
        consultasHoje: consultasHoje || 0,
        pacientesTotal: pacientesTotal || 0,
        medicosTotal: medicosTotal || 0,
        consultasConfirmadas: consultasConfirmadas || 0,
        consultasPendentes: consultasPendentes || 0,
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [organizacao, unidadeAtual]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Visão geral de {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          {unidadeAtual && ` - Unidade ${unidadeAtual.nome}`}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.consultasHoje}</div>
            <p className="text-xs text-muted-foreground">Agendamentos para hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.consultasConfirmadas}</div>
            <p className="text-xs text-muted-foreground">Consultas confirmadas hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.consultasPendentes}</div>
            <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pacientesTotal}</div>
            <p className="text-xs text-muted-foreground">Total na base de dados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Próximas Consultas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px] text-muted-foreground border-2 border-dashed rounded-md bg-gray-50">
              Gráfico ou Lista detalhada virá aqui
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Avisos</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 bg-blue-50 text-blue-700 rounded-md">
                   <AlertCircle className="h-5 w-5 mt-0.5" />
                   <div>
                      <p className="font-medium text-sm">Bem-vindo ao Agenda Master!</p>
                      <p className="text-xs mt-1">Configure suas unidades e médicos para começar.</p>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
