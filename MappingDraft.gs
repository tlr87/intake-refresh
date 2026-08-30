
const DRAFT_FIELD_SCHEMA = [

  // ==========================================================================
  // CLIENT
  // ==========================================================================

  {
    key: 'name',
    formField: 'form_name',

    // Google Form
    title: 'Name',
    entryId: 'entry.943904063',
    type: 'text',

    // Application
    aliases: [
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

    // Google Form
    title: 'Email',
    entryId: 'entry.2015577610',
    type: 'text',

    // Application
    aliases: [
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

    // Google Form
    title: 'Phone',
    entryId: 'entry.38229443',
    type: 'text',

    // Application
    aliases: [
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

    // Google Form
    title: 'Address / Location:',
    entryId: 'entry.1374165657',
    type: 'text',

    // Application
    aliases: [
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

    // Google Form
    title: 'How would you prefer us to contact you?',
    entryId: 'entry.786887502',
    type: 'dropdown',

    // Application
    aliases: [
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

    // Google Form
    title: 'I am contacting RD3 Tech as:',
    entryId: 'entry.1187723509',
    type: 'dropdown',

    // Application
    aliases: [
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

    // Google Form
    title: 'Have you used RD3 Tech before?',
    entryId: 'entry.1059088719',
    type: 'dropdown',

    // Application
    aliases: [
      'usedBefore',
      'have you used rd3 tech before',
      'previous customer',
      'used before'
    ],
    label: 'Previous Customer',
    section: 'client',
    default: 'No'
  },


  // ==========================================================================
  // REQUEST
  // ==========================================================================

  {
    key: 'helpCategory',
    formField: 'form_helpCategory',

    // Google Form
    title: 'What can we help you with?',
    entryId: 'entry.534946962',
    type: 'dropdown',

    // Application
    aliases: [
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

    // Google Form
    title: 'What Are You Trying To Achieve?',
    entryId: 'entry.1272748221',
    type: 'paragraph',

    // Application
    aliases: [
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

    // Google Form
    title: 'How Urgent Is This For You?',
    entryId: 'entry.1183805901',
    type: 'dropdown',

    // Application
    aliases: [
      'urgency',
      'how urgent is this for you',
      'how urgent'
    ],
    label: 'How Urgent Is This?',
    section: 'request',
    default: 'Medium'
  },


  // ==========================================================================
  // HONEYPOT
  // ==========================================================================

  {
    key: 'honeypot',
    formField: 'form_honeypot',

    // Google Form
    title: 'Website URL  \n\n\nSecurity Check: Please leave this field empty.',
    entryId: 'entry.663587071',
    type: 'text',

    // Application
    aliases: [
      'website url',
      'security check',
      'please leave this field empty',
      'leave blank',
      'honeypot',
      'website url security check: please leave this field empty.'
    ],
    label: 'Honeypot',
    section: 'security',
    default: ''
  },

];