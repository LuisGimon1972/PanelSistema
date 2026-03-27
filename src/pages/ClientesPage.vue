<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Clientes</div>

      <q-btn rounded label="Novo Cliente" color="primary" @click="abrirDialog" />
    </div>
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-input
          class="input-radius"
          v-model="filtroBusca"
          label="Buscar cliente por nome"
          outlined
          clearable
          @update:model-value="carregarClientes"
        />
      </div>

      <div class="col-12 col-md-3">
        <q-select
          v-model="filtroStatus"
          :options="['ATIVO', 'INATIVO']"
          label="Status"
          outlined
          clearable
          @update:model-value="carregarClientes"
        />
      </div>
    </div>

    <!-- TABELA -->
    <q-table :rows="clientes" :columns="columns" row-key="id" flat bordered>
      <template v-slot:body-cell-acoes="props">
        <q-td>
          <q-btn icon="edit" size="sm" flat color="primary" @click="editarCliente(props.row)" />

          <q-btn icon="delete" size="sm" flat color="red" @click="excluirCliente(props.row.id)" />
        </q-td>
      </template>
    </q-table>
    <!-- DIALOG -->
    <q-dialog v-model="dialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Novo Cliente</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="form.nome" label="Nome" />
          <q-input v-model="form.email" label="Email" />
          <q-input v-model="form.telefone" label="Telefone" mask="(##)#####.#####" />
          <q-input v-model="form.cidade" label="Cidade" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Salvar" @click="salvarCliente" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Notify } from 'quasar';

const filtroBusca = ref('');
const filtroStatus = ref('');

const clientes = ref([]);
const dialog = ref(false);
const editando = ref(false);
const clienteId = ref(null);

const form = ref({
  nome: '',
  email: '',
  telefone: '',
  cidade: '',
});

const columns = [
  { name: 'nome', label: 'Nome', field: 'nome' },
  { name: 'email', label: 'Email', field: 'email' },
  { name: 'telefone', label: 'Telefone', field: 'telefone' },
  { name: 'cidade', label: 'Cidade', field: 'cidade' },
  { name: 'acoes', label: 'Ações', field: 'acoes' },
];

// carregar lista
async function carregarClientes() {
  const { data } = await axios.get('http://localhost:3000/clientes', {
    params: {
      busca: filtroBusca.value || '',
      status: filtroStatus.value || '',
    },
  });

  clientes.value = data;
}

function editarCliente(cliente) {
  form.value = { ...cliente };
  clienteId.value = cliente.id;
  editando.value = true;
  dialog.value = true;
}

async function excluirCliente(id) {
  if (!confirm('Deseja excluir este cliente?')) return;

  try {
    await axios.delete(`http://localhost:3000/clientes/${id}`);

    Notify.create({
      type: 'positive',
      message: 'Cliente excluído com sucesso',
    });

    await carregarClientes();
  } catch (err) {
    Notify.create({
      type: 'negative',
      message: err.response?.data?.erro || 'Erro ao excluir cliente',
    });
  }
}

// abrir modal
function abrirDialog() {
  dialog.value = true;
}

// salvar cliente
async function salvarCliente() {
  try {
    if (editando.value) {
      await axios.put(`http://localhost:3000/clientes/${clienteId.value}`, form.value);

      Notify.create({
        type: 'positive',
        message: 'Cliente atualizado com sucesso',
      });
    } else {
      await axios.post('http://localhost:3000/clientes', form.value);

      Notify.create({
        type: 'positive',
        message: 'Cliente cadastrado com sucesso',
      });
    }

    dialog.value = false;
    form.value = { nome: '', email: '', telefone: '', cidade: '' };
    editando.value = false;
    clienteId.value = null;

    await carregarClientes();
  } catch (err) {
    Notify.create({
      type: 'negative',
      message: err.response?.data?.erro || 'Erro ao salvar cliente',
    });
  }
}

// init
onMounted(() => {
  carregarClientes();
});
</script>
<style scoped>
.input-radius .q-field__control {
  border-radius: 10px !important;
}
</style>
