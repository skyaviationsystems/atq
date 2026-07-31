"use client";

import Dexie, { type EntityTable } from "dexie";

export type OfflineDraftState = "draft" | "ready" | "conflict";
export type OutboxState = "pending" | "syncing" | "failed";

export interface OfflineDraft {
    id: string;
    eventId: string;
    formVersionId: string;
    payload: unknown;
    state: OfflineDraftState;
    revision: number;
    updatedAt: string;
}

export interface OutboxMutation {
    id: string;
    aggregateId: string;
    operation: string;
    payload: unknown;
    idempotencyKey: string;
    state: OutboxState;
    attempts: number;
    createdAt: string;
    lastAttemptAt?: string;
    lastError?: string;
}

export interface ReferencePack {
    id: string;
    eventId: string;
    version: number;
    payload: unknown;
    downloadedAt: string;
    expiresAt: string;
}

class ATQOfflineDatabase extends Dexie {
    drafts!: EntityTable<OfflineDraft, "id">;
    outbox!: EntityTable<OutboxMutation, "id">;
    referencePacks!: EntityTable<ReferencePack, "id">;

    constructor() {
        super("atq-offline-v1");
        this.version(1).stores({
            drafts: "id,eventId,formVersionId,state,updatedAt",
            outbox: "id,aggregateId,state,createdAt",
            referencePacks: "id,eventId,expiresAt",
        });
    }
}

let database: ATQOfflineDatabase | undefined;

export function getOfflineDatabase() {
    if (typeof window === "undefined") {
        throw new Error("The ATQ offline database is only available in a browser.");
    }
    database ??= new ATQOfflineDatabase();
    return database;
}

export async function loadOfflineDraft(id: string) {
    return getOfflineDatabase().drafts.get(id);
}

export async function saveOfflineDraft(draft: OfflineDraft) {
    await getOfflineDatabase().drafts.put(draft);
    return draft;
}

export async function removeOfflineDraft(id: string) {
    await getOfflineDatabase().drafts.delete(id);
}

export async function queueOfflineMutation(input: Omit<OutboxMutation, "id" | "idempotencyKey" | "state" | "attempts" | "createdAt">) {
    const idempotencyKey = `${input.operation}:${input.aggregateId}`;
    const existing = await getOfflineDatabase().outbox.get(idempotencyKey);
    const mutation: OutboxMutation = {
        ...input,
        id: idempotencyKey,
        idempotencyKey,
        state: "pending",
        attempts: existing?.attempts ?? 0,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    await getOfflineDatabase().outbox.put(mutation);
    return mutation;
}

export async function flushOfflineOutbox(send: (mutation: OutboxMutation) => Promise<void>): Promise<{ sent: number; failed: number }> {
    const db = getOfflineDatabase();
    const pending = await db.outbox.where("state").anyOf("pending", "failed").sortBy("createdAt");
    let sent = 0;
    let failed = 0;

    for (const mutation of pending) {
        const lastAttemptAt = new Date().toISOString();
        await db.outbox.update(mutation.id, {
            state: "syncing",
            attempts: mutation.attempts + 1,
            lastAttemptAt,
        });

        try {
            await send(mutation);
            await db.outbox.delete(mutation.id);
            sent += 1;
        } catch (error) {
            await db.outbox.update(mutation.id, {
                state: "failed",
                lastError: error instanceof Error ? error.message : "Unknown synchronization error",
                lastAttemptAt,
            });
            failed += 1;
        }
    }

    return { sent, failed };
}
