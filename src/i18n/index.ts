import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 번역 리소스 import
import koTranslations from './locales/ko.json'
import enTranslations from './locales/en.json'

const resources = {
  ko: {
    translation: koTranslations
  },
  en: {
    translation: enTranslations
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'adhd-timer-language'
    },

    // ADHD 친화적 설정
    returnEmptyString: false,
    returnNull: false,
    
    // 네임스페이스 설정
    defaultNS: 'translation',
    ns: ['translation'],
    
    // 키 분리자 설정
    keySeparator: '.',
    nsSeparator: ':',
    
    // 복수형 처리
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // 로딩 설정
    load: 'languageOnly',
    preload: ['ko', 'en'],
    
    // 업데이트 설정
    updateMissing: process.env.NODE_ENV === 'development',
    saveMissing: process.env.NODE_ENV === 'development',
    
    // 포맷팅 함수
    postProcess: ['interval'],
    
    // React 특화 설정
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span']
    }
  })

export default i18n

// 언어 변경 유틸리티
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng)
  localStorage.setItem('adhd-timer-language', lng)
  
  // HTML lang 속성 업데이트
  document.documentElement.lang = lng
  
  // 방향성 설정 (RTL 언어 지원 준비)
  const isRTL = ['ar', 'he', 'fa'].includes(lng)
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
}

// 현재 언어 가져오기
export const getCurrentLanguage = () => i18n.language || 'ko'

// 지원 언어 목록
export const supportedLanguages = [
  { code: 'ko', name: '한국어', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' }
]

// 언어별 날짜 포맷터
export const getDateFormatter = (lng?: string) => {
  const language = lng || getCurrentLanguage()
  
  return {
    date: new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: new Intl.DateTimeFormat(language, {
      hour: '2-digit',
      minute: '2-digit'
    }),
    datetime: new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    relative: new Intl.RelativeTimeFormat(language, {
      numeric: 'auto'
    })
  }
}

// 언어별 숫자 포맷터
export const getNumberFormatter = (lng?: string) => {
  const language = lng || getCurrentLanguage()
  
  return {
    integer: new Intl.NumberFormat(language),
    decimal: new Intl.NumberFormat(language, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }),
    percent: new Intl.NumberFormat(language, {
      style: 'percent'
    }),
    duration: (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      
      if (language === 'ko') {
        if (hours > 0) {
          return `${hours}시간 ${mins}분`
        }
        return `${mins}분`
      } else {
        if (hours > 0) {
          return `${hours}h ${mins}m`
        }
        return `${mins}m`
      }
    }
  }
}