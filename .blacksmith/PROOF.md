# Running nirvana locally

nirvana is Grafana: a Go backend and a React frontend, with SQLite as the default database, so it
runs without other services.

## Requirements

- Node.js 26 (`.nvmrc`) and pnpm 12 (version in `package.json` `packageManager`)
- Go 1.27 (`go.mod`) and make

## Start

1. `pnpm install --frozen-lockfile`
2. `NODE_OPTIONS=--max-old-space-size=8192 pnpm dev` builds the frontend once into
   `public/build` (`pnpm start` keeps rebuilding on changes instead).
3. `make build-go` builds the backend into `bin/grafana`.
4. `cd devenv && ./setup.sh` sets up upstream's dev provisioning: the "gdev dashboards" folder and
   the gdev-* data sources (files under `conf/provisioning/`, ignored by git).
5. Optional, `conf/custom.ini` (ignored by git), to skip the password-change prompt:

   ```ini
   [security]
   disable_initial_admin_change_password = true
   ```

6. `./bin/grafana server --homepath "$PWD"` serves http://localhost:3000. Sign in as `admin` /
   `admin`.

## Data

- **gdev-testdata** (TestData, the default data source) generates series, tables, logs and traces
  offline. Use it for new panels and Explore.
- **gdev dashboards** folder: upstream's dev dashboards (panel tests for every visualization,
  transformations, variables, layouts), from `devenv/dev-dashboards`.
- The other gdev-* data sources point at services that are not running (Prometheus, Loki,
  Postgres, ...), so their queries fail.

## Conventions

- Timezone UTC, locale en-US.
