# Enable scanning on all stages
ARG BUILDKIT_SBOM_SCAN_CONTEXT=true
ARG BUILDKIT_SBOM_SCAN_STAGE=true

FROM node:26.8-trixie AS build

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run check
RUN npm run build

RUN mkdir ./sbom
RUN npm install --global @cyclonedx/cyclonedx-npm
RUN cyclonedx-npm --output-format JSON --output-file "./sbom/app.cdx.json" --validate --mc-type application 

FROM node:26.8-trixie AS release

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/sbom ./sbom
COPY package.json ./

CMD [ "node", "build" ]

EXPOSE 3000
