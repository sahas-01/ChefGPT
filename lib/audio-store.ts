// Shared in-memory audio store using a global singleton
// This ensures both /api/whatsapp and /api/audio/[id] share the same Map
// even if Next.js module bundling creates separate module instances per route.

declare global {
    // eslint-disable-next-line no-var
    var __audioStore: Map<string, { data: string; expiresAt: number }> | undefined;
}

// Use the global singleton — create it only once
if (!global.__audioStore) {
    global.__audioStore = new Map();
}

export const audioStore = global.__audioStore;

export function cleanupAudioStore() {
    const now = Date.now();
    for (const [key, value] of audioStore.entries()) {
        if (value.expiresAt < now) audioStore.delete(key);
    }
}
