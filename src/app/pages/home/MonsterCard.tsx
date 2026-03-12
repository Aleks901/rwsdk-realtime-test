import { useEffect, useRef, useState } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";

import { Button } from "@/components/ui/8bit/button";
import HealthBar from "@/components/ui/8bit/health-bar";

import type { MonsterCardProps } from "./types";

export const MonsterCard = ({ monster, onMonsterDied }: MonsterCardProps) => {
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
                onMonsterDied({
                    goldReward: monster.goldReward,
                    monsterName: monster.name,
                });
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