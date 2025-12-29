import { supabase } from '@/lib/supabase';
import { TipoConsulta, Convenio, Plano } from '@/services/scheduleService';

export const configService = {
  // Tipos de Consulta
  async createTipoConsulta(tipo: Omit<TipoConsulta, 'id'>) {
    const { data, error } = await supabase
      .from('tipos_consulta')
      .insert([tipo])
      .select()
      .single();
    if (error) throw error;
    return data as TipoConsulta;
  },

  async deleteTipoConsulta(id: string) {
    const { error } = await supabase
      .from('tipos_consulta')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Convênios
  async createConvenio(convenio: Omit<Convenio, 'id'>) {
    const { data, error } = await supabase
      .from('convenios')
      .insert([convenio])
      .select()
      .single();
    if (error) throw error;
    return data as Convenio;
  },

  async deleteConvenio(id: string) {
    const { error } = await supabase
      .from('convenios')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Planos
  async createPlano(plano: Omit<Plano, 'id'>) {
    const { data, error } = await supabase
      .from('planos')
      .insert([plano])
      .select()
      .single();
    if (error) throw error;
    return data as Plano;
  },

  async deletePlano(id: string) {
    const { error } = await supabase
      .from('planos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
