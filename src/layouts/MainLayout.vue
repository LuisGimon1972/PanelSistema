<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>Painel de Gestão Comercial</q-toolbar-title>

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

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-1">
      <q-list padding>
        <q-item-label header class="text-grey-7"> Menu </q-item-label>

        <q-item clickable to="/" exact>
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable to="/clientes">
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>Clientes</q-item-section>
        </q-item>

        <q-item clickable to="/produtos">
          <q-item-section avatar>
            <q-icon name="inventory_2" />
          </q-item-section>
          <q-item-section>Produtos</q-item-section>
        </q-item>

        <q-item clickable to="/pedidos">
          <q-item-section avatar>
            <q-icon name="add_shopping_cart" />
          </q-item-section>
          <q-item-section>Novo Pedido</q-item-section>
        </q-item>

        <q-item clickable to="/pedidos/lista">
          <q-item-section avatar>
            <q-icon name="receipt_long" />
          </q-item-section>
          <q-item-section>Listagem de Pedidos</q-item-section>
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

interface Usuario {
  id?: number;
  nome?: string;
  email?: string;
}

const router = useRouter();
const leftDrawerOpen = ref(true);

const usuario = computed<Usuario | null>(() => {
  const usuarioSalvo = localStorage.getItem('usuario');

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
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');

  Notify.create({
    type: 'info',
    message: 'Sessão encerrada com sucesso',
  });

  await router.push('/login');
}
</script>
