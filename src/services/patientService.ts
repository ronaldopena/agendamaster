import { supabase } from '@/lib/supabase';
import { Paciente } from '@/types';

export const patientService = {
  async getPatients(organizacaoId: string) {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .order('nome');

    if (error) throw error;
    return data as Paciente[];
  },

  async getPatient(id: string) {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Paciente;
  },

  async createPatient(patient: Omit<Paciente, 'id' | 'criado_em'>) {
    const { data, error } = await supabase
      .from('pacientes')
      .insert([patient])
      .select()
      .single();

    if (error) throw error;
    return data as Paciente;
  },

  async updatePatient(id: string, patient: Partial<Omit<Paciente, 'id' | 'criado_em'>>) {
    const { data, error } = await supabase
      .from('pacientes')
      .update(patient)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Paciente;
  },

  async deletePatient(id: string) {
    const { error } = await supabase
      .from('pacientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
