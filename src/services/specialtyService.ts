import { supabase } from '@/lib/supabase';
import { Especialidade } from '@/types';

export interface Especialidade {
  id: string;
  organizacao_id: string;
  nome: string;
  criado_em: string;
}

export const specialtyService = {
  async getSpecialties(organizacaoId: string) {
    const { data, error } = await supabase
      .from('especialidades')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .order('nome');

    if (error) throw error;
    return data as Especialidade[];
  },

  async createSpecialty(specialty: Omit<Especialidade, 'id' | 'criado_em'>) {
    const { data, error } = await supabase
      .from('especialidades')
      .insert([specialty])
      .select()
      .single();

    if (error) throw error;
    return data as Especialidade;
  },
  
  async deleteSpecialty(id: string) {
    const { error } = await supabase
        .from('especialidades')
        .delete()
        .eq('id', id);
        
    if (error) throw error;
  }
};
