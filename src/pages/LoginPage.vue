<template>
  <div class="login-page flex flex-center">
    <q-card class="login-card shadow-6">
      <q-card-section class="text-center q-pb-xs">
        <div class="text-h5 text-weight-bold text-primary">Bem-vindo</div>
        <div class="text-caption text-grey-7 q-mt-xs">Acesse o Painel de Gestão Comercial</div>
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
            label="Entrar"
            type="submit"
            color="primary"
            unelevated
            rounded
            dense
            class="full-width"
            :loading="loading"
          />

          <div class="text-center text-grey-7 text-caption q-mt-xs">
            Use seu email e senha para acessar
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';
import { api } from 'boot/axios';

const router = useRouter();

const loading = ref(false);
const mostrarSenha = ref(false);

const form = ref({
  email: '',
  senha: '',
});

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
    const { data } = await api.post('/auth/login', form.value);

    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    Notify.create({
      type: 'positive',
      message: 'Login realizado com sucesso',
    });

    await router.push('/');
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.erro || 'Erro ao fazer login',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
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
</style>
