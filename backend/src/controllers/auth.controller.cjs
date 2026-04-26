const pool = require('../config/db.cjs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function registrar(req, res) {
  const { nome, email, senha, senhaAdministrador } = req.body;

  if (!nome || !email || !senha || !senhaAdministrador) {
    return res.status(400).json({
      erro: 'Nome, email, senha e senha do administrador são obrigatórios',
    });
  }

  if (senhaAdministrador !== '87654321') {
    return res.status(403).json({
      erro: 'Senha do administrador inválida',
    });
  }

  try {
    const emailNormalizado = email.trim().toLowerCase();

    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [emailNormalizado]);

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
      [nome.trim(), emailNormalizado, senhaHash],
    );

    return res.status(201).json({
      sucesso: true,
      usuario: result.rows[0],
    });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);

    return res.status(500).json({
      erro: 'Erro interno ao registrar usuário',
    });
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
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado');
      return res.status(500).json({
        erro: 'Erro de configuração do servidor',
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const result = await pool.query(
      'SELECT id, nome, email, senha FROM usuarios WHERE email = $1',
      [emailNormalizado],
    );

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
      {
        expiresIn: '1d',
      },
    );

    return res.json({
      sucesso: true,
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });
  } catch (err) {
    console.error('Erro ao fazer login:', err);

    return res.status(500).json({
      erro: 'Erro interno ao fazer login',
    });
  }
}

module.exports = {
  registrar,
  login,
};
