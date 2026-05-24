import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import {
  ActionButton,
  EmptyState,
  InfoStripe,
  ScreenShell,
  SectionCard,
  SectionTitle,
  TextField,
  TokenPill,
  sharedStyles,
} from '../components/ui';
import { supabase } from '../lib/supabase';
import { PartnerLookup, PartnershipInvitation, Profile } from '../types/app';

type ConnectionHomeScreenProps = {
  currentUserId: string;
  invitations: PartnershipInvitation[];
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
  profile: Profile;
};

export function ConnectionHomeScreen({
  currentUserId,
  invitations,
  onRefresh,
  onSignOut,
  profile,
}: ConnectionHomeScreenProps) {
  const [partnerToken, setPartnerToken] = useState('');
  const [partnerLookup, setPartnerLookup] = useState<PartnerLookup | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const incomingInvites = useMemo(
    () => invitations.filter((invitation) => invitation.invitee_id === currentUserId),
    [currentUserId, invitations],
  );

  const outgoingInvites = useMemo(
    () => invitations.filter((invitation) => invitation.inviter_id === currentUserId),
    [currentUserId, invitations],
  );

  async function searchPartner() {
    if (!partnerToken.trim()) {
      Alert.alert('Token obrigatorio', 'Informe o token do seu parceiro para buscar.');
      return;
    }

    setIsSearching(true);

    try {
      const { data, error } = await supabase.rpc('lookup_partner_by_invite_code', {
        partner_invite_code: partnerToken.trim().toUpperCase(),
      });

      if (error) {
        throw error;
      }

      const foundPartner = ((data ?? [])[0] ?? null) as PartnerLookup | null;

      if (!foundPartner) {
        Alert.alert('Token nao encontrado', 'Nenhum parceiro foi encontrado com esse token.');
        setPartnerLookup(null);
        return;
      }

      setPartnerLookup(foundPartner);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel buscar o token informado.';
      Alert.alert('Erro ao buscar token', message);
    } finally {
      setIsSearching(false);
    }
  }

  async function sendInvite() {
    if (!partnerLookup && !partnerToken.trim()) {
      Alert.alert('Token obrigatorio', 'Busque ou informe o token antes de enviar o convite.');
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase.rpc('send_partnership_invite', {
        partner_invite_code: (partnerLookup?.personal_invite_code ?? partnerToken).trim().toUpperCase(),
      });

      if (error) {
        throw error;
      }

      setPartnerLookup(null);
      setPartnerToken('');
      Alert.alert('Convite enviado', 'Agora o parceiro precisa aceitar para criar o workspace do casal.');
      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel enviar o convite.';
      Alert.alert('Erro ao enviar convite', message);
    } finally {
      setIsSending(false);
    }
  }

  async function answerInvite(invitationId: string, acceptInvitation: boolean) {
    setRespondingId(invitationId);

    try {
      const { error } = await supabase.rpc('respond_to_partnership_invite', {
        accept_invitation: acceptInvitation,
        target_invitation_id: invitationId,
      });

      if (error) {
        throw error;
      }

      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel responder ao convite.';
      Alert.alert('Erro ao responder convite', message);
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <ScreenShell
      subtitle="Esse primeiro passo conecta as duas pessoas no mesmo espaco e libera a jornada em conjunto."
      title="Conectar voces dois"
      footer={
        <>
          <ActionButton label="Sair" onPress={() => void onSignOut()} variant="ghost" />
        </>
      }>
      <SectionCard>
        <SectionTitle caption="Compartilhe este codigo com quem vai construir tudo com voce aqui." title="Seu convite" />
        <TokenPill value={profile.personal_invite_code} />
      </SectionCard>

      <SectionCard>
        <SectionTitle caption="Se voce ja recebeu um codigo, cole abaixo para encontrar a pessoa certa." title="Procurar parceiro" />
        <TextField
          autoCapitalize="characters"
          label="Token do parceiro"
          onChangeText={(value) => {
            setPartnerToken(value);
            setPartnerLookup(null);
          }}
          placeholder="Ex.: A1B2C3D4"
          value={partnerToken}
        />
        <View style={sharedStyles.row}>
          <ActionButton label="Buscar token" loading={isSearching} onPress={searchPartner} variant="secondary" />
          <ActionButton
            disabled={outgoingInvites.length > 0}
            label={outgoingInvites.length > 0 ? 'Aguardando resposta' : 'Enviar convite'}
            loading={isSending}
            onPress={sendInvite}
          />
        </View>
        {partnerLookup ? (
          <InfoStripe>
            <Text style={sharedStyles.sectionTitle}>Par encontrado</Text>
            <Text style={sharedStyles.supportingText}>
              {partnerLookup.full_name} foi encontrado com sucesso. Se estiver tudo certo, envie o convite.
            </Text>
          </InfoStripe>
        ) : null}
      </SectionCard>

      <SectionCard>
        <SectionTitle caption="Quando alguem te convidar, a decisao aparece aqui." title="Convites recebidos" />
        {incomingInvites.length === 0 ? (
          <EmptyState
            description="Assim que um convite chegar, voce pode aceitar e seguir para o questionario inicial." 
            title="Nenhum convite recebido"
          />
        ) : (
          incomingInvites.map((invitation) => (
            <View key={invitation.id} style={{ gap: 10 }}>
              <Text style={sharedStyles.sectionTitle}>
                {invitation.inviter_name
                  ? `${invitation.inviter_name} quer se conectar com voce.`
                  : 'Voce recebeu um convite para se conectar.'}
              </Text>
              <Text style={sharedStyles.supportingText}>
                Convite recebido em {new Date(invitation.created_at).toLocaleDateString('pt-BR')}.
              </Text>
              <View style={sharedStyles.row}>
                <ActionButton
                  label="Aceitar"
                  loading={respondingId === invitation.id}
                  onPress={() => void answerInvite(invitation.id, true)}
                />
                <ActionButton
                  label="Recusar"
                  loading={respondingId === invitation.id}
                  onPress={() => void answerInvite(invitation.id, false)}
                  variant="danger"
                />
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard>
        <SectionTitle caption="Assim voce sabe quando ja existe algo aguardando resposta." title="Convites enviados" />
        {outgoingInvites.length === 0 ? (
          <EmptyState description="Nenhum convite em aberto no momento." title="Sem pendencias" />
        ) : (
          outgoingInvites.map((invitation) => (
            <Text key={invitation.id} style={sharedStyles.supportingText}>
              Convite pendente desde {new Date(invitation.created_at).toLocaleDateString('pt-BR')}.
            </Text>
          ))
        )}
      </SectionCard>
    </ScreenShell>
  );
}