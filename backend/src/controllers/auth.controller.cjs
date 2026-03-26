const pool = require('../config/db.cjs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function registrar(req, res) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({
      erro: 'Nome, email e senha são obrigatórios',
    });
  }

  try {
    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);

    if (existe.rows.length > 0) {
      return res.status(409).json({
        erro: 'Email já cadastrado',
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await pool.query(
      `
      INSERT INTO usuarios (nome, email, senha)
      VALUES ($1, $2, $3)
      RETURNING id, nome, email
      `,
      [nome, email, senhaHash],
    );

    res.status(201).json({
      sucesso: true,
      usuario: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      erro: 'Email e senha são obrigatórios',
    });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        erro: 'Credenciais inválidas',
      });
    }

    const usuario = result.rows[0];

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: 'Credenciais inválidas',
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
    );

    res.json({
      sucesso: true,
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

module.exports = {
  registrar,
  login,
};
