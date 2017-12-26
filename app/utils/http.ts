const { remote } = chrome;
import { CoreOptions, RequestResponse, RequestCallback } from 'request';

let request: any;

export const fetchText = <T = string>(
  url: string,
  options?: CoreOptions
): Promise<[T, RequestResponse]> => {
  request = request || remote.require('request');
  return new Promise((resolve, reject) => {
    request(url, options, (err: any, resp: any, body: any) => {
      if (err) {
        reject();
      } else {
        resolve([body, resp]);
      }
    });
  });
};

export const fetchResponse = (url: string, options?: CoreOptions): Promise<RequestResponse> => {
  return new Promise((resolve, reject) => {
    request = request || remote.require('request');
    request(url, options, (err: any, resp: any, body: any) => {
      if (err) {
        reject();
      } else {
        resolve(resp);
      }
    });
  });
};
