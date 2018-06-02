const main = async () => {
  const model = await tf.loadModel(chrome.extension.getURL('model/model.json'));

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const data = new Uint8ClampedArray(base64js.toByteArray(request.data))
    const image = new ImageData(data, request.width, request.height)
    const tensor = tf.fromPixels(image, 3).toFloat()
    // Normalize the image from [0, 255] to [-1, 1].
    const offset = tf.scalar(127.5);
    const normalized = tensor.sub(offset).div(offset);

    const result = model.predict(normalized.expandDims()).argMax(1)
    sendResponse({result: result.get(0)})
  })
}
main()
