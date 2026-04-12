<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Produtos</div>

      <q-btn
        label="NOVO PRODUTO"
        color="primary"
        unelevated
        style="border-radius: 12px"
        @click="abrirDialog"
      />
    </div>
    <div class="row q-col-gutter-md q-mb-md justify-end">
      <div class="col-12 col-md-3">
        <q-input
          class="border"
          v-model="filtroBusca"
          label="Buscar produto por nome"
          outlined
          clearable
          dense
          @update:model-value="carregarProdutos"
        />
      </div>

      <div class="col-12 col-md-2">
        <q-select
          class="border"
          v-model="filtroCategoria"
          :options="categoriasOptions"
          label="Categoria"
          outlined
          clearable
          dense
          @update:model-value="carregarProdutos"
        />
      </div>
    </div>

    <q-table :rows="produtos" :columns="columns" row-key="id" flat bordered class="border">
      <template v-slot:body-cell-foto="props">
        <q-td>
          <q-avatar v-if="props.row.foto" rounded size="42px">
            <img :src="props.row.foto" alt="Foto do produto" />
          </q-avatar>
          <span v-else>-</span>
        </q-td>
      </template>

      <template v-slot:body-cell-acoes="props">
        <q-td>
          <q-btn icon="edit" size="sm" flat color="primary" @click="editarProduto(props.row)" />
          <q-btn icon="delete" size="sm" flat color="red" @click="excluirProduto(props.row.id)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog">
      <q-card style="min-width: 500px; max-width: 500px; width: 100%">
        <q-card-section>
          <div class="text-h6">
            {{ editando ? 'Editar Produto' : 'Novo Produto' }}
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-card flat bordered class="q-pa-md">
            <div class="text-subtitle1 q-mb-md">Dados do produto</div>
            <q-input
              v-model="form.codigo_barras"
              label="Código de Barras"
              mask="###########"
              outlined
            />
            <q-input v-model="form.nome" label="Nome" outlined />
            <q-input v-model="form.categoria" label="Categoria" outlined />
            <q-input v-model.number="form.preco" label="Preço" type="number" outlined />
            <q-input v-model.number="form.estoque" label="Estoque" type="number" outlined />
          </q-card>

          <q-card flat bordered class="q-pa-md" style="border-radius: 10px">
            <div class="text-subtitle1 q-mb-md">Foto do produto</div>

            <q-file
              v-model="fotoArquivo"
              class="text-normal q-mb-sm"
              label="Selecionar imagem (formatos: .JPG, .JPEG, .PNG ou .WEBP)"
              outlined
              clearable
              accept=".jpg,.jpeg,.png,.webp"
            >
              <template v-slot:prepend>
                <q-icon name="image" />
              </template>
            </q-file>

            <div class="q-mt-md flex flex-center">
              <q-img
                v-if="previewFoto"
                :src="previewFoto"
                style="width: 180px; height: 180px; border-radius: 10px"
                fit="cover"
              >
                <template #error>
                  <div class="full-width full-height flex flex-center bg-grey-3 text-grey-7">
                    Imagem inválida
                  </div>
                </template>
              </q-img>

              <q-img
                v-else-if="form.foto"
                :src="form.foto"
                style="width: 180px; height: 180px; border-radius: 10px"
                fit="cover"
              >
                <template #error>
                  <div class="full-width full-height flex flex-center bg-grey-3 text-grey-7">
                    Imagem inválida
                  </div>
                </template>
              </q-img>

              <div
                v-else
                class="bg-grey-2 text-grey-7 flex flex-center"
                style="width: 180px; height: 100px; border-radius: 10px"
              >
                Sem imagem
              </div>
            </div>
            <div class="q-mt-sm row justify-center q-gutter-sm">
              <q-btn
                v-if="previewFoto || form.foto"
                flat
                color="negative"
                icon="delete"
                label="Remover foto"
                @click="removerFoto"
              />
            </div>
          </q-card>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancelar"
            style="border-radius: 12px"
            v-close-popup
            @click="fecharDialog"
          />
          <q-btn
            color="primary"
            label="Salvar"
            style="border-radius: 12px"
            @click="salvarProduto"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import type { QTableProps } from 'quasar';
import { Notify } from 'quasar';

interface Produto {
  id?: number;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  foto: string;
  codigo_barras: string;
}

interface ProdutoForm {
  id?: number;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  foto: string;
  codigo_barras: string;
}

const API_URL = 'http://localhost:3000';

const produtos = ref<Produto[]>([]);
const dialog = ref<boolean>(false);
const editando = ref<boolean>(false);
const produtoId = ref<number | null>(null);

const fotoArquivo = ref<File | null>(null);
const previewFoto = ref<string>('');
const fotoRemovida = ref<boolean>(false);

const form = ref<ProdutoForm>({
  nome: '',
  categoria: '',
  preco: 0,
  estoque: 0,
  foto: '',
  codigo_barras: '',
});

const filtroBusca = ref<string>('');
const filtroCategoria = ref<string>('');

const categoriasOptions = ref<string[]>([
  'Eletrônicos',
  'Roupas',
  'Alimentos',
  'Bebidas',
  'Limpieza',
]);

const columns: QTableProps['columns'] = [
  { name: 'id', label: 'Código', field: 'id', align: 'left' },
  { name: 'foto', label: 'Foto', field: 'foto', align: 'left' },
  { name: 'nome', label: 'Nome', field: 'nome', align: 'left' },
  { name: 'codigo_barras', label: 'Barras', field: 'codigo_barras', align: 'left' },
  { name: 'categoria', label: 'Categoria', field: 'categoria', align: 'left' },
  {
    name: 'preco',
    label: 'Preço Venda',
    field: 'preco',
    align: 'right',
    format: (val: number | string) => `R$ ${Number(val).toFixed(2)}`,
  },
  { name: 'estoque', label: 'Estoque', field: 'estoque', align: 'right' },
  { name: 'acoes', label: 'Ações', field: 'acoes', align: 'left' },
];

watch(fotoArquivo, (file) => {
  if (previewFoto.value) {
    URL.revokeObjectURL(previewFoto.value);
    previewFoto.value = '';
  }

  if (file) {
    previewFoto.value = URL.createObjectURL(file);
    fotoRemovida.value = false;
  }
});

async function carregarProdutos(): Promise<void> {
  const { data } = await axios.get<Produto[]>(`${API_URL}/produtos`, {
    params: {
      busca: filtroBusca.value,
      categoria: filtroCategoria.value,
    },
  });

  produtos.value = data;
}

function resetFormulario(): void {
  form.value = {
    nome: '',
    categoria: '',
    preco: 0,
    estoque: 0,
    foto: '',
    codigo_barras: '',
  };

  fotoArquivo.value = null;
  fotoRemovida.value = false;

  if (previewFoto.value) {
    URL.revokeObjectURL(previewFoto.value);
    previewFoto.value = '';
  }

  produtoId.value = null;
  editando.value = false;
}

function abrirDialog(): void {
  resetFormulario();
  dialog.value = true;
}

function fecharDialog(): void {
  dialog.value = false;
  resetFormulario();
}

function editarProduto(produto: Produto): void {
  resetFormulario();

  form.value = {
    ...produto,
    preco: Number(produto.preco),
    estoque: Number(produto.estoque),
    categoria: produto.categoria ?? '',
    foto: produto.foto ?? '',
    codigo_barras: produto.codigo_barras ?? '',
  };

  produtoId.value = produto.id ?? null;
  editando.value = true;
  dialog.value = true;
}

function removerFoto(): void {
  if (previewFoto.value) {
    URL.revokeObjectURL(previewFoto.value);
    previewFoto.value = '';
  }

  fotoArquivo.value = null;
  form.value.foto = '';
  fotoRemovida.value = true;
}

async function uploadFoto(): Promise<string> {
  if (fotoRemovida.value) {
    return '';
  }

  if (!fotoArquivo.value) {
    return form.value.foto || '';
  }

  const formData = new FormData();
  formData.append('foto', fotoArquivo.value);

  const { data } = await axios.post<{ url: string }>(`${API_URL}/produtos/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data.url;
}

async function salvarProduto(): Promise<void> {
  try {
    const fotoUrl = await uploadFoto();

    const payload = {
      ...form.value,
      codigo_barras: form.value.codigo_barras?.trim() || null,
      foto: fotoUrl,
    };

    if (editando.value && produtoId.value !== null) {
      await axios.put(`${API_URL}/produtos/${produtoId.value}`, payload);
    } else {
      await axios.post(`${API_URL}/produtos`, payload);
    }

    Notify.create({
      type: 'positive',
      message: editando.value ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso',
    });

    fecharDialog();
    await carregarProdutos();
  } catch (error: any) {
    const status = error?.response?.status;
    const mensagem = error?.response?.data?.erro || 'Erro ao salvar produto';

    Notify.create({
      type: status === 409 ? 'warning' : 'negative',
      message: mensagem,
    });
  }
}

async function excluirProduto(id?: number): Promise<void> {
  if (id == null) return;
  if (!confirm('Deseja excluir este produto?')) return;

  await axios.delete(`${API_URL}/produtos/${id}`);
  await carregarProdutos();
}

onMounted(() => {
  void carregarProdutos();
});
</script>

<style scoped>
.border {
  border-radius: 12px;
}
</style>
