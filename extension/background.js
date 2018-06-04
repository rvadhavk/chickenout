const main = async () => {
  const model = await tf.loadModel(chrome.extension.getURL('model/model.json'));

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const img = document.createElement('img')
    img.width = 128
    img.height = 128
    img.src = request.src
    img.onload = () => {
      tf.tidy(() => {
        const tensor = tf.fromPixels(img, 3).toFloat()
        // Normalize the image from [0, 255] to [-1, 1].
        const offset = tf.scalar(127.5);
        const normalized = tensor.sub(offset).div(offset);
        const prediction = model.predict(normalized.expandDims())
        sendResponse({chickenProbability: prediction.get(0, 0)})
      })
    }
    return true
  })
}
main()
