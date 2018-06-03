const imgSrcObserver = new MutationObserver(mutationList => {
  mutationList
    .map(mutation => mutation.target)
    .forEach(img => img.setAttribute('chicken-out-blur', ''))
})

const documentObserver = new MutationObserver(mutationList => {
  const imgs = mutationList.map(mutation => Array.from(mutation.addedNodes))
    .reduce((result, nodeList) => result.concat(nodeList))
    .filter(node => node.nodeName === 'IMG')
  imgs.forEach(img => img.setAttribute('chicken-out-blur', ''))
  imgs.filter(img => img.complete).forEach(scanImage)
})
documentObserver.observe(document, {subtree: true, childList: true})

document.addEventListener('load', (event) => {
  if (event.target.nodeName !== 'IMG') {
    return
  }
  scanImage(event.target)
}, true)

function scanImage(img) {
  const src = img.src
  const request = {
    src: src
  }
  chrome.runtime.sendMessage(request, response => {
    const topClasses = response.topClasses
    const topClassNames = topClasses.map(classIndex => IMAGENET_CLASSES[classIndex])
    img.setAttribute('predictions', topClassNames.join("; "))
    if (img.src === src && topClasses.indexOf(8) === -1 && topClasses.indexOf(7) === -1) {
      img.removeAttribute('chicken-out-blur')
    }
  })
}
