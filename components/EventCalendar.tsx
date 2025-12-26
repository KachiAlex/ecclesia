'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'

interface Event {
  id: string
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  location?: string
  type?: string
  reminderConfig?: {
    durationHours: number
    frequencyMinutes: number
    message?: string
  }
}

interface EventFormState {
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  type: string
  isRecurring: boolean
  recurrencePattern: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  recurrenceEndDate: string
  reminderEnabled: boolean
  reminderDurationHours: number
  reminderFrequencyMinutes: number
  reminderMessage: string
}

const createDefaultEventState = (): EventFormState => ({
  title: '',
  description: '',
  startTime: '09:00',
  endTime: '10:00',
  location: '',
  type: 'SERVICE',
  isRecurring: false,
  recurrencePattern: 'WEEKLY',
  recurrenceEndDate: '',
  reminderEnabled: false,
  reminderDurationHours: 1,
  reminderFrequencyMinutes: 15,
  reminderMessage: '',
})

const HOURS_IN_DAY = Array.from({ length: 24 }, (_, hour) => hour)

const padTimeUnit = (value: number) => value.toString().padStart(2, '0')

const getSlotRange = (hour: number) => {
  const startHour = Math.max(0, Math.min(23, hour))
  const startTime = `${padTimeUnit(startHour)}:00`
  let endHour = startHour + 1
  let endMinutes = '00'

  if (endHour >= 24) {
    endHour = 23
    endMinutes = '59'
  }

  const endTime = `${padTimeUnit(endHour)}:${endMinutes}`

  return { startTime, endTime }
}

const formatHourLabel = (hour: number) => {
  const date = new Date()
  date.setHours(hour, 0, 0, 0)
  return date.toLocaleTimeString([], { hour: 'numeric' })
}

const timeToMinutes = (time?: string) => {
  if (!time) return 0
  const [hours, minutes] = time.split(':').map((value) => parseInt(value, 10))
  return hours * 60 + (minutes || 0)
}

const doesEventOverlapHour = (event: Event, hour: number) => {
  const eventStart = timeToMinutes(event.startTime)
  let eventEnd = timeToMinutes(event.endTime)

  if (eventEnd <= eventStart) {
    eventEnd = eventStart + 60
  }

  const hourStart = hour * 60
  const hourEnd = hour === 23 ? 24 * 60 : (hour + 1) * 60

  return eventStart < hourEnd && eventEnd > hourStart
}

interface EventsCalendarProps {
  isAdmin?: boolean
}

export default function EventsCalendar({ isAdmin = false }: EventsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showDayPlanner, setShowDayPlanner] = useState(false)
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [shouldReturnToDayPlanner, setShouldReturnToDayPlanner] = useState(false)

  // New event form
  const [newEvent, setNewEvent] = useState<EventFormState>(createDefaultEventState())

  const closeEventForm = () => {
    setShowCreateEvent(false)
    if (shouldReturnToDayPlanner) {
      setShowDayPlanner(true)
    }
    setShouldReturnToDayPlanner(false)
    setEditingEvent(null)
    setSelectedTimeSlot(null)
  }

  const resetEventForm = () => {
    setNewEvent(createDefaultEventState())
  }

  const closeDayPlanner = () => {
    setShowDayPlanner(false)
    setSelectedTimeSlot(null)
    setShouldReturnToDayPlanner(false)
  }

  const startNewEventFromPlanner = () => {
    if (!selectedDate) return
    const currentHour = new Date().getHours()
    const slotHour = selectedTimeSlot ? parseInt(selectedTimeSlot.split(':')[0], 10) : currentHour
    const { startTime, endTime } = getSlotRange(slotHour)
    resetEventForm()
    setNewEvent((previous) => ({
      ...previous,
      startTime,
      endTime,
    }))
    setSelectedTimeSlot(null)
    setShowDayPlanner(false)
    setShowCreateEvent(true)
    setEditingEvent(null)
    setShouldReturnToDayPlanner(true)
  }

  const loadEvents = useCallback(async () => {
    try {
      // Load events for the current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const response = await fetch(
        `/api/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
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
  }, [currentDate])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty slots for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  useEffect(() => {
    if (selectedDate) {
      setSelectedDayEvents(getEventsForDate(selectedDate))
    }
  }, [events, selectedDate])

  const openDayPlanner = (date: Date) => {
    const dayEvents = getEventsForDate(date)
    setSelectedDayEvents(dayEvents)
    setShowDayPlanner(true)
    setShowCreateEvent(false)
    setEditingEvent(null)
  }

  const handleDayClick = (date: Date) => {
    if (!isAdmin) return
    setSelectedDate(date)
    openDayPlanner(date)
  }

  const handleTimeSlotSelect = (hour: number) => {
    if (!selectedDate) return
    const { startTime, endTime } = getSlotRange(hour)
    setNewEvent((previous) => ({
      ...previous,
      startTime,
      endTime,
    }))
    setSelectedTimeSlot(startTime)
    setShowDayPlanner(false)
    setShowCreateEvent(true)
    setEditingEvent(null)
    setShouldReturnToDayPlanner(true)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const buildReminderPayload = () => {
    if (!newEvent.reminderEnabled) {
      return null
    }

    const durationHours = Number(newEvent.reminderDurationHours)
    const frequencyMinutes = Number(newEvent.reminderFrequencyMinutes)

    if (!durationHours || durationHours <= 0 || !frequencyMinutes || frequencyMinutes <= 0) {
      return null
    }

    return {
      durationHours,
      frequencyMinutes,
      message: newEvent.reminderMessage?.trim() || undefined,
    }
  }

  const handleCreateEvent = async () => {
    if (!selectedDate || !newEvent.title) {
      alert('Please provide a title for the event')
      return
    }

    try {
      // Combine date and time into proper datetime format
      const startDateTime = new Date(selectedDate)
      const [startHour, startMinute] = newEvent.startTime.split(':')
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)

      const endDateTime = new Date(selectedDate)
      const [endHour, endMinute] = newEvent.endTime.split(':')
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)

      const requestBody: any = {
        title: newEvent.title,
        description: newEvent.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: newEvent.location,
        type: newEvent.type,
      }

      // Add recurring event data if enabled
      if (newEvent.isRecurring && newEvent.recurrenceEndDate) {
        requestBody.isRecurring = true
        requestBody.recurrencePattern = newEvent.recurrencePattern
        requestBody.recurrenceEndDate = new Date(newEvent.recurrenceEndDate).toISOString()
      }

      const reminderPayload = buildReminderPayload()
      if (reminderPayload) {
        requestBody.reminderConfig = reminderPayload
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        closeEventForm()
        resetEventForm()
        loadEvents()
        alert(newEvent.isRecurring ? 'Recurring events created successfully!' : 'Event created successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event')
    }
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    const baseState = createDefaultEventState()
    const reminderConfig = event.reminderConfig
    setNewEvent({
      ...baseState,
      title: event.title,
      description: event.description || '',
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location || '',
      type: event.type || 'SERVICE',
      reminderEnabled: Boolean(reminderConfig),
      reminderDurationHours: reminderConfig?.durationHours || baseState.reminderDurationHours,
      reminderFrequencyMinutes: reminderConfig?.frequencyMinutes || baseState.reminderFrequencyMinutes,
      reminderMessage: reminderConfig?.message || '',
    })
    setShowDayPlanner(false)
    setShowCreateEvent(true)
    setShouldReturnToDayPlanner(true)
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent || !selectedDate || !newEvent.title) {
      alert('Please provide a title for the event')
      return
    }

    try {
      const startDateTime = new Date(selectedDate)
      const [startHour, startMinute] = newEvent.startTime.split(':')
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)

      const endDateTime = new Date(selectedDate)
      const [endHour, endMinute] = newEvent.endTime.split(':')
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)

      const reminderConfig = buildReminderPayload()
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          location: newEvent.location,
          type: newEvent.type,
          reminderConfig: reminderConfig ?? null,
        }),
      })

      if (response.ok) {
        closeEventForm()
        resetEventForm()
        loadEvents()
        alert('Event updated successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update event')
      }
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Failed to update event')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadEvents()
        alert('Event deleted successfully!')
      } else {
        alert('Failed to delete event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const days = getDaysInMonth()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Events Calendar</h1>
        <p className="text-gray-600">
          Click any day to create an event
        </p>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
          <div className="flex justify-between items-center">
        <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
        </button>
            
            <h2 className="text-2xl font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
            
        <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
        </button>
          </div>
      </div>

      {/* Calendar Grid */}
        <div className="p-4">
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const dayEvents = getEventsForDate(date)
              const today = isToday(date)

              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(date)}
                  className={`aspect-square border rounded-lg p-2 hover:bg-primary-50 hover:border-primary-500 transition-all ${
                    today
                      ? 'border-primary-600 bg-primary-50 font-bold'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <div className={`text-sm mb-1 ${today ? 'text-primary-700' : ''}`}>
                      {date.getDate()}
                  </div>
                    
                    {/* Event indicators */}
                    <div className="flex-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                          className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 mb-1 truncate"
                          title={event.title}
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
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Day Planner Modal */}
      {showDayPlanner && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Plan your day</p>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Tap any hour block to draft an event or select an existing event to edit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDayPlanner}
                  className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Close
                  <span className="ml-1 text-base leading-none">&times;</span>
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-3">
                  {HOURS_IN_DAY.map((hour) => {
                    const slotRange = getSlotRange(hour)
                    const overlappingEvents = selectedDayEvents.filter((event) => doesEventOverlapHour(event, hour))
                    const isSelected = selectedTimeSlot === slotRange.startTime
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleTimeSlotSelect(hour)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="font-medium text-gray-900">{formatHourLabel(hour)}</span>
                          <span>
                            {slotRange.startTime} – {slotRange.endTime}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {overlappingEvents.length === 0 ? (
                            <span className="text-xs text-gray-400">No events scheduled</span>
                          ) : (
                            overlappingEvents.map((event) => (
                              <span
                                key={`${event.id}-${hour}`}
                                className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                                {event.title}
                              </span>
                            ))
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-4 rounded-2xl border border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Selected slot</p>
                    <p className="text-sm text-gray-600">
                      {selectedTimeSlot
                        ? `${selectedTimeSlot} – ${getSlotRange(Number(selectedTimeSlot.split(':')[0])).endTime}`
                        : 'Tap an hour block to prefill start/end times'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startNewEventFromPlanner}
                    className="w-full rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
                    disabled={!selectedDate}
                  >
                    {selectedTimeSlot ? 'Create event for this time' : 'Start a new event'}
                  </button>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Events today</p>
                    {selectedDayEvents.length === 0 ? (
                      <p className="text-sm text-gray-500">No events yet—select a slot to add one.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDayEvents.map((event) => (
                          <div key={event.id} className="rounded-2xl border border-white bg-white p-3 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                                <p className="text-xs text-gray-500">
                                  {event.startTime} – {event.endTime}
                                </p>
                              </div>
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                {event.type}
                              </span>
                            </div>
                            {event.description && (
                              <p className="mt-2 text-xs text-gray-600 line-clamp-2">{event.description}</p>
                            )}
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                onClick={() => handleEditEvent(event)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="flex-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
                  <p className="text-gray-600">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <button onClick={closeEventForm} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Event Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="e.g., Sunday Service"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Event details..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="e.g., Main Sanctuary"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="SERVICE">Service</option>
                    <option value="PRAYER">Prayer Meeting</option>
                    <option value="BIBLE_STUDY">Bible Study</option>
                    <option value="YOUTH">Youth Event</option>
                    <option value="OUTREACH">Outreach</option>
                    <option value="CONFERENCE">Conference</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Recurring Event Options - Only for new events */}
                {!editingEvent && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        checked={newEvent.isRecurring}
                        onChange={(e) => setNewEvent({ ...newEvent, isRecurring: e.target.checked })}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                        🔄 Recurring Event
                      </label>
                    </div>

                    {newEvent.isRecurring && (
                      <div className="space-y-3 ml-7">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Repeat Pattern
                          </label>
                          <select
                            value={newEvent.recurrencePattern}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                recurrencePattern: e.target.value as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="WEEKLY">Weekly (every week)</option>
                            <option value="BIWEEKLY">Bi-weekly (every 2 weeks)</option>
                            <option value="MONTHLY">Monthly (same day each month)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date *
                          </label>
                          <input
                            type="date"
                            value={newEvent.recurrenceEndDate}
                            onChange={(e) => setNewEvent({ ...newEvent, recurrenceEndDate: e.target.value })}
                            min={selectedDate?.toISOString().split('T')[0]}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            required={newEvent.isRecurring}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Events will be created up to this date
                          </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800">
                            💡 <strong>Tip:</strong> Recurring events will automatically appear on your calendar.
                            Perfect for weekly services, monthly meetings, or regular events!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reminder options */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="reminderEnabled"
                      checked={newEvent.reminderEnabled}
                      onChange={(e) => setNewEvent({ ...newEvent, reminderEnabled: e.target.checked })}
                      className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="reminderEnabled"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        🔔 Send reminder push notifications
                      </label>
                      <p className="text-xs text-gray-500">
                        Automatically notify registered members leading up to the event.
                      </p>
                    </div>
                  </div>

                  {newEvent.reminderEnabled && (
                    <div className="mt-4 space-y-3 ml-7">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            How far ahead should reminders run?
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={72}
                            value={newEvent.reminderDurationHours}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                reminderDurationHours: Number(e.target.value || 0),
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., 6 hours"
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter number of hours before start time.</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reminder frequency (minutes)
                          </label>
                          <input
                            type="number"
                            min={5}
                            max={180}
                            step={5}
                            value={newEvent.reminderFrequencyMinutes}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                reminderFrequencyMinutes: Number(e.target.value || 0),
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., every 30 minutes"
                          />
                          <p className="text-xs text-gray-500 mt-1">Minimum 5 minutes between reminders.</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Custom message (optional)
                        </label>
                        <textarea
                          value={newEvent.reminderMessage}
                          onChange={(e) => setNewEvent({ ...newEvent, reminderMessage: e.target.value })}
                          rows={2}
                          placeholder="Friendly reminder that Sunday Service starts soon..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave blank to use the default auto-generated reminder.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={closeEventForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events List */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events
            .filter((event) => new Date(event.date) >= new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 6)
            .map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold mb-1">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>📅 {formatDate(event.date)}</span>
                  <span>⏰ {event.startTime}</span>
                </div>
                {event.location && (
                  <div className="text-xs text-gray-500 mt-1">
                    📍 {event.location}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}



