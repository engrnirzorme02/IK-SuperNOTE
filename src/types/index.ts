export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
  lastLoginAt?: string;
  notificationPreferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  studyAlerts: boolean;
  syncUpdates: boolean;
  newContent: boolean;
  pushEnabled: boolean;
}

export interface NoteItem {
  id: string;
  userId?: string;
  title: string;
  content: string;
  category: 'Notes' | 'Study' | 'Summary' | 'Idea';
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  syncedAt?: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'CREATE_NOTE' | 'UPDATE_NOTE' | 'DELETE_NOTE' | 'SAVE_CHAT';
  payload: any;
  timestamp: string;
  retries: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'content' | 'update' | 'alert';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  content?: string;
  base64?: string;
  summary?: string;
  category?: string;
}

