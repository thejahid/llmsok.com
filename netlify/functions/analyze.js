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
    const { url, force = false, email } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: "Email required for analysis. Please sign up first." 
        })
      };
    }

    // For demo purposes, return a mock analysis response
    const mockAnalysisId = Math.floor(Math.random() * 10000);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        analysisId: mockAnalysisId,
        status: "analyzing",
        estimatedDuration: 30, // 30 seconds for demo
        pageCount: 150,
        message: "Coffee tier analysis started! This is a demo response."
      })
    };
  } catch (error) {
    console.error("Analysis error:", error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        message: error instanceof Error ? error.message : "Failed to analyze website"
      })
    };
  }
};