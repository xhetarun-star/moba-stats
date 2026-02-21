export type Role = 'Soutien' | 'Attaquant' | 'Défenseur';

export interface PlayerStats {
    hero: string;
    role: Role;
    kills: number;
    deaths: number;
    assists: number;
}

export interface Match {
    id: string;
    date: string;
    userStats: PlayerStats;
    mateStats: PlayerStats; // j9
    result: 'Win' | 'Loss';
}

export const HERO_ROLES: Record<string, Role> = {
    "Son Goku Super": "Attaquant",
    "Piccolo": "Attaquant",
    "Dabra": "Attaquant",
    "Kale": "Attaquant",
    "Son Goku Mini": "Attaquant",
    "Bojack": "Attaquant",
    "Gamma 1 et 2": "Attaquant",
    "C-18": "Attaquant",
    "Son Goku Sayen": "Attaquant",
    "Broly": "Attaquant",
    "Super Uub": "Attaquant",
    "Trunks Jeune": "Attaquant",
    "Toppo": "Attaquant",
    "Vegito": "Attaquant",
    "Gogeta 4": "Attaquant",
    "Janemba": "Attaquant",
    "Jiren": "Attaquant",
    "Kefla": "Attaquant",
    "Vegeta Sayen": "Défenseur",
    "Zamasu": "Défenseur",
    "Baby Juvénile": "Défenseur",
    "Caulifla Sayen 2": "Défenseur",
    "Cooler": "Défenseur",
    "Cell": "Défenseur",
    "Vegeta 4": "Défenseur",
    "Bardock": "Défenseur",
    "Buu": "Soutien",
    "Krillin": "Soutien",
    "Son Gohan Petit": "Soutien",
    "Frieza 1": "Soutien",
    "C-17": "Soutien",
    "Gotenks": "Soutien",
    "Hit": "Soutien",
    "Ultimate Gohan": "Soutien"
};

export const HEROES = Object.keys(HERO_ROLES).sort();

export const ROLES: Role[] = ['Soutien', 'Attaquant', 'Défenseur'];
