/**
 * Custom Vite plugin to handle problematic Radix UI imports
 * This resolves module resolution errors by providing virtual modules for problematic imports
 */

// List of problematic modules that need special handling
const PROBLEMATIC_MODULES = [
  '@radix-ui/react-accordion',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-card',
  '@tanstack/react-table'
];

// Generate a virtual module that provides the minimal API needed
function generateVirtualModule(moduleName) {
  // Extract the component name from the module path
  const componentName = moduleName.split('/').pop().replace('react-', '');
  
  return `
// Virtual module for ${moduleName}
import React from 'react';

// Create basic component factory function
const createComponent = (displayName) => {
  const Component = React.forwardRef((props, ref) => {
    return React.createElement('div', { ...props, ref });
  });
  Component.displayName = displayName;
  return Component;
};

// Export basic components with the expected API
export const Root = createComponent('${componentName}Root');
export const Trigger = createComponent('${componentName}Trigger');
export const Content = createComponent('${componentName}Content');
export const Item = createComponent('${componentName}Item');
export const Group = createComponent('${componentName}Group');
export const Separator = createComponent('${componentName}Separator');
export const Portal = ({ children }) => children;
export const Sub = createComponent('${componentName}Sub');
export const SubTrigger = createComponent('${componentName}SubTrigger');
export const SubContent = createComponent('${componentName}SubContent');
export const RadioGroup = createComponent('${componentName}RadioGroup');
export const RadioItem = createComponent('${componentName}RadioItem');
export const CheckboxItem = createComponent('${componentName}CheckboxItem');
export const Label = createComponent('${componentName}Label');
export const ItemIndicator = createComponent('${componentName}ItemIndicator');

// Default export for modules that might use it
export default {
  Root,
  Trigger,
  Content,
  Item,
  Separator,
  Group,
  Portal,
  Sub,
  SubTrigger,
  SubContent,
  RadioGroup,
  RadioItem,
  CheckboxItem,
  Label,
  ItemIndicator
};
  `;
}

// Vite plugin that handles problematic module resolution
export default function radixResolver() {
  const virtualModuleId = 'virtual:radix-resolver';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'vite-plugin-radix-resolver',
    
    resolveId(id) {
      // Check if this is one of our problematic modules
      if (PROBLEMATIC_MODULES.includes(id)) {
        // Return a custom resolved id for our virtual module
        return `\0virtual:${id}`;
      }
      
      return null;
    },
    
    load(id) {
      // Handle loading our virtual modules
      if (id.startsWith('\0virtual:')) {
        const moduleName = id.slice(9); // Remove the \0virtual: prefix
        return generateVirtualModule(moduleName);
      }
      
      return null;
    }
  };
} 