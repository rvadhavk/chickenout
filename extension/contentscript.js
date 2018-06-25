const imgSrcObserver = new MutationObserver(mutationList => {
  mutationList
    .map(mutation => mutation.target)
    .forEach(img => img.setAttribute('chicken-out-blur', ''))
})

function getImgsInTree(root) {
  const imgs = Array.from(root.getElementsByTagName('img'))
  if (root.tagName === 'IMG') {
    imgs.push(root)
  }
  return imgs
}

const documentObserver = new MutationObserver(mutationList => {
  const imgs = mutationList.map(mutation => Array.from(mutation.addedNodes))
    .reduce((result, nodeList) => result.concat(nodeList), [])
    .filter(node => node instanceof HTMLElement)
    .map(getImgsInTree)
    .reduce((result, nodeList) => result.concat(nodeList), [])
  imgs.forEach(img => {
    img.setAttribute('chicken-out-blur', '')
    imgSrcObserver.observe(img, {attributeFilter: ['src']})
  })
  imgs.filter(img => img.complete).forEach(scanImage)
})
documentObserver.observe(document, {subtree: true, childList: true})

// Why use document.addEventListener instead of img.onload?
// Some websites such as Google Image Search have event handlers
// which prevent load events from propagating down to their targets
document.addEventListener('load', event => {
  if (event.target.nodeName !== 'IMG') {
    return
  }
  scanImage(event.target)
}, true)

// Map<String, Array<HTMLImageElement>>
// Maps src to img elements with that src waiting for a classification.
// This lets us batch requests to the background page for a given img src.
const imgsWaitingForClassification = new Map()

function scanImage(img) {
  if (img.currentSrc === '' || img.width === 1 || img.height === 1) {
    img.removeAttribute('chicken-out-blur')
    return
  }
  const waiters = imgsWaitingForClassification.get(img.currentSrc)
  if (waiters !== undefined) {
    // Some other image with the same currentSrc is already being classified.
    // Add this image to the set of imgs waiting for the result.
    waiters.push(img)
    return
  }
  imgsWaitingForClassification.set(img.currentSrc, [img])
  const request = {
    src: img.currentSrc
  }
  chrome.runtime.sendMessage(request, response => {
    imgsWaitingForClassification.get(request.src).forEach(img => {
      img.setAttribute('chicken-probability', response.chickenProbability)
      if (request.src === img.currentSrc && response.chickenProbability < 0.5) {
        img.removeAttribute('chicken-out-blur')
      }
    })
    imgsWaitingForClassification.delete(request.src)
  })
}
