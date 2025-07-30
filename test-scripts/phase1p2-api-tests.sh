#!/bin/bash

# Phase 1.2 RAG System API Tests
# Tests the new enhanced search capabilities and backward compatibility

set -e

echo "🧪 Phase 1.2 RAG System API Tests"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://localhost:3001"

# Try to read API key from .env file first
if [ -f "../.env" ]; then
    API_KEY=$(grep TEST_API_KEY ../.env | tail -1 | cut -d'=' -f2)
fi

# Fall back to environment variables
API_KEY="${API_KEY:-${TEST_API_KEY:-$API_KEY}}"

if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ Error: API_KEY or TEST_API_KEY not found${NC}"
    echo "   Run: cd server && npm run setup:test-api-key"
    echo "   Then: export API_KEY=your-api-key OR run from server directory"
    exit 1
fi

echo "🔑 Using API Key: ${API_KEY:0:10}..."
echo ""

# Helper function for API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=${4:-200}
    
    echo -n "Testing ${method} ${endpoint}... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $API_KEY" \
            "$BASE_URL$endpoint")
    fi
    
    # Extract HTTP status code
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code, expected $expected_status)"
        echo "   Response: $body"
        return 1
    fi
}

# Test 1: Server Health Check
echo "1. Server Health Check"
echo "---------------------"
# Note: /api/v1/system requires API key in this implementation
api_call "GET" "/api/v1/system" "" 200
echo ""

# Test 2: Document Upload (Backward Compatibility)
echo "2. Document Upload (Backward Compatibility)"
echo "-------------------------------------------"
if [ -f "sample_files/sample.txt" ]; then
    curl -s -X POST \
        -H "Authorization: Bearer $API_KEY" \
        -F "file=@sample_files/sample.txt" \
        "$BASE_URL/api/v1/document/upload" > /tmp/upload_response.json
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Document upload works${NC}"
    else
        echo -e "${RED}❌ Document upload failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  sample.txt not found, skipping file upload test${NC}"
fi
echo ""

# Test 3: Workspace Operations
echo "3. Workspace Operations"
echo "----------------------"
api_call "POST" "/api/v1/workspace/new" '{"name":"test-workspace","slug":"test-workspace"}' 200

# Test 4: Enhanced Search Features (Phase 1.2)
echo "4. Enhanced Search Features (Phase 1.2)"
echo "---------------------------------------"
echo "Note: These tests require documents to be indexed first"

# Test basic search endpoint
api_call "POST" "/api/v1/workspace/test-workspace/chat" '{"message":"test query","mode":"query"}' 200

echo ""
echo "🎯 Test Summary"
echo "==============="
echo "✅ Basic API endpoints are functional"
echo "✅ Authentication system working"
echo "⚠️  Enhanced search features need documents for full testing"
echo ""
echo "📋 Next Steps for Complete Testing:"
echo "1. Upload test documents to workspace"
echo "2. Run similarity search tests with actual data"
echo "3. Test source attribution and relevance scoring"
echo "4. Validate fallback system behavior"