# React Native Mobile App Development Prompt

Build a React Native mobile application for a **Dentist Appointment Management System** with the following specifications:

## App Overview
A mobile app for managing dentist appointments with three main screens: Reservations Dashboard, Patient Management, and Treatment History. The app should use **dummy/mock data only** - no backend integration needed. Focus purely on **UI/UX implementation**.

## Technical Stack
- **React Native** (Expo recommended for easier setup)
- **TypeScript** for type safety
- **React Navigation** for navigation (Tab Navigator)
- **React Native Paper** or **NativeBase** for UI components (or custom styled components)
- **React Native Reanimated** or **React Native Animatable** for animations
- **Date-fns** or **Moment.js** for date formatting
- **Zustand** or **React Context** for state management (optional, can use local state)

## Data Models

### Patient Type
```typescript
type BookingType = "advance" | "walk-in" | "emergency"
type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"

interface Patient {
  id: string
  patientId: string
  name: string
  phone: string
  age: number
  bloodType: BloodType
  bookingType: BookingType
  appointmentDate: string // ISO date string
  hasArrived: boolean
  createdAt: string
  completedAt?: string | null
  treatmentNote?: string | null
  xrayImageBase64?: string | null
}
```

## Dummy Data Requirements
Create a comprehensive set of dummy data including:
- **5-8 waiting patients** (mix of advance, walk-in, emergency)
- **3-5 upcoming patients** (mostly advance bookings)
- **0-1 current patient** (optional, can be null)
- **10-15 completed treatments** in history
- Ensure some patients have treatment notes and X-ray images (base64 strings or placeholder images)

## Screen 1: Reservations Dashboard

### Header Section
- Title: "Reservations Dashboard"
- Subtitle: "Manage treatment flow and queue status"
- **Stats Summary Cards** (3 cards in a row):
  - Total Waiting (number)
  - Total Upcoming (number)
  - Emergency Cases (highlighted in red)

### Search & Filter Section
- Search input: "Search by name or phone"
- Dropdown/Picker: Filter by booking type (All, Advance, Walk-in, Emergency)

### Main Content (3 Columns/Sections)

#### 1. Current Patient Section
- **Header**: "Current Patient" with count badge (green accent)
- **Content**:
  - If no current patient: Show "No patient is currently in treatment."
  - If current patient exists: Display patient card with:
    - Patient name (bold)
    - Phone number
    - Age and Blood Type
    - Appointment date (formatted)
    - Booking type badge (colored)
    - **Action Button**: "Finish Treatment" (full width, primary color)

#### 2. Waiting Patients Section
- **Header**: "Waiting Patients" with count badge (amber/yellow accent)
- **Content**: Scrollable list of patient cards
  - Each card shows:
    - Patient name and phone
    - Age, Blood Type, Appointment date
    - Booking type badge
    - **Emergency patients**: Red border and light red background
    - **Action Buttons** (2 buttons side by side):
      - "Start Treatment" (primary)
      - "Cancel" (outline/secondary)

#### 3. Upcoming Patients Section
- **Header**: "Upcoming Patients" with count badge (blue accent)
- **Content**: Scrollable list of patient cards
  - Same card layout as waiting patients
  - **Action Buttons**:
    - "Mark as Arrived" (primary)
    - "Cancel Reservation" (destructive/red)

### Patient Card Design
- Card with border and padding
- Emergency patients have red border and tinted background
- Booking type badges with colors:
  - Advance: Blue/Purple
  - Walk-in: Green
  - Emergency: Red
- Grid layout for patient info (Age, Blood Type, Appointment)
- Responsive button layout

### Modals/Dialogs

#### 1. Finish Treatment Dialog
- Triggered when "Finish Treatment" is pressed
- Title: "Finish treatment with required note"
- Fields:
  - **Treatment Note** (required, minimum 5 characters, multiline text input)
  - **X-ray Image** (optional, image picker)
    - Show image preview if selected
    - Remove image button
- Actions:
  - Cancel button
  - "Finish & Save Note" button (disabled if note < 5 chars)

#### 2. Replace Current Patient Dialog
- Triggered when starting treatment while another patient is current
- Title: "Replace current patient?"
- Message: "A patient is currently being treated. If you continue, that patient will be moved back to the waiting list."
- Actions:
  - "Keep Current" (cancel)
  - "Replace & Start" (confirm)

#### 3. Add New Reservation Dialog
- Triggered by "+" or "Add Reservation" button in header
- Form fields:
  - Patient Name (required)
  - Phone (required)
  - Age (required, number input)
  - Blood Type (picker/dropdown)
  - Booking Type (picker: advance, walk-in, emergency)
  - Appointment Date (date picker)
  - X-ray Image (optional, image picker)
- Actions:
  - Cancel
  - Submit/Add

## Screen 2: Patient Management

### Header
- Title: "Patient Management"
- Subtitle: "Add, edit, search and maintain your patient profiles"

### Search & Filter
- Search input for name/phone
- Filter by booking type (optional)

### Patient List
- Scrollable list of all patients
- Each patient card shows:
  - Name and phone
  - Age and Blood Type
  - Booking type badge
  - Linked reservations count (if applicable)
- Actions:
  - Edit button
  - View details button
  - Delete button (optional)

### Add Patient Button
- Floating action button or header button
- Opens form dialog similar to Add Reservation

## Screen 3: Treatment History

### Header
- Title: "Treatment History"
- Subtitle: "Review completed treatments with notes, search, and date filters"

### Filters Section
- Search input: "Search by patient, phone, or note"
- Booking type filter (All, Advance, Walk-in, Emergency)
- Date range filters:
  - From Date (date picker)
  - To Date (date picker)

### History List
- Scrollable list of completed treatments
- Each history card shows:
  - Patient name and phone
  - Age and Blood Type
  - Booking type badge
  - **Completed Date** (formatted)
  - **Treatment Note** (full text, or "No note" if empty)
  - X-ray image thumbnail (if available, tappable to view full size)
- Pagination (6 items per page):
  - Previous/Next buttons
  - Page indicator: "Page X / Y"

## Navigation
- **Bottom Tab Navigator** with 3 tabs:
  1. Reservations (default/home)
  2. Patients
  3. History
- Each tab should have appropriate icons
- Active tab should be highlighted

## UI/UX Requirements

### Design Style
- Modern, clean design
- Use a consistent color scheme:
  - Primary: Blue/Purple
  - Success: Green
  - Warning: Amber/Yellow
  - Danger: Red
  - Emergency: Red (darker shade)
- Support both light and dark themes (optional but recommended)

### Animations
- Smooth transitions when navigating between screens
- Animate list items when they appear/disappear
- Card animations when patient status changes
- Loading states for actions (optional, since using dummy data)

### Responsive Design
- Works on both iOS and Android
- Optimized for phone screens (portrait orientation)
- Proper spacing and padding
- Touch-friendly button sizes (minimum 44x44 points)

### Typography
- Clear hierarchy (headings, body text, labels)
- Readable font sizes
- Proper contrast ratios

### Components to Build
1. PatientCard component (reusable for all variants)
2. StatsSummary component
3. SearchInput component
4. FilterPicker component
5. BookingTypeBadge component
6. DateFormatter utility
7. Modal/Dialog components
8. Form components (TextInput, Picker, DatePicker, ImagePicker)

## Functionality (UI Only - No Backend)

### State Management
- Use local state or simple state management
- When actions are triggered (Start Treatment, Mark as Arrived, etc.):
  - Update local state to move patients between sections
  - Show success/error messages (toast notifications)
  - Update counts in stats summary
  - Animate transitions

### Example State Updates
- **Start Treatment**: Move patient from Waiting → Current
- **Mark as Arrived**: Move patient from Upcoming → Waiting
- **Finish Treatment**: Move patient from Current → History
- **Cancel**: Remove patient from list
- **Add Reservation**: Add new patient to appropriate section

### Data Persistence
- No need for real persistence
- Can use AsyncStorage to persist dummy data between app restarts (optional)
- Or just reset to initial dummy data on app restart

## Implementation Notes

1. **No API Calls**: All data should be hardcoded or generated locally
2. **No Database**: Use in-memory state or AsyncStorage for simple persistence
3. **Focus on UI**: Make it look polished and professional
4. **Smooth Animations**: Use React Native Reanimated for smooth transitions
5. **Error Handling**: Show toast messages for user feedback
6. **Loading States**: Optional, but can show brief loading indicators for better UX
7. **Image Handling**: Use placeholder images or generate base64 dummy images for X-rays

## Deliverables
- Complete React Native app with all 3 screens
- All dummy data pre-populated
- Smooth navigation between screens
- All modals and dialogs functional
- Responsive design for mobile devices
- Clean, modern UI matching the web app design
- TypeScript types for all data structures
- Proper component structure and code organization

## Bonus Features (Optional)
- Pull-to-refresh on lists
- Swipe actions on cards
- Dark mode support
- Haptic feedback on button presses
- Image viewer for X-ray images
- Export history as PDF (using react-native-pdf or similar)

---

**Important**: This is a UI-only implementation. All interactions should update local state and show visual feedback, but no actual backend integration is needed. The app should feel fully functional with dummy data.
