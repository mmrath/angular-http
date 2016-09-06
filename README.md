# Angular 2 HTTP Utilities

This is the home of angular2 http, a collection of utility classes for http related services. All of these services are collected from different open source projects

[![Build Status](https://travis-ci.org/angular-util/http.svg?branch=master)](https://travis-ci.org/angular-util/http)

## Getting started

```
npm install @angular-util/http --save
```

## HttpService class

```HttpService``` is a wrapper around angular's ```Http``` with same API as ```Http```. HttpService provides options to intercept request, response and response error. This class is directly lifted from https://github.com/Teradata/covalent.git

To add a desired interceptor, it needs to implement the [HttpInterceptor] interface.

```typescript
export interface HttpInterceptor {
  onRequest?: (requestOptions: RequestOptionsArgs) => RequestOptionsArgs;
  onResponse?: (response: Response) => Response;
  onResponseError?: (error: Response) => Response;
}
```
Every method is optional, so you can just implement the ones that are needed.

Example:

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor } from '@covalent/http';

@Injectable()
export class CustomInterceptor implements HttpInterceptor {

  onRequest(requestOptions: RequestOptionsArgs): RequestOptionsArgs {
    ... // do something to requestOptions
    return requestOptions;
  }

  onResponse(response: Response): Response {
    ... // check response status and do something
    return response;
  }

  onResponseError(error: Response): Response {
    ... // check error status and do something
    return error;
  }
}

```

Also, you need to bootstrap the interceptor providers

```typescript

@NgModule({
  declarations: [
    ...
  ],
  imports: [
    ...
  ],
  exports: [
    ...
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [
        provideHttpService([CustomInterceptor])
      ]
    };
  }
}
```

After that, just inject [HttpService] and use it for your requests.

## Resource class

```Resource``` class provides convinient access to your restful backend service. You will need to extend ```Resource``` class to create a service to access your backend. All methods return a ```Observable```

```typescript
@Injectable()
@ResourceConfig({url: '/api/users'})
export class UserResource extends Resource<User> {
  constructor(http: HttpService) {
    super(http);
  }
}
```

A simple ```UserResource``` defined above will give you access to the following methods.

### Default methods (available for free)
Result is always converted to JSON by default, so if your backend service returns JSON you don't have to map result to json.

#### findOne

  Signature: ```findOne(@Path('id') id: string|number): Observable<T>```

  Target URL: ```GET /api/users/{id}```

  Usage:
  ```typescript
  userResource.findOne(12)
    .subscribe(
      res => {
        // Do something with success response
      },
      err => {
        // Do something with error
      });
  ```

#### save
  Signature: ```save(body: any): Observable<T>```

  Target URL: ```POST /api/users```

  Usage:
  ```typescript
  userResource.save(someUserObject)
    .subscribe( ... );
  ```

#### update

  Signature: ```update(id: string|number, body: any): Observable<T>```

  Target URL: ```PUT /api/users/{id}```

  Usage:
  ```typescript
  userResource.update(12, someUserObject)
    .subscribe( ... );
  ```

#### delete
  Signature: ```delete(id: string|number): Observable<T>```

  Target URL: ```DELETE /api/users/{id}```

  Usage:
  ```typescript
  userResource.delete(12)
    .subscribe(...);
  ```

#### find
  Signature: ```update(id: string|number, body: any): Observable<T>```

  This method can be used for query and search screens

  Target URL: ```GET /api/users```

  Usage:
  ```typescript
  userResource.find(someQueryObject)
    .subscribe( ... );
  ```

### Adding extension methods

The code below shows how to extend ```UserResource``` with a new method to query roles for a user

```typescript
@Injectable()
@ResourceConfig({url: '/api/users'})
export class UserResource extends Resource<User> {
  constructor(http: HttpService) {
    super(http);
  }

  @GET('/{id}/roles')
  findRoles(@Path('id') id:number): Observable<List<Role>>> {
    return null; // Return null as actual return is handled by @GET decorator
  }

}
```

Now you can use this new method as

```typescript
  userResource.findRoles(12)
    .subscribe( ... );
```

### Decorators on extension method

<table>
  <tbody>
    <tr>
        <th>Decorator type</th>
        <th>Decorator</th>
        <th>Description</th>
        <th>Usage</th>
      </tr>
    <tr>
      <td rowspan="4">Request Method</td>
      <td>
        <code>@GET(url?: string)</code>
      </td>
      <td rowspan="4">
      This decorator is used for indicating HTTP request method to be used for http request.
      The url parameter to this decorator is added to base url parameter (specified by <code>@ResourceConfig</code>)
      </td>
      <td rowspan="4">
      <code>
      <pre>
@GET('/{id}/roles')
findRoles(@Path('id') id:number): Observable<List<Role>>> {
  return null; // Return null as actual return is handled by @GET decorator
}</pre>
      </code>
      </td>
    </tr>
    <tr>
    <td><code>@POST(url?: string)</code></td>
    </tr>
    <tr>
    <td><code>@PUT(url?: string)</code></td>
    </tr>
    <tr>
    <td><code>@DELETE(url?: string)</code></td>
    </tr>
    <tr>
      <td rowspan="4">Method Parameter</td>
      <td>
        <code>@Path(key: string|number)</code>
      </td>
      <td>Used for replacing a URL path placeholder with the method parameter value</td>
      <td>In this example url path placeholder <code>{id}</id></code> will be replaced with values of paramater to method call
      <code>
      <pre>
@GET('/{id}/roles')
findRoles(@Path('id') id:number): Observable<List<Role>>> {
  return null;
}</pre>
      </code>
      </td>
    </tr>
    <tr>
    <td>
        <code>@Query</code>
      </td>
      <td>Used for replacing a URL path placeholder with the method parameter value</td>
      <td>In this example each key of objects pageRequest and searchParams will be added to the URL as parameters.
      <code>
      <pre>
@GET('/roles')
find(@Query pageRequest?: PageRequest, @Query searchParams?: any): Observable<Page<T>> {
  return null;
}</pre>
      </code>
      </td>
    </tr>
    <tr>
    <td>
        <code>@Body</code>
      </td>
      <td>The indicated parameter will be sent as body of the request</td>
      <td>In this example roles object will be stringified and sent and body of the http request.
      <code>
      <pre>
@POST('/roles')
addRoles(@Body roles: any): Observable<User> {
  return null;
}
</pre>
      </code>
      </td>
    </tr>
    <tr>
    <td>
        <code>@Header</code>
      </td>
      <td>The indicated parameter will be sent as header of the request</td>
      <td>In this example a request header <code>secretKey</code> with value as <code>key</code> will be sent with the http request.
      <code>
      <pre>
@POST('/activate')
activate(@Header('secretKey') key: string): Observable {
  return null;
}
</pre>
      </code>
      </td>
    </tr>
  </tbody>
</table>
