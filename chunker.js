const main = document.querySelector('main');

// Function to process a chunk with DeepSeek API
async function processChunk(chunk, apiKey, prompt, updateProgress) {
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
  updateProgress();
  return content;
}

// Process all chunks in parallel and preserve order
async function processAllChunks(text, prompt, apiKey) {

  console.log("Starting chunk processing...");

  if (!text || !prompt || !apiKey) {
    alert("Please fill in all fields: Text, Prompt, and API Key.");
    return;
  }

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
  let { totalChunks, chunksProcessed, inProgress } = Alpine.$data(main).requestStatus;
  totalChunks = chunks.length;
  chunksProcessed = 0;
  inProgress = true;
  Alpine.$data(main).requestStatus = { totalChunks, chunksProcessed, inProgress };

  function updateProgress() {
    chunksProcessed++;
    Alpine.$data(main).requestStatus.chunksProcessed = chunksProcessed;
  }

  const results = await Promise.all(chunks.map(chunk => processChunk(chunk, apiKey, prompt, updateProgress)));
  const finalResult = results.join(' ');

  inProgress = false;
  Alpine.$data(main).requestStatus.inProgress = inProgress;
  Alpine.$data(main).output = finalResult;
}

copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard');
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
}

downloadOutput = (text) => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'output.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}