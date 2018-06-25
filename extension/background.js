const modelPromise = tf.loadModel(chrome.extension.getURL('model/model.json'))
const INPUT_WIDTH = 128
const INPUT_HEIGHT = 128
const MAX_CACHE_ENTRIES = 1e5

// The DB used for caching classification results
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

// Listener to accept classification requests from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  getChickenProbability(request.src)
    .then(p => sendResponse({chickenProbability: p}))
    .catch(e => {console.error(e); sendResponse({error: e})})
  return true
})

// Runs classifier on passed-in ImageData
// ImageData imgData -> Promise<Number>
async function computeChickenProbability(imgData) {
  const batch = tf.tidy(() => {
    const tensor = tf.fromPixels(imgData, 3).toFloat()
    // Normalize the image from [0, 255] to [-1, 1].
    const offset = tf.scalar(127.5)
    const normalized = tensor.sub(offset).div(offset)
    return normalized.expandDims()
  })
  const model = await modelPromise
  return tf.tidy(() => {
    const prediction = model.predict(batch)
    return prediction.get(0, 0)
  })
}

// Creates an img element for the given URL and returns a Promise which
// resolves when the image loads
// String src -> Promise<HTMLImageElement>
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.width = INPUT_WIDTH
    img.height = INPUT_HEIGHT
    img.src = src
    img.onload = event => resolve(event.target)
    img.onerror = reject
  })
}

// HTMLImageElement img -> ImageData
function getImageData(img) {
  const canvas = document.createElement('canvas')
  canvas.width = INPUT_WIDTH
  canvas.height = INPUT_HEIGHT
  const context = canvas.getContext('2d')
  context.drawImage(img, 0, 0, INPUT_WIDTH, INPUT_HEIGHT)
  return context.getImageData(0, 0, INPUT_WIDTH, INPUT_HEIGHT)
}

// - Loads image at given URL
// - Attempts to lookup classification result in content-addressed cache
// - Falls back to running classifier with tf.js
// - Stores classification result in cache
// String src -> Promise<Number>
async function getChickenProbability(src) {
  const img = await loadImage(src)
  const imgData = getImageData(img)
  const cachedProbability = await cacheLookup(imgData)
  if (cachedProbability !== undefined) {
    console.log('cached: ' + src)
    return cachedProbability
  }
  const probability = await computeChickenProbability(imgData)
  console.log('computed: ' + src)
  cacheStore(imgData, probability)
  return probability
}

// Cache classification result, potentially evicting other cache entries with an LRU policy.
// (ImageData, Number) -> Void
async function cacheStore(imgData, probability) {
  const digest = await crypto.subtle.digest('SHA-256', imgData.data)
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
async function cacheLookup(imgData) {
  const digest = await crypto.subtle.digest('SHA-256', imgData.data)
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

