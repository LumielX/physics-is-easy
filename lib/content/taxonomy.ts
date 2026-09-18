import type { Grade, Strand } from './types';

export interface GradeInfo {
  id: Grade;
  label: string;
  labelEn: string;
  short: string;
  description: string;
  /** Strand used for the grade's landing page accent. */
  accent: Strand;
}

export const GRADES: GradeInfo[] = [
  {
    id: 'm4',
    label: 'มัธยมศึกษาปีที่ 4',
    labelEn: 'Grade 10',
    short: 'ม.4',
    description:
      'รากฐานของฟิสิกส์ทั้งหมด — เริ่มจากธรรมชาติของวิชา แล้วเข้าสู่กลศาสตร์: การเคลื่อนที่ แรง สมดุล งาน พลังงาน โมเมนตัม และการเคลื่อนที่แนวโค้ง',
    accent: 'mechanics',
  },
  {
    id: 'm5',
    label: 'มัธยมศึกษาปีที่ 5',
    labelEn: 'Grade 11',
    short: 'ม.5',
    description:
      'โลกของการสั่นและคลื่น — จากการแกว่งของมวลติดสปริง สู่คลื่นกล เสียง แสง และก้าวแรกเข้าสู่ไฟฟ้าสถิต',
    accent: 'waves',
  },
  {
    id: 'm6',
    label: 'มัธยมศึกษาปีที่ 6',
    labelEn: 'Grade 12',
    short: 'ม.6',
    description:
      'ไฟฟ้า แม่เหล็ก ความร้อน ของไหล และฟิสิกส์ยุคใหม่ — บทที่เชื่อมฟิสิกส์ ม.ปลาย เข้ากับเทคโนโลยีที่เราใช้ทุกวัน',
    accent: 'electromagnetism',
  },
];

export const GRADE_MAP: Record<Grade, GradeInfo> = Object.fromEntries(
  GRADES.map((g) => [g.id, g]),
) as Record<Grade, GradeInfo>;

export interface StrandInfo {
  id: Strand;
  label: string;
  labelEn: string;
  description: string;
  icon: string;
}

export const STRANDS: StrandInfo[] = [
  {
    id: 'foundations',
    label: 'ธรรมชาติของฟิสิกส์',
    labelEn: 'Foundations',
    description: 'วิธีคิดแบบฟิสิกส์ หน่วย การวัด และความคลาดเคลื่อน',
    icon: '◈',
  },
  {
    id: 'mechanics',
    label: 'กลศาสตร์',
    labelEn: 'Mechanics',
    description: 'การเคลื่อนที่ แรง พลังงาน โมเมนตัม และสมดุล',
    icon: '⟿',
  },
  {
    id: 'waves',
    label: 'คลื่นและแสง',
    labelEn: 'Waves & Optics',
    description: 'การสั่น คลื่นกล เสียง และแสง',
    icon: '∿',
  },
  {
    id: 'electromagnetism',
    label: 'ไฟฟ้าและแม่เหล็ก',
    labelEn: 'Electromagnetism',
    description: 'ประจุ สนาม วงจรไฟฟ้า แม่เหล็ก และคลื่นแม่เหล็กไฟฟ้า',
    icon: '⚡',
  },
  {
    id: 'thermal',
    label: 'ความร้อนและของไหล',
    labelEn: 'Thermal & Fluids',
    description: 'ความร้อน แก๊ส สมบัติของแข็ง และของไหล',
    icon: '🌡',
  },
  {
    id: 'modern',
    label: 'ฟิสิกส์ยุคใหม่',
    labelEn: 'Modern Physics',
    description: 'ควอนตัม อะตอม นิวเคลียร์ และอนุภาคมูลฐาน',
    icon: '⚛',
  },
];

export const STRAND_MAP: Record<Strand, StrandInfo> = Object.fromEntries(
  STRANDS.map((s) => [s.id, s]),
) as Record<Strand, StrandInfo>;

export const DIFFICULTY_LABEL: Record<1 | 2 | 3, string> = {
  1: 'พื้นฐาน',
  2: 'ปานกลาง',
  3: 'ท้าทาย',
};
