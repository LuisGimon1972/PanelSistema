<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="row items-center no-wrap">
          <img
            :src="logo"
            alt="Logo"
            style="width: 60px; height: 36px; object-fit: contain; margin-right: 10px"
          />
          <span>VendaFlow Gestão Comercial</span>
        </q-toolbar-title>

        <div class="row items-center q-gutter-sm">
          <q-avatar color="white" text-color="primary" icon="person" size="32px" />

          <div class="text-subtitle2">
            {{ usuario?.nome || 'Usuário' }}
          </div>

          <q-btn flat dense round icon="logout" @click="logout">
            <q-tooltip>Sair</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      class="bg-primary text-white"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="240"
    >
      <q-list padding>
	<q-item-label header class="text-white text-center text-weight-bold text-h6 q-py-md">
	  Menu do Sistema
	</q-item-label>

       <q-item clickable to="/" exact active-class="menu-active">
	  <q-item-section avatar>
    		<q-icon name="dashboard" />
	  </q-item-section>
	  <q-item-section style="font-size: 16px;">Dashboard</q-item-section>
	</q-item>

        <q-item clickable to="/financeiro" active-class="menu-active">
          <q-item-section avatar>
            <q-icon name="payments" />
          </q-item-section>
          <q-item-section style="font-size: 16px;">Financeiro</q-item-section>
        </q-item>

        <q-item clickable to="/clientes" active-class="menu-active">
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section style="font-size: 16px;">Clientes</q-item-section>
        </q-item>

        <q-item clickable to="/produtos" active-class="menu-active">
          <q-item-section avatar>
            <q-icon name="inventory_2" />
          </q-item-section>
          <q-item-section style="font-size: 16px;">Produtos</q-item-section>
        </q-item>

        <q-item clickable to="/pedidos" active-class="menu-active">
          <q-item-section avatar>
            <q-icon name="add_shopping_cart" />
          </q-item-section>
          <q-item-section style="font-size: 16px;">Criar Pedido</q-item-section>
        </q-item>

        <q-item clickable to="/pedidos/lista" active-class="menu-active">
          <q-item-section avatar>
            <q-icon name="receipt_long" />
          </q-item-section>
          <q-item-section style="font-size: 16px;">Pedidos e Vendas</q-item-section>
        </q-item>

        <q-item clickable to="/pdv" active-class="menu-active">
          <q-item-section avatar>
            <q-icon name="point_of_sale" />
          </q-item-section>
          <q-item-section style="font-size: 16px;">PDV</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container class="bg-grey-2">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';
import logo from 'src/assets/logo.jpg';

interface Usuario {
  id?: number;
  nome?: string;
  email?: string;
}

const router = useRouter();
const leftDrawerOpen = ref(true);

const usuario = computed<Usuario | null>(() => {
  const usuarioSalvo = sessionStorage.getItem('usuario');

  if (!usuarioSalvo) return null;

  try {
    return JSON.parse(usuarioSalvo) as Usuario;
  } catch {
    return null;
  }
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function logout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');

  Notify.create({
    type: 'info',
    message: 'Sessão encerrada com sucesso',
  });

  await router.replace('/login');
}
</script>

<style scoped>
.menu-active {
  background-color: rgba(255, 255, 255, 0.2);
  color: black;
  font-weight: 600;
  border-radius: 10px;  
}
</style>
