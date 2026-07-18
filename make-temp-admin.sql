INSERT INTO user_roles (id, "userId", role, "createdAt") SELECT gen_random_uuid(), id, 'ADMIN', NOW() FROM "user" WHERE email = 'admin@temp.com' ON CONFLICT DO NOTHING;
