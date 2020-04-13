"use strict";

const EmberApp = require("ember-cli/lib/broccoli/ember-app");

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    fingerprint: {
      exclude: ["app"],
    },
    storeConfigInMeta: false,
    emberCliConcat: {
      js: {
        concat: true,
      },
      css: {
        concat: true,
      },
    },
  });

  app.import('node_modules/content-scripts-register-polyfill/index.js', { outputFile: 'assets/content-scripts-register-polyfill.js' });

  return app.toTree();
};
