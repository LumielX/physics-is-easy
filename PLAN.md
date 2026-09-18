# PLAN.md — Physics is Easy

> แผนงานฉบับสมบูรณ์ของโปรเจกต์ "Physics is Easy" (Phase 1–2 Deliverable)
> Created by Narawit Luekhajon

---

## 1. สรุป Requirement

| หัวข้อ | ข้อกำหนด |
| --- | --- |
| เป้าหมาย | เว็บเรียนฟิสิกส์ ม.4–ม.6 ที่ทำให้ผู้เรียน "เข้าใจจริง" |
| ผู้ใช้ | นักเรียน ม.ปลาย + ผู้สนใจทั่วไป |
| เนื้อหา | 19 บทตามหลักสูตร สสวท. (IPST) ฉบับปรับปรุง พ.ศ. 2560 |
| แกนประสบการณ์ | Learn → Explore → Experiment → Practice → Quiz → Review |
| การจำลอง | Simulator ต้องคำนวณจากสมการฟิสิกส์จริง ปรับค่าได้ real-time |
| 3D | ใช้เฉพาะบทที่ 3D ช่วยความเข้าใจ + สลับ 2D/3D ได้ + fallback 2D |
| ธีม | Light / Dark สลับได้ + accent color ต่อหมวดวิชา |
| Performance | Lighthouse (mobile) ≥ 90, FCP < 2s, simulator ไม่มี frame drop |
| Responsive | Desktop / Laptop / iPhone / Android / iPad / Tablet |
| A11y | WCAG AA, keyboard ครบ, ARIA, reduced motion |
| Deploy | Vercel (ฟรี, ไม่ต้อง login เข้าใช้งาน), URL มีคำว่า physics-is-easy |

**หลักการตัดสินใจ:** ทุกฟีเจอร์ต้องผ่านสมดุล 6 ด้าน — Education, Interaction, Simulation, Visual Design, Performance, Usability ถ้าฟีเจอร์ใดสวยแต่ทำให้ช้าหรือเรียนยากขึ้น → ตัดทิ้ง

---

## 2. Content Scope — 19 บท (อ้างอิงโครงสร้างหนังสือเรียน สสวท.)

### ม.4 — กลศาสตร์พื้นฐาน (accent: ส้ม/แดง)

| บท | ชื่อบท | หมวด | 3D |
| --- | --- | --- | --- |
| 1 | ธรรมชาติและพัฒนาการทางฟิสิกส์ | foundations | – |
| 2 | การเคลื่อนที่แนวตรง | mechanics | – |
| 3 | แรงและกฎการเคลื่อนที่ | mechanics | – |
| 4 | สมดุลกลของวัตถุ | mechanics | ✓ (ทอร์ก/แกนหมุน) |
| 5 | งานและพลังงาน | mechanics | – |
| 6 | โมเมนตัมและการชน | mechanics | ✓ (การชน 2 มิติในปริภูมิ) |
| 7 | การเคลื่อนที่แนวโค้ง | mechanics | ✓ (โพรเจกไทล์, วงกลม) |

### ม.5 — คลื่นและแสง (accent: ม่วง/คราม)

| บท | ชื่อบท | หมวด | 3D |
| --- | --- | --- | --- |
| 8 | การเคลื่อนที่แบบฮาร์มอนิกอย่างง่าย | waves | – |
| 9 | คลื่น | waves | ✓ (คลื่นผิวน้ำ/หน้าคลื่น) |
| 10 | เสียง | waves | ✓ (Doppler ในปริภูมิ) |
| 11 | แสง | waves | – |
| 12 | ไฟฟ้าสถิต | electromagnetism | ✓ (สนามไฟฟ้า 3 มิติ) |

### ม.6 — ไฟฟ้า ความร้อน และฟิสิกส์ยุคใหม่ (accent: ฟ้า/เขียว/เทา)

| บท | ชื่อบท | หมวด | 3D |
| --- | --- | --- | --- |
| 13 | ไฟฟ้ากระแส | electromagnetism | – |
| 14 | แม่เหล็กและไฟฟ้า | electromagnetism | ✓ (สนามแม่เหล็ก, แรงลอเรนซ์) |
| 15 | คลื่นแม่เหล็กไฟฟ้า | electromagnetism | ✓ (E–B field propagation) |
| 16 | ความร้อนและแก๊ส | thermal | ✓ (กล่องโมเลกุลแก๊ส) |
| 17 | ของแข็งและของไหล | thermal | – |
| 18 | ฟิสิกส์อะตอม | modern | ✓ (orbital/ระดับพลังงาน) |
| 19 | ฟิสิกส์นิวเคลียร์และอนุภาค | modern | – |

> หมายเหตุ: ลำดับบทอ้างอิงหนังสือเรียนรายวิชาเพิ่มเติมวิทยาศาสตร์และเทคโนโลยี ฟิสิกส์ เล่ม 1–6 (สสวท.) แต่ละบทบันทึกแหล่งอ้างอิงจริงไว้ในฟิลด์ `sources` ของไฟล์เนื้อหา

### องค์ประกอบบังคับของทุกบท

1. `objectives` — จุดประสงค์การเรียนรู้
2. `learn` — เนื้อหาสอนแบบ block (ข้อความ, สูตร, ตัวอย่าง, ตาราง, callout, รูป SVG)
3. `formulas` — สูตรพร้อมตัวแปรทุกตัว + หน่วย SI
4. `simulators` — Simulator อย่างน้อย 1 ตัว (คำนวณจริง)
5. `practice` — โจทย์ฝึกพร้อมเฉลยทีละขั้น
6. `quiz` — ข้อสอบหลายรูปแบบ + เฉลย + คำอธิบาย + anchor กลับไปหัวข้อที่เกี่ยวข้อง
7. `applications` — การประยุกต์ใช้ในชีวิตจริง
8. `importance` — ความสำคัญของบท
9. `funFacts` + `furtherReading` — เนื้อหาเสริม
10. `sources` — แหล่งอ้างอิง

---

## 3. Architecture (Phase 2)

### 3.1 Stack

```
Next.js 16 (App Router, RSC)  ·  React 19.2  ·  TypeScript strict
Tailwind CSS v4 (CSS-first @theme)  ·  CSS variables สำหรับ theme + accent
react-three-fiber v9 + drei v10 (three.js)  — โหลดแบบ dynamic เท่านั้น
Zustand v5 (progress + settings, persist localStorage)
KaTeX (render สมการ, SSR ได้, เบากว่า MathJax)
Vitest (unit test ของ physics engine)  ·  Playwright (cross-device smoke)
Blender 5.2 CLI + Python (สร้าง/optimize .glb)
```

### 3.2 Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  app/  (routes, RSC)  — โหลดเนื้อหาที่ build time (SSG)      │
├─────────────────────────────────────────────────────────────┤
│  components/                                                │
│   ui/         design system (Button, Card, Slider, Tabs…)   │
│   learning/   LessonFlow, BlockRenderer, StageNav, Review    │
│   simulators/ SimulatorShell + simulator ต่อบท (client)     │
│   three/      Canvas3D, ModelLoader, fallback ↔ 2D          │
│   quiz/       QuestionRenderer ต่อชนิดคำถาม, ResultReport    │
├─────────────────────────────────────────────────────────────┤
│  lib/                                                       │
│   physics-engine/  สมการบริสุทธิ์ (pure, ไม่มี React)        │
│   quiz-engine/     grading, scoring, adaptive review        │
│   content/         schema + loader + registry               │
│   progress/        zustand store (persist)                  │
├─────────────────────────────────────────────────────────────┤
│  content/physics/m4|m5|m6/*.ts   เนื้อหาแยกไฟล์ต่อบท         │
│  public/models/*.glb             3D asset ที่ optimize แล้ว  │
│  tools/blender/*.py              pipeline สร้างโมเดล         │
└─────────────────────────────────────────────────────────────┘
```

**กฎสำคัญ:** `lib/physics-engine/` เป็น pure TypeScript ไม่ import React/three เลย → unit test ได้ 100% และใช้ซ้ำได้ทั้ง 2D และ 3D

### 3.3 Route Map

| Route | ชนิด | หน้าที่ |
| --- | --- | --- |
| `/` | SSG | Home + ทางเข้าแต่ละระดับชั้น |
| `/lessons` | SSG | ภาพรวมทุกระดับชั้น |
| `/lessons/[grade]` | SSG | รายการบทของ ม.4/5/6 |
| `/lessons/[grade]/[chapter]` | SSG | บทเรียน (Learn→Review flow) |
| `/simulator` | SSG | รวม simulator ทุกบท |
| `/simulator/[id]` | SSG | simulator เต็มจอ |
| `/quiz` | SSG | รวมแบบทดสอบ |
| `/quiz/[chapter]` | SSG | ทำ quiz รายบท |
| `/search` | Client | ค้นหาเนื้อหา/สูตร/simulator |
| `/progress` | Client | ความคืบหน้าผู้เรียน |
| `/settings` | Client | ธีม, motion, ขนาดตัวอักษร, ล้างข้อมูล |
| `/formulas` | SSG | สรุปสูตรทุกบท (formula sheet) |

### 3.4 Content Pipeline

```
content/physics/m4/02-linear-motion.ts   (typed object: Chapter)
        │  import ตรงใน RSC (ไม่ต้อง parse ตอน runtime)
        ▼
lib/content/registry.ts  ── getChapter(grade, slug) / getAllChapters()
        ▼
BlockRenderer  ── map block.type → React component
        ▼
หน้า /lessons/[grade]/[chapter]  (generateStaticParams → SSG ทุกบท)
```

---

## 4. Design System (Phase 3)

### 4.1 Theme tokens (CSS variables)

| Token | Light | Dark |
| --- | --- | --- |
| `--bg` | ขาวนวล #f7f8fb | ดำน้ำเงินลึก #0a0e1a |
| `--surface` | #ffffff | #131827 |
| `--text` | #10131c | #e8ecf5 |
| `--muted` | #5a6175 | #97a0b8 |
| `--border` | #e3e7f0 | #222a3d |
| `--accent` | ตามหมวดบท | ตามหมวดบท (สว่างขึ้น) |

### 4.2 Accent per strand

| หมวด | สี | ใช้กับบท |
| --- | --- | --- |
| foundations | เทาน้ำเงิน | 1 |
| mechanics | ส้ม | 2–7 |
| waves | ม่วง | 8–11 |
| electromagnetism | ฟ้า | 12–15 |
| thermal | แดงอมส้ม/เขียว | 16–17 |
| modern | เขียวมิ้นต์ | 18–19 |

### 4.3 Type scale & spacing

- Font: `IBM Plex Sans Thai` (เนื้อหาไทย อ่านง่าย มี weight ครบ) + `JetBrains Mono` (ตัวเลข/หน่วย)
- Scale: 12 / 14 / 16 / 18 / 21 / 26 / 33 / 42 px (ratio ≈ 1.25)
- Spacing: 4px base grid
- Radius: 8 / 12 / 20 px; Touch target ขั้นต่ำ 44×44 px

### 4.4 Wireframe concept — หน้าบทเรียน

```
┌───────────────────────────────────────────────────────┐
│ Header: โลโก้ · ระดับชั้น · ค้นหา · ธีม · เมนู           │
├───────────────────────────────────────────────────────┤
│ Hero บท: หมายเลขบท · ชื่อ · เวลาโดยประมาณ · จุดประสงค์   │
├───────────────────────────────────────────────────────┤
│ StageNav (sticky): Learn ▸ Explore ▸ Experiment ▸      │
│                    Practice ▸ Quiz ▸ Review           │
├──────────────────────────────┬────────────────────────┤
│ เนื้อหา (BlockRenderer)       │ Sidebar (desktop):     │
│  · ข้อความ + สมการ KaTeX      │  · สารบัญในบท           │
│  · การ์ดสูตร (ตัวแปร+หน่วย)   │  · ความคืบหน้า          │
│  · ตัวอย่างคำนวณทีละขั้น      │  · สูตรสำคัญ            │
│  · Simulator (2D/3D toggle)   │                        │
├──────────────────────────────┴────────────────────────┤
│ Footer: Created by Narawit Luekhajon · แหล่งอ้างอิง     │
└───────────────────────────────────────────────────────┘
```
Mobile: sidebar ยุบเป็น bottom sheet, StageNav เป็นแถบ scroll แนวนอน

---

## 5. Phase Checklist

| Phase | งาน | สถานะ |
| --- | --- | --- |
| 1 | วิเคราะห์ Requirement → PLAN.md | ✅ |
| 2 | Architecture + IA | ✅ |
| 3 | UI/UX + Design tokens | ✅ |
| 4 | Project structure + dependencies | ✅ |
| 5 | Core system (routing, layout, theme, nav) | ✅ |
| 6 | Learning system (content rendering, flow) | ✅ |
| 7 | Simulator engine (physics core) | ✅ |
| 8 | 2D/3D rendering + Blender pipeline | ✅ |
| 9 | เนื้อหาฟิสิกส์ 19 บท | ✅ |
| 10 | Quiz system | ✅ |
| 11 | Responsive ทุกหน้า | ✅ |
| 12 | Animation & micro-interaction | ✅ |
| 13 | Performance optimization | ✅ |
| 14 | Accessibility audit | ✅ |
| 15 | Testing | ✅ |
| 16 | Bug fixing | ✅ |
| 17 | UX review | ✅ |
| 18 | Production readiness | ✅ |
| 19 | Deployment guide | ✅ |
| 20 | ส่งมอบ + สรุป | ✅ |

---

## 5b. ผลการวัดจริงเมื่อจบงาน

| ตัวชี้วัด | ผล |
| --- | --- |
| หน้าที่สร้างเป็น static ตอน build | 81 หน้า |
| Build production | ผ่าน ไม่มี error (exit 0) |
| TypeScript strict | ผ่าน ไม่มี error |
| Unit test | ผ่าน 132/132 ข้อ |
| JavaScript ตั้งต้น หน้าแรก | 579 KB (ก่อนบีบอัด) |
| JavaScript ตั้งต้น หน้าบทเรียน | 624 KB (ลดจาก 1,600 KB หลังแก้ D-011b) |
| three.js ในหน้าที่ไม่ได้กด 3D | ไม่มี (ยืนยันด้วยการ grep chunk) |
| KaTeX ในเบราว์เซอร์ | ไม่มี (ยืนยันด้วยการ grep chunk) |
| โมเดล 3 มิติจาก Blender | 5 ไฟล์ 3.8–22.9 KB (Draco) |
| Smoke test ทุก route | ผ่าน 15/15 และ 404 ทำงานถูกต้อง |

---

## 6. ความเสี่ยงและการรับมือ

| ความเสี่ยง | การรับมือ |
| --- | --- |
| 3D ทำให้ bundle บวมและมือถือช้า | `next/dynamic` + `ssr:false`, โหลด three เฉพาะตอนกด "3D", ตรวจ WebGL + `deviceMemory`/`hardwareConcurrency` แล้ว fallback 2D อัตโนมัติ |
| Simulator กิน CPU จน frame drop | ใช้ fixed-timestep + RK4 เฉพาะที่จำเป็น, วาดด้วย Canvas 2D (ไม่ re-render React ทุกเฟรม), หยุด loop เมื่อ tab ซ่อนหรืออยู่นอก viewport |
| เนื้อหาผิด/ไม่มีแหล่งอ้างอิง | ทุกบทมีฟิลด์ `sources` บังคับ + unit test ตรวจว่าทุกบทมีอย่างน้อย 1 แหล่ง |
| KaTeX ทำให้ FCP ช้า | โหลด CSS ของ KaTeX แบบ static, render สมการฝั่ง server (SSG) ไม่ใช้ JS ตอน runtime |
| ฟอนต์ไทยหนัก | `next/font` + `display: swap` + subset latin/thai เท่านั้น |
