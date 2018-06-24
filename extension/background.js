const modelPromise = tf.loadModel(chrome.extension.getURL('model/model.json'));
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const img = document.createElement('img')
  img.width = 128
  img.height = 128
  img.src = request.src
  img.onload = () => {
    const batch = tf.tidy(() => {
      const tensor = tf.fromPixels(img, 3).toFloat()
      // Normalize the image from [0, 255] to [-1, 1].
      const offset = tf.scalar(127.5);
      const normalized = tensor.sub(offset).div(offset);
      return normalized.expandDims()
    })
    modelPromise.then(model => {
      tf.tidy(() => {
        const prediction = model.predict(batch)
        const probability = prediction.get(0, 0)
        sendResponse({chickenProbability: probability})
      })
    })
  }
  return true
})
