// Time utility functions for testing
export const timeUtils = {
  /**
   * Convert minutes to seconds
   */
  minutesToSeconds: (minutes: number): number => minutes * 60,

  /**
   * Convert seconds to minutes
   */
  secondsToMinutes: (seconds: number): number => Math.floor(seconds / 60),

  /**
   * Format duration in MM:SS format
   */
  formatDuration: (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  /**
   * Calculate percentage progress
   */
  calculateProgress: (total: number, remaining: number): number => {
    if (total <= 0) return 0
    return Math.max(0, Math.min(100, ((total - remaining) / total) * 100))
  },

  /**
   * Check if date is today
   */
  isToday: (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  },

  /**
   * Get start of day
   */
  getStartOfDay: (date: Date): Date => {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    return start
  },

  /**
   * Get end of day
   */
  getEndOfDay: (date: Date): Date => {
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    return end
  },

  /**
   * Get week start (Monday)
   */
  getWeekStart: (date: Date): Date => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return start
  },

  /**
   * Add days to date
   */
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  },

  /**
   * Calculate days between dates
   */
  daysBetween: (date1: Date, date2: Date): number => {
    const oneDay = 24 * 60 * 60 * 1000
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay))
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime: (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return '방금 전'
    if (diffMinutes < 60) return `${diffMinutes}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR')
  },

  /**
   * Parse duration string (e.g., "1h 30m" -> 90 minutes)
   */
  parseDuration: (duration: string): number => {
    const hourMatch = duration.match(/(\d+)h/)
    const minuteMatch = duration.match(/(\d+)m/)
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0
    
    return hours * 60 + minutes
  },

  /**
   * Format duration as human readable string
   */
  formatDurationHuman: (minutes: number): string => {
    if (minutes < 60) return `${minutes}분`
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes === 0) return `${hours}시간`
    return `${hours}시간 ${remainingMinutes}분`
  }
}

describe('timeUtils', () => {
  describe('time conversion', () => {
    it('should convert minutes to seconds', () => {
      expect(timeUtils.minutesToSeconds(1)).toBe(60)
      expect(timeUtils.minutesToSeconds(5)).toBe(300)
      expect(timeUtils.minutesToSeconds(0)).toBe(0)
      expect(timeUtils.minutesToSeconds(0.5)).toBe(30)
    })

    it('should convert seconds to minutes', () => {
      expect(timeUtils.secondsToMinutes(60)).toBe(1)
      expect(timeUtils.secondsToMinutes(300)).toBe(5)
      expect(timeUtils.secondsToMinutes(0)).toBe(0)
      expect(timeUtils.secondsToMinutes(90)).toBe(1) // Floor division
      expect(timeUtils.secondsToMinutes(59)).toBe(0)
    })
  })

  describe('duration formatting', () => {
    it('should format duration in MM:SS format', () => {
      expect(timeUtils.formatDuration(0)).toBe('00:00')
      expect(timeUtils.formatDuration(59)).toBe('00:59')
      expect(timeUtils.formatDuration(60)).toBe('01:00')
      expect(timeUtils.formatDuration(125)).toBe('02:05')
      expect(timeUtils.formatDuration(3661)).toBe('61:01')
    })

    it('should format duration as human readable', () => {
      expect(timeUtils.formatDurationHuman(30)).toBe('30분')
      expect(timeUtils.formatDurationHuman(60)).toBe('1시간')
      expect(timeUtils.formatDurationHuman(90)).toBe('1시간 30분')
      expect(timeUtils.formatDurationHuman(120)).toBe('2시간')
      expect(timeUtils.formatDurationHuman(0)).toBe('0분')
    })

    it('should parse duration strings', () => {
      expect(timeUtils.parseDuration('1h')).toBe(60)
      expect(timeUtils.parseDuration('30m')).toBe(30)
      expect(timeUtils.parseDuration('1h 30m')).toBe(90)
      expect(timeUtils.parseDuration('2h 15m')).toBe(135)
      expect(timeUtils.parseDuration('45m')).toBe(45)
      expect(timeUtils.parseDuration('invalid')).toBe(0)
    })
  })

  describe('progress calculation', () => {
    it('should calculate progress percentage', () => {
      expect(timeUtils.calculateProgress(100, 75)).toBe(25)
      expect(timeUtils.calculateProgress(100, 0)).toBe(100)
      expect(timeUtils.calculateProgress(100, 100)).toBe(0)
      expect(timeUtils.calculateProgress(0, 0)).toBe(0)
    })

    it('should handle edge cases in progress calculation', () => {
      expect(timeUtils.calculateProgress(100, 150)).toBe(0) // Negative progress becomes 0
      expect(timeUtils.calculateProgress(100, -50)).toBe(100) // Over 100% becomes 100
      expect(timeUtils.calculateProgress(-100, 50)).toBe(0) // Negative total
    })
  })

  describe('date utilities', () => {
    const testDate = new Date('2024-01-15T14:30:00') // Monday

    it('should check if date is today', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      expect(timeUtils.isToday(today)).toBe(true)
      expect(timeUtils.isToday(yesterday)).toBe(false)
    })

    it('should get start of day', () => {
      const start = timeUtils.getStartOfDay(testDate)
      
      expect(start.getHours()).toBe(0)
      expect(start.getMinutes()).toBe(0)
      expect(start.getSeconds()).toBe(0)
      expect(start.getMilliseconds()).toBe(0)
      expect(start.getDate()).toBe(testDate.getDate())
    })

    it('should get end of day', () => {
      const end = timeUtils.getEndOfDay(testDate)
      
      expect(end.getHours()).toBe(23)
      expect(end.getMinutes()).toBe(59)
      expect(end.getSeconds()).toBe(59)
      expect(end.getMilliseconds()).toBe(999)
      expect(end.getDate()).toBe(testDate.getDate())
    })

    it('should get week start (Monday)', () => {
      const weekStart = timeUtils.getWeekStart(testDate)
      
      expect(weekStart.getDay()).toBe(1) // Monday
      expect(weekStart.getHours()).toBe(0)
      expect(weekStart.getMinutes()).toBe(0)
    })

    it('should handle Sunday correctly for week start', () => {
      const sunday = new Date('2024-01-14T14:30:00') // Sunday
      const weekStart = timeUtils.getWeekStart(sunday)
      
      expect(weekStart.getDay()).toBe(1) // Should be Monday
      expect(weekStart.getDate()).toBe(8) // Previous Monday
    })

    it('should add days to date', () => {
      const tomorrow = timeUtils.addDays(testDate, 1)
      const lastWeek = timeUtils.addDays(testDate, -7)
      
      expect(tomorrow.getDate()).toBe(16)
      expect(lastWeek.getDate()).toBe(8)
    })

    it('should calculate days between dates', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-05')
      const date3 = new Date('2023-12-28')
      
      expect(timeUtils.daysBetween(date1, date2)).toBe(4)
      expect(timeUtils.daysBetween(date2, date1)).toBe(4) // Absolute value
      expect(timeUtils.daysBetween(date1, date3)).toBe(4)
    })
  })

  describe('relative time formatting', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T14:30:00'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should format recent times', () => {
      const now = new Date('2024-01-15T14:30:00')
      const oneMinuteAgo = new Date('2024-01-15T14:29:00')
      const oneHourAgo = new Date('2024-01-15T13:30:00')
      const oneDayAgo = new Date('2024-01-14T14:30:00')
      const oneWeekAgo = new Date('2024-01-08T14:30:00')

      expect(timeUtils.formatRelativeTime(now)).toBe('방금 전')
      expect(timeUtils.formatRelativeTime(oneMinuteAgo)).toBe('1분 전')
      expect(timeUtils.formatRelativeTime(oneHourAgo)).toBe('1시간 전')
      expect(timeUtils.formatRelativeTime(oneDayAgo)).toBe('1일 전')
      expect(timeUtils.formatRelativeTime(oneWeekAgo)).toContain('2024')
    })

    it('should handle edge cases in relative time', () => {
      const thirtySecondsAgo = new Date('2024-01-15T14:29:30')
      const twoHoursAgo = new Date('2024-01-15T12:30:00')
      const sixDaysAgo = new Date('2024-01-09T14:30:00')

      expect(timeUtils.formatRelativeTime(thirtySecondsAgo)).toBe('방금 전')
      expect(timeUtils.formatRelativeTime(twoHoursAgo)).toBe('2시간 전')
      expect(timeUtils.formatRelativeTime(sixDaysAgo)).toBe('6일 전')
    })
  })
})