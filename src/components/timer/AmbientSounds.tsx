import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
  CloudIcon,
  FireIcon,
  BeakerIcon,
  SparklesIcon,
  HeartIcon,
  MoonIcon
} from '@heroicons/react/24/outline'
import { Card } from '../ui/Card'
import toast from 'react-hot-toast'

interface Sound {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  audioUrl?: string
  description: string
}

const AVAILABLE_SOUNDS: Sound[] = [
  {
    id: 'white-noise',
    name: '백색 소음',
    icon: <SpeakerWaveIcon className="w-6 h-6" />,
    color: 'bg-gray-500',
    description: '집중력 향상에 도움이 되는 일정한 주파수의 소음'
  },
  {
    id: 'rain',
    name: '빗소리',
    icon: <CloudIcon className="w-6 h-6" />,
    color: 'bg-blue-500',
    description: '편안한 빗소리로 마음을 진정시키세요'
  },
  {
    id: 'fire',
    name: '모닥불',
    icon: <FireIcon className="w-6 h-6" />,
    color: 'bg-orange-500',
    description: '따뜻한 모닥불 소리로 아늑한 분위기를'
  },
  {
    id: 'waves',
    name: '파도 소리',
    icon: <BeakerIcon className="w-6 h-6" />,
    color: 'bg-cyan-500',
    description: '해변의 파도 소리로 스트레스 해소'
  },
  {
    id: 'forest',
    name: '숲 소리',
    icon: <SparklesIcon className="w-6 h-6" />,
    color: 'bg-green-500',
    description: '새소리와 바람소리가 어우러진 자연의 소리'
  },
  {
    id: 'meditation',
    name: '명상 음악',
    icon: <HeartIcon className="w-6 h-6" />,
    color: 'bg-purple-500',
    description: '깊은 집중과 명상을 위한 잔잔한 음악'
  },
  {
    id: 'night',
    name: '밤 소리',
    icon: <MoonIcon className="w-6 h-6" />,
    color: 'bg-indigo-500',
    description: '귀뚜라미와 부엉이 소리가 들리는 고요한 밤'
  }
]

export const AmbientSounds: React.FC = () => {
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  const handleSoundSelect = (soundId: string) => {
    if (selectedSound === soundId) {
      // 같은 소리를 다시 클릭하면 정지
      handleStop()
    } else {
      setSelectedSound(soundId)
      setIsPlaying(true)
      
      // 실제로는 여기서 오디오를 로드하고 재생
      // audioRef.current?.load()
      // audioRef.current?.play()
      
      const sound = AVAILABLE_SOUNDS.find(s => s.id === soundId)
      toast.success(`${sound?.name} 재생 중...`)
    }
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      audioRef.current?.play()
      setIsPlaying(true)
    }
  }

  const handleStop = () => {
    audioRef.current?.pause()
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setSelectedSound(null)
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="space-y-6">
      {/* 사운드 선택 그리드 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">앰비언트 사운드</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {AVAILABLE_SOUNDS.map((sound) => (
            <motion.button
              key={sound.id}
              onClick={() => handleSoundSelect(sound.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                selectedSound === sound.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`${sound.color} p-3 rounded-lg text-white mb-2 mx-auto w-fit`}>
                {sound.icon}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {sound.name}
              </p>
              {selectedSound === sound.id && isPlaying && (
                <motion.div
                  className="absolute top-2 right-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 재생 컨트롤 */}
      <AnimatePresence>
        {selectedSound && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {AVAILABLE_SOUNDS.find(s => s.id === selectedSound)?.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {AVAILABLE_SOUNDS.find(s => s.id === selectedSound)?.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePlayPause}
                    className="p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600"
                  >
                    {isPlaying ? (
                      <PauseIcon className="w-5 h-5" />
                    ) : (
                      <PlayIcon className="w-5 h-5" />
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleStop}
                    className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    <SpeakerXMarkIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* 볼륨 컨트롤 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">볼륨</span>
                  <button
                    onClick={handleMuteToggle}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {isMuted ? (
                      <SpeakerXMarkIcon className="w-5 h-5" />
                    ) : (
                      <SpeakerWaveIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    style={{
                      background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${volume}%, rgb(229 231 235) ${volume}%, rgb(229 231 235) 100%)`
                    }}
                  />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 pointer-events-none">
                    {volume}%
                  </span>
                </div>
              </div>

              {/* 타이머 통합 */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 팁: 타이머와 함께 사용하면 집중력이 더욱 향상됩니다!
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 숨겨진 오디오 엘리먼트 */}
      <audio
        ref={audioRef}
        loop
        // src={selectedSound ? `/sounds/${selectedSound}.mp3` : undefined}
      />
    </div>
  )
}

export default AmbientSounds