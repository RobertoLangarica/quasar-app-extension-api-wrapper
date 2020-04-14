/**
 * Quasar App Extension index/runner script
 * (runs on each dev/build)
 *
 * Docs: https://quasar.dev/app-extensions/development-guide/index-api
 * API: https://github.com/quasarframework/quasar/blob/master/app/lib/app-extension/IndexAPI.js
 */

//  import APIWrapper from './wrapper/APIWrapper'

module.exports = function (api) {
    
    // APIWrapper.baseURL = api.prompts.baseURL !==  '' ? api.prompts.baseURL : APIWrapper.baseURL;

    api.extendQuasarConf((conf, api) => {
    
      // make sure my-ext boot file is registered
    conf.boot.push('~quasar-app-extension-api-wrapper/src/boot/api-wrapper-bootfile.js')

    // make sure boot file transpiles
    conf.build.transpileDependencies.push(/quasar-app-extension-api-wrapper[\\/]src[\\/]boot/)
    // conf.build.transpileDependencies.push(/quasar-app-extension-api-wrapper[\\/]src[\\/]wrapper/)
    // if boot file imports anything, make sure that
    // the regex above matches those files too!
  })
}
