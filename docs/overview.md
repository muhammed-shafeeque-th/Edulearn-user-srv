# User Service - Overview

## Purpose

The User Service manages user profiles, instructor profiles, shopping carts, wishlists, and wallets in the EduLearn platform. It provides user data to other services and handles user-related business logic.

## Scope & Responsibilities

### Core Responsibilities

1. **User Management**
   - User profile CRUD operations
   - User data retrieval
   - Email existence checks
   - User search and filtering

2. **Instructor Management**
   - Instructor profile management
   - Instructor registration
   - Instructor verification
   - Instructor listing

3. **Cart Management**
   - Add/remove items from cart
   - Get user cart
   - Cart operations

4. **Wishlist Management**
   - Add/remove courses from wishlist
   - Get user wishlist
   - Wishlist operations

5. **Wallet Management**
   - User wallet balance
   - Wallet transactions
   - Transaction history

6. **Event Consumption**
   - Handles course creation events
   - Handles enrollment events
   - Updates user data based on events

### Out of Scope

- Authentication (Auth Service)
- Payment processing (Payment Service)
- Course content (Course Service)

## Folder Structure 

```
user/
├── src/                          # Source code
│   ├── app.module.ts            # NestJS root module
│   ├── main.ts                  # Application entry point
│   ├── application/             # Application layer
│   │   ├── dtos/                # Data Transfer Objects
│   │   │   ├── cart.dto.ts      # Shopping cart DTOs
│   │   │   ├── user.dto.ts      # User management DTOs
│   │   │   ├── wallet.dto.ts    # Wallet operation DTOs
│   │   │   └── wishlist.dto.ts  # Wishlist operation DTOs
│   │   ├── events/              # Event handlers
│   │   │   └── user/            # User-specific event handlers
│   │   └── use-cases/           # Business use cases
│   │       ├── cart/            # Cart management use cases
│   │       ├── user/            # User management use cases
│   │       ├── wallet/          # Wallet management use cases
│   │       └── wishlist/        # Wishlist management use cases
│   ├── domain/                  # Domain layer
│   │   ├── entities/            # Domain entities
│   │   │   ├── cart-item.entity.ts       # Cart item domain model
│   │   │   ├── cart.entity.ts            # Shopping cart domain model
│   │   │   ├── instructor-profile.entity.ts # Instructor profile
│   │   │   ├── user-entity.ts            # User domain model
│   │   │   ├── user-profile.entity.ts    # User profile model
│   │   │   ├── user-socials.entity.ts    # User social links
│   │   │   ├── user-wallet.entity.ts     # Wallet domain model
│   │   │   ├── wallet-transaction.entity.ts # Transaction model
│   │   │   ├── wishlist-item.entity.ts   # Wishlist item model
│   │   │   └── wishlist.entity.ts        # Wishlist domain model
│   │   ├── exceptions/          # Domain exceptions
│   │   │   └── domain.exception.ts       # Custom domain exceptions
│   │   └── repositories/        # Repository interfaces
│   │       ├── cart.repository.interface.ts    # Cart repository contract
│   │       ├── user.repository.interface.ts    # User repository contract
│   │       ├── wallet.repository.interface.ts  # Wallet repository contract
│   │       └── wishlist.repository.interface.ts # Wishlist repository contract
│   ├── infrastructure/          # Infrastructure layer
│   │   ├── config/              # Configuration services
│   │   │   ├── app.config.ts    # Application configuration
│   │   │   ├── database.config.ts # Database configuration
│   │   │   └── kafka.config.ts  # Kafka configuration
│   │   ├── database/            # Database implementations
│   │   │   ├── entities/        # TypeORM entities
│   │   │   ├── mappers/         # Data mappers
│   │   │   ├── migrations/      # Database migrations
│   │   │   └── repositories/    # Repository implementations
│   │   ├── filters/             # Exception filters
│   │   │   └── all-exceptions.filter.ts # Global exception handler
│   │   ├── grpc/                # gRPC clients and services
│   │   │   ├── clients/         # gRPC client implementations
│   │   │   ├── generated/       # Generated gRPC code
│   │   │   └── interceptors/    # gRPC interceptors
│   │   ├── guards/              # Authentication guards
│   │   │   └── jwt-auth.guard.ts # JWT authentication guard
│   │   ├── interceptors/        # Request/response interceptors
│   │   │   └── logging.interceptor.ts # Request logging interceptor
│   │   ├── kafka/               # Kafka event handling
│   │   │   ├── consumer.ts      # Event consumer
│   │   │   ├── producer.ts      # Event producer
│   │   │   └── topics.ts        # Topic definitions
│   │   ├── observability/       # Monitoring and observability
│   │   │   ├── logging/         # Logging setup
│   │   │   ├── metrics/         # Metrics collection
│   │   │   └── tracing/         # Distributed tracing
│   │   └── redis/               # Redis implementation
│   │       ├── redis.service.ts # Redis service
│   │       └── cache.service.ts # Caching service
│   ├── presentation/            # Presentation layer
│   │   ├── grpc/                # gRPC controllers
│   │   │   ├── cart.controller.ts    # Cart gRPC endpoints
│   │   │   ├── user.controller.ts    # User management gRPC endpoints
│   │   │   ├── wallet.controller.ts  # Wallet gRPC endpoints
│   │   │   └── wishlist.controller.ts # Wishlist gRPC endpoints
│   │   ├── http/                # HTTP endpoints (optional)
│   │   │   └── health.controller.ts # Health check endpoints
│   │   └── kafka/               # Kafka event handlers
│   │       └── event-handlers.ts     # Event processing handlers
│   └── shared/                  # Shared utilities
│       ├── events/              # Shared event definitions
│       │   └── topics.ts        # Kafka topic constants
│       └── utils/               # Utility functions
│           ├── mapper.utils.ts  # Data mapping utilities
│           └── validation.utils.ts # Validation helpers
├── test/                        # Test files
│   ├── app.e2e-spec.ts          # End-to-end tests
│   ├── integration/             # Integration tests
│   ├── unit/                    # Unit tests
│   └── jest-e2e.json            # E2E test configuration
├── proto/                       # Protocol buffer definitions
│   ├── course/                  # Course service protobufs
│   │   ├── common.proto         # Shared types
│   │   └── types/               # Course-specific types
│   ├── course_service.proto     # Course service API
│   ├── user/                    # User service protobufs
│   │   ├── common.proto         # Shared types
│   │   └── types/               # User-specific types
│   └── user_service.proto       # User service API
├── dist/                        # Compiled output
├── logs/                        # Application logs
├── node_modules/                # Dependencies
├── Dockerfile                   # Docker configuration
├── nest-cli.json                # NestJS CLI configuration
├── package.json                 # Node.js dependencies
├── tsconfig.json                # TypeScript configuration
├── tsconfig.build.json          # Build TypeScript config
├── env.example                  # Environment variables template
├── jest-e2e.json                # E2E test configuration
├── LICENSE                      # License
└── README.md                    # Service documentation
```


## Key Features

- **User Profiles**: Complete user profile management
- **Instructor Profiles**: Specialized instructor profile handling
- **Shopping Cart**: Course cart management
- **Wishlist**: Course wishlist functionality
- **Wallet**: User wallet and transactions
- **Event Integration**: Consumes and processes domain events

## Service Boundaries

### Owns Data For

- Users (profile data)
- Instructor profiles
- Carts
- Wishlists
- Wallets
- Wallet transactions

### Depends On

- **Course Service** (via events): Course information
- **Database**: PostgreSQL for persistence
- **Redis**: Caching
- **Kafka**: Event consumption

## Technical Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Messaging**: Kafka
- **RPC**: gRPC

## Key Entities

- **User**: User profile data
- **InstructorProfile**: Instructor-specific data
- **Cart**: Shopping cart
- **CartItem**: Cart items
- **Wishlist**: Course wishlist
- **WishlistItem**: Wishlist items
- **Wallet**: User wallet
- **WalletTransaction**: Transaction records

