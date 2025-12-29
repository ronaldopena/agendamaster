import { supabase } from '@/lib/supabase';

export interface SignUpData {
  nomeOrganizacao: string;
  cnpj?: string;
  nomeUsuario: string;
  email: string;
  password: string;
}

export const authService = {
  async signUp({ nomeOrganizacao, cnpj, nomeUsuario, email, password }: SignUpData) {
    // 1. Criar Usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: nomeUsuario,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Erro ao criar usuário');

    try {
      // 2. Criar Organização
      const { data: orgData, error: orgError } = await supabase
        .from('organizacoes')
        .insert([{ nome: nomeOrganizacao, cnpj }])
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Criar Perfil de Admin vinculado à Organização
      const { error: profileError } = await supabase
        .from('perfis')
        .insert([{
          id: authData.user.id,
          organizacao_id: orgData.id,
          nome: nomeUsuario,
          email,
          tipo: 'admin',
        }]);

      if (profileError) {
        // Rollback (idealmente seria numa transaction via Edge Function, mas aqui tentamos limpar)
        // await supabase.from('organizacoes').delete().eq('id', orgData.id);
        throw profileError;
      }

      return { user: authData.user, organizacao: orgData };

    } catch (error) {
      // Se falhar na criação dos dados, o usuário do Auth já foi criado.
      // Em produção, isso deve ser tratado com mais robustez (ex: RPC function).
      console.error("Erro no fluxo de cadastro:", error);
      throw error;
    }
  }
};
