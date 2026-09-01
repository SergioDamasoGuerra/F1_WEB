
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper robusto con Exponential Backoff y lectura de Headers
export async function fetchWithRetry<T>(
    url: string,
    retries = 5,
    baseDelayMs = 2000
): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);

            if (response.status === 429) {
                // Si la API nos devuelve cuántos segundos esperar en los headers, lo usamos
                const retryAfterHeader = response.headers.get('Retry-After');
                let delay = retryAfterHeader
                    ? parseInt(retryAfterHeader, 10) * 1000
                    : baseDelayMs * Math.pow(2, i); // Exponential backoff: 2s, 4s, 8s, 16s...

                // Jitter: añadimos entre 100ms y 500ms aleatorios para no colisionar
                delay += Math.floor(Math.random() * 400) + 100;

                console.warn(
                    ` ⚠️ Rate limit alcanzado (429). Reintento ${i + 1}/${retries}. Esperando ${(delay / 1000).toFixed(1)}s...`
                );

                await sleep(delay);
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return (await response.json()) as T;
        } catch (error) {
            if (i === retries - 1) throw error;
            const delay = baseDelayMs * Math.pow(2, i);
            const detail = error instanceof Error ? error.message : String(error);

            // Imprimimos la URL y el motivo exacto del fallo
            console.warn(` ⚠️ Error en [${url}]: ${detail}. Reintentando en ${(delay / 1000).toFixed(1)}s...`);
            await sleep(delay);
        }
    }
    throw new Error(`Excedido el número máximo de reintentos (${retries}) para la URL: ${url}`);
}

