import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Supabase 클라이언트 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 클라이언트 생성
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})

// 클라우드 동기화 활성화 여부 확인
export const isCloudSyncEnabled = () => {
  // 일단 비활성화
  return false
  // return (
  //   import.meta.env.VITE_ENABLE_CLOUD_SYNC === 'true' &&
  //   supabaseUrl &&
  //   supabaseAnonKey
  // )
}

// 현재 사용자 가져오기
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

// 세션 확인
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return session
}