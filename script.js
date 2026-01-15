let events = [];
        let editingEventId = null;

        // Initialize the calendar
        function init() {
            updateDateDisplay();
            generateTimeSlots();
            setupEventListeners();
            updateCurrentTimeIndicator();
            setInterval(updateCurrentTimeIndicator, 60000); // Update every minute
        }

        // Update the date display
        function updateDateDisplay() {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', options);
        }

        // Generate time slots from 6 AM to 11 PM
        function generateTimeSlots() {
            const timeLabels = document.getElementById('timeLabels');
            const calendarBody = document.getElementById('calendarBody');
            
            for (let hour = 6; hour < 23; hour++) {
                // Create time label
                const timeLabel = document.createElement('div');
                timeLabel.className = 'time-label';
                timeLabel.textContent = formatTime(hour);
                timeLabels.appendChild(timeLabel);

                // Create time slot
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.dataset.hour = hour;
                timeSlot.addEventListener('click', () => openEventModal(hour));
                calendarBody.appendChild(timeSlot);
            }
        }

        // Format hour to 12-hour format
        function formatTime(hour) {
            if (hour === 0) return '12 AM';
            if (hour < 12) return `${hour} AM`;
            if (hour === 12) return '12 PM';
            return `${hour - 12} PM`;
        }

        // Setup event listeners
        function setupEventListeners() {
            document.getElementById('addEventBtn').addEventListener('click', () => openEventModal());
            document.getElementById('todayBtn').addEventListener('click', scrollToCurrentTime);
            document.getElementById('clearAllBtn').addEventListener('click', clearAllEvents);
            document.getElementById('cancelBtn').addEventListener('click', closeEventModal);
            
            // Form submission
            const eventForm = document.getElementById('eventForm');
            eventForm.addEventListener('submit', saveEvent);
            
            // Save button click (backup handler)
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                saveEvent(e);
            });

            // Modal backdrop click
            document.getElementById('eventModal').addEventListener('click', (e) => {
                if (e.target.id === 'eventModal') closeEventModal();
            });
        }

        // Open event modal
        function openEventModal(hour = null, event = null) {
            const modal = document.getElementById('eventModal');
            const modalTitle = document.getElementById('modalTitle');
            const eventTitle = document.getElementById('eventTitle');
            const eventStart = document.getElementById('eventStart');
            const eventEnd = document.getElementById('eventEnd');
            const eventColor = document.getElementById('eventColor');

            if (event) {
                // Edit existing event
                modalTitle.textContent = 'Edit Event';
                eventTitle.value = event.title;
                eventStart.value = event.startTime;
                eventEnd.value = event.endTime;
                eventColor.value = event.color;
                editingEventId = event.id;
            } else {
                // Add new event
                modalTitle.textContent = 'Add New Event';
                eventTitle.value = '';
                eventStart.value = hour ? `${hour.toString().padStart(2, '0')}:00` : '09:00';
                eventEnd.value = hour ? `${(hour + 1).toString().padStart(2, '0')}:00` : '10:00';
                eventColor.value = 'blue';
                editingEventId = null;
            }

            modal.style.display = 'block';
            eventTitle.focus();
        }

        // Close event modal
        function closeEventModal() {
            document.getElementById('eventModal').style.display = 'none';
            editingEventId = null;
        }

        // Save event
        function saveEvent(e) {
            e.preventDefault();
            
            const title = document.getElementById('eventTitle').value.trim();
            const startTime = document.getElementById('eventStart').value;
            const endTime = document.getElementById('eventEnd').value;
            const color = document.getElementById('eventColor').value;

            console.log('Saving event:', { title, startTime, endTime, color }); // Debug log

            if (!title || !startTime || !endTime) {
                alert('Please fill in all required fields');
                return;
            }

            if (startTime >= endTime) {
                alert('End time must be after start time');
                return;
            }

            const eventData = {
                id: editingEventId || Date.now().toString(),
                title,
                startTime,
                endTime,
                color
            };

            if (editingEventId) {
                // Update existing event
                const index = events.findIndex(event => event.id === editingEventId);
                if (index !== -1) {
                    events[index] = eventData;
                }
            } else {
                // Add new event
                events.push(eventData);
            }

            console.log('Events array after save:', events); // Debug log
            renderEvents();
            closeEventModal();
        }

        // Render all events
        function renderEvents() {
            // Clear existing events
            const existingEvents = document.querySelectorAll('.event');
            existingEvents.forEach(event => event.remove());

            // Render each event
            events.forEach(event => renderEvent(event));
        }

        // Render single event
        function renderEvent(event) {
            const eventElement = document.createElement('div');
            eventElement.className = `event event-${event.color}`;
            eventElement.textContent = event.title;
            eventElement.dataset.eventId = event.id;

            // Calculate position and height
            const startHour = parseInt(event.startTime.split(':')[0]);
            const startMinute = parseInt(event.startTime.split(':')[1]);
            const endHour = parseInt(event.endTime.split(':')[0]);
            const endMinute = parseInt(event.endTime.split(':')[1]);

            // Only render events that fall within our display hours (6 AM - 11 PM)
            if (startHour < 6 || startHour >= 23) {
                console.warn('Event outside display hours:', event.title);
                return;
            }

            const startPosition = ((startHour - 6) * 60 + startMinute) * (60 / 60); // 60px per hour
            const duration = (endHour - startHour) * 60 + (endMinute - startMinute);
            const height = Math.max(20, duration * (60 / 60)); // Minimum 20px height

            eventElement.style.top = `${startPosition}px`;
            eventElement.style.height = `${height}px`;

            // Add click handler for editing
            eventElement.addEventListener('click', (e) => {
                e.stopPropagation();
                openEventModal(null, event);
            });

            // Add double-click handler for deletion
            eventElement.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${event.title}"?`)) {
                    deleteEvent(event.id);
                }
            });

            document.getElementById('calendarBody').appendChild(eventElement);
        }

        // Delete event
        function deleteEvent(eventId) {
            events = events.filter(event => event.id !== eventId);
            renderEvents();
        }

        // Clear all events
        function clearAllEvents() {
            if (events.length === 0) {
                alert('No events to clear');
                return;
            }

            if (confirm('Are you sure you want to clear all events?')) {
                events = [];
                renderEvents();
            }
        }

        // Scroll to current time
        function scrollToCurrentTime() {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            if (currentHour >= 6 && currentHour < 23) {
                const position = ((currentHour - 6) * 60 + currentMinute) * (60 / 60);
                const calendarContainer = document.querySelector('.calendar-container');
                calendarContainer.scrollTop = Math.max(0, position - 200);
            }
        }

        // Update current time indicator
        function updateCurrentTimeIndicator() {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const indicator = document.getElementById('currentTimeIndicator');

            if (currentHour >= 6 && currentHour < 23) {
                const position = ((currentHour - 6) * 60 + currentMinute) * (60 / 60);
                indicator.style.top = `${position}px`;
                indicator.style.display = 'block';
            } else {
                indicator.style.display = 'none';
            }
        }

        // Initialize the calendar when the page loads
        init();