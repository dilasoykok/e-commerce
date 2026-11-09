# ---------- 1) Build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Soykok.Api/Soykok.Api.csproj Soykok.Api/
RUN dotnet restore Soykok.Api/Soykok.Api.csproj

COPY Soykok.Api/ Soykok.Api/
RUN dotnet publish Soykok.Api/Soykok.Api.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

# ---------- 2) Runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Soykok.Api.dll"]
