-- A guest's first step, before "Invited" (owner's call, 9 Oct 2026):
--
--   To invite → Invited ('pending') → Coming ('attending') / Can't come ('declined')
--
-- New guests start at 'to_invite': on the list, invitation not sent yet.
-- "We've sent them" on the guest list moves everyone at 'to_invite' to
-- 'pending', which the app now calls "Invited". Existing answers are left
-- as they are. Covered by the existing rsvps policies.

alter type rsvp_status add value if not exists 'to_invite' before 'pending';
