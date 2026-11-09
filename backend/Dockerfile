# ---------- 1) Build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Önce yalnızca proje dosyaları: paketler değişmedikçe restore katmanı önbellekten gelir
COPY Directory.Build.props ./
COPY src/Soykok.Domain/Soykok.Domain.csproj src/Soykok.Domain/
COPY src/Soykok.Application/Soykok.Application.csproj src/Soykok.Application/
COPY src/Soykok.Infrastructure/Soykok.Infrastructure.csproj src/Soykok.Infrastructure/
COPY src/Soykok.Api/Soykok.Api.csproj src/Soykok.Api/
RUN dotnet restore src/Soykok.Api/Soykok.Api.csproj

COPY src/ src/
RUN dotnet publish src/Soykok.Api/Soykok.Api.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

# ---------- 2) Runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Soykok.Api.dll"]
