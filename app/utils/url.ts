type QueryParams = {[key: string]: any}

const esc = encodeURIComponent;

export const encodeQueryParams = (params: QueryParams): string => {
  return Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
};

export const buildUrl = (url: string, params: QueryParams): string => {
  return url + encodeQueryParams(params);
}
