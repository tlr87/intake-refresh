/**
 * ============================================================================
 * RD3 TECH — FALLBACK FIELD_SCHEMA PROVIDER
 * ============================================================================
 *
 * Standalone fallback provider for FIELD_SCHEMA.
 *
 * IMPORTANT:
 * FIELD_SCHEMA in Script Properties remains the PRIMARY source.
 *
 * This file exists only as a fallback if the production FIELD_SCHEMA
 * cannot be loaded.
 *
 * ============================================================================
 */

function getFallbackFieldSchema() {

  return {

    name: {
      key: 'name',
      formField: 'form_name',
      title: 'Full Name ',
      entryId: 'entry.943904063',
      type: 'text',
      aliases: ['name', 'full name'],
      label: 'Full Name',
      section: 'client',
      default: 'Not provided'
    },

    email: {
      key: 'email',
      formField: 'form_email',
      title: 'Email',
      entryId: 'entry.102080998',
      type: 'text',
      aliases: ['email', 'email address'],
      label: 'Email',
      section: 'client',
      default: 'N/A'
    },

    phone: {
      key: 'phone',
      formField: 'form_phone',
      title: 'Phone',
      entryId: 'entry.168438921',
      type: 'text',
      aliases: ['phone', 'phone number'],
      label: 'Phone',
      section: 'client',
      default: 'N/A'
    },

    location: {
      key: 'location',
      formField: 'form_location',
      title: 'Address / Location:',
      entryId: 'entry.1899781044',
      type: 'text',
      aliases: ['location', 'address', 'address / location'],
      label: 'Address / Location',
      section: 'client',
      default: 'N/A'
    },

    contactPreference: {
      key: 'contactPreference',
      formField: 'form_contactPreference',
      title: 'How would you prefer us to contact you?',
      entryId: 'entry.1440389441',
      type: 'dropdown',
      aliases: ['contact preference', 'preferred contact'],
      label: 'Preferred Contact',
      section: 'client',
      default: 'Not provided'
    },

    usedBefore: {
      key: 'usedBefore',
      formField: 'form_usedBefore',
      title: 'Have you used RD3 Tech before?',
      entryId: 'entry.1041448204',
      type: 'dropdown',
      aliases: ['used before', 'previous client'],
      label: 'Previous Client',
      section: 'client',
      default: 'No'
    },

    contactingAs: {
      key: 'contactingAs',
      formField: 'form_contactingAs',
      title: 'I am contacting RD3 Tech as:',
      entryId: 'entry.1314955336',
      type: 'dropdown',
      aliases: ['contacting as'],
      label: 'Contacting As',
      section: 'client',
      default: 'Not provided'
    },

    helpCategory: {
      key: 'helpCategory',
      formField: 'form_helpCategory',
      title: 'What can we help you with?',
      entryId: 'entry.1736772191',
      type: 'dropdown',
      aliases: ['help category', 'need help with'],
      label: 'Need Help with:',
      section: 'request',
      default: 'Not specified'
    },

    userGoal: {
      key: 'userGoal',
      formField: 'form_userGoal',
      title: 'What Are You Trying To Achieve?',
      entryId: 'entry.1162032180',
      type: 'text',
      aliases: ['user goal', 'what are you trying to achieve'],
      label: 'What Are You Trying To Achieve?',
      section: 'request',
      default: 'Not specified'
    },

    urgency: {
      key: 'urgency',
      formField: 'form_urgency',
      title: 'How Urgent Is This For You?',
      entryId: 'entry.1220373737',
      type: 'dropdown',
      aliases: ['urgency', 'how urgent is this for you'],
      label: 'Urgency',
      section: 'request',
      default: 'Not specified'
    },

    honeypot: {
      key: 'honeypot',
      formField: 'form_honeypot',
      title: 'Website URL Security Check: Please leave this field empty.',
      entryId: 'entry.1528658253',
      type: 'text',
      aliases: ['honeypot', 'security check'],
      label: 'Website URL Security Check: Please leave this field empty.',
      section: 'security',
      default: ''
    }

  };

}