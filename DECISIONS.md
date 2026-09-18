# DECISIONS.md — บันทึกการตัดสินใจเชิงสถาปัตยกรรม

บันทึกเหตุผลของทุกการตัดสินใจสำคัญ เพื่อให้คนที่มาทำต่อ (หรือตัวเราเองในอีก 6 เดือน) เข้าใจว่าทำไมถึงเลือกแบบนี้

---

## D-001 · Framework: Next.js 16 (App Router)

**เลือก:** Next.js 16 App Router
**ทางเลือกอื่น:** Vite + React Router, Astro
**เหตุผล:**
- เนื้อหาบทเรียนเป็น static ทั้งหมด → `generateStaticParams` ทำให้ทุกบทเป็น SSG, HTML พร้อมใช้ทันที (ดีต่อ FCP และ SEO ภาษาไทย)
- React Server Components ทำให้เนื้อหา 19 บท (ซึ่งใหญ่) ไม่ถูกส่งเป็น JS ไปที่เบราว์เซอร์เลย — ส่งเฉพาะ HTML ส่วน simulator เท่านั้นที่เป็น client component
- Route-based code splitting มาในตัว → หน้าที่ไม่มี 3D จะไม่โหลด three.js
- Deploy ฟรีบน Vercel ได้ตรง ๆ ตามข้อกำหนด

---

## D-002 · React 19.2.8 (ไม่ใช่ 19.3)

**เลือก:** pin `react@19.2.8` / `react-dom@19.2.8`
**เหตุผล:** `@react-three/fiber@9.7` ประกาศ peer `react@">=19 <19.3"` การใช้ 19.3 ทำให้ npm resolve ไม่ผ่าน และเสี่ยง reconciler ไม่ตรงรุ่น Next 16 รองรับ `^19.0.0` อยู่แล้วจึงไม่เสียอะไร
**เมื่อไรควรทบทวน:** เมื่อ r3f ปล่อยรุ่นที่รองรับ React 19.3+ → อัป pin ได้ทันที

---

## D-003 · Styling: Tailwind CSS v4 + CSS variables

**เลือก:** Tailwind v4 (CSS-first `@theme`) ร่วมกับ CSS custom properties
**ทางเลือกอื่น:** CSS Modules ล้วน, styled-components (runtime CSS-in-JS)
**เหตุผล:**
- ธีม Light/Dark และ accent color ต่อหมวดบท ต้องสลับได้ทันทีโดยไม่ re-render React → CSS variables คือคำตอบที่ถูกที่สุด (สลับที่ `<html data-theme>` / `data-accent`)
- Tailwind v4 ไม่ต้องมี `tailwind.config.js` และ build เร็วกว่า v3 มาก
- ไม่เลือก CSS-in-JS เพราะมี runtime cost และขัดกับ RSC

---

## D-004 · Content เป็น TypeScript module ไม่ใช่ MDX

**เลือก:** เนื้อหาแต่ละบทเป็นไฟล์ `.ts` ที่ export object ตาม schema `Chapter`
**ทางเลือกอื่น:** MDX, JSON, headless CMS
**เหตุผล:**
- **Type safety:** ถ้าลืมใส่ `sources`, ใส่หน่วยผิดฟิลด์ หรืออ้าง simulator id ที่ไม่มีอยู่ → `tsc` ฟ้องตอน build ไม่ใช่ตอนผู้ใช้เปิดเว็บ ซึ่งสำคัญมากกับเนื้อหาวิชาการ
- **แยกจาก UI จริง:** ไฟล์เนื้อหาไม่มี JSX/ไม่ import component เลย เป็นแค่ data → เปลี่ยน UI ได้โดยไม่แตะเนื้อหา และแปลงเป็น JSON/CMS ทีหลังได้
- ไม่เลือก MDX เพราะต้องตั้ง toolchain เพิ่ม, เนื้อหามี structure ชัด (สูตร/ตัวอย่าง/ตาราง) ซึ่ง block schema จัดการได้ดีกว่า markdown เสรี และ MDX จะส่ง JS ของเนื้อหาไปฝั่ง client
- รองรับข้อความเสริมด้วย inline markup เล็ก ๆ (`**ตัวหนา**`, `$สมการ$`) ที่ parse เองใน `BlockRenderer`

---

## D-005 · Physics engine เป็น pure TypeScript แยกจาก UI

**เลือก:** `lib/physics-engine/` ห้าม import React, three, หรือ DOM
**เหตุผล:**
- Simulator ตัวเดียวกันต้องใช้ได้ทั้งโหมด 2D (Canvas) และ 3D (three.js) → ตรรกะฟิสิกส์ต้องไม่ผูกกับตัว renderer
- ทดสอบด้วย Vitest ได้ตรง ๆ เทียบกับผลเฉลยที่คำนวณมือได้ → เป็นหลักประกันว่า "simulator คำนวณตามฟิสิกส์จริง" ไม่ใช่ animation หลอก ตามข้อกำหนด
- ใช้ซ้ำใน quiz engine (ตรวจคำตอบเชิงตัวเลขด้วยสูตรเดียวกับที่สอน)

---

## D-006 · Integrator: semi-implicit Euler + RK4

**เลือก:** ใช้ semi-implicit (symplectic) Euler เป็นค่าเริ่มต้น และ RK4 เฉพาะระบบที่ไวต่อความคลาดเคลื่อน (SHM, วงโคจร, วงจร RC/RL)
**เหตุผล:** Euler ธรรมดาทำให้พลังงานของ SHM เพิ่มขึ้นเรื่อย ๆ (ผิดฟิสิกส์ชัดเจนและนักเรียนจะเห็น) semi-implicit Euler รักษาพลังงานได้ดีพอที่ dt ของเฟรมจอ 60Hz และถูกกว่ามากเมื่อเทียบกับ RK4 ทุกจุด

---

## D-007 · Render loop ไม่ผ่าน React state

**เลือก:** simulator วาดด้วย Canvas 2D ใน `requestAnimationFrame` โดยเขียนค่าลง `useRef` และอัปเดต readout ตัวเลขแบบ throttle ~10Hz
**เหตุผล:** `setState` ทุกเฟรมบนมือถือกลาง ๆ ทำให้ frame drop ทันที การแยก "สถานะฟิสิกส์ (ref)" ออกจาก "สถานะ UI (state)" ทำให้ได้ 60fps และยังอัปเดตตัวเลขให้ผู้ใช้อ่านทันได้ (ตาคนอ่านตัวเลข 60Hz ไม่ทันอยู่แล้ว)

---

## D-008 · 3D โหลดแบบ opt-in เท่านั้น

**เลือก:** three.js/r3f โหลดผ่าน `next/dynamic({ ssr: false })` เมื่อผู้ใช้กดปุ่ม "3D" เท่านั้น + auto-fallback เป็น 2D
**เหตุผล:**
- three.js + drei ≈ หลายร้อย KB ถ้าโหลดมาพร้อมหน้าจะทำให้ Lighthouse mobile ตกทันที
- ตรวจ WebGL support + `navigator.hardwareConcurrency`/`deviceMemory` + วัด FPS จริงในไม่กี่วินาทีแรก ถ้าต่ำกว่าเกณฑ์จะเสนอ/สลับกลับเป็น 2D ตามข้อกำหนด "fallback 2D อัตโนมัติ"
- บทที่ 3D ไม่ช่วยความเข้าใจ จะไม่มีปุ่ม 3D เลย (ไม่ใส่ 3D เพื่อความสวยเปล่า ๆ)

---

## D-009 · 3D asset: glTF/GLB + Draco ผ่าน Blender CLI

**เลือก:** สร้าง/แปลงโมเดลด้วย Blender 5.2 CLI (`blender --background --python`) แล้ว export `.glb` + Draco compression เก็บใน `public/models/`
**เหตุผล:** GLB เป็นไฟล์เดียวจบ (mesh+material) โหลดเร็วที่สุดบนเว็บ, Draco ลดขนาด mesh ได้ 5–10 เท่า, สคริปต์ Python ทำให้ asset สร้างซ้ำได้ (reproducible) ไม่ใช่ไฟล์ลอย ๆ ที่แก้ไม่ได้ และเป็นไปตามข้อกำหนดห้ามวาง primitive เปล่า ๆ

---

## D-010 · State: Zustand + localStorage (ไม่มี backend)

**เลือก:** Zustand v5 พร้อม `persist` middleware เก็บความคืบหน้าใน localStorage
**เหตุผล:** ข้อกำหนดคือ "เข้าถึงได้โดยไม่ต้อง Login" → ไม่มีบัญชีผู้ใช้ก็ไม่ต้องมี backend/database, ลดค่าใช้จ่ายเป็นศูนย์, ไม่มีข้อมูลส่วนบุคคลให้ต้องดูแล (PDPA-friendly) และหน้า Settings มีปุ่มล้างข้อมูลให้ผู้ใช้ควบคุมเอง
**ข้อจำกัดที่ยอมรับ:** ความคืบหน้าไม่ sync ข้ามเครื่อง — แจ้งผู้ใช้ไว้ในหน้า Progress

---

## D-011 · สมการ: KaTeX (ไม่ใช่ MathJax)

**เลือก:** KaTeX render ฝั่ง server ตอน build
**เหตุผล:** เร็วกว่า MathJax มาก, ไม่มี layout shift เพราะ render มาเป็น HTML+CSS พร้อมตั้งแต่ SSG, bundle เล็กกว่า ข้อเสียคือรองรับ LaTeX ไม่ครบเท่า MathJax แต่สมการระดับ ม.ปลาย ใช้ชุดคำสั่งพื้นฐานทั้งหมด

---

## D-011b · เนื้อหาที่ client component ต้องใช้ ถูก pre-render เป็น segment ก่อนส่ง

**ปัญหาที่พบตอนวัดจริง:** แบบทดสอบและแบบฝึกหัดต้องโต้ตอบได้จึงเป็น client component
แต่มันเรียก `renderInline` ซึ่ง import KaTeX เข้ามาด้วย ผลคือ **KaTeX ราว 1 MB
ถูกส่งไปที่เบราว์เซอร์ในทุกหน้าบทเรียน** ซึ่งขัดกับ D-011 ที่ตั้งใจให้ render ฝั่ง server เท่านั้น

**ทางแก้:** เพิ่ม `lib/content/rich-text.ts` (server-only) ที่แปลงข้อความเป็น
`RichSegment[]` ซึ่งเป็นข้อมูลธรรมดา โดยสมการถูก render เป็น HTML ไว้แล้ว
ส่วน `components/ui/RichText.tsx` ฝั่ง client แสดงผล segment เหล่านั้นโดย
**ไม่ import ไลบรารีคณิตศาสตร์เลย**

**ผลที่วัดได้:** JavaScript ตั้งต้นของหน้าบทเรียนลดจาก 1,600 KB เหลือ 624 KB (ลดลง 61%)
และยืนยันด้วยการ grep หา `katex` ในทุก chunk ที่หน้านั้นโหลด — ไม่พบแล้ว

**บทเรียนที่ได้:** การประกาศว่า "render ฝั่ง server" ไม่พอ ต้องวัด bundle จริง
เพราะ import chain เพียงเส้นเดียวลากไลบรารีข้ามเส้นแบ่ง server/client ได้โดยไม่มีอะไรเตือน

---

## D-012 · Route: `/lessons/[grade]/[chapter]` แทน `(grade)/m4|m5|m6/`

**เลือก:** dynamic segment `[grade]` เดียว
**เหตุผล:** ข้อเสนอเดิมใน spec ต้องสร้างโฟลเดอร์ route ใหม่ทุกครั้งที่เพิ่มระดับชั้น การใช้ `[grade]` + `generateStaticParams` จากรีจิสทรีเนื้อหา ทำให้ "เพิ่มบท/ระดับชั้นใหม่ได้โดยไม่ต้องแก้ระบบ navigation หลัก" ตามข้อกำหนดหัวข้อ 10 — เพิ่มไฟล์เนื้อหา 1 ไฟล์แล้วทุกอย่าง (nav, sitemap, search, quiz, formula sheet) อัปเดตเอง

---

## D-013 · ไม่ใช้ไลบรารีกราฟสำเร็จรูป (Recharts/D3)

**เลือก:** เขียน `PlotCanvas` เองด้วย Canvas 2D API (~200 บรรทัด)
**เหตุผล:** กราฟที่ต้องใช้คืออนุกรมเวลาแบบ real-time ที่วาดทุกเฟรมพร้อม simulator — Recharts เป็น React component ที่ re-render ทุกจุดข้อมูลจึงช้าเกินไป และ D3 เพิ่ม ~100KB เพื่อฟีเจอร์ที่ใช้ไม่ถึง 5% เขียนเองได้ควบคุม performance และให้ธีม/accent color ตรงกับระบบสีได้เต็มที่

---

## D-014 · ไม่ใช้ animation library (Framer Motion)

**เลือก:** CSS transitions/animations + `IntersectionObserver` สำหรับ scroll reveal
**เหตุผล:** Framer Motion ≈ 50KB+ และทำงานบน main thread ส่วน CSS animation ทำงานบน compositor thread จึงลื่นกว่าบนมือถือ ทุก animation ถูกครอบด้วย `@media (prefers-reduced-motion: reduce)` ในไฟล์เดียว (`styles/motion.css`) ทำให้เคารพผู้ใช้ได้ครบจริง

---

## D-015 · ฟอนต์: IBM Plex Sans Thai

**เลือก:** `IBM Plex Sans Thai` (ผ่าน `next/font/google`) + system mono สำหรับตัวเลข
**เหตุผล:** เป็นฟอนต์ไทยที่ออกแบบมาคู่กับ Latin โดยตรง มี weight ครบ 100–700 อ่านง่ายบนจอ และ license ฟรี (SIL OFL) `next/font` จะ self-host ให้อัตโนมัติ จึงไม่มี request ไป Google และไม่มี layout shift
