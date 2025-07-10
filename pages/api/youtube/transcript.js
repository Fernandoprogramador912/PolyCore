import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId, targetLanguage = 'es' } = req.body;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    console.log('Attempting to fetch YouTube captions...');
    
    let transcript = null;
    let source = 'youtube';
    
    try {
      const captions = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en',
        country: 'US'
      });
      
      if (captions && captions.length > 0) {
        transcript = captions.map(caption => ({
          start: Math.round((caption.offset / 1000) * 10) / 10,
          end: Math.round(((caption.offset + caption.duration) / 1000) * 10) / 10,
          text: caption.text.replace(/\n/g, ' ').trim()
        }));
        
        console.log(`Found ${transcript.length} caption segments`);
      }
    } catch (captionError) {
      console.log('No YouTube captions available:', captionError.message);
      
      // Fallback: Create simple transcript for demo
      transcript = [
        { start: 0, end: 5, text: "This video doesn't have captions available." },
        { start: 5, end: 10, text: "We would normally use Whisper AI to transcribe it." },
        { start: 10, end: 15, text: "For now, this is a demo transcript." }
      ];
      source = 'demo';
    }
    
    // Translate transcript
    console.log('Translating transcript...');
    const translatedTranscript = await translateTranscript(transcript, targetLanguage);
    
    // Format for frontend
    const formattedTranscript = translatedTranscript.map(segment => ({
      start: segment.start,
      end: segment.end,
      english: segment.original || segment.text,
      spanish: segment.translated || segment.text
    }));
    
    res.status(200).json({
      transcript: formattedTranscript,
      source,
      language: targetLanguage,
      totalSegments: formattedTranscript.length
    });
    
  } catch (error) {
    console.error('Transcript Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate transcript',
      details: error.message 
    });
  }
}

async function translateTranscript(transcript, targetLanguage) {
  const batchSize = 5;
  const batches = [];
  
  for (let i = 0; i < transcript.length; i += batchSize) {
    batches.push(transcript.slice(i, i + batchSize));
  }
  
  const translatedBatches = await Promise.all(
    batches.map(batch => translateBatch(batch, targetLanguage))
  );
  
  return translatedBatches.flat();
}

async function translateBatch(batch, targetLanguage) {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback: Return original text
    return batch.map(segment => ({
      start: segment.start,
      end: segment.end,
      original: segment.text,
      translated: segment.text
    }));
  }

  const textToTranslate = batch.map((segment, index) => 
    `${index + 1}. ${segment.text}`
  ).join('\n');
  
  const prompt = `Translate the following English text to Spanish. 
Maintain the same numbering format and keep translations natural and contextual.

${textToTranslate}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate accurately while maintaining natural flow.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      throw new Error('Translation failed');
    }
    
    const data = await response.json();
    const translatedText = data.choices[0].message.content;
    
    const translations = translatedText.split('\n').map(line => {
      const match = line.match(/^\d+\.\s*(.+)$/);
      return match ? match[1] : line;
    });
    
    return batch.map((segment, index) => ({
      start: segment.start,
      end: segment.end,
      original: segment.text,
      translated: translations[index] || segment.text
    }));
    
  } catch (error) {
    console.error('Translation Error:', error);
    // Fallback: return original text
    return batch.map(segment => ({
      start: segment.start,
      end: segment.end,
      original: segment.text,
      translated: segment.text
    }));
  }
}
