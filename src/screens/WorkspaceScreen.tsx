import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import {
  ActionButton,
  ChoiceChip,
  EmptyState,
  InfoStripe,
  MetricPill,
  ProgressBar,
  ScreenShell,
  SectionCard,
  SectionTitle,
  SurfacePressable,
  TabSwitcher,
  TextField,
  Tag,
  sharedStyles,
} from '../components/ui';
import { brazilianDateToIsoDateTime, formatDateInput, isValidBrazilianDate, isoDateToBrazilian } from '../lib/date';
import { getLevelProgress } from '../lib/levels';
import { notifyPartnerTask } from '../lib/notifications';
import { supabase } from '../lib/supabase';
import {
  CoupleTask,
  CoupleWorkspace,
  CupidoTaskSuggestion,
  CupidoTaskSuggestionInput,
  TaskCategory,
  TaskDifficulty,
  TaskFrequency,
  Weekday,
} from '../types/app';

type WorkspaceScreenProps = {
  currentUserId: string;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
  tasks: CoupleTask[];
  workspace: CoupleWorkspace;
};

const difficultyOptions: { label: string; value: TaskDifficulty }[] = [
  { label: 'Facil', value: 'easy' },
  { label: 'Media', value: 'medium' },
  { label: 'Alta', value: 'hard' },
];

const frequencyOptions: { label: string; value: TaskFrequency }[] = [
  { label: 'Diario', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensal', value: 'monthly' },
  { label: 'Unica vez', value: 'one_time' },
  { label: 'Dias da semana', value: 'custom_weekdays' },
];

const categoryOptions: { label: string; value: TaskCategory }[] = [
  { label: 'Lazer', value: 'leisure' },
  { label: 'Esporte', value: 'sport' },
  { label: 'Compromisso', value: 'commitment' },
  { label: 'Filhos', value: 'children' },
  { label: 'Rotina', value: 'routine' },
  { label: 'Encontro amoroso', value: 'romantic_date' },
];

const weekdayOptions: { label: string; value: Weekday }[] = [
  { label: 'Seg', value: 'monday' },
  { label: 'Ter', value: 'tuesday' },
  { label: 'Qua', value: 'wednesday' },
  { label: 'Qui', value: 'thursday' },
  { label: 'Sex', value: 'friday' },
  { label: 'Sab', value: 'saturday' },
  { label: 'Dom', value: 'sunday' },
];

function frequencyLabel(frequency: TaskFrequency) {
  return frequencyOptions.find((option) => option.value === frequency)?.label ?? frequency;
}

function categoryLabel(category: TaskCategory) {
  return categoryOptions.find((option) => option.value === category)?.label ?? category;
}

function weekdayLabel(weekday: Weekday) {
  return weekdayOptions.find((option) => option.value === weekday)?.label ?? weekday;
}

function createSuggestionId(index: number) {
  return `${Date.now()}-${index}`;
}

export function WorkspaceScreen({ currentUserId, onRefresh, onSignOut, tasks, workspace }: WorkspaceScreenProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'cupido' | 'create' | 'tasks'>('overview');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('easy');
  const [frequency, setFrequency] = useState<TaskFrequency>('one_time');
  const [category, setCategory] = useState<TaskCategory>('routine');
  const [customWeekdays, setCustomWeekdays] = useState<Weekday[]>([]);
  const [dueAt, setDueAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRequestingCupido, setIsRequestingCupido] = useState(false);
  const [cupidoSuggestions, setCupidoSuggestions] = useState<CupidoTaskSuggestion[]>([]);

  const completedTasks = useMemo(() => tasks.filter((task) => task.completed), [tasks]);
  const openTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);
  const levelProgress = useMemo(() => getLevelProgress(workspace.xp_total), [workspace.xp_total]);

  useEffect(() => {
    const channel = supabase
      .channel(`workspace:${workspace.id}:tasks`)
      .on(
        'postgres_changes',
        {
          event: '*',
          filter: `workspace_id=eq.${workspace.id}`,
          schema: 'public',
          table: 'couple_tasks',
        },
        async (payload) => {
          if (
            payload.eventType === 'INSERT' &&
            payload.new &&
            payload.new.created_by !== currentUserId
          ) {
            await notifyPartnerTask('Nova tarefa para voces', payload.new.title);
          }

          await onRefresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, onRefresh, workspace.id]);

  function startEditing(task: CoupleTask) {
    setDraftId(task.id);
    setTitle(task.title);
    setDescription(task.description ?? '');
    setDifficulty(task.difficulty);
    setFrequency(task.frequency);
    setCategory(task.category);
    setCustomWeekdays(task.custom_weekdays ?? []);
    setDueAt(isoDateToBrazilian(task.due_at));
  }

  function resetComposer() {
    setDraftId(null);
    setTitle('');
    setDescription('');
    setDifficulty('easy');
    setFrequency('one_time');
    setCategory('routine');
    setCustomWeekdays([]);
    setDueAt('');
  }

  function toggleWeekday(weekday: Weekday) {
    setCustomWeekdays((currentValue) =>
      currentValue.includes(weekday)
        ? currentValue.filter((item) => item !== weekday)
        : weekdayOptions
            .map((option) => option.value)
            .filter((option) => [...currentValue, weekday].includes(option)),
    );
  }

  function selectFrequency(nextFrequency: TaskFrequency) {
    setFrequency(nextFrequency);

    if (nextFrequency !== 'custom_weekdays') {
      setCustomWeekdays([]);
    }
  }

  async function saveTask() {
    if (!title.trim()) {
      Alert.alert('Titulo obrigatorio', 'Informe um titulo para a tarefa.');
      return;
    }

    if (dueAt && !isValidBrazilianDate(dueAt)) {
      Alert.alert('Prazo invalido', 'Use o formato DD/MM/AAAA para o prazo.');
      return;
    }

    if (frequency === 'custom_weekdays' && customWeekdays.length === 0) {
      Alert.alert('Dias obrigatorios', 'Selecione pelo menos um dia da semana para essa frequencia.');
      return;
    }

    setLoading(true);

    try {
      const dueAtIso = dueAt ? brazilianDateToIsoDateTime(dueAt) : null;
      const taskPayload = {
        category,
        custom_weekdays: frequency === 'custom_weekdays' ? customWeekdays : null,
        description: description.trim() || null,
        difficulty,
        due_at: dueAtIso,
        frequency,
        title: title.trim(),
        updated_by: currentUserId,
      };

      if (draftId) {
        const { error } = await supabase
          .from('couple_tasks')
          .update(taskPayload)
          .eq('id', draftId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('couple_tasks').insert({
          category,
          created_by: currentUserId,
          custom_weekdays: frequency === 'custom_weekdays' ? customWeekdays : null,
          description: description.trim() || null,
          difficulty,
          due_at: dueAtIso,
          frequency,
          title: title.trim(),
          workspace_id: workspace.id,
        });

        if (error) {
          throw error;
        }
      }

      resetComposer();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel salvar a tarefa.';
      Alert.alert('Erro ao salvar tarefa', message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(task: CoupleTask) {
    try {
      const { error } = await supabase
        .from('couple_tasks')
        .update({ completed: !task.completed, updated_by: currentUserId })
        .eq('id', task.id);

      if (error) {
        throw error;
      }

      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel atualizar a tarefa.';
      Alert.alert('Erro ao atualizar tarefa', message);
    }
  }

  async function deleteTask(taskId: string) {
    try {
      const { error } = await supabase.from('couple_tasks').delete().eq('id', taskId);

      if (error) {
        throw error;
      }

      if (draftId === taskId) {
        resetComposer();
      }

      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel remover a tarefa.';
      Alert.alert('Erro ao remover tarefa', message);
    }
  }

  async function requestCupidoSuggestions() {
    setIsRequestingCupido(true);

    try {
      const { data, error } = await supabase.functions.invoke('cupido-suggestions', {
        body: { workspaceId: workspace.id },
      });

      if (error) {
        throw error;
      }

      const suggestions = ((data?.suggestions ?? []) as CupidoTaskSuggestionInput[]).map((suggestion, index) => ({
        ...suggestion,
        id: createSuggestionId(index),
      }));

      setCupidoSuggestions(suggestions);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel pedir sugestoes para o Cupido.';
      Alert.alert('Erro ao falar com o Cupido', message);
    } finally {
      setIsRequestingCupido(false);
    }
  }

  function acceptCupidoSuggestion(suggestion: CupidoTaskSuggestion) {
    setDraftId(null);
    setTitle(suggestion.title);
    setDescription(suggestion.description ?? '');
    setDifficulty('easy');
    setFrequency('one_time');
    setCategory('routine');
    setCustomWeekdays([]);
    setDueAt('');
    setCupidoSuggestions((currentValue) => currentValue.filter((item) => item.id !== suggestion.id));
    setActiveTab('create');
    Alert.alert('Sugestao aplicada', 'Agora escolha categoria, dificuldade e frequencia ou prazo antes de salvar a tarefa.');
  }

  function dismissCupidoSuggestion(suggestionId: string) {
    setCupidoSuggestions((currentValue) => currentValue.filter((item) => item.id !== suggestionId));
  }

  return (
    <ScreenShell
      subtitle="O workspace agora fica dividido por contexto: progresso, sugestoes, criacao e acompanhamento."
      title="Agenda do casal"
      footer={
        <>
          <ActionButton label="Sair" onPress={() => void onSignOut()} variant="ghost" />
        </>
      }>
      <TabSwitcher
        items={[
          { key: 'overview', label: 'Painel' },
          { key: 'cupido', label: 'Cupido' },
          { key: 'create', label: draftId ? 'Editar' : 'Nova' },
          { key: 'tasks', label: 'Tarefas' },
        ]}
        onChange={(value) => setActiveTab(value as 'overview' | 'cupido' | 'create' | 'tasks')}
        value={activeTab}
      />

      {activeTab === 'overview' ? (
        <SectionCard>
          <SectionTitle caption="Um resumo rapido para voce saber onde o casal esta agora." title="Painel" />
          <View style={sharedStyles.row}>
            <MetricPill label="Nivel" value={String(workspace.level)} />
            <MetricPill label="XP total" value={String(workspace.xp_total)} />
            <MetricPill label="Concluidas" value={String(completedTasks.length)} />
          </View>
          <ProgressBar
            caption={`${levelProgress.remainingXp} XP para o proximo nivel`}
            progress={levelProgress.progressRatio}
            title={`Nivel ${levelProgress.currentLevel}`}
            valueLabel={`${levelProgress.progressWithinLevel}/${levelProgress.levelSpan} XP`}
          />
          {openTasks[0] ? (
            <InfoStripe>
              <Text style={sharedStyles.sectionTitle}>Proxima tarefa em foco</Text>
              <Text style={sharedStyles.supportingText}>{openTasks[0].title}</Text>
              {openTasks[0].description ? <Text style={sharedStyles.supportingText}>{openTasks[0].description}</Text> : null}
            </InfoStripe>
          ) : (
            <EmptyState description="Assim que a primeira tarefa nascer, ela aparece aqui como foco principal." title="Nada em foco agora" />
          )}
        </SectionCard>
      ) : null}

      {activeTab === 'cupido' ? (
        <SectionCard>
          <SectionTitle
            caption="O Cupido devolve ideias simples. Se alguma fizer sentido, voce completa os detalhes e salva."
            title="Sugestoes do Cupido"
          />
          <ActionButton
            label="Pedir sugestoes de tarefa pro Cupido"
            loading={isRequestingCupido}
            onPress={requestCupidoSuggestions}
          />
          {cupidoSuggestions.length === 0 ? (
            <EmptyState
              description="Quando voce pedir, o Cupido devolve 5 ideias de tarefa prontas para revisar."
              title="Nenhuma sugestao carregada"
            />
          ) : (
            cupidoSuggestions.map((suggestion) => (
              <InfoStripe key={suggestion.id}>
                <Text style={sharedStyles.sectionTitle}>{suggestion.title}</Text>
                {suggestion.description ? <Text style={sharedStyles.supportingText}>{suggestion.description}</Text> : null}
                <View style={sharedStyles.row}>
                  <ActionButton
                    label="Usar no formulario"
                    onPress={() => acceptCupidoSuggestion(suggestion)}
                  />
                  <ActionButton
                    label="Desconsiderar"
                    onPress={() => dismissCupidoSuggestion(suggestion.id)}
                    variant="secondary"
                  />
                </View>
              </InfoStripe>
            ))
          )}
        </SectionCard>
      ) : null}

      {activeTab === 'create' ? (
        <SectionCard>
          <SectionTitle caption="Escolha os detalhes com calma antes de adicionar ao fluxo do casal." title={draftId ? 'Editar tarefa' : 'Nova tarefa'} />
          <TextField label="Titulo" onChangeText={setTitle} placeholder="Ex.: Planejar encontro da semana" value={title} />
          <TextField
            label="Descricao"
            multiline
            onChangeText={setDescription}
            placeholder="Detalhes, contexto ou como executar a tarefa."
            value={description}
          />
          <TextField
            keyboardType="number-pad"
            label="Prazo"
            onChangeText={(value) => setDueAt(formatDateInput(value))}
            placeholder="DD/MM/AAAA"
            value={dueAt}
          />
          <Text style={sharedStyles.sectionTitle}>Dificuldade</Text>
          <View style={sharedStyles.row}>
            {difficultyOptions.map((option) => (
              <ChoiceChip
                key={option.value}
                label={option.label}
                onPress={() => setDifficulty(option.value)}
                selected={difficulty === option.value}
              />
            ))}
          </View>
          <Text style={sharedStyles.sectionTitle}>Frequencia</Text>
          <View style={sharedStyles.row}>
            {frequencyOptions.map((option) => (
              <ChoiceChip
                key={option.value}
                label={option.label}
                onPress={() => selectFrequency(option.value)}
                selected={frequency === option.value}
              />
            ))}
          </View>
          {frequency === 'custom_weekdays' ? (
            <>
              <Text style={sharedStyles.sectionTitle}>Dias da semana</Text>
              <View style={sharedStyles.row}>
                {weekdayOptions.map((option) => (
                  <ChoiceChip
                    key={option.value}
                    label={option.label}
                    onPress={() => toggleWeekday(option.value)}
                    selected={customWeekdays.includes(option.value)}
                  />
                ))}
              </View>
            </>
          ) : null}
          <Text style={sharedStyles.sectionTitle}>Categoria</Text>
          <View style={sharedStyles.row}>
            {categoryOptions.map((option) => (
              <ChoiceChip
                key={option.value}
                label={option.label}
                onPress={() => setCategory(option.value)}
                selected={category === option.value}
              />
            ))}
          </View>
          <View style={sharedStyles.row}>
            <ActionButton label={draftId ? 'Salvar alteracoes' : 'Adicionar tarefa'} loading={loading} onPress={saveTask} />
            {(draftId || title || description) ? <ActionButton label="Limpar" onPress={resetComposer} variant="secondary" /> : null}
          </View>
        </SectionCard>
      ) : null}

      {activeTab === 'tasks' ? (
        <>
          <SectionCard>
            <SectionTitle caption="Tudo o que ainda pede atencao aparece aqui primeiro." title="Em andamento" />
            {openTasks.length === 0 ? (
              <EmptyState description="Crie a primeira tarefa e o espaco ganha vida imediatamente." title="Nenhuma tarefa aberta" />
            ) : (
              openTasks.map((task) => (
                <SurfacePressable key={task.id} onPress={() => startEditing(task)}>
                  <View style={sharedStyles.row}>
                    <Tag label={categoryLabel(task.category)} />
                    <Tag label={frequencyLabel(task.frequency)} />
                    <Tag label={task.difficulty === 'easy' ? 'Leve' : task.difficulty === 'medium' ? 'Medio' : 'Intenso'} />
                    <Tag label={`${task.points} XP`} />
                    {task.due_at ? <Tag label={`Prazo ${new Date(task.due_at).toLocaleDateString('pt-BR')}`} /> : null}
                  </View>
                  <Text style={sharedStyles.sectionTitle}>{task.title}</Text>
                  {task.description ? <Text style={sharedStyles.supportingText}>{task.description}</Text> : null}
                  {task.frequency === 'custom_weekdays' && task.custom_weekdays?.length ? (
                    <Text style={sharedStyles.supportingText}>
                      Dias: {task.custom_weekdays.map((weekday) => weekdayLabel(weekday)).join(', ')}
                    </Text>
                  ) : null}
                  <View style={sharedStyles.row}>
                    <ActionButton label="Concluir" onPress={() => void toggleTask(task)} />
                    <ActionButton
                      label="Editar"
                      onPress={() => {
                        startEditing(task);
                        setActiveTab('create');
                      }}
                      variant="secondary"
                    />
                    <ActionButton label="Excluir" onPress={() => void deleteTask(task.id)} variant="danger" />
                  </View>
                </SurfacePressable>
              ))
            )}
          </SectionCard>

          <SectionCard>
            <SectionTitle caption="Tudo o que ja foi cuidado permanece registrado como memoria de avancos." title="Concluidas" />
            {completedTasks.length === 0 ? (
              <EmptyState description="Quando algo for finalizado, ele aparece aqui como parte da historia de voces." title="Nada concluido ainda" />
            ) : (
              completedTasks.map((task) => (
                <InfoStripe key={task.id}>
                  <Text style={sharedStyles.sectionTitle}>{task.title}</Text>
                  <Text style={sharedStyles.supportingText}>
                    Concluida em {task.completed_at ? new Date(task.completed_at).toLocaleDateString('pt-BR') : '-'} • {task.points} XP
                  </Text>
                  <Text style={sharedStyles.supportingText}>
                    {categoryLabel(task.category)} • {frequencyLabel(task.frequency)}
                    {task.frequency === 'custom_weekdays' && task.custom_weekdays?.length
                      ? ` • ${task.custom_weekdays.map((weekday) => weekdayLabel(weekday)).join(', ')}`
                      : ''}
                  </Text>
                  <View style={sharedStyles.row}>
                    <ActionButton label="Reabrir" onPress={() => void toggleTask(task)} variant="secondary" />
                  </View>
                </InfoStripe>
              ))
            )}
          </SectionCard>
        </>
      ) : null}
    </ScreenShell>
  );
}