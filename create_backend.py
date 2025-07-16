import os

# Define the folder and file paths
functions_dir = "netlify/functions"
file_path = os.path.join(functions_dir, "process.js")

# The JavaScript code for our Netlify Function
js_code = """
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
"""

# Create the directory if it doesn't exist
os.makedirs(functions_dir, exist_ok=True)

# Write the JavaScript code to the file
with open(file_path, "w") as f:
    f.write(js_code)

print(f"Successfully created backend file at: {file_path}")