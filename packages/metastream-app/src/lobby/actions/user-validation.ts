import { USERNAME_MAX_LEN, USERNAME_MIN_LEN, COLOR_LEN } from '../../constants/settings'

export const validateDisplayName = (displayName: string): boolean =>
  typeof displayName === 'string' &&
  displayName.length >= USERNAME_MIN_LEN &&
  displayName.length <= USERNAME_MAX_LEN

export const validateColor = (color: string): boolean =>
  typeof color === 'string' && color.length === COLOR_LEN

export const validateAvatar = (avatar: string): boolean => typeof avatar === 'string'
