<template>
  <q-page padding class="bg-grey-2">
    <div class="row q-col-gutter-md items-start">
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
                  :max="acrescimoTipo === 'percentual' ? 99 : undefined"
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
              v-if="statusPedido === 'ABERTO'"
              color="primary"
              icon="save"
              label="Finalizar"
              class="full-width"
              :disable="!podeSalvar"
              :loading="salvando"
              style="border-radius: 12px"
              @click="finalizarPedidoAberto"
            />

            <q-btn
              v-else-if="statusPedido === 'FINALIZADO'"
              color="positive"
              icon="point_of_sale"
              label="Faturar"
              class="full-width"
              :disable="!podeSalvar"
              :loading="salvando"
              style="border-radius: 12px"
              @click="modalFaturar = true"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="modalFaturar" persistent>
      <q-card class="border" style="width: 450px">
        <q-card-section>
          <div class="text-h6">Faturamento</div>
        </q-card-section>

        <q-card-section>
          <div
            v-for="(pagamento, index) in pagamentos"
            :key="pagamento.forma"
            class="row items-center q-col-gutter-sm q-mb-sm"
          >
            <div class="col-4">
              <div class="text-subtitle2">
                {{ pagamento.label }}
              </div>
            </div>

            <div class="col-8">
              <q-input
                :ref="criarPagamentoRef(index)"
                v-model.number="pagamento.valor"
                type="number"
                min="0"
                step="0.01"
                outlined
                dense
                class="sem-setas"
                input-class="text-right"
                placeholder="0,00"
                :label="`Valor em ${pagamento.label}`"
              >
                <template #prepend>
                  <span class="text-blue-7 text-caption">R$</span>
                </template>
              </q-input>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="row justify-between q-mb-sm">
            <span class="text-grey-7">Total</span>
            <strong class="text-primary text-h6">
              {{ formatarMoeda(totalPedido) }}
            </strong>
          </div>

          <div class="row justify-between q-mb-sm">
            <span class="text-grey-7">Total pago</span>
            <strong>{{ formatarMoeda(totalPago) }}</strong>
          </div>

          <div class="row justify-between q-mb-sm">
            <span class="text-grey-7">Falta pagar</span>
            <strong class="text-negative">
              {{ formatarMoeda(faltaPagar) }}
            </strong>
          </div>

          <div class="row justify-between q-mb-md">
            <span class="text-grey-7">Troco</span>
            <strong class="text-positive text-h6">
              {{ formatarMoeda(troco) }}
            </strong>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="positive"
            icon="check"
            label="Confirmar"
            :loading="salvando"
            @click="salvarPedidoComPagamento"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
import { Notify, QInput } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'boot/axios';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const finalizando = ref(false);

const tituloPagina = computed(() => (pedidoId.value ? 'Editar Pedido' : 'Novo Pedido'));

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

const formaSelecionada = ref<FormaPagamento>('DINHEIRO');
const valorDigitado = ref(0);

type TipoAjuste = 'valor' | 'percentual';
type FormaPagamento = 'DINHEIRO' | 'CARTAO' | 'PIX';
type FormaPagamentoResumo = FormaPagamento | 'COMBINADO';

type PagamentoPedido = {
  forma: FormaPagamento;
  valor: number;
};

type PedidoDetalhe = {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  status: 'ABERTO' | 'FINALIZADO' | 'CANCELADO';
  origem: 'PEDIDO' | 'PDV';
  desconto: number;
  acrescimo: number;
  desconto_tipo: TipoAjuste;
  desconto_valor: number;
  acrescimo_tipo: TipoAjuste;
  acrescimo_valor: number;
  forma_pagamento?: FormaPagamentoResumo | null;
  valor_recebido?: number | null;
  troco?: number | null;
  pagamentos?: PagamentoPedido[] | null;
  total: number;
  data: string;
  itens: {
    produto_id: number;
    nome_produto: string;
    preco_unitario: number;
    quantidade: number;
    subtotal: number;
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

const descontoTipo = ref<TipoAjuste>('valor');
const descontoValor = ref<number>(0);

const acrescimoTipo = ref<TipoAjuste>('valor');
const acrescimoValor = ref<number>(0);

const modalFaturar = ref(false);

const pagamentoRefs = ref<Array<InstanceType<typeof QInput> | null>>([]);

function criarPagamentoRef(index: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    pagamentoRefs.value[index] = el as InstanceType<typeof QInput> | null;
  };
}

watch(modalFaturar, async (abriu) => {
  if (!abriu) {
    pagamentoRefs.value = [];
    return;
  }

  await nextTick();

  setTimeout(() => {
    pagamentoRefs.value[0]?.focus();
  }, 200);
});

type PagamentoLinha = {
  forma: FormaPagamento;
  label: string;
  valor: number | null;
};

function getLabelFormaPagamento(forma: FormaPagamento): string {
  switch (forma) {
    case 'DINHEIRO':
      return 'Dinheiro';
    case 'CARTAO':
      return 'Cartão';
    case 'PIX':
      return 'PIX';
  }
}

function criarPagamentosIniciais(): PagamentoLinha[] {
  return [
    { forma: 'DINHEIRO', label: 'Dinheiro', valor: null },
    { forma: 'CARTAO', label: 'Cartão', valor: null },
    { forma: 'PIX', label: 'PIX', valor: null },
  ];
}

const pagamentos = ref<PagamentoLinha[]>(criarPagamentosIniciais());

function limparPagamentos() {
  pagamentos.value = criarPagamentosIniciais();
}

function obterPagamentosValidos() {
  return pagamentos.value
    .map((item) => ({
      forma: item.forma,
      valor: Number(item.valor || 0),
    }))
    .filter((item) => item.valor > 0);
}

function obterFormaPagamentoResumo(
  pagamentosValidos: Array<{ forma: FormaPagamento; valor: number }>,
): FormaPagamentoResumo {
  if (pagamentosValidos.length === 1) {
    return pagamentosValidos[0]!.forma;
  }

  return 'COMBINADO';
}

const subtotalPedido = computed(() => itens.value.reduce((acc, item) => acc + item.subtotal, 0));

function selecionarForma(tipo: FormaPagamento) {
  formaSelecionada.value = tipo;
  valorDigitado.value = 0;
}

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

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const isFormaSemTroco = (forma?: string) =>
  ['PIX', 'CARTAO', 'CARTÃO'].includes((forma || '').toUpperCase());

const totalInformado = computed(() => {
  const total = pagamentos.value.reduce((acc, item) => {
    return acc + (Number(item.valor) || 0);
  }, 0);

  return round2(total);
});

const totalEmDinheiro = computed(() => {
  const total = pagamentos.value
    .filter((item) => item.forma === 'DINHEIRO')
    .reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  return round2(total);
});

const totalPago = computed(() => {
  return round2(Math.min(totalInformado.value, totalPedido.value));
});

const faltaPagar = computed(() => {
  return round2(Math.max(0, totalPedido.value - totalInformado.value));
});

const troco = computed(() => {
  return round2(Math.max(0, totalInformado.value - totalPedido.value));
});

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
    Notify.create({ type: 'warning', message: 'Selecione um produto' });
    return;
  }

  if (!quantidade.value || quantidade.value <= 0) {
    Notify.create({ type: 'warning', message: 'Informe uma quantidade válida' });
    return;
  }

  const produto = produtos.value.find((p) => p.id === produtoSelecionado.value);

  if (!produto) {
    Notify.create({ type: 'negative', message: 'Produto não encontrado' });
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
  Notify.create({ type: 'info', message: 'Item removido' });
}

async function salvarPedido() {
  if (!clienteSelecionado.value) {
    Notify.create({ type: 'warning', message: 'Selecione um cliente' });
    return;
  }

  if (itens.value.length === 0) {
    Notify.create({ type: 'warning', message: 'Adicione pelo menos um item' });
    return;
  }

  salvando.value = true;

  try {
    const payload = {
      cliente_id: Number(clienteSelecionado.value),
      status: statusPedido.value,
      origem: origemPedido.value,
      desconto: Number(descontoCalculado.value || 0),
      acrescimo: Number(acrescimoCalculado.value || 0),
      desconto_tipo: descontoTipo.value,
      desconto_valor: Number(descontoValor.value || 0),
      acrescimo_tipo: acrescimoTipo.value,
      acrescimo_valor: Number(acrescimoValor.value || 0),
      forma_pagamento: null,
      valor_recebido: null,
      troco: null,
      pagamentos: [],
      itens: itens.value.map((item) => ({
        produto_id: Number(item.produto_id),
        quantidade: Number(item.quantidade),
      })),
    };

    if (pedidoId.value) {
      if (statusPedido.value === 'CANCELADO') {
        await api.put(`/pedidos/${pedidoId.value}/cancelar`);
        Notify.create({ type: 'positive', message: 'Pedido cancelado com sucesso' });
      } else {
        await api.put(`/pedidos/${pedidoId.value}`, payload);
        Notify.create({ type: 'positive', message: 'Pedido salvo com sucesso' });
      }
    } else {
      await api.post('/pedidos', payload);
      Notify.create({ type: 'positive', message: 'Pedido salvo com sucesso' });
    }

    resetFormulario();
    await carregarProdutos();
    await router.push('/pedidos/lista');
  } catch (error: unknown) {
    let mensagem = 'Erro ao salvar pedido';

    if (axios.isAxiosError(error)) {
      mensagem = error.response?.data?.erro || mensagem;
    }

    Notify.create({ type: 'negative', message: mensagem });
  } finally {
    salvando.value = false;
  }
}

async function finalizarPedidoAberto() {
  await salvarPedido();
}

async function confirmarFaturamento() {
  if (pagamentos.value.length === 0) {
    Notify.create({
      type: 'warning',
      message: 'Adicione pelo menos uma forma de pagamento',
    });
    return;
  }

  const possuiValorInvalido = pagamentos.value.some(
    (item) => !Number.isFinite(Number(item.valor)) || Number(item.valor) < 0,
  );

  if (possuiValorInvalido) {
    Notify.create({
      type: 'warning',
      message: 'Existe pagamento com valor inválido',
    });
    return;
  }

  if (totalPago.value < totalPedido.value) {
    Notify.create({
      type: 'warning',
      message: 'O total pago é menor que o valor do pedido',
    });
    return;
  }

  await salvarPedidoComPagamento();
}

async function salvarPedidoComPagamento() {
  if (!clienteSelecionado.value) {
    Notify.create({ type: 'warning', message: 'Selecione um cliente' });
    return;
  }

  if (itens.value.length === 0) {
    Notify.create({ type: 'warning', message: 'Adicione pelo menos um item' });
    return;
  }

  const pagamentosPayload = obterPagamentosValidos();

  if (pagamentosPayload.length === 0) {
    Notify.create({
      type: 'warning',
      message: 'Informe pelo menos uma forma de pagamento',
    });
    return;
  }

  let restante = round2(totalPedido.value);

  for (const item of pagamentosPayload) {
    if (isFormaSemTroco(item.forma) && item.valor > restante) {
      Notify.create({
        type: 'warning',
        message: `O valor do ${item.forma} não pode ser maior que o valor faltante de R$ ${restante.toFixed(2)}.`,
      });
      return;
    }

    const valorAplicado = round2(Math.min(item.valor, restante));
    restante = round2(Math.max(0, restante - valorAplicado));
  }

  if (totalPago.value < totalPedido.value) {
    Notify.create({
      type: 'warning',
      message: 'O total pago é menor que o valor do pedido',
    });
    return;
  }

  salvando.value = true;

  try {
    const formaPagamentoResumo = obterFormaPagamentoResumo(pagamentosPayload);

    const payload = {
      cliente_id: Number(clienteSelecionado.value),
      status: 'FINALIZADO',
      origem: origemPedido.value,

      desconto: Number(descontoCalculado.value || 0),
      acrescimo: Number(acrescimoCalculado.value || 0),

      desconto_tipo: descontoTipo.value,
      desconto_valor: Number(descontoValor.value || 0),

      acrescimo_tipo: acrescimoTipo.value,
      acrescimo_valor: Number(acrescimoValor.value || 0),

      forma_pagamento: formaPagamentoResumo,
      valor_recebido: Number(totalPago.value || 0),
      troco: Number(troco.value || 0),
      pagamentos: pagamentosPayload,

      itens: itens.value.map((item) => ({
        produto_id: Number(item.produto_id),
        quantidade: Number(item.quantidade),
      })),
    };

    if (pedidoId.value) {
      await api.put(`/pedidos/${pedidoId.value}`, payload);
      Notify.create({ type: 'positive', message: 'Pedido faturado com sucesso' });
    } else {
      await api.post('/pedidos', payload);
      Notify.create({ type: 'positive', message: 'Pedido faturado com sucesso' });
    }

    resetFormulario();
    await carregarProdutos();
    await router.push('/pedidos/lista');
  } catch (error: unknown) {
    let mensagem = 'Erro ao faturar pedido';

    if (axios.isAxiosError(error)) {
      mensagem = error.response?.data?.erro || mensagem;
    }

    Notify.create({ type: 'negative', message: mensagem });
  } finally {
    salvando.value = false;
  }
}

function resetFormulario() {
  clienteSelecionado.value = null;
  produtoSelecionado.value = null;
  quantidade.value = 1;
  statusPedido.value = 'ABERTO';
  origemPedido.value = 'PEDIDO';
  itens.value = [];
  descontoTipo.value = 'valor';
  descontoValor.value = 0;
  acrescimoTipo.value = 'valor';
  acrescimoValor.value = 0;
  limparPagamentos();
  modalFaturar.value = false;
}

async function carregarPedidoEdicao() {
  if (!pedidoId.value) return;

  try {
    const { data } = await api.get<PedidoDetalhe>(`/pedidos/${pedidoId.value}`);

    clienteSelecionado.value = data.cliente_id;
    statusPedido.value = data.status;
    origemPedido.value = data.origem;
    descontoTipo.value = data.desconto_tipo || 'valor';
    descontoValor.value = Number(data.desconto_valor || 0);
    acrescimoTipo.value = data.acrescimo_tipo || 'valor';
    acrescimoValor.value = Number(data.acrescimo_valor || 0);

    pagamentos.value =
      Array.isArray(data.pagamentos) && data.pagamentos.length > 0
        ? data.pagamentos.map((item) => ({
            forma: item.forma,
            label: getLabelFormaPagamento(item.forma),
            valor: Number(item.valor || 0),
          }))
        : criarPagamentosIniciais();

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

    Notify.create({ type: 'negative', message: mensagem });
    await router.push('/pedidos/lista');
  }
}

watch([descontoTipo, descontoValor], ([tipo, valor]) => {
  if (tipo === 'percentual' && Number(valor) > 99) {
    descontoValor.value = 99;
  }
});

watch([acrescimoTipo, acrescimoValor], ([tipo, valor]) => {
  if (tipo === 'percentual' && Number(valor) > 99) {
    acrescimoValor.value = 99;
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

@media (max-width: 1023px) {
  .sticky-card {
    position: static;
  }
}

.border {
  border-radius: 12px;
}

.lista-scroll {
  max-height: calc(5 * 60px);
  overflow-y: auto;
}

.lista-produtos {
  height: 280px;
  overflow-y: scroll;
  border: 1px solid #ddd;
}

.scroll-carrinho {
  max-height: 170px;
  overflow-y: auto;
}

:deep(.sem-setas input::-webkit-outer-spin-button),
:deep(.sem-setas input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

:deep(.sem-setas input[type='number']) {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
