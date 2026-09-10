FROM mcr.microsoft.com/devcontainers/typescript-node:5-26-trixie

RUN npx playwright install-deps

USER node

# Create mountpoints for caches
RUN mkdir -p ~/.vscode-server/extensions
RUN mkdir -p ~/.cache
