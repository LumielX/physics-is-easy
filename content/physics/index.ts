import type { Chapter } from '@/lib/content/types';

import m4c01 from './m4/01-nature-of-physics';
import m4c02 from './m4/02-linear-motion';
import m4c03 from './m4/03-forces-newton';
import m4c04 from './m4/04-equilibrium';
import m4c05 from './m4/05-work-energy';
import m4c06 from './m4/06-momentum';
import m4c07 from './m4/07-curved-motion';

import m5c08 from './m5/08-shm';
import m5c09 from './m5/09-waves';
import m5c10 from './m5/10-sound';
import m5c11 from './m5/11-light';
import m5c12 from './m5/12-electrostatics';

import m6c13 from './m6/13-current-electricity';
import m6c14 from './m6/14-magnetism';
import m6c15 from './m6/15-em-waves';
import m6c16 from './m6/16-heat-gases';
import m6c17 from './m6/17-solids-fluids';
import m6c18 from './m6/18-atomic-physics';
import m6c19 from './m6/19-nuclear-physics';

/**
 * The course manifest — 19 chapters following the IPST physics syllabus.
 *
 * Adding a chapter = create the file, import it here. Navigation, search,
 * sitemap, quiz index, formula sheet and simulator index all follow
 * automatically (see lib/content/registry.ts).
 */
export const allChapters: Chapter[] = [
  m4c01,
  m4c02,
  m4c03,
  m4c04,
  m4c05,
  m4c06,
  m4c07,
  m5c08,
  m5c09,
  m5c10,
  m5c11,
  m5c12,
  m6c13,
  m6c14,
  m6c15,
  m6c16,
  m6c17,
  m6c18,
  m6c19,
];
