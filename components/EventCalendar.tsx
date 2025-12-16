'use client'

import { useState, useEffect } from 'react'
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
}

interface EventsCalendarProps { isAdmin?: boolean } export default function EventsCalendar({ isAdmin = false }: EventsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showEventList, setShowEventList] = useState(false)
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([])
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  
  // New event form
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    type: 'SERVICE',
    isRecurring: false,
    recurrencePattern: 'WEEKLY' as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    recurrenceEndDate: '',
  })

  useEffect(() => {
    loadEvents()
  }, [currentDate])

  const loadEvents = async () => {
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
  }

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

  const handleDayClick = (date: Date) => {
    if (!isAdmin) return;
    
    const dayEvents = getEventsForDate(date)
    setSelectedDate(date)
    
    if (dayEvents.length > 0) {
      // Show existing events for editing
      setSelectedDayEvents(dayEvents)
      setShowEventList(true)
    } else {
      // Show create form for empty days
      setShowCreateEvent(true)
    }
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
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

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        setShowCreateEvent(false)
        setEditingEvent(null)
        setNewEvent({
          title: '',
          description: '',
          startTime: '09:00',
          endTime: '10:00',
          location: '',
          type: 'SERVICE',
          isRecurring: false,
          recurrencePattern: 'WEEKLY',
          recurrenceEndDate: '',
        })
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
    setNewEvent({
      title: event.title,
      description: event.description || '',
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location || '',
      type: event.type || 'SERVICE',
      isRecurring: false,
      recurrencePattern: 'WEEKLY',
      recurrenceEndDate: '',
    })
    setShowEventList(false)
    setShowCreateEvent(true)
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
        }),
      })

      if (response.ok) {
        setShowCreateEvent(false)
        setEditingEvent(null)
        setNewEvent({
          title: '',
          description: '',
          startTime: '09:00',
          endTime: '10:00',
          location: '',
          type: 'SERVICE',
          isRecurring: false,
          recurrencePattern: 'WEEKLY',
          recurrenceEndDate: '',
        })
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
        setShowEventList(false)
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
                <button
                  onClick={() => {
                    setShowCreateEvent(false)
                    setEditingEvent(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
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
                          onChange={(e) => setNewEvent({ ...newEvent, recurrencePattern: e.target.value as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' })}
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
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateEvent(false)
                    setEditingEvent(null)
                  }}
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

      {/* Event List Modal - When clicking on a day with events */}
      {showEventList && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Events on this Day</h2>
                  <p className="text-gray-600">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setShowEventList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Events List */}
              <div className="space-y-3">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {event.type}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <span>⏰</span>
                        <span>{event.startTime} - {event.endTime}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Event Button */}
              <button
                onClick={() => {
                  setShowEventList(false)
                  setShowCreateEvent(true)
                }}
                className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-gray-600 hover:text-primary-700 font-medium"
              >
                + Add Another Event on This Day
              </button>
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



