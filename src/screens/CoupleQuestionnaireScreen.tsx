import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { ActionButton, ChoiceChip, InfoStripe, ScreenShell, SectionCard, SectionTitle, TextField, sharedStyles } from '../components/ui';
import { brazilianDateToIso, formatDateInput, isValidBrazilianDate, isoDateToBrazilian } from '../lib/date';
import { supabase } from '../lib/supabase';
import { ChildGender, CoupleChild, CoupleWorkspace, RelationshipStage } from '../types/app';

type CoupleQuestionnaireScreenProps = {
  children: CoupleChild[];
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
  workspace: CoupleWorkspace;
};

type ChildDraft = {
  birth_date: string;
  gender: ChildGender;
  name: string;
};

const emptyChild = (): ChildDraft => ({
  birth_date: '',
  gender: 'female',
  name: '',
});

const childGenderOptions: { label: string; value: ChildGender }[] = [
  { label: 'Menina', value: 'female' },
  { label: 'Menino', value: 'male' },
  { label: 'Nao binario', value: 'nonbinary' },
  { label: 'Prefiro nao informar', value: 'prefer_not_to_say' },
];

function normalizeChildren(children: CoupleChild[]) {
  if (children.length === 0) {
    return [emptyChild()];
  }

  return children.map((child) => ({
    birth_date: isoDateToBrazilian(child.birth_date),
    gender: child.gender,
    name: child.name,
  }));
}

export function CoupleQuestionnaireScreen({ children, onRefresh, onSignOut, workspace }: CoupleQuestionnaireScreenProps) {
  const [relationStage, setRelationStage] = useState<RelationshipStage>((workspace.relation_stage ?? 'dating') as RelationshipStage);
  const [datingSince, setDatingSince] = useState(isoDateToBrazilian(workspace.dating_since));
  const [engagedSince, setEngagedSince] = useState(isoDateToBrazilian(workspace.engaged_since));
  const [marriedSince, setMarriedSince] = useState(isoDateToBrazilian(workspace.married_since));
  const [hasChildren, setHasChildren] = useState<boolean>(workspace.has_children ?? false);
  const [childrenCount, setChildrenCount] = useState(workspace.children_count ? String(workspace.children_count) : '');
  const [childDrafts, setChildDrafts] = useState<ChildDraft[]>(normalizeChildren(children));
  const [reason, setReason] = useState(workspace.started_using_reason ?? '');
  const [loading, setLoading] = useState(false);

  function syncChildCount(nextCountValue: string) {
    setChildrenCount(nextCountValue);

    const parsedCount = Number(nextCountValue);

    if (!Number.isInteger(parsedCount) || parsedCount < 0) {
      return;
    }

    setChildDrafts((current) => {
      const nextDrafts = [...current];

      while (nextDrafts.length < parsedCount) {
        nextDrafts.push(emptyChild());
      }

      return nextDrafts.slice(0, parsedCount);
    });
  }

  function updateChild(index: number, field: keyof ChildDraft, value: string) {
    setChildDrafts((current) =>
      current.map((child, currentIndex) =>
        currentIndex === index
          ? {
              ...child,
              [field]: value,
            }
          : child,
      ),
    );
  }

  async function handleSave() {
    if (!isValidBrazilianDate(datingSince)) {
      Alert.alert('Data invalida', 'Preencha a data de namoro no formato DD/MM/AAAA.');
      return;
    }

    if (relationStage !== 'dating' && !isValidBrazilianDate(engagedSince)) {
      Alert.alert('Data invalida', 'Preencha a data de noivado no formato DD/MM/AAAA.');
      return;
    }

    if (relationStage === 'married' && !isValidBrazilianDate(marriedSince)) {
      Alert.alert('Data invalida', 'Preencha a data de casamento no formato DD/MM/AAAA.');
      return;
    }

    if (hasChildren) {
      const parsedChildrenCount = Number(childrenCount);

      if (!Number.isInteger(parsedChildrenCount) || parsedChildrenCount < 1) {
        Alert.alert('Quantidade invalida', 'Informe quantos filhos voces possuem.');
        return;
      }

      if (childDrafts.length !== parsedChildrenCount) {
        Alert.alert('Faltam dados', 'Revise os dados de cada filho antes de continuar.');
        return;
      }

      const hasInvalidChild = childDrafts.some((child) => !child.name.trim() || !isValidBrazilianDate(child.birth_date));

      if (hasInvalidChild) {
        Alert.alert('Dados incompletos', 'Preencha nome, sexo e data de nascimento de cada filho.');
        return;
      }
    }

    if (!reason.trim()) {
      Alert.alert('Resposta obrigatoria', 'Explique por que voces decidiram usar o aplicativo.');
      return;
    }

    setLoading(true);

    try {
      const isoDatingSince = brazilianDateToIso(datingSince);
      const isoEngagedSince = relationStage === 'dating' ? null : brazilianDateToIso(engagedSince);
      const isoMarriedSince = relationStage === 'married' ? brazilianDateToIso(marriedSince) : null;

      if (!isoDatingSince || (relationStage !== 'dating' && !isoEngagedSince) || (relationStage === 'married' && !isoMarriedSince)) {
        throw new Error('Nao foi possivel interpretar as datas informadas.');
      }

      const { error } = await supabase.rpc('save_couple_questionnaire', {
        target_children: hasChildren
          ? childDrafts.map((child) => ({
              birth_date: brazilianDateToIso(child.birth_date),
              gender: child.gender,
              name: child.name.trim(),
            }))
          : [],
        target_dating_since: isoDatingSince,
        target_engaged_since: isoEngagedSince,
        target_has_children: hasChildren,
        target_married_since: isoMarriedSince,
        target_relation_stage: relationStage,
        target_started_using_reason: reason.trim(),
        target_workspace_id: workspace.id,
      });

      if (error) {
        throw error;
      }

      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel salvar o questionario do casal.';
      Alert.alert('Erro ao salvar', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenShell
      subtitle="Alguns detalhes organizam a casa e deixam a experiencia mais parecida com a vida real de voces."
      title="Sobre a historia de voces"
      footer={<ActionButton label="Sair" onPress={() => void onSignOut()} variant="ghost" />}>
      <SectionCard>
        <SectionTitle caption="Escolham a etapa que melhor representa o momento atual." title="Relacao" />
        <View style={sharedStyles.row}>
          <ChoiceChip label="Namorados" onPress={() => setRelationStage('dating')} selected={relationStage === 'dating'} />
          <ChoiceChip label="Noivos" onPress={() => setRelationStage('engaged')} selected={relationStage === 'engaged'} />
          <ChoiceChip label="Casados" onPress={() => setRelationStage('married')} selected={relationStage === 'married'} />
        </View>
        <TextField
          keyboardType="number-pad"
          label="Data de namoro"
          onChangeText={(value) => setDatingSince(formatDateInput(value))}
          placeholder="DD/MM/AAAA"
          value={datingSince}
        />
        {relationStage !== 'dating' ? (
          <TextField
            keyboardType="number-pad"
            label="Data de noivado"
            onChangeText={(value) => setEngagedSince(formatDateInput(value))}
            placeholder="DD/MM/AAAA"
            value={engagedSince}
          />
        ) : null}
        {relationStage === 'married' ? (
          <TextField
            keyboardType="number-pad"
            label="Data de casamento"
            onChangeText={(value) => setMarriedSince(formatDateInput(value))}
            placeholder="DD/MM/AAAA"
            value={marriedSince}
          />
        ) : null}
      </SectionCard>

      <SectionCard>
        <SectionTitle caption="Se houver filhos, registre cada um com carinho para deixar o contexto completo." title="Familia" />
        <View style={sharedStyles.row}>
          <ChoiceChip label="Sem filhos" onPress={() => setHasChildren(false)} selected={!hasChildren} />
          <ChoiceChip
            label="Temos filhos"
            onPress={() => {
              setHasChildren(true);
              if (!childrenCount) {
                syncChildCount('1');
              }
            }}
            selected={hasChildren}
          />
        </View>
        {hasChildren ? (
          <>
            <TextField
              keyboardType="number-pad"
              label="Quantos filhos?"
              onChangeText={syncChildCount}
              placeholder="Ex.: 2"
              value={childrenCount}
            />
            {childDrafts.map((child, index) => (
              <InfoStripe key={`${index}-${child.name}`}>
                <Text style={sharedStyles.sectionTitle}>Filho {index + 1}</Text>
                <TextField
                  label="Nome"
                  onChangeText={(value) => updateChild(index, 'name', value)}
                  placeholder="Nome completo"
                  value={child.name}
                />
                <View style={sharedStyles.row}>
                  {childGenderOptions.map((option) => (
                    <ChoiceChip
                      key={`${index}-${option.value}`}
                      label={option.label}
                      onPress={() => updateChild(index, 'gender', option.value)}
                      selected={child.gender === option.value}
                    />
                  ))}
                </View>
                <TextField
                  label="Data de nascimento"
                  keyboardType="number-pad"
                  onChangeText={(value) => updateChild(index, 'birth_date', formatDateInput(value))}
                  placeholder="DD/MM/AAAA"
                  value={child.birth_date}
                />
              </InfoStripe>
            ))}
          </>
        ) : null}
        <TextField
          label="Por que voces decidiram usar o aplicativo?"
          multiline
          onChangeText={setReason}
          placeholder="Descrevam juntos a intencao de usar o app."
          value={reason}
        />
        <ActionButton fullWidth label="Salvar e abrir workspace" loading={loading} onPress={handleSave} />
      </SectionCard>
    </ScreenShell>
  );
}