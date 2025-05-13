<p align="center">
  <a href="http://nestjs.com/" target="_blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A NestJS application built with Domain-Driven Design principles.</p>

## Description

This project is a NestJS application structured using Domain-Driven Design (DDD) principles to build a scalable and maintainable server-side application.

## Architecture (Domain-Driven Design)

This project follows a Domain-Driven Design (DDD) approach to organize the codebase. The core idea is to place the business logic (the "Domain") at the center and separate it from technical concerns. The project is structured into the following main layers:

-   **`domain/`**: Contains the core business logic, entities, value objects, aggregates, domain services, and domain events. This layer defines what the business does and is independent of most technical implementation details. Application-level logic, such as orchestrating domain services and interacting with the infrastructure, is handled by services and controllers within the domain modules (e.g., `src/domain/auth/service/auth.service.ts`).
-   **`infrastructure/`**: Contains concrete implementations for technical concerns like database access, external service integrations (Google OAuth, JWT, Mail), and repositories. Modules and services in the `domain/` layer depend on these concrete implementations to interact with external resources and persistence mechanisms.
-   **`common/`**: Contains shared utilities, decorators, pipes, filters, etc., that can be used across different layers.
-   **`core/`**: Contains foundational elements like the main application server setup.
-   **`config/`**: Contains application configuration files.

This structure helps in separating concerns, making the codebase easier to understand, test, and maintain as the complexity grows.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e
# test coverage
$ pnpm run test:cov
```

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
