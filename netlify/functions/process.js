const OpenAI = require("openai");

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// THE FIX: Define headers once to use for all responses.
const headers = {
  "Access-Control-Allow-Origin": "*", // Or be more specific: "https://scanner.aevylabs.com"
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

exports.handler = async function(event, context) {
  // THE FIX: Handle the browser's preflight 'OPTIONS' request.
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }

  // Only allow POST requests for the main logic
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const { resumeText } = JSON.parse(event.body);
    if (!resumeText) {
      return { statusCode: 400, headers, body: "Missing resumeText in request body" };
    }

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a skeptical hiring manager whose primary function is to find potential risks that justify a deeper, human-led audit. Even on a strong resume, you MUST identify areas for improvement or verification and frame them as risks. You MUST return a JSON object with THREE keys: 'riskScore' (a number from 54-91), 'redFlagsAnalysis' (an array of concise, one-sentence markdown strings), and 'strategicRecommendation' (an array of concise, one-sentence markdown strings). Never return an empty redFlagsAnalysis array."
        },
        {
          role: "user",
          content: resumeText
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysisResult = JSON.parse(completion.choices[0].message.content);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(analysisResult),
    };

  } catch (error) {
    console.error("Error during AI analysis:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to process the resume." }),
    };
  }
};