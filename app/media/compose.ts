import {
  IMediaMiddleware,
  IMediaRequest,
  IMediaResponse,
  IMediaMiddlewareResolve
} from 'services/types';

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */
function compose(middleware: IMediaMiddlewareResolve[]) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!');
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!');
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */
  return function(req: IMediaRequest, res: IMediaResponse, next?: IMediaMiddlewareResolve) {
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i: number): PromiseLike<IMediaResponse | void> {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'));
      index = i;
      let fn: IMediaMiddlewareResolve | undefined = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return Promise.resolve();

      try {
        return Promise.resolve<any>(
          fn(req, res, function next() {
            return dispatch(i + 1);
          })
        );
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}

export default compose;
