import type { BossTemplate, MonsterConfig } from "./types";

export const BASE_MONSTERS: MonsterConfig[] = [
    {
        id: "big-bad-monster",
        name: "Big bad monster",
        healthKey: "health",
        maxHealth: 100,
        attackDamage: 10,
        regenPerTick: 10,
        goldReward: 50,
        kind: "monster",
    },
    {
        id: "cave-troll",
        name: "Cave troll",
        healthKey: "monster-cave-troll-health",
        maxHealth: 140,
        attackDamage: 12,
        regenPerTick: 8,
        goldReward: 50,
        kind: "monster",
    },
    {
        id: "swamp-hydra",
        name: "Swamp hydra",
        healthKey: "monster-swamp-hydra-health",
        maxHealth: 120,
        attackDamage: 14,
        regenPerTick: 6,
        goldReward: 50,
        kind: "monster",
    },
    {
        id: "bone-dragon",
        name: "Bone dragon",
        healthKey: "monster-bone-dragon-health",
        maxHealth: 180,
        attackDamage: 16,
        regenPerTick: 5,
        goldReward: 50,
        kind: "monster",
    },
];

export const BOSS_TEMPLATES: BossTemplate[] = [
    {
        id: "eclipse-devourer",
        name: "Eclipse Devourer Zorath",
        maxHealth: 900,
        attackDamage: 22,
        regenPerTick: 12,
        goldReward: 250,
    },
    {
        id: "thunder-leviathan",
        name: "Thunder Leviathan Grondar",
        maxHealth: 1100,
        attackDamage: 24,
        regenPerTick: 10,
        goldReward: 300,
    },
    {
        id: "void-colossus",
        name: "Void Colossus Nyxarion",
        maxHealth: 1250,
        attackDamage: 28,
        regenPerTick: 9,
        goldReward: 350,
    },
    {
        id: "inferno-lord",
        name: "Inferno Lord Malvek",
        maxHealth: 1000,
        attackDamage: 26,
        regenPerTick: 11,
        goldReward: 300,
    },
];

export const LAVA_SCENE_DURATION_MS = 3 * 60 * 1000;
export const MAX_CHAOS_LEVEL = 7;

export const getBossTemplateForMilestone = (milestone: number): BossTemplate => {
    // Deterministic pseudo-random selection so every client sees the same boss for each milestone.
    const hash = (((milestone * 1664525) + 1013904223) >>> 0) ^ (milestone << 13);
    const templateIndex = hash % BOSS_TEMPLATES.length;

    return BOSS_TEMPLATES[templateIndex];
};