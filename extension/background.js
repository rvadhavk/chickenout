const main = async () => {
  const model = await tf.loadModel(chrome.extension.getURL('model/model.json'));

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const img = document.createElement('img')
    img.width = 224
    img.height = 224
    img.src = request.src
    img.onload = () => {
      tf.tidy(() => {
        const tensor = tf.fromPixels(img, 3).toFloat()
        // Normalize the image from [0, 255] to [-1, 1].
        const offset = tf.scalar(127.5);
        const normalized = tensor.sub(offset).div(offset);
        model.predict(normalized.expandDims()).data().then(logits => {
          const top5 = Array.from(logits.keys())
                            .sort((a, b) => logits[b] - logits[a])
                            .slice(0, 5)
          sendResponse({topClasses: top5})
        })
      })
    }
    return true
  })
}
main()
