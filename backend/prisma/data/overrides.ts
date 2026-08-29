// Estructura: [eventId / meeting_key]: { [teamName]: { points, position } }
export const TEAM_STANDING_OVERRIDES: Record<number, Record<string, { points: number; position: number }>> = {
    1286: { // Mónaco
        Cadillac: { points: 0.0, position: 11 },
        'Aston Martin': { points: 1.0, position: 10 },
    },
};

