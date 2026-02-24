-- Fix existing submissions with NULL archived values
UPDATE contact_submissions 
SET archived = false 
WHERE archived IS NULL;
