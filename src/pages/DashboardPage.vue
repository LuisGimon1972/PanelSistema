<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Dashboard</div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-3">
        <q-card class="bg-blue-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Clientes</div>
            <div class="text-h5 text-primary">{{ dashboard.totalClientes }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-green-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Produtos em Estoque</div>
            <div class="text-h5 text-green-8">{{ dashboard.totalProdutos }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-orange-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Valor Estoque</div>
            <div class="text-h5 text-orange-9">
              R$ {{ dashboard.valorEstoque.toFixed(2) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-red-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Estoque Baixo</div>
            <div class="text-h5 text-red-8">{{ dashboard.estoqueBaixo }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <apexchart
      type="bar"
      height="300"
      :options="chartOptions"
      :series="series"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated } from 'vue';
import axios from 'axios';
import type { ApexOptions } from 'apexcharts';

interface Dashboard {
  totalClientes: number;
  clientesAtivos: number;
  totalProdutos: number;
  produtosAtivos: number;
  valorEstoque: number;
  estoqueBaixo: number;
}

interface DashboardApiResponse {
  cards: Dashboard;
}

const dashboard = ref<Dashboard>({
  totalClientes: 0,
  clientesAtivos: 0,
  totalProdutos: 0,
  produtosAtivos: 0,
  valorEstoque: 0,
  estoqueBaixo: 0,
});

const series = ref([
  {
    name: 'Produtos',
    data: [15, 20, 15],
  },
]);

const chartOptions = ref<ApexOptions>({
  chart: {
    id: 'basic-bar',
    toolbar: {
      show: false,
    },
  },
  xaxis: {
    categories: ['Acessórios', 'Informática', 'Periféricos'],
  },
  dataLabels: {
    enabled: false,
  },
});

async function carregarDashboard(): Promise<void> {
  try {
    const { data } = await axios.get<DashboardApiResponse>(
      'http://localhost:3000/dashboard'
    );

    dashboard.value = data.cards;
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}

onMounted(() => {
  void carregarDashboard();
});

onActivated(() => {
  void carregarDashboard();
});
</script>