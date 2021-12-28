#!/bin/bash

PACKAGE_NAME=$(node -p 'require("./package.json").name')
if [ -z $RELEASE_NPM_TOKEN ]; then
  declare -n RELEASE_NPM_TOKEN="RELEASE_NPM_TOKEN_$GITLAB_USER_LOGIN"
fi
if [ -z $RELEASE_NPM_TOKEN ]; then
  echo No release npm token \(RELEASE_NPM_TOKEN or RELEASE_NPM_TOKEN_$GITLAB_USER_LOGIN\) defined. Aborting.
  exit 1
fi
RELEASE_BRANCH=$CI_COMMIT_BRANCH
# RELEASE_VERSION can be a version number (exact) or increment keyword (next in sequence)
if [ -z $RELEASE_VERSION ]; then RELEASE_VERSION=prerelease; fi
if [ -z $RELEASE_NPM_TAG ]; then
  if case $RELEASE_VERSION in major|minor|patch) ;; *) false;; esac; then
    RELEASE_NPM_TAG=latest
  elif case $RELEASE_VERSION in pre*) ;; *) false;; esac; then
    RELEASE_NPM_TAG=testing
  elif [ "$RELEASE_VERSION" != "${RELEASE_VERSION/-/}" ]; then
    RELEASE_NPM_TAG=testing
  else
    RELEASE_NPM_TAG=latest
  fi
fi

rm -rf build

# make sure the release branch exists as a local branch
git fetch origin
git branch -f $RELEASE_BRANCH origin/$RELEASE_BRANCH

# set up SSH auth using ssh-agent
mkdir -p -m 700 $HOME/.ssh
ssh-keygen -F gitlab.com >/dev/null 2>&1 || ssh-keyscan -H -t rsa gitlab.com >> $HOME/.ssh/known_hosts 2>/dev/null
eval $(ssh-agent -s) >/dev/null
echo -n "$RELEASE_DEPLOY_KEY" | ssh-add -
exit_code=$?
if [ $exit_code -gt 0 ]; then
  exit $exit_code
fi

# clone the branch from which we're releasing
git clone -b $RELEASE_BRANCH --no-local . build/$PACKAGE_NAME

# switch to clone
cd build/$PACKAGE_NAME
git status -s -b

# configure git to push changes
git remote set-url origin "git@gitlab.com:$CI_PROJECT_PATH.git"
git config user.email "$GITLAB_USER_EMAIL"
git config user.name "$GITLAB_USER_NAME"

# configure npm client for publishing
echo "access=public
tag=$RELEASE_NPM_TAG
//registry.npmjs.org/:_authToken=\"$RELEASE_NPM_TOKEN\"" > .npmrc

# release!
(
  set -e
  npm version -m v%s $RELEASE_VERSION
  if case $(node -p 'require("./package.json").version') in 1.0.0-*) ;; *) false;; esac; then
    sed -i "s/^tag=$RELEASE_NPM_TAG$/tag=latest/" .npmrc
  fi
  git push origin $(git describe --tags --exact-match)
  npm publish
  git push origin $RELEASE_BRANCH
)

exit_code=$?

# nuke npm settings
unlink .npmrc

git status -s -b

# nuke clone
cd -
rm -rf build

# kill the ssh-agent
eval $(ssh-agent -k) >/dev/null

exit $exit_code
