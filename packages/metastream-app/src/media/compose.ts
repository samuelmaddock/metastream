import {
  IMediaMiddleware,
  IMediaRequest,
  IMediaResponse,
  IMediaMiddlewareResolve,
  IMediaContext
} from './types'

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */
function compose(middleware: IMediaMiddleware[]) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const mware of middleware) {
    if (typeof mware.match !== 'function' || typeof mware.resolve !== 'function') {
      throw new TypeError('Middleware must be composed of functions!')
    }
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */
  return function(ctx: IMediaContext) {
    // last called middleware #
    let index = -1
    return dispatch(0)
    function dispatch(i: number): PromiseLike<IMediaResponse | void> {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let mware: IMediaMiddleware | undefined = middleware[i]
      if (!mware) return Promise.resolve()

      if (!mware.match(ctx.req.url, ctx)) {
        return Promise.resolve(dispatch(i + 1))
      }

      try {
        return Promise.resolve<any>(
          mware.resolve(ctx, function next() {
            return dispatch(i + 1)
          })
        )
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}

export default compose
