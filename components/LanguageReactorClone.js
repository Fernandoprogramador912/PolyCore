import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Volume2, Subtitles, BookOpen, Trophy, Zap, Target, Star, MessageCircle, Download, ExternalLink, Heart, Share2 } from 'lucide-react';

const LanguageReactorClone = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [translations, setTranslations] = useState({});
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLevel, setUserLevel] = useState('Intermediate');
  const [points, setPoints] = useState(1250);
  const [streak, setStreak] = useState(7);
  const [wordsLearned, setWordsLearned] = useState(89);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [primaryLang, setPrimaryLang] = useState('English');
  const [secondaryLang, setSecondaryLang] = useState('Spanish');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [savedWords, setSavedWords] = useState([]);
  const [difficulty, setDifficulty] = useState('Intermediate');
  
  const videoRef = useRef(null);
  const transcriptRef = useRef(null);

  // Sample transcript data
  const sampleTranscript = [
    { 
      start: 0, 
      end: 3, 
      text: "Hello everyone, welcome to today's lesson about language learning.",
      translation: "Hola a todos, bienvenidos a la lección de hoy sobre aprendizaje de idiomas.",
      difficulty: "beginner",
      words: ["Hello", "everyone", "welcome", "today's", "lesson", "language", "learning"]
    },
    { 
      start: 3, 
      end: 7, 
      text: "In this video, we'll explore effective techniques for improving your vocabulary.",
      translation: "En este video, exploraremos técnicas efectivas para mejorar tu vocabulario.",
      difficulty: "intermediate",
      words: ["video", "explore", "effective", "techniques", "improving", "vocabulary"]
    },
    { 
      start: 7, 
      end: 12, 
      text: "The first method involves contextual learning through authentic materials.",
      translation: "El primer método implica aprendizaje contextual a través de materiales auténticos.",
      difficulty: "advanced",
      words: ["method", "involves", "contextual", "authentic", "materials"]
    },
    { 
      start: 12, 
      end: 16, 
      text: "This approach helps you understand how words are used in real situations.",
      translation: "Este enfoque te ayuda a entender cómo se usan las palabras en situaciones reales.",
      difficulty: "intermediate",
      words: ["approach", "understand", "situations", "real"]
    },
    { 
      start: 16, 
      end: 20, 
      text: "Remember, consistency is key to language learning success.",
      translation: "Recuerda, la consistencia es clave para el éxito en el aprendizaje de idiomas.",
      difficulty: "beginner",
      words: ["consistency", "success", "remember"]
    }
  ];

  // Demo videos
  const demoVideos = [
    {
      title: "Brené Brown: I Have Nothing (Demo Video)",
      author: "Brené Brown",
      duration: "5:00",
      level: "Intermediate",
      thumbnail: "/api/placeholder/120/90",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      title: "Rick Astley - Never Gonna Give You Up",
      author: "Rick Astley", 
      duration: "3:33",
      level: "Beginner",
      thumbnail: "/api/placeholder/120/90",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  ];

  useEffect(() => {
    setTranscript(sampleTranscript);
    setDuration(300); // 5 minutes
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSentenceClick = (sentence, index) => {
    setSelectedSentence(index);
    handleSeek(sentence.start);
    setPoints(prev => prev + 5);
  };

  const handleWordClick = (word) => {
    if (!savedWords.includes(word)) {
      setSavedWords(prev => [...prev, word]);
      setWordsLearned(prev => prev + 1);
      setPoints(prev => prev + 10);
    }
  };

  const loadVideo = async () => {
    if (!videoUrl) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // Set demo transcript
        setTranscript(sampleTranscript);
      }, 2000);
    } catch (error) {
      console.error('Error loading video:', error);
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'beginner': return 'text-green-500';
      case 'intermediate': return 'text-yellow-500';
      case 'advanced': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch(difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">PolyCore</h1>
              </div>
              <div className="hidden md:flex text-sm text-slate-600">
                Language Learning Platform
              </div>
            </div>
            
            {/* User Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-slate-700">{points}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium text-slate-700">{streak} days</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-slate-700">{wordsLearned} words</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-slate-700">{userLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* YouTube URL Input */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <ExternalLink className="h-5 w-5 mr-2 text-blue-600" />
              🚀 Load Any YouTube Video
            </h2>
            <div className="flex space-x-3">
              <input
                type="url"
                placeholder="Paste YouTube URL here..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={loadVideo}
                disabled={isLoading || !videoUrl}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Loading...' : 'Load Video'}
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              ✨ Supports any YouTube video with automatic transcription and translation
            </p>
          </div>
        </div>

        {/* Demo Videos */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-600" />
              🎯 Try These Videos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoVideos.map((video, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="w-16 h-12 bg-slate-200 rounded flex items-center justify-center">
                    <Play className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm">{video.title}</h4>
                    <p className="text-xs text-slate-600">by {video.author}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyBadge(video.level.toLowerCase())}`}>
                        {video.level}
                      </span>
                      <span className="text-xs text-slate-500">{video.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Side by Side Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Video Player */}
          <div className="space-y-6">
            {/* Video Player */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="aspect-video bg-black relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      setDuration(videoRef.current.duration);
                    }
                  }}
                  poster="/api/placeholder/640/360"
                >
                  <source src="/api/placeholder/video" type="video/mp4" />
                </video>
                
                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={togglePlayPause}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      {isPlaying ? 
                        <Pause className="h-5 w-5 text-white" /> : 
                        <Play className="h-5 w-5 text-white" />
                      }
                    </button>
                    
                    <div className="flex-1">
                      <div className="relative">
                        <div className="h-1 bg-white/30 rounded-full">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-white text-sm font-medium">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-slate-600" />
                ⚙️ Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Font Size</label>
                  <select 
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={14}>14px</option>
                    <option value={16}>16px</option>
                    <option value={18}>18px</option>
                    <option value={20}>20px</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Primary Language</label>
                  <select 
                    value={primaryLang} 
                    onChange={(e) => setPrimaryLang(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Language</label>
                  <select 
                    value={secondaryLang} 
                    onChange={(e) => setSecondaryLang(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Spanish">Spanish</option>
                    <option value="English">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Playback Speed</label>
                  <div className="flex flex-wrap gap-2">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          playbackSpeed === speed 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Transcript */}
          <div className="space-y-6">
            {/* Transcript */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[600px] flex flex-col">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Subtitles className="h-5 w-5 mr-2 text-blue-600" />
                  Interactive Transcript
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Click on any sentence to jump to that moment
                </p>
              </div>
              
              <div 
                ref={transcriptRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                {transcript.map((sentence, index) => (
                  <div
                    key={index}
                    onClick={() => handleSentenceClick(sentence, index)}
                    className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:bg-slate-50 ${
                      selectedSentence === index
                        ? 'border-l-blue-500 bg-blue-50'
                        : 'border-l-transparent hover:border-l-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium">
                        {formatTime(sentence.start)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyBadge(sentence.difficulty)}`}>
                        {sentence.difficulty}
                      </span>
                    </div>
                    
                    <p 
                      className="text-slate-900 mb-2 leading-relaxed"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {sentence.text.split(' ').map((word, wordIndex) => (
                        <span
                          key={wordIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWordClick(word);
                          }}
                          className="hover:bg-yellow-200 hover:cursor-pointer px-0.5 rounded transition-colors"
                        >
                          {word}{' '}
                        </span>
                      ))}
                    </p>
                    
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {sentence.translation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Words */}
            {savedWords.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  Saved Words ({savedWords.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {savedWords.map((word, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageReactorClone;
