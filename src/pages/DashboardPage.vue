<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Dashboard</div>

    <div class="row q-col-gutter-sm q-mb-lg">
      <div class="col">
        <q-card class="bg-green-2">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Faturamento</div>
            <div class="text-h5 text-green-8">
              {{ formatarMoeda(dashboard.cards.faturamentoTotal) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col">
        <q-card class="bg-blue-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Clientes</div>
            <div class="text-h5 text-primary">{{ dashboard.cards.totalClientes }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col">
        <q-card class="bg-green-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Produtos em Estoque</div>
            <div class="text-h5 text-green-8">{{ dashboard.cards.totalProdutos }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col">
        <q-card class="bg-orange-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Valor Estoque</div>
            <div class="text-h5 text-orange-9">
              R$ {{ dashboard.cards.valorEstoque.toFixed(2) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col">
        <q-card class="bg-red-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Estoque Baixo</div>
            <div class="text-h5 text-red-8">{{ dashboard.cards.estoqueBaixo }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-sm q-mt-sm">
      <div class="col">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Vendas por Mês</div>
            <div class="text-caption text-grey-7 q-mb-md">Evolução do faturamento mensal</div>

            <apexchart
              type="line"
              height="320"
              :options="chartVendasMesOptions"
              :series="chartVendasMesSeries"
            />
          </q-card-section>
        </q-card>
      </div>
      <div class="col">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Pedidos por Status</div>
            <div class="text-caption text-grey-7 q-mb-md">Visão rápida da situação dos pedidos</div>

            <apexchart type="donut" height="320" :options="chartOptions" :series="chartSeries" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Produtos Mais Vendidos</div>
            <div class="text-caption text-grey-7 q-mb-md">
              Top produtos com maior volume de vendas
            </div>

            <apexchart
              type="bar"
              height="320"
              :options="chartProdutosOptions"
              :series="chartProdutosSeries"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, computed } from 'vue';
import axios from 'axios';
import type { ApexOptions } from 'apexcharts';

interface PedidoStatusItem {
  status: string;
  total: number;
}

interface VendaPorMes {
  mes: string;
  total: number;
}

interface ProdutoMaisVendido {
  nome_produto: string;
  total_vendido: number;
}

interface Dashboard {
  totalClientes: number;
  clientesAtivos: number;
  totalProdutos: number;
  produtosAtivos: number;
  valorEstoque: number;
  estoqueBaixo: number;
  faturamentoTotal: number;
}

interface DashboardApiResponse {
  cards: {
    totalClientes: number;
    clientesAtivos: number;
    totalCadastrosProdutos: number;
    totalProdutos: number;
    produtosAtivos: number;
    valorEstoque: number;
    estoqueBaixo: number;
    faturamentoTotal: number;
  };
  pedidosPorStatus: PedidoStatusItem[];
  vendasPorMes: VendaPorMes[];
  produtosMaisVendidos: ProdutoMaisVendido[];
}

const dashboard = ref<DashboardApiResponse>({
  cards: {
    totalClientes: 0,
    clientesAtivos: 0,
    totalCadastrosProdutos: 0,
    totalProdutos: 0,
    produtosAtivos: 0,
    valorEstoque: 0,
    estoqueBaixo: 0,
    faturamentoTotal: 0,
  },
  pedidosPorStatus: [],
  produtosMaisVendidos: [],
  vendasPorMes: [],
});

const chartProdutosSeries = computed(() => [
  {
    name: 'Quantidade vendida',
    data: dashboard.value.produtosMaisVendidos.map((p) => Number(p.total_vendido)),
  },
]);

const cores = [
  '#bfdbfe', // azul claro
  '#bbf7d0', // verde claro
  '#fde68a', // amarelo claro
  '#fecaca', // vermelho claro
  '#ddd6fe', // roxo claro
  '#a5f3fc', // ciano claro
  '#fbcfe8', // rosa claro
];

const chartProdutosOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
  },
  colors: cores,
  xaxis: {
    categories: dashboard.value.produtosMaisVendidos.map((p) => p.nome_produto),
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 6,
      distributed: true,
    },
  },
  dataLabels: {
    enabled: true,
    style: {
      colors: ['#000000'], // 👈 aqui resolve
    },
  },
}));

const series = ref([
  {
    name: 'Produtos',
    data: [15, 20, 15],
  },
]);

async function carregarDashboard(): Promise<void> {
  try {
    const { data } = await axios.get<DashboardApiResponse>('http://localhost:3000/dashboard');

    dashboard.value = data;
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}

const chartSeries = computed(() =>
  dashboard.value.pedidosPorStatus.map((item) => Number(item.total)),
);

const chartOptions = computed(() => ({
  labels: dashboard.value.pedidosPorStatus.map((item) => traduzirStatus(item.status)),
  colors: dashboard.value.pedidosPorStatus.map((item) => {
    if (item.status === 'ABERTO') return '#f59e0b';
    if (item.status === 'FINALIZADO') return '#22c55e';
    if (item.status === 'CANCELADO') return '#ef4444';
    return '#9ca3af';
  }),
  legend: {
    position: 'bottom',
  },
  dataLabels: {
    enabled: true,
  },
  plotOptions: {
    pie: {
      donut: {
        size: '55%',
      },
    },
  },
  tooltip: {
    y: {
      formatter: (value: number) => `${value} pedido(s)`,
    },
  },
}));

function traduzirStatus(status: string) {
  switch (status) {
    case 'ABERTO':
      return 'Abertos';
    case 'FINALIZADO':
      return 'Finalizados';
    case 'CANCELADO':
      return 'Cancelados';
    default:
      return status;
  }
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor || 0));
}

function formatarMes(valor: string): string {
  const [ano, mes] = valor.split('-');
  const nomes = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  return `${nomes[Number(mes) - 1]}/${ano}`;
}

const chartVendasMesSeries = computed(() => [
  {
    name: 'Faturamento',
    data: dashboard.value.vendasPorMes.map((item) => Number(item.total)),
  },
]);

const chartVendasMesOptions = computed(() => ({
  chart: {
    toolbar: {
      show: false,
    },
  },
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  xaxis: {
    categories: dashboard.value.vendasPorMes.map((item) => formatarMes(item.mes)),
  },
  dataLabels: {
    enabled: true,
  },
  tooltip: {
    y: {
      formatter: (value: number) => formatarMoeda(value),
    },
  },
}));

onMounted(() => {
  void carregarDashboard();
});

onActivated(() => {
  void carregarDashboard();
});
</script>
