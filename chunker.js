// ...existing code...

// Function to process a chunk with DeepSeek API
async function processChunk(chunk, apiKey, prompt) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Text: ${chunk}\n\nPrompt: ${prompt}` }
      ]
    })
  });
  const data = await response.json();
  const content = data.choices[0].message.content;
  console.log(content);
  return content;
}

// Process all chunks in parallel and preserve order
async function processAllChunks() {
  // Read values only when button is clicked
  const apiKey = document.getElementById('apiKey').value.trim();
  const prompt = document.getElementById('prompt').value.trim();
  const text = document.getElementById('inputText').value;

  // Disable button to prevent multiple clicks
  const button = document.getElementById('chunkButton');
  button.disabled = true;
  button.textContent = "PROCESSING... PLEASE WAIT";

  // Split text into chunks of max 4000 characters, splitting on periods
  const sentences = text.split('.').map(s => s.trim()).filter(Boolean);
  const chunks = [];
  let currentChunk = '';
  for (const sentence of sentences) {
    const sentenceWithPeriod = sentence + '.';
    if ((currentChunk.length + sentenceWithPeriod.length) <= 4000) {
      currentChunk += sentenceWithPeriod;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentenceWithPeriod;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  const results = await Promise.all(chunks.map(chunk => processChunk(chunk, apiKey, prompt)));
  const finalResult = results.join(' ');

  // Download result as output.txt
  const blob = new Blob([finalResult], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'output.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  button.disabled = false;
  button.textContent = "SUBMIT";
  alert("Final result written to output.txt.");
}

// Example: Run when button is clicked
document.getElementById('chunkButton').onclick = processAllChunks;

document.querySelectorAll('.character-counted').forEach(element => {
  element.addEventListener('input', function () {
    const charCount = this.value.length;
    const label = this.nextElementSibling;
    if (label && label.tagName.toLowerCase() === 'label') {
      label.textContent = `CHARACTERS: ${charCount}`;
    }
  });
});