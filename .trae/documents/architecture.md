# Arquitetura Técnica - Agenda Master

## 1. Stack Tecnológico
- **Frontend:** React (Vite), TypeScript.
- **Estilização:** Tailwind CSS, Shadcn/ui.
- **State Management:** Zustand (leve e eficiente) ou React Context para estados simples.
- **Routing:** React Router DOM.
- **Backend / BaaS:** Supabase.
    - **Database:** PostgreSQL.
    - **Auth:** Supabase Auth.
    - **Storage:** Supabase Storage (para fotos de perfil, docs).
    - **Edge Functions:** Para lógicas complexas de negócio (ex: criação de tenant com limites).

## 2. Estrutura do Projeto (Frontend)
```
src/
├── components/         # Componentes reutilizáveis (UI, Layout)
│   ├── ui/             # Componentes Shadcn
│   └── ...
├── pages/              # Páginas da aplicação (Roteamento)
├── hooks/              # Custom Hooks (useAuth, useAgenda, etc.)
├── services/           # Comunicação com Supabase (API calls)
├── types/              # Definições de tipos TypeScript
├── utils/              # Funções utilitárias
├── contexts/           # Contextos globais (AuthContext, TenantContext)
└── App.tsx             # Entry point e configuração de rotas
```

## 3. Modelo de Dados (Supabase)
**Convenção:** Nomes de tabelas e colunas em **Português do Brasil** (snake_case).
**Padrão de ID:** UUID (v4) para todas as chaves primárias.
**Multi-tenancy:** Todas as tabelas de dados possuem coluna `organizacao_id` e RLS ativado.

### Principais Tabelas

1.  **`organizacoes`**
    - `id` (UUID, PK)
    - `nome` (Texto)
    - `cnpj` (Texto)
    - `criado_em` (Timestamp)

2.  **`perfis`** (Extensão da tabela `auth.users`)
    - `id` (UUID, PK, FK -> auth.users)
    - `nome` (Texto)
    - `email` (Texto)
    - `tipo` (Enum: 'admin', 'gerente', 'supervisor', 'atendente', 'medico')
    - `organizacao_id` (UUID, FK -> organizacoes)
    - `unidade_atual_id` (UUID, FK -> unidades, nullable - contexto da sessão)

3.  **`unidades`**
    - `id` (UUID, PK)
    - `organizacao_id` (UUID, FK)
    - `nome` (Texto)
    - `endereco` (Texto)
    - `horario_abertura` (Time)
    - `horario_fechamento` (Time)

4.  **`especialidades`**
    - `id` (UUID, PK)
    - `nome` (Texto)

5.  **`medicos`**
    - `id` (UUID, PK)
    - `organizacao_id` (UUID, FK)
    - `nome` (Texto)
    - `crm` (Texto)
    - `especialidade_id` (UUID, FK)
    - `usuario_id` (UUID, FK -> perfis, opcional se o médico for usuário do sistema)

6.  **`pacientes`**
    - `id` (UUID, PK)
    - `organizacao_id` (UUID, FK)
    - `nome` (Texto)
    - `cpf` (Texto)
    - `data_nascimento` (Date)
    - `telefone` (Texto)

7.  **`convenios`**
    - `id` (UUID, PK)
    - `organizacao_id` (UUID, FK)
    - `nome` (Texto)

8.  **`planos`**
    - `id` (UUID, PK)
    - `convenio_id` (UUID, FK)
    - `nome` (Texto)

9.  **`agendamentos`**
    - `id` (UUID, PK)
    - `organizacao_id` (UUID, FK)
    - `unidade_id` (UUID, FK)
    - `medico_id` (UUID, FK)
    - `paciente_id` (UUID, FK)
    - `agendado_por_id` (UUID, FK -> perfis)
    - `data_hora_inicio` (Timestamp)
    - `data_hora_fim` (Timestamp)
    - `status` (Enum: 'agendado', 'confirmado', 'cancelado', 'realizado')
    - `tipo_consulta_id` (UUID, FK)
    - `convenio_id` (UUID, FK)
    - `observacoes` (Texto)
    - `encaixe` (Boolean)

10. **`configuracoes_agenda`** (Horários do médico por unidade)
    - `id` (UUID, PK)
    - `medico_id` (UUID, FK)
    - `unidade_id` (UUID, FK)
    - `dia_semana` (Int: 0-6)
    - `horario_inicio` (Time)
    - `horario_fim` (Time)
    - `duracao_consulta` (Int - minutos)

11. **`bloqueios_agenda`**
    - `id` (UUID, PK)
    - `medico_id` (UUID, FK, Nullable - se null, bloqueio geral da unidade ou organização)
    - `unidade_id` (UUID, FK)
    - `data_inicio` (Timestamp)
    - `data_fim` (Timestamp)
    - `motivo` (Texto)

## 4. Segurança (RLS)
- Políticas RLS serão aplicadas em todas as tabelas.
- Regra básica: `organizacao_id = auth.jwt() -> 'organizacao_id'`.
- Trigger na criação de usuário para atribuir `organizacao_id` e criar registro em `perfis`.

## 5. Integrações
- **Supabase Client:** `@supabase/supabase-js`
- **Ícones:** `lucide-react`
- **Datas:** `date-fns`
