const body = document.body

function enhanceVideo(video) {
  Object.assign(video, {
    loop: false,
    controls: false
  })

  Object.assign(video.style, {
    minWidth: '100%',
    minHeight: '100%'
  })
}

function enhanceImage(image) {
  const { src } = image

  // Assume extension is correct because we can't get the MIME type
  const isGif = src.endsWith('gif')

  Object.assign(image.style, {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    background: null,
    cursor: null,
    webkitUserDrag: 'none'
  })

  // Create new image which doesn't inherit any default zoom behavior
  const img = image.cloneNode(true)
  body.replaceChild(img, image)

  if (!isGif) {
    let bg = document.createElement('div')
    Object.assign(bg.style, {
      backgroundImage: `url(${src})`,
      backgroundSize: 'cover',
      backgroundPosition: '50% 50%',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: '-1',
      filter: 'blur(20px) brightness(0.66)',
      transform: 'scale(1.2)'
    })
    body.insertBefore(bg, document.body.firstChild)
  }
}

if (body && body.childElementCount === 1) {
  const video = document.querySelector('body > video[autoplay]')
  if (video) {
    enhanceVideo(video)
  }

  const image = document.querySelector('body > img')
  if (image) {
    enhanceImage(image)
  }
}
