export const formatRemainingTime = (remainingMs: number): string => {
    const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const getChaosSceneClass = (chaosLevel: number): string => {
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

export const getChaosLabel = (chaosLevel: number): string => {
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

export const getCalmSceneClass = (gold: number): string => {
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
};

export const getCalmSceneLabel = (gold: number): string => {
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
};