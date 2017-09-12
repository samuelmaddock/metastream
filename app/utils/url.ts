type QueryParams = { [key: string]: any };

const esc = encodeURIComponent;

export const encodeQueryParams = (params: QueryParams): string => {
  return Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
};

export const buildUrl = (url: string, params: QueryParams): string => {
  return url + encodeQueryParams(params);
};

/** Determine if the string is a valid URL. */
export const isUrl = (str: string): boolean => {
  // TODO: make this more robust
  // maybe use https://www.npmjs.com/package/valid-url
  return str.startsWith('http://') || str.startsWith('https://');
};
