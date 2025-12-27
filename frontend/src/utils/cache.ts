const DB_NAME = 'BeerCacheDB';
const STORE_NAME = 'beers';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface CacheData<T> {
  data: T;
  timestamp: number;
}

export class BeerCache {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cached = request.result as CacheData<T> | undefined;
        
        if (!cached) {
          resolve(null);
          return;
        }

        const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
        if (isExpired) {
          this.delete(key);
          resolve(null);
        } else {
          resolve(cached.data);
        }
      };
    });
  }

  async set<T>(key: string, data: T): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
      };
      const request = store.put(cacheData, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const beerCache = new BeerCache();
