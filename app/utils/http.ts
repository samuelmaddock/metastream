import request, { CoreOptions, RequestResponse } from 'request';

export const fetchText = <T = string>(url: string, options?: CoreOptions): Promise<T> => {
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

export const fetchResponse = (url: string, options?: CoreOptions): Promise<RequestResponse> => {
  return new Promise((resolve, reject) => {
    request(url, options, (err, resp, body) => {
      if (err) {
        reject();
      } else {
        resolve(resp);
      }
    });
  });
};
