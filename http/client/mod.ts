export interface HttpHeaders {
  [key: string]: string;
}

export interface HttpParams {
  [key: string]: string;
}

export interface HttpAuth {
  username?: string;
  password?: string;
}

export interface HttpOptions {
  params?: HttpParams;
  baseURL?: string;
  headers?: HttpHeaders;
  data?: any;
  auth?: HttpAuth;
}

export interface HttpConfig extends HttpOptions {
  url: string;
  method: HttpMethod;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Headers;
  config: HttpConfig;
  data?: any;
}

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
  // ...more
}

class Http {
  constructor(public config: HttpConfig) {}
  create(config: HttpConfig): Http {
    return new Http(config);
  }
  private request(_config: HttpConfig): Promise<HttpResponse> {
    const config = { ...this.config, ..._config };
    return fetch(config.url, {
      method: config.method
    }).then(res => {
      return {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        config: config,
        data: res.text
      };
    });
  }
  public get(url: string, params?: HttpParams, config: HttpOptions = {}) {
    return this.request({
      url,
      method: HttpMethod.GET,
      params,
      ...config
    });
  }
  public post(
    url: string,
    params?: HttpParams,
    data: any = null,
    config: HttpOptions = {}
  ) {
    return this.request({
      url,
      method: HttpMethod.POST,
      params,
      data,
      ...config
    });
  }
  public put(
    url: string,
    params?: HttpParams,
    data: any = null,
    config: HttpOptions = {}
  ) {
    return this.request({
      url,
      method: HttpMethod.PUT,
      params,
      data,
      ...config
    });
  }
  public delete(url: string, params?: HttpParams, config: HttpOptions = {}) {
    return this.request({
      url,
      method: HttpMethod.DELETE,
      params,
      ...config
    });
  }
  // ...more
}

const http = new Http({ url: "", method: HttpMethod.GET });

export { http, Http };
