"use client";

import { Button } from "@/components/ui/8bit/button";
import "@/components/ui/8bit/styles/retro.css";
import "./global.css";
import HealthBar from "@/components/ui/8bit/health-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

type MonsterConfig = {
    id: string;
    name: string;
    healthKey: string;
    maxHealth: number;
    attackDamage: number;
    regenPerTick: number;
    goldReward: number;
    kind: "monster" | "boss";
};

type BossTemplate = {
    id: string;
    name: string;
    maxHealth: number;
    attackDamage: number;
    regenPerTick: number;
    goldReward: number;
};

type MonsterCardProps = {
    monster: MonsterConfig;
    onMonsterDied: (goldReward: number) => void;
};

const BASE_MONSTERS: MonsterConfig[] = [
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

const BOSS_TEMPLATES: BossTemplate[] = [
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

const LAVA_SCENE_DURATION_MS = 3 * 60 * 1000;
const MAX_CHAOS_LEVEL = 7;

const formatRemainingTime = (remainingMs: number): string => {
    const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const getChaosSceneClass = (chaosLevel: number): string => {
    if (chaosLevel >= 7) {
        return "arcade-scene-chaos arcade-scene-prismatic";
    }

    if (chaosLevel === 6) {
        return "arcade-scene-chaos arcade-scene-neon-storm";
    }

    if (chaosLevel === 5) {
        return "arcade-scene-chaos arcade-scene-arcane-rupture";
    }

    if (chaosLevel >= 4) {
        return "arcade-scene-chaos arcade-scene-apocalypse";
    }

    if (chaosLevel === 3) {
        return "arcade-scene-chaos arcade-scene-cataclysm";
    }

    if (chaosLevel === 2) {
        return "arcade-scene-chaos arcade-scene-inferno";
    }

    return "arcade-scene-chaos arcade-scene-lava";
};

const getChaosLabel = (chaosLevel: number): string => {
    if (chaosLevel >= 7) {
        return "Prismatic Singularity";
    }

    if (chaosLevel === 6) {
        return "Neon Tempest";
    }

    if (chaosLevel === 5) {
        return "Arcane Rupture";
    }

    if (chaosLevel >= 4) {
        return "Apocalypse Protocol";
    }

    if (chaosLevel === 3) {
        return "Cataclysm Overdrive";
    }

    if (chaosLevel === 2) {
        return "Inferno Escalation";
    }

    return "Lava Surge";
};

const getBossTemplateForMilestone = (milestone: number): BossTemplate => {
    // Deterministic pseudo-random selection so every client sees the same boss for each milestone.
    const hash = (((milestone * 1664525) + 1013904223) >>> 0) ^ (milestone << 13);
    const templateIndex = hash % BOSS_TEMPLATES.length;

    return BOSS_TEMPLATES[templateIndex];
};

const MonsterCard = ({ monster, onMonsterDied }: MonsterCardProps) => {
    const [health, setHealth] = useSyncedState(monster.maxHealth, monster.healthKey);
    const [showDeathMessage, setShowDeathMessage] = useState(false);
    const [deathMessageKey, setDeathMessageKey] = useState(0);
    const previousHealth = useRef(health);
    const deathMessageTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isBoss = monster.kind === "boss";

    useEffect(() => {
        const interval = setInterval(() => {
            setHealth((prevHealth) => Math.min(prevHealth + monster.regenPerTick, monster.maxHealth));
        }, 1000);

        return () => clearInterval(interval);
    }, [monster.maxHealth, monster.regenPerTick, setHealth]);

    useEffect(() => {
        if (previousHealth.current > 0 && health <= 0) {
            setDeathMessageKey((previousKey) => previousKey + 1);
            setShowDeathMessage(true);

            if (deathMessageTimeout.current) {
                clearTimeout(deathMessageTimeout.current);
            }

            deathMessageTimeout.current = setTimeout(() => {
                setShowDeathMessage(false);
                deathMessageTimeout.current = null;
            }, 1300);

            // Instantly respawn defeated enemies at full health to prevent farm spam at 0 HP.
            setHealth(monster.maxHealth);
        }

        previousHealth.current = health;
    }, [health, monster.maxHealth, setHealth]);

    useEffect(() => {
        return () => {
            if (deathMessageTimeout.current) {
                clearTimeout(deathMessageTimeout.current);
            }
        };
    }, []);

    const attackMonster = () => {
        setHealth((prevHealth) => {
            const nextHealth = Math.max(prevHealth - monster.attackDamage, 0);

            if (prevHealth > 0 && nextHealth <= 0) {
                onMonsterDied(monster.goldReward);
            }

            return nextHealth;
        });
    };

    return (
        <div className={
            isBoss
                ? "arcade-panel arcade-panel-boss arcade-card-entry flex flex-col items-center rounded-sm px-5 py-6"
                : "arcade-panel arcade-card-entry flex flex-col items-center rounded-sm px-5 py-6"
        }>
            <Button variant="default" font="retro" onClick={attackMonster}>
                {isBoss ? "Strike Boss!" : "Attack!"}
            </Button>

            <h2 className="retro mt-4 text-center text-3xl font-bold">{monster.name}</h2>
            {isBoss ? <p className="retro text-destructive mt-1 text-sm">World Boss</p> : null}
            <HealthBar value={(health / monster.maxHealth) * 100} variant="retro" className="mt-4 w-64" />
            <p className="retro mt-2 text-base">HP: {health}</p>
            <p className="retro mt-1 text-sm text-muted-foreground">Reward: +{monster.goldReward} Gold</p>

            {showDeathMessage ? (
                <p key={deathMessageKey} className="monster-died-message retro mt-3 text-xl text-destructive">
                    Monster died!
                </p>
            ) : null}
        </div>
    );
};

export const Home = () => {
    const [gold, setGold] = useSyncedState(0, "gold");
    const [lavaSceneUntil, setLavaSceneUntil] = useSyncedState(0, "lava-scene-until");
    const [lavaSurgeStartMilestone, setLavaSurgeStartMilestone] = useSyncedState(0, "lava-surge-start-milestone");
    const [sceneNow, setSceneNow] = useState(() => Date.now());
    const bossMilestonesReached = Math.floor(gold / 1000);
    const previousBossMilestones = useRef(bossMilestonesReached);

    const spawnedBosses = useMemo<MonsterConfig[]>(() => {
        const bosses: MonsterConfig[] = [];

        for (let milestone = 1; milestone <= bossMilestonesReached; milestone += 1) {
            const bossTemplate = getBossTemplateForMilestone(milestone);

            bosses.push({
                id: `world-boss-${milestone}-${bossTemplate.id}`,
                name: `${bossTemplate.name} (Boss ${milestone})`,
                healthKey: `world-boss-${milestone}-health`,
                maxHealth: bossTemplate.maxHealth,
                attackDamage: bossTemplate.attackDamage,
                regenPerTick: bossTemplate.regenPerTick,
                goldReward: bossTemplate.goldReward,
                kind: "boss",
            });
        }

        return bosses;
    }, [bossMilestonesReached]);

    const goldSinceLastBoss = gold % 1000;
    const goldToNextBoss = goldSinceLastBoss === 0 ? 1000 : 1000 - goldSinceLastBoss;
    const isLavaScene = lavaSceneUntil > sceneNow;
    const lavaRemainingMs = Math.max(0, lavaSceneUntil - sceneNow);
    const rawChaosLevel = bossMilestonesReached - lavaSurgeStartMilestone + 1;
    const chaosLevel = isLavaScene ? Math.max(1, Math.min(MAX_CHAOS_LEVEL, rawChaosLevel)) : 0;
    const chaosLabel = isLavaScene ? getChaosLabel(chaosLevel) : "";

    const calmSceneClass = useMemo(() => {
        if (gold >= 3000) {
            return "arcade-scene-midnight";
        }

        if (gold >= 2000) {
            return "arcade-scene-sunset";
        }

        if (gold >= 1000) {
            return "arcade-scene-golden";
        }

        return "arcade-scene-calm";
    }, [gold]);

    const calmSceneLabel = useMemo(() => {
        if (gold >= 3000) {
            return "Midnight Siege";
        }

        if (gold >= 2000) {
            return "Sunset Raid";
        }

        if (gold >= 1000) {
            return "Golden Hour";
        }

        return "Calm Plains";
    }, [gold]);

    const activeSceneClass = isLavaScene ? getChaosSceneClass(chaosLevel) : calmSceneClass;

    const handleMonsterDied = useCallback((goldReward: number) => {
        setGold((previousGold) => previousGold + goldReward);
    }, [setGold]);

    useEffect(() => {
        if (bossMilestonesReached > previousBossMilestones.current) {
            const firstNewMilestone = previousBossMilestones.current + 1;
            const lavaIsActive = lavaSceneUntil > Date.now();
            const nextLavaEnd = Date.now() + LAVA_SCENE_DURATION_MS;

            if (!lavaIsActive || lavaSurgeStartMilestone <= 0) {
                setLavaSurgeStartMilestone(firstNewMilestone);
            }

            setLavaSceneUntil((previousUntil) => Math.max(previousUntil, nextLavaEnd));
        }

        previousBossMilestones.current = bossMilestonesReached;
    }, [
        bossMilestonesReached,
        lavaSceneUntil,
        lavaSurgeStartMilestone,
        setLavaSceneUntil,
        setLavaSurgeStartMilestone,
    ]);

    useEffect(() => {
        setSceneNow(Date.now());

        if (lavaSceneUntil <= Date.now()) {
            return;
        }

        const interval = setInterval(() => {
            setSceneNow(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [lavaSceneUntil]);

    return (
        <div className={`arcade-page ${activeSceneClass} text-foreground min-h-screen px-4 pb-24 pt-32`}>
            <div className="arcade-backdrop" aria-hidden="true" />
            <div className="arcade-ground-horizon" aria-hidden="true" />
            <div className="pixel-cloud cloud-a" aria-hidden="true" />
            <div className="pixel-cloud cloud-b" aria-hidden="true" />
            <div className="pixel-cloud cloud-c" aria-hidden="true" />
            <div className="chaos-rift rift-a" aria-hidden="true" />
            <div className="chaos-rift rift-b" aria-hidden="true" />
            <div className="chaos-rift rift-c" aria-hidden="true" />
            <div className="chaos-glow" aria-hidden="true" />
            <div className="chaos-shockwave" aria-hidden="true" />

            <div className="arcade-hud retro fixed top-5 left-1/2 z-20 -translate-x-1/2 rounded-sm px-5 py-2 text-center">
                <p className="text-2xl">Gold: {gold}</p>
                <p className="text-sm text-muted-foreground">Next boss in {goldToNextBoss} gold</p>
                <p className="text-xs text-muted-foreground">
                    {isLavaScene
                        ? `${chaosLabel} | Level ${chaosLevel}/${MAX_CHAOS_LEVEL} | ${formatRemainingTime(lavaRemainingMs)}`
                        : `Area: ${calmSceneLabel}`}
                </p>
            </div>

            <div className="relative z-10 mx-auto max-w-6xl space-y-12">
                <section className="arcade-section space-y-5">
                    <h2 className="arcade-section-title retro text-center text-3xl">Monsters</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {BASE_MONSTERS.map((monster) => (
                            <MonsterCard key={monster.id} monster={monster} onMonsterDied={handleMonsterDied} />
                        ))}
                    </div>
                </section>

                <section className="arcade-section space-y-5">
                    <h2 className="arcade-section-title arcade-section-title-boss retro text-center text-3xl">World Bosses</h2>

                    {spawnedBosses.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {spawnedBosses.map((boss) => (
                                <MonsterCard key={boss.id} monster={boss} onMonsterDied={handleMonsterDied} />
                            ))}
                        </div>
                    ) : (
                        <p className="arcade-empty-state retro text-center">
                            No world boss yet. Earn 1000 gold to summon your first one.
                        </p>
                    )}
                </section>
            </div>
        </div>
    );
};