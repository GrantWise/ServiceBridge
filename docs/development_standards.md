# Development Standards

## 1. Code Quality

*   **Pragmatic Code Organization**: Prioritize readability and logical cohesion over arbitrary metrics. A larger, cohesive file is better than multiple, fragmented ones.
*   **Naming Conventions**: Use clear, descriptive names that express intent. Follow standard C# and TypeScript naming conventions.
*   **Function and Class Design**: Adhere to the Single Responsibility Principle. Favor composition over inheritance.

## 2. Error Handling

*   **Exception Management**: Use specific exception types and handle them at the appropriate architectural layers.
*   **Logging**: Use structured logging with sufficient context for troubleshooting.

## 3. Testing

*   **Test Categories**: Employ a mix of unit, integration, and end-to-end tests.
*   **Test Principles**: Follow the Arrange, Act, Assert (AAA) pattern. Write descriptive test names and ensure tests are independent.

## 4. Frontend Development

*   **Component Design**: Components should have a single responsibility and be built with composition in mind.
*   **State Management**: Use TanStack Query for server state, React Context for global UI state, and React Hook Form for form state.
*   **Styling**: Use Tailwind CSS with a consistent system of design tokens for colors, spacing, and typography.
*   **Type Safety**: Enforce strict TypeScript settings and define interfaces for all API responses and component props.

## 5. Backend Development

*   **CQRS**: Separate commands and queries to improve clarity and performance.
*   **Validation**: Use FluentValidation for all input validation.
*   **Data Access**: Use the repository pattern to abstract database operations.
