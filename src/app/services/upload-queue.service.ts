import { Injectable } from '@angular/core';


export type UploadType = 
  'product-image' | 
  'order-voucher' | 
  'order-shipping-doc' | 
  'order-extra-image';

export interface QueuedUpload {
  id:        string;
  type:      UploadType;
  blob:      Blob;
  filename:  string;
  createdAt: number;
  attempts:  number;
  meta: {
    stockId?:  string;
    isCover?:  boolean;
    orderno?:  number;
  };
}

const DB_NAME    = 'upload-queue-db';
const STORE_NAME = 'pending-uploads';
const DB_VERSION = 2;  // ← bumpeado

@Injectable({ providedIn: 'root' })
export class UploadQueueService {

  private dbPromise: Promise<IDBDatabase> = this.openDB();

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        // v1 → v2: recrear store con nuevo schema
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      };
      req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
      req.onerror   = ()  => reject(req.error);
    });
  }

  async enqueue(item: Omit<QueuedUpload, 'id' | 'createdAt' | 'attempts'>): Promise<string> {
    const db = await this.dbPromise;
    const entry: QueuedUpload = {
      ...item,
      id:        crypto.randomUUID(),
      createdAt: Date.now(),
      attempts:  0
    };
    await this.idbPut(db, entry);

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if ('sync' in reg) {
        await (reg as any).sync.register('upload-pending');
      }
    }

    return entry.id;
  }

  async getAll(): Promise<QueuedUpload[]> {
    const db = await this.dbPromise;
    return this.idbGetAll(db);
  }

  async remove(id: string): Promise<void> {
    const db = await this.dbPromise;
    return this.idbDelete(db, id);
  }

  async incrementAttempts(id: string): Promise<void> {
    const db   = await this.dbPromise;
    const item = await this.idbGet(db, id);
    if (item) {
      item.attempts++;
      await this.idbPut(db, item);
    }
  }

  // ── IDB helpers (sin librería externa) ───────────────
  private idbPut(db: IDBDatabase, item: QueuedUpload): Promise<void> {
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(item);
      tx.oncomplete = () => res();
      tx.onerror    = () => rej(tx.error);
    });
  }

  private idbGet(db: IDBDatabase, id: string): Promise<QueuedUpload | undefined> {
    return new Promise((res, rej) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => res(req.result);
      req.onerror   = () => rej(req.error);
    });
  }

  private idbGetAll(db: IDBDatabase): Promise<QueuedUpload[]> {
    return new Promise((res, rej) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => res(req.result);
      req.onerror   = () => rej(req.error);
    });
  }

  private idbDelete(db: IDBDatabase, id: string): Promise<void> {
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => res();
      tx.onerror    = () => rej(tx.error);
    });
  }
}