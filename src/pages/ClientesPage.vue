<template>
  <q-page padding class="border">
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

    <q-table
      :rows="clientes"
      :columns="columns"
      row-key="id"
      flat
      bordered
      class="border grade-azul"
      no-data-label="Nenhum cliente encontrado"
      :pagination="{ rowsPerPage: 10 }"
    >
      <template v-slot:body-cell-acoes="props">
        <q-td>
          <q-btn
            v-if="props.row.status === 'ATIVO' && !isConsumidorFinal(props.row)"
            icon="edit"
            size="sm"
            flat
            color="primary"
            @click="editarCliente(props.row)"
          />

          <q-btn
            v-if="props.row.status === 'ATIVO' && !isConsumidorFinal(props.row)"
            icon="delete"
            size="sm"
            flat
            color="red"
            @click="excluirCliente(props.row.id)"
          />

          <q-btn
            v-else-if="!isConsumidorFinal(props.row)"
            icon="check_circle"
            size="sm"
            flat
            color="positive"
            @click="ativarCliente(props.row.id)"
          />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog">
      <q-card style="min-width: 400px" class="border">
        <q-card-section>
          <div class="text-h6">
            {{ editando ? 'Editar Cliente' : 'Novo Cliente' }}
          </div>
        </q-card-section>

        <q-card style="border-radius: 12px; overflow: hidden">
          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-md-6">
                <q-input dense mask="###.###.###-##" v-model="form.documento" label="Documento" />
              </div>

              <div class="col-12">
                <q-input dense v-model="form.nome" label="Nome Completo" />
              </div>

              <div class="col-12 col-md-6">
                <q-input dense v-model="form.email" label="Email" />
              </div>

              <div class="col-12 col-md-6">
                <q-input dense v-model="form.telefone" label="Telefone" mask="(##)#####-####" />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  dense
                  v-model="form.cep"
                  label="CEP"
                  mask="#####-###"
                  :loading="buscandoCep"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input dense v-model="form.endereco" label="Endereço" />
              </div>

              <div class="col-12 col-md-6">
                <q-input dense v-model="form.numero" label="Número" />
              </div>

              <div class="col-12 col-md-6">
                <q-input dense v-model="form.bairro" label="Bairro" />
              </div>

              <div class="col-12 col-md-6">
                <q-input dense v-model="form.cidade" label="Cidade" />
              </div>
            </div>
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
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { Notify, Dialog } from 'quasar';
import type { QTableProps } from 'quasar';

type StatusCliente = 'ATIVO' | 'INATIVO';

interface Cliente {
  id?: number;
  documento: string;
  nome: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  bairro: string;
  numero: string;
  cidade: string;
  status?: StatusCliente;
}

interface ApiErrorResponse {
  erro?: string;
}

const filtroBusca = ref<string>('');
const filtroStatus = ref<StatusCliente | ''>('ATIVO');

const clientes = ref<Cliente[]>([]);
const dialog = ref<boolean>(false);
const editando = ref<boolean>(false);
const clienteId = ref<number | null>(null);

const form = ref<Cliente>({
  documento: '',
  nome: '',
  email: '',
  telefone: '',
  cep: '',
  endereco: '',
  bairro: '',
  numero: '',
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
  form.value = {
    documento: cliente.documento ?? '',
    nome: cliente.nome ?? '',
    email: cliente.email ?? '',
    telefone: cliente.telefone ?? '',
    cep: cliente.cep ?? '',
    endereco: cliente.endereco ?? '',
    bairro: cliente.bairro ?? '',
    numero: cliente.numero ?? '',
    cidade: cliente.cidade ?? '',
  };

  clienteId.value = cliente.id ?? null;
  editando.value = true;
  dialog.value = true;
}

async function excluirCliente(id?: number): Promise<void> {
  if (id == null) return;

  Dialog.create({
    title: 'Confirmação',
    message: 'Deseja excluir este cliente?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
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
  });
}

async function ativarCliente(id?: number): Promise<void> {
  if (!id || id <= 0) return;

  Dialog.create({
    title: 'Confirmar ativação',
    message: 'Deseja ativar este cliente?',
    ok: {
      label: 'Ativar',
      color: 'positive',
      unelevated: true,
    },
    cancel: {
      label: 'Cancelar',
      color: 'grey-7',
      flat: true,
    },
    persistent: true,
  }).onOk(async () => {
    try {
      await axios.patch(`http://localhost:3000/clientes/${id}/status`, {
        status: 'ATIVO',
      });

      Notify.create({
        type: 'positive',
        message: 'Cliente ativado com sucesso',
      });

      await carregarClientes();
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error?.response?.data?.erro || 'Erro ao ativar cliente',
      });
    }
  });
}

function abrirDialog(): void {
  form.value = {
    documento: '',
    nome: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    bairro: '',
    numero: '',
    cidade: '',
  };

  clienteId.value = null;
  editando.value = false;
  dialog.value = true;
}

function normalizarDocumento(documento?: string | null): string {
  return String(documento || '')
    .replace(/\D/g, '')
    .trim();
}

function documentoJaExiste(): boolean {
  const documentoForm = normalizarDocumento(form.value.documento);

  if (!documentoForm) return false;

  return clientes.value.some((cliente) => {
    if (editando.value && cliente.id === clienteId.value) {
      return false;
    }

    return normalizarDocumento(cliente.documento) === documentoForm;
  });
}

function normalizarCep(cep?: string | null): string {
  return String(cep || '')
    .replace(/\D/g, '')
    .trim();
}

async function cepExiste(cep?: string | null): Promise<boolean> {
  const cepNormalizado = normalizarCep(cep);

  if (!cepNormalizado) return true; // sem CEP, pode salvar
  if (cepNormalizado.length !== 8) return false;

  try {
    const { data } = await axios.get(`https://viacep.com.br/ws/${cepNormalizado}/json/`);
    return !data?.erro;
  } catch {
    return false;
  }
}

async function salvarCliente(): Promise<void> {
  if (documentoJaExiste()) {
    Notify.create({
      type: 'warning',
      message: 'Já existe um cliente com este documento',
    });
    return;
  }

  const cepInformado = normalizarCep(form.value.cep);

  if (cepInformado) {
    const cepValido = await cepExiste(form.value.cep);

    if (!cepValido) {
      Notify.create({
        type: 'warning',
        message: 'O CEP informado não existe',
      });
      return;
    }
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
      cep: '',
      endereco: '',
      bairro: '',
      numero: '',
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

const buscandoCep = ref(false);

let cepTimeout: ReturnType<typeof setTimeout> | null = null;

function limparMascaraCep(valor?: string | null): string {
  return String(valor || '').replace(/\D/g, '');
}

async function buscarEnderecoPorCep(cep: string): Promise<void> {
  buscandoCep.value = true;

  try {
    const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

    if (data?.erro) {
      Notify.create({
        type: 'warning',
        message: 'CEP não encontrado',
      });
      form.value.endereco = '';
      form.value.bairro = '';
      form.value.numero = '';
      form.value.cidade = '';
      return;
    }

    form.value.cep = data.cep || form.value.cep;
    form.value.endereco = data.logradouro || '';
    form.value.bairro = data.bairro || '';
    form.value.cidade = data.localidade || '';
  } catch {
    Notify.create({
      type: 'negative',
      message: 'Erro ao buscar CEP',
    });
  } finally {
    buscandoCep.value = false;
  }
}

function isConsumidorFinal(cliente?: Cliente): boolean {
  return (cliente?.nome || '').trim().toUpperCase() === 'CONSUMIDOR FINAL';
}

watch(
  () => form.value.cep,
  (valor) => {
    const cep = limparMascaraCep(valor);

    if (cepTimeout) clearTimeout(cepTimeout);

    if (cep.length !== 8) return;

    cepTimeout = setTimeout(() => {
      void buscarEnderecoPorCep(cep);
    }, 400);
  },
);

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

/* Se estiver usando <style scoped> */
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
