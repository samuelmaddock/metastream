/** Bad clone util, don't use this */
export const clone = (obj: Object): Object => {
  return JSON.parse(JSON.stringify(obj))
}

export const cleanObject = (obj: any): any => {
  const newObj: any = {}
  const propNames = Object.getOwnPropertyNames(obj)
  for (let i = 0; i < propNames.length; i++) {
    var propName = propNames[i]
    if (obj[propName] !== undefined) {
      newObj[propName] = obj[propName]
    }
  }
  return newObj
}
