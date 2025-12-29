-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tabela de Organizações (Tenants)
create table public.organizacoes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cnpj text,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Unidades
create table public.unidades (
  id uuid primary key default uuid_generate_v4(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade not null,
  nome text not null,
  endereco text,
  telefone text,
  horario_abertura time,
  horario_fechamento time,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Perfis (Extensão do auth.users)
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  organizacao_id uuid references public.organizacoes(id) on delete cascade,
  nome text not null,
  email text,
  tipo text check (tipo in ('admin', 'gerente', 'supervisor', 'atendente', 'medico')) not null,
  unidade_atual_id uuid references public.unidades(id) on delete set null, -- Contexto da sessão
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Especialidades
create table public.especialidades (
  id uuid primary key default uuid_generate_v4(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade not null,
  nome text not null,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Médicos
create table public.medicos (
  id uuid primary key default uuid_generate_v4(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade not null,
  nome text not null,
  crm text,
  especialidade_id uuid references public.especialidades(id) on delete set null,
  usuario_id uuid references public.perfis(id) on delete set null, -- Link opcional se o médico for usuário
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Vínculo Médico-Unidade (Para saber onde o médico atende)
create table public.medicos_unidades (
  medico_id uuid references public.medicos(id) on delete cascade not null,
  unidade_id uuid references public.unidades(id) on delete cascade not null,
  primary key (medico_id, unidade_id)
);

-- Tabela de Pacientes
create table public.pacientes (
  id uuid primary key default uuid_generate_v4(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade not null,
  nome text not null,
  cpf text,
  data_nascimento date,
  telefone text,
  email text,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Convênios
create table public.convenios (
  id uuid primary key default uuid_generate_v4(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade not null,
  nome text not null,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Planos
create table public.planos (
  id uuid primary key default uuid_generate_v4(),
  convenio_id uuid references public.convenios(id) on delete cascade not null,
  nome text not null,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Tipos de Consulta
create table public.tipos_consulta (
  id uuid primary key default uuid_generate_v4(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade not null,
  nome text not null, -- Ex: Consulta, Retorno, Exame
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Agendamentos
create table public.agendamentos (
  id uuid primary key default uuid_generate_v4(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade not null,
  unidade_id uuid references public.unidades(id) on delete cascade not null,
  medico_id uuid references public.medicos(id) on delete cascade not null,
  paciente_id uuid references public.pacientes(id) on delete cascade not null,
  agendado_por_id uuid references public.perfis(id) on delete set null,
  tipo_consulta_id uuid references public.tipos_consulta(id) on delete set null,
  convenio_id uuid references public.convenios(id) on delete set null,
  plano_id uuid references public.planos(id) on delete set null,
  data_hora_inicio timestamp with time zone not null,
  data_hora_fim timestamp with time zone not null,
  status text check (status in ('agendado', 'confirmado', 'cancelado', 'realizado', 'falta')) default 'agendado' not null,
  observacoes text,
  encaixe boolean default false,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Configurações de Agenda (Horários fixos do médico)
create table public.configuracoes_agenda (
  id uuid primary key default uuid_generate_v4(),
  medico_id uuid references public.medicos(id) on delete cascade not null,
  unidade_id uuid references public.unidades(id) on delete cascade not null,
  dia_semana integer check (dia_semana between 0 and 6) not null, -- 0=Domingo, 1=Segunda, etc.
  horario_inicio time not null,
  horario_fim time not null,
  duracao_consulta integer default 30 not null, -- em minutos
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Bloqueios de Agenda
create table public.bloqueios_agenda (
  id uuid primary key default uuid_generate_v4(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade not null,
  unidade_id uuid references public.unidades(id) on delete cascade not null,
  medico_id uuid references public.medicos(id) on delete cascade, -- Nullable: se null, bloqueia a unidade inteira
  data_inicio timestamp with time zone not null,
  data_fim timestamp with time zone not null,
  motivo text,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS em todas as tabelas
alter table public.organizacoes enable row level security;
alter table public.unidades enable row level security;
alter table public.perfis enable row level security;
alter table public.especialidades enable row level security;
alter table public.medicos enable row level security;
alter table public.medicos_unidades enable row level security;
alter table public.pacientes enable row level security;
alter table public.convenios enable row level security;
alter table public.planos enable row level security;
alter table public.tipos_consulta enable row level security;
alter table public.agendamentos enable row level security;
alter table public.configuracoes_agenda enable row level security;
alter table public.bloqueios_agenda enable row level security;

-- Políticas RLS Básicas (Simplificadas para desenvolvimento inicial)
-- IMPORTANTE: Em produção, refinar para garantir isolamento estrito por tenant

-- Política para Organizacoes: Usuários só veem sua própria organização (vinculada ao perfil)
-- Como o perfil depende da organização, precisamos de uma lógica circular cuidadosa ou policies permissivas para leitura inicial.
-- Por enquanto, vamos permitir leitura se o usuário estiver autenticado.
create policy "Usuários autenticados podem ver organizações" on public.organizacoes
  for select using (auth.role() = 'authenticated');

-- Política Genérica para outras tabelas baseada em organizacao_id
-- (Assume que o perfil do usuário já foi carregado no app e temos o organizacao_id, 
--  mas no banco a verificação ideal é via subquery no perfil do auth.uid())

-- Função auxiliar para pegar o organizacao_id do usuário logado
create or replace function public.get_user_org_id()
returns uuid as $$
  select organizacao_id from public.perfis where id = auth.uid();
$$ language sql security definer;

-- Aplicar policies usando a função auxiliar
create policy "Acesso restrito à organização" on public.unidades
  using (organizacao_id = public.get_user_org_id());

create policy "Acesso restrito à organização" on public.perfis
  using (organizacao_id = public.get_user_org_id());
  -- Permitir que o usuário veja seu próprio perfil independente da organização (para login inicial)
  create policy "Usuário vê próprio perfil" on public.perfis
  for select using (auth.uid() = id);

create policy "Acesso restrito à organização" on public.especialidades
  using (organizacao_id = public.get_user_org_id());

create policy "Acesso restrito à organização" on public.medicos
  using (organizacao_id = public.get_user_org_id());
  
create policy "Acesso restrito à organização" on public.pacientes
  using (organizacao_id = public.get_user_org_id());
  
create policy "Acesso restrito à organização" on public.convenios
  using (organizacao_id = public.get_user_org_id());
  
create policy "Acesso restrito à organização" on public.planos
  using (convenio_id in (select id from public.convenios where organizacao_id = public.get_user_org_id()));

create policy "Acesso restrito à organização" on public.tipos_consulta
  using (organizacao_id = public.get_user_org_id());

create policy "Acesso restrito à organização" on public.agendamentos
  using (organizacao_id = public.get_user_org_id());

create policy "Acesso restrito à organização" on public.bloqueios_agenda
  using (organizacao_id = public.get_user_org_id());

-- Trigger para criar perfil automaticamente ao criar usuário no Auth (Simplificado)
-- Em um cenário real multi-tenant com convites, isso seria mais complexo.
-- Aqui assumimos que a criação do usuário via API administrativa já popula a tabela perfis.
