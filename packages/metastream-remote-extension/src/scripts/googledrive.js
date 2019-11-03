window.addEventListener('load', () => {
  const previewImg = document.querySelector('img:not([alt=""])')
  if (previewImg) {
    previewImg.click()
  }
})
