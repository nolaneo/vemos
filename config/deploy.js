/* eslint-env node */
'use strict';

module.exports = function() {
  let ENV = {
    build: {},
    rootURL: '/',
    locationType: 'hash',
    ghpages: {
      gitRemoteUrl: 'git@github.com:/nolaneo/vemos',
    }
  };
  return ENV;
};