import MainLayout from 'layouts/MainLayout.vue';
import DashboardPage from 'pages/DashboardPage.vue';
import ClientesPage from 'pages/ClientesPage.vue';
import ProdutosPage from 'pages/ProdutosPage.vue';

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: DashboardPage },
      { path: 'clientes', component: ClientesPage },
      { path: 'produtos', component: ProdutosPage },
    ],
  },
];

export default routes;
