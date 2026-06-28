FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY portal-api/ ./
RUN dotnet restore DevCloud.slnx
RUN dotnet publish src/DevCloud.Api/DevCloud.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "DevCloud.Api.dll"]
