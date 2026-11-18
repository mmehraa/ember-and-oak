// All site content lives here, so a client's details can be swapped without touching layout code.

export const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const site = {
  name: 'Ember & Oak',
  tagline: 'Wood-fired Italian kitchen',
  phone: '+1 (555) 014-2290',
  email: 'hello@emberandoak.example',
  address: '214 Alder Street, Portland, OR',
  hours: [
    ['Mon – Thu', '5:00 – 10:00 pm'],
    ['Fri – Sat', '5:00 – 11:30 pm'],
    ['Sunday', '12:00 – 9:00 pm'],
  ],
};

export const signature = [
  { name: 'Smoked Burrata Pizza', price: 22, note: 'San Marzano, basil, olive oil from Puglia. Blistered in 90 seconds.', img: '1574071318508-1cdbab80d002' },
  { name: 'Hand-cut Tagliatelle', price: 26, note: 'Rolled every morning. Eight-hour beef ragù, aged parmigiano.', img: '1551183053-bf91a1d81141' },
  { name: 'Ember-grilled Ribeye', price: 42, note: '14 oz, rested over oak coals. Rosemary salt, salsa verde.', img: '1600891964092-4316c288032e' },
  { name: 'Seafood Linguine', price: 34, note: 'Clams, prawns and mussels, white wine, chili, parsley.', img: '1595295333158-4742f28fbd85' },
  { name: 'Strawberry Panna Cotta', price: 11, note: 'Vanilla bean cream, macerated strawberries, mint.', img: '1488477181946-6428a0291777' },
];

type Item = { name: string; desc: string; price: number; img?: string };
export const menu: Record<string, Item[]> = {
  Starters: [
    { name: "Chef's Sharing Board", desc: 'Cured meats, grilled vegetables, pickles', price: 24, img: '1504674900247-0877df9cc836' },
    { name: 'Focaccia & Whipped Ricotta', desc: 'Honey, cracked pepper, sea salt', price: 9 },
    { name: 'Charred Octopus', desc: 'Chickpea purée, smoked paprika oil', price: 18 },
    { name: 'Arancini', desc: 'Saffron risotto, mozzarella heart, aioli', price: 12 },
  ],
  Pizza: [
    { name: 'Smoked Burrata', desc: 'Cherry tomato, basil, Puglian olive oil', price: 22, img: '1574071318508-1cdbab80d002' },
    { name: 'Diavola', desc: 'Spicy salami, chili honey, mozzarella', price: 20, img: '1513104890138-7c749659a591' },
    { name: 'Orto', desc: 'Peppers, red onion, olives, basil, mozzarella', price: 19, img: '1565299624946-b28f40a0ae38' },
    { name: 'Margherita', desc: 'Fior di latte, San Marzano, basil', price: 17 },
  ],
  Mains: [
    { name: 'Hand-cut Tagliatelle', desc: 'Beef ragù, parmigiano', price: 26, img: '1551183053-bf91a1d81141' },
    { name: 'Cacio e Pepe', desc: 'Tonnarelli, pecorino, black pepper', price: 21, img: '1546549032-9571cd6b27df' },
    { name: 'Seafood Linguine', desc: 'Clams, prawns, mussels, white wine', price: 34, img: '1595295333158-4742f28fbd85' },
    { name: 'Ember-grilled Ribeye', desc: '14 oz, salsa verde, charred lemon', price: 42, img: '1600891964092-4316c288032e' },
  ],
  Desserts: [
    { name: 'Strawberry Panna Cotta', desc: 'Vanilla bean, macerated strawberries', price: 11, img: '1488477181946-6428a0291777' },
    { name: 'Tiramisu', desc: 'Espresso, mascarpone, cocoa', price: 11 },
    { name: 'Wood-fired Peaches', desc: 'Amaretti crumble, vanilla gelato', price: 12 },
  ],
};

// Order matters: the first image is the centre one that zooms to full screen.
export const gallery = [
  '1517248135467-4c7edcad34c4',
  '1590846406792-0adc7f938f1d',
  '1528605248644-14dd04022da1',
  '1414235077428-338989a2e8c0',
  '1565299624946-b28f40a0ae38',
  '1546549032-9571cd6b27df',
  '1504674900247-0877df9cc836',
];
