<template>
  <div class="login-page flex flex-center">
    <q-card class="login-card shadow-6">
      <q-card-section class="text-center q-pb-xs">
        <div class="text-h5 text-weight-bold text-primary">Bem-vindo</div>
        <img
          :src="logo"
          alt="Logo"
          style="width: 60px; height: 36px; object-fit: contain; margin-right: 10px"
        />
        <div style="margin-top: -10px" class="text-caption text-grey-7 q-mt-xs">
          VendaFlow Gestão Comercial
        </div>
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-form @submit.prevent="fazerLogin" class="q-gutter-sm">
          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            outlined
            dense
            rounded
            lazy-rules
            :rules="[
              (val) => !!val || 'Informe o email',
              (val) => /.+@.+\..+/.test(val) || 'Email inválido',
            ]"
          >
            <template #prepend>
              <q-icon name="mail" color="primary" size="18px" />
            </template>
          </q-input>

          <q-input
            style="margin-top: -10px"
            v-model="form.senha"
            :type="mostrarSenha ? 'text' : 'password'"
            label="Senha"
            outlined
            dense
            rounded
            lazy-rules
            :rules="[(val) => !!val || 'Informe a senha']"
          >
            <template #prepend>
              <q-icon name="lock" color="primary" size="18px" />
            </template>

            <template #append>
              <q-icon
                :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                size="18px"
                @click="mostrarSenha = !mostrarSenha"
              />
            </template>
          </q-input>

          <q-btn
            style="margin-top: -10px"
            label="Entrar"
            type="submit"
            color="primary"
            unelevated
            rounded
            dense
            class="full-width"
            :loading="loading"
          />
          <q-btn
            label="Criar usuário"
            type="button"
            color="secondary"
            outline
            rounded
            dense
            class="full-width q-mt-sm"
            @click="dialogCriarUsuario = true"
          />

          <div class="text-center text-grey-7 text-caption q-mt-xs">
            Use seu email e senha para acessar
          </div>
        </q-form>
      </q-card-section>
    </q-card>
    <div class="login-image-container">
      <img :src="presenta" alt="Apresentação" class="login-image" />
    </div>
    <q-dialog v-model="dialogCriarUsuario" persistent>
      <q-card style="width: 100%; max-width: 420px" class="border">
        <q-card-section>
          <div class="text-h6 text-primary">Criar novo usuário</div>
          <div class="text-caption text-grey-7">
            Informe os dados do usuário e a senha do administrador.
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit.prevent="criarUsuario" class="q-gutter-sm">
            <q-input
              v-model="novoUsuario.nome"
              label="Nome"
              outlined
              dense
              rounded
              :rules="[(val) => !!val || 'Informe o nome']"
            >
              <template #prepend>
                <q-icon name="person" color="primary" size="18px" />
              </template>
            </q-input>

            <q-input
              v-model="novoUsuario.email"
              label="Email"
              type="email"
              outlined
              dense
              rounded
              :rules="[
                (val) => !!val || 'Informe o email',
                (val) => /.+@.+\..+/.test(val) || 'Email inválido',
              ]"
            >
              <template #prepend>
                <q-icon name="mail" color="primary" size="18px" />
              </template>
            </q-input>

            <q-input
              v-model="novoUsuario.senha"
              label="Senha do novo usuário"
              type="password"
              outlined
              dense
              rounded
              :rules="[(val) => !!val || 'Informe a senha']"
            >
              <template #prepend>
                <q-icon name="lock" color="primary" size="18px" />
              </template>
            </q-input>

            <q-input
              v-model="novoUsuario.confirmarSenha"
              label="Confirmar senha"
              type="password"
              outlined
              dense
              rounded
              :rules="[
                (val) => !!val || 'Confirme a senha',
                (val) => val === novoUsuario.senha || 'As senhas não conferem',
              ]"
            >
              <template #prepend>
                <q-icon name="lock" color="primary" size="18px" />
              </template>
            </q-input>

            <q-input
              v-model="novoUsuario.senhaAdministrador"
              label="Senha do administrador"
              type="password"
              outlined
              dense
              rounded
              :rules="[(val) => !!val || 'Informe a senha do administrador']"
            >
              <template #prepend>
                <q-icon name="admin_panel_settings" color="primary" size="18px" />
              </template>
            </q-input>

            <q-card-actions align="right" class="q-px-none">
              <q-btn
                label="Cancelar"
                flat
                color="grey-7"
                :disable="loadingCriarUsuario"
                @click="fecharDialogCriarUsuario"
              />

              <q-btn
                label="Criar"
                type="submit"
                color="primary"
                unelevated
                :loading="loadingCriarUsuario"
              />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';
import { api } from 'boot/axios';
import presenta from 'src/assets/presenta.jpg';
import logo from 'src/assets/vflogo.jpg';
const router = useRouter();

const loading = ref(false);
const mostrarSenha = ref(false);

const form = ref({
  email: '',
  senha: '',
});

const dialogCriarUsuario = ref(false);
const loadingCriarUsuario = ref(false);

const novoUsuario = ref({
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  senhaAdministrador: '',
});

function limparNovoUsuario() {
  novoUsuario.value = {
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    senhaAdministrador: '',
  };
}

function fecharDialogCriarUsuario() {
  dialogCriarUsuario.value = false;
  limparNovoUsuario();
}

async function criarUsuario() {
  if (
    !novoUsuario.value.nome ||
    !novoUsuario.value.email ||
    !novoUsuario.value.senha ||
    !novoUsuario.value.confirmarSenha ||
    !novoUsuario.value.senhaAdministrador
  ) {
    Notify.create({
      type: 'warning',
      message: 'Preencha todos os campos',
    });
    return;
  }

  if (!/.+@.+\..+/.test(novoUsuario.value.email)) {
    Notify.create({
      type: 'warning',
      message: 'Email inválido',
    });
    return;
  }

  if (novoUsuario.value.senha !== novoUsuario.value.confirmarSenha) {
    Notify.create({
      type: 'warning',
      message: 'As senhas não conferem',
    });
    return;
  }

  loadingCriarUsuario.value = true;

  try {
    await api.post('/auth/registrar', {
      nome: novoUsuario.value.nome,
      email: novoUsuario.value.email,
      senha: novoUsuario.value.senha,
      senhaAdministrador: novoUsuario.value.senhaAdministrador,
    });

    Notify.create({
      type: 'positive',
      message: 'Usuário criado com sucesso',
    });

    fecharDialogCriarUsuario();
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.erro || 'Erro ao criar usuário',
    });
  } finally {
    loadingCriarUsuario.value = false;
  }
}

async function fazerLogin() {
  if (!form.value.email || !form.value.senha) {
    Notify.create({
      type: 'warning',
      message: 'Preencha email e senha',
    });
    return;
  }

  loading.value = true;

  try {
    const { data } = await api.post('/auth/login', {
      email: form.value.email,
      senha: form.value.senha,
    });

    if (!data?.token) {
      Notify.create({
        type: 'negative',
        message: 'Token não retornado pelo servidor',
      });
      return;
    }

    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('usuario', JSON.stringify(data.usuario));

    console.log('TOKEN SALVO:', sessionStorage.getItem('token'));

    Notify.create({
      type: 'positive',
      message: 'Login realizado com sucesso',
    });

    await router.replace('/');
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.erro || 'Erro ao fazer login',
    });
  } finally {
    loading.value = false;
  }
}

function limparLogin() {
  form.value = {
    email: '',
    senha: '',
  };

  mostrarSenha.value = false;

  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');

  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

onMounted(() => {
  limparLogin();
});
</script>

<style scoped>
.border {
  border-radius: 12px;
}

.login-wrapper {
  min-height: 100vh;
}

.login-page {
  min-height: 100vh;
  padding: 12px;
}

.login-card {
  width: 100%;
  max-width: 340px;
  border-radius: 16px;
}

.login-image-container {
  margin-left: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 600px;
  width: 100%;
  min-height: 620px;
}

.login-image {
  width: 100%;
  max-width: 600px;
  max-height: 95vh;
  object-fit: contain;
  border-radius: 18px;
}
</style>
