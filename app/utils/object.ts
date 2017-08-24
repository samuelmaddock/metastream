/** Bad clone util, don't use this */
export const clone = (obj: Object): Object => {
  return JSON.parse(JSON.stringify(obj));
}
