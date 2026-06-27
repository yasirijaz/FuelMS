import '@testing-library/react'

// Silence console.error in tests unless it's a genuine failure
const originalError = console.error.bind(console)
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React prop-type and act() warnings in tests
    const msg = String(args[0])
    if (msg.includes('Warning:') || msg.includes('act(')) return
    originalError(...args)
  }
})
afterAll(() => {
  console.error = originalError
})
