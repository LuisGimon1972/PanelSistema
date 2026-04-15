const pool = require('../config/db.cjs');

async function criarPedido(req, res) {
  const {
    cliente_id,
    itens,
    status,
    origem,
    desconto,
    acrescimo,
    desconto_tipo,
    desconto_valor,
    acrescimo_tipo,
    acrescimo_valor,
    forma_pagamento,
    valor_recebido,
    troco,
  } = req.body;

  const statusFinal = status || 'ABERTO';
  const origemFinal = origem || 'PEDIDO';

  const descontoTipoFinal = desconto_tipo || 'valor';
  const acrescimoTipoFinal = acrescimo_tipo || 'valor';

  const descontoValorFinal = Number(desconto_valor ?? desconto ?? 0);
  const acrescimoValorFinal = Number(acrescimo_valor ?? acrescimo ?? 0);

  const statusValidos = ['ABERTO', 'FINALIZADO'];
  const origensValidas = ['PEDIDO', 'PDV'];
  const tiposValidos = ['valor', 'percentual'];

  if (!tiposValidos.includes(descontoTipoFinal)) {
    return res.status(400).json({ erro: 'Tipo de desconto inválido' });
  }

  if (!tiposValidos.includes(acrescimoTipoFinal)) {
    return res.status(400).json({ erro: 'Tipo de acréscimo inválido' });
  }

  if (!statusValidos.includes(statusFinal)) {
    return res.status(400).json({ erro: 'Status inválido' });
  }

  if (!origensValidas.includes(origemFinal)) {
    return res.status(400).json({ erro: 'Origem inválida' });
  }

  if (cliente_id == null || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Cliente e itens são obrigatórios' });
  }

  if (Number.isNaN(descontoValorFinal) || descontoValorFinal < 0) {
    return res.status(400).json({ erro: 'Desconto inválido' });
  }

  if (Number.isNaN(acrescimoValorFinal) || acrescimoValorFinal < 0) {
    return res.status(400).json({ erro: 'Acréscimo inválido' });
  }

  for (const item of itens) {
    if (
      !item.produto_id ||
      !Number.isFinite(Number(item.quantidade)) ||
      Number(item.quantidade) <= 0
    ) {
      return res.status(400).json({
        erro: 'Cada item deve ter produto_id e quantidade maior que zero',
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let totalPedido = 0;

    const resultPedido = await client.query(
      `
  INSERT INTO pedidos (
    cliente_id,
    total,
    status,
    origem,
    desconto,
    acrescimo,
    desconto_tipo,
    desconto_valor,
    acrescimo_tipo,
    acrescimo_valor,
    forma_pagamento,
    valor_recebido,
    troco
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  RETURNING id
  `,
      [
        cliente_id,
        0, // total ainda será atualizado
        statusFinal,
        origemFinal,
        0, // desconto (vamos atualizar depois)
        0, // acrescimo (vamos atualizar depois)
        descontoTipoFinal,
        descontoValorFinal,
        acrescimoTipoFinal,
        acrescimoValorFinal,
        forma_pagamento ?? null,
        valor_recebido ?? null,
        troco ?? null,
      ],
    );

    const pedidoId = resultPedido.rows[0].id;

    for (const item of itens) {
      const produto_id = Number(item.produto_id);
      const quantidade = Number(item.quantidade);

      const produto = await client.query(
        `
        SELECT *
        FROM produtos
        WHERE id = $1
        FOR UPDATE
        `,
        [produto_id],
      );

      if (produto.rows.length === 0) {
        throw new Error(`Produto ${produto_id} não encontrado`);
      }

      const prod = produto.rows[0];
      const estoqueAtual = Number(prod.estoque);
      const precoUnitario = Number(prod.preco);

      if (estoqueAtual < quantidade) {
        throw new Error(`Estoque insuficiente para ${prod.nome}`);
      }

      const subtotal = precoUnitario * quantidade;
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
        [pedidoId, prod.id, prod.nome, precoUnitario, quantidade, subtotal],
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

    let descontoCalculado = descontoValorFinal;
    let acrescimoCalculado = acrescimoValorFinal;

    if (descontoTipoFinal === 'percentual') {
      descontoCalculado = (totalPedido * descontoValorFinal) / 100;
    }

    if (acrescimoTipoFinal === 'percentual') {
      acrescimoCalculado = (totalPedido * acrescimoValorFinal) / 100;
    }

    const totalFinal = totalPedido - descontoCalculado + acrescimoCalculado;

    if (totalFinal < 0) {
      throw new Error('O total final do pedido não pode ser negativo');
    }

    await client.query(
      `
  UPDATE pedidos
  SET total = $1,
      desconto = $2,
      acrescimo = $3
  WHERE id = $4
  `,
      [totalFinal, descontoCalculado, acrescimoCalculado, pedidoId],
    );

    await client.query('COMMIT');

    return res.status(201).json({
      sucesso: true,
      pedido_id: pedidoId,
      origem: origemFinal,
      total_produtos: totalPedido,
      desconto: descontoCalculado,
      acrescimo: acrescimoCalculado,
      total: totalFinal,
    });
  } catch (err) {
    await client.query('ROLLBACK');

    const errosDeRegra = [
      'Produto',
      'Estoque insuficiente',
      'O total final do pedido não pode ser negativo',
    ];

    const statusCode = errosDeRegra.some((msg) => err.message.includes(msg)) ? 400 : 500;

    return res.status(statusCode).json({
      erro: err.message || 'Erro interno ao criar pedido',
    });
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
        p.desconto,
        p.acrescimo,
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
        p.desconto,
        p.acrescimo,
        p.desconto_tipo,
        p.desconto_valor,
        p.acrescimo_tipo,
        p.acrescimo_valor,
        p.forma_pagamento,
        p.valor_recebido,
        p.troco,
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

  const {
    cliente_id,
    itens,
    status,
    origem,
    desconto,
    acrescimo,
    desconto_tipo,
    desconto_valor,
    acrescimo_tipo,
    acrescimo_valor,
    forma_pagamento,
    valor_recebido,
    troco,
  } = req.body;

  if (cliente_id == null || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({
      erro: 'Cliente e itens são obrigatórios',
    });
  }

  const statusFinal = status || 'ABERTO';
  const origemFinal = origem || 'PEDIDO';

  const descontoTipoFinal = desconto_tipo || 'valor';
  const acrescimoTipoFinal = acrescimo_tipo || 'valor';

  const descontoValorFinal = Number(desconto_valor ?? desconto ?? 0);
  const acrescimoValorFinal = Number(acrescimo_valor ?? acrescimo ?? 0);

  const statusValidos = ['ABERTO', 'FINALIZADO'];
  const origensValidas = ['PEDIDO', 'PDV'];
  const tiposValidos = ['valor', 'percentual'];

  if (!tiposValidos.includes(descontoTipoFinal)) {
    return res.status(400).json({
      erro: 'Tipo de desconto inválido',
    });
  }

  if (!tiposValidos.includes(acrescimoTipoFinal)) {
    return res.status(400).json({
      erro: 'Tipo de acréscimo inválido',
    });
  }

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

  if (Number.isNaN(descontoValorFinal) || descontoValorFinal < 0) {
    return res.status(400).json({
      erro: 'Desconto inválido',
    });
  }

  if (Number.isNaN(acrescimoValorFinal) || acrescimoValorFinal < 0) {
    return res.status(400).json({
      erro: 'Acréscimo inválido',
    });
  }

  for (const item of itens) {
    if (
      !item.produto_id ||
      !Number.isFinite(Number(item.quantidade)) ||
      Number(item.quantidade) <= 0
    ) {
      return res.status(400).json({
        erro: 'Cada item deve ter produto_id e quantidade maior que zero',
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pedido = await client.query(
      `
      SELECT *
      FROM pedidos
      WHERE id = $1
      FOR UPDATE
      `,
      [id],
    );

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
        [Number(item.quantidade), item.produto_id],
      );
    }

    await client.query(
      `
      DELETE FROM pedido_itens
      WHERE pedido_id = $1
      `,
      [id],
    );

    let totalPedido = 0;

    for (const item of itens) {
      const produto_id = Number(item.produto_id);
      const quantidade = Number(item.quantidade);

      const produto = await client.query(
        `
        SELECT *
        FROM produtos
        WHERE id = $1
        FOR UPDATE
        `,
        [produto_id],
      );

      if (produto.rows.length === 0) {
        throw new Error(`Produto ${produto_id} não encontrado`);
      }

      const prod = produto.rows[0];
      const estoqueAtual = Number(prod.estoque);
      const precoUnitario = Number(prod.preco);

      if (estoqueAtual < quantidade) {
        throw new Error(`Estoque insuficiente para ${prod.nome}`);
      }

      const subtotal = precoUnitario * quantidade;
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
        [id, prod.id, prod.nome, precoUnitario, quantidade, subtotal],
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

    let descontoCalculado = descontoValorFinal;
    let acrescimoCalculado = acrescimoValorFinal;

    if (descontoTipoFinal === 'percentual') {
      descontoCalculado = (totalPedido * descontoValorFinal) / 100;
    }

    if (acrescimoTipoFinal === 'percentual') {
      acrescimoCalculado = (totalPedido * acrescimoValorFinal) / 100;
    }

    const totalFinal = totalPedido - descontoCalculado + acrescimoCalculado;

    if (totalFinal < 0) {
      throw new Error('O total final do pedido não pode ser negativo');
    }

    const result = await client.query(
      `
      UPDATE pedidos
      SET cliente_id = $1,
          total = $2,
          status = $3,
          origem = $4,
          desconto_tipo = $5,
          desconto_valor = $6,
          acrescimo_tipo = $7,
          acrescimo_valor = $8,
          forma_pagamento = $9,
          valor_recebido = $10,
          troco = $11
      WHERE id = $12
      RETURNING *
      `,
      [
        cliente_id,
        totalFinal,
        statusFinal,
        origemFinal,
        descontoTipoFinal,
        descontoValorFinal,
        acrescimoTipoFinal,
        acrescimoValorFinal,
        forma_pagamento ?? null,
        valor_recebido ?? null,
        troco ?? null,
        id,
      ],
    );

    await client.query('COMMIT');

    return res.json({
      sucesso: true,
      pedido: result.rows[0],
      resumo: {
        total_produtos: totalPedido,
        desconto: descontoCalculado,
        acrescimo: acrescimoCalculado,
        total: totalFinal,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');

    const errosDeRegra = [
      'Produto',
      'Estoque insuficiente',
      'O total final do pedido não pode ser negativo',
      'Pedido cancelado não pode ser editado',
    ];

    const statusCode = errosDeRegra.some((msg) => err.message.includes(msg)) ? 400 : 500;

    return res.status(statusCode).json({
      erro: err.message || 'Erro interno ao atualizar pedido',
    });
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
