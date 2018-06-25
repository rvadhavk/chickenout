const modelPromise = tf.loadModel(chrome.extension.getURL('model/model.json'))
const MAX_CACHE_ENTRIES = 1e5

// Setup the DB used for caching classification results
const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open('cache')
  request.onupgradeneeded = () => {
    const db = request.result
    const store = db.createObjectStore('cache', {keyPath: 'hash'})
    store.createIndex('lastUseTime', 'lastUseTime')
    resolve(db)
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = reject
})

// Accept classification requests from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  getChickenProbability(request.src)
    .then(p => sendResponse({chickenProbability: p}))
    .catch(e => {console.error(e); sendResponse({error: e})})
  return true
})

// Look up classification result in cache and fallback to running classifier
// String src -> Promise<Number>
async function getChickenProbability(src) {
  const cachedProbability = await cacheLookup(src)
  if (cachedProbability !== undefined) {
    console.log('cached: ' + src)
    return cachedProbability
  }
  const probability = await computeChickenProbability(src)
  console.log('computed: ' + src)
  cacheStore(src, probability)
  return probability
}


// Load img for given src and run the classifier on the img
// String src -> Promise<Number>
async function computeChickenProbability(src) {
  const img = await loadImg(src)
  const model = await modelPromise
  return tf.tidy(() => {
    const tensor = tf.fromPixels(img, 3).toFloat()
    // Normalize the image from [0, 255] to [-1, 1].
    const offset = tf.scalar(127.5)
    const batch = tensor.sub(offset).div(offset).expandDims()
    const prediction = model.predict(batch)
    return prediction.get(0, 0)
  })
}

// Create an img element for the given URL and return a Promise which
// resolves when the img loads
// String src -> Promise<HTMLImageElement>
function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.width = 128
    img.height = 128
    img.src = src
    img.onload = event => resolve(event.target)
    img.onerror = reject
  })
}

// Cache classification result, potentially evicting other cache entries with an LRU policy
// (String src, Number probability) -> Void
async function cacheStore(src, probability) {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(src))
  const db = await dbPromise
  const cachedValue = {hash: digest, probability: probability, lastUseTime: Date.now()}
  const request = db.transaction('cache', 'readwrite')
    .objectStore('cache')
    .put(cachedValue)
  request.onerror = console.error
  maybeEvictLeastRecentlyUsed(db)
}

async function maybeEvictLeastRecentlyUsed(db) {
  // Get number of cache entries
  const objectStore = db.transaction('cache', 'readwrite').objectStore('cache')
  const index = objectStore.index('lastUseTime')
  const request = index.count()
  request.onsuccess = () => {
    const count = request.result
    if (count < MAX_CACHE_ENTRIES) {
      return
    }
    const oldestRequest = index.getAllKeys(null, Math.floor(count / 4))
    // TODO: Maybe don't use a loop to delete.
    // Can use an integer primary key and reinsert instead of in-place updating entries.
    // That way, IDBKeyRange can be used on the object store to batch delete.
    oldestRequest.onsuccess = () => {
      const keys = oldestRequest.result
      keys.forEach(key => objectStore.delete(key))
    }
    oldestRequest.onerror = console.error
  }
  request.onerror = console.error
}

// Lookup classification result, updating last-use timestamp, if present.
async function cacheLookup(src) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(src))
  const db = await dbPromise
  const objectStore = db.transaction('cache', 'readwrite').objectStore('cache')
  const cacheEntry = await new Promise((resolve, reject) => {
    const request = objectStore.get(digest)
    request.onsuccess = () => resolve(request.result)
    request.onerror = reject
  })
  if (cacheEntry === undefined) {
    return undefined
  }
  cacheEntry.lastUseTime = Date.now()
  objectStore.put(cacheEntry)
  return cacheEntry.probability
}

