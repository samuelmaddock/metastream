/** Bad clone util, don't use this */
export const clone = (obj: Object): Object => {
  return JSON.parse(JSON.stringify(obj))
}

export const cleanObject = (obj: any): any => {
  const newObj: any = {}
  const propNames = Object.getOwnPropertyNames(obj)
  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i]
    const value = obj[propName]
    if (typeof value === 'undefined') continue
    newObj[propName] = typeof value === 'object' ? cleanObject(value) : value
  }
  return newObj
}
