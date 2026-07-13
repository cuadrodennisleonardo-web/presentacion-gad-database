-- Diagnostic to check the latest created user
SELECT 
  u.id,
  u.email,
  u.encrypted_password IS NOT NULL AS has_password,
  left(u.encrypted_password, 7) AS hash_prefix,
  u.raw_user_meta_data,
  i.provider_id,
  i.identity_data
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
ORDER BY u.created_at DESC
LIMIT 2;
