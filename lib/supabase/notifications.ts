// Simple in-memory notifications module

export interface Notification {
  id: string
  message: string
  type: 'report' | 'verification' | 'match' | 'return'
  relatedItemId?: string
  isRead: boolean
  createdAt: string
}

// Store notifications in localStorage on client side
const STORAGE_KEY = 'lost_and_found_notifications';

/**
 * Get notifications for a specific user
 */
export function getUserNotifications(userId: string): Notification[] {
  // This function is client-side only
  if (typeof window === 'undefined') return [];
  
  try {
    const storedNotifications = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (!storedNotifications) return getDefaultNotifications();
    
    return JSON.parse(storedNotifications);
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    return getDefaultNotifications();
  }
}

/**
 * Add a new notification for a user
 */
export function addNotification(
  userId: string,
  notification: Omit<Notification, 'id' | 'createdAt'>
): boolean {
  // This function is client-side only
  if (typeof window === 'undefined') return false;
  
  try {
    const notifications = getUserNotifications(userId);
    
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updatedNotifications));
    
    return true;
  } catch (error) {
    console.error("Error adding notification:", error);
    return false;
  }
}

/**
 * Mark a notification as read
 */
export function markNotificationAsRead(userId: string, notificationId: string): boolean {
  // This function is client-side only
  if (typeof window === 'undefined') return false;
  
  try {
    const notifications = getUserNotifications(userId);
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true } 
        : notification
    );
    
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updatedNotifications));
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

/**
 * Mark all user notifications as read
 */
export function markAllNotificationsAsRead(userId: string): boolean {
  // This function is client-side only
  if (typeof window === 'undefined') return false;
  
  try {
    const notifications = getUserNotifications(userId);
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true
    }));
    
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updatedNotifications));
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

/**
 * Delete a notification
 */
export function deleteNotification(userId: string, notificationId: string): boolean {
  // This function is client-side only
  if (typeof window === 'undefined') return false;
  
  try {
    const notifications = getUserNotifications(userId);
    const updatedNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );
    
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updatedNotifications));
    return true;
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(userId: string): boolean {
  // This function is client-side only
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return false;
  }
}

// Helper: Generate a simple ID for notifications
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Helper: Get default notifications when none exist yet
function getDefaultNotifications(): Notification[] {
  return [
    {
      id: "notification1",
      message: "Your lost item 'Black Laptop Bag' has been reported successfully.",
      type: "report",
      isRead: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "notification2",
      message: "A potential match has been found for your lost 'Blue Water Bottle'.",
      type: "match",
      isRead: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "notification3",
      message: "Security has verified your found item report.",
      type: "verification",
      isRead: true,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
} 