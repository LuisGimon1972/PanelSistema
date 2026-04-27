-- =========================================================
-- BANCO PAINEL - SCRIPT
-- PostgreSQL
-- =========================================================

-- =========================================================
-- 1. TIPOS
-- =========================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'origem_pedido'
          AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.origem_pedido AS ENUM ('PEDIDO', 'PDV');
    END IF;
END
$$;


-- =========================================================
-- 2. TABELAS PRINCIPAIS
-- =========================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(30),
    cidade VARCHAR(100),
    documento VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(100),
    preco NUMERIC(12,2) NOT NULL DEFAULT 0,
    estoque INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    foto VARCHAR(255),
    codigo_barras VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES public.clientes(id),
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ABERTO',
    total NUMERIC(12,2) DEFAULT 0,

    pagamentos JSONB,

    desconto_tipo VARCHAR(20) DEFAULT 'valor',
    desconto_valor NUMERIC(12,2) DEFAULT 0,
    desconto NUMERIC(12,2) DEFAULT 0,

    acrescimo_tipo VARCHAR(20) DEFAULT 'valor',
    acrescimo_valor NUMERIC(12,2) DEFAULT 0,
    acrescimo NUMERIC(12,2) DEFAULT 0,

    forma_pagamento VARCHAR(50),
    valor_recebido NUMERIC(10,2),
    troco NUMERIC(10,2),

    origem public.origem_pedido DEFAULT 'PEDIDO',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES public.pedidos(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES public.produtos(id),
    nome_produto VARCHAR(150),
    preco_unitario NUMERIC(12,2),
    quantidade INTEGER,
    subtotal NUMERIC(12,2)
);

CREATE TABLE IF NOT EXISTS public.financeiro_entradas (
    id SERIAL PRIMARY KEY,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor NUMERIC(12,2) NOT NULL,
    origem public.origem_pedido NOT NULL,
    pedido_id INTEGER REFERENCES public.pedidos(id),
    forma_pagamento VARCHAR(20),
    descricao VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 3. MIGRAÇÕES PARA BANCOS JÁ EXISTENTES
-- =========================================================

ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS documento VARCHAR(20);

ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS foto VARCHAR(255);

ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(50);

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS pagamentos JSONB;

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS desconto_tipo VARCHAR(20) DEFAULT 'valor';

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS desconto NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS acrescimo_tipo VARCHAR(20) DEFAULT 'valor';

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS acrescimo_valor NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS acrescimo NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50);

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS valor_recebido NUMERIC(10,2);

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS troco NUMERIC(10,2);

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS origem public.origem_pedido DEFAULT 'PEDIDO';

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS endereco VARCHAR(255),
ADD COLUMN IF NOT EXISTS bairro VARCHAR(100),
ADD COLUMN IF NOT EXISTS numero VARCHAR(20);


-- =========================================================
-- 4. ÍNDICES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_clientes_nome
ON public.clientes (nome);

CREATE INDEX IF NOT EXISTS idx_clientes_status
ON public.clientes (status);

CREATE INDEX IF NOT EXISTS idx_produtos_nome
ON public.produtos (nome);

CREATE INDEX IF NOT EXISTS idx_produtos_categoria
ON public.produtos (categoria);

CREATE INDEX IF NOT EXISTS idx_produtos_status
ON public.produtos (status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_produtos_codigo_barras
ON public.produtos (codigo_barras)
WHERE codigo_barras IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id
ON public.pedidos (cliente_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_status
ON public.pedidos (status);

CREATE INDEX IF NOT EXISTS idx_pedidos_origem
ON public.pedidos (origem);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id
ON public.pedido_itens (pedido_id);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_produto_id
ON public.pedido_itens (produto_id);

CREATE INDEX IF NOT EXISTS idx_financeiro_entradas_pedido_id
ON public.financeiro_entradas (pedido_id);

CREATE INDEX IF NOT EXISTS idx_financeiro_entradas_origem
ON public.financeiro_entradas (origem);


-- =========================================================
-- 5. DADOS INICIAIS
-- =========================================================

INSERT INTO public.clientes (nome, email, telefone, cidade, status)
SELECT 'Consumidor Final', 'ConsumidorFinal@sistema.local', '', '', 'ATIVO'
WHERE NOT EXISTS (
    SELECT 1
    FROM public.clientes
    WHERE email = 'ConsumidorFinal@sistema.local'
);


-- Evita duplicar produtos toda vez que o script rodar
INSERT INTO public.produtos (nome, categoria, preco, estoque)
SELECT v.nome, v.categoria, v.preco, v.estoque
FROM (
    VALUES
        ('Produto Teste', 'Teste', 1000.00, 2)
) AS v(nome, categoria, preco, estoque)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.produtos p
    WHERE p.nome = v.nome
);