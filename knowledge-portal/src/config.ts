export interface SiteConfig {
  title: string;
  description: string;
  author: string;
  url: string;
}

export const siteConfig: SiteConfig = {
  title: 'Personal Knowledge Portal',
  description: 'A personal knowledge archive for intergenerational wisdom',
  author: 'Your Name',
  url: 'http://localhost:4321',
};

export const categories = [
  {
    id: 'life-lessons',
    name: 'Life Lessons',
    description: 'Hard-earned insights, mistakes made, and wisdom to pass on',
    icon: '💡',
  },
  {
    id: 'decision-frameworks',
    name: 'Decision Frameworks',
    description: 'How I think about big choices in life',
    icon: '⚖️',
  },
  {
    id: 'financial-wisdom',
    name: 'Financial Wisdom',
    description: 'Money philosophy, investment lessons, and wealth-building insights',
    icon: '💰',
  },
  {
    id: 'family-history',
    name: 'Family History',
    description: 'Stories of family, origins, and traditions',
    icon: '🏠',
  },
  {
    id: 'practical-skills',
    name: 'Practical Skills',
    description: 'How-tos: cooking, fixing, negotiating, and more',
    icon: '🔧',
  },
  {
    id: 'book-library',
    name: 'Book Library',
    description: 'Books that shaped my thinking and recommended reads',
    icon: '📚',
  },
  {
    id: 'values',
    name: 'Values & Principles',
    description: 'What I stand for and non-negotiable principles',
    icon: '🧭',
  },
  {
    id: 'letters-to-future',
    name: 'Letters to the Future',
    description: 'Time-capsule messages for specific life moments',
    icon: '📧',
  },
  {
    id: 'career-craft',
    name: 'Career & Craft',
    description: 'Professional lessons and mentorship insights',
    icon: '🎯',
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    description: 'Lessons about body, mind, and living well',
    icon: '🌿',
  },
  {
    id: 'relationships',
    name: 'Relationships',
    description: 'Lessons on love, friendship, family bonds, and human connection',
    icon: '❤️',
  },
] as const;

export type CategoryId = typeof categories[number]['id'];
