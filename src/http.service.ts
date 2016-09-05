import { Injectable, Type, Provider, Injector } from '@angular/core';
import { Http, RequestOptionsArgs, Response, Request } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';

// Copied shamelessly from https://github.com/Teradata/covalent

export interface IHttp {
  delete: (url: string, options?: RequestOptionsArgs) => Observable<Response>;
  get: (url: string, options?: RequestOptionsArgs) => Observable<Response>;
  head: (url: string, options?: RequestOptionsArgs) => Observable<Response>;
  patch: (url: string, body: any, options?: RequestOptionsArgs) => Observable<Response>;
  post: (url: string, body: any, options?: RequestOptionsArgs) => Observable<Response>;
  put: (url: string, body: any, options?: RequestOptionsArgs) => Observable<Response>;
  request: (url: string | Request, options?: RequestOptionsArgs) => Observable<Response>;
}


export interface HttpInterceptor {
  onRequest?: (requestOptions: RequestOptionsArgs) => RequestOptionsArgs;
  onResponse?: (response: Response) => Response;
  onResponseError?: (error: Response) => Response;
}

@Injectable()
export class HttpService implements IHttp {

  private requestInterceptors: HttpInterceptor[] = [];

  constructor(private _http: Http, private _injector: Injector, requestInterceptors: Type<any>[]) {
    requestInterceptors.forEach((interceptor: Type<any>) => {
      this.requestInterceptors.push(<HttpInterceptor>_injector.get(interceptor));
    });
  }

  request(url: string | Request, options: RequestOptionsArgs = {}): Observable<Response> {
    this._requestConfig(options);
    return this._resolve(this._http.request(url, options));
  }

  delete(url: string, options: RequestOptionsArgs = {}): Observable<Response> {
    this._requestConfig(options);
    return this._resolve(this._http.delete(url, options));
  }

  get(url: string, options: RequestOptionsArgs = {}): Observable<Response> {
    this._requestConfig(options);
    return this._resolve(this._http.get(url, options));
  }

  head(url: string, options: RequestOptionsArgs = {}): Observable<Response> {
    this._requestConfig(options);
    return this._resolve(this._http.head(url, options));
  }

  patch(url: string, data: any, options: RequestOptionsArgs = {}): Observable<Response> {
    this._requestConfig(options);
    return this._resolve(this._http.patch(url, data, options));
  }

  post(url: string, data: any, options: RequestOptionsArgs = {}): Observable<Response> {
    this._requestConfig(options);
    return this._resolve(this._http.post(url, data, options));
  }

  put(url: string, data: any, options: RequestOptionsArgs = {}): Observable<Response> {
    this._requestConfig(options);
    return this._resolve(this._http.put(url, data, options));

  }

  private _resolve(responseObservable: Observable<Response>): Observable<Response> {
    return responseObservable.do((response: Response) => {
        return this._responseResolve(response);
      }).catch((error: Response) => {
        return this._errorResolve(error);
      });
  }

  private _requestConfig(requestOptions: RequestOptionsArgs): void {
    this.requestInterceptors.forEach((interceptor: HttpInterceptor) => {
      if (interceptor.onRequest) {
        requestOptions = interceptor.onRequest(requestOptions);
      }
    });
  }

  private _responseResolve(response: Response): Observable<Response> {
    this.requestInterceptors.forEach((interceptor: HttpInterceptor) => {
      if (interceptor.onResponse) {
        response = interceptor.onResponse(response);
      }
    });
    return new Observable<any>((subscriber: Subscriber<any>) => {
      subscriber.next(response);
    });
  }

  private _errorResolve(error: Response): Observable<Response> {
    this.requestInterceptors.forEach((interceptor: HttpInterceptor) => {
      if (interceptor.onResponseError) {
        error = interceptor.onResponseError(error);
      }
    });
    return new Observable<any>((subscriber: Subscriber<any>) => {
      subscriber.error(error);
    });
  }
}

export function provideInterceptors(requestInterceptors: Type<any>[] = []): any[] {
  let providers: any[] = [];
  requestInterceptors.forEach((interceptor: Type<any>) => {
    providers.push(interceptor);
  });
  providers.push({
    provide: HttpService,
    useFactory: (http: Http, injector: Injector): HttpService => {
      return new HttpService(http, injector, requestInterceptors);
    },
    deps: [Http, Injector]
  });
  return providers;
}