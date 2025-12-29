-- Atualizar Policies para permitir cadastro inicial

-- Permitir INSERT em organizacoes para qualquer usuário autenticado (mesmo sem perfil ainda)
-- Na prática, durante o SignUp, o usuário é criado no Auth, logado, e então tenta inserir na tabela.
create policy "Permitir criação de organização por usuário autenticado" on public.organizacoes
  for insert with check (auth.role() = 'authenticated');

-- Permitir INSERT em perfis para o próprio usuário
create policy "Permitir usuário criar seu próprio perfil" on public.perfis
  for insert with check (auth.uid() = id);

-- Permitir SELECT em perfis para o próprio usuário (já existe parcialmente, mas garantindo)
drop policy if exists "Usuário vê próprio perfil" on public.perfis;
create policy "Usuário vê próprio perfil" on public.perfis
  for select using (auth.uid() = id);
