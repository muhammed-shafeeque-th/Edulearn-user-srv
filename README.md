# User Service

The **User Service** is the profile and identity data service of the Edulearn platform. It is the **authoritative owner of user-centric data**, including user profiles, instructor profiles, shopping carts, wishlists, wallets, and wallet transactions, and exposes these capabilities through **gRPC APIs** for internal service communication.

The service is built with **NestJS**, **TypeScript**, and **Clean Architecture**, and depends on **@edulearn/nest** for shared platform infrastructure including logging, metrics, distributed tracing, Redis, Kafka, health checks, and observability utilities.

---

## Overview

The User Service manages all persistent user-related state that is not directly associated with authentication or course content. It acts as the central source of truth for profile information, instructor metadata, shopping carts, wishlists, and wallet balances while coordinating with other services through **Kafka domain events**.

### Responsibilities

* User profile management
* Instructor profile management
* Shopping cart management
* Wishlist management
* Wallet and transaction management
* Event-driven synchronization with other services
* Internal gRPC APIs for platform communication

### Out of Scope

* Authentication and authorization (Auth Service)
* Payment processing (Payment Service)
* Course content and catalog management (Course Service)
* Order lifecycle management (Order Service)

---

# Architecture

This service follows **Clean Architecture (Hexagonal Architecture)** with **SOLID principles**, ensuring separation of concerns, testability, and framework independence.

## Layered Architecture

```text
                gRPC Controllers
                       │
               Application Layer
      (Use Cases / DTOs / Events / Services)
                       │
                 Domain Layer
(Entities / Repository Interfaces / Domain Rules)
                       │
             Infrastructure Layer
(PostgreSQL / Redis / Kafka / gRPC / Observability)
```

### Layers

#### Presentation Layer

* gRPC controllers
* Health endpoints
* Request validation
* Transport-specific concerns

#### Application Layer

* Use cases
* DTOs
* Event handlers
* Business orchestration
* Domain coordination

#### Domain Layer

* Domain entities
* Repository interfaces
* Domain rules
* Business invariants

#### Infrastructure Layer

* PostgreSQL persistence
* Redis caching
* Kafka integration
* gRPC client/server implementations
* Logging, metrics, and tracing

---

# Technology Stack

| Category      | Technology                                          |
| ------------- | --------------------------------------------------- |
| Language      | TypeScript 5.x                                      |
| Runtime       | Node.js                                             |
| Framework     | NestJS 11                                           |
| Architecture  | Clean Architecture                                  |
| Transport     | gRPC                                                |
| Database      | PostgreSQL                                          |
| ORM           | TypeORM                                             |
| Cache         | Redis                                               |
| Messaging     | Kafka                                               |
| Observability | @edulearn/core (Winston, Prometheus, OpenTelemetry) |
| Deployment    | Docker, Kubernetes, Helm                            |

---

# Core Domain

The User Service owns the user domain of the platform.

## User

* Basic profile
* Personal information
* Account metadata
* Preferences

## Instructor Profile

* Professional information
* Biography
* Social links
* Verification state

## Shopping Cart

* Cart lifecycle
* Course additions and removals
* Cart retrieval

## Wishlist

* Saved courses
* Wishlist operations
* Course bookmarking

## Wallet

* Current balance
* Credits and debits
* Transaction history

---

# User Lifecycle

```text
User Registered
       │
       ▼
Profile Created
       │
       ▼
Profile Updated
       │
       ▼
Instructor Registration
       │
       ▼
Instructor Verified
```

The service maintains profile consistency across the platform and publishes domain events whenever user state changes.

---

# Wallet Flow

```text
Payment Completed
        │
        ▼
Kafka Event
        │
        ▼
User Service
        │
        ▼
Update Wallet Balance
        │
        ▼
Record Wallet Transaction
        │
        ▼
Publish WalletUpdated Event
```

Wallet operations are designed to be auditable and event-driven.

---

# Project Structure

```text
src/
├── application/
│   ├── dtos/
│   ├── use-cases/
│   ├── events/
│   └── services/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── exceptions/
├── infrastructure/
│   ├── database/
│   ├── grpc/
│   ├── kafka/
│   ├── redis/
│   ├── observability/
│   └── config/
├── presentation/
│   ├── grpc/
│   └── http/
└── shared/
```

---

# Communication

## gRPC APIs

The User Service exposes internal gRPC APIs consumed by:

* API Gateway
* Auth Service
* Course Service
* Payment Service
* Order Service
* Notification Service
* Chat Service

Example operations:

* GetUser
* UpdateProfile
* GetInstructor
* GetCart
* UpdateCart
* GetWishlist
* GetWallet
* RecordWalletTransaction

---

## Kafka Integration

The User Service participates in the platform event architecture.

### Consumed Events

| Topic                   | Purpose                      |
| ----------------------- | ---------------------------- |
| course.created.v1       | Synchronize course metadata  |
| course.updated.v1       | Update course references     |
| enrollment.completed.v1 | Update enrollment state      |
| payment.completed.v1    | Credit wallet                |
| order.created.v1        | Initialize purchase metadata |

### Published Events

| Topic                      | Purpose            |
| -------------------------- | ------------------ |
| user.profile.updated.v1    | Profile updated    |
| user.instructor.updated.v1 | Instructor updated |
| user.wallet.updated.v1     | Wallet updated     |
| user.wishlist.updated.v1   | Wishlist updated   |
| user.cart.updated.v1       | Cart updated       |

This event-driven architecture enables loose coupling and eventual consistency across services.

---

# Data Ownership

The User Service is the single source of truth for user-related data.

| Entity              | Owner        |
| ------------------- | ------------ |
| users               | User Service |
| instructor_profiles | User Service |
| carts               | User Service |
| cart_items          | User Service |
| wishlists           | User Service |
| wishlist_items      | User Service |
| wallets             | User Service |
| wallet_transactions | User Service |

Other services access this data through gRPC APIs or Kafka events rather than direct database access.

---

# Dependency on @edulearn/nest

The User Service relies on **@edulearn/nest** for shared platform infrastructure.

## Logging

* Winston structured logging
* JSON log output
* Correlation IDs
* Trace-aware logging

## Metrics

Prometheus metrics include:

* gRPC request count
* Request duration
* Error count
* Cache hit/miss ratio
* Database query latency
* Kafka consumer lag

Exposed at:

```text
/metrics
```

## Distributed Tracing

OpenTelemetry instrumentation provides end-to-end request tracing across services.

Trace flow:

```text
API Gateway
      │
      ▼
User Service
      │
      ▼
PostgreSQL / Redis / Kafka
```

Traces are exported to **OTEL Collector → Tempo → Grafana**.

## Shared Infrastructure

Provided by **@edulearn/core**:

* Logger
* Metrics registry
* Tracer
* Redis client
* Kafka producer/consumer
* Health checks
* Configuration utilities
* Common error handling

---

# Caching Strategy

Redis is used for:

* User profile caching
* Instructor profile caching
* Frequently accessed metadata
* Wallet lookups
* Cart retrieval
* Wishlist retrieval
* Performance optimization

Cache invalidation occurs through repository updates and Kafka domain events.

---

# Database

PostgreSQL is the primary persistent datastore.

TypeORM manages:

* Entity mapping
* Migrations
* Repository implementations
* Transaction handling

Typical migration command:

```bash
yarn migration:run
```

---

# Security

The service follows production-oriented security practices.

## Authentication

* JWT validation for incoming requests
* Internal service authentication
* gRPC metadata propagation

## Authorization

* Role-aware operations
* Instructor ownership validation
* Resource-level authorization checks

## Secrets Management

Production deployments retrieve secrets from:

* AWS Secrets Manager
* External Secrets Operator

## Container Security

* Runs as non-root user
* No shell access
* Minimal Linux capabilities
* Read-only filesystem where applicable

---

# Local Development

## Prerequisites

* Node.js 22+
* Yarn
* PostgreSQL
* Redis
* Kafka

## Install

```bash
yarn install
```

## Start Development

```bash
yarn start:dev
```

## Build

```bash
yarn build
```

## Start Production

```bash
yarn start:prod
```

---

# Environment Variables

| Variable                    | Description                  |
| --------------------------- | ---------------------------- |
| PORT                        | gRPC server port             |
| DATABASE_URL                | PostgreSQL connection string |
| REDIS_URL                   | Redis connection string      |
| KAFKA_BROKERS               | Kafka broker list            |
| JWT_SECRET                  | JWT verification secret      |
| OTEL_EXPORTER_OTLP_ENDPOINT | OTLP collector endpoint      |
| LOG_LEVEL                   | Logging level                |

See `env.example` for the complete configuration.

---

# Docker

The service uses a **multi-stage Docker build** optimized for production.

Optimizations include:

* Multi-stage compilation
* Dependency pruning
* Layer caching
* Minimal runtime image
* Non-root execution
* Reduced attack surface

---

# Kubernetes Deployment

Deployment is managed through the **Edulearn umbrella Helm chart**.

The service is deployed with:

* ClusterIP service
* gRPC exposure
* Liveness probes
* Readiness probes
* Resource requests and limits
* Horizontal Pod Autoscaler support
* Prometheus ServiceMonitor

---

# CI/CD

This service participates in the platform GitOps deployment pipeline.

```text
Git Push
    │
    ▼
GitHub Actions
    ├── Test
    ├── Build
    ├── Lint
    ├── Trivy Scan
    └── Push to GHCR
             │
             ▼
ArgoCD Image Updater
             │
             ▼
ArgoCD
             │
             ▼
Amazon EKS
```

---

# Performance Optimizations

Implemented optimizations include:

* gRPC binary transport
* Redis caching
* Connection pooling
* Efficient repository queries
* Database indexing
* Asynchronous Kafka processing
* Lightweight DTO mapping
* Optimized Docker image size

---

# Testing

```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# End-to-end tests
yarn test:e2e

# Coverage
yarn test:cov
```

---


# Related Repositories

| Repository                    | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| [edulearn-platform](https://github.com/muhammed-shafeeque-th/edulearn-platform)             | Platform orchestration repository                             |
| [edulearn-api-gateway](https://github.com/muhammed-shafeeque-th/edulearn-api-gateawy)          | API Gateway                                                   |
| [edulearn-course-service](https://github.com/muhammed-shafeeque-th/edulearn-course-srv)       | Course management service                                     |
| [edulearn-payment-service](https://github.com/muhammed-shafeeque-th/edulearn-payment-srv)      | Payment processing service                                    |
| [edulearn-auth-service](https://github.com/muhammed-shafeeque-th/edulearn-auth-srv)      | Authentication service                                    |
| [edulearn-client](https://github.com/muhammed-shafeeque-th/edulearn-client)        | Edulearn Frontend                                      |
| [edulearn-notification-service](https://github.com/muhammed-shafeeque-th/edulearn-notification-srv) | Notification service                                          |
| [edulearn-auth-service](https://github.com/muhammed-shafeeque-th/edulearn-auth-srv)         | Authentication service                                        |
| [@edulearn/core](https://github.com/muhammed-shafeeque-th/edulearn-core)                | Shared logging, metrics, tracing, Redis, Kafka, health checks |
| [@edulearn/nest](https://github.com/muhammed-shafeeque-th/edulearn-nest)                | Shared NestJS infrastructure package                          |

---

# License

This project is part of the **Edulearn Platform** and is licensed under the MIT [License](./LICENSE).
