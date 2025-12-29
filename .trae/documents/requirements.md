# Documento de Requisitos - Agenda Master

## 1. Visão Geral
**Objetivo:** Desenvolver um sistema web de agenda médica multi-tenant para gerenciamento de consultas, pacientes, médicos e unidades clínicas.
**Stakeholders:** Dono da clínica, Médicos, Atendentes, Pacientes, Equipe de TI.

## 2. Escopo do Produto
- **Domínio:** agendamaster.com.br
- **Tipo:** Sistema Multi-tenant (SaaS)
- **Funcionalidades Principais:**
    - Cadastro de usuários (pacientes, médicos, atendentes, admins)
    - Cadastro hierárquico de convênios e planos
    - Gestão de unidades clínicas
    - Agenda médica configurável (horários, bloqueios)
    - Agendamento de consultas
    - Login com seleção de unidade

## 3. Requisitos Funcionais (RF)

### 3.1. Autenticação e Acesso
- **RF001:** Login por email/senha.
- **RF002:** Seleção de unidade de operação no login (para atendentes).
- **RF003:** Manutenção do contexto da unidade na sessão.
- **RF004:** Controle de acesso isolado por organização (tenant).

### 3.2. Cadastros
- **RF005:** CRUD de Pacientes (Nome, CPF, Telefone, Email, Nascimento, Convênio, Plano).
- **RF006:** CRUD de Médicos (Nome, CRM, Especialidade).
- **RF007:** CRUD de Usuários (Atendentes, Supervisores, Gerentes, Admins) com perfis.
- **RF008:** CRUD de Convênios e Planos.
- **RF009:** CRUD de Tipos de Consulta (Consulta, Retorno, Exame).
- **RF010:** CRUD de Unidades Clínicas (Nome, Endereço, Contato).
- **RF011:** CRUD de Organizações (Tenants) e vinculação de usuários.
- **RF012:** Cadastro de Especialidades.

### 3.3. Agenda Médica
- **RF013:** Vinculação de médicos a múltiplas unidades.
- **RF014:** Configuração global de horários da unidade e duração padrão da consulta.
- **RF015:** Definição de agenda por médico/unidade (dias da semana).
- **RF016:** Bloqueio de horários (eventos pessoais, feriados).
- **RF017:** Visualização de agenda (calendário, navegação por dia).

### 3.4. Agendamento de Consultas
- **RF018:** Agendamento por atendentes (validando agenda do médico e unidade).
- **RF019:** Bloqueio de agendamento em horários indisponíveis.
- **RF020:** Remarcação e cancelamento com justificativa.
- **RF021:** Registro de autoria do agendamento.
- **RF022:** Seleção obrigatória de Convênio, Plano e Tipo de Consulta.
- **RF023:** Encaixe de consultas (sobreposição permitida visualmente).

## 4. Requisitos Não Funcionais (RNF)
- **RNF001:** Acessível via navegador (Web Responsive).
- **RNF002:** Banco de dados relacional Supabase.
- **RNF003:** Segurança via Autenticação e RLS (Row Level Security) do Supabase.
- **RNF004:** Alta performance para uso simultâneo.
- **RNF005:** Nomenclatura de tabelas e campos em **Português do Brasil**. Chaves primárias e estrangeiras devem usar UUID (algoritmo ULID preferencialmente, ou UUID v4/v7 nativo do Postgres).

## 5. Regras de Negócio (RN)
- **RN001:** Atendente opera apenas na unidade logada.
- **RN002:** Paciente global (pode consultar em várias unidades).
- **RN003:** Horários médicos distintos por unidade.
- **RN004:** Respeito estrito aos bloqueios de agenda.
- **RN005:** Médicos restritos às unidades vinculadas.
- **RN006:** Isolamento total de dados entre organizações (Multi-tenant via RLS).
- **RN007:** Hierarquia de perfis: Admin > Gerente > Supervisor > Usuário (Atendente).

## 6. Critérios de Aceitação
- **CA001:** Fluxo completo de login -> seleção de unidade -> agendamento.
- **CA002:** Visualização correta de slots disponíveis na agenda.
- **CA003:** Impedimento de agendamento em bloqueios.
- **CA004:** Gestão de bloqueios funcional.
- **CA005:** Rastreabilidade de ações (quem agendou).
- **CA006:** Associação correta de dados financeiros (convênio/plano).
- **CA007:** Multi-tenancy funcionando (dados isolados).
- **CA008:** Fluxo de "Sign Up" para nova organização (criação de tenant, usuário admin, limites iniciais).
