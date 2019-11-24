const clickAtProgress = (target, progress) => {
  const { width, height, left, top } = target.getBoundingClientRect()
  const x = left + width * progress
  const y = top + height / 2

  var clickEvent = document.createEvent('MouseEvents')
  clickEvent.initMouseEvent(
    'click',
    true,
    true,
    window,
    0,
    0,
    0,
    x,
    y,
    false,
    false,
    false,
    false,
    0,
    null
  )

  target.dispatchEvent(clickEvent)
}

document.addEventListener('metastreamplay', e => {
  const btn = document.querySelector('.controls__playback-button--paused')
  if (btn) {
    e.preventDefault()
    btn.click()
  }
})

document.addEventListener('metastreampause', e => {
  const btn = document.querySelector('.controls__playback-button--playing')
  if (btn) {
    e.preventDefault()
    btn.click()
  }
})

document.addEventListener('metastreamseek', e => {
  const time = e.detail / 1000
  const media = Array.from(document.querySelectorAll('video'))
    .sort((a, b) => a.duration > b.duration)
    .find(vid => !isNaN(vid.duration))
  if (!media) return
  if (media.paused) {
    e.preventDefault()
    return
  }

  const progressBar = document.querySelector('.controls__progress-bar-total')
  if (!progressBar) return

  e.preventDefault()

  const controlsContainer = document.querySelector('.controls-bar-container')
  const controlsDisplay = controlsContainer && controlsContainer.style.display
  if (controlsContainer) {
    controlsContainer.style.display = 'block'
  }

  const progress = Math.max(0, Math.min(time / media.duration, 1))
  clickAtProgress(progressBar, progress)

  if (controlsContainer) {
    controlsContainer.style.display = controlsDisplay
  }
})
