export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export const CATEGORIES: Category[] = [
  { id: 'health',  name: 'Gesundheit',      color: '#E53935', icon: 'heart-pulse' },
  { id: 'work',    name: 'Arbeit',           color: '#1E88E5', icon: 'briefcase' },
  { id: 'sport',   name: 'Sport & Freizeit', color: '#43A047', icon: 'run' },
  { id: 'social',  name: 'Soziales',         color: '#FB8C00', icon: 'users' },
  { id: 'errands', name: 'Besorgungen',      color: '#8E24AA', icon: 'shopping-cart' },
  { id: 'travel',  name: 'Reise & Urlaub',   color: '#00ACC1', icon: 'plane' },
  { id: 'other',   name: 'Sonstiges',        color: '#757575', icon: 'dots-circle-horizontal' },
];