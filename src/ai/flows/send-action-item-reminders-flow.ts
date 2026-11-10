
'use server';
/**
 * @fileOverview A Genkit flow for sending reminders for due action items.
 *
 * - sendActionItemReminders - A function that finds due action items and sends a summary email.
 * - SendActionItemRemindersInput - The input type for the function.
 * - SendActionItemRemindersOutput - The return type for the function.
 */

import { verifiedClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/email';
import {z} from 'genkit';

import { collection, query, where, getDocs, doc, getDoc, addDoc, Timestamp } from '@/lib/supabase/records';
import type { SheMeeting, MeetingActionItem, UserProfile } from '@/lib/types';
import { format, parseISO, differenceInDays, isPast, isValid } from 'date-fns';

const SendActionItemRemindersInputSchema = z.object({
  accessToken: z.string().min(1),
});
export type SendActionItemRemindersInput = z.infer<typeof SendActionItemRemindersInputSchema>;

const SendActionItemRemindersOutputSchema = z.object({
  message: z.string().describe("A summary message indicating the result of the operation."),
  remindersSent: z.number().describe("The number of action items for which reminders were sent."),
});
export type SendActionItemRemindersOutput = z.infer<typeof SendActionItemRemindersOutputSchema>;

// This is the main function that will be called from the frontend.
export async function sendActionItemReminders(
  input: SendActionItemRemindersInput
): Promise<SendActionItemRemindersOutput> {
    const {client,user}=await verifiedClient(input.accessToken);
    const userId=user.id;
    const db={client};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const REMINDER_DAYS = 7;

    // 1. Fetch user's email from their profile
    const userProfileRef = doc(db, 'userProfiles', userId);
    const userProfileSnap = await getDoc(userProfileRef);
    if (!userProfileSnap.exists()) {
      throw new Error("User profile not found to send email to.");
    }
    const userProfile = userProfileSnap.data() as UserProfile;
    const recipientEmail = userProfile.email;

    // 2. Fetch all meetings for the user
    const meetingsQuery = query(collection(db, 'sheMeetings'), where("userId", "==", userId));
    const meetingsSnapshot = await getDocs(meetingsQuery);
    const meetings: SheMeeting[] = meetingsSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as SheMeeting);

    // 3. Find all due or overdue action items
    const dueActionItems: Array<MeetingActionItem & { meetingTitle: string }> = [];
    meetings.forEach(meeting => {
      (meeting.actionItems || []).forEach(item => {
        if ((item.status === 'Open' || item.status === 'In Progress') && item.dueDate) {
          const dueDateObj = (item.dueDate as unknown) instanceof Timestamp ? (item.dueDate as unknown as Timestamp).toDate() : parseISO(item.dueDate);
          if (isValid(dueDateObj)) {
            const daysUntilDue = differenceInDays(dueDateObj, today);
            if (isPast(dueDateObj) || (daysUntilDue >= 0 && daysUntilDue <= REMINDER_DAYS)) {
              dueActionItems.push({ ...item, dueDate: dueDateObj.toISOString(), meetingTitle: meeting.title });
            }
          }
        }
      });
    });

    if (dueActionItems.length === 0) {
      return { message: "No action items are currently due or overdue.", remindersSent: 0 };
    }

    // 4. Construct the email body
    const emailHtmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1>SHE Meeting Action Item Reminders</h1>
            <p>This is a summary of open or in-progress action items that are either overdue or due within the next ${REMINDER_DAYS} days.</p>
            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-size: 10pt;">
                <thead style="background-color: #f2f2f2;">
                    <tr>
                        <th style="text-align: left;">Description</th>
                        <th style="text-align: left;">Assigned To</th>
                        <th style="text-align: left;">Due Date</th>
                        <th style="text-align: left;">Status</th>
                        <th style="text-align: left;">Meeting</th>
                    </tr>
                </thead>
                <tbody>
                    ${dueActionItems.map(item => `
                        <tr>
                            <td>${escapeHtml(item.description)}</td>
                            <td>${escapeHtml(item.assignedTo)}</td>
                            <td style="${isPast(parseISO(item.dueDate!)) ? 'color: red; font-weight: bold;' : ''}">${format(parseISO(item.dueDate!), 'PPP')}</td>
                            <td>${escapeHtml(item.status)}</td>
                            <td>${escapeHtml(item.meetingTitle)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p style="margin-top: 20px;">Please review and update the status of these items in the SHEiQpro application.</p>
        </div>
    `;

    await sendEmail(recipientEmail,`[Reminder] ${dueActionItems.length} SHE Action Items Due`,emailHtmlBody);

    return {
      message: `Reminder email for ${dueActionItems.length} action item(s) has been sent to ${recipientEmail}.`,
      remindersSent: dueActionItems.length,
    };
}
