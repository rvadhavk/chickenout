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

document.addEventListener('load', event => {
  if (event.target.nodeName !== 'IMG') {
    return
  }
  scanImage(event.target)
}, true)

function scanImage(img) {
  if (img.currentSrc === '') {
    img.removeAttribute('chicken-out-blur')
    return
  }
  const request = {
    src: img.currentSrc
  }
  chrome.runtime.sendMessage(request, response => {
    img.setAttribute('chicken-probability', response.chickenProbability)
    if (request.src === img.currentSrc && response.chickenProbability < 0.5) {
      img.removeAttribute('chicken-out-blur')
    }
  })
}
