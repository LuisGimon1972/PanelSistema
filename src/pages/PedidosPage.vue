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

        <q-card flat bordered class="q-mb-md border separa">
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

        <q-card flat bordered class="q-mb-md border separa">
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

        <q-card flat bordered class="q-mb-md border separa">
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

        <q-card flat bordered class="border separa">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-md">Itens do Pedido</div>

            <q-table
              class="grade-azul border"
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
          <q-checkbox
            v-model="imprimirComprovanteAutomaticamente"
            dense
            label="Imprimir comprovante após faturar"
            class="q-mb-sm"
          />
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

const API_URL = 'http://localhost:3000';

type TipoAjuste = 'valor' | 'percentual';
type FormaPagamento = 'DINHEIRO' | 'CARTAO' | 'PIX';
type FormaPagamentoResumo = FormaPagamento | 'COMBINADO';

type StatusPedido = 'ABERTO' | 'FINALIZADO' | 'CANCELADO';

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
  preco: number | string;
  estoque: number | string;
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

interface PagamentoPedido {
  forma: FormaPagamento;
  valor: number;
}

interface PagamentoLinha {
  forma: FormaPagamento;
  label: string;
  valor: number | string | null;
}

interface PedidoDetalhe {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  status: StatusPedido;
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
}

interface DadosComprovantePedido {
  pedidoId?: number | string | null;
  dataPedido: Date | string;
  clienteNome: string;
  itens: ItemPedido[];
  pagamentos: Array<{ forma: FormaPagamento; valor: number }>;
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  totalPago: number;
  troco: number;
}

const pedidoId = computed(() => (route.params.id ? Number(route.params.id) : null));

const tituloPagina = computed(() => (pedidoId.value ? 'Editar Pedido' : 'Novo Pedido'));

const statusOptions = [
  { label: 'ABERTO', value: 'ABERTO' },
  { label: 'FINALIZADO', value: 'FINALIZADO' },
  { label: 'CANCELADO', value: 'CANCELADO' },
];

const statusPedido = ref<StatusPedido>('ABERTO');
const origemPedido = ref<'PEDIDO' | 'PDV'>('PEDIDO');

const salvando = ref(false);
const finalizando = ref(false);

const clientes = ref<Cliente[]>([]);
const produtos = ref<Produto[]>([]);

const clientesOptions = ref<OptionItem[]>([]);
const produtosOptions = ref<OptionItem[]>([]);

const clienteSelecionado = ref<number | null>(null);
const produtoSelecionado = ref<number | null>(null);
const quantidade = ref<number>(1);

const itens = ref<ItemPedido[]>([]);

const descontoTipo = ref<TipoAjuste>('valor');
const descontoValor = ref<number>(0);

const acrescimoTipo = ref<TipoAjuste>('valor');
const acrescimoValor = ref<number>(0);

const modalFaturar = ref(false);
const imprimirComprovanteAutomaticamente = ref(true);

const pagamentoRefs = ref<Array<InstanceType<typeof QInput> | null>>([]);

const formaSelecionada = ref<FormaPagamento>('DINHEIRO');
const valorDigitado = ref<number>(0);

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

function normalizarTexto(valor?: string): string {
  return (valor || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function textoMonetarioParaNumero(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  let texto = String(value).trim();

  if (!texto) return 0;

  texto = texto.replace(/[R$\s]/g, '');

  const temVirgula = texto.includes(',');
  const temPonto = texto.includes('.');

  if (temVirgula && temPonto) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  } else if (temVirgula) {

    texto = texto.replace(',', '.');
  } else if (temPonto && /^\d{1,3}(\.\d{3})+$/.test(texto)) {

    texto = texto.replace(/\./g, '');
  }

  const numero = Number(texto);

  return Number.isFinite(numero) ? numero : null;
}

function valorParaCentavos(value: unknown): number {
  const numero = textoMonetarioParaNumero(value);

  if (numero === null) {
    return 0;
  }

  return Math.round(numero * 100);
}

function valorPagamentoInvalido(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  const numero = textoMonetarioParaNumero(value);

  return numero === null || numero < 0;
}

function valorPositivoEmCentavos(value: unknown): number {
  return Math.max(0, valorParaCentavos(value));
}

function centavosParaValor(centavos: number): number {
  return Number((centavos / 100).toFixed(2));
}

function calcularSubtotalItem(preco: unknown, qtd: number): number {
  return centavosParaValor(valorPositivoEmCentavos(preco) * Number(qtd || 0));
}

function calcularAjusteCentavos(baseCentavos: number, tipo: TipoAjuste, valor: unknown): number {
  if (tipo === 'percentual') {
    const percentual = Math.max(0, Number(valor || 0));
    return Math.round(baseCentavos * (percentual / 100));
  }

  return valorPositivoEmCentavos(valor);
}

function isFormaSemTroco(forma?: string): boolean {
  return ['PIX', 'CARTAO'].includes(normalizarTexto(forma));
}

const subtotalPedidoCentavos = computed(() => {
  return itens.value.reduce((acc, item) => {
    return acc + valorPositivoEmCentavos(item.preco) * Number(item.quantidade || 0);
  }, 0);
});

const descontoCalculadoCentavos = computed(() => {
  const desconto = calcularAjusteCentavos(
    subtotalPedidoCentavos.value,
    descontoTipo.value,
    descontoValor.value,
  );

  return Math.min(desconto, subtotalPedidoCentavos.value);
});

const acrescimoCalculadoCentavos = computed(() => {
  return calcularAjusteCentavos(
    subtotalPedidoCentavos.value,
    acrescimoTipo.value,
    acrescimoValor.value,
  );
});

const totalPedidoCentavos = computed(() => {
  return Math.max(
    0,
    subtotalPedidoCentavos.value -
      descontoCalculadoCentavos.value +
      acrescimoCalculadoCentavos.value,
  );
});

const totalInformadoCentavos = computed(() => {
  return pagamentos.value.reduce((acc, item) => {
    return acc + valorPositivoEmCentavos(item.valor);
  }, 0);
});

const totalEmDinheiroCentavos = computed(() => {
  return pagamentos.value
    .filter((item) => item.forma === 'DINHEIRO')
    .reduce((acc, item) => acc + valorPositivoEmCentavos(item.valor), 0);
});

const totalSemTrocoCentavos = computed(() => {
  return pagamentos.value
    .filter((item) => isFormaSemTroco(item.forma))
    .reduce((acc, item) => acc + valorPositivoEmCentavos(item.valor), 0);
});

const totalSemTrocoAplicadoCentavos = computed(() => {
  return Math.min(totalSemTrocoCentavos.value, totalPedidoCentavos.value);
});

const restanteParaDinheiroCentavos = computed(() => {
  return Math.max(0, totalPedidoCentavos.value - totalSemTrocoAplicadoCentavos.value);
});

const totalDinheiroAplicadoCentavos = computed(() => {
  return Math.min(totalEmDinheiroCentavos.value, restanteParaDinheiroCentavos.value);
});

const totalPagoConsideradoCentavos = computed(() => {
  return totalSemTrocoAplicadoCentavos.value + totalDinheiroAplicadoCentavos.value;
});

const faltaPagarCentavos = computed(() => {
  return Math.max(0, totalPedidoCentavos.value - totalPagoConsideradoCentavos.value);
});

const trocoCentavos = computed(() => {
  return Math.max(0, totalEmDinheiroCentavos.value - restanteParaDinheiroCentavos.value);
});

const subtotalPedido = computed(() => {
  return centavosParaValor(subtotalPedidoCentavos.value);
});

const descontoCalculado = computed(() => {
  return centavosParaValor(descontoCalculadoCentavos.value);
});

const acrescimoCalculado = computed(() => {
  return centavosParaValor(acrescimoCalculadoCentavos.value);
});

const totalPedido = computed(() => {
  return centavosParaValor(totalPedidoCentavos.value);
});

const totalInformado = computed(() => {
  return centavosParaValor(totalInformadoCentavos.value);
});

const totalEmDinheiro = computed(() => {
  return centavosParaValor(totalEmDinheiroCentavos.value);
});

const totalPago = computed(() => {
  return centavosParaValor(totalPagoConsideradoCentavos.value);
});

const faltaPagar = computed(() => {
  return centavosParaValor(faltaPagarCentavos.value);
});

const troco = computed(() => {
  return centavosParaValor(trocoCentavos.value);
});

function obterPagamentosValidos() {
  return pagamentos.value
    .map((item) => ({
      forma: item.forma,
      valorCentavos: valorPositivoEmCentavos(item.valor),
    }))
    .filter((item) => item.valorCentavos > 0);
}

function obterFormaPagamentoResumo(
  pagamentosValidos: Array<{ forma: FormaPagamento; valor: number }>,
): FormaPagamentoResumo {
  const formasValidas = Array.from(
    new Set(
      pagamentosValidos
        .filter((item) => valorPositivoEmCentavos(item.valor) > 0)
        .map((item) => item.forma),
    ),
  );

  const [formaUnica] = formasValidas;

  if (formasValidas.length === 1 && formaUnica) {
    return formaUnica;
  }

  return 'COMBINADO';
}

function selecionarForma(tipo: FormaPagamento) {
  formaSelecionada.value = tipo;
  valorDigitado.value = 0;
}

const columns = [
  { name: 'nome', label: 'Produto', field: 'nome', align: 'left' as const },
  { name: 'preco', label: 'Preço', field: 'preco', align: 'left' as const },
  { name: 'quantidade', label: 'Qtd.', field: 'quantidade', align: 'left' as const },
  { name: 'subtotal', label: 'Subtotal', field: 'subtotal', align: 'left' as const },
  { name: 'acoes', label: 'Ações', field: 'acoes', align: 'center' as const },
];

const produtoAtual = computed(() => {
  return produtos.value.find((p) => p.id === produtoSelecionado.value) || null;
});

const clienteAtual = computed(() => {
  return clientes.value.find((c) => c.id === clienteSelecionado.value) || null;
});

const nomeClienteSelecionado = computed(() => clienteAtual.value?.nome || '');

const totalItens = computed(() => {
  return itens.value.reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
});

const podeSalvar = computed(() => {
  return !!clienteSelecionado.value && itens.value.length > 0;
});

function formatarMoeda(valor: unknown): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavosParaValor(valorParaCentavos(valor)));
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatarDataHora(data: Date | string): string {
  const dataFormatada = data instanceof Date ? data : new Date(data);

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(dataFormatada);
}

function gerarHtmlComprovantePedido(dados: DadosComprovantePedido): string {
  const itensHtml = dados.itens
    .map(
      (item) => `
        <div class="linha-item">
          <div>${escapeHtml(item.nome)}</div>
          <div>${escapeHtml(String(item.quantidade))} x ${escapeHtml(formatarMoeda(item.preco))}</div>
          <div class="valor">${escapeHtml(formatarMoeda(item.subtotal))}</div>
        </div>
      `,
    )
    .join('');

  const pagamentosHtml = dados.pagamentos
    .map(
      (pagamento) => `
        <div class="linha">
          <span>${escapeHtml(getLabelFormaPagamento(pagamento.forma))}</span>
          <strong>${escapeHtml(formatarMoeda(pagamento.valor))}</strong>
        </div>
      `,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Comprovante do Pedido</title>
    <style>
      @page {
        size: 80mm auto;
        margin: 4mm;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        color: #000;
        font-family: monospace;
      }

      .comprovante {
        width: 72mm;
        margin: 0 auto;
        padding: 4mm 0;
        font-size: 12px;
      }

      .centralizado {
        text-align: center;
      }

      .titulo {
        margin-bottom: 2mm;
        font-size: 14px;
        font-weight: bold;
      }

      .separador {
        margin: 3mm 0;
        border-top: 1px dashed #000;
      }

      .linha {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 1mm;
      }

      .linha-item {
        margin-bottom: 2.5mm;
      }

      .valor {
        text-align: right;
        font-weight: bold;
      }

      .total {
        font-size: 14px;
        font-weight: bold;
      }
    </style>
  </head>

  <body>
    <div class="comprovante">
      <div class="centralizado">
        <div class="titulo">COMPROVANTE DE PEDIDO</div>
        <div>${dados.pedidoId ? `Pedido #${escapeHtml(dados.pedidoId)}` : 'Pedido faturado'}</div>
        <div>${escapeHtml(formatarDataHora(dados.dataPedido))}</div>
      </div>

      <div class="separador"></div>

      <div><strong>Cliente:</strong> ${escapeHtml(dados.clienteNome || 'Não informado')}</div>

      <div class="separador"></div>

      <div><strong>Itens</strong></div>
      ${itensHtml || '<div>Nenhum item</div>'}

      <div class="separador"></div>

      <div class="linha">
        <span>Subtotal</span>
        <strong>${escapeHtml(formatarMoeda(dados.subtotal))}</strong>
      </div>

      <div class="linha">
        <span>Desconto</span>
        <strong>${escapeHtml(formatarMoeda(dados.desconto))}</strong>
      </div>

      <div class="linha">
        <span>Acréscimo</span>
        <strong>${escapeHtml(formatarMoeda(dados.acrescimo))}</strong>
      </div>

      <div class="linha total">
        <span>Total</span>
        <strong>${escapeHtml(formatarMoeda(dados.total))}</strong>
      </div>

      <div class="separador"></div>

      <div><strong>Pagamentos</strong></div>
      ${pagamentosHtml}

      <div class="linha">
        <span>Total pago</span>
        <strong>${escapeHtml(formatarMoeda(dados.totalPago))}</strong>
      </div>

      <div class="linha">
        <span>Troco</span>
        <strong>${escapeHtml(formatarMoeda(dados.troco))}</strong>
      </div>

      <div class="separador"></div>

      <div class="centralizado">Obrigado pela preferência</div>
      <div style="margin-top: 10px; 
            font-size: 9px; 
            text-align: center;">
            Impressão: VendaFlow Gestão Comercial</div>
    </div>
  </body>
</html>`;
}

function imprimirComprovantePedido(dados: DadosComprovantePedido): Promise<void> {
  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');

      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';

      let finalizado = false;

      const finalizar = () => {
        if (finalizado) return;

        finalizado = true;
        iframe.remove();
        resolve();
      };

      const timeoutId = window.setTimeout(finalizar, 3000);

      iframe.onload = () => {
        window.clearTimeout(timeoutId);

        window.setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          window.setTimeout(finalizar, 1000);
        }, 250);
      };

      iframe.srcdoc = gerarHtmlComprovantePedido(dados);
      document.body.appendChild(iframe);
    } catch {
      Notify.create({
        type: 'warning',
        message: 'Pedido faturado, mas não foi possível abrir a impressão do comprovante',
      });

      resolve();
    }
  });
}

async function carregarClientes() {
  const { data } = await api.get<Cliente[]>('/clientes', {
    params: {
      status: 'ATIVO',
    },
  });

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
    label: `${produto.nome} (${Number(produto.estoque || 0)} em estoque)`,
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
        label: `${produto.nome} (${Number(produto.estoque || 0)} em estoque)`,
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

  const estoqueProduto = Number(produto.estoque || 0);

  if (quantidade.value > estoqueProduto) {
    Notify.create({
      type: 'negative',
      message: `Estoque insuficiente. Disponível: ${estoqueProduto}`,
    });
    return;
  }

  const precoProduto = centavosParaValor(valorPositivoEmCentavos(produto.preco));

  const itemExistente = itens.value.find((item) => item.produto_id === produto.id);

  if (itemExistente) {
    const novaQuantidade = itemExistente.quantidade + quantidade.value;

    if (novaQuantidade > estoqueProduto) {
      Notify.create({
        type: 'negative',
        message: `Quantidade total excede o estoque disponível (${estoqueProduto})`,
      });
      return;
    }

    itemExistente.quantidade = novaQuantidade;
    itemExistente.subtotal = calcularSubtotalItem(itemExistente.preco, novaQuantidade);
  } else {
    itens.value.push({
      produto_id: produto.id,
      nome: produto.nome,
      preco: precoProduto,
      quantidade: quantidade.value,
      subtotal: calcularSubtotalItem(precoProduto, quantidade.value),
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

      desconto: centavosParaValor(descontoCalculadoCentavos.value),
      acrescimo: centavosParaValor(acrescimoCalculadoCentavos.value),

      desconto_tipo: descontoTipo.value,
      desconto_valor:
        descontoTipo.value === 'valor'
          ? centavosParaValor(valorPositivoEmCentavos(descontoValor.value))
          : Number(descontoValor.value || 0),

      acrescimo_tipo: acrescimoTipo.value,
      acrescimo_valor:
        acrescimoTipo.value === 'valor'
          ? centavosParaValor(valorPositivoEmCentavos(acrescimoValor.value))
          : Number(acrescimoValor.value || 0),

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

function validarPagamentosFaturamento(): boolean {
  const pagamentosValidos = obterPagamentosValidos();

  if (pagamentosValidos.length === 0) {
    Notify.create({
      type: 'warning',
      message: 'Informe pelo menos uma forma de pagamento',
    });
    return false;
  }

  let restanteCentavos = totalPedidoCentavos.value;

  for (const item of pagamentosValidos) {
    if (isFormaSemTroco(item.forma) && item.valorCentavos > restanteCentavos) {
      Notify.create({
        type: 'warning',
        message: `O valor do ${getLabelFormaPagamento(item.forma)} não pode ser maior que o valor faltante de R$ ${centavosParaValor(
          restanteCentavos,
        ).toFixed(2)}.`,
      });
      return false;
    }

    const valorAplicadoCentavos = Math.min(item.valorCentavos, restanteCentavos);
    restanteCentavos = Math.max(0, restanteCentavos - valorAplicadoCentavos);
  }

  if (restanteCentavos > 0) {
    Notify.create({
      type: 'warning',
      message: `Falta pagar R$ ${centavosParaValor(restanteCentavos).toFixed(2)}.`,
    });
    return false;
  }

  return true;
}

async function confirmarFaturamento() {
  const possuiValorInvalido = pagamentos.value.some((item) => valorPagamentoInvalido(item.valor));

  if (possuiValorInvalido) {
    Notify.create({
      type: 'warning',
      message: 'Existe pagamento com valor inválido',
    });
    return;
  }

  if (!validarPagamentosFaturamento()) {
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

  const pagamentosPayloadCentavos = obterPagamentosValidos();

  if (pagamentosPayloadCentavos.length === 0) {
    Notify.create({
      type: 'warning',
      message: 'Informe pelo menos uma forma de pagamento',
    });
    return;
  }

  if (!validarPagamentosFaturamento()) {
    return;
  }

  const trocoCalculadoCentavos = trocoCentavos.value;

  const pagamentosComprovante: PagamentoPedido[] = pagamentosPayloadCentavos.map((item) => ({
    forma: item.forma,
    valor: centavosParaValor(item.valorCentavos),
  }));

  const pagamentosFinanceiroCentavos = pagamentosPayloadCentavos
    .map((item) => {
      if (item.forma === 'DINHEIRO') {
        return {
          ...item,
          valorCentavos: Math.max(0, item.valorCentavos - trocoCalculadoCentavos),
        };
      }

      return item;
    })
    .filter((item) => item.valorCentavos > 0);

  const pagamentosPayload: PagamentoPedido[] = pagamentosFinanceiroCentavos.map((item) => ({
    forma: item.forma,
    valor: centavosParaValor(item.valorCentavos),
  }));

  const itensComprovante = itens.value.map((item) => ({
    ...item,
    preco: centavosParaValor(valorPositivoEmCentavos(item.preco)),
    subtotal: calcularSubtotalItem(item.preco, item.quantidade),
  }));

  const clienteNomeComprovante = nomeClienteSelecionado.value || 'Não informado';

  const subtotalComprovante = centavosParaValor(subtotalPedidoCentavos.value);
  const descontoComprovante = centavosParaValor(descontoCalculadoCentavos.value);
  const acrescimoComprovante = centavosParaValor(acrescimoCalculadoCentavos.value);
  const totalComprovante = centavosParaValor(totalPedidoCentavos.value);
  const totalPagoComprovante = centavosParaValor(totalPagoConsideradoCentavos.value);
  const trocoComprovante = centavosParaValor(trocoCalculadoCentavos);
  const dataPedidoComprovante = new Date();

  salvando.value = true;
  finalizando.value = true;

  try {
    const formaPagamentoResumo = obterFormaPagamentoResumo(pagamentosComprovante);

    const payload = {
      cliente_id: Number(clienteSelecionado.value),
      status: 'FINALIZADO' as StatusPedido,
      origem: origemPedido.value,

      desconto: descontoComprovante,
      acrescimo: acrescimoComprovante,

      desconto_tipo: descontoTipo.value,
      desconto_valor:
        descontoTipo.value === 'valor'
          ? centavosParaValor(valorPositivoEmCentavos(descontoValor.value))
          : Number(descontoValor.value || 0),

      acrescimo_tipo: acrescimoTipo.value,
      acrescimo_valor:
        acrescimoTipo.value === 'valor'
          ? centavosParaValor(valorPositivoEmCentavos(acrescimoValor.value))
          : Number(acrescimoValor.value || 0),

      forma_pagamento: formaPagamentoResumo,


      valor_recebido: centavosParaValor(totalInformadoCentavos.value),


      troco: trocoComprovante,


      pagamentos: pagamentosPayload,

      itens: itens.value.map((item) => ({
        produto_id: Number(item.produto_id),
        quantidade: Number(item.quantidade),
      })),
    };

    let pedidoIdComprovante: number | string | null = pedidoId.value;

    if (pedidoId.value) {
      const { data } = await api.put(`/pedidos/${pedidoId.value}`, payload);

      pedidoIdComprovante =
        pedidoId.value || data?.id || data?.pedido?.id || data?.pedido_id || null;

      Notify.create({ type: 'positive', message: 'Pedido faturado com sucesso' });
    } else {
      const { data } = await api.post('/pedidos', payload);

      pedidoIdComprovante = data?.id || data?.pedido?.id || data?.pedido_id || null;

      Notify.create({ type: 'positive', message: 'Pedido faturado com sucesso' });
    }

    modalFaturar.value = false;
    await nextTick();

    if (imprimirComprovanteAutomaticamente.value) {
      await imprimirComprovantePedido({
        pedidoId: pedidoIdComprovante,
        dataPedido: dataPedidoComprovante,
        clienteNome: clienteNomeComprovante,
        itens: itensComprovante,
        pagamentos: pagamentosComprovante,
        subtotal: subtotalComprovante,
        desconto: descontoComprovante,
        acrescimo: acrescimoComprovante,
        total: totalComprovante,
        totalPago: totalPagoComprovante,
        troco: trocoComprovante,
      });
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
    finalizando.value = false;
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
            valor: centavosParaValor(valorPositivoEmCentavos(item.valor)),
          }))
        : criarPagamentosIniciais();

    itens.value = data.itens.map((item) => {
      const preco = centavosParaValor(valorPositivoEmCentavos(item.preco_unitario));
      const qtd = Number(item.quantidade || 0);

      return {
        produto_id: item.produto_id,
        nome: item.nome_produto,
        preco,
        quantidade: qtd,
        subtotal: calcularSubtotalItem(preco, qtd),
      };
    });
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
  const numero = Number(valor || 0);

  if (numero < 0) {
    descontoValor.value = 0;
    return;
  }

  if (tipo === 'percentual' && numero > 100) {
    descontoValor.value = 100;
  }
});

watch([acrescimoTipo, acrescimoValor], ([tipo, valor]) => {
  const numero = Number(valor || 0);

  if (numero < 0) {
    acrescimoValor.value = 0;
    return;
  }

  if (tipo === 'percentual' && numero > 100) {
    acrescimoValor.value = 100;
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

.separa {
  margin-top: -10px;
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
