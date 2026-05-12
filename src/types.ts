export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
}

export enum PostType {
  NOTICE = 'notice',
  FREE = 'free',
  CLASSROOM = 'classroom',
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  type: PostType;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: any;
}

export interface SharedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedBy: string;
  uploaderName: string;
  createdAt: any;
}

export interface SystemLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: any;
}

export interface ScheduleItem {
  id: string;
  period: string;
  subject: string;
  time: string;
  order: number;
}

export interface Meal {
  id: string;
  menu: string[];
  calories: string;
  date: string;
}
