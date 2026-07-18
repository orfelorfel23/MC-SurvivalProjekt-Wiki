INSERT INTO user_roles (id, "userId", role, "createdAt") SELECT gen_random_uuid(), id, 'ADMIN', NOW() FROM "user" WHERE email = 'editor@test.com' ON CONFLICT DO NOTHING;
