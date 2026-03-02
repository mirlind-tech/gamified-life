interface CoreStatsInput {
  pillars?: Record<string, { level?: number }>;
  skills?: Record<string, { level?: number }>;
  activityStats?: {
    habitsCompleted?: number;
    focusSessions?: number;
    journalEntries?: number;
    questsCompleted?: number;
  };
}

export function calculateCoreStats(player: CoreStatsInput | null | undefined) {
  const stats = {
    strength: 10,
    agility: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    constitution: 10,
    discipline: 10,
    creativity: 10,
  };

  if (!player) return stats;

  // Strength from Vessel pillar + gym habits
  stats.strength =
    10 +
    (player.pillars?.vessel?.level || 0) * 2 +
    Math.floor((player.activityStats?.habitsCompleted || 0) / 5);

  // Agility from Vessel + focus speed
  stats.agility =
    10 +
    (player.pillars?.vessel?.level || 0) +
    Math.floor((player.activityStats?.focusSessions || 0) / 3);

  // Intelligence from Craft pillar
  stats.intelligence =
    10 +
    (player.pillars?.craft?.level || 0) * 2 +
    Object.values(player.skills || {}).reduce((sum: number, s: { level?: number }) => sum + (s.level || 0), 0);

  // Wisdom from Principle + journal entries
  stats.wisdom =
    10 +
    (player.pillars?.principle?.level || 0) * 2 +
    Math.floor((player.activityStats?.journalEntries || 0) / 2);

  // Charisma from Tongue pillar
  stats.charisma = 10 + (player.pillars?.tongue?.level || 0) * 2;

  // Constitution from overall consistency
  stats.constitution =
    10 +
    Math.floor((player.activityStats?.habitsCompleted || 0) / 10) +
    Math.floor((player.activityStats?.questsCompleted || 0) / 5);

  // Discipline from streaks and consistency
  stats.discipline =
    10 +
    Math.floor((player.activityStats?.focusSessions || 0) / 2) +
    Math.floor((player.activityStats?.habitsCompleted || 0) / 5);

  // Creativity from Craft + variety of activities
  stats.creativity = 10 + (player.pillars?.craft?.level || 0) + Object.keys(player.skills || {}).length;

  return stats;
}
