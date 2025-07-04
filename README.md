# pwa_ble_client_time_series_data

A HTML, CSS and JS Progressive Web App (PWA) as a Bluetooth Low Energy (BLE) Client for Time Series Data.

## Introduction

This repository is an example project to implement a PWA as a BLE client. The client reads time series data from a BLE server.

We implement the PWA client using HTML, CSS and JS. No build step is required to deploy the code in the [src](./src) directory. We use [deno] to testing, static analysis and documentation purposes.

## Getting Started

You need to install the following requirements:

- A browser compatible with PWAs (I use Chrome)
- [deno]
- [Docker] (with [Docker Compose])

As an example we deploy the code from the [src](./src) directory to a [nginx] service in a [Docker Compose] environment. You can start the [Docker Compose] with the following command:

```bash
docker compose up
```

Further details on the deployment can be found in the [Deployment](#deployment) section.

## Development

### Preview

During development (in VSCode) you can use the `Live Server` extension (see extension recommendations) to open a live preview of the PWA. Right click on the [index.html](./src/index.html) file and select `Open with Live Server` to open a preview in your browser. This preview will automatically reload if changes are detected.

### Testing

You can use the [deno] testing command to execute the tests:

```bash
deno test
```

## Deployment

### Deployment using Docker Compose

You can deploy the code from the [src](./src) directory to a [nginx] service in a [Docker Compose] environment. You can start the [Docker Compose] with the following command:

```bash
docker compose up
```

This deployment uses a read-only volume mount to the source directory to get the source files.

## Sources

- [deno]
- [Docker]
- [Docker Compose]
- [nginx]

[deno]: https://deno.com/
[Docker]: https://www.docker.com/
[Docker Compose]: https://docs.docker.com/compose/
[nginx]: https://nginx.org/en/
