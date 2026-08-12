#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function getResponseText(payload) {
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload)) return payload.join('\n');
  if (payload == null) return '';

  // Groq uses the OpenAI-compatible chat completions response shape.
  if (Array.isArray(payload.choices) && payload.choices[0]?.message?.content) {
    return payload.choices[0].message.content;
  }
  if (typeof payload.output === 'string') return payload.output;
  if (Array.isArray(payload.output)) {
    return payload.output.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n');
  }
  if (typeof payload.output === 'object' && payload.output !== null) {
    return payload.output.content || JSON.stringify(payload.output);
  }
  if (Array.isArray(payload.result)) {
    return payload.result.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n');
  }
  if (typeof payload.result === 'string') return payload.result;
  return JSON.stringify(payload);
}

function parseJsonFromText(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerError) {
        throw new Error('Unable to parse JSON from Groq response.');
      }
    }
    throw new Error('Groq response did not contain a valid JSON object.');
  }
}

async function fetchGroqMood(emojis, username) {
  const apiKey = process.env.GROQ_API_KEY;
  const apiUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const timeoutMs = Number(process.env.GROQ_TIMEOUT_MS) || 30000; // 30s default
  const retries = Math.max(0, Number(process.env.GROQ_RETRIES) || 2); // retry twice by default

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is required for AI-only mood generation. Set it as a repository secret in GitHub Actions.');
  }

  const prompt = `You are the mood curator for MOODAH. Analyze the feeling behind the emoji sequence and the username below. Reply with only valid JSON in the exact shape {"mood": "...", "description": "..."}.

username: ${username}
emojis: ${emojis.join(' ')}

Requirements:
- mood should be a creative short label or phrase.
- description should be a one- to two-sentence paragraph that explains the vibe in a warm, playful way.
- output only the JSON object, and do not include any extra text.`;

  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  };

  console.log(`Calling Groq: url=${apiUrl} model=${model} timeoutMs=${timeoutMs} retries=${retries}`);

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(id);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Groq API request failed (${response.status}): ${text}`);
      }

      const payload = await response.json();
      const rawText = getResponseText(payload);
      const parsed = parseJsonFromText(rawText);
      if (!parsed.mood || !parsed.description) {
        throw new Error('Groq API response must contain both mood and description.');
      }

      return {
        mood: String(parsed.mood).trim(),
        description: String(parsed.description).trim()
      };
    } catch (err) {
      clearTimeout(id);
      lastError = err;
      const isTimeout = err.name === 'AbortError' || /timeout/i.test(err.message || '');
      console.error(`Groq request attempt ${attempt + 1} failed${isTimeout ? ' (timeout)' : ''}: ${err && err.message ? err.message : String(err)}`);
      if (attempt < retries) {
        const backoff = 1000 * Math.pow(2, attempt); // exponential backoff: 1s, 2s, 4s...
        await new Promise((res) => setTimeout(res, backoff));
        continue;
      }
      // No more retries
      const stack = lastError && lastError.stack ? lastError.stack : String(lastError);
      throw new Error(`Groq request failed after ${retries + 1} attempts: ${stack}`);
    }
  }
}

async function run() {
  const manifestPath = path.resolve(process.cwd(), 'data/manifest.json');
  const resultsPath = path.resolve(process.cwd(), 'generated/mood-results.json');
  const manifest = readJson(manifestPath);

  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error('Manifest must be a non-empty array.');
  }

  const newEntry = manifest[manifest.length - 1];
  if (!newEntry || !newEntry.username || !Array.isArray(newEntry.emojis)) {
    throw new Error('The last entry must be the new entry with username and emojis.');
  }

  const moodData = await fetchGroqMood(newEntry.emojis, newEntry.username);
  console.log('Groq AI mood generation succeeded.');

  let results = [];
  if (fs.existsSync(resultsPath)) {
    const existing = readJson(resultsPath);
    if (!Array.isArray(existing)) {
      throw new Error('Mood results file must be an array.');
    }
    results = existing;
  }

  const updatedResults = results.filter((item) => item.username !== newEntry.username);
  updatedResults.push({
    username: newEntry.username,
    mood: moodData.mood,
    description: moodData.description,
    addedAt: new Date().toISOString()
  });

  writeJson(resultsPath, updatedResults);
  console.log(`Mood analysis complete for ${newEntry.username}: ${moodData.mood}`);
  console.log(moodData.description);
}

run().catch((error) => {
  console.error(`Mood analysis failed: ${error.message}`);
  process.exit(1);
});
