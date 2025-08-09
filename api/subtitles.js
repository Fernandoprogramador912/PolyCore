// api/subtitles.js - API para obtener subtítulos reales de YouTube

export default async function handler(req, res) {
  // Permitir peticiones desde cualquier origen (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Obtener el ID del video desde la URL
    const { videoId } = req.query;

    // Validar que se proporcionó un videoId
    if (!videoId) {
      return res.status(400).json({ 
        success: false,
        error: 'Se requiere videoId en la URL' 
      });
    }

    console.log(`🎬 Procesando video: ${videoId}`);

    // Intentar obtener subtítulos reales
    const transcript = await getYouTubeTranscript(videoId);

    if (transcript && transcript.length > 0) {
      console.log(`✅ Encontrados ${transcript.length} segmentos de subtítulos`);
      
      return res.status(200).json({
        success: true,
        videoId: videoId,
        transcript: transcript,
        source: 'youtube-real-subtitles'
      });
    } else {
      // Si no hay subtítulos reales, usar datos de ejemplo mejorados
      console.log(`⚠️ No se encontraron subtítulos para ${videoId}, usando datos de ejemplo`);
      
      const sampleTranscript = createSampleTranscript(videoId);
      
      return res.status(200).json({
        success: true,
        videoId: videoId,
        transcript: sampleTranscript,
        source: 'sample-data',
        note: 'Subtítulos de ejemplo - el video real puede no tener subtítulos disponibles'
      });
    }

  } catch (error) {
    console.error('❌ Error en la API:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}

// Función para intentar obtener subtítulos reales
async function getYouTubeTranscript(videoId) {
  try {
    // Método 1: Intentar con servicio de transcripción
    const transcriptUrl = `https://youtube-transcript-api.herokuapp.com/transcript?video_id=${videoId}`;
    
    const response = await fetch(transcriptUrl);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Convertir al formato que usa nuestro frontend
        return data.map(item => ({
          start: parseFloat(item.start || 0),
          end: parseFloat(item.start || 0) + parseFloat(item.duration || 3),
          text: item.text || '',
          translation: '', // Se puede agregar traducción después
          difficulty: calculateDifficulty(item.text || '')
        }));
      }
    }
  } catch (error) {
    console.log('Método 1 falló:', error.message);
  }

  // Si no funcionó, devolver null
  return null;
}

// Función para crear transcript de ejemplo realista
function createSampleTranscript(videoId) {
  return [
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
      text: "It really helps us out and lets us know that you want to see more content.",
      translation: "Realmente nos ayuda y nos permite saber que quieren ver más contenido.",
      difficulty: "advanced"
    },
    {
      start: 22,
      end: 26,
      text: `This transcript was generated for video ID: ${videoId}`,
      translation: `Esta transcripción fue generada para el video ID: ${videoId}`,
      difficulty: "intermediate"
    }
  ];
}

// Función para calcular dificultad automáticamente
function calculateDifficulty(text) {
  if (!text) return 'beginner';
  
  const words = text.toLowerCase().split(' ');
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  // Palabras complejas (más de 8 letras)
  const complexWords = words.filter(word => word.length > 8).length;
  const complexityRatio = complexWords / words.length;
  
  // Determinar dificultad basada en longitud promedio y complejidad
  if (complexityRatio > 0.25 || avgWordLength > 6) return 'advanced';
  if (complexityRatio > 0.1 || avgWordLength > 4.5) return 'intermediate';
  return 'beginner';
}
