# Aiven MySQL Setup

## Backend config source
The Spring Boot backend now reads MySQL settings from environment variables.

- DB_URL (default points to Aiven host and port)
- DB_USERNAME (default is avnadmin)
- DB_PASSWORD (must be provided)

## PowerShell example (current terminal only)

$env:DB_URL="jdbc:mysql://sensordb-sensors.k.aivencloud.com:15527/defaultdb?sslMode=REQUIRED"
$env:DB_USERNAME="avnadmin"
$env:DB_PASSWORD="<your-password>"
mvn spring-boot:run

## Notes
- Keep DB_PASSWORD out of committed files.
- If credentials were shared in chat or docs, rotate them in Aiven.
- For production, set these variables in your deployment platform secrets.
