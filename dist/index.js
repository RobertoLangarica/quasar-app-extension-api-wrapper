"use strict";
/**
 * Quasar App Extension index/runner script
 * (runs on each dev/build)
 *
 * Docs: https://quasar.dev/app-extensions/development-guide/index-api
 * API: https://github.com/quasarframework/quasar/blob/master/app/lib/app-extension/IndexAPI.js
 */
module.exports = function (api) {
    api.extendQuasarConf((conf, api) => {
        // make sure my-ext boot file is registered
        conf.boot.push('~quasar-app-extension-api-wrapper/dist/boot/api-wrapper-bootfile.js');
        // make sure boot file transpiles
        conf.build.transpileDependencies.push(/quasar-app-extension-api-wrapper[\\/]dist[\\/]boot/);
        // if boot file imports anything, make sure that
        // the regex above matches those files too!
    });
};
//# sourceMappingURL=index.js.map