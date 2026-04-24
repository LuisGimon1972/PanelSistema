const pool = require('../config/db.cjs');

async function listarProdutos(req, res) {
  const { busca = '', status = '', categoria = '' } = req.query;

  try {
    let sql = 'SELECT * FROM produtos WHERE 1=1';
    const params = [];

    if (busca) {
      params.push(`%${busca}%`);
      sql += ` AND nome ILIKE $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (categoria) {
      params.push(categoria);
      sql += ` AND categoria = $${params.length}`;
    }

    sql += ' ORDER BY id DESC';

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function buscarProduto(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM produtos
      WHERE id = $1
        AND status = 'ATIVO'
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

async function criarProduto(req, res) {
  const { nome, categoria, preco, estoque, status, foto, codigo_barras } = req.body;

  if (!nome) {
    return res.status(400).json({
      erro: 'Nome é obrigatório',
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO produtos (nome, categoria, preco, estoque, status, foto, codigo_barras)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        nome,
        categoria || null,
        preco || 0,
        estoque || 0,
        status || 'ATIVO',
        foto || null,
        codigo_barras || null,
      ],
    );

    return res.status(201).json({
      sucesso: true,
      produto: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}

async function atualizarProduto(req, res) {
  const { id } = req.params;
  const { nome, categoria, preco, estoque, status, foto, codigo_barras } = req.body;

  if (!nome?.trim()) {
    return res.status(400).json({
      erro: 'Nome é obrigatório',
    });
  }

  try {
    if (codigo_barras) {
      const codigoExistente = await pool.query(
        `
        SELECT id
        FROM produtos
        WHERE codigo_barras = $1 AND id <> $2
        LIMIT 1
        `,
        [codigo_barras, id],
      );

      if (codigoExistente.rows.length > 0) {
        return res.status(409).json({
          erro: 'Código de barras já cadastrado para outro produto',
        });
      }
    }

    const result = await pool.query(
      `
      UPDATE produtos
      SET 
        nome = $1,
        categoria = $2,
        preco = $3,
        estoque = $4,
        status = $5,
        foto = $6,
        codigo_barras = $7
      WHERE id = $8
      RETURNING *
      `,
      [
        nome.trim(),
        categoria ?? null,
        preco ?? 0,
        estoque ?? 0,
        status ?? 'ATIVO',
        foto ?? null,
        codigo_barras ?? null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    return res.json({
      sucesso: true,
      produto: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      erro: 'Erro ao atualizar produto',
      detalhe: err.message,
    });
  }
}

async function excluirProduto(req, res) {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const produtoResult = await client.query(
      `
      SELECT *
      FROM produtos
      WHERE id = $1
      FOR UPDATE
      `,
      [Number(id)],
    );

    if (produtoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    const produtoAtual = produtoResult.rows[0];

    if (produtoAtual.status === 'INATIVO') {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: 'Produto já está desativado' });
    }

    const result = await client.query(
      `
      UPDATE produtos
      SET status = 'INATIVO'
      WHERE id = $1
      RETURNING *
      `,
      [Number(id)],
    );

    if (typeof registrarHistoricoProduto === 'function') {
      await registrarHistoricoProduto(client, {
        produtoId: Number(id),
        acao: 'DESATIVACAO',
        motivo: 'Produto desativado pela exclusão lógica',
        usuarioId: req.user?.id || null,
        camposAlterados: {
          status: {
            antes: produtoAtual.status,
            depois: 'INATIVO',
          },
        },
      });
    }

    await client.query('COMMIT');

    return res.json({
      sucesso: true,
      mensagem: 'Produto desativado com sucesso',
      produto: result.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');

    return res.status(500).json({
      erro: err.message || 'Erro ao desativar produto',
    });
  } finally {
    client.release();
  }
}

async function buscarPorCodigoBarras(req, res) {
  const { codigo } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM produtos
      WHERE codigo_barras = $1
        AND status = 'ATIVO'
      `,
      [codigo],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        erro: 'Produto não encontrado',
      });
    }

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}

async function atualizarStatusProduto(req, res) {
  const id = Number(req.params.id);
  const status = req.body?.status?.trim?.().toUpperCase();

  const statusValidos = ['ATIVO', 'INATIVO'];

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' });
  }

  try {
    const result = await pool.query(
      `
      UPDATE produtos
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem:
        status === 'ATIVO' ? 'Produto ativado com sucesso' : 'Produto desativado com sucesso',
      produto: result.rows[0],
    });
  } catch (err) {
    console.error('Erro ao atualizar status do produto:', err);

    return res.status(500).json({
      erro: 'Erro ao atualizar status do produto',
    });
  }
}

module.exports = {
  listarProdutos,
  buscarProduto,
  criarProduto,
  atualizarProduto,
  excluirProduto,
  buscarPorCodigoBarras,
  atualizarStatusProduto,
};
