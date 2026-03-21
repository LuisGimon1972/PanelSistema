const pool = require('../config/db.cjs');

async function getDashboard(req, res) {
  try {
    const totalClientes = await pool.query('SELECT COUNT(*)::int AS total FROM clientes');

    const clientesAtivos = await pool.query(
      "SELECT COUNT(*)::int AS total FROM clientes WHERE status = 'ATIVO'",
    );

    const totalProdutos = await pool.query('SELECT COUNT(*)::int AS total FROM produtos');

    const produtosAtivos = await pool.query(
      "SELECT COUNT(*)::int AS total FROM produtos WHERE status = 'ATIVO'",
    );

    const valorEstoque = await pool.query(`
      SELECT COALESCE(SUM(preco * estoque), 0)::numeric(12,2) AS total
      FROM produtos
      WHERE status = 'ATIVO'
    `);

    const estoqueBaixo = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM produtos
      WHERE estoque > 0 AND estoque <= 5
    `);

    const ultimosClientes = await pool.query(`
      SELECT id, nome, email, telefone, cidade, status, created_at
      FROM clientes
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const ultimosProdutos = await pool.query(`
      SELECT id, nome, categoria, preco, estoque, status, created_at
      FROM produtos
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      cards: {
        totalClientes: totalClientes.rows[0].total,
        clientesAtivos: clientesAtivos.rows[0].total,
        totalProdutos: totalProdutos.rows[0].total,
        produtosAtivos: produtosAtivos.rows[0].total,
        valorEstoque: Number(valorEstoque.rows[0].total),
        estoqueBaixo: estoqueBaixo.rows[0].total,
      },
      ultimosClientes: ultimosClientes.rows,
      ultimosProdutos: ultimosProdutos.rows,
    });
  } catch (err) {
    console.error('Erro no dashboard:', err.message);
    res.status(500).json({ erro: err.message });
  }
}

module.exports = {
  getDashboard,
};
