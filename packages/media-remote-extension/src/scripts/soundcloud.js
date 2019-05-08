document.addEventListener('metastreamseek', e => {
  e.preventDefault()
  const time = e.detail
  const action = { method: 'seekTo', value: time }
  const json = JSON.stringify(action)
  postMessage(json, location.origin)
})
