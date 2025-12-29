# Design de Interface e Fluxo - Agenda Master

## 1. Mapa de Navegação
- **Rota Pública:**
    - `/login`: Tela de login.
    - `/signup`: Tela de cadastro de nova organização (Tenant).
- **Rota Privada (Layout Dashboard):**
    - `/dashboard`: Visão geral (atalhos, resumo do dia).
    - `/agenda`: Tela principal de agendamento.
    - `/pacientes`: Listagem e busca de pacientes.
        - `/pacientes/novo`: Cadastro.
        - `/pacientes/:id`: Detalhes/Edição.
    - `/cadastros`: Menu de cadastros auxiliares.
        - `/cadastros/medicos`
        - `/cadastros/unidades`
        - `/cadastros/convenios`
        - `/cadastros/usuarios` (Equipe)
    - `/configuracoes`: Configurações do sistema e da organização.

## 2. Detalhamento das Telas

### 2.1. Login / Seleção de Contexto
- **Login:** Email e Senha.
- **Pós-Login:** Se o usuário tiver acesso a múltiplas unidades, exibe modal ou dropdown forçado para selecionar a "Unidade de Trabalho Atual".
- **Header:** Exibe a Unidade atual e permite troca rápida (se permitido).

### 2.2. Agenda Médica (Coração do Sistema)
- **Layout:** Coluna lateral com filtros (Médico, Unidade - readonly se for atendente fixo, Data).
- **Visualização:** Grade de horários (Timetable).
    - Colunas: Podem ser dias da semana (visão semanal de 1 médico) ou médicos (visão diária de vários médicos - *feature avançada, foco inicial em visão diária/semanal por médico*).
    - **Foco Inicial:** Visão Diária. Cabeçalho com controles de data (< Hoje >).
- **Slots:**
    - Livres: Clicáveis para iniciar agendamento.
    - Ocupados: Mostra card com nome do paciente, convênio, status.
    - Bloqueados: Visualmente distintos (cinza/riscado).
- **Ações:** Clicar em slot livre -> Modal de Agendamento.

### 2.3. Modal de Agendamento
- **Passo 1: Paciente:** Busca por nome/CPF (autocomplete) ou botão "Novo Paciente".
- **Passo 2: Detalhes:**
    - Médico/Data/Hora (já pré-selecionados pelo clique na agenda).
    - Tipo de Consulta (Dropdown).
    - Convênio (Dropdown).
    - Plano (Dropdown - filtrado pelo convênio).
    - Observações.
- **Confirmação:** Botão "Agendar".

### 2.4. Cadastros (CRUDs Padrão)
- **Listagem:** Tabela com paginação e filtros.
- **Formulário:** Validação com Zod + React Hook Form. Layout limpo, labels claros.

## 3. Componentes UI (Shadcn/ui)
- **Botões:** Variantes primary (brand color), secondary, ghost, destructive.
- **Inputs:** Texto, Select, Combobox (para buscas), DatePicker.
- **Dialog/Modal:** Para formulários rápidos (agendamento) e confirmações.
- **Toast:** Feedback de sucesso/erro.
- **Card:** Contêineres de conteúdo.
- **Table:** Listagens de dados.

## 4. Identidade Visual
- **Cores:**
    - Primária: Azul Saúde (ex: Tailwind `blue-600`).
    - Fundo: Neutro (`zinc-50` ou `white`).
    - Texto: `zinc-900` (títulos), `zinc-600` (corpo).
- **Tipografia:** Sans-serif (Inter ou similar).
