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

document.addEventListener('ms:seek', e => {
  e.preventDefault()
  const time = e.detail / 1000
  const media = document.querySelector('video')
  const progress = Math.max(0, Math.min(time / media.duration, 1))

  const controlsContainer = document.querySelector('.controls-bar-container')
  const controlsDisplay = controlsContainer.style.display
  controlsContainer.style.display = 'block'

  const progressBar = document.querySelector('.controls__progress-bar-total')
  clickAtProgress(progressBar, progress)

  controlsContainer.style.display = controlsDisplay
})
