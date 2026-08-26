/**
 * Standalone fallback provider for FORM_CONFIG.
 */
function getFallbackFormConfig() {
  return {
    "settings": {
      "adminEmail": "tom@rd3tech.com",
      "formTitle": "RD3 Tech Contact Form",
      "formBaseUrl": "https://docs.google.com/forms/d/10ahsRmbXxFjcVGOY3IjZcrptctulxcS4sdQygAOp9mc/" 
    },
    "fields": {
      "honeypot": {
        "titleMatch": "Security Check",
        "entryId": "entry.313042228",
        "type": "text"
      },
      "name": {
        "titleMatch": "Name",
        "entryId": "entry.776532163",
        "type": "text"
      },
      "email": {
        "titleMatch": "Email",
        "entryId": "entry.1530707551",
        "type": "text"
      },
      "phone": {
        "titleMatch": "Phone",
        "entryId": "entry.2118395637",
        "type": "text"
      },
      "address": {
        "titleMatch": "Address / Location",
        "entryId": "entry.1043436112",
        "type": "text"
      },
      "contactPreference": {
        "titleMatch": "How would you prefer us to contact you?",
        "entryId": "entry.1955012690",
        "type": "list"
      },
      "usedBefore": {
        "titleMatch": "Have you used RD3 Tech before?",
        "entryId": "entry.1871615748",
        "type": "list"
      },
      "clientType": {
        "titleMatch": "contacting RD3 Tech as",
        "entryId": "entry.480241942",
        "type": "list"
      },
      "helpCategory": {
        "titleMatch": "What can we help you with?",
        "entryId": "entry.1402987091",
        "type": "list"
      },
      "userGoal": {
        "titleMatch": "What Are You Trying To Achieve?",
        "entryId": "entry.785917515",
        "type": "paragraph"
      },
      "urgency": {
        "titleMatch": "How Urgent Is This For You?",
        "entryId": "entry.790093298",
        "type": "list"
      }
    }
  };
}