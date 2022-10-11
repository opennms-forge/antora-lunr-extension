#!/bin/bash

# set up variables
if [ -z "$RELEASE_DEPLOY_KEY" ]; then
  declare -n RELEASE_DEPLOY_KEY="RELEASE_DEPLOY_KEY_$GITLAB_USER_LOGIN"
  if [ -z "$RELEASE_DEPLOY_KEY" ]; then
    echo No release deploy key \(RELEASE_DEPLOY_KEY or RELEASE_DEPLOY_KEY_$GITLAB_USER_LOGIN\) defined. Halting release.
    exit 1
  fi
fi
if [ -z "$RELEASE_NPM_TOKEN" ]; then
  declare -n RELEASE_NPM_TOKEN="RELEASE_NPM_TOKEN_$GITLAB_USER_LOGIN"
  if [ -z "$RELEASE_NPM_TOKEN" ]; then
    echo No release npm token \(RELEASE_NPM_TOKEN or RELEASE_NPM_TOKEN_$GITLAB_USER_LOGIN\) defined. Halting release.
    exit 1
  fi
fi
RELEASE_BRANCH=${CI_COMMIT_BRANCH:-main}
# RELEASE_VERSION can be a version number (exact) or increment keyword (next in sequence)
if [ -z "$RELEASE_VERSION" ]; then RELEASE_VERSION=prerelease; fi
if [ -z "$RELEASE_NPM_TAG" ]; then
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

# set up SSH auth using ssh-agent
mkdir -p -m 700 $HOME/.ssh
ssh-keygen -F gitlab.com >/dev/null 2>&1 || ssh-keyscan -H -t rsa gitlab.com >> $HOME/.ssh/known_hosts 2>/dev/null
eval $(ssh-agent -s) >/dev/null
if [ -f "$RELEASE_DEPLOY_KEY" ]; then
  chmod 600 $RELEASE_DEPLOY_KEY
  ssh-add -q $RELEASE_DEPLOY_KEY
else
  echo -n "$RELEASE_DEPLOY_KEY" | ssh-add -q -
fi
exit_code=$?
if [ $exit_code -gt 0 ]; then
  exit $exit_code
fi
echo Deploy key identity added to SSH agent.

# configure git to push changes
git config --local user.name "$GITLAB_USER_NAME"
git config --local user.email "$GITLAB_USER_EMAIL"
git remote set-url origin git@gitlab.com:$CI_PROJECT_PATH.git
git fetch --depth ${GIT_DEPTH:-5} --update-shallow origin $RELEASE_BRANCH

# make sure the release branch exists as a local branch
git checkout -b $RELEASE_BRANCH -t origin/$RELEASE_BRANCH

if [ "$(git rev-parse $RELEASE_BRANCH)" != "$CI_COMMIT_SHA" ]; then
  echo $RELEASE_BRANCH moved forward from $CI_COMMIT_SHA. Halting release.
  exit 1
fi

# configure npm client for publishing
echo -e "//registry.npmjs.org/:_authToken=$RELEASE_NPM_TOKEN" > $HOME/.npmrc

# release!
(
  set -e
  npm version --no-git-tag-version $RELEASE_VERSION
  RELEASE_VERSION=$(npm exec -c 'echo -n $npm_package_version')
  if case $RELEASE_VERSION in 1.0.0-*) ;; *) false;; esac; then
    RELEASE_NPM_TAG=latest
  fi
  git commit -a -m "release $RELEASE_VERSION [skip ci]"
  HEAD_COMMIT=$(git rev-parse HEAD)
  npx -y rollup -c rollup.config.js
  sed -i '/^\(#\|\/data\/\)/d' .gitignore
  git add .gitignore data
  git commit -m 'add dist files for npm package'
  git tag -m "version $RELEASE_VERSION" v$RELEASE_VERSION
  git push origin $(git describe --tags --exact-match)
  npm publish --access public --tag $RELEASE_NPM_TAG
  git reset --hard $HEAD_COMMIT
  git push origin $RELEASE_BRANCH
)

exit_code=$?

# nuke npm settings
rm -f $HOME/.npmrc

git status -s -b

# kill the ssh-agent
eval $(ssh-agent -k) >/dev/null

exit $exit_code
