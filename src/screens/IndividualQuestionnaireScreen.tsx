import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { ActionButton, ScreenShell, SectionCard, SectionTitle, TextField, sharedStyles } from '../components/ui';
import { supabase } from '../lib/supabase';

type IndividualQuestionnaireScreenProps = {
  currentUserId: string;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export function IndividualQuestionnaireScreen({
  currentUserId,
  onRefresh,
  onSignOut,
}: IndividualQuestionnaireScreenProps) {
  const [partnerTrait, setPartnerTrait] = useState('');
  const [selfTrait, setSelfTrait] = useState('');
  const [relationshipDefinition, setRelationshipDefinition] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!partnerTrait.trim() || !selfTrait.trim() || !relationshipDefinition.trim()) {
      Alert.alert('Respostas obrigatorias', 'Preencha todas as respostas para continuar.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('user_questionnaires').upsert({
        partner_admired_trait: partnerTrait.trim(),
        relationship_definition: relationshipDefinition.trim(),
        self_trait_partner_admires: selfTrait.trim(),
        user_id: currentUserId,
      });

      if (error) {
        throw error;
      }

      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel salvar o questionario individual.';
      Alert.alert('Erro ao salvar', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenShell
      subtitle="Aqui vale sinceridade. Essas respostas ajudam a deixar a experiencia mais sensivel ao jeito de voces."
      title="Sua perspectiva"
      footer={<ActionButton label="Sair" onPress={() => void onSignOut()} variant="ghost" />}>
      <SectionCard>
        <SectionTitle caption="Responda com calma. Nao existe resposta certa aqui." title="Sobre a relacao" />
        <TextField
          label="Qual caracteristica do seu parceiro(a) voce mais admira?"
          multiline
          onChangeText={setPartnerTrait}
          placeholder="Conte o que mais chama sua atencao."
          value={partnerTrait}
        />
        <TextField
          label="Qual caracteristica voce acha que seu parceiro(a) mais admira em voce?"
          multiline
          onChangeText={setSelfTrait}
          placeholder="Escreva sua melhor aposta."
          value={selfTrait}
        />
        <TextField
          label="Hoje, como voce definiria seu relacionamento?"
          multiline
          onChangeText={setRelationshipDefinition}
          placeholder="Descreva com suas palavras."
          value={relationshipDefinition}
        />
        <ActionButton fullWidth label="Salvar respostas" loading={loading} onPress={handleSave} />
      </SectionCard>
    </ScreenShell>
  );
}