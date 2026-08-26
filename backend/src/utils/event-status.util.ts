export type EventStatus = 'done' | 'current' | 'upcoming' | 'cancelled';

export function calculateEventStatus(
    dateStart: Date,
    dateEnd: Date,
    isCancelled: boolean
): EventStatus {
    if (isCancelled) return 'cancelled';

    const now = new Date();
    if (now > dateEnd) return 'done';
    if (now >= dateStart && now <= dateEnd) return 'current';
    return 'upcoming';
}

