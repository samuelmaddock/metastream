(function () {
  let timeoutId
  const seek = e => {
    e.preventDefault()
    const time = e.detail / 1000
    const media = document.querySelector('video')
    if (!media || media.paused) return

    // Fix for initial seek throwing exception
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      media.currentTime = time
      document.removeEventListener('metastreamseek', seek, false)
    }, 1000)
  }
  document.addEventListener('metastreamseek', seek, false)
}())
