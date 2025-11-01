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
    const emailData = JSON.parse(event.body);
    
    // For now, just return success - we'll integrate database later
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: "Email captured successfully", 
        capture: { 
          email: emailData.email,
          tier: emailData.tier || 'starter'
        },
        tier: emailData.tier || 'starter'
      })
    };
  } catch (error) {
    console.error("Email capture error:", error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        message: "Failed to capture email", 
        error: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};