<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Produtos</div>

      <q-btn rounded label="Novo Produto" color="primary" @click="abrirDialog" />
    </div>

    <!-- TABELA -->
    <q-table :rows="produtos" :columns="columns" row-key="id" flat bordered>
      <template v-slot:body-cell-acoes="props">
        <q-td>
          <q-btn icon="edit" size="sm" flat color="primary" @click="editarProduto(props.row)" />

          <q-btn icon="delete" size="sm" flat color="red" @click="excluirProduto(props.row.id)" />
        </q-td>
      </template>
    </q-table>

    <!-- DIALOG -->
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
          <q-input v-model="form.preco" label="Preço" type="number" />
          <q-input v-model="form.estoque" label="Estoque" type="number" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Salvar" @click="salvarProduto" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const produtos = ref([]);
const dialog = ref(false);
const editando = ref(false);
const produtoId = ref(null);

const form = ref({
  nome: '',
  categoria: '',
  preco: 0,
  estoque: 0,
});

const columns = [
  { name: 'nome', label: 'Nome', field: 'nome' },
  { name: 'categoria', label: 'Categoria', field: 'categoria' },
  {
    name: 'preco',
    label: 'Preço',
    field: 'preco',
    format: (val) => `R$ ${Number(val).toFixed(2)}`,
  },
  { name: 'estoque', label: 'Estoque', field: 'estoque' },
  { name: 'acoes', label: 'Ações', field: 'acoes' },
];

// carregar produtos
async function carregarProdutos() {
  const { data } = await axios.get('http://localhost:3000/produtos');
  produtos.value = data;
}

// abrir dialog
function abrirDialog() {
  dialog.value = true;
}

// editar
function editarProduto(produto) {
  form.value = { ...produto };
  produtoId.value = produto.id;
  editando.value = true;
  dialog.value = true;
}

// salvar
async function salvarProduto() {
  if (editando.value) {
    await axios.put(`http://localhost:3000/produtos/${produtoId.value}`, form.value);
  } else {
    await axios.post('http://localhost:3000/produtos', form.value);
  }

  dialog.value = false;
  form.value = { nome: '', categoria: '', preco: 0, estoque: 0 };
  editando.value = false;
  produtoId.value = null;

  carregarProdutos();
}

// excluir
async function excluirProduto(id) {
  if (!confirm('Deseja excluir este produto?')) return;

  await axios.delete(`http://localhost:3000/produtos/${id}`);
  carregarProdutos();
}

onMounted(() => {
  carregarProdutos();
});
</script>
