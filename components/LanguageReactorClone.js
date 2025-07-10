import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Settings, BookOpen, Award, Download, Loader, AlertCircle } from 'lucide-react';

const LanguageReactorClone = () => {
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [selectedWords, setSelectedWords] = useState(new Set());
  const [userPoints, setUserPoints] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [isYouTubeAPIReady, setIsYouTubeAPIReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  
  // Language Reactor specific states
  const [showDualSubtitles, setShowDualSubtitles] = useState(true);
  const [primaryLanguage, setPrimaryLanguage] = useState('english');
  const [secondaryLanguage, setSecondaryLanguage] = useState('spanish');
  const [autoPause, setAutoPause] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [vocabularyList, setVocabularyList] = useState([]);
  const [showTranscript, setShowTranscript] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1);
  const [showPopupDict, setShowPopupDict] = useState(null);
  const [hasAutoPaused, setHasAutoPaused] = useState(false);
  const [transcriptSource, setTranscriptSource] = useState('');

  // Refs for better performance
  const timeUpdateRef = useRef(null);
  const transcriptRef = useRef(null);

  // Extract video ID
  const extractVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Fetch video info from YouTube API
  const fetchVideoInfo = async (videoId) => {
    try {
      const response = await fetch(`/api/youtube/info?videoId=${videoId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch video info');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw error;
    }
  };

  // Fetch transcript using real APIs
  const fetchTranscript = async (videoId, targetLanguage = 'es') => {
    try {
      setLoadingMessage('Checking for cached transcript...');
      
      // First, try cache
      const cacheResponse = await fetch(`/api/youtube/cache?videoId=${videoId}`);
      
      if (cacheResponse.ok) {
        const cachedData = await cacheResponse.json();
        console.log('Using cached transcript');
        setTranscriptSource('cache');
        return cachedData.transcript;
      }
      
      // If not cached, generate new transcript
      console.log('Generating new transcript...');
      setLoadingMessage('Fetching YouTube captions...');
      
      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId,
          targetLanguage
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate transcript');
      }
      
      const data = await response.json();
      
      setTranscriptSource(data.source);
      setLoadingMessage('Caching transcript for future use...');
      
      // Cache the result
      await fetch('/api/youtube/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId,
          transcript: data.transcript
        })
      });
      
      return data.transcript;
    } catch (error) {
      console.error('Error fetching transcript:', error);
      throw error;
    }
  };

  // Dictionary for words (Enhanced with AI in future)
  const getDictionaryInfo = (word) => {
    const dictionary = {
      "hear": { definition: "to perceive sound", pronunciation: "/hɪr/", examples: ["Can you hear me?"], difficulty: "basic" },
      "nothing": { definition: "not anything", pronunciation: "/ˈnʌθɪŋ/", examples: ["I have nothing"], difficulty: "basic" },
      "conference": { definition: "a meeting", pronunciation: "/ˈkɑnfərəns/", examples: ["Business conference"], difficulty: "intermediate" },
      "brilliant": { definition: "very clever", pronunciation: "/ˈbrɪljənt/", examples: ["Brilliant idea"], difficulty: "advanced" },
      "speaker": { definition: "person who speaks", pronunciation: "/ˈspiːkər/", examples: ["The speaker was great"], difficulty: "intermediate" },
      "learned": { definition: "gained knowledge", pronunciation: "/lɜːrnd/", examples: ["I learned something new"], difficulty: "intermediate" },
      "wonderful": { definition: "excellent, great", pronunciation: "/ˈwʌndərfəl/", examples: ["A wonderful day"], difficulty: "basic" },
      "manner": { definition: "way of doing something", pronunciation: "/ˈmænər/", examples: ["In a polite manner"], difficulty: "intermediate" },
      "absolutely": { definition: "completely", pronunciation: "/ˈæbsəˌlutli/", examples: ["Absolutely nothing"], difficulty: "intermediate" },
      "whatsoever": { definition: "at all, in any way", pronunciation: "/ˌwʌtsəˈɛvər/", examples: ["Nothing whatsoever"], difficulty: "advanced" },
      "remotely": { definition: "in the slightest degree", pronunciation: "/rɪˈmoʊtli/", examples: ["Not remotely possible"], difficulty: "advanced" },
      "researched": { definition: "investigated thoroughly", pronunciation: "/rɪˈsɜːrtʃt/", examples: ["Well researched paper"], difficulty: "intermediate" },
      "inspirational": { definition: "providing motivation", pronunciation: "/ˌɪnspəˈreɪʃənəl/", examples: ["Inspirational speech"], difficulty: "advanced" }
    };
    
    return dictionary[word.toLowerCase()] || {
      definition: "Definition not available",
      pronunciation: "/unknown/",
      examples: ["No examples"],
      difficulty: "unknown"
    };
  };

  const getWordDifficultyColor = (word) => {
    const info = getDictionaryInfo(word);
    const colors = {
      basic: "text-green-600",
      intermediate: "text-yellow-600", 
      advanced: "text-red-600",
      unknown: "text-gray-600"
    };
    return colors[info.difficulty] || colors.unknown;
  };

  // Recommended videos
  const recommendedVideos = [
    {
      id: 0,
      videoId: "8S0FDjFBj8o",
      title: "Brené Brown: I Have Nothing (Demo Video)",
      thumbnail: "https://img.youtube.com/vi/8S0FDjFBj8o/maxresdefault.jpg",
      duration: "5:00",
      level: "Intermediate",
      speaker: "Brené Brown"
    },
    {
      id: 1,
      videoId: "dQw4w9WgXcQ",
      title: "Rick Astley - Never Gonna Give You Up",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      duration: "3:33",
      level: "Beginner",
      speaker: "Rick Astley"
    }
  ];

  // YouTube API setup
  useEffect(() => {
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
      
      window.onYouTubeIframeAPIReady = () => {
        setIsYouTubeAPIReady(true);
      };
    } else {
      setIsYouTubeAPIReady(true);
    }
  }, []);

  // Time tracking
  const updateTimeAndSegment = useCallback(() => {
    if (!youtubePlayer || !youtubePlayer.getCurrentTime) return;

    try {
      const time = youtubePlayer.getCurrentTime();
      const duration = youtubePlayer.getDuration();
      
      setCurrentTime(time);
      if (duration > 0) {
        setVideoProgress((time / duration) * 100);
      }

      // Find current segment
      const currentSegment = transcript.findIndex(segment => 
        time >= segment.start && time < segment.end
      );
      
      if (currentSegment !== currentSegmentIndex) {
        if (currentSegment === -1 && time < transcript[0]?.start) {
          setCurrentSegmentIndex(-1);
          return;
        }
        
        setCurrentSegmentIndex(currentSegment);
        
        // Auto-pause
        if (autoPause && currentSegment > currentSegmentIndex && currentSegment !== -1) {
          if (!hasAutoPaused) {
            youtubePlayer.pauseVideo();
            setHasAutoPaused(true);
            setTimeout(() => setHasAutoPaused(false), 1000);
          }
        }
        
        // Auto-scroll
        if (currentSegment >= 0 && transcriptRef.current) {
          const segmentElement = transcriptRef.current.querySelector(`[data-segment="${currentSegment}"]`);
          if (segmentElement) {
            segmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    } catch (error) {
      console.error('Error updating time:', error);
    }
  }, [youtubePlayer, transcript, currentSegmentIndex, autoPause, hasAutoPaused]);

  // Time update interval
  useEffect(() => {
    if (isPlaying && youtubePlayer) {
      timeUpdateRef.current = setInterval(updateTimeAndSegment, 100);
    } else {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current);
      }
    }

    return () => {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current);
      }
    };
  }, [isPlaying, youtubePlayer, updateTimeAndSegment]);

  // Create YouTube Player
  const createYouTubePlayer = useCallback((videoId) => {
    if (!isYouTubeAPIReady || !window.YT) return;

    if (youtubePlayer) {
      try {
        youtubePlayer.destroy();
      } catch (error) {
        console.log('Error destroying player:', error);
      }
    }

    const player = new window.YT.Player('youtube-player', {
      height: '400',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        enablejsapi: 1,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: (event) => {
          setYoutubePlayer(event.target);
          setVideoDuration(event.target.getDuration());
        },
        onStateChange: (event) => {
          if (event.data === 1) {
            setIsPlaying(true);
          } else if (event.data === 2) {
            setIsPlaying(false);
          } else if (event.data === 0) {
            setIsPlaying(false);
            setCurrentSegmentIndex(-1);
          }
        }
      }
    });
  }, [isYouTubeAPIReady, youtubePlayer]);

  // Controls
  const handlePlayPause = () => {
    if (!youtubePlayer) return;
    
    try {
      if (isPlaying) {
        youtubePlayer.pauseVideo();
      } else {
        youtubePlayer.playVideo();
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
    }
  };

  const handleSeek = (newTime) => {
    if (!youtubePlayer) return;
    
    try {
      youtubePlayer.seekTo(newTime, true);
      setCurrentTime(newTime);
      
      if (videoDuration > 0) {
        setVideoProgress((newTime / videoDuration) * 100);
      }
      
      // Immediate segment detection
      const newSegment = transcript.findIndex(segment => 
        newTime >= segment.start && newTime < segment.end
      );
      
      if (newSegment !== currentSegmentIndex) {
        setCurrentSegmentIndex(newSegment);
        
        if (newSegment >= 0 && transcriptRef.current) {
          const segmentElement = transcriptRef.current.querySelector(`[data-segment="${newSegment}"]`);
          if (segmentElement) {
            segmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
      
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(0, currentTime - 5);
    handleSeek(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(videoDuration, currentTime + 5);
    handleSeek(newTime);
  };

  // Word interaction
  const handleWordClick = (word, segmentIndex, wordIndex) => {
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    const uniqueKey = `${segmentIndex}-${wordIndex}`;
    
    if (!selectedWords.has(uniqueKey)) {
      setSelectedWords(new Set([...selectedWords, uniqueKey]));
      setUserPoints(prev => prev + 10);
      
      const dictInfo = getDictionaryInfo(cleanWord);
      const newVocabItem = {
        word: cleanWord,
        definition: dictInfo.definition,
        context: transcript[segmentIndex][primaryLanguage],
        difficulty: dictInfo.difficulty,
        timestamp: new Date().toISOString()
      };
      
      setVocabularyList(prev => [...prev, newVocabItem]);
    }
  };

  // Load video with real APIs
  const handleVideoUrlSubmit = async () => {
    if (!videoUrl.trim()) return;
    
    setError('');
    
    try {
      setLoading(true);
      setLoadingMessage('Extracting video ID...');
      
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Fetch video info
      setLoadingMessage('Fetching video information...');
      const videoInfo = await fetchVideoInfo(videoId);
      
      // Fetch transcript
      setLoadingMessage('Processing transcript...');
      const subtitles = await fetchTranscript(videoId, 'es');
      
      if (!subtitles || subtitles.length === 0) {
        throw new Error('No transcript available for this video');
      }
      
      setCurrentVideo({
        ...videoInfo,
        videoId: videoId
      });
      setTranscript(subtitles);
      setVideoUrl('');
      setCurrentSegmentIndex(-1);
      setSelectedWords(new Set());
      
      setTimeout(() => {
        createYouTubePlayer(videoId);
      }, 100);
      
      setUserPoints(prev => prev + 50); // Bonus for successful load
      
    } catch (error) {
      console.error('Error loading video:', error);
      setError(error.message || 'Failed to load video');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const selectRecommendedVideo = async (video) => {
    setError('');
    
    try {
      setLoading(true);
      setLoadingMessage('Loading recommended video...');
      
      // Fetch video info (for real data)
      const videoInfo = await fetchVideoInfo(video.videoId);
      
      // Fetch transcript
      const subtitles = await fetchTranscript(video.videoId, 'es');
      
      if (!subtitles || subtitles.length === 0) {
        throw new Error('No transcript available for this video');
      }
      
      setCurrentVideo({
        ...videoInfo,
        videoId: video.videoId
      });
      setTranscript(subtitles);
      setCurrentSegmentIndex(-1);
      setSelectedWords(new Set());
      
      setTimeout(() => {
        createYouTubePlayer(video.videoId);
      }, 100);
      
      setUserPoints(prev => prev + 30);
      
    } catch (error) {
      console.error('Error loading recommended video:', error);
      setError(error.message || 'Failed to load recommended video');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderDualSubtitles = () => {
    if (currentSegmentIndex === -1 || !transcript[currentSegmentIndex]) return null;
    
    const segment = transcript[currentSegmentIndex];
    
    return (
      <div className="absolute bottom-20 left-0 right-0 text-center px-4">
        <div className="inline-block bg-black bg-opacity-80 rounded-lg p-4 max-w-4xl">
          <div className="text-white font-bold mb-2" style={{ fontSize: `${fontSize}px` }}>
            {segment[primaryLanguage]}
          </div>
          <div className="text-yellow-300" style={{ fontSize: `${fontSize-2}px` }}>
            {segment[secondaryLanguage]}
          </div>
        </div>
      </div>
    );
  };

  const renderTranscriptSegment = (segment, index) => {
    const isActive = index === currentSegmentIndex;
    const primaryText = segment[primaryLanguage];
    const secondaryText = segment[secondaryLanguage];
    
    return (
      <div
        key={index}
        data-segment={index}
        className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 border-l-4 ${
          isActive 
            ? 'bg-blue-100 border-blue-500 shadow-lg' 
            : 'bg-gray-50 hover:bg-gray-100 border-transparent'
        }`}
        onClick={() => handleSeek(segment.start)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs px-2 py-1 rounded ${
            isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {formatTime(segment.start)}
          </span>
          {isActive && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="ml-1 text-xs text-blue-600 font-medium">NOW</span>
            </div>
          )}
        </div>
        
        <div className="mb-1" style={{ fontSize: `${fontSize}px` }}>
          {primaryText.split(' ').map((word, wordIndex) => {
            const uniqueKey = `${index}-${wordIndex}`;
            const isSelected = selectedWords.has(uniqueKey);
            const cleanWord = word.replace(/[.,!?;:]/g, '');
            
            return (
              <span
                key={wordIndex}
                className={`cursor-pointer px-1 py-0.5 rounded transition-all duration-150 ${
                  isSelected 
                    ? 'bg-blue-300 text-blue-900 font-bold' 
                    : `hover:bg-blue-100 ${getWordDifficultyColor(cleanWord)}`
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleWordClick(cleanWord, index, wordIndex);
                }}
                title={`${cleanWord} - ${getDictionaryInfo(cleanWord).difficulty}`}
              >
                {word}{' '}
              </span>
            );
          })}
        </div>
        
        <div className="text-gray-600 text-sm">
          {secondaryText}
        </div>
      </div>
    );
  };

  const getSourceBadge = () => {
    const badges = {
      'youtube': { text: 'YouTube Captions', color: 'bg-green-500' },
      'whisper': { text: 'AI Transcription', color: 'bg-blue-500' },
      'cache': { text: 'Cached', color: 'bg-gray-500' }
    };
    
    const badge = badges[transcriptSource] || { text: 'Unknown', color: 'bg-gray-400' };
    
    return (
      <span className={`text-xs px-2 py-1 rounded text-white ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">PolyCore - Language Learning Platform</h1>
            <p className="text-sm text-gray-600">Powered by YouTube API + Whisper + GPT-4</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-lg">
              <Award className="w-4 h-4 text-yellow-600" />
              <span className="font-semibold text-yellow-700">{userPoints}</span>
            </div>
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-700">{vocabularyList.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <div className="text-center">
              <Loader className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Video</h3>
              <p className="text-gray-600">{loadingMessage}</p>
              <div className="mt-4 text-xs text-gray-500">
                This may take 30-60 seconds for new videos
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      {currentVideo && (
        <div className="mb-6 bg-white rounded-lg shadow-sm">
          <div className="flex">
            {/* Video Section */}
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{currentVideo.title}</h2>
                {transcriptSource && getSourceBadge()}
              </div>
              
              <div className="relative">
                <div 
                  id="youtube-player" 
                  className="w-full rounded-lg"
                  style={{ height: '400px' }}
                ></div>
                
                {/* Dual Subtitles Overlay */}
                {currentSegmentIndex >= 0 && renderDualSubtitles()}
                
                {/* Custom Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 rounded-b-lg">
                  {/* Progress Bar */}
                  <div 
                    className="w-full bg-gray-600 h-2 rounded-full cursor-pointer mb-3"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newTime = (clickX / rect.width) * videoDuration;
                      handleSeek(newTime);
                    }}
                  >
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${videoProgress}%` }}
                    ></div>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleSkipBackward}
                        className="text-white hover:text-yellow-400 transition-colors"
                        title="Back 5s"
                      >
                        <SkipBack className="w-6 h-6" />
                      </button>
                      
                      <button
                        onClick={handlePlayPause}
                        className="text-white hover:text-yellow-400 transition-colors bg-red-600 rounded-full p-2"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </button>
                      
                      <button
                        onClick={handleSkipForward}
                        className="text-white hover:text-yellow-400 transition-colors"
                        title="Forward 5s"
                      >
                        <SkipForward className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(videoDuration)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status */}
              <div className="mt-4 bg-green-50 rounded-lg p-3">
                <div className="text-sm text-green-700">
                  {isPlaying ? '▶ Playing' : '⏸ Paused'} - Time: {formatTime(currentTime)}
                  {currentSegmentIndex >= 0 ? (
                    <span className="ml-2 bg-green-200 px-2 py-1 rounded text-xs">
                      Segment {currentSegmentIndex + 1}/{transcript.length}
                    </span>
                  ) : (
                    <span className="ml-2 bg-gray-200 px-2 py-1 rounded text-xs">
                      {currentTime < transcript[0]?.start ? 'Waiting for speech...' : 'No speech detected'}
                    </span>
                  )}
                  {currentVideo.channelTitle && (
                    <span className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">
                      {currentVideo.channelTitle}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Transcript Section */}
            <div className="w-1/2 bg-gray-50 border-l">
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Interactive Transcript</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setAutoPause(!autoPause)}
                      className={`text-xs px-2 py-1 rounded ${
                        autoPause ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      Auto Pause
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-600">
                  Click words to add to vocabulary • {transcript.length} segments loaded
                </div>
              </div>
              
              <div 
                ref={transcriptRef}
                className="h-96 overflow-y-auto p-4 space-y-2"
              >
                {transcript.length > 0 ? (
                  transcript.map((segment, index) => renderTranscriptSegment(segment, index))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Loading transcript...</p>
                  </div>
                )}
              </div>

              {/* Vocabulary Panel */}
              {vocabularyList.length > 0 && (
                <div className="border-t bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Vocabulary ({vocabularyList.length})</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const vocabText = vocabularyList.map(item => 
                            `${item.word}: ${item.definition}`
                          ).join('\n');
                          navigator.clipboard.writeText(vocabText);
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                        title="Copy vocabulary list"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setVocabularyList([])}
                        className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {vocabularyList.slice(-8).map((item, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.word}</span>
                          <span className={`text-xs px-1 rounded ${
                            item.difficulty === 'basic' ? 'bg-green-100 text-green-600' :
                            item.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-600' :
                            item.difficulty === 'advanced' ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {item.difficulty}
                          </span>
                        </div>
                        <div className="text-gray-600 truncate">{item.definition}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">🚀 Load Any YouTube Video</h2>
        <div className="flex space-x-3">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Paste any YouTube URL here..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleVideoUrlSubmit()}
            disabled={loading}
          />
          <button
            onClick={handleVideoUrlSubmit}
            disabled={loading || !videoUrl.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 font-medium"
          >
            {loading ? 'Processing...' : 'Load Video'}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          ✨ Supports any YouTube video with automatic transcription and translation
        </div>
      </div>

      {/* Recommended Videos */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">🎯 Try These Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedVideos.map((video) => (
            <div
              key={video.id}
              className="cursor-pointer transform hover:scale-105 transition-transform duration-200 bg-gray-50 rounded-lg p-4 border hover:shadow-md"
              onClick={() => selectRecommendedVideo(video)}
            >
              <div className="flex space-x-3">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-24 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1">{video.title}</h3>
                  <div className="text-xs text-gray-600 mb-2">by {video.speaker}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      {video.level}
                    </span>
                    <span className="text-xs text-gray-500">
                      {video.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-semibold mb-3">⚙️ Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Font Size</label>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{fontSize}px</span>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Primary Language</label>
            <select
              value={primaryLanguage}
              onChange={(e) => setPrimaryLanguage(e.target.value)}
              className="w-full text-xs border rounded px-2 py-1"
            >
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Secondary Language</label>
            <select
              value={secondaryLanguage}
              onChange={(e) => setSecondaryLanguage(e.target.value)}
              className="w-full text-xs border rounded px-2 py-1"
            >
              <option value="spanish">Spanish</option>
              <option value="english">English</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Playback Speed</label>
            <select
              value={playbackSpeed}
              onChange={(e) => {
                const speed = parseFloat(e.target.value);
                setPlaybackSpeed(speed);
                if (youtubePlayer) {
                  youtubePlayer.setPlaybackRate(speed);
                }
              }}
              className="w-full text-xs border rounded px-2 py-1"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageReactorClone;
