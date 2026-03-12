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

export type TavernFeedEntry =
    | {
        id: string;
        type: "join";
        clientId: string;
        nickname: string;
        createdAt: number;
    }
    | {
        id: string;
        type: "kill";
        clientId: string;
        nickname: string;
        monsterName: string;
        createdAt: number;
    };

export type PlayerPresence = {
    clientId: string;
    nickname: string;
    lastSeenAt: number;
};

export type PlayerPresenceMap = Record<string, PlayerPresence>;

export type LeaderboardEntry = {
    id: string;
    clientId: string;
    nickname: string;
    totalGold: number;
    updatedAt: number;
};

export type LeaderboardMap = Record<string, LeaderboardEntry>;

export type MonsterCardProps = {
    monster: MonsterConfig;
    onMonsterDied: OnMonsterDied;
};