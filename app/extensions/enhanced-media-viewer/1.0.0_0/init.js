const body = document.body;

function enhanceVideo(video) {
  video.loop = true;
  video.controls = false;
  video.style.minWidth = '100%';
  video.style.minHeight = '100%';
}

function enhanceImage(image) {
  const { src } = image;

  // TODO: why doesn't objectFit work?
  if (image.style.cursor !== 'zoom-in') {
    if (image.width > image.height) {
      image.style.minWidth = '100%';
    } else {
      image.style.minHeight = '100%';
    }
  }

  let bg = document.createElement('div');
  Object.assign(bg.style, {
    backgroundImage: `url(${src})`,
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: '-1',
    filter: 'blur(20px) brightness(0.7)',
    transform: 'scale(1.2)'
  });
  body.insertBefore(bg, document.body.firstChild);
}

if (body && body.childElementCount === 1) {
  const video = document.querySelector('body video[autoplay]');
  if (video) {
    enhanceVideo(video);
  }

  const image = document.querySelector('body img');
  if (image) {
    enhanceImage(image);
  }
}
