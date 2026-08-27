/**
 * Mapping.gs
 * Single source of truth for form fields.
 */

const FIELD_SCHEMA = [

  // CLIENT
  {
    key: 'name',
    formField: 'form_name',
    aliases: [
      'entry.776532163',
      'name',
      'full name'
    ],
    label: 'Full Name',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'email',
    formField: 'form_email',
    aliases: [
      'entry.1530707551',
      'email',
      'email address'
    ],
    label: 'Email Address',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'phone',
    formField: 'form_phone',
    aliases: [
      'entry.2118395637',
      'phone',
      'phone number'
    ],
    label: 'Phone Number',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'location',
    formField: 'form_location',
    aliases: [
      'entry.1366120320',
      'location',
      'address',
      'address / location'
    ],
    label: 'Location / Address',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'contactPreference',
    formField: 'form_contactPreference',
    aliases: [
      'entry.1955012690',
      'contactPreference',
      'preferredContact',
      'how would you prefer us to contact you',
      'prefer us to contact',
      'preferred contact'
    ],
    label: 'Preferred Contact',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'contactingAs',
    formField: 'form_clientType',
    aliases: [
      'entry.480241942',
      'clientType',
      'contactingAs',
      'i am contacting rd3 tech as',
      'contacting as'
    ],
    label: 'Contacting As',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'usedBefore',
    formField: 'form_usedBefore',
    aliases: [
      'entry.1871615748',
      'usedBefore',
      'have you used rd3 tech before',
      'previous customer',
      'used before'
    ],
    label: 'Previous Customer',
    section: 'client',
    default: 'No'
  },


  // REQUEST
  {
    key: 'helpCategory',
    formField: 'form_helpCategory',
    aliases: [
      'entry.1402987091',
      'helpCategory',
      'what can we help you with',
      'need help with',
      'help with'
    ],
    label: 'Need Help With',
    section: 'request',
    default: 'Not specified'
  },

  {
    key: 'userGoal',
    formField: 'form_userGoal',
    aliases: [
      'entry.785917515',
      'userGoal',
      'goal',
      'details',
      'what are you trying to achieve',
      'trying to achieve',
      'desired outcome'
    ],
    label: 'Desired Outcome / Goal',
    section: 'request',
    default: 'Not specified'
  },

  {
    key: 'urgency',
    formField: 'form_urgency',
    aliases: [
      'entry.790093298',
      'urgency',
      'how urgent is this for you',
      'how urgent'
    ],
    label: 'How Urgent Is This?',
    section: 'request',
    default: 'Medium'
  },


  // HONEYPOT (bot trap)
  {
    key: 'honeypot',
    formField: 'form_honeypot',
    aliases: [
      'website url',
      'security check',
      'please leave this field empty',
      'leave blank',
      'honeypot'
    ],
    label: 'Honeypot',
    section: 'security',
    default: ''
  }

];