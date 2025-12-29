import { supabase } from '@/lib/supabase';
import { Medico } from '@/types';

// Estendendo o tipo Medico para incluir a especialidade (join)
export interface MedicoComEspecialidade extends Medico {
  especialidades?: {
    nome: string;
  };
}

export const doctorService = {
  async getDoctors(organizacaoId: string) {
    const { data, error } = await supabase
      .from('medicos')
      .select('*, especialidades(nome)')
      .eq('organizacao_id', organizacaoId)
      .order('nome');

    if (error) throw error;
    return data as MedicoComEspecialidade[];
  },

  async getDoctor(id: string) {
    const { data, error } = await supabase
      .from('medicos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Medico;
  },

  async createDoctor(doctor: Omit<Medico, 'id' | 'criado_em'>) {
    const { data, error } = await supabase
      .from('medicos')
      .insert([doctor])
      .select()
      .single();

    if (error) throw error;
    return data as Medico;
  },

  async updateDoctor(id: string, doctor: Partial<Omit<Medico, 'id' | 'criado_em'>>) {
    const { data, error } = await supabase
      .from('medicos')
      .update(doctor)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Medico;
  },

  async deleteDoctor(id: string) {
    const { error } = await supabase
      .from('medicos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
