// Mock i18n functionality for testing interface
// Simplified replacement for react-i18next
import React from 'react';

// Mock Trans component for react-i18next compatibility
export function Trans({ children, ...props }) {
  // For testing interface, just render children as-is
  return React.Children.toArray(children);
}

// Simple translation mapping for testing interface
const translations = {
  'main-page.checklist.title': 'Getting Started Checklist',
  'main-page.checklist.tasksLeft': 'tasks left',
  'main-page.checklist.dismiss': 'Dismiss',
  'main-page.checklist.completed': 'All Done!',
  'main-page.quickLinks.title': 'Quick Actions',
  'main-page.quickLinks.sendChat': 'Start Chatting',
  'main-page.quickLinks.embedDocument': 'Upload Document',
  'main-page.quickLinks.createWorkspace': 'Create Workspace',
  'main-page.exploreMore.title': 'Explore Features',
  'main-page.exploreMore.features.customAgents.title': 'Custom Agents',
  'main-page.exploreMore.features.customAgents.description': 'Create specialized AI agents for your workflows',
  'main-page.exploreMore.features.customAgents.primaryAction': 'Learn More',
  'main-page.exploreMore.features.customAgents.secondaryAction': 'View Agents',
  'main-page.exploreMore.features.slashCommands.title': 'Slash Commands',
  'main-page.exploreMore.features.slashCommands.description': 'Use shortcuts to quickly access features',
  'main-page.exploreMore.features.slashCommands.primaryAction': 'Learn More',
  'main-page.exploreMore.features.slashCommands.secondaryAction': 'View Commands',
  'main-page.exploreMore.features.systemPrompts.title': 'System Prompts',
  'main-page.exploreMore.features.systemPrompts.description': 'Configure AI behavior with custom prompts',
  'main-page.exploreMore.features.systemPrompts.primaryAction': 'Learn More',
  'main-page.exploreMore.features.systemPrompts.secondaryAction': 'Manage Prompts',
  'main-page.resources.title': 'Resources',
  'main-page.resources.links.docs': 'Documentation',
  'main-page.resources.links.star': 'Star on GitHub',
  'main-page.resources.keyboardShortcuts': 'Keyboard Shortcuts',
  'workspaces—settings.general': 'General',
  'workspaces—settings.chat': 'Chat',
  'workspaces—settings.vector': 'Vector Database',
  'workspaces—settings.members': 'Members',
  'workspaces—settings.agent': 'Agent'
};

export function useTranslation() {
  // Mock t function with simple translation mapping
  const t = (key, options = {}) => {
    if (typeof key === 'string') {
      // Get translation from our mapping, fallback to key
      let result = translations[key] || key;
      
      // Handle interpolation if needed
      if (options && typeof options === 'object') {
        Object.keys(options).forEach(optionKey => {
          result = result.replace(`{{${optionKey}}}`, options[optionKey]);
        });
      }
      return result;
    }
    return key;
  };

  return {
    t,
    i18n: {
      language: 'en',
      changeLanguage: () => {},
    },
  };
}

// Mock resources for compatibility with @/locales/resources imports
export const resources = {
  en: {
    common: {}
  }
};

// Export default for compatibility
export default {
  language: 'en',
  changeLanguage: () => {},
  t: (key) => key,
};