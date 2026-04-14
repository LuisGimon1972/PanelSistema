<template>
  <q-page padding class="bg-grey-2">
    <div class="row q-col-gutter-md items-start">
      <!-- BLOCO ESQUERDO -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="q-mb-md border">
          <q-card-section>
            <div class="text-h6">{{ tituloPagina }}</div>
            <div class="text-caption text-grey-7">
              Monte o pedido de forma rápida e acompanhe o total em tempo real
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mb-md border">
          <q-card-section>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-md-6">
                <div class="text-subtitle1 text-weight-medium q-mb-sm">Status do Pedido</div>

                <q-select
                  v-model="statusPedido"
                  :options="statusOptions"
                  emit-value
                  map-options
                  outlined
                  label="Status"
                  :disable="!pedidoId"
                  dense
                />
              </div>

              <div class="col-12 col-md-6">
                <div class="text-caption text-grey-7 q-mb-sm">Situação atual</div>

                <q-badge
                  :color="getStatusColor(statusPedido)"
                  class="text-subtitle2 q-pa-sm"
                  style="border-radius: 12px"
                >
                  {{ statusPedido }}
                </q-badge>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- CLIENTE -->
        <q-card flat bordered class="q-mb-md border">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-md">Cliente</div>

            <q-select
              v-model="clienteSelecionado"
              :options="clientesOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              use-input
              input-debounce="300"
              label="Buscar cliente"
              @filter="filtrarClientes"
              dense
            />
          </q-card-section>
        </q-card>

        <!-- ADICIONAR PRODUTO -->
        <q-card flat bordered class="q-mb-md border">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-md">Adicionar Produto</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-select
                  v-model="produtoSelecionado"
                  :options="produtosOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  outlined
                  use-input
                  input-debounce="300"
                  label="Buscar produto"
                  @filter="filtrarProdutos"
                  dense
                />
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model.number="quantidade"
                  type="number"
                  min="1"
                  outlined
                  label="Quantidade"
                  dense
                />
              </div>

              <div class="col-12 col-md-3 flex flex-center">
                <q-btn
                  color="primary"
                  icon="add_shopping_cart"
                  label="Adicionar"
                  class="full-width"
                  style="border-radius: 12px"
                  @click="adicionarItem"
                />
              </div>
            </div>

            <div v-if="produtoAtual" class="q-mt-md q-pa-sm rounded-borders bg-blue-1 text-grey-9">
              <div><strong>Produto:</strong> {{ produtoAtual.nome }}</div>
              <div><strong>Preço:</strong> {{ formatarMoeda(produtoAtual.preco) }}</div>
              <div><strong>Estoque:</strong> {{ produtoAtual.estoque }}</div>
            </div>
          </q-card-section>
        </q-card>

        <!-- ITENS -->
        <q-card flat bordered class="border">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-md">Itens do Pedido</div>

            <q-table
              flat
              bordered
              :rows="itens"
              :columns="columns"
              row-key="produto_id"
              no-data-label="Nenhum item adicionado"
            >
              <template #body-cell-preco="props">
                <q-td :props="props">
                  {{ formatarMoeda(props.row.preco) }}
                </q-td>
              </template>

              <template #body-cell-subtotal="props">
                <q-td :props="props">
                  {{ formatarMoeda(props.row.subtotal) }}
                </q-td>
              </template>

              <template #body-cell-acoes="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete"
                    @click="removerItem(props.row.produto_id)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- BLOCO DIREITO -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="sticky-card border">
          <q-card-section>
            <div class="text-h6 q-mb-md">Resumo da Venda</div>

            <div class="q-mb-sm">
              <div class="text-caption text-grey-7">Cliente</div>
              <div class="text-subtitle2">
                {{ nomeClienteSelecionado || 'Não selecionado' }}
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="row justify-between q-mb-sm">
              <span class="text-grey-7">Itens</span>
              <strong>{{ totalItens }}</strong>
            </div>

            <div class="row justify-between q-mb-sm">
              <span class="text-grey-7">Produtos diferentes</span>
              <strong>{{ itens.length }}</strong>
            </div>

            <div class="row justify-between q-mb-md">
              <span class="text-grey-7">Total</span>
              <strong class="text-primary text-h6">
                {{ formatarMoeda(totalPedido) }}
              </strong>
            </div>

            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="descontoValor"
                  type="number"
                  min="0"
                  :max="descontoTipo === 'percentual' ? 99 : undefined"
                  outlined
                  label="Desc."
                  dense
                  :rules="[
                    (val) => Number(val) >= 0 || 'Valor inválido',
                    (val) => descontoTipo !== 'percentual' || Number(val) <= 99 || 'Máx. 99%',
                  ]"
                >
                  <template #prepend>
                    <q-btn-toggle
                      v-model="descontoTipo"
                      no-caps
                      unelevated
                      dense
                      size="md"
                      toggle-color="primary"
                      color="white"
                      text-color="primary"
                      style="width: 60%"
                      :options="[
                        { label: 'R$', value: 'valor' },
                        { label: '%', value: 'percentual' },
                      ]"
                    />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="acrescimoValor"
                  type="number"
                  min="0"
                  outlined
                  label="Acréscimo"
                  dense
                >
                  <template #prepend>
                    <q-btn-toggle
                      v-model="acrescimoTipo"
                      no-caps
                      unelevated
                      dense
                      size="md"
                      toggle-color="primary"
                      color="white"
                      text-color="primary"
                      style="width: 60%"
                      :options="[
                        { label: 'R$', value: 'valor' },
                        { label: '%', value: 'percentual' },
                      ]"
                    />
                  </template>
                </q-input>
              </div>
            </div>

            <div class="row justify-between q-mb-sm">
              <span class="text-grey-7">Subtotal</span>
              <strong>{{ formatarMoeda(subtotalPedido) }}</strong>
            </div>

            <div class="row justify-between q-mb-sm">
              <span class="text-grey-7">
                Desconto
                <small v-if="descontoTipo === 'percentual'">({{ descontoValor }}%)</small>
              </span>
              <strong>{{ formatarMoeda(descontoCalculado) }}</strong>
            </div>

            <div class="row justify-between q-mb-sm">
              <span class="text-grey-7">
                Acréscimo
                <small v-if="acrescimoTipo === 'percentual'">({{ acrescimoValor }}%)</small>
              </span>
              <strong>{{ formatarMoeda(acrescimoCalculado) }}</strong>
            </div>

            <div class="row justify-between q-mb-md">
              <span class="text-grey-7">Total</span>
              <strong class="text-primary text-h6">
                {{ formatarMoeda(totalPedido) }}
              </strong>
            </div>

            <q-btn
              color="positive"
              icon="save"
              label="Salvar Pedido"
              class="full-width"
              :disable="!podeSalvar"
              :loading="salvando"
              style="border-radius: 12px"
              @click="salvarPedido"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Notify } from 'quasar';
import { api } from 'boot/axios';
import axios from 'axios';

const tituloPagina = computed(() => (pedidoId.value ? 'Editar Pedido' : 'Novo Pedido'));

const route = useRoute();
const router = useRouter();

const statusOptions = [
  { label: 'ABERTO', value: 'ABERTO' },
  { label: 'FINALIZADO', value: 'FINALIZADO' },
  { label: 'CANCELADO', value: 'CANCELADO' },
];

const statusPedido = ref<'ABERTO' | 'FINALIZADO' | 'CANCELADO'>('ABERTO');

const pedidoId = computed(() => (route.params.id ? Number(route.params.id) : null));

const origemPedido = ref<'PEDIDO' | 'PDV'>('PEDIDO');

function getStatusColor(status: string) {
  switch (status) {
    case 'ABERTO':
      return 'orange';
    case 'FINALIZADO':
      return 'positive';
    case 'CANCELADO':
      return 'negative';
    default:
      return 'grey';
  }
}

interface PedidoItemApi {
  id: number;
  produto_id: number;
  nome_produto: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
}

type PedidoDetalhe = {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  status: 'ABERTO' | 'FINALIZADO' | 'CANCELADO';
  origem: 'PEDIDO' | 'PDV'; // 👈 adicionar aqui
  desconto: number;
  acrescimo: number;
  total: string;
  data: string;
  itens: {
    produto_id: number;
    nome_produto: string;
    preco_unitario: string;
    quantidade: string;
    subtotal: string;
  }[];
};

interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cidade?: string;
}

interface Produto {
  id: number;
  nome: string;
  categoria?: string;
  preco: number;
  estoque: number;
  status?: string;
}

interface ItemPedido {
  produto_id: number;
  nome: string;
  preco: number;
  quantidade: number;
  subtotal: number;
}

interface OptionItem {
  label: string;
  value: number;
}

const clientes = ref<Cliente[]>([]);
const produtos = ref<Produto[]>([]);

const clientesOptions = ref<OptionItem[]>([]);
const produtosOptions = ref<OptionItem[]>([]);

const clienteSelecionado = ref<number | null>(null);
const produtoSelecionado = ref<number | null>(null);
const quantidade = ref<number>(1);

const itens = ref<ItemPedido[]>([]);
const salvando = ref(false);

const desconto = ref<number>(0);
const acrescimo = ref<number>(0);

const descontoTipo = ref<'valor' | 'percentual'>('valor');
const descontoValor = ref<number>(0);

const acrescimoTipo = ref<'valor' | 'percentual'>('valor');
const acrescimoValor = ref<number>(0);

const subtotalPedido = computed(() => itens.value.reduce((acc, item) => acc + item.subtotal, 0));

const descontoCalculado = computed(() => {
  if (descontoTipo.value === 'percentual') {
    return subtotalPedido.value * (Number(descontoValor.value || 0) / 100);
  }

  return Number(descontoValor.value || 0);
});

const acrescimoCalculado = computed(() => {
  if (acrescimoTipo.value === 'percentual') {
    return subtotalPedido.value * (Number(acrescimoValor.value || 0) / 100);
  }

  return Number(acrescimoValor.value || 0);
});

const totalPedido = computed(() =>
  Math.max(0, subtotalPedido.value - descontoCalculado.value + acrescimoCalculado.value),
);

const columns = [
  { name: 'nome', label: 'Produto', field: 'nome', align: 'left' as const },
  { name: 'preco', label: 'Preço', field: 'preco', align: 'left' as const },
  { name: 'quantidade', label: 'Qtd.', field: 'quantidade', align: 'left' as const },
  { name: 'subtotal', label: 'Subtotal', field: 'subtotal', align: 'left' as const },
  { name: 'acoes', label: 'Ações', field: 'acoes', align: 'center' as const },
];

const produtoAtual = computed(
  () => produtos.value.find((p) => p.id === produtoSelecionado.value) || null,
);

const clienteAtual = computed(
  () => clientes.value.find((c) => c.id === clienteSelecionado.value) || null,
);

const nomeClienteSelecionado = computed(() => clienteAtual.value?.nome || '');

const totalItens = computed(() => itens.value.reduce((acc, item) => acc + item.quantidade, 0));

const podeSalvar = computed(() => !!clienteSelecionado.value && itens.value.length > 0);

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor || 0));
}

async function carregarClientes() {
  const { data } = await api.get<Cliente[]>('/clientes');
  clientes.value = data;
  clientesOptions.value = data.map((cliente) => ({
    label: cliente.nome,
    value: cliente.id,
  }));
}

async function carregarProdutos() {
  const { data } = await api.get<Produto[]>('/produtos');
  produtos.value = data;
  produtosOptions.value = data.map((produto) => ({
    label: `${produto.nome} (${produto.estoque} em estoque)`,
    value: produto.id,
  }));
}

function filtrarClientes(val: string, update: (fn: () => void) => void) {
  update(() => {
    const termo = val.toLowerCase();
    clientesOptions.value = clientes.value
      .filter((cliente) => cliente.nome.toLowerCase().includes(termo))
      .map((cliente) => ({
        label: cliente.nome,
        value: cliente.id,
      }));
  });
}

function filtrarProdutos(val: string, update: (fn: () => void) => void) {
  update(() => {
    const termo = val.toLowerCase();
    produtosOptions.value = produtos.value
      .filter((produto) => produto.nome.toLowerCase().includes(termo))
      .map((produto) => ({
        label: `${produto.nome} (${produto.estoque} em estoque)`,
        value: produto.id,
      }));
  });
}

function adicionarItem() {
  if (!produtoSelecionado.value) {
    Notify.create({
      type: 'warning',
      message: 'Selecione um produto',
    });
    return;
  }

  if (!quantidade.value || quantidade.value <= 0) {
    Notify.create({
      type: 'warning',
      message: 'Informe uma quantidade válida',
    });
    return;
  }

  const produto = produtos.value.find((p) => p.id === produtoSelecionado.value);

  if (!produto) {
    Notify.create({
      type: 'negative',
      message: 'Produto não encontrado',
    });
    return;
  }

  if (quantidade.value > produto.estoque) {
    Notify.create({
      type: 'negative',
      message: `Estoque insuficiente. Disponível: ${produto.estoque}`,
    });
    return;
  }

  const itemExistente = itens.value.find((item) => item.produto_id === produto.id);

  if (itemExistente) {
    const novaQuantidade = itemExistente.quantidade + quantidade.value;

    if (novaQuantidade > produto.estoque) {
      Notify.create({
        type: 'negative',
        message: `Quantidade total excede o estoque disponível (${produto.estoque})`,
      });
      return;
    }

    itemExistente.quantidade = novaQuantidade;
    itemExistente.subtotal = itemExistente.quantidade * itemExistente.preco;
  } else {
    itens.value.push({
      produto_id: produto.id,
      nome: produto.nome,
      preco: Number(produto.preco),
      quantidade: quantidade.value,
      subtotal: Number(produto.preco) * quantidade.value,
    });
  }

  produtoSelecionado.value = null;
  quantidade.value = 1;

  Notify.create({
    type: 'positive',
    message: 'Produto adicionado ao pedido',
  });
}

function removerItem(produtoId: number) {
  itens.value = itens.value.filter((item) => item.produto_id !== produtoId);

  Notify.create({
    type: 'info',
    message: 'Item removido',
  });
}

async function salvarPedido() {
  if (!clienteSelecionado.value) {
    Notify.create({
      type: 'warning',
      message: 'Selecione um cliente',
    });
    return;
  }

  if (itens.value.length === 0) {
    Notify.create({
      type: 'warning',
      message: 'Adicione pelo menos um item',
    });
    return;
  }

  salvando.value = true;

  try {
    const payload = {
      cliente_id: clienteSelecionado.value,
      status: statusPedido.value,
      desconto: Number(descontoCalculado.value || 0),
      acrescimo: Number(acrescimoCalculado.value || 0),
      origem: 'PEDIDO',
      itens: itens.value.map((item) => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
      })),
    };

    if (pedidoId.value) {
      if (statusPedido.value === 'CANCELADO') {
        await api.put(`/pedidos/${pedidoId.value}/cancelar`);

        Notify.create({
          type: 'positive',
          message: 'Pedido cancelado com sucesso',
        });
      } else {
        await api.put(`/pedidos/${pedidoId.value}`, payload);

        Notify.create({
          type: 'positive',
          message: 'Pedido atualizado com sucesso',
        });
      }
    } else {
      await api.post('/pedidos', payload);

      Notify.create({
        type: 'positive',
        message: 'Pedido salvo com sucesso',
      });
    }

    clienteSelecionado.value = null;
    produtoSelecionado.value = null;
    quantidade.value = 1;
    statusPedido.value = 'ABERTO';
    itens.value = [];
    desconto.value = 0;
    acrescimo.value = 0;

    await carregarProdutos();
    await router.push('/pedidos/lista');
  } catch (error: unknown) {
    let mensagem = 'Erro ao salvar pedido';

    if (axios.isAxiosError(error)) {
      mensagem = error.response?.data?.erro || mensagem;
    }

    Notify.create({
      type: 'negative',
      message: mensagem,
    });
  } finally {
    salvando.value = false;
  }
}

async function carregarPedidoEdicao() {
  if (!pedidoId.value) return;

  try {
    const { data } = await api.get<PedidoDetalhe>(`/pedidos/${pedidoId.value}`);

    clienteSelecionado.value = data.cliente_id;
    statusPedido.value = data.status as 'ABERTO' | 'FINALIZADO' | 'CANCELADO';
    descontoValor.value = Number(data.desconto || 0);
    descontoTipo.value = 'valor'; // backend siempre manda valor

    acrescimoValor.value = Number(data.acrescimo || 0);
    acrescimoTipo.value = 'valor';
    origemPedido.value = data.origem as 'PEDIDO' | 'PDV';

    itens.value = data.itens.map((item) => ({
      produto_id: item.produto_id,
      nome: item.nome_produto,
      preco: Number(item.preco_unitario),
      quantidade: Number(item.quantidade),
      subtotal: Number(item.subtotal),
    }));
  } catch (error: unknown) {
    let mensagem = 'Erro ao carregar pedido para edição';

    if (axios.isAxiosError(error)) {
      mensagem = error.response?.data?.erro || mensagem;
    }

    Notify.create({
      type: 'negative',
      message: mensagem,
    });

    await router.push('/pedidos/lista');
  }
}

watch([descontoTipo, descontoValor], ([tipo, valor]) => {
  if (tipo === 'percentual' && Number(valor) > 99) {
    descontoValor.value = 99;
  }
});

onMounted(async () => {
  await Promise.all([carregarClientes(), carregarProdutos()]);

  if (pedidoId.value) {
    await carregarPedidoEdicao();
  }
});
</script>

<style scoped>
.sticky-card {
  position: sticky;
  top: 20px;
}

.border {
  border-radius: 12px;
}
</style>
