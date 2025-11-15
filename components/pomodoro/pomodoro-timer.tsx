'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

type SessionType = 'focus' | 'short_break' | 'long_break'

const SESSION_DURATIONS = {
  focus: 25 * 60, // 25 minutes
  short_break: 5 * 60, // 5 minutes
  long_break: 15 * 60, // 15 minutes
}

const SESSION_LABELS = {
  focus: 'Focus Time',
  short_break: 'Short Break',
  long_break: 'Long Break',
}

export function PomodoroTimer({
  roomId,
  userId,
}: {
  roomId: string
  userId: string
}) {
  const [sessionType, setSessionType] = useState<SessionType>('focus')
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATIONS.focus)
  const [isRunning, setIsRunning] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

  const progress =
    ((SESSION_DURATIONS[sessionType] - timeRemaining) /
      SESSION_DURATIONS[sessionType]) *
    100

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startSession = async () => {
    const supabase = getSupabaseBrowserClient()
    sessionStartRef.current = new Date()

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: userId,
        room_id: roomId,
        session_type: sessionType,
        started_at: sessionStartRef.current.toISOString(),
      })
      .select()
      .single()

    if (!error && data) {
      setCurrentSessionId(data.id)
    }

    setIsRunning(true)
  }

  const pauseSession = () => {
    setIsRunning(false)
  }

  const resetSession = () => {
    setIsRunning(false)
    setTimeRemaining(SESSION_DURATIONS[sessionType])
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const completeSession = async () => {
    if (!currentSessionId || !sessionStartRef.current) return

    const supabase = getSupabaseBrowserClient()
    const endTime = new Date()
    const duration = Math.floor(
      (endTime.getTime() - sessionStartRef.current.getTime()) / 1000 / 60
    )

    await supabase
      .from('focus_sessions')
      .update({
        ended_at: endTime.toISOString(),
        duration_minutes: duration,
        pomodoro_count: sessionType === 'focus' ? 1 : 0,
      })
      .eq('id', currentSessionId)

    if (sessionType === 'focus') {
      const newCount = pomodoroCount + 1
      setPomodoroCount(newCount)

      // Auto-switch to break
      if (newCount % 4 === 0) {
        setSessionType('long_break')
        setTimeRemaining(SESSION_DURATIONS.long_break)
      } else {
        setSessionType('short_break')
        setTimeRemaining(SESSION_DURATIONS.short_break)
      }
    } else {
      // Break complete, back to focus
      setSessionType('focus')
      setTimeRemaining(SESSION_DURATIONS.focus)
    }

    setIsRunning(false)
    setCurrentSessionId(null)
  }

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            completeSession()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeRemaining])

  const handleSessionTypeChange = (type: SessionType) => {
    resetSession()
    setSessionType(type)
    setTimeRemaining(SESSION_DURATIONS[type])
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pomodoro Timer</CardTitle>
          <Badge variant="secondary">
            {pomodoroCount} Pomodoro{pomodoroCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center gap-2">
          <Button
            variant={sessionType === 'focus' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSessionTypeChange('focus')}
            disabled={isRunning}
          >
            Focus
          </Button>
          <Button
            variant={sessionType === 'short_break' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSessionTypeChange('short_break')}
            disabled={isRunning}
          >
            Short Break
          </Button>
          <Button
            variant={sessionType === 'long_break' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSessionTypeChange('long_break')}
            disabled={isRunning}
          >
            Long Break
          </Button>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {SESSION_LABELS[sessionType]}
            </p>
            <p className="text-6xl font-bold tabular-nums tracking-tight">
              {formatTime(timeRemaining)}
            </p>
          </div>

          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex justify-center gap-2">
          {!isRunning ? (
            <>
              <Button onClick={startSession} size="lg" className="w-32">
                Start
              </Button>
              {timeRemaining !== SESSION_DURATIONS[sessionType] && (
                <Button onClick={resetSession} variant="outline" size="lg">
                  Reset
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={pauseSession} variant="outline" size="lg" className="w-32">
                Pause
              </Button>
              <Button onClick={resetSession} variant="destructive" size="lg">
                Stop
              </Button>
            </>
          )}
        </div>

        <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
          {sessionType === 'focus'
            ? 'Stay focused! Complete 4 pomodoros for a long break.'
            : 'Take a break and recharge your energy.'}
        </div>
      </CardContent>
    </Card>
  )
}
