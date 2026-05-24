export function xpToReachLevel(level: number) {
  if (level <= 1) {
    return 0;
  }

  return 25 * (2 ** (level - 1) - 1);
}

export function calculateLevelFromXp(totalXp: number) {
  let currentLevel = 1;

  while (totalXp >= xpToReachLevel(currentLevel + 1)) {
    currentLevel += 1;
  }

  return currentLevel;
}

export function getLevelProgress(totalXp: number) {
  const currentLevel = calculateLevelFromXp(totalXp);
  const previousTarget = xpToReachLevel(currentLevel);
  const nextTarget = xpToReachLevel(currentLevel + 1);
  const progressWithinLevel = totalXp - previousTarget;
  const levelSpan = Math.max(nextTarget - previousTarget, 1);

  return {
    currentLevel,
    levelSpan,
    nextTarget,
    previousTarget,
    progressRatio: Math.max(0, Math.min(1, progressWithinLevel / levelSpan)),
    progressWithinLevel,
    remainingXp: Math.max(nextTarget - totalXp, 0),
  };
}