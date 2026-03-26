<template>
  <div class="login-page flex flex-center">
    <div class="login-wrapper row items-center justify-center full-width q-pa-md">
      <div class="col-12 col-md-5 col-lg-4">
        <q-card class="login-card shadow-10">
          <q-card-section class="text-center q-pb-none">
            <div class="text-h4 text-weight-bold text-primary">Bem-vindo</div>
            <div class="text-subtitle1 text-grey-7 q-mt-sm">
              Acesse o Painel de Gestão Comercial
            </div>
          </q-card-section>

          <q-card-section class="q-pt-lg">
            <q-form @submit.prevent="fazerLogin" class="q-gutter-md">
              <q-input
                v-model="form.email"
                label="Email"
                type="email"
                outlined
                rounded
                lazy-rules
                :rules="[
                  (val) => !!val || 'Informe o email',
                  (val) => /.+@.+\..+/.test(val) || 'Email inválido',
                ]"
              >
                <template #prepend>
                  <q-icon name="mail" color="primary" />
                </template>
              </q-input>

              <q-input
                v-model="form.senha"
                :type="mostrarSenha ? 'text' : 'password'"
                label="Senha"
                outlined
                rounded
                lazy-rules
                :rules="[(val) => !!val || 'Informe a senha']"
              >
                <template #prepend>
                  <q-icon name="lock" color="primary" />
                </template>

                <template #append>
                  <q-icon
                    :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
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
                class="full-width q-py-sm"
                :loading="loading"
              />

              <div class="text-center text-grey-7 text-caption q-mt-sm">
                Use seu email e senha cadastrados para acessar o sistema
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
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
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4ecfb 100%);
}

.login-wrapper {
  min-height: 100vh;
}

.login-card {
  border-radius: 24px;
  padding: 12px;
  background: white;
}
</style>
