const imgSrcObserver = new MutationObserver(mutationList => {
  mutationList
    .map(mutation => mutation.target)
    .forEach(img => {
      img.setAttribute('chicken-out-blur', '')
      scanImage(img)
    })
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
    imgSrcObserver.observe(img, {attributes: true, attributeFilter: ['src']})
    scanImage(img)
  })
})
documentObserver.observe(document, {subtree: true, childList: true})

// Map<String, Array<HTMLImageElement>>
// Maps src to img elements with that src waiting for a classification.
// This lets us batch requests to the background page for a given img src.
const imgsWaitingForClassification = new Map()

function scanImage(img) {
  if (img.src === '' || img.width === 1 || img.height === 1) {
    img.removeAttribute('chicken-out-blur')
    return
  }
  const waiters = imgsWaitingForClassification.get(img.src)
  if (waiters !== undefined) {
    // Some other img with the same src is already being classified.
    // Add this image to the set of imgs waiting for the result.
    waiters.push(img)
    return
  }
  imgsWaitingForClassification.set(img.src, [img])
  const request = {
    src: img.src
  }
  chrome.runtime.sendMessage(request, response => {
    for (let img of imgsWaitingForClassification.get(request.src)) {
      if (request.src !== img.src) {
        continue
      }
      img.setAttribute('chicken-probability', response.chickenProbability)
      if (response.chickenProbability < 0.5) {
        img.removeAttribute('chicken-out-blur')
      } else {
        img.setAttribute('chicken-out-blur', '')
      }
    }
    imgsWaitingForClassification.delete(request.src)
  })
}
