#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking health of all services...${NC}"
echo "----------------------------------------"

# Check MongoDB
echo -e "${YELLOW}Checking MongoDB...${NC}"
if nc -z localhost 27017 2>/dev/null; then
    echo -e "${GREEN}MongoDB is running on port 27017${NC}"
else
    echo -e "${RED}MongoDB is not running on port 27017${NC}"
fi
echo "----------------------------------------"

# Check Consul
echo -e "${YELLOW}Checking Consul...${NC}"
if curl -s http://localhost:8500/v1/status/leader > /dev/null; then
    echo -e "${GREEN}Consul is running on port 8500${NC}"
    
    # Get list of services
    echo "Registered services:"
    curl -s http://localhost:8500/v1/catalog/services | jq -r 'keys[]' | while read service; do
        echo "  - $service"
    done
else
    echo -e "${RED}Consul is not running on port 8500${NC}"
fi
echo "----------------------------------------"

# Check RabbitMQ
echo -e "${YELLOW}Checking RabbitMQ...${NC}"
if nc -z localhost 5672 2>/dev/null; then
    echo -e "${GREEN}RabbitMQ is running on port 5672${NC}"
    
    if nc -z localhost 15672 2>/dev/null; then
        echo -e "${GREEN}RabbitMQ Management UI is running on port 15672${NC}"
    else
        echo -e "${RED}RabbitMQ Management UI is not running on port 15672${NC}"
    fi
else
    echo -e "${RED}RabbitMQ is not running on port 5672${NC}"
fi
echo "----------------------------------------"

# Check API Gateway
echo -e "${YELLOW}Checking API Gateway...${NC}"
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}API Gateway is running on port 5000${NC}"
    echo "Health status:"
    curl -s http://localhost:5000/api/health | jq
else
    echo -e "${RED}API Gateway is not running on port 5000${NC}"
fi
echo "----------------------------------------"

# Check User Service
echo -e "${YELLOW}Checking User Service...${NC}"
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo -e "${GREEN}User Service is running on port 5001${NC}"
    echo "Health status:"
    curl -s http://localhost:5001/api/health | jq
else
    echo -e "${RED}User Service is not running on port 5001${NC}"
fi
echo "----------------------------------------"

# Check Apartment Service
echo -e "${YELLOW}Checking Apartment Service...${NC}"
if curl -s http://localhost:5002/api/health > /dev/null; then
    echo -e "${GREEN}Apartment Service is running on port 5002${NC}"
    echo "Health status:"
    curl -s http://localhost:5002/api/health | jq
else
    echo -e "${RED}Apartment Service is not running on port 5002${NC}"
fi
echo "----------------------------------------"

# Check Payment Service
echo -e "${YELLOW}Checking Payment Service...${NC}"
if curl -s http://localhost:5003/api/health > /dev/null; then
    echo -e "${GREEN}Payment Service is running on port 5003${NC}"
    echo "Health status:"
    curl -s http://localhost:5003/api/health | jq
else
    echo -e "${RED}Payment Service is not running on port 5003${NC}"
fi
echo "----------------------------------------"

echo -e "${YELLOW}Health check completed.${NC}" 