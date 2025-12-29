export interface Organizacao {
  id: string;
  nome: string;
  cnpj?: string;
  criado_em: string;
}

export interface Unidade {
  id: string;
  organizacao_id: string;
  nome: string;
  endereco?: string;
  telefone?: string;
  horario_abertura?: string;
  horario_fechamento?: string;
  duracao_consulta: number;
  criado_em: string;
}

export type TipoPerfil = 'admin' | 'gerente' | 'supervisor' | 'atendente' | 'medico';

export interface Perfil {
  id: string;
  usuario_id?: string | null; // Link para auth.users
  organizacao_id: string;
  nome: string;
  email: string;
  tipo: TipoPerfil;
  unidade_atual_id?: string | null;
  unidade_padrao_id?: string | null;
  criado_em: string;
}

export interface Especialidade {
  id: string;
  organizacao_id: string;
  nome: string;
  criado_em: string;
}

export interface Medico {
  id: string;
  organizacao_id: string;
  nome: string;
  crm?: string;
  especialidade_id?: string;
  usuario_id?: string;
  criado_em: string;
}

export interface Paciente {
  id: string;
  organizacao_id: string;
  nome: string;
  cpf?: string;
  data_nascimento?: string;
  telefone?: string;
  email?: string;
  criado_em: string;
}

export interface TipoConsulta {
  id: string;
  organizacao_id: string;
  nome: string;
  criado_em: string;
}

export interface Convenio {
  id: string;
  organizacao_id: string;
  nome: string;
  criado_em: string;
}

export interface Plano {
  id: string;
  convenio_id: string;
  nome: string;
  criado_em: string;
}

export interface Agendamento {
  id: string;
  organizacao_id: string;
  unidade_id: string;
  medico_id: string;
  paciente_id: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado' | 'falta';
  observacoes?: string;
  encaixe: boolean;
  agendado_por_id?: string;
}
