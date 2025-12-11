'use client'

import { useState, useEffect } from 'react'
import { formatDate, formatDateTime } from '@/lib/utils'

interface Event {
  id: string
  title: string
  description?: string
  type: string
  location?: string
  startDate: string
  endDate?: string
  maxAttendees?: number
  isTicketed: boolean
  ticketPrice?: number
  imageUrl?: string
  userRegistration?: {
    status: string
    ticketNumber?: string
  } | null
  availableSpots?: number | null
  _count: {
    registrations: number
    attendances: number
  }
}

export default function EventCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [registering, setRegistering] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
  }, [currentDate, view])

  const loadEvents = async () => {
    try {
      const start = new Date(currentDate)
      const end = new Date(currentDate)

      if (view === 'month') {
        start.setDate(1)
        end.setMonth(end.getMonth() + 1)
        end.setDate(0)
      } else if (view === 'week') {
        const day = start.getDay()
        start.setDate(start.getDate() - day)
        end.setDate(start.getDate() + 6)
      } else {
        end.setDate(start.getDate() + 1)
      }

      const response = await fetch(
        `/api/events?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      )
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId: string) => {
    setRegistering(eventId)
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Registration failed')
        return
      }

      loadEvents()
      alert('Successfully registered!')
    } catch (error) {
      console.error('Error registering:', error)
      alert('Registration failed')
    } finally {
      setRegistering(null)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const getDaysInView = () => {
    const days: Date[] = []
    const start = new Date(currentDate)

    if (view === 'month') {
      start.setDate(1)
      const firstDay = start.getDay()
      start.setDate(start.getDate() - firstDay)

      for (let i = 0; i < 42; i++) {
        const day = new Date(start)
        day.setDate(start.getDate() + i)
        days.push(day)
      }
    } else if (view === 'week') {
      const day = start.getDay()
      start.setDate(start.getDate() - day)

      for (let i = 0; i < 7; i++) {
        const day = new Date(start)
        day.setDate(start.getDate() + i)
        days.push(day)
      }
    } else {
      days.push(new Date(currentDate))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Event Calendar</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-lg ${
              view === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-lg ${
              view === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-4 py-2 rounded-lg ${
              view === 'day'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigateDate('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ←
        </button>
        <h2 className="text-2xl font-semibold">
          {view === 'month'
            ? currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })
            : view === 'week'
            ? `Week of ${formatDate(currentDate)}`
            : formatDate(currentDate)}
        </h2>
        <button
          onClick={() => navigateDate('next')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {view === 'month' && (
          <div className="grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-4 bg-gray-50 font-semibold text-center border-b"
              >
                {day}
              </div>
            ))}
            {getDaysInView().map((day, idx) => {
              const dayEvents = getEventsForDate(day)
              const isCurrentMonth =
                day.getMonth() === currentDate.getMonth()
              return (
                <div
                  key={idx}
                  className={`min-h-24 p-2 border-b border-r ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div
                    className={`text-sm mb-1 ${
                      day.toDateString() === new Date().toDateString()
                        ? 'font-bold text-primary-600'
                        : ''
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="text-xs bg-primary-100 text-primary-800 p-1 rounded cursor-pointer hover:bg-primary-200 truncate"
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {(view === 'week' || view === 'day') && (
          <div className="divide-y">
            {getDaysInView().map((day, idx) => {
              const dayEvents = getEventsForDate(day)
              return (
                <div key={idx} className="p-4">
                  <div className="font-semibold mb-4">
                    {day.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="space-y-4">
                    {dayEvents.length === 0 ? (
                      <p className="text-gray-500 text-sm">No events</p>
                    ) : (
                      dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <h3 className="font-semibold text-lg mb-2">
                            {event.title}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span>🕐</span>
                              {formatDateTime(event.startDate)}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <span>📍</span>
                                {event.location}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span>👥</span>
                              {event._count.registrations} registered
                              {event.maxAttendees &&
                                ` / ${event.maxAttendees} max`}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {selectedEvent.description && (
                <p className="text-gray-700 mb-4">{selectedEvent.description}</p>
              )}

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">🕐</span>
                  <span>{formatDateTime(selectedEvent.startDate)}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📍</span>
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">👥</span>
                  <span>
                    {selectedEvent._count.registrations} registered
                    {selectedEvent.maxAttendees &&
                      ` / ${selectedEvent.maxAttendees} max`}
                  </span>
                </div>
                {selectedEvent.isTicketed && selectedEvent.ticketPrice && (
                  <div className="text-lg font-semibold">
                    ${selectedEvent.ticketPrice} per ticket
                  </div>
                )}
              </div>

              {selectedEvent.userRegistration ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">
                    ✓ You are registered
                  </p>
                  {selectedEvent.userRegistration.ticketNumber && (
                    <p className="text-sm text-green-700">
                      Ticket: {selectedEvent.userRegistration.ticketNumber}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleRegister(selectedEvent.id)}
                  disabled={
                    registering === selectedEvent.id ||
                    (selectedEvent.availableSpots !== null &&
                      selectedEvent.availableSpots !== undefined &&
                      selectedEvent.availableSpots <= 0)
                  }
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering === selectedEvent.id
                    ? 'Registering...'
                    : selectedEvent.availableSpots === 0
                    ? 'Event Full'
                    : 'Register for Event'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

