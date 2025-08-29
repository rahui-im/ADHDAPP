import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock crypto.randomUUID for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
  },
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock Notification API
global.Notification = {
  requestPermission: vi.fn(() => Promise.resolve('granted')),
  permission: 'granted',
} as any

// Mock window.alert, confirm, prompt
global.alert = vi.fn()
global.confirm = vi.fn(() => true)
global.prompt = vi.fn(() => 'test')

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0)
}

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id)
}

// Mock performance.now
global.performance.now = vi.fn(() => Date.now())

// Suppress console errors in tests unless explicitly needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
})