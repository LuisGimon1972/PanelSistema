require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db.cjs');

const dashboardRoutes = require('./src/routes/dashboard.routes.cjs');
const clientesRoutes = require('./src/routes/clientes.routes.cjs');
const produtosRoutes = require('./src/routes/produtos.routes.cjs');
const authRoutes = require('./src/routes/auth.routes.cjs');
const pedidosRoutes = require('./src/routes/pedidos.routes.cjs');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/pedidos', pedidosRoutes);

/*const authMiddleware = require('./src/middlewares/auth.middleware.cjs');

app.use('/dashboard', authMiddleware, dashboardRoutes);
app.use('/clientes', authMiddleware, clientesRoutes);
app.use('/produtos', authMiddleware, produtosRoutes);*/

async function carregarBanco() {
  try {
    const sqlPath = path.join(__dirname, 'bancopainel.sql');
    console.log('Lendo arquivo SQL:', sqlPath);

    if (!fs.existsSync(sqlPath)) {
      console.warn('banco.sql não encontrado, pulando execução...');
      return;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    if (!sql.trim()) {
      console.warn('banco.sql está vazio, pulando execução...');
      return;
    }

    await pool.query(sql);
    console.log('banco.sql executado com sucesso!');
  } catch (err) {
    console.error('Erro ao executar banco.sql:', err.message);
  }
}

app.get('/', (_, res) => {
  res.json({
    ok: true,
    mensagem: 'API Painel Comercial rodando',
  });
});

app.get('/health', async (_, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      ok: true,
      banco: 'conectado',
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      erro: err.message,
    });
  }
});

app.use('/dashboard', dashboardRoutes);
app.use('/clientes', clientesRoutes);
app.use('/produtos', produtosRoutes);

const PORT = Number(process.env.PORT) || 3000;

carregarBanco().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
});
