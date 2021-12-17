#!/bin/bash

if [ -z $npm_config_registry ]; then npm_config_registry=http://localhost:4873/; fi

RELEASE_VERSION=${1:-patch}
RELEASE_NPM_TAG=${RELEASE_NPM_TAG:-latest}

# configure npm client for publishing
echo "access=public
tag=$RELEASE_NPM_TAG
registry=$npm_config_registry" > .npmrc

if [ ! -z $RELEASE_NPM_TOKEN ]; then
  echo "${npm_config_registry#*:}/:_authToken=\"$RELEASE_NPM_TOKEN\"" >> .npmrc
fi

# release!
(
  set -e
  npm version -m v%s $RELEASE_VERSION
  npm publish
  git describe --tags --exact-match
)

exit_code=$?

# nuke npm settings
unlink .npmrc

exit $exit_code
