/**
 * document.cookie is not allowed in the chrome:// protocol
 * Google Analytics uses it to keep track of the client ID
 *
 * To fix this, we implement a simple, custom document.cookie which
 * uses localStorage for storage.
 *
 * This implementation ignores expiration dates and acts only as
 * a simple keyvalue store.
 */

const getKeyValue = (c: string) => {
  const [key, value] = c.split('=')
  return { key, value }
}

let cookie: string = localStorage.getItem('cookie') || ''
Object.defineProperty(document, 'cookie', {
  get() {
    return cookie
  },
  set(newCookie) {
    const kv = getKeyValue(newCookie.split(';')[0])

    let set = false
    const cookies = cookie
      .split('; ')
      .map((c: string) => {
        if (c.indexOf(`${kv.key}=`) === 0) {
          set = true
          if (kv.value.length) {
            return `${kv.key}=${kv.value}`
          } else {
            return ''
          }
        }
        return c
      })
      .filter(Boolean)

    if (!set) {
      cookies.push(`${kv.key}=${kv.value}`)
    }

    cookie = cookies.join('; ')
    localStorage.setItem('cookie', cookie)

    return newCookie
  }
})
