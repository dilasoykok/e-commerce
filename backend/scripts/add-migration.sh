#!/usr/bin/env sh
# Yeni EF Core migration'ı oluşturur. Bilgisayarda .NET SDK gerekmez; Docker içinde çalışır.
#
#   Kullanım:  ./backend/scripts/add-migration.sh <MigrationAdi>
#   Örnek:     ./backend/scripts/add-migration.sh InitialCreate
#
# Dosyalar backend/src/Soykok.Infrastructure/Persistence/Migrations/ altına yazılır.
# Sonra uygulamak için:  docker compose up -d --build migrator api
set -eu

if [ $# -ne 1 ]; then
  echo "Kullanım: $0 <MigrationAdi>   (ör. InitialCreate, AddProductStock)" >&2
  exit 1
fi

BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"

docker run --rm \
  -v "$BACKEND_DIR":/src \
  -w /src \
  -e HOME=/tmp \
  -e DOTNET_CLI_TELEMETRY_OPTOUT=1 \
  -e DOTNET_NOLOGO=1 \
  mcr.microsoft.com/dotnet/sdk:10.0 \
  sh -c '
    set -e
    dotnet tool install dotnet-ef --tool-path /tmp/tools --version "10.*" > /dev/null
    /tmp/tools/dotnet-ef migrations add "$1" \
      --project src/Soykok.Infrastructure \
      --startup-project src/Soykok.Migrator \
      --output-dir Persistence/Migrations \
      --namespace Soykok.Infrastructure.Persistence.Migrations
    # Linux konteynerinde oluşan derleme klasörlerini temizle (Mac/IDE derlemesiyle karışmasın)
    rm -rf src/*/bin src/*/obj
  ' sh "$1"

echo "Migration oluşturuldu: backend/src/Soykok.Infrastructure/Persistence/Migrations/"
