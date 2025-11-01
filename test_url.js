import fetch from 'node-fetch';

async function testUrl() {
  try {
    const response = await fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.freecalchub.com/',
        useAI: false
      })
    });
    
    const data = await response.json();
    console.log('Analysis result:', data);
    
    // Check the analysis
    if (data.analysisId) {
      setTimeout(async () => {
        const analysisResponse = await fetch(`http://localhost:5000/api/analysis/${data.analysisId}`);
        const analysisData = await analysisResponse.json();
        console.log('Analysis details:', analysisData);
      }, 2000);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testUrl();