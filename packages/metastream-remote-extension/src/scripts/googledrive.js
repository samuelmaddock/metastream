window.addEventListener('load', () => {
  function clearPreview() {
    const previewImg = document.querySelector('img:not([alt=""])')
    if (previewImg) {
      previewImg.click()
      return true
    }
  }

  const start = Date.now()
  const intervalId = setInterval(() => {
    if (clearPreview() || Date.now() - start > 10e3) {
      clearInterval(intervalId)
    }
  }, 500)
}, false)
