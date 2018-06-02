let observer = new MutationObserver(mutationList => {
  const imgs = mutationList.map(mutation => Array.from(mutation.addedNodes))
    .reduce((result, nodeList) => result.concat(nodeList))
    .filter(node => node.nodeName === 'IMG')
  imgs.forEach(img => img.setAttribute('chicken-out-blur', ''))
})
observer.observe(document, {subtree: true, childList: true})
const canvas = document.createElement('canvas')
document.addEventListener('load', (event) => {
  if (event.target.nodeName !== 'IMG') {
    return
  }
  const img = event.target
  const context = canvas.getContext('2d')
  canvas.width = img.width
  canvas.height = img.height
  context.drawImage(img, 0, 0, 224, 224)
  const bytes = context.getImageData(0, 0, 224, 224).data;
  const request = {
    data: base64js.fromByteArray(bytes),
    width: 224,
    height: 224
  }
  chrome.runtime.sendMessage(request, response => {
    console.log('response')
    console.log(IMAGENET_CLASSES[response.result])
    img.setAttribute('prediction', IMAGENET_CLASSES[response.result])
    if (response.result === 954) {
      img.removeAttribute('chicken-out-blur')
    }
  })
}, true)

