-- 007_create_approvals_and_notifications.sql

-- Create data_approvals table
CREATE TABLE IF NOT EXISTS data_approvals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module text NOT NULL,
  tab text NOT NULL,
  year int NOT NULL,
  submitted_by uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  changes jsonb NOT NULL,
  comments text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  type text NOT NULL, -- 'approval_request', 'approval_approved', 'approval_rejected'
  reference_id uuid REFERENCES data_approvals(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Policies for data_approvals
ALTER TABLE data_approvals ENABLE ROW LEVEL SECURITY;

-- Everyone can insert a data approval request
CREATE POLICY "Users can submit approvals"
  ON data_approvals FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

-- Users can see their own approvals, superadmins can see all
CREATE POLICY "Users can view their approvals and superadmins see all"
  ON data_approvals FOR SELECT
  USING (
    auth.uid() = submitted_by 
    OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Only superadmins can update approvals (approve/reject)
CREATE POLICY "Superadmins can update approvals"
  ON data_approvals FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System functions (like auth triggers) or Superadmins can insert notifications
CREATE POLICY "Superadmins can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
    OR
    auth.uid() IN (SELECT submitted_by FROM data_approvals WHERE id = reference_id)
  );

-- Enable Realtime for notifications to allow instant in-app alerts
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
