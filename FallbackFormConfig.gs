/**
 * ============================================================================
 * FallbackFormConfig.gs
 * ============================================================================
 *
 * FALLBACK CONFIGURATION FOR THE RD3 TECH GOOGLE FORM.
 *
 * This file describes the Google Form itself:
 *   - Question titles
 *   - Google Form entry IDs
 *   - Google Form field types
 *
 * This is NOT the website field schema.
 * Website/application mapping is handled separately by Mapping.gs.
 *
 * IMPORTANT:
 * If the Google Form questions change, regenerate/update this configuration.
 * ============================================================================
 */

function getFallbackFormConfig() {

  return {

    // ========================================================================
    // FORM SETTINGS
    // ========================================================================

    settings: {

      adminEmail: 'tom@rd3tech.com',

      formTitle: 'RD3 Tech Contact Form',

      formBaseUrl:
        'https://docs.google.com/forms/d/10ahsRmbXxFjcVGOY3IjZcrptctulxcS4sdQygAOp9mc/'
    },


    // ========================================================================
    // GOOGLE FORM FIELDS
    // ========================================================================

    fields: {

      // ----------------------------------------------------------------------
      // SECURITY
      // ----------------------------------------------------------------------

      honeypot: {
        titleMatch: 'Security Check',
        entryId: 'entry.313042228',
        type: 'text'
      },


      // ----------------------------------------------------------------------
      // CLIENT DETAILS
      // ----------------------------------------------------------------------

      name: {
        titleMatch: 'Name',
        entryId: 'entry.776532163',
        type: 'text'
      },

      email: {
        titleMatch: 'Email',
        entryId: 'entry.1530707551',
        type: 'text'
      },

      phone: {
        titleMatch: 'Phone',
        entryId: 'entry.2118395637',
        type: 'text'
      },

      location: {
        titleMatch: 'Address / Location',
        entryId: 'entry.1043436112',
        type: 'text'
      },

      contactPreference: {
        titleMatch: 'How would you prefer us to contact you?',
        entryId: 'entry.1955012690',
        type: 'multiple_choice'
      },

      usedBefore: {
        titleMatch: 'Have you used RD3 Tech before?',
        entryId: 'entry.1871615748',
        type: 'multiple_choice'
      },

      clientType: {
        titleMatch: 'I am contacting RD3 Tech as:',
        entryId: 'entry.480241942',
        type: 'multiple_choice'
      },


      // ----------------------------------------------------------------------
      // REQUEST DETAILS
      // ----------------------------------------------------------------------

      helpCategory: {
        titleMatch: 'What Can We Help You With?',
        entryId: 'entry.1402987091',
        type: 'checkbox'
      },

      userGoal: {
        titleMatch: 'What Are You Trying To Achieve?',
        entryId: 'entry.785917515',
        type: 'paragraph'
      },

      urgency: {
        titleMatch: 'How Urgent Is This For You?',
        entryId: 'entry.790093298',
        type: 'multiple_choice'
      }

    }

  };
}