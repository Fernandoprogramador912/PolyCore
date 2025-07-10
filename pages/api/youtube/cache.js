// Simple in-memory cache for development
// In production, use Redis (Upstash)

let memoryCache = new Map();

export default async function handler(req, res) {
  const { method } = req;
  
  if (method === 'GET') {
    const { videoId } = req.query;
    
    try {
      // Try Redis first if available
      if (process.env.UPSTASH_REDIS_REST_URL) {
        const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/transcript:${videoId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            return res.status(200).json({
              transcript: JSON.parse(data.result),
              cached: true
            });
          }
        }
      }
      
      // Fallback to memory cache
      const cached = memoryCache.get(`transcript:${videoId}`);
      if (cached) {
        return res.status(200).json({
          transcript: cached,
          cached: true
        });
      }
      
      return res.status(404).json({ error: 'No cached transcript found' });
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return res.status(500).json({ error: 'Cache error' });
    }
  }
  
  if (method === 'POST') {
    const { videoId, transcript } = req.body;
    
    try {
      // Try Redis first if available
      if (process.env.UPSTASH_REDIS_REST_URL) {
        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/transcript:${videoId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([JSON.stringify(transcript), 'EX', 604800]) // 7 days
        });
      }
      
      // Always cache in memory as backup
      memoryCache.set(`transcript:${videoId}`, transcript);
      
      return res.status(200).json({ message: 'Transcript cached successfully' });
    } catch (error) {
      console.error('Cache storage error:', error);
      return res.status(500).json({ error: 'Failed to cache transcript' });
    }
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
