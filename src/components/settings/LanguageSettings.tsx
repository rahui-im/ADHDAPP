import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { changeLanguage, getCurrentLanguage, supportedLanguages } from '../../i18n'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { 
  CheckIcon,
  GlobeAltIcon,
  LanguageIcon
} from '@heroicons/react/24/outline'

interface LanguageSettingsProps {
  onClose?: () => void
}

export const LanguageSettings: React.FC<LanguageSettingsProps> = ({ onClose }) => {
  const { t } = useTranslation()
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage())
  const [isChanging, setIsChanging] = useState(false)

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLang) return

    setIsChanging(true)
    
    try {
      await changeLanguage(languageCode)
      setCurrentLang(languageCode)
      
      // 성공 메시지 표시
      setTimeout(() => {
        alert(t('settings.language.changeSuccess'))
      }, 100)
      
    } catch (error) {
      console.error('언어 변경 실패:', error)
      alert('언어 변경에 실패했습니다.')
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <GlobeAltIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('settings.language.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('settings.language.description')}
            </p>
          </div>
        </div>

        {/* 현재 언어 표시 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <LanguageIcon className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                현재 언어 / Current Language
              </p>
              <p className="text-sm text-blue-700">
                {supportedLanguages.find(lang => lang.code === currentLang)?.nativeName || currentLang}
              </p>
            </div>
          </div>
        </div>

        {/* 언어 선택 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            언어 선택 / Select Language
          </h4>
          
          {supportedLanguages.map((language) => (
            <div
              key={language.code}
              className={`relative flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                currentLang === language.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{language.flag}</div>
                <div>
                  <p className="font-medium text-gray-900">
                    {language.nativeName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {language.name}
                  </p>
                </div>
              </div>

              {currentLang === language.code && (
                <div className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    선택됨 / Selected
                  </span>
                </div>
              )}

              {isChanging && currentLang !== language.code && (
                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 언어별 기능 안내 */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          언어별 기능 / Language Features
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckIcon className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h5 className="font-medium text-gray-900">
                한국어 (Korean)
              </h5>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li>• 완전한 번역 지원</li>
                <li>• ADHD 친화적 격려 메시지</li>
                <li>• 한국 문화에 맞는 시간 표기</li>
                <li>• 자연스러운 문장 구조</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h5 className="font-medium text-gray-900">
                English
              </h5>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li>• Full translation support</li>
                <li>• ADHD-friendly encouraging messages</li>
                <li>• International time format</li>
                <li>• Natural sentence structure</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* 추가 언어 지원 안내 */}
      <Card className="p-6 border-yellow-200 bg-yellow-50">
        <div className="flex items-start space-x-3">
          <GlobeAltIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-900">
              더 많은 언어 지원 예정 / More Languages Coming Soon
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              일본어, 중국어, 스페인어 등 추가 언어 지원을 준비 중입니다. 
              원하시는 언어가 있으시면 설정에서 피드백을 보내주세요.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              We're preparing support for Japanese, Chinese, Spanish, and more languages. 
              Please send feedback if you have a language preference.
            </p>
          </div>
        </div>
      </Card>

      {/* 주의사항 */}
      <Card className="p-6 border-gray-200 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-2">
          언어 변경 시 주의사항 / Language Change Notes
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 언어 변경 후 일부 페이지는 새로고침이 필요할 수 있습니다</li>
          <li>• 사용자 데이터(작업, 설정 등)는 언어와 관계없이 보존됩니다</li>
          <li>• Some pages may require refresh after language change</li>
          <li>• User data (tasks, settings, etc.) is preserved regardless of language</li>
        </ul>
      </Card>

      {/* 닫기 버튼 */}
      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            {t('app.close')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default LanguageSettings