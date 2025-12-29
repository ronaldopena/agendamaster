import { supabase } from '@/lib/supabase';
import { Unidade } from '@/types';

export const unitService = {
  async getUnits(organizacaoId: string) {
    const { data, error } = await supabase
      .from('unidades')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .order('nome');

    if (error) throw error;
    return data as Unidade[];
  },

  async getUnit(id: string) {
    const { data, error } = await supabase
      .from('unidades')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Unidade;
  },

  async createUnit(unit: Omit<Unidade, 'id' | 'criado_em'>) {
    const { data, error } = await supabase
      .from('unidades')
      .insert([unit])
      .select()
      .single();

    if (error) throw error;
    return data as Unidade;
  },

  async updateUnit(id: string, unit: Partial<Omit<Unidade, 'id' | 'criado_em'>>) {
    const { data, error } = await supabase
      .from('unidades')
      .update(unit)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Unidade;
  },

  async deleteUnit(id: string) {
    const { error } = await supabase
      .from('unidades')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
