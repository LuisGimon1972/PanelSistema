<template>
  <q-page padding class="bg-grey-2">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5">Financeiro</div>
        <div class="text-caption text-grey-7">Controle de entradas por período e origem</div>
      </div>
    </div>

    <!-- RESUMO HOJE -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-card flat bordered class="bg-green-1 border">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Entradas Hoje</div>
            <div class="text-h5 text-green-8">
              {{ formatarMoeda(resumoHoje.total) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered class="bg-blue-1 border">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Pedidos Hoje</div>
            <div class="text-h5 text-primary">
              {{ formatarMoeda(resumoHoje.total_pedidos) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered class="bg-orange-1 border">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">PDV Hoje</div>
            <div class="text-h5 text-orange-9">
              {{ formatarMoeda(resumoHoje.total_pdv) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- FILTROS -->
    <q-card flat bordered class="q-mb-md border">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-2">
            <q-input v-model="filtros.data_inicio" type="date" outlined dense label="Data início" />
          </div>

          <div class="col-12 col-md-2">
            <q-input v-model="filtros.data_fim" type="date" outlined dense label="Data fim" />
          </div>

          <div class="col-12 col-md-2">
            <q-select
              v-model="filtros.origem"
              :options="origemOptions"
              emit-value
              map-options
              outlined
              clearable
              dense
              label="Origem"
            />
          </div>

          <div class="col-12 col-md-2">
            <q-select
              v-model="filtros.forma_pagamento"
              :options="formaPagamentoOptions"
              emit-value
              map-options
              outlined
              clearable
              dense
              label="Forma de pagamento"
            />
          </div>

          <div class="col-12 col-md-4">
            <div class="row q-col-gutter-sm">
              <div class="col">
                <q-btn
                  color="primary"
                  label="Filtrar"
                  class="full-width border"
                  @click="aplicarFiltros"
                />
              </div>

              <div class="col">
                <q-btn
                  color="warning"
                  icon="filter_alt_off"
                  label="Limpar Filtros"
                  class="full-width border"
                  @click="limparFiltros"
                />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- RESUMO PERÍODO -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-card flat bordered class="border">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Total no Período</div>
            <div class="text-h5 text-primary">
              {{ formatarMoeda(resumoPeriodo.total) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered class="border">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Total de Pedidos</div>
            <div class="text-h5">
              {{ formatarMoeda(resumoPeriodo.total_pedidos) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered class="border">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">Total do PDV</div>
            <div class="text-h5">
              {{ formatarMoeda(resumoPeriodo.total_pdv) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- TABELA -->
    <q-card flat bordered class="border">
      <q-card-section>
        <div class="text-h6 q-mb-md">Entradas</div>

        <q-table
          class="border grade-azul"
          flat
          bordered
          dense
          :rows="entradas"
          :columns="columns"
          row-key="id"
          :loading="loading"
          no-data-label="Nenhuma entrada encontrada"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template #body-cell-data="props">
            <q-td :props="props">
              {{ formatarData(props.row.data) }}
            </q-td>
          </template>

          <template #body-cell-valor="props">
            <q-td :props="props">
              {{ formatarMoeda(props.row.valor) }}
            </q-td>
          </template>

          <template #body-cell-origem="props">
            <q-td :props="props">
              <q-badge :color="props.row.origem === 'PDV' ? 'orange' : 'primary'">
                {{ props.row.origem }}
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Notify } from 'quasar';
import { api } from 'boot/axios';
import axios from 'axios';

interface EntradaFinanceira {
  id: number;
  data: string;
  valor: number;
  origem: 'PEDIDO' | 'PDV';
  pedido_id?: number | null;
  forma_pagamento?: string | null;
  descricao?: string | null;
}

interface ResumoFinanceiro {
  total: number;
  total_pedidos: number;
  total_pdv: number;
}

const loading = ref(false);

const entradas = ref<EntradaFinanceira[]>([]);

const resumoHoje = ref<ResumoFinanceiro>({
  total: 0,
  total_pedidos: 0,
  total_pdv: 0,
});

const resumoPeriodo = ref<ResumoFinanceiro>({
  total: 0,
  total_pedidos: 0,
  total_pdv: 0,
});

function dataAtualInput(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

const filtros = ref({
  data_inicio: dataAtualInput(),
  data_fim: dataAtualInput(),
  origem: '' as '' | 'PEDIDO' | 'PDV',
  forma_pagamento: '' as '' | 'DINHEIRO' | 'PIX' | 'CARTAO',
});

const formaPagamentoOptions = [
  { label: 'DINHEIRO', value: 'DINHEIRO' },
  { label: 'PIX', value: 'PIX' },
  { label: 'CARTAO', value: 'CARTAO' },
];

const origemOptions = [
  { label: 'PEDIDO', value: 'PEDIDO' },
  { label: 'PDV', value: 'PDV' },
];

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'center' as const },
  { name: 'data', label: 'Data', field: 'data', align: 'center' as const },
  { name: 'origem', label: 'Origem', field: 'origem', align: 'left' as const },
  { name: 'forma_pagamento', label: 'Pagamento', field: 'forma_pagamento', align: 'left' as const },
  { name: 'descricao', label: 'Descrição', field: 'descricao', align: 'left' as const },
  { name: 'valor', label: 'Valor', field: 'valor', align: 'right' as const },
];

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor || 0));
}

function formatarData(data?: string): string {
  if (!data) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data));
}

async function carregarResumoHoje() {
  try {
    const { data } = await api.get<ResumoFinanceiro>('/financeiro/hoje');
    resumoHoje.value = data;
  } catch (error: unknown) {
    let mensagem = 'Erro ao carregar resumo de hoje';

    if (axios.isAxiosError(error)) {
      mensagem = error.response?.data?.erro || mensagem;
    }

    Notify.create({
      type: 'negative',
      message: mensagem,
    });
  }
}

async function carregarResumoPeriodo() {
  try {
    const { data } = await api.get<ResumoFinanceiro>('/financeiro/resumo', {
      params: {
        data_inicio: filtros.value.data_inicio || undefined,
        data_fim: filtros.value.data_fim || undefined,
      },
    });

    resumoPeriodo.value = data;
  } catch (error: unknown) {
    let mensagem = 'Erro ao carregar resumo do período';

    if (axios.isAxiosError(error)) {
      mensagem = error.response?.data?.erro || mensagem;
    }

    Notify.create({
      type: 'negative',
      message: mensagem,
    });
  }
}

async function carregarEntradas() {
  loading.value = true;

  try {
    const { data } = await api.get<EntradaFinanceira[]>('/financeiro/entradas', {
      params: {
        data_inicio: filtros.value.data_inicio || undefined,
        data_fim: filtros.value.data_fim || undefined,
        origem: filtros.value.origem || undefined,
        forma_pagamento: filtros.value.forma_pagamento || undefined,
      },
    });

    entradas.value = data;
  } catch (error: unknown) {
    let mensagem = 'Erro ao carregar entradas';

    if (axios.isAxiosError(error)) {
      mensagem = error.response?.data?.erro || mensagem;
    }

    Notify.create({
      type: 'negative',
      message: mensagem,
    });
  } finally {
    loading.value = false;
  }
}

async function aplicarFiltros() {
  await Promise.all([carregarResumoPeriodo(), carregarEntradas()]);
}

async function limparFiltros() {
  const hoje = dataAtualInput();

  filtros.value = {
    data_inicio: hoje,
    data_fim: hoje,
    origem: '',
    forma_pagamento: '',
  };

  await Promise.all([carregarResumoPeriodo(), carregarEntradas()]);
}

onMounted(async () => {
  await Promise.all([carregarResumoHoje(), carregarResumoPeriodo(), carregarEntradas()]);
});
</script>

<style scoped>
.border {
  border-radius: 12px;
}
/* Se estiver usando <style scoped> */
.grade-azul :deep(.q-table thead tr) {
  background-color: #0057d9;
}

.grade-azul :deep(.q-table thead th) {
  background-color: #0057d9;
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
  height: 42px;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  border-bottom: 2px solid #dcdcdc;
}

.grade-azul :deep(.q-table thead th:last-child) {
  border-right: none;
}
</style>
