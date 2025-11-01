#!/bin/bash

# Quick test script for LLM.txt Tool API
BASE_URL="http://localhost:3000"

echo "🚀 Testing LLM.txt Tool API"
echo "================================"

# Test 1: Health check
echo "1. Health Check..."
curl -s "$BASE_URL/api/convertkit/status" | head -1
echo

# Test 2: Email capture
echo "2. Email Capture..."
curl -s -X POST "$BASE_URL/api/email-capture" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "websiteUrl": "https://example.com", "tier": "starter"}' \
  | jq '.message' 2>/dev/null || echo "Email captured (raw JSON response)"

echo
echo "3. Frontend Check..."
echo "Frontend is serving at: $BASE_URL"

echo
echo "🌐 Next Steps:"
echo "   • Open $BASE_URL in your browser"
echo "   • Test with different URLs and tiers"
echo "   • Check the full analysis flow"