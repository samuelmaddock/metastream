import request, { CoreOptions } from 'request';

export const nodeFetch = <T = string>(url: string, options?: CoreOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    request(url, options, (err, resp, body) => {
      if (err) {
        reject();
      } else {
        resolve(body);
      }
    });
  });
};
