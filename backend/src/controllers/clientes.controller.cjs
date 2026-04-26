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
  const { nome, email, telefone, cep, endereco, bairro, numero, cidade, status, documento } =
    req.body;

  if (!nome || !email) {
    return res.status(400).json({
      erro: 'Nome e email são obrigatórios',
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO clientes (nome, email, telefone, cep, endereco, bairro, numero, cidade, status, documento)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        nome,
        email,
        telefone || null,
        cep,
        endereco,
        bairro,
        numero,
        cidade || null,
        status || 'ATIVO',
        documento || null,
      ],
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
  const { nome, email, telefone, cep, endereco, bairro, numero, cidade, status, documento } =
    req.body;

  if (!nome || !email) {
    return res.status(400).json({
      erro: 'Nome e email são obrigatórios',
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE clientes
      SET nome = $1, email = $2, telefone = $3, cep = $4, endereco = $5, bairro = $6, numero = $7, cidade = $8, status = $9, documento = $10 
      WHERE id = $11
      RETURNING *
      `,
      [
        nome,
        email,
        telefone || null,
        cep,
        endereco,
        bairro,
        numero,
        cidade || null,
        status || 'ATIVO',
        documento || null,
        id,
      ],
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

async function atualizarStatusCliente(req, res) {
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
      UPDATE clientes
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem:
        status === 'ATIVO' ? 'Cliente ativado com sucesso' : 'Cliente desativado com sucesso',
      cliente: result.rows[0],
    });
  } catch (err) {
    console.error('Erro ao atualizar status do cliente:', err);

    return res.status(500).json({
      erro: 'Erro ao atualizar status do cliente',
    });
  }
}

async function excluirCliente(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE clientes
      SET status = 'INATIVO'
      WHERE id = $1
        AND status = 'ATIVO'
      RETURNING id
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: 'Cliente não encontrado ou já desativado',
      });
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
  atualizarStatusCliente,
};
