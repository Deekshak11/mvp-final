
// The handler for our Netlify Function
exports.handler = async function(event, context) {
  // For now, just return a simple success message.
  // This lets us confirm the endpoint is live.
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow requests from any origin
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    },
    body: JSON.stringify({ message: "Backend endpoint is active!" }),
  };
};
