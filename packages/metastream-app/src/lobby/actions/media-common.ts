/** Code-split media parsing due to large dependencies and it's only used by the host. */
export const getMediaParser = () => import(/* webpackChunkName: "media-parser" */ 'media')
