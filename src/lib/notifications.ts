import { supabase } from './supabase';

export type NotificationType = 'sale' | 'commission' | 'order_status' | 'system' | 'withdrawal' | 'product';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  link: string = ''
) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        link,
        read: false
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}
