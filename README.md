# CareWell Report

เว็บนำเข้าข้อมูลจาก CSV และสรุปเป็นสไลด์นำเสนอ ข้อมูลเก็บใน Supabase

## เริ่มต้นใช้งาน

1. **สร้างตารางใน Supabase** — เปิด [Supabase SQL Editor](https://supabase.com/dashboard/project/kdbeyokcdnsdenzickkw/sql/new)
   แล้ววางเนื้อหาจาก [`supabase/schema.sql`](supabase/schema.sql) ทั้งไฟล์ กด Run (ครั้งเดียวพอ)
2. รันเซิร์ฟเวอร์:

   ```bash
   npm run dev
   ```

3. เปิด [http://localhost:3000](http://localhost:3000)
   - **นำเข้าข้อมูล** (`/data`) — อัปโหลดไฟล์ CSV ทั้ง 3 ชุด (อัปโหลดซ้ำได้ ระบบจะอัปเดตแถวเดิมแทนการสร้างซ้ำ)
   - **สไลด์นำเสนอ** (`/slides`) — สรุปภาพรวมแบบสไลด์ เลื่อนด้วยปุ่มลูกศรซ้าย/ขวาบนคีย์บอร์ด หรือปุ่มบนหน้าจอ

## โครงสร้างข้อมูล

- `line_oa_daily_stats` — สถิติผู้ติดตาม Line OA รายวัน ของ `@carewellteam` และ `@carewell` (คอลัมน์ CSV: `date, contacts, targetReaches, blocks`)
- `caregivers` — ผู้ดูแลที่ลงทะเบียนในระบบ (คอลัมน์ CSV ภาษาไทยตามที่ระบบ export)

ทั้งสองตารางเปิด Row Level Security ไว้และไม่มี policy ให้ฝั่ง anon/public เลย —
แอปนี้เข้าถึงฐานข้อมูลจากฝั่งเซิร์ฟเวอร์เท่านั้นโดยใช้ `SUPABASE_SERVICE_ROLE_KEY`
(ดู `src/lib/supabase-admin.ts`) ซึ่งอ่านจาก `.env.local` — **ห้าม commit ไฟล์นี้หรือแชร์ service role key**

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + Supabase + Recharts
