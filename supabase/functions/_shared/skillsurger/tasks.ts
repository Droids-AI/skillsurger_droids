import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { learningResources } from './resources.js';
export async function startLearningTask(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const taskId = `task_${crypto.randomUUID()}`;
  const row = { id: taskId, user_id: userId, status: 'processing', progress: 'Searching for learning resources...', start_time: Date.now() };
  const inserted = await admin.from('skillsurger_learning_tasks').insert(row);
  if (inserted.error) throw new Error('Could not start the learning-path update');
  const work = (async () => {
    try {
      const resources = await learningResources(body);
      const result = await admin.from('skillsurger_learning_tasks').update({ status: 'completed', progress: 'Learning path updated successfully!', resources, end_time: Date.now() }).eq('id', taskId).eq('user_id', userId);
      if (result.error) throw new Error('Task result could not be saved');
    } catch (error) {
      // Reason only (provider/validation message), never the user's input.
      console.error(JSON.stringify({ area: 'skillsurger-learning-task', code: 'task_failed', taskId, reason: String((error as Error)?.message || error).slice(0, 160) }));
      const result = await admin.from('skillsurger_learning_tasks').update({ status: 'failed', progress: 'Learning-path update failed', error: 'Could not update the learning path. Please try again.', end_time: Date.now() }).eq('id', taskId).eq('user_id', userId);
      if (result.error) console.error(JSON.stringify({ area: 'skillsurger-learning-task', code: 'failure_receipt_failed', taskId }));
    }
  })();
  // Supabase keeps the worker alive after the initiation response returns.
  (globalThis as unknown as { EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void } }).EdgeRuntime.waitUntil(work);
  return { taskId, status: 'processing', message: 'Learning path update initiated. Please check status using the task ID.' };
}
export async function learningTaskStatus(admin: SupabaseClient, userId: string, taskId: string) {
  const result = await admin.from('skillsurger_learning_tasks').select('*').eq('id', taskId).eq('user_id', userId).maybeSingle();
  if (result.error || !result.data) throw new Error('Task not found');
  const task = result.data;
  if (task.status === 'processing' && Date.now() - task.start_time > 300000) {
    task.status = 'failed'; task.progress = 'Learning-path update timed out'; task.error = 'Please retry the learning-path update.'; task.end_time = Date.now();
    await admin.from('skillsurger_learning_tasks').update({ status: task.status, progress: task.progress, error: task.error, end_time: task.end_time }).eq('id', taskId).eq('user_id', userId);
  }
  return { taskId, status: task.status, progress: task.progress, ...(task.resources !== null ? { resources: task.resources } : {}), ...(task.error ? { error: task.error } : {}), startTime: task.start_time, ...(task.end_time ? { endTime: task.end_time } : {}) };
}
