@echo off
setlocal enabledelayedexpansion

echo Checking health of all services...
echo ----------------------------------------

:: Check MongoDB
echo Checking MongoDB...
netstat -an | findstr "27017" > nul
if %errorlevel% equ 0 (
    echo MongoDB is running on port 27017
) else (
    echo MongoDB is not running on port 27017
)
echo ----------------------------------------

:: Check Consul
echo Checking Consul...
curl -s http://localhost:8500/v1/status/leader > nul
if %errorlevel% equ 0 (
    echo Consul is running on port 8500
    
    :: Get list of services
    echo Registered services:
    for /f "tokens=*" %%a in ('curl -s http://localhost:8500/v1/catalog/services ^| jq -r "keys[]"') do (
        echo   - %%a
    )
) else (
    echo Consul is not running on port 8500
)
echo ----------------------------------------

:: Check RabbitMQ
echo Checking RabbitMQ...
netstat -an | findstr "5672" > nul
if %errorlevel% equ 0 (
    echo RabbitMQ is running on port 5672
    
    netstat -an | findstr "15672" > nul
    if %errorlevel% equ 0 (
        echo RabbitMQ Management UI is running on port 15672
    ) else (
        echo RabbitMQ Management UI is not running on port 15672
    )
) else (
    echo RabbitMQ is not running on port 5672
)
echo ----------------------------------------

:: Check API Gateway
echo Checking API Gateway...
curl -s http://localhost:5000/api/health > nul
if %errorlevel% equ 0 (
    echo API Gateway is running on port 5000
    echo Health status:
    curl -s http://localhost:5000/api/health | jq
) else (
    echo API Gateway is not running on port 5000
)
echo ----------------------------------------

:: Check User Service
echo Checking User Service...
curl -s http://localhost:5001/api/health > nul
if %errorlevel% equ 0 (
    echo User Service is running on port 5001
    echo Health status:
    curl -s http://localhost:5001/api/health | jq
) else (
    echo User Service is not running on port 5001
)
echo ----------------------------------------

:: Check Apartment Service
echo Checking Apartment Service...
curl -s http://localhost:5002/api/health > nul
if %errorlevel% equ 0 (
    echo Apartment Service is running on port 5002
    echo Health status:
    curl -s http://localhost:5002/api/health | jq
) else (
    echo Apartment Service is not running on port 5002
)
echo ----------------------------------------

:: Check Payment Service
echo Checking Payment Service...
curl -s http://localhost:5003/api/health > nul
if %errorlevel% equ 0 (
    echo Payment Service is running on port 5003
    echo Health status:
    curl -s http://localhost:5003/api/health | jq
) else (
    echo Payment Service is not running on port 5003
)
echo ----------------------------------------

echo Health check completed.
pause 