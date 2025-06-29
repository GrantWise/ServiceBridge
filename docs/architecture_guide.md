# Architecture Guide

## 1. Clean Architecture

ServiceBridge follows a 4-layer Clean Architecture structure:

*   **Domain**: Contains the core business entities, rules, and interfaces. It has no dependencies on other layers.
*   **Application**: Implements the business logic and use cases, using patterns like CQRS with MediatR.
*   **Infrastructure**: Handles data access, external services, and other technical implementations.
*   **API**: Exposes the application's functionality through various protocols (REST, gRPC, SignalR).

### Dependency Rule

The dependencies flow inwards: `API` -> `Infrastructure` -> `Application` -> `Domain`.

## 2. Enterprise Patterns

*   **CQRS (Command Query Responsibility Segregation)**: Separates read and write operations, improving performance and scalability.
*   **Domain-Driven Design (DDD)**: Models the software around the business domain, using a ubiquitous language.
*   **Repository Pattern**: Abstracts data access, making the application independent of the database technology.
*   **Result Pattern**: Provides a structured way to handle errors without relying on exceptions.

## 3. SOLID Principles

The codebase adheres to the SOLID principles to ensure it is maintainable, scalable, and robust:

*   **Single Responsibility Principle**
*   **Open/Closed Principle**
*   **Liskov Substitution Principle**
*   **Interface Segregation Principle**
*   **Dependency Inversion Principle**
