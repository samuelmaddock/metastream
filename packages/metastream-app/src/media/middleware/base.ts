import { IMediaMiddleware } from '../types'
import { APP_WEBSITE } from '../../constants/http'

const mware: IMediaMiddleware = {
  match({ origin }) {
    return origin === location.origin
  },

  resolve(ctx, next) {
    throw new Error('Unable to request Metastream app link')
  }
}

export default mware
