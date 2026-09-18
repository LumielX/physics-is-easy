# คู่มือนำเว็บขึ้นใช้งานจริง (Deployment Guide)

คู่มือนี้พาคุณจากเครื่องของตัวเอง ไปจนถึงเว็บที่เพื่อน ครู หรือกรรมการสอบสัมภาษณ์
เปิดจากมือถือได้ทันทีโดยไม่ต้องล็อกอิน

**สรุปสั้น ๆ:** ใช้ **Vercel** ซึ่งฟรี รองรับ Next.js ดีที่สุด และได้ URL แบบ
`physics-is-easy.vercel.app` พร้อม HTTPS ให้อัตโนมัติ

---

## สารบัญ

1. [เตรียมตัวก่อน deploy](#1-เตรียมตัวก่อน-deploy)
2. [Build เวอร์ชันใช้งานจริง](#2-build-เวอร์ชันใช้งานจริง)
3. [เลือกบริการ hosting](#3-เลือกบริการ-hosting)
4. [นำขึ้น Vercel ทีละขั้นตอน](#4-นำขึ้น-vercel-ทีละขั้นตอน)
5. [ตั้งชื่อ URL ให้มีคำว่า physics-is-easy](#5-ตั้งชื่อ-url-ให้มีคำว่า-physics-is-easy)
6. [Environment Variables](#6-environment-variables)
7. [การตั้งค่าสำหรับ production](#7-การตั้งค่าสำหรับ-production)
8. [วิธีอัปเดตเว็บในอนาคต](#8-วิธีอัปเดตเว็บในอนาคต)
9. [แก้ปัญหาที่พบบ่อย](#9-แก้ปัญหาที่พบบ่อย)
10. [ทางเลือกอื่นนอกจาก Vercel](#10-ทางเลือกอื่นนอกจาก-vercel)

---

## 1. เตรียมตัวก่อน deploy

### สิ่งที่ต้องมี

- **Node.js 20 ขึ้นไป** — ตรวจด้วย `node --version`
- **บัญชี GitHub** — สมัครฟรีที่ [github.com](https://github.com)
- **บัญชี Vercel** — สมัครฟรีที่ [vercel.com](https://vercel.com) โดยกด "Continue with GitHub"

### ตรวจสุขภาพโปรเจกต์ก่อน

รันสามคำสั่งนี้ให้ผ่านทั้งหมดก่อน deploy เสมอ

```bash
npm run typecheck    # ต้องไม่มี error
npm test             # ต้องผ่านครบทุกข้อ
npm run build        # ต้องสร้างเสร็จโดยไม่มี error
```

ถ้าข้อใดไม่ผ่าน ให้แก้ก่อน — Vercel จะรันคำสั่งเดียวกันนี้บนเซิร์ฟเวอร์
ถ้าพังบนเครื่องคุณก็จะพังบนนั้นเหมือนกัน

---

## 2. Build เวอร์ชันใช้งานจริง

```bash
npm run build
```

ผลลัพธ์ที่ควรเห็น:

```
✓ Compiled successfully
✓ Generating static pages (81/81)

Route (app)
┌ ○ /
├ ● /lessons/m4/linear-motion
...
```

สัญลักษณ์มีความหมายดังนี้

| สัญลักษณ์ | ความหมาย |
| --- | --- |
| ○ Static | สร้างเป็นไฟล์ HTML ไว้แล้ว เปิดเร็วที่สุด |
| ● SSG | สร้างจาก `generateStaticParams` — บทเรียนทุกบทอยู่กลุ่มนี้ |
| ƒ Dynamic | สร้างตอนมีคนขอ (หน้า `/lessons` ที่มีตัวกรอง) |

ทดสอบเวอร์ชันที่ build แล้วบนเครื่องก่อน

```bash
npm start
```

เปิด `http://localhost:3000` แล้วลองกดดูให้ครบ: เปิดบทเรียน ลากสไลเดอร์ในเครื่องจำลอง
กดปุ่ม 3D สลับธีม และทำแบบทดสอบให้จบสักบท จากนั้นเปิด DevTools (กด F12)
ดูแท็บ Console ว่าไม่มีข้อความสีแดง

---

## 3. เลือกบริการ hosting

| บริการ | ฟรี? | เหมาะกับ Next.js | ความเห็น |
| --- | --- | --- | --- |
| **Vercel** | ✅ | ✅ ดีที่สุด | ผู้สร้าง Next.js เอง ตั้งค่าแทบเป็นศูนย์ **← แนะนำ** |
| Netlify | ✅ | ✅ ดี | ใช้ได้ดี ต้องลง adapter เพิ่มในบางกรณี |
| Cloudflare Pages | ✅ | ⚠️ พอใช้ | เร็วมากแต่ตั้งค่า Next.js ยุ่งกว่า |
| GitHub Pages | ✅ | ❌ | รองรับเฉพาะ static export ไม่เหมาะกับโปรเจกต์นี้ |

**คู่มือนี้ใช้ Vercel** เพราะตั้งค่าน้อยที่สุดและให้ทุกอย่างที่ต้องการฟรี:
HTTPS, CDN ทั่วโลก, การ deploy อัตโนมัติเมื่อแก้โค้ด และ preview ทุกครั้งที่เปิด pull request

---

## 4. นำขึ้น Vercel ทีละขั้นตอน

### ขั้นที่ 1 — เตรียม Git repository

ถ้ายังไม่เคยใช้ Git กับโปรเจกต์นี้ ให้เริ่มที่โฟลเดอร์โปรเจกต์

```bash
git init
git add .
git commit -m "Physics is Easy — initial release"
```

> โปรเจกต์มี `.gitignore` ที่กัน `node_modules/` และ `.next/` ไว้แล้ว ไม่ต้องกังวลว่าจะอัปโหลดไฟล์ขยะ

### ขั้นที่ 2 — สร้าง repository บน GitHub

1. ไปที่ [github.com/new](https://github.com/new)
2. ตั้งชื่อว่า `physics-is-easy`
3. เลือก **Public** (ถ้าอยากให้คนอื่นดูโค้ดได้) หรือ **Private** ก็ deploy ได้เหมือนกัน
4. **อย่า** ติ๊ก "Add a README" เพราะเรามีอยู่แล้ว
5. กด **Create repository**

### ขั้นที่ 3 — อัปโหลดโค้ดขึ้น GitHub

คัดลอกคำสั่งจากหน้าที่ GitHub แสดงให้ ซึ่งจะมีลักษณะนี้

```bash
git remote add origin https://github.com/<ชื่อผู้ใช้ของคุณ>/physics-is-easy.git
git branch -M main
git push -u origin main
```

### ขั้นที่ 4 — เชื่อม Vercel กับ GitHub

1. เข้า [vercel.com/new](https://vercel.com/new)
2. กด **Import Git Repository**
3. เลือก repo `physics-is-easy` (ถ้าไม่เห็น กด "Adjust GitHub App Permissions" เพื่อให้สิทธิ์)
4. Vercel จะตรวจพบว่าเป็น Next.js และเติมค่าให้เองทั้งหมด

| ช่อง | ค่าที่ควรเป็น |
| --- | --- |
| Framework Preset | Next.js |
| Build Command | `next build` (ค่าเริ่มต้น) |
| Output Directory | `.next` (ค่าเริ่มต้น) |
| Install Command | `npm install` (ค่าเริ่มต้น) |

**ไม่ต้องแก้อะไรเลย**

### ขั้นที่ 5 — กด Deploy

กดปุ่ม **Deploy** แล้วรอประมาณ 1–3 นาที เมื่อเสร็จจะเห็นหน้าจอฉลองพร้อมลิงก์
กดลิงก์นั้นเพื่อเปิดเว็บจริงของคุณ

🎉 **เว็บขึ้นออนไลน์แล้ว** ใครก็เปิดได้โดยไม่ต้องล็อกอิน

---

## 5. ตั้งชื่อ URL ให้มีคำว่า physics-is-easy

ตอนแรก Vercel จะให้ URL แบบ `physics-is-easy-abc123.vercel.app` ซึ่งมีตัวอักษรสุ่มต่อท้าย
เราตั้งให้สั้นและสวยกว่านั้นได้ฟรี

1. เข้าหน้าโปรเจกต์บน Vercel → **Settings** → **Domains**
2. ในช่อง input พิมพ์ `physics-is-easy.vercel.app`
3. กด **Add**

ถ้าชื่อนั้นมีคนใช้แล้ว ให้ลองชื่ออื่นที่ยังมีคำว่า physics-is-easy อยู่ เช่น

- `physics-is-easy-th.vercel.app`
- `physics-is-easy-narawit.vercel.app`
- `learn-physics-is-easy.vercel.app`

> **เรื่องโดเมน .com:** โดเมนแบบ `physics-is-easy.com` ต้องเสียเงินซื้อ
> ราวปีละ 300–500 บาท และต้องต่ออายุทุกปี สำหรับการใช้งานทั่วไปและการยื่น
> portfolio ซับโดเมนของ Vercel ทำงานได้เหมือนกันทุกประการ — มี HTTPS
> โหลดเร็วเท่ากัน และไม่มีวันหมดอายุ จึงแนะนำให้ใช้แบบฟรีไปก่อน
>
> ถ้าภายหลังซื้อโดเมนเองแล้ว ก็เพิ่มเข้ามาในหน้า Domains นี้ได้เลย
> แล้วตั้งค่า DNS ตามที่ Vercel บอก ใช้เวลาไม่เกิน 10 นาที

---

## 6. Environment Variables

โปรเจกต์นี้ทำงานได้โดย**ไม่ต้องตั้งค่าอะไรเลย** เพราะไม่มีฐานข้อมูลและไม่มี API key

แต่มีตัวแปรหนึ่งที่ควรตั้งเพื่อให้ SEO และการแชร์ลิงก์สมบูรณ์

| ชื่อตัวแปร | ค่า | ใช้ทำอะไร |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://physics-is-easy.vercel.app` | ใช้สร้าง sitemap.xml, robots.txt และ meta tag ตอนแชร์ลิงก์ |

วิธีตั้ง:

1. Vercel → **Settings** → **Environment Variables**
2. Key: `NEXT_PUBLIC_SITE_URL`
3. Value: URL จริงของคุณ (ใส่ `https://` ด้วย และ **ไม่ต้อง** ใส่ `/` ปิดท้าย)
4. เลือกทั้งสาม environment: Production, Preview, Development
5. กด **Save** แล้ว **Redeploy** หนึ่งครั้งเพื่อให้ค่ามีผล

> ถ้าไม่ตั้ง ระบบจะใช้ค่าเริ่มต้น `https://physics-is-easy.vercel.app` ซึ่งเว็บก็ยังทำงานปกติ

---

## 7. การตั้งค่าสำหรับ production

ส่วนใหญ่ตั้งไว้ในโค้ดแล้ว ไม่ต้องทำอะไรเพิ่ม แต่ควรรู้ว่ามีอะไรบ้าง

### Cache headers (ตั้งไว้แล้วใน `next.config.ts`)

```ts
// ไฟล์โมเดล 3 มิติ — เก็บแคชหนึ่งปี เพราะเปลี่ยนชื่อไฟล์เมื่อเนื้อหาเปลี่ยน
{ source: '/models/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }
```

ส่วน CSS, JS และ HTML ของ Next.js นั้น Vercel จัดการแคชให้อัตโนมัติอยู่แล้ว

### Security headers (ตั้งไว้แล้ว)

- `X-Content-Type-Options: nosniff` — กันเบราว์เซอร์เดาชนิดไฟล์ผิด
- `Referrer-Policy: strict-origin-when-cross-origin` — ไม่ส่ง URL เต็มไปเว็บอื่น
- `X-Frame-Options: SAMEORIGIN` — กันเว็บอื่นเอาเว็บเราไปฝังใน iframe

### สิ่งที่ Vercel ทำให้ฟรีโดยอัตโนมัติ

- **HTTPS** พร้อมใบรับรอง SSL และต่ออายุให้เอง
- **CDN ทั่วโลก** ผู้ใช้ในไทยจะโหลดจากเซิร์ฟเวอร์ที่ใกล้ที่สุด
- **การบีบอัด** Brotli และ Gzip
- **HTTP/2 และ HTTP/3**

### ตรวจสอบหลัง deploy

เปิดเว็บจริงแล้วเช็กรายการนี้

- [ ] หน้าแรกเปิดได้และแสดงจำนวนบทเรียนถูกต้อง
- [ ] เข้าบทเรียนได้ อ่านเนื้อหาและเห็นสมการเรนเดอร์สวยงาม
- [ ] ลากสไลเดอร์ในเครื่องจำลองแล้วภาพขยับตาม
- [ ] กดปุ่ม 3D แล้วฉากสามมิติโหลดได้ (หรือแจ้งว่าอุปกรณ์ไม่รองรับ)
- [ ] สลับธีมมืด–สว่างได้ และจำค่าไว้เมื่อรีเฟรช
- [ ] ทำแบบทดสอบแล้วได้คะแนนพร้อมคำแนะนำการทบทวน
- [ ] เปิดบนมือถือแล้วใช้งานได้จริง ไม่มีเนื้อหาล้นจอ
- [ ] เปิด `/sitemap.xml` แล้วเห็นรายการหน้าทั้งหมด

---

## 8. วิธีอัปเดตเว็บในอนาคต

นี่คือส่วนที่จะได้ใช้บ่อยที่สุด ขั้นตอนทั้งหมดมีแค่นี้

### ขั้นตอนมาตรฐาน

```bash
# 1. แก้โค้ดหรือเนื้อหาในเครื่อง แล้วทดสอบก่อนเสมอ
npm run dev          # ดูผลระหว่างแก้

# 2. ตรวจว่าไม่พัง
npm run typecheck
npm test

# 3. บันทึกการเปลี่ยนแปลง
git add .
git commit -m "เพิ่มตัวอย่างโจทย์ในบทที่ 5"

# 4. ส่งขึ้น GitHub
git push
```

**เท่านี้จบ** — Vercel จะเห็นการเปลี่ยนแปลงแล้ว build กับ deploy ให้อัตโนมัติภายใน 1–3 นาที
ไม่ต้องเข้าเว็บ Vercel เลย

### ตัวอย่างงานที่ทำบ่อย

**แก้คำผิดในบทเรียน**
เปิด `content/physics/m4/02-linear-motion.ts` แก้ข้อความ แล้ว commit + push

**เพิ่มโจทย์ใหม่**
เพิ่ม object ใน array `practice` ของบทนั้น โดยตั้ง `id` ไม่ให้ซ้ำกับข้ออื่น
(เทสต์จะฟ้องถ้าซ้ำ)

**เพิ่มบทเรียนใหม่ทั้งบท**
1. สร้างไฟล์ใหม่ใน `content/physics/<grade>/`
2. import เข้า `content/physics/index.ts`
3. push — เมนู ดัชนีค้นหา sitemap และหน้าสูตรอัปเดตตามเองทั้งหมด

**ดูตัวอย่างก่อนขึ้นจริง**
สร้าง branch ใหม่แล้ว push ขึ้นไป Vercel จะสร้าง URL สำหรับ preview ให้เอง
เมื่อพอใจแล้วค่อย merge เข้า `main`

```bash
git checkout -b add-chapter-20
# แก้ไข...
git push -u origin add-chapter-20
```

### ถ้า deploy แล้วมีปัญหา

Vercel เก็บ deployment ทุกครั้งไว้ ย้อนกลับได้ทันที

1. Vercel → **Deployments**
2. หาเวอร์ชันที่ยังทำงานดี
3. กดปุ่มสามจุด → **Promote to Production**

เว็บจะกลับไปเป็นเวอร์ชันนั้นภายในไม่กี่วินาที

---

## 9. แก้ปัญหาที่พบบ่อย

### Build ล้มเหลวบน Vercel แต่บนเครื่องผ่าน

**สาเหตุที่พบบ่อยที่สุด:** ตัวพิมพ์ใหญ่–เล็กในชื่อไฟล์
Windows ไม่แยกแยะ `Button.tsx` กับ `button.tsx` แต่เซิร์ฟเวอร์ของ Vercel (Linux) แยก

```tsx
// ❌ ถ้าไฟล์จริงชื่อ Button.tsx
import { Button } from '@/components/ui/button';

// ✅
import { Button } from '@/components/ui/Button';
```

**สาเหตุรองลงมา:** Node version ต่างกัน ตั้งได้ที่ Settings → General → Node.js Version
ให้เลือก 20 หรือใหม่กว่า

### ขึ้น "Module not found"

ตรวจว่า import ใช้ `@/` ซึ่งชี้ไปที่ราก project เสมอ และไฟล์นั้นถูก commit ขึ้น GitHub จริง

```bash
git status           # ดูว่ามีไฟล์ไหนยังไม่ได้ add
```

### หน้า 3D ไม่แสดงบนมือถือบางรุ่น

**นี่คือพฤติกรรมที่ออกแบบไว้** ไม่ใช่บั๊ก ระบบตรวจ WebGL และประสิทธิภาพจริง
ถ้าอุปกรณ์ไม่ไหวจะสลับกลับ 2D อัตโนมัติ ซึ่งให้ข้อมูลทางฟิสิกส์เหมือนกันทุกประการ

### สมการแสดงเป็นตัวหนังสือแปลก ๆ

แปลว่า CSS ของ KaTeX ไม่ถูกโหลด ตรวจว่ามีบรรทัดนี้ใน `app/layout.tsx`

```tsx
import 'katex/dist/katex.min.css';
```

### ธีมกะพริบเป็นสีขาวตอนโหลด

ตรวจว่า script ใน `<head>` ของ `app/layout.tsx` ยังอยู่ — มันคือสิ่งที่อ่านค่าธีม
จาก localStorage มาใส่ก่อนหน้าจะวาดครั้งแรก

### เว็บช้าผิดปกติ

1. เปิด DevTools → Network → ดูว่าไฟล์ไหนใหญ่ผิดปกติ
2. ถ้าเป็นไฟล์ `.glb` ให้รัน `npm run models:build` ใหม่เพื่อบีบอัดด้วย Draco
3. ตรวจว่าไม่ได้ import three.js เข้ามาตรง ๆ ในหน้าที่ไม่ใช้ 3D

### ความคืบหน้าการเรียนหายไป

ข้อมูลเก็บใน localStorage ของเบราว์เซอร์นั้น ๆ จึงหายเมื่อ

- ล้างข้อมูลเบราว์เซอร์
- เปิดในโหมดไม่ระบุตัวตน
- เปลี่ยนเครื่องหรือเปลี่ยนเบราว์เซอร์

**นี่เป็นข้อแลกเปลี่ยนที่ตั้งใจ** เพื่อให้ใช้งานได้โดยไม่ต้องสมัครสมาชิก
(บันทึกไว้ใน DECISIONS.md ข้อ D-010)

---

## 10. ทางเลือกอื่นนอกจาก Vercel

### Netlify

1. สมัครที่ [netlify.com](https://netlify.com) ด้วย GitHub
2. **Add new site** → **Import an existing project**
3. เลือก repo แล้วตั้งค่า
   - Build command: `npm run build`
   - Publish directory: `.next`
4. ติดตั้งปลั๊กอิน **Next.js Runtime** เมื่อ Netlify แนะนำ

### Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages**
2. เชื่อม GitHub แล้วเลือก repo
3. Framework preset: **Next.js**
4. อาจต้องตั้ง compatibility flag `nodejs_compat` ในหน้า Settings

### รันบนเซิร์ฟเวอร์ของตัวเอง (VPS)

```bash
git clone <repo-url>
cd physics-is-easy
npm ci
npm run build
npx pm2 start npm --name physics -- start   # ให้รันต่อเนื่องแม้ปิด terminal
```

แล้วตั้ง nginx เป็น reverse proxy ชี้ไปที่ `localhost:3000` พร้อมติดตั้ง SSL
ด้วย certbot วิธีนี้ควบคุมได้มากที่สุดแต่ต้องดูแลเซิร์ฟเวอร์เอง

---

## สรุปคำสั่งที่ใช้บ่อย

```bash
npm run dev          # พัฒนา
npm run build        # build
npm start            # รันเวอร์ชัน production บนเครื่อง
npm test             # รันเทสต์
npm run typecheck    # ตรวจชนิดข้อมูล
npm run models:build # สร้างโมเดล 3 มิติใหม่

git add .            # เตรียมไฟล์ที่แก้
git commit -m "..."  # บันทึก
git push             # ส่งขึ้น GitHub → Vercel deploy อัตโนมัติ
```

---

**Created by Narawit Luekhajon**
