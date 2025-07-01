// Webflow Designer API utilities

export async function getSelectedElement() {
  try {
    if (typeof webflow !== 'undefined' && webflow.getSelectedElement) {
      return await webflow.getSelectedElement();
    }
    return null;
  } catch (error) {
    console.error('Error getting selected element:', error);
    return null;
  }
}

export function subscribeToSelectionChange(callback) {
  try {
    if (typeof webflow !== 'undefined' && webflow.subscribeToElementSelectionChange) {
      return webflow.subscribeToElementSelectionChange(callback);
    }
  } catch (error) {
    console.error('Error subscribing to selection change:', error);
  }
  return null;
}

export async function getSiteId() {
  try {
    if (typeof webflow !== 'undefined' && webflow.getSiteInfo) {
      const siteInfo = await webflow.getSiteInfo();
      return siteInfo.siteId;
    }
    return null;
  } catch (error) {
    console.error('Error getting site ID:', error);
    return null;
  }
}

export async function getPageInfo() {
  try {
    if (typeof webflow !== 'undefined' && webflow.getPageInfo) {
      return await webflow.getPageInfo();
    }
    return null;
  } catch (error) {
    console.error('Error getting page info:', error);
    return null;
  }
}

export async function updateElementAttribute(element, attribute, value) {
  try {
    if (typeof webflow !== 'undefined' && webflow.setElementAttribute) {
      return await webflow.setElementAttribute(element, attribute, value);
    }
  } catch (error) {
    console.error('Error updating element attribute:', error);
  }
}