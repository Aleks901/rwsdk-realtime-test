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

export type OnMonsterDied = (goldReward: number) => void;

export type MonsterCardProps = {
    monster: MonsterConfig;
    onMonsterDied: OnMonsterDied;
};