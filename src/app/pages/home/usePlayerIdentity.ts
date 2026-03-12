import { useCallback, useEffect, useState } from "react";

import {
    CLIENT_ID_STORAGE_KEY,
    NICKNAME_STORAGE_KEY,
    createClientId,
    createGuestNickname,
    normalizeNickname,
} from "./player";

export const usePlayerIdentity = () => {
    const [clientId, setClientId] = useState("");
    const [nickname, setNickname] = useState("");
    const [nicknameDraft, setNicknameDraft] = useState("");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const storedClientId = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY) ?? "";
        const nextClientId = storedClientId || createClientId();

        window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, nextClientId);

        const storedNickname = normalizeNickname(window.localStorage.getItem(NICKNAME_STORAGE_KEY) ?? "");
        const nextNickname = storedNickname || createGuestNickname(nextClientId);

        window.localStorage.setItem(NICKNAME_STORAGE_KEY, nextNickname);

        setClientId(nextClientId);
        setNickname(nextNickname);
        setNicknameDraft(nextNickname);
        setIsReady(true);
    }, []);

    const saveNickname = useCallback((value: string) => {
        const normalizedNickname = normalizeNickname(value);
        const nextNickname = normalizedNickname || createGuestNickname(clientId);

        window.localStorage.setItem(NICKNAME_STORAGE_KEY, nextNickname);
        setNickname(nextNickname);
        setNicknameDraft(nextNickname);
    }, [clientId]);

    return {
        clientId,
        isReady,
        nickname,
        nicknameDraft,
        saveNickname,
        setNicknameDraft,
    };
};