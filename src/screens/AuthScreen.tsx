import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { ActionButton, InfoStripe, ScreenShell, SectionCard, SectionTitle, TabSwitcher, TextField, sharedStyles } from '../components/ui';
import { brazilianDateToIso, formatDateInput, isValidBrazilianDate } from '../lib/date';
import { supabase } from '../lib/supabase';

type AuthScreenProps = {
  onAuthenticated: () => void;
};

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert('Campos obrigatorios', 'Informe e-mail e senha para continuar.');
      return;
    }

    if (mode === 'sign-up') {
      if (!fullName.trim()) {
        Alert.alert('Nome obrigatorio', 'Informe seu nome para criar a conta.');
        return;
      }

      if (!isValidBrazilianDate(birthDate)) {
        Alert.alert('Data invalida', 'Use o formato DD/MM/AAAA para sua data de nascimento.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          throw error;
        }
      } else {
        const isoBirthDate = brazilianDateToIso(birthDate);

        if (!isoBirthDate) {
          throw new Error('Data de nascimento invalida.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              birth_date: isoBirthDate,
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.user?.id) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              birth_date: isoBirthDate,
              email: normalizedEmail,
              full_name: fullName.trim(),
              id: data.user.id,
            });

          if (profileError) {
            throw profileError;
          }
        }

        Alert.alert('Conta criada', 'Sua conta foi criada e o onboarding inicial sera carregado.');
      }

      onAuthenticated();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel autenticar.';
      Alert.alert('Erro na autenticacao', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenShell title={mode === 'sign-in' ? 'Entrar' : 'Criar conta'}>
      <SectionCard>
        <SectionTitle title="Acesso" />
        <TabSwitcher
          items={[
            { key: 'sign-in', label: 'Entrar' },
            { key: 'sign-up', label: 'Criar conta' },
          ]}
          onChange={(value) => setMode(value as 'sign-in' | 'sign-up')}
          value={mode}
        />
        {mode === 'sign-up' ? (
          <>
            <InfoStripe>
              <Text style={sharedStyles.supportingText}>Use seu nome como gostaria de aparecer para o seu par.</Text>
            </InfoStripe>
            <TextField label="Nome" onChangeText={setFullName} placeholder="Como voce quer aparecer" value={fullName} />
            <TextField
              label="Data de nascimento"
              keyboardType="number-pad"
              onChangeText={(value) => setBirthDate(formatDateInput(value))}
              placeholder="DD/MM/AAAA"
              value={birthDate}
            />
          </>
        ) : null}
        <TextField
          autoCapitalize="none"
          keyboardType="email-address"
          label="E-mail"
          onChangeText={setEmail}
          placeholder="voce@exemplo.com"
          value={email}
        />
        <TextField
          autoCapitalize="none"
          label="Senha"
          onChangeText={setPassword}
          placeholder="Escolha uma senha segura"
          secureTextEntry
          value={password}
        />
        <ActionButton fullWidth label={mode === 'sign-in' ? 'Entrar' : 'Criar conta'} loading={loading} onPress={handleSubmit} />
      </SectionCard>
    </ScreenShell>
  );
}