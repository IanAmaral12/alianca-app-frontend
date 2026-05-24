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
  TextField,
  Tag,
  sharedStyles,
} from '../components/ui';
import { brazilianDateToIsoDateTime, formatDateInput, isValidBrazilianDate, isoDateToBrazilian } from '../lib/date';
import { getLevelProgress } from '../lib/levels';
import { notifyPartnerTask } from '../lib/notifications';
import { supabase } from '../lib/supabase';
import { CoupleTask, CoupleWorkspace, TaskDifficulty } from '../types/app';

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

export function WorkspaceScreen({ currentUserId, onRefresh, onSignOut, tasks, workspace }: WorkspaceScreenProps) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('easy');
  const [dueAt, setDueAt] = useState('');
  const [loading, setLoading] = useState(false);

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
    setDueAt(isoDateToBrazilian(task.due_at));
  }

  function resetComposer() {
    setDraftId(null);
    setTitle('');
    setDescription('');
    setDifficulty('easy');
    setDueAt('');
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

    setLoading(true);

    try {
      const dueAtIso = dueAt ? brazilianDateToIsoDateTime(dueAt) : null;

      if (draftId) {
        const { error } = await supabase
          .from('couple_tasks')
          .update({
            description: description.trim() || null,
            difficulty,
            due_at: dueAtIso,
            title: title.trim(),
            updated_by: currentUserId,
          })
          .eq('id', draftId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('couple_tasks').insert({
          created_by: currentUserId,
          description: description.trim() || null,
          difficulty,
          due_at: dueAtIso,
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

  return (
    <ScreenShell
      subtitle="Organizem o que importa agora, acompanhem o ritmo da semana e avancem juntos no mesmo compasso."
      title="Agenda do casal"
      footer={
        <>
          <ActionButton label="Sair" onPress={() => void onSignOut()} variant="ghost" />
        </>
      }>
      <SectionCard>
        <SectionTitle caption="Cada tarefa concluida ajuda a abrir o proximo degrau da jornada." title="Seu ritmo atual" />
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
      </SectionCard>

      <SectionCard>
        <SectionTitle caption="Planejem algo simples ou algo especial. O importante e manter o movimento." title={draftId ? 'Editar tarefa' : 'Nova tarefa'} />
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
        <View style={sharedStyles.row}>
          <ActionButton label={draftId ? 'Salvar alteracoes' : 'Adicionar tarefa'} loading={loading} onPress={saveTask} />
          {draftId ? <ActionButton label="Cancelar edicao" onPress={resetComposer} variant="secondary" /> : null}
        </View>
      </SectionCard>

      <SectionCard>
        <SectionTitle caption="Tudo o que ainda pede atencao aparece aqui primeiro." title="Em andamento" />
        {openTasks.length === 0 ? (
          <EmptyState description="Crie a primeira tarefa e o espaco ganha vida imediatamente." title="Nenhuma tarefa aberta" />
        ) : (
          openTasks.map((task) => (
            <SurfacePressable key={task.id} onPress={() => startEditing(task)}>
              <View style={sharedStyles.row}>
                <Tag label={task.difficulty === 'easy' ? 'Leve' : task.difficulty === 'medium' ? 'Medio' : 'Intenso'} />
                <Tag label={`${task.points} XP`} />
                {task.due_at ? <Tag label={`Prazo ${new Date(task.due_at).toLocaleDateString('pt-BR')}`} /> : null}
              </View>
              <Text style={sharedStyles.sectionTitle}>{task.title}</Text>
              {task.description ? <Text style={sharedStyles.supportingText}>{task.description}</Text> : null}
              <View style={sharedStyles.row}>
                <ActionButton label="Concluir" onPress={() => void toggleTask(task)} />
                <ActionButton label="Editar" onPress={() => startEditing(task)} variant="secondary" />
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
              <View style={sharedStyles.row}>
                <ActionButton label="Reabrir" onPress={() => void toggleTask(task)} variant="secondary" />
              </View>
            </InfoStripe>
          ))
        )}
      </SectionCard>
    </ScreenShell>
  );
}