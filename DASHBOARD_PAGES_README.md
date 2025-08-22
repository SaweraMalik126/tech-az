# Dashboard Pages - Settings, Support, and Feedback

This document describes the new pages that have been added to both the Student and Teacher dashboards in TeachMe.ai.

## Overview

Three new pages have been added to enhance the user experience and provide better account management capabilities:

1. **Settings Page** - Account preferences and configuration
2. **Support Page** - Help center and support ticket system
3. **Feedback Page** - User feedback and suggestions

## Pages Description

### 1. Settings Page (`SettingsPage.tsx`)

The Settings page provides comprehensive account management with the following sections:

#### Profile Settings
- Full name, email, phone number, and bio
- Editable user information fields

#### Security Settings
- Two-factor authentication toggle
- Session timeout configuration
- Login notification preferences

#### Notification Settings
- Email and push notification toggles
- Assignment reminders
- Course updates
- Marketing email preferences

#### Privacy Settings
- Profile visibility controls
- Progress sharing preferences
- Grade visibility settings (student-specific)
- Direct message permissions

#### Appearance Settings
- Theme selection (Light/Dark/System)
- Language preferences (English, Urdu, Punjabi, Sindhi, Pashto, Saraiki, Balochi)
- Font size options

#### Account Information
- Account type display
- Member since date
- Last login information

### 2. Support Page (`SupportPage.tsx`)

The Support page provides a comprehensive help center with:

#### Quick Actions
- Contact Support (opens ticket form)
- Documentation access
- Video tutorials

#### FAQ Section
- Searchable frequently asked questions
- Category-based filtering
- Expandable/collapsible answers

#### Support Ticket System
- Create new support tickets
- View existing tickets
- Track ticket status and priority

#### Contact Information
- Email support
- Phone support
- Support hours

#### Helpful Resources
- User manual
- Getting started guide
- Troubleshooting guide
- API documentation

#### System Status
- Real-time platform status
- Service health indicators

### 3. Feedback Page (`FeedbackPage.tsx`)

The Feedback page allows users to provide input and suggestions:

#### Quick Actions
- Submit feedback form
- Feature requests
- View analytics

#### Feedback Statistics
- Overall satisfaction score
- Average rating display
- Recent trend indicators
- Top feedback categories

#### Feedback Submissions
- View personal feedback history
- Track submission status
- Rating system (1-5 stars)

#### Feedback Form
- Multiple feedback types (general, course, feature, bug, improvement)
- Category selection
- Priority levels
- Star rating system
- Detailed description field

## Implementation Details

### File Structure
```
src/components/Dashboard/
├── SettingsPage.tsx
├── SupportPage.tsx
├── FeedbackPage.tsx
├── StudentDashboard.tsx (updated)
└── TeacherDashboard.tsx (updated)
```

### Key Features

#### Responsive Design
- Mobile-first approach
- Grid-based layouts that adapt to screen size
- Consistent spacing and typography

#### Accessibility
- Proper labeling for form elements
- Keyboard navigation support
- Screen reader friendly

#### State Management
- Local state for form inputs
- Optimistic updates for better UX
- Form validation and error handling

#### UI Components
- Uses existing shadcn/ui components
- Consistent with existing design system
- Proper icon usage from Lucide React

### Integration

#### Student Dashboard
- Added 3 new tabs: Settings, Support, Feedback
- Maintains existing functionality
- Role-specific content adaptation

#### Teacher Dashboard
- Added 3 new tabs: Settings, Support, Feedback
- Teacher-specific features and content
- Consistent with student experience

### Navigation

The new pages are accessible through:
1. **Sidebar Navigation** - Already configured in the sidebar
2. **Tab Navigation** - Added to main dashboard tabs
3. **Direct Routing** - Can be accessed programmatically

## Usage Examples

### Accessing Settings
```typescript
// Navigate to settings tab
setActiveTab('settings');

// Or access directly
<SettingsPage userRole="student" />
```

### Submitting Support Ticket
```typescript
// Open support ticket form
setShowContactForm(true);

// Handle submission
const handleSubmitTicket = async () => {
  // Submit to backend
  await submitTicket(ticketForm);
  setShowContactForm(false);
};
```

### Submitting Feedback
```typescript
// Open feedback form
setShowFeedbackForm(true);

// Handle submission with rating
const handleSubmitFeedback = async () => {
  await submitFeedback({
    ...feedbackForm,
    rating: selectedRating
  });
};
```

## Future Enhancements

### Backend Integration
- Connect to actual API endpoints
- Implement real-time updates
- Add user authentication checks

### Advanced Features
- File uploads for support tickets
- Rich text editing for feedback
- Email notifications for ticket updates
- Admin panel for managing tickets

### Analytics
- Track user engagement
- Monitor feedback trends
- Generate reports for administrators

## Maintenance

### Code Quality
- TypeScript interfaces for all data structures
- Consistent error handling patterns
- Proper component separation

### Styling
- Tailwind CSS classes
- Consistent spacing and colors
- Responsive breakpoints

### Testing
- Component unit tests
- Integration tests for forms
- Accessibility testing

## Conclusion

These new pages significantly enhance the user experience by providing:
- Comprehensive account management
- Easy access to help and support
- Multiple channels for user feedback
- Consistent design across user roles

The implementation follows best practices for maintainability, accessibility, and user experience while integrating seamlessly with the existing dashboard architecture.
