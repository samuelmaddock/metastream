export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

export const nextPowerOfTwo = (value: number) =>
  Math.pow(2, Math.ceil(Math.log(value + 1) / Math.log(2)))
