import { hydrogen } from './hydrogen';
import { indicators } from './indicators';
import { oxygen } from './oxygen';
import type { TopicDef } from './topic';

// Topics in menu order. New experiments are added here one by one.
export const TOPICS: TopicDef[] = [
  indicators,
  hydrogen,
  oxygen,
  { id: 'separation', title: 'topic.separation', ready: false },
  { id: 'equipment', title: 'topic.equipment', ready: false },
];
