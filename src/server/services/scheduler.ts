/**
 * Automatic Task Schedule Alert Engine
 * Runs via node-cron every 2 minutes
 * Automatically sends:
 * 1. "Before due" alert: 1 day/hours before task is due (sent once)
 * 2. "Overdue" alert: if due date passed and task not completed (max 3 times)
 * Writes directly to SQLite notifications table and updates task tracking columns
 */

import cron from 'node-cron';
import { getDatabase } from '../database/sqlite.ts';

let schedulerRunning = false;

export function initTaskScheduler() {
  if (schedulerRunning) return;
  schedulerRunning = true;
  console.log('⏰ Initializing NammaKrushi Automatic Task Alert Scheduler (node-cron)...');

  // Run every 2 minutes
  cron.schedule('*/2 * * * *', () => {
    try {
      checkAndDispatchAlerts();
    } catch (err) {
      console.error('[Task Scheduler Error]:', err);
    }
  });

  // Also run an immediate check on server boot
  const timer = setTimeout(() => {
    try {
      checkAndDispatchAlerts();
    } catch (err) {
      console.error('[Initial Task Alert Check Error]:', err);
    }
  }, 3000);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
}

export function checkAndDispatchAlerts() {
  const db = getDatabase();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // 1. "BEFORE DUE" ALERTS: Tasks due today or tomorrow with alert_before_sent = 0
  const upcomingTasks = db.prepare(`
    SELECT * FROM tasks 
    WHERE status = 'Pending' 
      AND alert_before_sent = 0 
      AND (dueDate = ? OR dueDate = ?)
  `).all(todayStr, tomorrowStr) as any[];

  for (const task of upcomingTasks) {
    const isToday = task.dueDate === todayStr;
    const title = isToday 
      ? `⏰ Task Due Today: ${task.title}` 
      : `📅 Upcoming Task Tomorrow: ${task.title}`;
    const message = `Scheduled activity '${task.title}' in ${task.fieldSector} is due ${isToday ? 'today' : 'tomorrow (' + task.dueDate + ')'}. Assigned to: ${task.assignedTo || 'Farm Team'}.`;

    // Insert in-app notification
    const notifId = `notif-auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      notifId,
      task.user_id || 'usr-farmer-01',
      title,
      message,
      'task',
      0,
      'tasks'
    );

    // Mark alert_before_sent = 1 and update last_alert_at
    db.prepare(`
      UPDATE tasks 
      SET alert_before_sent = 1, last_alert_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(task.id);

    console.log(`[Task Scheduler] Dispatched Before-Due Alert for: "${task.title}"`);
  }

  // 2. "OVERDUE" ALERTS: Due date is in the past, status = 'Pending', and overdue_alert_count < 3
  const overdueTasks = db.prepare(`
    SELECT * FROM tasks 
    WHERE status = 'Pending' 
      AND dueDate < ? 
      AND overdue_alert_count < 3
  `).all(todayStr) as any[];

  for (const task of overdueTasks) {
    const nextCount = (task.overdue_alert_count || 0) + 1;
    const title = `🚨 Overdue Task Alert (${nextCount}/3): ${task.title}`;
    const message = `Critical reminder: Task '${task.title}' was due on ${task.dueDate} in ${task.fieldSector} and is still pending completion. Please complete and check off in Task Schedule.`;

    const notifId = `notif-overdue-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      notifId,
      task.user_id || 'usr-farmer-01',
      title,
      message,
      'task',
      0,
      'tasks'
    );

    // Increment overdue count
    db.prepare(`
      UPDATE tasks 
      SET overdue_alert_count = overdue_alert_count + 1, last_alert_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(task.id);

    console.log(`[Task Scheduler] Dispatched Overdue Alert (${nextCount}/3) for: "${task.title}"`);
  }
}
