
FROM node:16
WORKDIR /usr/app
COPY . /usr/app

# NodeJS applications have a default memory limit of 2.5GB.
# This limit is bit tight for a Prater node, it is recommended to raise the limit
# since memory may spike during certain network conditions.
ENV NODE_OPTIONS=--max-old-space-size=4096

ENTRYPOINT ["node", "./packages/cli/bin/lodestar"]
