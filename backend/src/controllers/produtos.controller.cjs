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

async function buscarPorCodigoBarras(req, res) {
  const { codigo } = req.params;

  try {
    const { rows } = await pool.query('SELECT * FROM produtos WHERE codigo_barras = $1', [codigo]);

    if (rows.length === 0) {
      return res.status(404).json({
        erro: 'Produto não encontrado',
      });
    }

    res.json(rows[0]);
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
  buscarPorCodigoBarras,
};
