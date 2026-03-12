"use client";

import "@/components/ui/8bit/styles/retro.css";
import "./global.css";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

import { Button } from "@/components/ui/8bit/button";
import { MonsterCard } from "./home/MonsterCard";
import {
    BASE_MONSTERS,
    LAVA_SCENE_DURATION_MS,
    MAX_CHAOS_LEVEL,
    getBossTemplateForMilestone,
} from "./home/config";
import {
    MAX_KILL_FEED_ENTRIES,
    MAX_NICKNAME_LENGTH,
    PLAYER_PRESENCE_HEARTBEAT_MS,
    buildKillAnnouncement,
    createKillFeedEntryId,
    getActivePlayers,
    normalizeNickname,
    pruneKillFeed,
    prunePresenceMap,
} from "./home/player";
import {
    formatRemainingTime,
    getCalmSceneClass,
    getCalmSceneLabel,
    getChaosLabel,
    getChaosSceneClass,
} from "./home/scene";
import type { KillFeedEntry, MonsterConfig, MonsterKillDetails, PlayerPresenceMap } from "./home/types";
import { usePlayerIdentity } from "./home/usePlayerIdentity";

export const Home = () => {
    const [gold, setGold] = useSyncedState(0, "gold");
    const [players, setPlayers] = useSyncedState<PlayerPresenceMap>({}, "players");
    const [killFeed, setKillFeed] = useSyncedState<KillFeedEntry[]>([], "kill-feed");
    const [lavaSceneUntil, setLavaSceneUntil] = useSyncedState(0, "lava-scene-until");
    const [lavaSurgeStartMilestone, setLavaSurgeStartMilestone] = useSyncedState(0, "lava-surge-start-milestone");
    const [lastHandledBossMilestone, setLastHandledBossMilestone] = useSyncedState(-1, "last-handled-boss-milestone");
    const [sceneNow, setSceneNow] = useState(() => Date.now());
    const { clientId, isReady: isPlayerReady, nickname, nicknameDraft, saveNickname, setNicknameDraft } = usePlayerIdentity();
    const bossMilestonesReached = Math.floor(gold / 1000);
    const isLavaScene = lavaSceneUntil > sceneNow;
    const activeBossStartMilestone = isLavaScene && lavaSurgeStartMilestone > 0
        ? lavaSurgeStartMilestone
        : 0;

    const spawnedBosses = useMemo<MonsterConfig[]>(() => {
        if (!isLavaScene || activeBossStartMilestone <= 0) {
            return [];
        }

        const bosses: MonsterConfig[] = [];

        for (let milestone = activeBossStartMilestone; milestone <= bossMilestonesReached; milestone += 1) {
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
    }, [activeBossStartMilestone, bossMilestonesReached, isLavaScene]);

    const goldSinceLastBoss = gold % 1000;
    const goldToNextBoss = goldSinceLastBoss === 0 ? 1000 : 1000 - goldSinceLastBoss;
    const lavaRemainingMs = Math.max(0, lavaSceneUntil - sceneNow);
    const rawChaosLevel = lavaSurgeStartMilestone > 0
        ? bossMilestonesReached - lavaSurgeStartMilestone + 1
        : 1;
    const chaosLevel = isLavaScene ? Math.max(1, Math.min(MAX_CHAOS_LEVEL, rawChaosLevel)) : 0;
    const chaosLabel = isLavaScene ? getChaosLabel(chaosLevel) : "";

    const calmSceneClass = useMemo(() => getCalmSceneClass(gold), [gold]);
    const calmSceneLabel = useMemo(() => getCalmSceneLabel(gold), [gold]);
    const activePlayers = useMemo(() => getActivePlayers(players, sceneNow, clientId), [clientId, players, sceneNow]);
    const visibleKillFeed = useMemo(() => [...pruneKillFeed(killFeed, sceneNow)].reverse(), [killFeed, sceneNow]);
    const normalizedNicknameDraft = useMemo(() => normalizeNickname(nicknameDraft), [nicknameDraft]);
    const isNicknameDirty = normalizedNicknameDraft.length > 0 && normalizedNicknameDraft !== nickname;

    const activeSceneClass = isLavaScene ? getChaosSceneClass(chaosLevel) : calmSceneClass;

    const handleMonsterDied = useCallback(({ goldReward, monsterName }: MonsterKillDetails) => {
        const createdAt = Date.now();

        setGold((previousGold) => previousGold + goldReward);

        setKillFeed((previousFeed) => {
            const killerName = nickname || "Traveler";

            return [
                ...pruneKillFeed(previousFeed, createdAt),
                {
                    id: createKillFeedEntryId(),
                    clientId,
                    nickname: killerName,
                    monsterName,
                    createdAt,
                },
            ].slice(-MAX_KILL_FEED_ENTRIES);
        });
    }, [clientId, nickname, setGold, setKillFeed]);

    const handleNicknameSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        saveNickname(nicknameDraft);
    }, [nicknameDraft, saveNickname]);

    useEffect(() => {
        if (!isPlayerReady || !clientId || !nickname) {
            return;
        }

        const publishPresence = () => {
            const now = Date.now();

            setPlayers((previousPlayers) => ({
                ...prunePresenceMap(previousPlayers, now),
                [clientId]: {
                    clientId,
                    nickname,
                    lastSeenAt: now,
                },
            }));
        };

        publishPresence();

        const interval = setInterval(publishPresence, PLAYER_PRESENCE_HEARTBEAT_MS);

        return () => clearInterval(interval);
    }, [clientId, isPlayerReady, nickname, setPlayers]);

    useEffect(() => {
        if (lastHandledBossMilestone >= 0) {
            return;
        }

        // Avoid replaying old milestone events after refresh/hydration.
        // Bootstrap from a known gold snapshot (or truly empty state), not from stale timer fields.
        const isCleanEmptyState = gold === 0 && bossMilestonesReached === 0 && lavaSceneUntil === 0 && lavaSurgeStartMilestone === 0;
        const canBootstrapFromGold = gold !== 0;

        if (!canBootstrapFromGold && !isCleanEmptyState) {
            return;
        }

        setLastHandledBossMilestone(bossMilestonesReached);
    }, [
        bossMilestonesReached,
        gold,
        lastHandledBossMilestone,
        lavaSceneUntil,
        lavaSurgeStartMilestone,
        setLastHandledBossMilestone,
    ]);

    useEffect(() => {
        if (lastHandledBossMilestone < 0) {
            return;
        }

        if (bossMilestonesReached <= lastHandledBossMilestone) {
            return;
        }

        const firstNewMilestone = lastHandledBossMilestone + 1;
        const lavaIsActive = lavaSceneUntil > Date.now();
        const nextLavaEnd = Date.now() + LAVA_SCENE_DURATION_MS;

        // If we're catching up during hydration while a surge is already running,
        // only advance the handled marker without re-extending the timer.
        if (lavaIsActive && lavaSurgeStartMilestone <= 0) {
            return;
        }

        if (lavaIsActive && firstNewMilestone <= lavaSurgeStartMilestone) {
            setLastHandledBossMilestone(bossMilestonesReached);
            return;
        }

        if (!lavaIsActive || lavaSurgeStartMilestone <= 0) {
            setLavaSurgeStartMilestone(firstNewMilestone);
        }

        setLavaSceneUntil((previousUntil) => Math.max(previousUntil, nextLavaEnd));
        setLastHandledBossMilestone(bossMilestonesReached);
    }, [
        bossMilestonesReached,
        lastHandledBossMilestone,
        lavaSceneUntil,
        lavaSurgeStartMilestone,
        setLavaSceneUntil,
        setLastHandledBossMilestone,
        setLavaSurgeStartMilestone,
    ]);

    useEffect(() => {
        setSceneNow(Date.now());

        const interval = setInterval(() => {
            setSceneNow(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

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

            {visibleKillFeed.length > 0 ? (
                <div className="arcade-kill-feed" aria-live="polite">
                    {visibleKillFeed.map((entry) => (
                        <p
                            key={entry.id}
                            className={entry.clientId === clientId
                                ? "arcade-kill-toast arcade-kill-toast-self retro"
                                : "arcade-kill-toast retro"}
                        >
                            {buildKillAnnouncement(entry)}
                        </p>
                    ))}
                </div>
            ) : null}

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
                <section className="arcade-social-grid">
                    <form className="arcade-panel arcade-social-panel retro" onSubmit={handleNicknameSubmit}>
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Your Adventurer</p>
                            <h2 className="text-2xl">Nickname</h2>
                            <p className="text-sm text-muted-foreground">
                                Bound to this browser so other players can recognize your kills.
                            </p>
                        </div>

                        <div className="arcade-name-row">
                            <label className="arcade-name-field" htmlFor="nickname">
                                <span className="sr-only">Nickname</span>
                                <input
                                    id="nickname"
                                    className="arcade-name-input"
                                    maxLength={MAX_NICKNAME_LENGTH}
                                    onChange={(event) => setNicknameDraft(event.target.value)}
                                    placeholder="Pick a nickname"
                                    value={nicknameDraft}
                                />
                            </label>

                            <Button disabled={!isPlayerReady || !isNicknameDirty} font="retro" type="submit" variant="default">
                                Save Name
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Current name: <span className="text-foreground">{nickname || "Loading..."}</span>
                        </p>
                    </form>

                    <div className="arcade-panel arcade-social-panel retro">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Players Here</p>
                            <h2 className="text-2xl">
                                {activePlayers.length} {activePlayers.length === 1 ? "Adventurer" : "Adventurers"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Active players refresh automatically while they are in the tavern.
                            </p>
                        </div>

                        <div className="arcade-player-list">
                            {activePlayers.length > 0 ? activePlayers.map((player) => (
                                <span
                                    key={player.clientId}
                                    className={player.clientId === clientId
                                        ? "arcade-player-chip arcade-player-chip-self"
                                        : "arcade-player-chip"}
                                >
                                    {player.nickname}{player.clientId === clientId ? " (You)" : ""}
                                </span>
                            )) : (
                                <p className="text-sm text-muted-foreground">Waiting for the first adventurer to appear.</p>
                            )}
                        </div>
                    </div>
                </section>

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
                            {isLavaScene
                                ? "Bosses are gathering..."
                                : "No world boss active. Earn more gold to trigger the next surge."}
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