### Quasar App Extension  
# API Wrapper
===

_An easy to use out of the box API wrapper tha use [axios](https://github.com/axios/axios)  in its core_

> Note: The extension can be used as an `npm` package, using: [api-client-wrapper](https://www.npmjs.com/package/api-client-wrapper)

This extension was designed to wrap up the most common features of an api client implementation, in an effort to have a quick and stable tool for each project.

The present features in the extension are:
1. **Easy global access:** The extension came with a boot script that put an _**$api**_ object available at global scope for any component: `this.$api`

1. **Base API url:** The url that will be used as a root for any call that contains a relative path `this.$api.baseURL`. **Note:** If a call contains a full path (one with http or https protocol) it will be called as is without _baseURL_ concatenation.

1. **Homogeneous response:** Each request is a promise that resolve with an homogeneous response object: `{success:Boolean, attempts:int, data:Object, info:string, error:Error}`. For more details refer to the _Response Schema_ section on this readme.

1. **Concurrent requests:** All the requests could be made simultaneously. By default the limit is configured to 5 concurrent requests, but it could be changed at `this.$api.simultaneousCalls`

1. **Timeout and retry:** In the case of a timeout response a request could be configured to try again with: `this.$api.maxAttemptsPerCall` the default value is _1_. Each attempt will be executed transparently and it will be just one response so the code for a request with a single attempt will be the same as for a request with multiple attempts.

1. **Masive requests:** There is out of the box support for bulk calls that allows multiple requests in a single call. for more information refer to the _How To use it_ section on this readme.

1. **Vuex integration:** The extension came with Vuex store integration for state monitoring. During boot phase a module is registered to Vuex with the next information:
   1. Working: Indicating that is at least one request executing `this.$store.state.APIwrapper.working`
   1. Uploading: Indicating that is at least one request executing with a method different from `GET` `this.$store.state.APIwrapper.uploading`
   1. Downloading: Indicating that is at least one request executing with a method equal to `GET` `this.$store.state.APIwrapper.downloading`
   1. Request Count: Indicates the amount of requests being managed, _executing requests + waiting for execution requests_ `this.$store.state.APIwrapper.request_count`
   1. Execute Count: Indicates the amount of requests being executed in a concurrent manner `this.$store.state.APIwrapper.executing_count`
   
> Note: It is possible to have the store configured out of the boot phase using `this.$api.setStore(Vuex_instance)`. Refer to the _How to use it_ section.


# Install
```bash
quasar ext add api-wrapper
```
Quasar CLI will retrieve it from NPM and install the extension.

# Uninstall
```bash
quasar ext remove my-ext <- change name
```

# How to use it

### Performing a `GET` request

```javascript
let result = await this.$api.get('path');
//or
this.$api.get('path').then(result->{});
```

### Performing a `POST` request

```javascript
let result = await this.$api.post('path', {data});
//or
this.$api.post('path', {data}).then(result->{});
```

### The supported methods are:
```javascript
get(path='', conf = {})
post(path='', data = {}, conf = {})
patch(path='', data = {}, conf = {})
put(path='', data = {}, conf = {})
delete(path='', conf = {})
```
Note that each method has a final argument that is a custom configuration for the request, this configuration takes precedence over the global configuration. For the supported properties please refer to the _Configuration_ section.

### Bulk calls
Each method has a bulk counterpart that allows for bulk calls

```javascript
let result = await bulkGet(['paths' or {configs}], continueWithFailure:Boolean, onProgress)
let result = await bulkPost(['paths' or {configs}], continueWithFailure:Boolean, onProgress)
let result = await bulkPatch(['paths' or {configs}], continueWithFailure:Boolean, onProgress)
let result = await bulkPut(['paths' or {configs}], continueWithFailure:Boolean, onProgress)
let result = await bulkDelete(['paths' or {configs}], continueWithFailure:Boolean, onProgress)

//or the global method that allows bulk calls with different methods
let result = await bulkCall([{configs}], continueWithFailure:Boolean, onProgress)
```
#### Params:
* **[paths or configs]:[]**-> An array containing the paths for each request or an array of configuration objects (described next).
* **continueWithFailure:Boolean**-> Optional with the default to _false_.  **`false`** The request will be considered failed when any of it subrequests fail and it will stop any further execution (there could be some sub-requests that never get executed if some other request failed before). **`true`** All the requests are executed, it doesn´t matter if some of them failed.
* **onProgress:Function(progress:Number)**-> Is an optional callback that receives progress between [0-1], the progress is computed with the next formula: _(request-completed / total-amount-of-request-in-the-bulkCall)_
