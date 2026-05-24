export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
export type RelationshipStage = 'dating' | 'engaged' | 'married';
export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskFrequency = 'daily' | 'weekly' | 'monthly' | 'one_time' | 'custom_weekdays';
export type TaskCategory = 'leisure' | 'sport' | 'commitment' | 'children' | 'routine' | 'romantic_date';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type ChildGender = 'female' | 'male' | 'nonbinary' | 'prefer_not_to_say';

export type Profile = {
  birth_date: string | null;
  connected_at: string | null;
  created_at: string;
  email: string;
  full_name: string | null;
  id: string;
  personal_invite_code: string;
  updated_at: string;
};

export type PartnershipInvitation = {
  created_at: string;
  id: string;
  invitee_id: string;
  inviter_name?: string | null;
  inviter_id: string;
  responded_at: string | null;
  status: InvitationStatus;
  updated_at: string;
  workspace_id: string | null;
};

export type UserQuestionnaire = {
  completed_at: string;
  created_at: string;
  partner_admired_trait: string;
  relationship_definition: string;
  self_trait_partner_admires: string;
  updated_at: string;
  user_id: string;
};

export type CoupleWorkspace = {
  children_count: number | null;
  created_at: string;
  created_by: string;
  dating_since: string | null;
  engaged_since: string | null;
  has_children: boolean | null;
  id: string;
  level: number;
  married_since: string | null;
  xp_total: number;
  questionnaire_completed_at: string | null;
  relation_stage: RelationshipStage | null;
  started_using_reason: string | null;
  updated_at: string;
};

export type CoupleChild = {
  birth_date: string;
  created_at: string;
  gender: ChildGender;
  id: string;
  name: string;
  sort_order: number;
  updated_at: string;
  workspace_id: string;
};

export type CoupleTask = {
  category: TaskCategory;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  created_by: string;
  custom_weekdays: Weekday[] | null;
  description: string | null;
  difficulty: TaskDifficulty;
  due_at: string | null;
  frequency: TaskFrequency;
  id: string;
  points: number;
  title: string;
  updated_at: string;
  updated_by: string | null;
  workspace_id: string;
};

export type CupidoTaskSuggestionInput = {
  description: string | null;
  title: string;
};

export type CupidoTaskSuggestion = CupidoTaskSuggestionInput & {
  id: string;
};

export type PartnerLookup = {
  full_name: string;
  personal_invite_code: string;
  profile_id: string;
};

export type AppData = {
  children: CoupleChild[];
  invitations: PartnershipInvitation[];
  profile: Profile | null;
  tasks: CoupleTask[];
  userQuestionnaire: UserQuestionnaire | null;
  workspace: CoupleWorkspace | null;
};