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
  const { id } = req.params;

  try {
    const { rows } = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function criarProduto(req, res) {
  const { nome, categoria, preco, estoque, status, foto } = req.body;

  if (!nome) {
    return res.status(400).json({
      erro: 'Nome é obrigatório',
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO produtos (nome, categoria, preco, estoque, status, foto)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [nome, categoria || null, preco || 0, estoque || 0, status || 'ATIVO', foto || null],
    );

    res.status(201).json({
      sucesso: true,
      produto: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function atualizarProduto(req, res) {
  const { id } = req.params;
  const { nome, categoria, preco, estoque, status, foto } = req.body;

  if (!nome) {
    return res.status(400).json({
      erro: 'Nome é obrigatório',
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE produtos
      SET nome = $1, categoria = $2, preco = $3, estoque = $4, status = $5, foto = $6
      WHERE id = $7
      RETURNING *
      `,
      [nome, categoria || null, preco || 0, estoque || 0, status || 'ATIVO', foto || null, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json({
      sucesso: true,
      produto: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function excluirProduto(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json({
      sucesso: true,
      id: Number(id),
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

module.exports = {
  listarProdutos,
  buscarProduto,
  criarProduto,
  atualizarProduto,
  excluirProduto,
};
