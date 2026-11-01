import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/components/abyssal/GameApp";

export const Route = createFileRoute("/")({ component: GameApp });
