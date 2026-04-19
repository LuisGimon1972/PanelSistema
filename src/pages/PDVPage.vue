<template>
  <q-page class="bg-grey-2 q-pa-md">
    <div class="row q-col-gutter-md items-start">
      <div class="col-12 col-md-7">
        <q-card flat bordered class="q-mb-md border">
          <q-card-section>
            <div class="text-h5">Ponto de Venda</div>
            <div class="text-caption text-grey-7">
              Venda rápida com seleção de cliente e controle automático de estoque
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mb-md border">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-md">Cliente da Venda</div>

            <q-select
              v-model="clienteSelecionado"
              class="border"
              :options="clientesOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
              clearable
              use-input
              input-debounce="300"
              label="Selecionar cliente (opcional)"
              @filter="filtrarClientes"
            />
          </q-card-section>
        </q-card>

        <q-card flat bordered class="border">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-md">Produtos</div>

            <q-input
              ref="inputBusca"
              v-model="busca"
              outlined
              dense
              label="Buscar produto ou código de barras"
              @keyup.enter="buscarOuAdicionarProduto"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>

            <div class="lista-produtos">
              <q-list bordered separator>
                <q-item
                  v-for="produto in produtosFiltrados"
                  :key="produto.id"
                  clickable
                  dense
                  @click="adicionarProduto(produto)"
                >
                  <q-item-section>
                    <q-item-label>{{ produto.nome }}</q-item-label>
                    <q-item-label caption> Estoque: {{ produto.estoque }} </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <div class="text-weight-medium">
                      {{ formatarMoeda(produto.preco) }}
                    </div>
                  </q-item-section>

                  <q-item-section side>
                    <q-btn
                      flat
                      round
                      color="primary"
                      icon="add_shopping_cart"
                      @click.stop="adicionarProduto(produto)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-5">
        <q-card flat bordered class="sticky-card border">
          <q-card-section>
            <div class="text-h6 q-mb-md">Carrinho</div>

            <div class="q-mb-md">
              <div class="text-caption text-grey-7">Cliente final</div>
              <div class="text-subtitle2">
                {{ nomeClienteFinal }}
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div v-if="carrinho.length === 0" class="text-grey-7 text-center q-py-xl">
              Nenhum item adicionado
            </div>

            <div v-else>
              <div class="scroll-carrinho">
                <div
                  v-for="item in carrinho"
                  :key="item.produto_id"
                  class="q-mb-md q-pa-sm rounded-borders bg-grey-1"
                >
                  <div class="row items-center justify-between q-col-gutter-sm">
                    <div class="col" style="margin-top: -15px">
                      <div class="text-weight-medium">{{ item.nome }}</div>
                      <div class="text-caption text-grey-7">
                        {{ formatarMoeda(item.preco) }} por unidade
                      </div>
                    </div>

                    <div class="col-auto">
                      <q-btn
                        flat
                        round
                        dense
                        icon="remove"
                        @click="diminuirQuantidade(item.produto_id)"
                      />
                    </div>

                    <div class="col-auto">
                      <div class="text-subtitle2">{{ item.quantidade }}</div>
                    </div>

                    <div class="col-auto">
                      <q-btn
                        flat
                        round
                        dense
                        icon="add"
                        @click="aumentarQuantidade(item.produto_id)"
                      />
                    </div>

                    <div class="col-auto">
                      <q-btn
                        flat
                        round
                        dense
                        color="negative"
                        icon="delete"
                        @click="removerItem(item.produto_id)"
                      />
                    </div>
                  </div>

                  <div class="row justify-between q-mt-sm">
                    <span class="text-grey-7">Subtotal</span>
                    <strong>{{ formatarMoeda(item.subtotal) }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="row justify-between q-mb-sm">
              <span class="text-grey-7">Itens</span>
              <strong>{{ totalItens }}</strong>
            </div>

            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="descontoValor"
                  type="number"
                  min="0"
                  :max="descontoTipo === 'percentual' ? 100 : undefined"
                  outlined
                  label="Desconto"
                  dense
                >
                  <template #prepend>
                    <q-btn-toggle
                      v-model="descontoTipo"
                      no-caps
                      unelevated
                      dense
                      toggle-color="primary"
                      color="white"
                      text-color="primary"
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
                  :max="acrescimoTipo === 'percentual' ? 100 : undefined"
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
                      toggle-color="primary"
                      color="white"
                      text-color="primary"
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
              <strong>{{ formatarMoeda(subtotalVenda) }}</strong>
            </div>

            <div class="row justify-between q-mb-sm">
              <span class="text-grey-7">
                Desconto
                <small v-if="descontoTipo === 'percentual'"> ({{ descontoValor }}%) </small>
              </span>
              <strong>{{ formatarMoeda(descontoCalculado) }}</strong>
            </div>

            <div class="row justify-between q-mb-sm">
              <span class="text-grey-7">
                Acréscimo
                <small v-if="acrescimoTipo === 'percentual'"> ({{ acrescimoValor }}%) </small>
              </span>
              <strong>{{ formatarMoeda(acrescimoCalculado) }}</strong>
            </div>

            <div class="row justify-between q-mb-md">
              <span class="text-grey-7">Total</span>
              <strong class="text-primary text-h5">
                {{ formatarMoeda(totalVenda) }}
              </strong>
            </div>

            <q-separator class="q-my-md" />

            <q-btn
              color="primary"
              icon="point_of_sale"
              label="Faturar"
              class="full-width"
              :disable="carrinho.length === 0"
              @click="modalFaturar = true"
            />

            <!-- FORMA DE PAGAMENTO -->
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
                      {{ formatarMoeda(totalVenda) }}
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
                    :loading="finalizando"
                    @click="finalizarVenda"
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
import { Notify, QInput } from 'quasar';
import { api } from 'boot/axios';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

type TipoAjuste = 'valor' | 'percentual';

interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cidade?: string;
  status?: string;
}

interface Produto {
  id: number;
  nome: string;
  categoria?: string;
  preco: number;
  estoque: number;
  status?: string;
}

interface OptionItem {
  label: string;
  value: number;
}

interface ItemCarrinho {
  produto_id: number;
  nome: string;
  preco: number;
  quantidade: number;
  subtotal: number;
  estoqueDisponivel: number;
}

const busca = ref('');
const finalizando = ref(false);
const inputBusca = ref();

const clientes = ref<Cliente[]>([]);
const produtos = ref<Produto[]>([]);

const clientesOptions = ref<OptionItem[]>([]);
const clienteSelecionado = ref<number | null>(null);

const carrinho = ref<ItemCarrinho[]>([]);

const descontoTipo = ref<TipoAjuste>('valor');
const descontoValor = ref<number>(0);

const acrescimoTipo = ref<TipoAjuste>('valor');
const acrescimoValor = ref<number>(0);

const CLIENTE_PADRAO_NOME = 'Consumidor Final';

const clientePadrao = computed(
  () => clientes.value.find((cliente) => cliente.nome === CLIENTE_PADRAO_NOME) || null,
);

const clienteFinalId = computed(() => clienteSelecionado.value || clientePadrao.value?.id || null);

const beep = new Audio('/src/assets/beep-02.mp3');
const beepErro = new Audio('/src/assets/error-sounds.mp3');

type FormaPagamento = 'DINHEIRO' | 'CARTAO' | 'PIX';
type FormaPagamentoResumo = FormaPagamento | 'COMBINADO';

const pagamentos = ref([
  { forma: 'DINHEIRO', label: 'Dinheiro', valor: null },
  { forma: 'CARTAO', label: 'Cartão', valor: null },
  { forma: 'PIX', label: 'PIX', valor: null },
]);

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
  return round2(Math.min(totalInformado.value, totalVenda.value));
});

const faltaPagar = computed(() => {
  return round2(Math.max(0, totalVenda.value - totalInformado.value));
});

const troco = computed(() => {
  return round2(Math.max(0, totalInformado.value - totalVenda.value));
});

function tocarBeep() {
  beep.currentTime = 0;
  beep.play();
}

const nomeClienteFinal = computed(() => {
  if (clienteSelecionado.value) {
    const cliente = clientes.value.find((c) => c.id === clienteSelecionado.value);
    return cliente?.nome || CLIENTE_PADRAO_NOME;
  }

  return clientePadrao.value?.nome || CLIENTE_PADRAO_NOME;
});

const produtosFiltrados = computed(() => {
  const termo = busca.value.toLowerCase().trim();

  return produtos.value.filter((produto) => {
    const ativo = produto.status !== 'INATIVO';
    const combinaBusca = produto.nome.toLowerCase().includes(termo);
    return ativo && combinaBusca;
  });
});

const totalItens = computed(() => carrinho.value.reduce((acc, item) => acc + item.quantidade, 0));

const subtotalVenda = computed(() => carrinho.value.reduce((acc, item) => acc + item.subtotal, 0));

const descontoCalculado = computed(() => {
  if (descontoTipo.value === 'percentual') {
    return subtotalVenda.value * (Number(descontoValor.value || 0) / 100);
  }

  return Number(descontoValor.value || 0);
});

const acrescimoCalculado = computed(() => {
  if (acrescimoTipo.value === 'percentual') {
    return subtotalVenda.value * (Number(acrescimoValor.value || 0) / 100);
  }

  return Number(acrescimoValor.value || 0);
});

const totalVenda = computed(() =>
  Math.max(0, subtotalVenda.value - descontoCalculado.value + acrescimoCalculado.value),
);

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
}

function filtrarClientes(val: string, update: (callback: () => void) => void) {
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

async function buscarOuAdicionarProduto() {
  const termo = busca.value.trim();

  if (!termo) return;

  const ehNumero = /^\d+$/.test(termo);

  if (!ehNumero) return;

  if (termo.length >= 6) {
    await buscarPorCodigo(termo);
    return;
  }

  await buscarPorIdPro(Number(termo));
}

async function buscarPorIdPro(id: number) {
  try {
    const { data } = await axios.get(`${API_URL}/produtos/${id}`);

    adicionarProduto(data);

    tocarBeep();

    busca.value = '';
    focarBusca();
  } catch {
    beepErro.play();
    Notify.create({
      type: 'negative',
      message: 'Produto não encontrado',
    });

    busca.value = '';
    focarBusca();
  }
}

function focarBusca() {
  inputBusca.value?.focus();
}

async function buscarPorCodigo(codigo: string) {
  try {
    const { data } = await api.get(`/produtos/codigo/${codigo}`);

    adicionarProduto(data);

    tocarBeep();

    busca.value = '';
    focarBusca();
  } catch {
    beepErro.play();
    Notify.create({
      type: 'negative',
      message: 'Produto não encontrado',
    });

    busca.value = '';
    focarBusca();
  }
}

function adicionarProduto(produto: Produto) {
  if (produto.estoque <= 0) {
    beepErro.play();
    Notify.create({
      type: 'warning',
      message: `Produto sem estoque: ${produto.nome}`,
    });
    return;
  }

  const itemExistente = carrinho.value.find((item) => item.produto_id === produto.id);

  if (itemExistente) {
    if (itemExistente.quantidade >= itemExistente.estoqueDisponivel) {
      Notify.create({
        type: 'negative',
        message: `Estoque máximo atingido para ${produto.nome}`,
      });
      return;
    }

    tocarBeep();
    itemExistente.quantidade += 1;
    itemExistente.subtotal = itemExistente.quantidade * itemExistente.preco;
  } else {
    carrinho.value.push({
      produto_id: produto.id,
      nome: produto.nome,
      preco: Number(produto.preco),
      quantidade: 1,
      subtotal: Number(produto.preco),
      estoqueDisponivel: Number(produto.estoque),
    });
    tocarBeep();
  }
}

function aumentarQuantidade(produtoId: number) {
  const item = carrinho.value.find((i) => i.produto_id === produtoId);
  if (!item) return;

  if (item.quantidade >= item.estoqueDisponivel) {
    Notify.create({
      type: 'warning',
      message: `Quantidade máxima em estoque para ${item.nome}`,
    });
    return;
  }

  item.quantidade += 1;
  item.subtotal = item.quantidade * item.preco;
}

function diminuirQuantidade(produtoId: number) {
  const item = carrinho.value.find((i) => i.produto_id === produtoId);
  if (!item) return;

  if (item.quantidade <= 1) {
    removerItem(produtoId);
    return;
  }

  item.quantidade -= 1;
  item.subtotal = item.quantidade * item.preco;
}

function removerItem(produtoId: number) {
  carrinho.value = carrinho.value.filter((item) => item.produto_id !== produtoId);
}

async function finalizarVenda() {
  if (carrinho.value.length === 0) {
    Notify.create({
      type: 'warning',
      message: 'Adicione pelo menos um produto',
    });
    return;
  }

  if (!clienteFinalId.value) {
    Notify.create({
      type: 'negative',
      message: 'Cliente padrão não encontrado',
    });
    return;
  }

  const pagamentosPayload = pagamentos.value
    .map((item) => ({
      forma: item.forma,
      valor: round2(Number(item.valor || 0)),
    }))
    .filter((item) => item.valor > 0);

  if (pagamentosPayload.length === 0) {
    Notify.create({
      type: 'warning',
      message: 'Informe pelo menos uma forma de pagamento',
    });
    return;
  }

  let restante = round2(totalVenda.value);

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

  if (faltaPagar.value > 0) {
    Notify.create({
      type: 'warning',
      message: 'O total pago é menor que o total da venda',
    });
    return;
  }

  finalizando.value = true;

  try {
    let formaPagamentoResumo: FormaPagamentoResumo = 'COMBINADO';

    await api.post('/pedidos', {
      cliente_id: clienteFinalId.value,
      origem: 'PDV',
      status: 'FINALIZADO',

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

      itens: carrinho.value.map((item) => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
      })),
    });

    Notify.create({
      type: 'positive',
      message: 'Venda realizada com sucesso',
    });
    limparPagamentos();
    carrinho.value = [];
    clienteSelecionado.value = null;
    busca.value = '';

    descontoTipo.value = 'valor';
    descontoValor.value = 0;
    acrescimoTipo.value = 'valor';
    acrescimoValor.value = 0;

    modalFaturar.value = false;

    await carregarProdutos();
    focarBusca();
  } catch (error: unknown) {
    let mensagem = 'Erro ao finalizar venda';

    if (axios.isAxiosError(error)) {
      mensagem = error.response?.data?.erro || mensagem;
    }

    Notify.create({
      type: 'negative',
      message: mensagem,
    });
  } finally {
    finalizando.value = false;
  }
}

function limparPagamentos() {
  pagamentos.value = [
    { forma: 'DINHEIRO', label: 'Dinheiro', valor: null },
    { forma: 'CARTAO', label: 'Cartão', valor: null },
    { forma: 'PIX', label: 'PIX', valor: null },
  ];
}

watch([descontoTipo, descontoValor], ([tipo, valor]) => {
  if (tipo === 'percentual' && Number(valor) > 100) {
    descontoValor.value = 100;
  }
});

watch([acrescimoTipo, acrescimoValor], ([tipo, valor]) => {
  if (tipo === 'percentual' && Number(valor) > 100) {
    acrescimoValor.value = 100;
  }
});

onMounted(async () => {
  await Promise.all([carregarClientes(), carregarProdutos()]);
  focarBusca();
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
