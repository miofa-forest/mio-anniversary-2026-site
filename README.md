# SvelteKit Project

## Required Tools

- NodeJS 24
- npm

Preferrably, use the [devcontainer](https://containers.dev/) that is already configured in this repository.

## Developing

Use `npm install` to install dependencies.

> [!NOTE]
> The devcontainer runs this automatically when it starts, but it needs to be ran manually if dependencies change while the container is up.

Then start a development server with:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

Run tests with:

```sh
npm run test

# Equivalent to:
npm run test:unit
npm run test:e2e
```

To validate the code conforms to the required rules:

```sh
npm run check # Check for compiler errors, Svelte warnings, etc
npm run lint # Check formatting

# To automatically fix formatting errors:
npm run format
```

## Building

To build a production bundle:

```sh
npm run build
```

The output can be found in the `build` directory.

You can preview the production build with `npm run preview`.

To build the full docker image, use:

```sh
# The argument to -t can be any desired image name
docker build -t app .
```

Note that the Docker build includes building the app bundle, so it is not necessary to run `npm run build` before `docker build`.
