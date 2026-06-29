FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY portal-api/ ./
RUN dotnet restore src/DevCloud.Api/DevCloud.Api.csproj
RUN dotnet publish src/DevCloud.Api/DevCloud.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "DevCloud.Api.dll"]
