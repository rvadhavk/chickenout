const observer = new MutationObserver(mutationList => {
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
  const request = {
    src: img.src
  }
  chrome.runtime.sendMessage(request, response => {
    const topClasses = response.topClasses
    const topClassNames = topClasses.map(classIndex => IMAGENET_CLASSES[classIndex])
    img.setAttribute('predictions', topClassNames.join("; "))
    if (topClasses.indexOf(8) === -1 && topClasses.indexOf(7) === -1) {
      img.removeAttribute('chicken-out-blur')
    }
  })
}, true)

