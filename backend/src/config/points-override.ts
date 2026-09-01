/*
4 escalones estrictos basados en el porcentaje de distancia completado:

    1.- Menos del 25% de la distancia: No se otorgan puntos a nadie.

    2.- Entre el 25% y el 50%:
        P1: 6, P2: 4, P3: 3, P4: 2, P5: 1 (Solo puntúan los 5 primeros).

    3.- Entre el 50% y el 75%:
        P1: 19, P2: 14, P3: 11, P4: 9, P5: 8, P6: 6, P7: 5, P8: 3, P9: 2, P10: 1.

    4.- Más del 75% de la distancia: Puntuación completa (100%).

*/

// Mapa: sessionId -> Map<position, customPoints>
export const SPECIAL_POINTS_DISTRIBUTION: Record<number, Record<number, number>> = {
    // Ejemplo: Si la sesión con ID=42 fue suspendida al 60% de distancia (escalón 3)
    // 42: { 1: 19, 2: 14, 3: 11, 4: 9, 5: 8, 6: 6, 7: 5, 8: 3, 9: 2, 10: 1 },
};

