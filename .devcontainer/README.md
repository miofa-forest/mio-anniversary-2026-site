# Devcontainer

Development container, to be used with the [Devcontainer CLI](https://github.com/devcontainers/cli) _or_ the Devcontainer integration/extension of your IDE of choice (e.g. [VSCode](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)).
The devcontainer provides a standardized development environment with all the necessary tooling pre-installed.

Along with the devcontainer itself, a PostgreSQL container is spun up for development of database-related features.
See the [injected environment section](#injected-environment-variables) for variables that provide connection parameters.

> [!TIP]
> If using VSCode's devcontainer extension, the [SQLTools](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools) extension will automatically be installed in the container.
> It will also include pre-defined configurations to connect to the database using either superuser or app credentials.

# Injected environment variables

The following environment variables are injected into the devcontainer to facilitate runtime configuration:

| Variable                    | Description                                              |
|-----------------------------|----------------------------------------------------------|
| WORKSPACE_FOLDER_HOST       | The path to the workspace directory, on the host machine |
| WORKSPACE_FOLDER_CONTAINER  | The path to the workspace directory, on the container    |
| DATABASE_HOST               | The hostname of the database container                   |
| DATABASE_SUPERUSER_DBNAME   | The name of the default superuser database               |
| DATABASE_SUPERUSER_USERNAME | The username of the superuser                            |
| DATABASE_SUPERUSER_PASSWORD | The password of the superuser                            |
| DATABASE_DBNAME             | The name of the application database                     |
| DATABASE_USERNAME           | The username of the application user                     |
| DATABASE_PASSWORD           | The password of the application user                     |

# Devcontainer stack configuration

The following environment variables, when provided to the compose stack (using a `.env` file in the `.devcontainer` directory), can be used to customize the devcontainer stack resources:

| Variable                    | Description                                |
|-----------------------------|--------------------------------------------|
| DATABASE_SUPERUSER_DBNAME   | The name of the default superuser database |
| DATABASE_SUPERUSER_USERNAME | The username of the superuser              |
| DATABASE_SUPERUSER_PASSWORD | The password of the superuser              |
| DATABASE_DBNAME             | The name of the application database       |
| DATABASE_USERNAME           | The username of the application user       |
| DATABASE_PASSWORD           | The password of the application user       |

> [!IMPORTANT]
> The database configuration only applies when it starts from a blank state, otherwise the existing state applies.
> To reset the database (so that the configuration values are applied again), delete the database data volume then restart the stack.
