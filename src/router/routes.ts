import type { RouteRecordRaw } from 'vue-router';
import MainLayout from 'layouts/MainLayout.vue';
import DashboardPage from 'pages/DashboardPage.vue';
import ClientesPage from 'pages/ClientesPage.vue';
import ProdutosPage from 'pages/ProdutosPage.vue';
import LoginPage from 'pages/LoginPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', component: DashboardPage },
      { path: 'clientes', component: ClientesPage },
      { path: 'produtos', component: ProdutosPage },
      { path: 'pedidos', component: () => import('pages/PedidosPage.vue') },
      { path: 'pedidos/lista', component: () => import('pages/PedidosListaPage.vue') },
      { path: 'pedidos/editar/:id', component: () => import('pages/PedidosPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/login',
  },
];

export default routes;
