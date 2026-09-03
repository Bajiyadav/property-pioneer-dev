import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const connectionString = "postgresql://neondb_owner:npg_5HcF2rMSXTaE@ep-odd-term-aege7qm2-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const QA_USERS = [
  {
    email: "customer.qa@urbanproperties.in",
    password: "Customer@Urban2026!",
    fullName: "QA Customer Test",
    phone: "+919876543210",
    role: "SEEKER",
  },
  {
    email: "owner.qa@urbanproperties.in",
    password: "Owner@Urban2026!",
    fullName: "QA Owner Test",
    phone: "+919876543211",
    role: "OWNER",
  },
  {
    email: "agent.qa@urbanproperties.in",
    password: "Agent@Urban2026!",
    fullName: "QA Agent Test",
    phone: "+919876543212",
    role: "AGENT",
  },
  {
    email: "admin.qa@urbanproperties.in",
    password: "Admin@Urban2026!",
    fullName: "QA Admin Test",
    phone: "+919876543213",
    role: "ADMIN",
  },
  {
    email: "root@seedhaproperties.com",
    password: "RootAdmin@2026!",
    fullName: "Root Admin",
    phone: "+919876543214",
    role: "ADMIN",
  },
];

async function seed() {
  const sql = postgres(connectionString);
  console.log("Connecting to PostgreSQL to seed QA users...");

  for (const u of QA_USERS) {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(u.password, salt);

    const existing = await sql`SELECT id FROM users WHERE email = ${u.email.toLowerCase()};`;
    if (existing.length > 0) {
      await sql`
        UPDATE users
        SET password_hash = ${hash},
            full_name = ${u.fullName},
            phone = ${u.phone},
            role = ${u.role}
        WHERE email = ${u.email.toLowerCase()};
      `;
      console.log(`✅ Updated existing QA user: ${u.email} (Role: ${u.role})`);
    } else {
      await sql`
        INSERT INTO users (id, email, password_hash, full_name, phone, role)
        VALUES (gen_random_uuid(), ${u.email.toLowerCase()}, ${hash}, ${u.fullName}, ${u.phone}, ${u.role});
      `;
      console.log(`✅ Created QA user: ${u.email} (Role: ${u.role})`);
    }
  }

  // Also check if public.profiles exists and update/insert to keep Supabase parity if needed
  try {
    for (const u of QA_USERS) {
      const userRow = await sql`SELECT id FROM users WHERE email = ${u.email.toLowerCase()};`;
      if (userRow.length > 0) {
        const userId = userRow[0].id;
        await sql`
          INSERT INTO profiles (id, email, full_name, phone, role)
          VALUES (${userId}, ${u.email.toLowerCase()}, ${u.fullName}, ${u.phone}, ${u.role.toLowerCase()})
          ON CONFLICT (id) DO UPDATE
          SET email = EXCLUDED.email,
              full_name = EXCLUDED.full_name,
              phone = EXCLUDED.phone,
              role = EXCLUDED.role;
        `;
        console.log(`✅ Synced profile record for: ${u.email}`);
      }
    }
  } catch (err) {
    console.log("Profiles sync info:", err.message);
  }

  const all = await sql`SELECT email, full_name, role FROM users WHERE email LIKE '%qa@%' OR email LIKE '%root%';`;
  console.log("Seeded QA accounts in DB:", all);

  await sql.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
