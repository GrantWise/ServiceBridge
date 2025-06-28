#!/bin/bash

echo "🔧 Fixing package version conflicts..."

# Remove conflicting packages
echo "Removing conflicting packages..."
dotnet remove src/ServiceBridge.Application package MediatR
dotnet remove src/ServiceBridge.Application package AutoMapper
dotnet remove src/ServiceBridge.Api package MediatR.Extensions.Microsoft.DependencyInjection
dotnet remove src/ServiceBridge.Infrastructure package AutoMapper.Extensions.Microsoft.DependencyInjection

# Install compatible versions
echo "Installing compatible package versions..."

# AutoMapper v12.0.1 (compatible with Extensions package)
dotnet add src/ServiceBridge.Application package AutoMapper --version 12.0.1
dotnet add src/ServiceBridge.Infrastructure package AutoMapper --version 12.0.1
dotnet add src/ServiceBridge.Infrastructure package AutoMapper.Extensions.Microsoft.DependencyInjection --version 12.0.1

# MediatR v11.1.0 (compatible with Extensions package)
dotnet add src/ServiceBridge.Application package MediatR --version 11.1.0
dotnet add src/ServiceBridge.Api package MediatR --version 11.1.0
dotnet add src/ServiceBridge.Api package MediatR.Extensions.Microsoft.DependencyInjection --version 11.1.0
dotnet add tests/ServiceBridge.Api.Tests package MediatR --version 11.1.0

# Clean and restore
echo "Cleaning and restoring..."
dotnet clean
dotnet restore

# Build to verify
echo "Building to verify fixes..."
dotnet build

if [ $? -eq 0 ]; then
    echo "✅ Package conflicts resolved successfully!"
    echo ""
    echo "📦 Package versions now used:"
    echo "- AutoMapper: 12.0.1"
    echo "- MediatR: 11.1.0"
    echo ""
    echo "🚀 Ready to continue development!"
else
    echo "❌ Build still failing. Manual intervention may be needed."
    exit 1
fi