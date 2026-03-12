"use client";

import "@/components/ui/8bit/styles/retro.css";
import "./global.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

import { MonsterCard } from "./home/MonsterCard";
import {
    BASE_MONSTERS,
    LAVA_SCENE_DURATION_MS,
    MAX_CHAOS_LEVEL,
    getBossTemplateForMilestone,
} from "./home/config";
import {
    formatRemainingTime,
    getCalmSceneClass,
    getCalmSceneLabel,
    getChaosLabel,
    getChaosSceneClass,
} from "./home/scene";
import type { MonsterConfig } from "./home/types";

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

    const calmSceneClass = useMemo(() => getCalmSceneClass(gold), [gold]);
    const calmSceneLabel = useMemo(() => getCalmSceneLabel(gold), [gold]);

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

                <div className="flex justify-center pt-2">
                    <p className="arcade-panel retro rounded-sm px-4 py-2 text-center text-xs">
                        By Aleksander Jenssen
                    </p>
                </div>
            </div>
        </div>
    );
};