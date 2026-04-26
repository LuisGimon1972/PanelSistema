const pool = require('../config/db.cjs');

async function listarEntradas(req, res) {
  const { data_inicio, data_fim, origem, forma_pagamento } = req.query;

  try {
    let sql = `
      SELECT *
      FROM financeiro_entradas
      WHERE 1=1
    `;
    const params = [];

    if (data_inicio) {
      params.push(data_inicio);
      sql += ` AND DATE(data) >= $${params.length}`;
    }

    if (data_fim) {
      params.push(data_fim);
      sql += ` AND DATE(data) <= $${params.length}`;
    }

    if (origem) {
      params.push(origem);
      sql += ` AND origem = $${params.length}`;
    }

    if (forma_pagamento) {
      params.push(forma_pagamento);
      sql += ` AND forma_pagamento = $${params.length}`;
    }

    sql += ' ORDER BY data DESC';

    const { rows } = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}

async function resumoEntradas(req, res) {
  const { data_inicio, data_fim } = req.query;

  try {
    let sql = `
      SELECT
        COALESCE(SUM(valor), 0)::numeric(12,2) AS total,
        COALESCE(SUM(CASE WHEN origem = 'PEDIDO' THEN valor ELSE 0 END), 0)::numeric(12,2) AS total_pedidos,
        COALESCE(SUM(CASE WHEN origem = 'PDV' THEN valor ELSE 0 END), 0)::numeric(12,2) AS total_pdv
      FROM financeiro_entradas
      WHERE 1=1
    `;
    const params = [];

    if (data_inicio) {
      params.push(data_inicio);
      sql += ` AND DATE(data) >= $${params.length}`;
    }

    if (data_fim) {
      params.push(data_fim);
      sql += ` AND DATE(data) <= $${params.length}`;
    }

    const { rows } = await pool.query(sql, params);

    res.json({
      total: Number(rows[0].total),
      total_pedidos: Number(rows[0].total_pedidos),
      total_pdv: Number(rows[0].total_pdv),
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function resumoHoje(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        COALESCE(SUM(valor), 0)::numeric(12,2) AS total,
        COALESCE(SUM(CASE WHEN origem = 'PEDIDO' THEN valor ELSE 0 END), 0)::numeric(12,2) AS total_pedidos,
        COALESCE(SUM(CASE WHEN origem = 'PDV' THEN valor ELSE 0 END), 0)::numeric(12,2) AS total_pdv
      FROM financeiro_entradas
      WHERE DATE(data) = CURRENT_DATE
    `);

    res.json({
      total: Number(rows[0].total),
      total_pedidos: Number(rows[0].total_pedidos),
      total_pdv: Number(rows[0].total_pdv),
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

module.exports = {
  listarEntradas,
  resumoEntradas,
  resumoHoje,
};
