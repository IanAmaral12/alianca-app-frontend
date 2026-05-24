import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, radii, spacing, typography } from '../theme';

type ScreenShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  subtitle: string;
  title: string;
  eyebrow?: string;
};

type ButtonProps = {
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string;
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

type TextFieldProps = TextInputProps & {
  label: string;
};

type ChoiceChipProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
};

type TabSwitcherProps = {
  items: Array<{ key: string; label: string }>;
  onChange: (key: string) => void;
  value: string;
};

type MetricPillProps = {
  label: string;
  value: string;
};

export function ScreenShell({ children, footer, subtitle, title, eyebrow = 'Alianca' }: ScreenShellProps) {
  return (
    <LinearGradient colors={['#FFFBE0', palette.surface, '#FFFFFF']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.heroCard}>
            <Text style={styles.kicker}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.stack}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export function SectionCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function SectionTitle({ title, caption }: { caption?: string; title: string }) {
  return (
    <View style={styles.sectionHeadingWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
    </View>
  );
}

export function TextField({ label, multiline, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        placeholderTextColor={palette.muted}
        style={[styles.input, multiline ? styles.textArea : null, style]}
        {...props}
      />
    </View>
  );
}

export function ActionButton({ disabled, fullWidth, icon, label, loading, onPress, variant = 'primary' }: ButtonProps) {
  const backgroundColor =
    variant === 'primary'
      ? palette.accent
      : variant === 'danger'
        ? palette.danger
        : variant === 'secondary'
          ? palette.surfaceAlt
          : 'transparent';

  const textColor = variant === 'danger' ? palette.white : palette.ink;

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fullWidth ? styles.fullWidth : null,
        { backgroundColor },
        variant === 'secondary' ? styles.secondaryButton : null,
        variant === 'ghost' ? styles.ghostButton : null,
        (disabled || loading) ? styles.buttonDisabled : null,
        pressed ? styles.buttonPressed : null,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>
          {icon ? `${icon} ` : ''}
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function ChoiceChip({ label, onPress, selected }: ChoiceChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected ? styles.chipSelected : null]}>
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

export function TabSwitcher({ items, onChange, value }: TabSwitcherProps) {
  return (
    <View style={styles.tabSwitcher}>
      {items.map((item) => {
        const selected = item.key === value;

        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.tabItem, selected ? styles.tabItemSelected : null]}>
            <Text style={[styles.tabItemText, selected ? styles.tabItemTextSelected : null]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MetricPill({ label, value }: MetricPillProps) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function TokenPill({ value }: { value: string }) {
  return (
    <View style={styles.tokenPill}>
      <Text style={styles.tokenLabel}>Token do casal</Text>
      <Text style={styles.tokenValue}>{value}</Text>
    </View>
  );
}

export function EmptyState({ title, description }: { description: string; title: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

export function LoadingScreen({ label }: { label: string }) {
  return (
    <ScreenShell subtitle="Estamos preparando um espaco tranquilo para voce entrar." title="Abrindo sua experiencia">
      <SectionCard>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={palette.accentDeep} size="large" />
          <Text style={styles.loadingText}>{label}</Text>
        </View>
      </SectionCard>
    </ScreenShell>
  );
}

export function ProgressBar({ caption, progress, title, valueLabel }: { caption: string; progress: number; title: string; valueLabel: string }) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>{title}</Text>
        <Text style={styles.progressValue}>{valueLabel}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(4, progress * 100)}%` }]} />
      </View>
      <Text style={styles.progressCaption}>{caption}</Text>
    </View>
  );
}

export function InfoStripe({ children }: { children: ReactNode }) {
  return <View style={styles.infoStripe}>{children}</View>;
}

export function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

export function SurfacePressable({ children, ...props }: PressableProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.surfacePressable, pressed ? styles.buttonPressed : null]}>
      {children}
    </Pressable>
  );
}

export const sharedStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: palette.ink,
    fontFamily: typography.heading,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  supportingText: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  stackSm: {
    gap: spacing.sm,
  },
});

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.pill,
    boxShadow: '0px 10px 20px rgba(17, 17, 17, 0.10)',
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    boxShadow: '0px 18px 32px rgba(17, 17, 17, 0.08)',
  },
  chip: {
    backgroundColor: palette.surfaceAlt,
    borderColor: palette.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.borderStrong,
  },
  chipText: {
    color: palette.ink,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: palette.ink,
  },
  emptyDescription: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: palette.ink,
    fontFamily: typography.heading,
    fontSize: 22,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  footer: {
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  ghostButton: {
    alignSelf: 'flex-start',
    minHeight: 32,
    paddingHorizontal: 0,
  },
  gradient: {
    flex: 1,
  },
  input: {
    backgroundColor: palette.surfaceAlt,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  kicker: {
    color: palette.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  loadingText: {
    color: palette.muted,
    fontSize: 15,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  metricLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricPill: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.md,
    minWidth: 112,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metricValue: {
    color: palette.ink,
    fontFamily: typography.heading,
    fontSize: 24,
  },
  heroCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    boxShadow: '0px 20px 36px rgba(17, 17, 17, 0.08)',
  },
  infoStripe: {
    backgroundColor: palette.mist,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  progressCaption: {
    color: palette.muted,
    fontSize: 13,
  },
  progressFill: {
    backgroundColor: palette.accent,
    borderRadius: radii.pill,
    height: 10,
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  progressTrack: {
    backgroundColor: palette.primaryGlow,
    borderRadius: radii.pill,
    height: 10,
    overflow: 'hidden',
  },
  progressValue: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  progressWrap: {
    gap: spacing.sm,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionCaption: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeadingWrap: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: palette.ink,
    fontFamily: typography.heading,
    fontSize: 26,
    fontWeight: '800',
  },
  secondaryButton: {
    borderColor: palette.border,
    borderWidth: 1,
  },
  stack: {
    gap: spacing.md,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  surfacePressable: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tabItemSelected: {
    backgroundColor: palette.accent,
  },
  tabItemText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  tabItemTextSelected: {
    color: palette.ink,
  },
  tabSwitcher: {
    backgroundColor: palette.surfaceAlt,
    borderColor: palette.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: palette.accentSoft,
    borderColor: palette.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 124,
    textAlignVertical: 'top',
  },
  title: {
    color: palette.ink,
    fontFamily: typography.heading,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
  },
  tokenLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tokenPill: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  tokenValue: {
    color: palette.ink,
    fontFamily: typography.heading,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
});