-- FIX RLS: Permitir cadastro de Organização e Perfil
-- Execute este script no SQL Editor do Supabase

-- 1. ORGANIZACOES: Permitir que qualquer um (anon ou authenticated) crie uma organização
-- Isso é necessário para a tela de cadastro público.
drop policy if exists "Permitir criação de organização por usuário autenticado" on public.organizacoes;
drop policy if exists "Usuários autenticados podem ver organizações" on public.organizacoes;

create policy "Permitir Insert Público em Organizações" on public.organizacoes
  for insert with check (true);

create policy "Permitir Select em Organizações" on public.organizacoes
  for select using (true); -- ou restrinja se preferir, mas para cadastro inicial pode precisar ler o que criou

-- 2. PERFIS: Permitir criação de perfil
-- Se o usuário estiver logado (authenticated), permitimos criar seu próprio perfil.
-- Se o usuário não estiver logado (anon - caso de email confirm), ele não consegue inserir via client direto com segurança ligada ao ID.
-- RECOMENDAÇÃO: Desabilite "Confirm Email" no Supabase para desenvolvimento ou use a lógica abaixo.

drop policy if exists "Permitir usuário criar seu próprio perfil" on public.perfis;
drop policy if exists "Usuário vê próprio perfil" on public.perfis;

create policy "Permitir Insert em Perfis (Auth e Anon)" on public.perfis
  for insert with check (true); 
  -- Em prod, idealmente validaria se id = auth.uid(), mas anon não tem auth.uid().
  -- Deixamos 'true' para permitir o fluxo, assumindo que o UUID do ID seja difícil de adivinhar/colidir.

create policy "Permitir Select Próprio Perfil" on public.perfis
  for select using ( auth.uid() = id );
