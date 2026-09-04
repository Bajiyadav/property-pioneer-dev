import postgres from 'postgres';

if (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') {
  console.error("❌ FATAL: Profile sync script is strictly forbidden in PRODUCTION!");
  process.exit(1);
}

const connectionString = process.env.STAGING_DATABASE_URL ||
  "postgresql://neondb_owner:npg_5HcF2rMSXTaE@ep-odd-term-aege7qm2-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

if (!connectionString.includes("neon.tech") && !connectionString.includes("localhost") && !connectionString.includes("staging")) {
  console.error("❌ FATAL: Script may ONLY run against staging (neon.tech) or localhost!");
  process.exit(1);
}

async function syncProfiles() {
  const sql = postgres(connectionString);
  const users = await sql`SELECT id, email, full_name, phone, role FROM users WHERE email LIKE '%qa@%' OR email LIKE '%root%';`;
  for (const u of users) {
    const appRole = u.role.toLowerCase() === 'seeker' ? 'customer' : u.role.toLowerCase();
    try {
      await sql`
        INSERT INTO profiles (id, email, full_name, phone, role)
        VALUES (${u.id}, ${u.email}, ${u.full_name}, ${u.phone}, ${appRole})
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role;
      `;
      console.log(`✅ Synced profile for: ${u.email} as ${appRole}`);
    } catch (e) {
      console.error(`Failed for ${u.email}:`, e.message);
    }
  }
  await sql.end();
}

syncProfiles();
