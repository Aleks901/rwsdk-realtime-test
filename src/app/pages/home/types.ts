export type MonsterKind = "monster" | "boss";

export type MonsterConfig = {
    id: string;
    name: string;
    healthKey: string;
    maxHealth: number;
    attackDamage: number;
    regenPerTick: number;
    goldReward: number;
    kind: MonsterKind;
};

export type BossTemplate = {
    id: string;
    name: string;
    maxHealth: number;
    attackDamage: number;
    regenPerTick: number;
    goldReward: number;
};

export type MonsterKillDetails = {
    goldReward: number;
    monsterName: string;
};

export type OnMonsterDied = (details: MonsterKillDetails) => void;

export type PlayerPresence = {
    clientId: string;
    nickname: string;
    lastSeenAt: number;
};

export type PlayerPresenceMap = Record<string, PlayerPresence>;

export type KillFeedEntry = {
    id: string;
    clientId: string;
    nickname: string;
    monsterName: string;
    createdAt: number;
};

export type MonsterCardProps = {
    monster: MonsterConfig;
    onMonsterDied: OnMonsterDied;
};