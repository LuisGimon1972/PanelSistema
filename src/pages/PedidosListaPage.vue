<template>
  <q-page padding class="bg-grey-2">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5">Pedidos e Vendas</div>
        <div class="text-caption text-grey-7">Histórico de Pedidos e Vendas no PDV</div>
      </div>

      <q-btn
        color="primary"
        icon="add"
        label="Novo Pedido"
        style="border-radius: 12px"
        to="/pedidos"
      />
    </div>

    <q-card flat bordered class="border">
      <q-card-section>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-3">
            <q-select
              v-model="filtroOrigem"
              :options="opcoesOrigem"
              label="Filtrar por Origem"
              clearable
              outlined
              dense
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filtroStatus"
              :options="opcoesStatus"
              label="Filtrar por Status"
              clearable
              outlined
              dense
            />
          </div>

          <div class="col-12 col-md-3 flex items-end">
            <q-btn
              color="warning"
              icon="filter_alt_off"
              label="Limpar Filtros"
              style="border-radius: 12px"
              :disable="!filtroOrigem && !filtroStatus"
              @click="limparFiltros"
            />
          </div>
        </div>
        <q-table
          flat
          bordered
          :rows="pedidosFiltrados"
          :columns="columns"
          row-key="id"
          :loading="loading"
          no-data-label="Nenhum pedido encontrado"
          class="border"
        >
          <template #body-cell-data="props">
            <q-td :props="props">
              {{ formatarData(props.row.data) }}
            </q-td>
          </template>

          <template #body-cell-total="props">
            <q-td :props="props">
              {{ formatarMoeda(props.row.total) }}
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="
                  props.row.status === 'ABERTO'
                    ? 'orange'
                    : props.row.status === 'FINALIZADO'
                      ? 'positive'
                      : props.row.status === 'CANCELADO'
                        ? 'negative'
                        : 'grey'
                "
                outline
              >
                {{ props.row.status }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-acoes="props">
            <q-td :props="props" class="q-gutter-sm">
              <q-btn
                flat
                round
                dense
                icon="visibility"
                color="primary"
                @click="verPedido(props.row.id)"
              />

              <q-btn
                flat
                round
                dense
                icon="edit"
                color="warning"
                :disable="props.row.status !== 'ABERTO'"
                @click="editarPedido(props.row.id)"
              />

              <q-btn
                flat
                round
                dense
                icon="cancel"
                color="negative"
                :disable="props.row.status === 'CANCELADO'"
                @click="cancelarPedido(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="dialogDetalhes">
      <q-card class="border" style="min-width: 800px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">{{ pedidoDetalhe?.origem }} #{{ pedidoDetalhe?.id }}</div>
            <div class="text-caption text-grey-7">Cliente: {{ pedidoDetalhe?.cliente_nome }}</div>
          </div>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-3">
              <div class="text-caption text-grey-7">Data</div>
              <div>{{ formatarData(pedidoDetalhe?.data) }}</div>
            </div>

            <div class="col-12 col-md-3">
              <div class="text-caption text-grey-7">Status</div>
              <div>{{ pedidoDetalhe?.status }}</div>
            </div>

            <div class="col-12 col-md-3">
              <div class="text-caption text-grey-7">Desconto</div>
              <div class="text-negative">- {{ formatarMoeda(pedidoDetalhe?.desconto || 0) }}</div>
            </div>

            <div class="col-12 col-md-3">
              <div class="text-caption text-grey-7">Acréscimo</div>
              <div class="text-positive">+ {{ formatarMoeda(pedidoDetalhe?.acrescimo || 0) }}</div>
            </div>
          </div>

          <q-table
            flat
            bordered
            dense
            :rows="pedidoDetalhe?.itens || []"
            :columns="columnsItens"
            row-key="id"
            hide-pagination
            :rows-per-page-options="[0]"
          >
            <template #body-cell-preco_unitario="props">
              <q-td :props="props">
                {{ formatarMoeda(props.row.preco_unitario) }}
              </q-td>
            </template>

            <template #body-cell-subtotal="props">
              <q-td :props="props">
                {{ formatarMoeda(props.row.subtotal) }}
              </q-td>
            </template>
          </q-table>

          <div class="row justify-end q-mt-md">
            <div class="col-12 col-md-4">
              <q-list dense bordered class="rounded-borders">
                <q-item>
                  <q-item-section>
                    <q-item-label>Subtotal</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    {{
                      formatarMoeda(
                        (pedidoDetalhe?.itens || []).reduce(
                          (acc, item) => acc + Number(item.subtotal || 0),
                          0,
                        ),
                      )
                    }}
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label>Desconto</q-item-label>
                  </q-item-section>
                  <q-item-section side class="text-negative">
                    - {{ formatarMoeda(pedidoDetalhe?.desconto || 0) }}
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label>Acréscimo</q-item-label>
                  </q-item-section>
                  <q-item-section side class="text-positive">
                    + {{ formatarMoeda(pedidoDetalhe?.acrescimo || 0) }}
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">Total</q-item-label>
                  </q-item-section>
                  <q-item-section side class="text-weight-bold text-primary">
                    {{ formatarMoeda(pedidoDetalhe?.total || 0) }}
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { Notify } from 'quasar';
import { api } from 'boot/axios';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

type OrigemPedido = 'PEDIDO' | 'PDV';
type StatusPedido = 'ABERTO' | 'FINALIZADO' | 'CANCELADO';

const filtroOrigem = ref<OrigemPedido | null>(null);
const filtroStatus = ref<StatusPedido | null>(null);

const opcoesOrigem: OrigemPedido[] = ['PEDIDO', 'PDV'];
const opcoesStatus: StatusPedido[] = ['ABERTO', 'FINALIZADO', 'CANCELADO'];

const pedidosFiltrados = computed(() => {
  return pedidos.value.filter((p) => {
    const matchOrigem = !filtroOrigem.value || p.origem === filtroOrigem.value;
    const matchStatus = !filtroStatus.value || p.status === filtroStatus.value;

    return matchOrigem && matchStatus;
  });
});

interface Pedido {
  id: number;
  data: string;
  status: StatusPedido;
  total: number;
  cliente_nome: string | null;
  origem: OrigemPedido;
}

interface PedidoItem {
  id: number;
  produto_id: number;
  nome_produto: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
}

interface PedidoDetalhe extends Pedido {
  cliente_id: number | null;
  itens: PedidoItem[];
  desconto: number;
  acrescimo: number;
}

function limparFiltros() {
  filtroOrigem.value = null;
  filtroStatus.value = null;
}

const pedidos = ref<Pedido[]>([]);
const loading = ref(false);

const dialogDetalhes = ref(false);
const pedidoDetalhe = ref<PedidoDetalhe | null>(null);

const columns = [
  { name: 'id', label: 'Número', field: 'id', align: 'left' as const },
  { name: 'origem', label: 'Origem', field: 'origem', align: 'left' as const },
  { name: 'cliente_nome', label: 'Cliente', field: 'cliente_nome', align: 'left' as const },
  { name: 'data', label: 'Data', field: 'data', align: 'left' as const },
  { name: 'status', label: 'Status', field: 'status', align: 'left' as const },
  { name: 'desconto', label: 'Desconto', field: 'desconto', align: 'left' as const },
  { name: 'acrescimo', label: 'Acréscimo', field: 'acrescimo', align: 'left' as const },
  { name: 'total', label: 'Total', field: 'total', align: 'left' as const },
  { name: 'acoes', label: 'Ações', field: 'acoes', align: 'center' as const },
];

const columnsItens = [
  { name: 'nome_produto', label: 'Produto', field: 'nome_produto', align: 'left' as const },
  {
    name: 'preco_unitario',
    label: 'Preço Unitário',
    field: 'preco_unitario',
    align: 'left' as const,
  },
  { name: 'quantidade', label: 'Qtd.', field: 'quantidade', align: 'left' as const },
  { name: 'subtotal', label: 'Subtotal', field: 'subtotal', align: 'left' as const },
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

async function carregarPedidos() {
  loading.value = true;

  try {
    const { data } = await api.get<Pedido[]>('/pedidos');
    pedidos.value = data;
  } catch (error: unknown) {
    let mensagem = 'Erro ao carregar pedidos';

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

async function verPedido(id: number) {
  try {
    const { data } = await api.get<PedidoDetalhe>(`/pedidos/${id}`);
    pedidoDetalhe.value = data;
    dialogDetalhes.value = true;
  } catch (error: unknown) {
    let mensagem = 'Erro ao carregar detalhes do pedido';

    if (axios.isAxiosError(error)) {
      mensagem = error.response?.data?.erro || mensagem;
    }

    Notify.create({
      type: 'negative',
      message: mensagem,
    });
  }
}

async function alterarStatus(id: number, status: StatusPedido) {
  try {
    if (status === 'CANCELADO') {
      await cancelarPedido(id);
      return;
    }

    await api.put(`/pedidos/${id}/status`, { status });

    Notify.create({
      type: 'positive',
      message: 'Status atualizado com sucesso',
    });

    await carregarPedidos();
  } catch (error: unknown) {
    let mensagem = 'Erro ao atualizar status';

    if (axios.isAxiosError(error)) {
      mensagem = error.response?.data?.erro || mensagem;
    }

    Notify.create({
      type: 'negative',
      message: mensagem,
    });
  }
}

async function cancelarPedido(id: number) {
  try {
    await api.put(`/pedidos/${id}/cancelar`);

    Notify.create({
      type: 'positive',
      message: 'Pedido cancelado com sucesso',
    });

    await carregarPedidos();
  } catch (error: unknown) {
    let mensagem = 'Erro ao cancelar pedido';

    if (axios.isAxiosError(error)) {
      mensagem = error.response?.data?.erro || mensagem;
    }

    Notify.create({
      type: 'negative',
      message: mensagem,
    });
  }
}

function editarPedido(id: number) {
  router.push(`/pedidos/editar/${id}`);
}

onMounted(() => {
  carregarPedidos();
});
</script>

<style scoped>
.border {
  border-radius: 12px;
}
</style>
