#!/bin/bash

DIR=$(cd $(dirname ${BASH_SOURCE[0]}) && pwd)
ROOT=$(cd "${DIR}/../.." && pwd)
NAME=$(basename ${BASH_SOURCE[0]})

if [ -z "$HOSTS" ]; then
    echo "${NAME} error: you must set the HOSTS env variable" && exit 1
fi

for host in $(echo "${HOSTS}" | tr ";" "\n"); do
    echo "Deploying to host ${host}"
    ssh -T "${host}" "exit 0" >/dev/null
    if [ $? -ne 0 ]; then
        echo "${NAME} error: unable to connect to host ${host}" && exit 1
    fi
    ssh "${host}" 'test -d /var/www/pierrelemee || mkdir -p /var/www/pierrelemee'
done

if [ ! -d "/tmp/.dep" ]; then
    mkdir "/tmp/.dep"
fi

VERSION=$(date '+%Y%m%d%H%M%S')
TEMP_DIR="/tmp/.dep/${VERSION}"

if [ -d "" ]; then
    echo "${NAME} error: temp directory ${TEMP_DIR} already exists :(" && exit 1
else
    # Local build
    cp -r "${ROOT}" "${TEMP_DIR}/" 2>/dev/null || :
    cd "${TEMP_DIR}" || exit
    # yarn install
    # yarn build
    for item in .github .DS_Store .git .idea .venv vendor infra node_modules tests var .env.dev .env.test .gitignore package.json README.md webpack.config.js yarn.lock; do
        rm -Rf "${TEMP_DIR:?}/${item}"
    done
    # Upload code
    for host in $(echo "${HOSTS}" | tr ";" "\n"); do
      scp -rqC "${TEMP_DIR}" "${host}:/var/www/pierrelemee/${VERSION}"
    done
    # Shared files
    for host in $(echo "${HOSTS}" | tr ";" "\n"); do
      shared_files=$(ssh "${host}" 'find /var/shared/pierrelemee -printf "%P\n"')
      for shared_file in ${shared_files}; do
          echo "Symlinking shared file ${shared_file}"
          ssh "${host}" "ln -snf /var/shared/pierrelemee/${shared_file} /var/www/pierrelemee/${VERSION}/${shared_file}"
      done
    done
    # Install PHP dependencies w/ composer
    composer --no-cache --no-interaction --no-dev install
    rm -Rf "${TEMP_DIR:?}/var"
    # Update symlinks
    for host in $(echo "${HOSTS}" | tr ";" "\n"); do
      ssh "${host}" "ln -snf /var/www/pierrelemee/${VERSION} /var/www/pierrelemee/current"
    done
    for host in $(echo "${HOSTS}" | tr ";" "\n"); do
      ssh "${host}" 'systemctl reload nginx.service'
    done
    # Remove older builds
    for host in $(echo "${HOSTS}" | tr ";" "\n"); do
      ssh "${host}" 'for build in $(find /var/www/pierrelemee -maxdepth 1 -type d  | grep -v "^$" | sort | head -n -5); do rm -Rf "/var/www/pierrelemee/${build}"; done'
    done
fi

