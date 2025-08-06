// api/subtitles.js - Vercel Function para obtener subtítulos de YouTube

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { videoId } = req.query;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log(`Fetching subtitles for video: ${videoId}`);

    // Method 1: Try youtube-transcript-api
    try {
      const transcriptResponse = await fetch(`https://youtube-transcript-api.herokuapp.com/transcript?video_id=${videoId}`);
      
      if (transcriptResponse.ok) {
        const transcriptData = await transcriptResponse.json();
        
        if (transcriptData && transcriptData.length > 0) {
          console.log(`Successfully fetched ${transcriptData.length} transcript segments`);
          
          // Convert to our format
          const formattedTranscript = transcriptData.map(item => ({
            start: parseFloat(item.start || 0),
            end: parseFloat(item.start || 0) + parseFloat(item.duration || 3),
            text: item.text || '',
            translation: '', // Will be added later with translation API
            difficulty: getDifficultyLevel(item.text || '')
          }));

          return res.status(200).json({
            success: true,
            videoId: videoId,
            transcript: formattedTranscript,
            source: 'youtube-transcript-api'
          });
        }
      }
    } catch (error) {
      console.log('Method 1 failed:', error.message);
    }

    // Fallback: Create realistic sample for testing
    console.log('Creating sample transcript for testing');
    
    const sampleTranscript = [
      {
        start: 0,
        end: 4,
        text: "Hello everyone, and welcome back to our channel.",
        translation: "Hola a todos, y bienvenidos de vuelta a nuestro canal.",
        difficulty: "beginner"
      },
      {
        start: 4,
        end: 8,
        text: "Today we're going to be talking about something really interesting.",
        translation: "Hoy vamos a hablar sobre algo realmente interesante.",
        difficulty: "intermediate"
      },
      {
        start: 8,
        end: 12,
        text: "Before we get started, make sure to hit that subscribe button.",
        translation: "Antes de comenzar, asegúrense de presionar el botón de suscribirse.",
        difficulty: "intermediate"
      },
      {
        start: 12,
        end: 17,
        text: "And if you enjoy this video, please give it a thumbs up.",
        translation: "Y si disfrutan este video, por favor denle un me gusta.",
        difficulty: "beginner"
      },
      {
        start: 17,
        end: 22,
        text: "It really helps us out and lets us know that you want to see more content like this.",
        translation: "Realmente nos ayuda y nos permite saber que quieren ver más contenido como este.",
        difficulty: "advanced"
      }
    ];

    return res.status(200).json({
      success: true,
      videoId: videoId,
      transcript: sampleTranscript,
      source: 'sample-data'
    });

  } catch (error) {
    console.error('Error in subtitles API:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch subtitles',
