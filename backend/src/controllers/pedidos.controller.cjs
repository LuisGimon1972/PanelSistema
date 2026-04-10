const pool = require('../config/db.cjs');

async function criarPedido(req, res) {
  const { cliente_id, itens, status, origem } = req.body;

  const statusFinal = status || 'ABERTO';
  const origemFinal = origem || 'PEDIDO';

  const statusValidos = ['ABERTO', 'FINALIZADO'];
  const origensValidas = ['PEDIDO', 'PDV'];

  if (!statusValidos.includes(statusFinal)) {
    return res.status(400).json({
      erro: 'Status inválido',
    });
  }

  if (!origensValidas.includes(origemFinal)) {
    return res.status(400).json({
      erro: 'Origem inválida',
    });
  }

  if (!cliente_id || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({
      erro: 'Cliente e itens são obrigatórios',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let totalPedido = 0;

    const resultPedido = await client.query(
      `
      INSERT INTO pedidos (cliente_id, total, status, origem)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [cliente_id, 0, statusFinal, origemFinal],
    );

    const pedidoId = resultPedido.rows[0].id;

    for (const item of itens) {
      const { produto_id, quantidade } = item;

      const produto = await client.query('SELECT * FROM produtos WHERE id = $1', [produto_id]);

      if (produto.rows.length === 0) {
        throw new Error('Produto não encontrado');
      }

      const prod = produto.rows[0];

      if (Number(prod.estoque) < Number(quantidade)) {
        throw new Error(`Estoque insuficiente para ${prod.nome}`);
      }

      const subtotal = Number(prod.preco) * Number(quantidade);
      totalPedido += subtotal;

      await client.query(
        `
        INSERT INTO pedido_itens (
          pedido_id,
          produto_id,
          nome_produto,
          preco_unitario,
          quantidade,
          subtotal
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [pedidoId, prod.id, prod.nome, prod.preco, quantidade, subtotal],
      );

      await client.query(
        `
        UPDATE produtos
        SET estoque = estoque - $1
        WHERE id = $2
        `,
        [quantidade, prod.id],
      );
    }

    await client.query(
      `
      UPDATE pedidos
      SET total = $1
      WHERE id = $2
      `,
      [totalPedido, pedidoId],
    );

    await client.query('COMMIT');

    res.status(201).json({
      sucesso: true,
      pedido_id: pedidoId,
      origem: origemFinal,
      total: totalPedido,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: err.message });
  } finally {
    client.release();
  }
}

async function listarPedidos(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.data,
        p.origem,
        p.status,
        p.total,
        c.nome AS cliente_nome
      FROM pedidos p
      LEFT JOIN clientes c ON c.id = p.cliente_id
      ORDER BY p.id DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function buscarPedido(req, res) {
  const { id } = req.params;

  try {
    const pedido = await pool.query(
      `
      SELECT
        p.id,
        p.data,
        p.origem,
        p.status,
        p.total,
        p.cliente_id,
        c.nome AS cliente_nome
      FROM pedidos p
      LEFT JOIN clientes c ON c.id = p.cliente_id
      WHERE p.id = $1
      `,
      [id],
    );

    if (pedido.rows.length === 0) {
      return res.status(404).json({ erro: 'Pedido não encontrado' });
    }

    const itens = await pool.query(
      `
      SELECT
        id,
        produto_id,
        nome_produto,
        preco_unitario,
        quantidade,
        subtotal
      FROM pedido_itens
      WHERE pedido_id = $1
      ORDER BY id ASC
      `,
      [id],
    );

    res.json({
      ...pedido.rows[0],
      itens: itens.rows,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function atualizarStatusPedido(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const statusValidos = ['ABERTO', 'FINALIZADO', 'CANCELADO'];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({
      erro: 'Status inválido',
    });
  }

  try {
    const pedido = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);

    if (pedido.rows.length === 0) {
      return res.status(404).json({
        erro: 'Pedido não encontrado',
      });
    }

    const pedidoAtual = pedido.rows[0];

    if (pedidoAtual.status === 'CANCELADO') {
      return res.status(400).json({
        erro: 'Pedido cancelado não pode ser alterado',
      });
    }

    const result = await pool.query(
      `
      UPDATE pedidos
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id],
    );

    res.json({
      sucesso: true,
      pedido: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function cancelarPedido(req, res) {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pedido = await client.query('SELECT * FROM pedidos WHERE id = $1', [id]);

    if (pedido.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        erro: 'Pedido não encontrado',
      });
    }

    const pedidoAtual = pedido.rows[0];

    if (pedidoAtual.status === 'CANCELADO') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        erro: 'Pedido já está cancelado',
      });
    }

    const itens = await client.query(
      `
      SELECT produto_id, quantidade
      FROM pedido_itens
      WHERE pedido_id = $1
      `,
      [id],
    );

    for (const item of itens.rows) {
      await client.query(
        `
        UPDATE produtos
        SET estoque = estoque + $1
        WHERE id = $2
        `,
        [item.quantidade, item.produto_id],
      );
    }

    const result = await client.query(
      `
      UPDATE pedidos
      SET status = 'CANCELADO'
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    await client.query('COMMIT');

    res.json({
      sucesso: true,
      mensagem: 'Pedido cancelado com sucesso',
      pedido: result.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: err.message });
  } finally {
    client.release();
  }
}

async function atualizarPedido(req, res) {
  const { id } = req.params;
  const { cliente_id, itens, status, origem } = req.body;

  if (!cliente_id || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({
      erro: 'Cliente e itens são obrigatórios',
    });
  }

  const statusFinal = status || 'ABERTO';
  const origemFinal = origem || 'PEDIDO';

  const statusValidos = ['ABERTO', 'FINALIZADO'];
  const origensValidas = ['PEDIDO', 'PDV'];

  if (!statusValidos.includes(statusFinal)) {
    return res.status(400).json({
      erro: 'Status inválido para atualização. Use ABERTO ou FINALIZADO.',
    });
  }

  if (!origensValidas.includes(origemFinal)) {
    return res.status(400).json({
      erro: 'Origem inválida para atualização.',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pedido = await client.query('SELECT * FROM pedidos WHERE id = $1', [id]);

    if (pedido.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Pedido não encontrado' });
    }

    const pedidoAtual = pedido.rows[0];

    if (pedidoAtual.status === 'CANCELADO') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        erro: 'Pedido cancelado não pode ser editado',
      });
    }

    const itensAntigos = await client.query(
      `
      SELECT produto_id, quantidade
      FROM pedido_itens
      WHERE pedido_id = $1
      `,
      [id],
    );

    for (const item of itensAntigos.rows) {
      await client.query(
        `
        UPDATE produtos
        SET estoque = estoque + $1
        WHERE id = $2
        `,
        [item.quantidade, item.produto_id],
      );
    }

    await client.query('DELETE FROM pedido_itens WHERE pedido_id = $1', [id]);

    let totalPedido = 0;

    for (const item of itens) {
      const { produto_id, quantidade } = item;

      const produto = await client.query('SELECT * FROM produtos WHERE id = $1', [produto_id]);

      if (produto.rows.length === 0) {
        throw new Error('Produto não encontrado');
      }

      const prod = produto.rows[0];

      if (Number(prod.estoque) < Number(quantidade)) {
        throw new Error(`Estoque insuficiente para ${prod.nome}`);
      }

      const subtotal = Number(prod.preco) * Number(quantidade);
      totalPedido += subtotal;

      await client.query(
        `
        INSERT INTO pedido_itens (
          pedido_id,
          produto_id,
          nome_produto,
          preco_unitario,
          quantidade,
          subtotal
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [id, prod.id, prod.nome, prod.preco, quantidade, subtotal],
      );

      await client.query(
        `
        UPDATE produtos
        SET estoque = estoque - $1
        WHERE id = $2
        `,
        [quantidade, prod.id],
      );
    }

    const result = await client.query(
      `
      UPDATE pedidos
      SET cliente_id = $1, total = $2, status = $3, origem = $4
      WHERE id = $5
      RETURNING *
      `,
      [cliente_id, totalPedido, statusFinal, origemFinal, id],
    );

    await client.query('COMMIT');

    res.json({
      sucesso: true,
      pedido: result.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: err.message });
  } finally {
    client.release();
  }
}

module.exports = {
  criarPedido,
  listarPedidos,
  atualizarPedido,
  buscarPedido,
  atualizarStatusPedido,
  cancelarPedido,
};
