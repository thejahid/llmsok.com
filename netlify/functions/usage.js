exports.handler = async (event, context) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    // Extract email from path params
    const pathParts = event.path.split('/');
    const email = decodeURIComponent(pathParts[pathParts.length - 1]);
    
    // Return simplified usage data for coffee tier
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        tier: 'coffee',
        usage: {
          analysesToday: 0,
          pagesProcessedToday: 0,
          cacheHitsToday: 0,
          costToday: 0
        },
        limits: {
          dailyAnalyses: 1,
          maxPagesPerAnalysis: 200,
          aiPagesLimit: 200
        },
        features: {
          aiEnhanced: true,
          prioritySupport: false,
          customIntegrations: false
        }
      })
    };
  } catch (error) {
    console.error("Get usage error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Failed to get usage data" })
    };
  }
};