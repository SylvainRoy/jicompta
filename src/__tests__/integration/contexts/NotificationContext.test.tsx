import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { NotificationProvider, useNotification } from '@/contexts/NotificationContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
)

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('throws when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = (e: Event) => e.preventDefault()
    window.addEventListener('error', onError)
    expect(() => renderHook(() => useNotification())).toThrow(
      'useNotification must be used within a NotificationProvider'
    )
    window.removeEventListener('error', onError)
    spy.mockRestore()
  })

  it('starts with empty notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    expect(result.current.notifications).toEqual([])
  })

  it('success() adds a success notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => { result.current.success('Operation succeeded') })
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].type).toBe('success')
    expect(result.current.notifications[0].message).toBe('Operation succeeded')
  })

  it('error() adds an error notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => { result.current.error('Something failed') })
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].type).toBe('error')
    expect(result.current.notifications[0].message).toBe('Something failed')
  })

  it('warning() adds a warning notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => { result.current.warning('Be careful') })
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].type).toBe('warning')
  })

  it('info() adds an info notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => { result.current.info('FYI') })
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].type).toBe('info')
  })

  it('addNotification returns a unique id', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    let id1: string, id2: string
    act(() => { id1 = result.current.addNotification('info', 'first', 0) })
    act(() => { id2 = result.current.addNotification('info', 'second', 0) })
    expect(id1!).toBeTruthy()
    expect(id2!).toBeTruthy()
    expect(id1!).not.toBe(id2!)
  })

  it('removeNotification removes a specific notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    let id: string
    act(() => { id = result.current.addNotification('info', 'test', 0) })
    expect(result.current.notifications).toHaveLength(1)
    act(() => { result.current.removeNotification(id!) })
    expect(result.current.notifications).toHaveLength(0)
  })

  it('auto-dismisses success notifications after 3 seconds', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => { result.current.success('test') })
    expect(result.current.notifications).toHaveLength(1)
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.notifications).toHaveLength(0)
  })

  it('auto-dismisses error notifications after 5 seconds', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => { result.current.error('test error') })
    expect(result.current.notifications).toHaveLength(1)
    act(() => { vi.advanceTimersByTime(4999) })
    expect(result.current.notifications).toHaveLength(1)
    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current.notifications).toHaveLength(0)
  })

  it('persistent info notification does not auto-dismiss', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => { result.current.info('persistent', true) })
    expect(result.current.notifications).toHaveLength(1)
    act(() => { vi.advanceTimersByTime(60000) })
    expect(result.current.notifications).toHaveLength(1)
  })

  it('can stack multiple notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => {
      result.current.success('first')
      result.current.error('second')
      result.current.warning('third')
    })
    expect(result.current.notifications).toHaveLength(3)
    expect(result.current.notifications[0].type).toBe('success')
    expect(result.current.notifications[1].type).toBe('error')
    expect(result.current.notifications[2].type).toBe('warning')
  })
})
