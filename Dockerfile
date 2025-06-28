FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/ServiceBridge.Api/ServiceBridge.Api.csproj", "src/ServiceBridge.Api/"]
COPY ["src/ServiceBridge.Application/ServiceBridge.Application.csproj", "src/ServiceBridge.Application/"]
COPY ["src/ServiceBridge.Domain/ServiceBridge.Domain.csproj", "src/ServiceBridge.Domain/"]
COPY ["src/ServiceBridge.Infrastructure/ServiceBridge.Infrastructure.csproj", "src/ServiceBridge.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "src/ServiceBridge.Api/ServiceBridge.Api.csproj"

# Copy source code
COPY . .

# Build
WORKDIR "/src/src/ServiceBridge.Api"
RUN dotnet build "ServiceBridge.Api.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "ServiceBridge.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:80/health || exit 1

ENTRYPOINT ["dotnet", "ServiceBridge.Api.dll"]
