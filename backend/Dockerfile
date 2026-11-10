# İki imaj üretir:
#   target: migrator → migration'ları uygular ve çıkar
#   target: api      → web API (varsayılan)

# ---------- 1) Build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Önce yalnızca proje dosyaları: paketler değişmedikçe restore katmanı önbellekten gelir
COPY Directory.Build.props ./
COPY src/Soykok.Domain/Soykok.Domain.csproj src/Soykok.Domain/
COPY src/Soykok.Application/Soykok.Application.csproj src/Soykok.Application/
COPY src/Soykok.Infrastructure/Soykok.Infrastructure.csproj src/Soykok.Infrastructure/
COPY src/Soykok.Api/Soykok.Api.csproj src/Soykok.Api/
COPY src/Soykok.Migrator/Soykok.Migrator.csproj src/Soykok.Migrator/
RUN dotnet restore src/Soykok.Api/Soykok.Api.csproj \
 && dotnet restore src/Soykok.Migrator/Soykok.Migrator.csproj

COPY src/ src/
RUN dotnet publish src/Soykok.Api/Soykok.Api.csproj -c Release -o /app/api --no-restore /p:UseAppHost=false \
 && dotnet publish src/Soykok.Migrator/Soykok.Migrator.csproj -c Release -o /app/migrator --no-restore /p:UseAppHost=false

# ---------- 2a) Migrator ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS migrator
WORKDIR /app
COPY --from=build /app/migrator .
USER $APP_UID
ENTRYPOINT ["dotnet", "Soykok.Migrator.dll"]

# ---------- 2b) API (varsayılan hedef) ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS api
WORKDIR /app
COPY --from=build /app/api .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
# Yüklenen görseller (docker-compose'daki "uploads" volume'u buraya bağlanır; sahibi uygulama kullanıcısı)
RUN mkdir -p /app/data/uploads && chown -R $APP_UID /app/data
USER $APP_UID
ENTRYPOINT ["dotnet", "Soykok.Api.dll"]
