CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefone VARCHAR(30),
  cidade VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/*ALTER TABLE clientes
ADD COLUMN documento VARCHAR(20);*/

/*ALTER TABLE produtos
ADD COLUMN foto VARCHAR(255);*/

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  categoria VARCHAR(100),
  preco NUMERIC(12,2) NOT NULL DEFAULT 0,
  estoque INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'ABERTO',
  total NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/*ALTER TABLE pedidos
ADD COLUMN desconto_tipo VARCHAR(20) DEFAULT 'valor',
ADD COLUMN desconto_valor NUMERIC(12,2) DEFAULT 0,
ADD COLUMN acrescimo_tipo VARCHAR(20) DEFAULT 'valor',
ADD COLUMN acrescimo_valor NUMERIC(12,2) DEFAULT 0;*/

/*ALTER TABLE pedidos
ADD COLUMN forma_pagamento VARCHAR(50),
ADD COLUMN valor_recebido NUMERIC(10,2),
ADD COLUMN troco NUMERIC(10,2);*/

/*ALTER TABLE produtos
ADD COLUMN codigo_barras VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS idx_produtos_codigo_barras
ON produtos (codigo_barras);*/

/*ALTER TABLE pedidos
ADD COLUMN desconto NUMERIC (12,2) DEFAULT 0,
ADD COLUMN acrescimo NUMERIC (12,2) DEFAULT 0;*/


/*ALTER TABLE pedidos
ADD COLUMN origem origem_pedido DEFAULT 'PEDIDO'*/

CREATE TABLE IF NOT EXISTS pedido_itens (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id),
  nome_produto VARCHAR(150),
  preco_unitario NUMERIC(12,2),
  quantidade INTEGER,
  subtotal NUMERIC(12,2)
);

/*CREATE TYPE origem_pedido AS ENUM ('PEDIDO', 'PDV');

ALTER TABLE pedidos
ADD COLUMN origem origem_pedido DEFAULT 'PEDIDO';*/

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

/*INSERT INTO clientes (nome, email, telefone, cidade, status)
VALUES ('Consumidor Final', 'consumidor@pdv.com', '', '', 'ATIVO')
ON CONFLICT (email) DO NOTHING;*/

/*DELETE FROM produtos;

INSERT INTO produtos (nome, categoria, preco, estoque)
VALUES
('Produto A', 'Teste', 1000, 2),
('Produto B', 'Teste', 280, 4),
('Produto C', 'Teste', 120, 20),
('Produto D', 'Teste', 1000, 8);*/