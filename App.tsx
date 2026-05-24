import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { AuthScreen } from './src/screens/AuthScreen';
import { ConnectionHomeScreen } from './src/screens/ConnectionHomeScreen';
import { CoupleQuestionnaireScreen } from './src/screens/CoupleQuestionnaireScreen';
import { IndividualQuestionnaireScreen } from './src/screens/IndividualQuestionnaireScreen';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { WorkspaceScreen } from './src/screens/WorkspaceScreen';
import { LoadingScreen } from './src/components/ui';
import { prepareNotifications } from './src/lib/notifications';
import { supabase } from './src/lib/supabase';
import {
  AppData,
  CoupleChild,
  CoupleTask,
  CoupleWorkspace,
  PartnershipInvitation,
  Profile,
  UserQuestionnaire,
} from './src/types/app';

function isMissingRow(error: { code?: string } | null) {
  return error?.code === 'PGRST116';
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    void prepareNotifications();
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) {
        return;
      }

      setSession(currentSession);
      if (!currentSession) {
        setIsBootstrapping(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (!nextSession) {
        setAppData(null);
        setIsBootstrapping(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user.id) {
      return;
    }

    void loadAppData(session.user.id);
  }, [session?.user.id]);

  async function loadAppData(userId: string, options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsBootstrapping(true);
    }

    try {
      const [profileResult, questionnaireResult, invitationsResult, membershipResult] =
        await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          supabase.from('user_questionnaires').select('*').eq('user_id', userId).maybeSingle(),
          supabase
            .from('partnership_invitations')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false }),
          supabase
            .from('couple_memberships')
            .select('workspace_id')
            .eq('user_id', userId)
            .maybeSingle(),
        ]);

      if (profileResult.error && !isMissingRow(profileResult.error)) {
        throw profileResult.error;
      }

      if (questionnaireResult.error && !isMissingRow(questionnaireResult.error)) {
        throw questionnaireResult.error;
      }

      if (membershipResult.error && !isMissingRow(membershipResult.error)) {
        throw membershipResult.error;
      }

      if (invitationsResult.error) {
        throw invitationsResult.error;
      }

      const profile = (profileResult.data ?? null) as Profile | null;
      const userQuestionnaire = (questionnaireResult.data ?? null) as UserQuestionnaire | null;
      const invitations = (invitationsResult.data ?? []) as PartnershipInvitation[];

      let children: CoupleChild[] = [];
      let workspace: CoupleWorkspace | null = null;
      let tasks: CoupleTask[] = [];

      if (membershipResult.data?.workspace_id) {
        const [workspaceResult, tasksResult, childrenResult] = await Promise.all([
          supabase
            .from('couple_workspaces')
            .select('*')
            .eq('id', membershipResult.data.workspace_id)
            .single(),
          supabase
            .from('couple_tasks')
            .select('*')
            .eq('workspace_id', membershipResult.data.workspace_id)
            .order('due_at', { ascending: true, nullsFirst: false })
            .order('completed', { ascending: true })
            .order('created_at', { ascending: false }),
          supabase
            .from('couple_children')
            .select('*')
            .eq('workspace_id', membershipResult.data.workspace_id)
            .order('sort_order', { ascending: true }),
        ]);

        if (workspaceResult.error) {
          throw workspaceResult.error;
        }

        if (tasksResult.error) {
          throw tasksResult.error;
        }

        if (childrenResult.error) {
          throw childrenResult.error;
        }

        workspace = workspaceResult.data as CoupleWorkspace;
        children = (childrenResult.data ?? []) as CoupleChild[];
        tasks = (tasksResult.data ?? []) as CoupleTask[];
      }

      setAppData({
        children,
        profile,
        invitations,
        tasks,
        userQuestionnaire,
        workspace,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel carregar os dados do aplicativo.';
      Alert.alert('Erro ao carregar', message);
    } finally {
      if (!options?.silent) {
        setIsBootstrapping(false);
      }
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('Erro ao sair', error.message);
    }
  }

  const currentUserId = session?.user.id ?? null;
  const children = appData?.children ?? [];
  const profile = appData?.profile ?? null;
  const workspace = appData?.workspace ?? null;
  const userQuestionnaire = appData?.userQuestionnaire ?? null;
  const tasks = appData?.tasks ?? [];
  const invitations = appData?.invitations ?? [];

  const profileNeedsSetup = Boolean(
    session?.user && (!profile?.full_name || !profile?.birth_date),
  );

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        {isBootstrapping ? <LoadingScreen label="Carregando sua jornada a dois..." /> : null}

        {!isBootstrapping && !session ? (
          <AuthScreen onAuthenticated={() => undefined} />
        ) : null}

        {!isBootstrapping && session && currentUserId && profileNeedsSetup ? (
          <ProfileSetupScreen
            profile={profile}
            onRefresh={() => loadAppData(currentUserId, { silent: true })}
            onSignOut={signOut}
          />
        ) : null}

        {!isBootstrapping && session && currentUserId && profile && !profileNeedsSetup && !workspace ? (
          <ConnectionHomeScreen
            currentUserId={currentUserId}
            invitations={invitations}
            profile={profile}
            onRefresh={() => loadAppData(currentUserId, { silent: true })}
            onSignOut={signOut}
          />
        ) : null}

        {!isBootstrapping && session && currentUserId && profile && workspace && !userQuestionnaire ? (
          <IndividualQuestionnaireScreen
            currentUserId={currentUserId}
            onRefresh={() => loadAppData(currentUserId, { silent: true })}
            onSignOut={signOut}
          />
        ) : null}

        {!isBootstrapping && session && currentUserId && profile && workspace && userQuestionnaire && !workspace.questionnaire_completed_at ? (
          <CoupleQuestionnaireScreen
            children={children}
            workspace={workspace}
            onRefresh={() => loadAppData(currentUserId, { silent: true })}
            onSignOut={signOut}
          />
        ) : null}

        {!isBootstrapping && session && currentUserId && profile && workspace && userQuestionnaire && workspace.questionnaire_completed_at ? (
          <WorkspaceScreen
            currentUserId={currentUserId}
            onRefresh={() => loadAppData(currentUserId, { silent: true })}
            onSignOut={signOut}
            tasks={tasks}
            workspace={workspace}
          />
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}
