// Single source of truth for all portfolio copy.
// Edit freely — these strings drive the entire site.
//
// Zero-specifics policy: no internal data, no real metric names, no real
// campaign names, no proprietary architecture. Conceptual descriptions only.

export const hero = {
  name: 'Tarang Jammalamadaka',
  role: 'Global Human Insights Intern',
  org: 'The Coca-Cola Company',
  tagline: 'Where AI martech meets the world\u2019s most-recognized brand.',
};

export const role = {
  heading: 'The role',
  body: [
    'At the intersection of AI marketing technology and consumer marketing data, I help translate signals from real people into decisions brand teams can act on.',
    'My focus: tools, agents, and methods that make global human insight faster, sharper, and more accessible.',
  ],
  focusAreas: [
    'Consumer marketing analytics',
    'Human-insight synthesis',
    'AI martech tooling',
  ],
};

export const tools = [
  {
    id: 'niq',
    name: 'NIQ',
    blurb: 'Retail measurement and consumer panel intelligence.',
  },
  {
    id: 'powerbi',
    name: 'PowerBI',
    blurb: 'Dashboards and decision-grade visualization.',
  },
  {
    id: 'dax',
    name: 'DAX',
    blurb: 'Modeled measures inside the analytics layer.',
  },
  {
    id: 'sql',
    name: 'SQL',
    blurb: 'The lingua franca for asking the data hard questions.',
  },
  {
    id: 'python',
    name: 'Python',
    blurb: 'Analysis, automation, and the agent runtime.',
  },
  {
    id: 'internal',
    name: 'Internal Tooling',
    blurb: 'Coca-Cola\u2019s proprietary data surfaces.',
  },
] as const;

export const agent = {
  heading: 'The agent',
  tagline: 'Turning dashboards into conversations.',
  body: [
    'I\u2019m developing an AI agent for consumer marketing metrics \u2014 a teammate that helps marketers query, interpret, and act on the numbers without leaving the flow of their work.',
    'The vision: less time hunting for the chart, more time building the brand.',
  ],
  pillars: [
    { name: 'Ingest', desc: 'Wire the metrics that matter.' },
    { name: 'Analyze', desc: 'Find the signal, frame the story.' },
    { name: 'Surface', desc: 'Deliver insight where work happens.' },
  ],
};

export const learnings = [
  'Insight has no impact until it changes a decision.',
  'AI doesn\u2019t replace the analyst \u2014 it gives them leverage.',
  'The best marketing tools feel invisible.',
];

export const contact = {
  github: 'https://github.com/tarang-tj',
  linkedin: 'https://www.linkedin.com/in/tarang-jammalamadaka/',
  email: 'tarangjammalamadaka9@gmail.com',
};
