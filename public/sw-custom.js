// sw-custom.js — SOLO UPLOADS (NO tocar caché)
const DB_NAME = 'upload-queue-db';
const STORE_NAME = 'pending-uploads';
const MAX_ATTEMPTS = 5;

let isProcessing = false;

// ── Background Sync ───────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-pending') {
    event.waitUntil(processQueue());
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'RETRY_QUEUE') {
    processQueue();
  }
});

// ── Procesar cola ─────────────────────────────────────
async function processQueue() {
  if (isProcessing) {
    console.log('[SW] processQueue ya en ejecución, ignorando');
    return;
  }
  isProcessing = true;

  try {
    const db = await openDB();
    const all = await getAll(db);
    const pending = all.filter(item => item.id !== '__auth_token__');

    for (const item of pending) {
      if (item.attempts >= MAX_ATTEMPTS) {
        await dbDelete(db, item.id);
        await notifyClients({ 
          type: 'UPLOAD_FAILED_PERMANENT', 
          queueId: item.id,
          stockId: item.meta?.stockId
        });
        continue;
      }

      try {
        const { url, method, formData, headers } = await buildRequest(item);
        const response = await fetch(url, {
          method,
          body: formData,
          credentials: 'include',
          headers: headers || {}
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        await dbDelete(db, item.id);
        await notifyClients(buildSuccessMessage(item, result));

      } catch (error) {
        console.warn(`[SW] Upload fallido (${item.type}), intento ${item.attempts + 1}`, error);
        await incrementAttempts(db, item.id);
        // ← ya no hace throw, sigue con el siguiente item
      }
    }
  } finally {
    isProcessing = false; // ← siempre libera, incluso si hay error inesperado
  }
}

// ── Construir request según tipo ──────────────────────
async function buildRequest(item) {
  const formData = new FormData();
  let url, method;
  const headers = {};
  try {
    const cookie = await cookieStore.get('auth_token') 
                ?? await cookieStore.get('auth');
    if (cookie?.value) {
      headers['Authorization'] = `Bearer ${cookie.value}`;
    }
  } catch(e) {
    console.warn('[SW] No se pudo leer cookie:', e);
  }

  switch (item.type) {
    case 'product-image':
      formData.append('file', item.blob, item.filename);
      formData.append('stockId', item.meta.stockId);
      formData.append('isCover', String(item.meta.isCover));
      url = '/api/stock/images';
      method = 'POST';
      break;

    case 'order-voucher':
      formData.append('file', item.blob, item.filename);
      url = `/api/orders-sales/${item.meta.orderno}/voucher`;
      method = 'PATCH';
      break;

    case 'order-shipping-doc':
      formData.append('file', item.blob, item.filename);
      url = `/api/orders-sales/${item.meta.orderno}/shipping-doc`;
      method = 'PATCH';
      break;

    case 'order-extra-image':
      formData.append('file', item.blob, item.filename);
      url = `/api/orders-sales/${item.meta.orderno}/extra-images`;
      method = 'POST';
      break;

    default:
      throw new Error(`[SW] Tipo de upload desconocido: ${item.type}`);
  }

  return { url, method, formData, headers };
}

// ── Construir mensaje de éxito ─────────────────────────
function buildSuccessMessage(item, result) {
  const base = { queueId: item.id };

  switch (item.type) {
    case 'product-image':
      return {
        ...base,
        type: 'UPLOAD_SUCCESS',
        stockId: item.meta.stockId,
        imageId: result.imageId,
        imageUrl: result.imageUrl
      };

    case 'order-voucher':
      return {
        ...base,
        type: 'ORDER_UPLOAD_SUCCESS',
        uploadType: 'order-voucher',
        orderno: item.meta.orderno,
        url: result.data?.voucher_url
      };

    case 'order-shipping-doc':
      return {
        ...base,
        type: 'ORDER_UPLOAD_SUCCESS',
        uploadType: 'order-shipping-doc',
        orderno: item.meta.orderno,
        url: result.data?.shipping_doc_url
      };

    case 'order-extra-image':
      return {
        ...base,
        type: 'ORDER_UPLOAD_SUCCESS',
        uploadType: 'order-extra-image',
        orderno: item.meta.orderno,
        imageId: result.data?.id,
        url: result.data?.url
      };
  }
}

// ── Notificar a clientes ──────────────────────────────
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => client.postMessage(message));
}

// ── Token persistence ─────────────────────────────────
async function saveToken(token) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id: '__auth_token__', token });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getToken() {
  const db = await openDB();
  return new Promise((resolve) => {
    const req = db.transaction(STORE_NAME, 'readonly')
                  .objectStore(STORE_NAME).get('__auth_token__');
    req.onsuccess = () => resolve(req.result?.token ?? null);
    req.onerror = () => resolve(null);
  });
}

// ── IDB Helpers ───────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

function getAll(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly')
                  .objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbDelete(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function incrementAttempts(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      const item = req.result;
      if (item) {
        item.attempts++;
        store.put(item);
      }
      tx.oncomplete = () => resolve();
    };
    req.onerror = () => reject(req.error);
  });
}