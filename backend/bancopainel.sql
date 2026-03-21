CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefone VARCHAR(30),
  cidade VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  categoria VARCHAR(100),
  preco NUMERIC(12,2) NOT NULL DEFAULT 0,
  estoque INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clientes_nome
ON clientes (nome);

CREATE INDEX IF NOT EXISTS idx_clientes_status
ON clientes (status);

CREATE INDEX IF NOT EXISTS idx_produtos_nome
ON produtos (nome);

CREATE INDEX IF NOT EXISTS idx_produtos_categoria
ON produtos (categoria);

CREATE INDEX IF NOT EXISTS idx_produtos_status
ON produtos (status);

INSERT INTO clientes (nome, email, telefone, cidade, status)
VALUES
  ('João Silva', 'joao@empresa.com', '11999990001', 'São Paulo', 'ATIVO'),
  ('Maria Souza', 'maria@empresa.com', '11999990002', 'Campinas', 'ATIVO'),
  ('Carlos Lima', 'carlos@empresa.com', '11999990003', 'Santos', 'INATIVO')
ON CONFLICT (email) DO NOTHING;

INSERT INTO produtos (nome, categoria, preco, estoque, status)
VALUES
  ('Notebook Dell', 'Informática', 3500.00, 8, 'ATIVO'),
  ('Mouse Sem Fio', 'Acessórios', 120.00, 20, 'ATIVO'),
  ('Teclado Mecânico', 'Acessórios', 280.00, 4, 'ATIVO'),
  ('Monitor 24', 'Informática', 899.90, 2, 'ATIVO'),
  ('Impressora', 'Periféricos', 650.00, 0, 'INATIVO')
ON CONFLICT DO NOTHING;