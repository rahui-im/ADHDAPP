import React from 'react'

// 기본 아이콘 Props 인터페이스
interface IconProps {
  className?: string
  size?: number
}

// Plus 아이콘
export const PlusIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

// Pencil 아이콘 (편집)
export const PencilIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

// Trash 아이콘 (삭제)
export const TrashIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

// Play 아이콘 (시작)
export const PlayIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// Pause 아이콘 (일시정지)
export const PauseIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// Stop 아이콘 (정지)
export const StopIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
  </svg>
)

// Check 아이콘 (완료)
export const CheckIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

// Clock 아이콘 (시간)
export const ClockIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// Settings 아이콘 (설정)
export const SettingsIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

// X 아이콘 (닫기)
export const XIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// Menu 아이콘 (햄버거 메뉴)
export const MenuIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

// Focus 아이콘 (집중)
export const FocusIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

// Sun 아이콘 (라이트 모드)
export const SunIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591" />
  </svg>
)

// Moon 아이콘 (다크 모드)
export const MoonIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
)

// Desktop 아이콘 (시스템 설정)
export const DesktopIcon: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
  </svg>
)

export default {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  CheckIcon,
  ClockIcon,
  SettingsIcon,
  XIcon,
  MenuIcon,
  FocusIcon,
  SunIcon,
  MoonIcon,
  DesktopIcon,
}