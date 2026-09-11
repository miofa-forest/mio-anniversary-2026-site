FROM postgres:18.6

COPY --chown=root:root --chmod=0555 ./init-user-db.sh /docker-entrypoint-initdb.d/
