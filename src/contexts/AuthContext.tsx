import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Perfil, Organizacao, Unidade } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  organizacao: Organizacao | null;
  unidadeAtual: Unidade | null;
  loading: boolean;
  signOut: () => Promise<void>;
  mudarUnidade: (unidadeId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  perfil: null,
  organizacao: null,
  unidadeAtual: null,
  loading: true,
  signOut: async () => {},
  mudarUnidade: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [organizacao, setOrganizacao] = useState<Organizacao | null>(null);
  const [unidadeAtual, setUnidadeAtual] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        buscarDadosUsuario(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escutar mudanças de auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        buscarDadosUsuario(session.user.id);
      } else {
        setPerfil(null);
        setOrganizacao(null);
        setUnidadeAtual(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const buscarDadosUsuario = async (userId: string) => {
    try {
      // 1. Buscar Perfil
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (perfilError) throw perfilError;
      setPerfil(perfilData);

      // 2. Buscar Organização
      if (perfilData?.organizacao_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizacoes')
          .select('*')
          .eq('id', perfilData.organizacao_id)
          .single();
        
        if (orgError) console.error('Erro ao buscar organização:', orgError);
        setOrganizacao(orgData);
      }

      // 3. Buscar Unidade Atual (se houver) ou usar Padrão
      let unidadeIdParaCarregar = perfilData?.unidade_atual_id;

      // Se não tiver unidade atual, mas tiver padrão, usa a padrão e atualiza
      if (!unidadeIdParaCarregar && perfilData?.unidade_padrao_id) {
        unidadeIdParaCarregar = perfilData.unidade_padrao_id;
        // Atualiza a unidade atual no banco para refletir a padrão
        await supabase
            .from('perfis')
            .update({ unidade_atual_id: unidadeIdParaCarregar })
            .eq('id', userId);
      }

      if (unidadeIdParaCarregar) {
        const { data: unidadeData, error: unidadeError } = await supabase
          .from('unidades')
          .select('*')
          .eq('id', unidadeIdParaCarregar)
          .single();
        
        if (unidadeError) console.error('Erro ao buscar unidade:', unidadeError);
        setUnidadeAtual(unidadeData);
      } else {
        setUnidadeAtual(null);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const mudarUnidade = async (unidadeId: string) => {
    if (!user) return;

    try {
      // Atualizar no banco
      const { error } = await supabase
        .from('perfis')
        .update({ unidade_atual_id: unidadeId })
        .eq('id', user.id);

      if (error) throw error;

      // Atualizar estado local
      const { data: unidadeData } = await supabase
        .from('unidades')
        .select('*')
        .eq('id', unidadeId)
        .single();
      
      if (unidadeData) {
        setUnidadeAtual(unidadeData);
        setPerfil(prev => prev ? { ...prev, unidade_atual_id: unidadeId } : null);
      }

    } catch (error) {
      console.error('Erro ao mudar unidade:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, perfil, organizacao, unidadeAtual, loading, signOut, mudarUnidade }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
