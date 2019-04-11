/** Bad clone util, don't use this */
export const clone = (obj: Object): Object => {
  return JSON.parse(JSON.stringify(obj))
}

export const cleanObject = <T extends Object>(obj: T): T => {
  const newObj: any = {}
  const propNames = Object.getOwnPropertyNames(obj)
  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i]
    const value = (obj as any)[propName]
    if (typeof value === 'undefined') continue
    newObj[propName] = typeof value === 'object' ? cleanObject(value) : value
  }
  return newObj
}
