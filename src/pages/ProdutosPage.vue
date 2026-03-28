<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Produtos</div>

      <q-btn label="Novo Produto" color="primary" @click="abrirDialog" />
    </div>

    <q-table :rows="produtos" :columns="columns" row-key="id" flat bordered>
      <template v-slot:body-cell-acoes="props">
        <q-td>
          <q-btn icon="edit" size="sm" flat color="primary" @click="editarProduto(props.row)" />
          <q-btn icon="delete" size="sm" flat color="red" @click="excluirProduto(props.row.id)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{ editando ? 'Editar Produto' : 'Novo Produto' }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="form.nome" label="Nome" />
          <q-input v-model="form.categoria" label="Categoria" />
          <q-input v-model.number="form.preco" label="Preço" type="number" />
          <q-input v-model.number="form.estoque" label="Estoque" type="number" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Salvar" @click="salvarProduto" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import type { QTableProps } from 'quasar';

interface Produto {
  id?: number;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
}

const produtos = ref<Produto[]>([]);
const dialog = ref<boolean>(false);
const editando = ref<boolean>(false);
const produtoId = ref<number | null>(null);

const form = ref<Produto>({
  nome: '',
  categoria: '',
  preco: 0,
  estoque: 0,
});

const columns: QTableProps['columns'] = [
  { name: 'nome', label: 'Nome', field: 'nome', align: 'left' },
  { name: 'categoria', label: 'Categoria', field: 'categoria', align: 'left' },
  {
    name: 'preco',
    label: 'Preço',
    field: 'preco',
    align: 'left',
    format: (val: number | string) => `R$ ${Number(val).toFixed(2)}`,
  },
  { name: 'estoque', label: 'Estoque', field: 'estoque', align: 'left' },
  { name: 'acoes', label: 'Ações', field: 'acoes', align: 'left' },
];

async function carregarProdutos(): Promise<void> {
  const { data } = await axios.get<Produto[]>('http://localhost:3000/produtos');
  produtos.value = data;
}

function abrirDialog(): void {
  form.value = {
    nome: '',
    categoria: '',
    preco: 0,
    estoque: 0,
  };
  produtoId.value = null;
  editando.value = false;
  dialog.value = true;
}

function editarProduto(produto: Produto): void {
  form.value = { ...produto };
  produtoId.value = produto.id ?? null;
  editando.value = true;
  dialog.value = true;
}

async function salvarProduto(): Promise<void> {
  if (editando.value && produtoId.value !== null) {
    await axios.put(`http://localhost:3000/produtos/${produtoId.value}`, form.value);
  } else {
    await axios.post('http://localhost:3000/produtos', form.value);
  }

  dialog.value = false;
  form.value = {
    nome: '',
    categoria: '',
    preco: 0,
    estoque: 0,
  };
  editando.value = false;
  produtoId.value = null;

  await carregarProdutos();
}

async function excluirProduto(id?: number): Promise<void> {
  if (id == null) return;
  if (!confirm('Deseja excluir este produto?')) return;

  await axios.delete(`http://localhost:3000/produtos/${id}`);
  await carregarProdutos();
}

onMounted(() => {
  void carregarProdutos();
});
</script>
