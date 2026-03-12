import type { KillFeedEntry, PlayerPresence, PlayerPresenceMap } from "./types";

export const CLIENT_ID_STORAGE_KEY = "the-tavern-client-id";
export const NICKNAME_STORAGE_KEY = "the-tavern-nickname";
export const PLAYER_PRESENCE_HEARTBEAT_MS = 5000;
export const PLAYER_PRESENCE_TTL_MS = 20000;
export const KILL_FEED_RETENTION_MS = 12000;
export const MAX_KILL_FEED_ENTRIES = 6;
export const MAX_NICKNAME_LENGTH = 20;

export const normalizeNickname = (value: string): string => value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NICKNAME_LENGTH);

export const createClientId = (): string => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createGuestNickname = (clientId: string): string => {
    const shortId = clientId.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase() || "0000";
    return `Traveler ${shortId}`;
};

export const createKillFeedEntryId = (): string => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `kill-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const prunePresenceMap = (
    players: PlayerPresenceMap,
    now: number,
): PlayerPresenceMap => Object.values(players).reduce<PlayerPresenceMap>((nextPlayers, player) => {
    if (now - player.lastSeenAt <= PLAYER_PRESENCE_TTL_MS) {
        nextPlayers[player.clientId] = player;
    }

    return nextPlayers;
}, {});

export const getActivePlayers = (
    players: PlayerPresenceMap,
    now: number,
    currentClientId: string,
): PlayerPresence[] => Object.values(prunePresenceMap(players, now)).sort((left, right) => {
    if (left.clientId === currentClientId && right.clientId !== currentClientId) {
        return -1;
    }

    if (right.clientId === currentClientId && left.clientId !== currentClientId) {
        return 1;
    }

    if (right.lastSeenAt !== left.lastSeenAt) {
        return right.lastSeenAt - left.lastSeenAt;
    }

    return left.nickname.localeCompare(right.nickname);
});

export const pruneKillFeed = (entries: KillFeedEntry[], now: number): KillFeedEntry[] => entries
    .filter((entry) => now - entry.createdAt <= KILL_FEED_RETENTION_MS)
    .slice(-MAX_KILL_FEED_ENTRIES);

export const buildKillAnnouncement = (entry: KillFeedEntry): string => `${entry.nickname} killed ${entry.monsterName}!`;