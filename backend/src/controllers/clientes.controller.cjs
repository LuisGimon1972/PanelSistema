const pool = require('../config/db.cjs');

async function listarClientes(req, res) {
  const { busca = '', status = '' } = req.query;

  try {
    let sql = 'SELECT * FROM clientes WHERE 1=1';
    const params = [];

    if (busca) {
      params.push(`%${busca}%`);
      sql += ` AND nome ILIKE $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY id DESC';

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function buscarCliente(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function criarCliente(req, res) {
  const { nome, email, telefone, cidade, status } = req.body;

  if (!nome || !email) {
    return res.status(400).json({
      erro: 'Nome e email são obrigatórios',
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO clientes (nome, email, telefone, cidade, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [nome, email, telefone || null, cidade || null, status || 'ATIVO'],
    );

    res.status(201).json({
      sucesso: true,
      cliente: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }

    res.status(500).json({ erro: err.message });
  }
}

async function atualizarCliente(req, res) {
  const { id } = req.params;
  const { nome, email, telefone, cidade, status } = req.body;

  if (!nome || !email) {
    return res.status(400).json({
      erro: 'Nome e email são obrigatórios',
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE clientes
      SET nome = $1, email = $2, telefone = $3, cidade = $4, status = $5
      WHERE id = $6
      RETURNING *
      `,
      [nome, email, telefone || null, cidade || null, status || 'ATIVO', id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    res.json({
      sucesso: true,
      cliente: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }

    res.status(500).json({ erro: err.message });
  }
}

async function excluirCliente(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
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
  listarClientes,
  buscarCliente,
  criarCliente,
  atualizarCliente,
  excluirCliente,
};
