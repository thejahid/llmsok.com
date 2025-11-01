exports.handler = async (event, context) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    const { email, url } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Email required" })
      };
    }

    // For coffee tier users, return simplified limits check
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        allowed: true,
        reason: "Coffee tier analysis approved",
        pageCount: 200, // Simulate found pages
        tier: 'coffee',
        limits: {
          dailyAnalyses: 1,
          maxPagesPerAnalysis: 200
        },
        currentUsage: {
          analysesToday: 0,
          pagesProcessedToday: 0
        },
        estimatedCost: 4.95
      })
    };
  } catch (error) {
    console.error("Limit check error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Failed to check limits" })
    };
  }
};