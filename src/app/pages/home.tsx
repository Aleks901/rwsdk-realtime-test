"use client";

import { Button } from "@/components/ui/8bit/button";
import "@/components/ui/8bit/styles/retro.css";
import "./global.css";
import HealthBar from "@/components/ui/8bit/health-bar";
import { useEffect } from "react";
import { useSyncedState } from "rwsdk/use-synced-state/client";


export const Home = () => {
    const [health, setHealth] = useSyncedState(50, "health");


    useEffect(() => {
        const interval = setInterval(() => {
            setHealth((prevHealth) => Math.min(prevHealth + 10, 100));
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    const decreaseHealth = () => {
        setHealth((prevHealth) => Math.max(prevHealth - 10, 0));
    };

    return (
        <div className="bg-background text-foreground h-screen flex flex-col items-center justify-center">

            <Button variant="default" font="retro" onClick={decreaseHealth}>Attack!</Button>

            <h1 className="text-4xl font-bold mt-4 retro">Big bad monster</h1>
            <HealthBar value={health} variant="retro" className="w-64 mt-4" />



        </div>
    );
};