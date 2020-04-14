### Quasar App Extension  
# API Wrapper
===

_An easy to use out of the box API wrapper tha use Axios  in its core_

> Note: The extension can be used as an `npm` package, using: [api-client-wrapper](https://www.npmjs.com/package/api-client-wrapper)

This extension was designed to wrapp up the most common implementations for an api client in an effort to have a quick tool for each project.

The features present in the extension are:
1 **Easy global access:** The extension came with a boot script that put a global _**$api**_ object available at the global scope of any component
```javascript
this.$api
```
1 **Base API url:** The url tha it will be used as root for any call that contains a relative path `this.$api.baseURL`. **Note:** If a call contains a full path (one with http or https protocol) it will be called as is without _baseURL_ concatenation.

1 **Homogeneous response:** Each request is a promise that resolve with an homogeneous response object: `{success:Boolean, attempts:int, data:Object, info:string, error:Error}`. For more details refer to the _Response Schema_ section on this readme.

1 **Concurrent requests:** All the requests could be made simultaneously. By default the limit is configured to 5 concurrent requests, but it could be changed at `this.$api.simultaneousCalls`

1 **Timeout and retry:** In the case of a timeout response a request could be configured to try again with: `this.$api.maxAttemptsPerCall` the default value is _1_. Each attempt will be executed transparently and it will be just one response so the code for a request with a single attempt will be the same as for a request with multiple attempts.

1 **Masive requests:** There is out of the box support for bulk calls that allows multiple requests in a single call. for more information refer to the _How To use it_ section on this readme.

1 **Vuex integration:** The extension came with Vuex store integration for state monitoring. During boot phase a module is registered to Vuex with the next information:
  - Working: Indicating that is at least one request executing `this.$store.state.APIwrapper.working`
  - Uploading: Indicating that is at least one request executing with a method different from `GET` `this.$store.state.APIwrapper.uploading`
  - Downloading: Indicating that is at least one request executing with a method equal to `GET` `this.$store.state.APIwrapper.downloading`
  - Request Count: Indicates the amount of requests being managed, _executing requests + waiting for execution requests_ `this.$store.state.APIwrapper.request_count`
  - Execute Count: Indicates the amount of requests being executed in a concurrent manner `this.$store.state.APIwrapper.executing_count`
> Note: It is possible to have the store configured out of the boot phase using `this.$api.setStore(Vuex_instance)`. PLease refere to the _How to use it_ section.


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
> Add longer information here that will help the user of your app extension.

# Other Info
> Add other information that's not as important to know
