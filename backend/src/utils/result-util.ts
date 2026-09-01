import {SPECIAL_POINTS_DISTRIBUTION} from '../config/points-override.js'

const RACE_POINTS: Record<number, number> = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
    6: 8,  7: 6,  8: 4,  9: 2,  10: 1
}

const SPRINT_POINTS: Record<number, number> = {
    1: 8, 2: 7, 3: 6, 4: 5,
    5: 4, 6: 3, 7: 2, 8: 1
};

export function getSessionPoints(
    sessionId: number,
    sessionType: string,
    position: number | null,
    status: string
): number {
    if (!position || status === 'DNF' || status === 'DNS' || status === 'DSQ') {
        return 0;
    }

    // 1. ¿Existe un override manual para esta sesión? (Ej. Carrera acortada)
    const sessionOverride = SPECIAL_POINTS_DISTRIBUTION[sessionId];
    if (sessionOverride && sessionOverride[position] !== undefined) {
        return sessionOverride[position];
    }

    // 2. Lógica estándar
    const cleanType = sessionType.toLowerCase();

    if (cleanType === 'race') {
        return RACE_POINTS[position] ?? 0;
    }

    if (cleanType.includes('sprint')) {
        return SPRINT_POINTS[position] ?? 0;
    }

    return 0;
}



export function getGapToLeader(
    gapToLeader: number | string | Array<number | null | undefined> | null | undefined
): number | string | null {
    // Si es null o undefined, devolvemos null
    if (gapToLeader === null || gapToLeader === undefined) {
        return null;
    }

    // Si no es un array -> no es qualy -> Practice | Sprint | Race
    // The time gap to the session leader in seconds, or "+N LAP(S)" if the driver was lapped
    if (!Array.isArray(gapToLeader)) {
        return gapToLeader;
    }

    // Si es un array -> Qualy (Q1, Q2, Q3)
    // Filtrar ÚNICAMENTE los valores numéricos válidos (no null, no undefined)
    const validGaps = gapToLeader.filter((g): g is number => typeof g === 'number');

    if (validGaps.length === 0) return null;

    // Devuelve la brecha de la ronda más reciente (Q3 > Q2 > Q1)
    return validGaps[validGaps.length - 1] ?? null;
}

