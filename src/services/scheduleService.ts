import { supabase } from '@/lib/supabase';
import { Agendamento } from '@/types';

export interface ConfiguracaoAgenda {
  id: string;
  medico_id: string;
  unidade_id: string;
  dia_semana: number;
  horario_inicio: string;
  horario_fim: string;
  duracao_consulta: number;
}

export interface BloqueioAgenda {
  id: string;
  organizacao_id: string;
  unidade_id: string;
  medico_id?: string;
  data_inicio: string;
  data_fim: string;
  motivo?: string;
}

export interface TipoConsulta {
  id: string;
  organizacao_id: string;
  nome: string;
}

export interface Convenio {
  id: string;
  organizacao_id: string;
  nome: string;
}

export interface Plano {
  id: string;
  convenio_id: string;
  nome: string;
}

export const scheduleService = {
  // Agendamentos
  async getAppointments(organizacaoId: string, unidadeId: string, dateStart: string, dateEnd: string, medicoId?: string) {
    console.log('Service getAppointments:', { organizacaoId, unidadeId, dateStart, dateEnd, medicoId });
    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        pacientes(nome, telefone),
        medicos(nome),
        tipos_consulta(nome),
        convenios(nome),
        planos(nome)
      `)
      .eq('organizacao_id', organizacaoId)
      .eq('unidade_id', unidadeId)
      .gte('data_hora_inicio', dateStart)
      .lte('data_hora_fim', dateEnd);

    if (medicoId) {
      query = query.eq('medico_id', medicoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createAppointment(appointment: Partial<Agendamento>) {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([appointment])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAppointment(id: string, appointment: Partial<Agendamento>) {
    const { data, error } = await supabase
      .from('agendamentos')
      .update(appointment)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAppointment(id: string) {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Configurações de Agenda
  async getDoctorScheduleConfig(medicoId: string, unidadeId: string) {
    const { data, error } = await supabase
      .from('configuracoes_agenda')
      .select('*')
      .eq('medico_id', medicoId)
      .eq('unidade_id', unidadeId);

    if (error) throw error;
    return data as ConfiguracaoAgenda[];
  },

  async saveDoctorScheduleConfig(config: Omit<ConfiguracaoAgenda, 'id'>) {
    const { data, error } = await supabase
      .from('configuracoes_agenda')
      .insert([config])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  async deleteDoctorScheduleConfig(id: string) {
    const { error } = await supabase
      .from('configuracoes_agenda')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Bloqueios
  async getBlocks(organizacaoId: string, unidadeId: string, dateStart: string, dateEnd: string) {
    const { data, error } = await supabase
      .from('bloqueios_agenda')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('unidade_id', unidadeId)
      .or(`medico_id.is.null,medico_id.neq.null`) // Traz bloqueios gerais e de médicos
      .gte('data_fim', dateStart)
      .lte('data_inicio', dateEnd); // Intersecção de datas

    if (error) throw error;
    return data as BloqueioAgenda[];
  },

  // Auxiliares (Tipos, Convênios, Planos) - Poderiam estar em services separados
  async getTiposConsulta(organizacaoId: string) {
    const { data, error } = await supabase.from('tipos_consulta').select('*').eq('organizacao_id', organizacaoId);
    if (error) throw error;
    return data as TipoConsulta[];
  },

  async getConvenios(organizacaoId: string) {
    const { data, error } = await supabase.from('convenios').select('*').eq('organizacao_id', organizacaoId);
    if (error) throw error;
    return data as Convenio[];
  },

  async getPlanos(convenioId: string) {
    const { data, error } = await supabase.from('planos').select('*').eq('convenio_id', convenioId);
    if (error) throw error;
    return data as Plano[];
  }
};
