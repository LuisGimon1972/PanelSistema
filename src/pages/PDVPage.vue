<template>
  <q-page class="bg-grey-2 q-pa-md">
    <div class="row q-col-gutter-md items-start">
      <!-- ESQUERDA -->
      <div class="col-12 col-md-7">
        <q-card flat bordered class="q-mb-md border">
          <q-card-section>
            <div class="text-h5">Ponto de Venda</div>
            <div class="text-caption text-grey-7">
              Venda rápida com seleção de cliente e controle automático de estoque
            </div>
          </q-card-section>
        </q-card>

        <!-- CLIENTE -->
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

        <!-- BUSCA DE PRODUTOS -->
        <q-card flat bordered class="border">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-md">Produtos</div>

            <q-input v-model="busca" outlined dense label="Buscar produto" class="q-mb-md">
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

      <!-- DIREITA -->
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

            <div v-if="carrinho.length === 0" class="text-grey-7 text-center q-py-lg">
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

            <div class="row justify-between q-mb-md">
              <span class="text-grey-7">Total</span>
              <strong class="text-primary text-h5">
                {{ formatarMoeda(totalVenda) }}
              </strong>
            </div>

            <q-btn
              color="positive"
              icon="point_of_sale"
              label="Finalizar Venda"
              class="full-width"
              :disable="carrinho.length === 0"
              :loading="finalizando"
              @click="finalizarVenda"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Notify } from 'quasar';
import { api } from 'boot/axios';
import axios from 'axios';

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

const clientes = ref<Cliente[]>([]);
const produtos = ref<Produto[]>([]);

const clientesOptions = ref<OptionItem[]>([]);
const clienteSelecionado = ref<number | null>(null);

const carrinho = ref<ItemCarrinho[]>([]);

const CLIENTE_PADRAO_NOME = 'Consumidor Final';

const clientePadrao = computed(
  () => clientes.value.find((cliente) => cliente.nome === CLIENTE_PADRAO_NOME) || null,
);

const clienteFinalId = computed(() => clienteSelecionado.value || clientePadrao.value?.id || null);

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

const totalVenda = computed(() => carrinho.value.reduce((acc, item) => acc + item.subtotal, 0));

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

function adicionarProduto(produto: Produto) {
  if (produto.estoque <= 0) {
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

  finalizando.value = true;

  try {
    await api.post('/pedidos', {
      cliente_id: clienteFinalId.value,
      origem: 'PDV',
      status: 'FINALIZADO',
      itens: carrinho.value.map((item) => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
      })),
    });

    Notify.create({
      type: 'positive',
      message: 'Venda realizada com sucesso',
    });

    carrinho.value = [];
    clienteSelecionado.value = null;
    busca.value = '';

    await carregarProdutos();
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

onMounted(async () => {
  await Promise.all([carregarClientes(), carregarProdutos()]);
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
  height: 185px;
  overflow-y: scroll;
  border: 1px solid #ddd;
}

.scroll-carrinho {
  max-height: 270px; /* ~5 itens */
  overflow-y: auto;
}
</style>
