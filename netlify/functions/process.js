const OpenAI = require("openai");

// Configure the OpenAI client to use the OpenRouter endpoint
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { resumeText } = JSON.parse(event.body);

    if (!resumeText) {
      return { statusCode: 400, body: "Missing resumeText in request body" };
    }

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          // THE FIX: Added strict instructions for concise, one-sentence bullet points.
          content: "You are a skeptical, world-class hiring manager. Your goal is to assess resume authenticity. Analyze the resume for red flags like AI-generated language, vague claims, and inconsistencies. You MUST return a single, clean JSON object with two keys: 'riskScore' (a number from 0-100) and 'analysis' (a markdown-formatted string). The 'analysis' MUST be a bulleted list. Each bullet point MUST be a single, concise sentence summarizing a specific red flag. For example: '• Generic Language: Achievements lack specific metrics, making their impact unquantifiable.'"
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
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(analysisResult),
    };

  } catch (error) {
    console.error("Error during AI analysis:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process the resume." }),
    };
  }
};