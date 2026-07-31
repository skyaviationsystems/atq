/**
 * Vendor-neutral application boundaries. Feature code depends on these ports;
 * Supabase is the first adapter and AWS can replace it without rewriting the UI.
 */
export interface PageRequest {
    cursor?: string;
    limit?: number;
}

export interface PageResult<T> {
    items: T[];
    nextCursor?: string;
}

export interface QueryOptions {
    signal?: AbortSignal;
}

export interface EntityRepository<TEntity, TCreate, TUpdate = Partial<TCreate>> {
    getById(id: string, options?: QueryOptions): Promise<TEntity | null>;
    list(page?: PageRequest, options?: QueryOptions): Promise<PageResult<TEntity>>;
    create(input: TCreate): Promise<TEntity>;
    update(id: string, input: TUpdate, expectedVersion?: number): Promise<TEntity>;
}

export interface FileObject {
    key: string;
    contentType: string;
    size: number;
    checksum: string;
    createdAt: string;
}

export interface FileStore {
    put(key: string, data: Blob | ArrayBuffer, contentType: string): Promise<FileObject>;
    getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
    remove(key: string): Promise<void>;
}

export interface IdentityClaims {
    subject: string;
    email?: string;
    roles: string[];
    fleetScopes: string[];
    baseScopes: string[];
}

export interface IdentityProvider {
    getClaims(): Promise<IdentityClaims | null>;
    signOut(): Promise<void>;
}

export interface DomainEvent<TPayload = unknown> {
    id: string;
    type: string;
    aggregateId: string;
    occurredAt: string;
    payload: TPayload;
    schemaVersion: number;
}

export interface EventPublisher {
    publish(events: DomainEvent[]): Promise<void>;
}

export interface Clock {
    now(): Date;
}

export const systemClock: Clock = {
    now: () => new Date(),
};
