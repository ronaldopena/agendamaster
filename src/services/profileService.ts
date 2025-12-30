import { supabase } from '@/lib/supabase';
import { Perfil } from '@/types';

export const profileService = {
  async getProfiles(organizacaoId: string) {
    const { data, error } = await supabase
      .from('perfis')
      .select(`
        *,
        unidade_padrao:unidades!unidade_padrao_id (
          id,
          nome
        )
      `)
      .eq('organizacao_id', organizacaoId)
      .order('nome');

    if (error) throw error;
    return data as (Perfil & { unidade_padrao?: { id: string; nome: string } | null })[];
  },

  async getProfile(id: string) {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Perfil;
  },

  // Nota: Criar perfil geralmente requer criar usuário no Auth.
  // Aqui estamos criando apenas o registro na tabela perfis.
  // O ideal seria usar uma Edge Function para criar ambos.
  async createProfile(profile: Omit<Perfil, 'id' | 'criado_em'>) {
    const { data, error } = await supabase
      .from('perfis')
      .insert([profile])
      .select()
      .single();

    if (error) throw error;
    return data as Perfil;
  },

  async createProfileWithAuth(profile: any) {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: profile
    });

    if (error) throw error;
    return data;
  },

  async updateProfile(id: string, profile: Partial<Omit<Perfil, 'id' | 'criado_em'>>) {
    // Remove undefined values to avoid Supabase errors if any
    const cleanProfile = Object.fromEntries(
        Object.entries(profile).filter(([_, v]) => v !== undefined)
    );

    const { data, error } = await supabase
      .from('perfis')
      .update(cleanProfile)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Perfil;
  },

  async deleteProfile(id: string) {
    const { error } = await supabase
      .from('perfis')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
