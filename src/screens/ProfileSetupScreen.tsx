import { useState } from 'react';
import { Alert } from 'react-native';
import { ActionButton, ScreenShell, SectionCard, SectionTitle, TextField } from '../components/ui';
import { brazilianDateToIso, formatDateInput, isValidBrazilianDate, isoDateToBrazilian } from '../lib/date';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/app';

type ProfileSetupScreenProps = {
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
  profile: Profile | null;
};

export function ProfileSetupScreen({ onRefresh, onSignOut, profile }: ProfileSetupScreenProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [birthDate, setBirthDate] = useState(isoDateToBrazilian(profile?.birth_date));
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!profile?.id) {
      Alert.alert('Perfil indisponivel', 'Tente sair e entrar novamente para recriar a sessao.');
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Nome obrigatorio', 'Informe seu nome para continuar.');
      return;
    }

    if (!isValidBrazilianDate(birthDate)) {
      Alert.alert('Data invalida', 'Use o formato DD/MM/AAAA para continuar.');
      return;
    }

    const isoBirthDate = brazilianDateToIso(birthDate);

    if (!isoBirthDate) {
      Alert.alert('Data invalida', 'Nao foi possivel interpretar a data informada.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ birth_date: isoBirthDate, full_name: fullName.trim() })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel salvar seu perfil.';
      Alert.alert('Erro ao salvar', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenShell
      subtitle="So mais um ajuste para deixar o seu perfil completo antes de seguir."
      title="Seu perfil"
      footer={<ActionButton label="Sair" onPress={() => void onSignOut()} variant="ghost" />}>
      <SectionCard>
        <SectionTitle caption="Esses dados aparecem apenas para organizar a experiencia de voces." title="Dados pessoais" />
        <TextField label="Nome" onChangeText={setFullName} placeholder="Como seu par vai te reconhecer" value={fullName} />
        <TextField
          keyboardType="number-pad"
          label="Data de nascimento"
          onChangeText={(value) => setBirthDate(formatDateInput(value))}
          placeholder="DD/MM/AAAA"
          value={birthDate}
        />
        <ActionButton fullWidth label="Salvar e continuar" loading={loading} onPress={handleSave} />
      </SectionCard>
    </ScreenShell>
  );
}