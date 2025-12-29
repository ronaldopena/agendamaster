ALTER TABLE perfis
ADD COLUMN IF NOT EXISTS unidade_padrao_id UUID REFERENCES unidades(id);

-- Opcional: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_perfis_unidade_padrao ON perfis(unidade_padrao_id);
