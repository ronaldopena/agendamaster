-- Desacoplar perfis de auth.users para permitir cadastro prévio de funcionários
-- Arquivo: supabase/migrations/20240523000005_detach_profiles_from_auth.sql

-- 1. Adicionar coluna usuario_id
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS usuario_id uuid references auth.users(id) on delete set null;

-- 2. Migrar dados existentes (assumindo que id atual É o usuario_id para os registros antigos)
UPDATE public.perfis SET usuario_id = id WHERE usuario_id IS NULL;

-- 3. Remover FK da coluna ID que apontava para auth.users
-- Precisamos descobrir o nome da constraint. Geralmente é perfis_id_fkey.
ALTER TABLE public.perfis DROP CONSTRAINT IF EXISTS perfis_id_fkey;

-- 4. Adicionar default para ID para permitir geração automática
ALTER TABLE public.perfis ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 5. Garantir unicidade do usuario_id (um usuário só pode ter um perfil)
ALTER TABLE public.perfis ADD CONSTRAINT perfis_usuario_id_key UNIQUE (usuario_id);

-- 6. Atualizar Função Auxiliar get_user_org_id
-- Agora deve buscar pelo usuario_id, não pelo id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid AS $$
  SELECT organizacao_id FROM public.perfis WHERE usuario_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. Atualizar Policies RLS

-- Remover policy antiga de ver próprio perfil
DROP POLICY IF EXISTS "Usuário vê próprio perfil" ON public.perfis;

-- Criar nova policy baseada em usuario_id
CREATE POLICY "Usuário vê próprio perfil vinculado" ON public.perfis
  FOR SELECT USING (auth.uid() = usuario_id);

-- Ajustar policy de insert/update para permitir que admins gerenciem perfis da sua org
-- A policy "Acesso restrito à organização" já existe e usa get_user_org_id(), que atualizamos acima.
-- using (organizacao_id = public.get_user_org_id())
-- Isso deve continuar funcionando para SELECT, UPDATE, DELETE.

-- Para INSERT, precisamos garantir que o admin possa inserir.
-- A policy default do Supabase para INSERT geralmente requer check.
-- Vamos garantir que exista policy de insert para a organização.
DROP POLICY IF EXISTS "Admins podem criar perfis na sua organização" ON public.perfis;
CREATE POLICY "Admins podem criar perfis na sua organização" ON public.perfis
  FOR INSERT WITH CHECK (
    organizacao_id = public.get_user_org_id() 
    OR 
    -- Permitir auto-cadastro no SignUp (onde usuario_id é o próprio user)
    (usuario_id = auth.uid())
  );
