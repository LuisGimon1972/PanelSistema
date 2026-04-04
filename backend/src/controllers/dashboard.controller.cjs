const pool = require('../config/db.cjs');

async function getDashboard(req, res) {
  try {
    const totalClientes = await pool.query('SELECT COUNT(*)::int AS total FROM clientes');

    const clientesAtivos = await pool.query(
      "SELECT COUNT(*)::int AS total FROM clientes WHERE status = 'ATIVO'",
    );

    // quantidade de cadastros de produtos
    const totalCadastrosProdutos = await pool.query('SELECT COUNT(*)::int AS total FROM produtos');

    // quantidade total de unidades em estoque
    const totalProdutos = await pool.query(
      'SELECT COALESCE(SUM(estoque), 0)::int AS total FROM produtos',
    );

    const produtosAtivos = await pool.query(
      "SELECT COUNT(*)::int AS total FROM produtos WHERE status = 'ATIVO'",
    );

    // valor total do estoque
    const valorEstoque = await pool.query(`
      SELECT COALESCE(SUM(preco * estoque), 0)::numeric(12,2) AS total
      FROM produtos
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

    const pedidosPorStatus = await pool.query(`
      SELECT status, COUNT(*)::int AS total
      FROM pedidos
      GROUP BY status
      ORDER BY status
    `);

    const produtosMaisVendidos = await pool.query(`
      SELECT
        pr.nome AS nome_produto,
        SUM(pi.quantidade)::int AS total_vendido
        FROM pedido_itens pi
        JOIN pedidos p ON p.id = pi.pedido_id
        JOIN produtos pr ON pr.id = pi.produto_id
        WHERE p.status = 'FINALIZADO'
        GROUP BY pr.nome
        ORDER BY total_vendido DESC
        LIMIT 5
    `);

    res.json({
      cards: {
        totalClientes: totalClientes.rows[0].total,
        clientesAtivos: clientesAtivos.rows[0].total,
        totalCadastrosProdutos: totalCadastrosProdutos.rows[0].total,
        totalProdutos: totalProdutos.rows[0].total,
        produtosAtivos: produtosAtivos.rows[0].total,
        valorEstoque: Number(valorEstoque.rows[0].total),
        estoqueBaixo: estoqueBaixo.rows[0].total,
      },
      pedidosPorStatus: pedidosPorStatus.rows,
      produtosMaisVendidos: produtosMaisVendidos.rows,
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
