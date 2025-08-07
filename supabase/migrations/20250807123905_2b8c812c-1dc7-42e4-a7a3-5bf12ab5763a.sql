
-- Add foreign key constraint from workspace_members.user_id to profiles.user_id
ALTER TABLE workspace_members 
ADD CONSTRAINT fk_workspace_members_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
