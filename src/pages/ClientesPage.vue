<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Clientes</div>

      <q-btn
        label="Novo Cliente"
        color="primary"
        style="border-radius: 12px"
        @click="abrirDialog"
      />
    </div>

    <div class="row q-col-gutter-md q-mb-md justify-end">
      <div class="col-12 col-md-3">
        <q-input
          class="border"
          v-model="filtroBusca"
          label="Buscar cliente por nome"
          outlined
          clearable
          dense
          @update:model-value="carregarClientes"
        />
      </div>

      <div class="col-12 col-md-2">
        <q-select
          class="border"
          v-model="filtroStatus"
          :options="statusOptions"
          label="Status"
          outlined
          clearable
          dense
          @update:model-value="carregarClientes"
        />
      </div>
    </div>

    <q-table :rows="clientes" :columns="columns" row-key="id" flat bordered class="border">
      <template v-slot:body-cell-acoes="props">
        <q-td>
          <q-btn icon="edit" size="sm" flat color="primary" @click="editarCliente(props.row)" />
          <q-btn icon="delete" size="sm" flat color="red" @click="excluirCliente(props.row.id)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{ editando ? 'Editar Cliente' : 'Novo Cliente' }}
          </div>
        </q-card-section>

        <q-card style="border-radius: 12px; overflow: hidden">
          <q-card-section>
            <q-input mask="###.###.###-##" v-model="form.documento" label="Documento" />
            <q-input v-model="form.nome" label="Nome" />
            <q-input v-model="form.email" label="Email" />
            <q-input v-model="form.telefone" label="Telefone" mask="(##)#####-####" />
            <q-input v-model="form.cidade" label="Cidade" />
          </q-card-section>
        </q-card>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" style="border-radius: 12px" v-close-popup />
          <q-btn
            color="primary"
            style="border-radius: 12px"
            label="Salvar"
            @click="salvarCliente"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Notify } from 'quasar';
import type { QTableProps } from 'quasar';

type StatusCliente = 'ATIVO' | 'INATIVO';

interface Cliente {
  id?: number;
  documento: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  status?: StatusCliente;
}

interface ApiErrorResponse {
  erro?: string;
}

const filtroBusca = ref<string>('');
const filtroStatus = ref<StatusCliente | ''>('');

const clientes = ref<Cliente[]>([]);
const dialog = ref<boolean>(false);
const editando = ref<boolean>(false);
const clienteId = ref<number | null>(null);

const form = ref<Cliente>({
  documento: '',
  nome: '',
  email: '',
  telefone: '',
  cidade: '',
});

const statusOptions: StatusCliente[] = ['ATIVO', 'INATIVO'];

const columns: QTableProps['columns'] = [
  { name: 'documento', label: 'Documento', field: 'documento', align: 'left' },
  { name: 'nome', label: 'Nome', field: 'nome', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'telefone', label: 'Telefone', field: 'telefone', align: 'left' },
  { name: 'cidade', label: 'Cidade', field: 'cidade', align: 'left' },
  { name: 'acoes', label: 'Ações', field: 'acoes', align: 'left' },
];

// carregar lista
async function carregarClientes(): Promise<void> {
  const { data } = await axios.get<Cliente[]>('http://localhost:3000/clientes', {
    params: {
      busca: filtroBusca.value || '',
      status: filtroStatus.value || '',
    },
  });

  clientes.value = data;
}

function editarCliente(cliente: Cliente): void {
  form.value = { ...cliente };
  clienteId.value = cliente.id ?? null;
  editando.value = true;
  dialog.value = true;
}

async function excluirCliente(id?: number): Promise<void> {
  if (id == null) return;
  if (!confirm('Deseja excluir este cliente?')) return;

  try {
    await axios.delete(`http://localhost:3000/clientes/${id}`);

    Notify.create({
      type: 'positive',
      message: 'Cliente excluído com sucesso',
    });

    await carregarClientes();
  } catch (err: unknown) {
    const error = err as { response?: { data?: ApiErrorResponse } };

    Notify.create({
      type: 'negative',
      message: error.response?.data?.erro || 'Erro ao excluir cliente',
    });
  }
}

function abrirDialog(): void {
  form.value = {
    documento: '',
    nome: '',
    email: '',
    telefone: '',
    cidade: '',
  };
  clienteId.value = null;
  editando.value = false;
  dialog.value = true;
}

function normalizarDocumento(documento: string): string {
  return documento.replace(/\D/g, '').trim();
}

function documentoJaExiste(): boolean {
  const documentoForm = normalizarDocumento(form.value.documento);

  return clientes.value.some((cliente) => {
    if (editando.value && cliente.id === clienteId.value) {
      return false;
    }

    return normalizarDocumento(cliente.documento) === documentoForm;
  });
}

async function salvarCliente(): Promise<void> {
  if (documentoJaExiste()) {
    Notify.create({
      type: 'warning',
      message: 'Já existe um cliente com este documento',
    });
    return;
  }

  try {
    if (editando.value && clienteId.value !== null) {
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
    form.value = {
      documento: '',
      nome: '',
      email: '',
      telefone: '',
      cidade: '',
    };
    editando.value = false;
    clienteId.value = null;

    await carregarClientes();
  } catch (err: unknown) {
    const error = err as { response?: { data?: ApiErrorResponse } };

    Notify.create({
      type: 'negative',
      message: error.response?.data?.erro || 'Erro ao salvar cliente',
    });
  }
}

onMounted(() => {
  void carregarClientes();
});
</script>

<style scoped>
.input-soft-rounded :deep(.q-field__control) {
  border-radius: 8px;
}

.card-form {
  border-radius: 12px !important;
  overflow: hidden;
}

.border {
  border-radius: 12px;
}
</style>
