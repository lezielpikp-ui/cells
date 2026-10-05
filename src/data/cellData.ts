export interface Organelle {
  id: string;
  name: string;
  tagline: string;
  function: string;
  plantsOnly: boolean;
  color: string;
  accentColor: string;
  description: string;
  realWorldAnalogy: string;
  keyFacts: string[];
  icon: string; // Lucide icon identifier
  soundFrequency: number;
}

export const CELL_ORGANELLES: Organelle[] = [
  {
    id: 'cell_membrane',
    name: 'Cell Membrane',
    tagline: 'The Cellular Gatekeeper',
    function: 'Controls what enters and leaves the cell; protects it',
    plantsOnly: false,
    color: '#06b6d4', // Cyan
    accentColor: '#22d3ee',
    description:
      'A flexible, semi-permeable phospholipid bilayer that envelops the entire cell. It regulates molecular transport (nutrients in, waste products out) and shields interior components from hazardous external environments.',
    realWorldAnalogy: 'Like security gates and border control of a secure facility.',
    keyFacts: [
      'Made of a phospholipid bilayer with hydrophilic heads and hydrophobic tails',
      'Embedded with transport proteins and receptor molecules',
      'Present in BOTH plant and animal cells (in plants, it sits right inside the cell wall)'
    ],
    icon: 'Shield',
    soundFrequency: 520
  },
  {
    id: 'nucleus',
    name: 'Nucleus',
    tagline: 'The Control Centre',
    function: 'Control centre; directs all cell activities; holds DNA',
    plantsOnly: false,
    color: '#8b5cf6', // Violet
    accentColor: '#a78bfa',
    description:
      'The prominent command hub of eukaryotic cells enclosed by a double nuclear membrane with nuclear pores. It stores the genetic blueprint (chromatin/DNA) and dictates protein synthesis, cell division, and growth.',
    realWorldAnalogy: 'The CEO office or central brain containing the master blueprints.',
    keyFacts: [
      'Contains DNA packed into chromosomes with histone proteins',
      'Houses the dense nucleolus, which synthesizes ribosomal RNA',
      'Nuclear pores regulate passage of RNA and signaling macromolecules'
    ],
    icon: 'Dna',
    soundFrequency: 440
  },
  {
    id: 'cytoplasm',
    name: 'Cytoplasm',
    tagline: 'The Living Jelly Matrix',
    function: 'Jelly-like substance; holds all organelles in place',
    plantsOnly: false,
    color: '#38bdf8', // Sky Blue
    accentColor: '#7dd3fc',
    description:
      'The gel-like cytosol and surrounding cytoskeleton filling the cellular interior between the cell membrane and nucleus. It provides fluid buoyancy, facilitates intracellular metabolic streaming, and anchors all organelles in place.',
    realWorldAnalogy: 'The supportive packaging gel and transit highway keeping factory equipment stabilized.',
    keyFacts: [
      'Composed of 70%–80% water along with dissolved salts, amino acids, and sugars',
      'Site of essential glycolysis and enzymatic metabolic reactions',
      'Constantly moves in a circulatory motion called cytoplasmic streaming (cyclosis)'
    ],
    icon: 'Waves',
    soundFrequency: 330
  },
  {
    id: 'mitochondria',
    name: 'Mitochondria',
    tagline: 'The Powerhouse of the Cell',
    function: 'Produces energy for the cell — the "powerhouse"',
    plantsOnly: false,
    color: '#f97316', // Orange / Fire
    accentColor: '#fb923c',
    description:
      'Double-membraned energy factories that convert biochemical energy from glucose and oxygen into Adenosine Triphosphate (ATP) through cellular respiration.',
    realWorldAnalogy: 'The electrical power generator fueling every machine in a city.',
    keyFacts: [
      'Has deep inner folds called cristae that maximize surface area for ATP synthesis',
      'Contains its own unique circular mitochondrial DNA (mDNA)',
      'Highly active cells (muscle and root hair cells) contain thousands of mitochondria'
    ],
    icon: 'Zap',
    soundFrequency: 660
  },
  {
    id: 'vacuole',
    name: 'Vacuole',
    tagline: 'The Cellular Storage Depot',
    function: 'Stores water, food, and waste (larger in plant cells)',
    plantsOnly: false,
    color: '#0ea5e9', // Blue
    accentColor: '#38bdf8',
    description:
      'Membrane-bound storage vesicles (tonoplast). In plant cells, a massive Central Vacuole accounts for up to 90% of cellular volume, creating turgor pressure that prevents wilting. In animal cells, vacuoles are smaller and numerous.',
    realWorldAnalogy: 'The city water tower and warehouse storage complex.',
    keyFacts: [
      'Much larger in plant cells where it maintains hydrostatic turgor pressure',
      'Stores reserves of water, enzymes, organic nutrients, and metabolic waste',
      'Shrinks when plants lack water, causing the entire plant to wilt'
    ],
    icon: 'Droplets',
    soundFrequency: 392
  },
  {
    id: 'cell_wall',
    name: 'Cell Wall',
    tagline: 'Rigid Armor & Structural Frame',
    function: 'Gives support, shape, and protection',
    plantsOnly: true,
    color: '#10b981', // Emerald Green
    accentColor: '#34d399',
    description:
      'A tough, flexible yet rigid outer jacket surrounding plant cells outside the cell membrane. Predominantly constructed from cellulose microfibrils, it withstands high osmotic pressure and maintains structural uprightness against gravity.',
    realWorldAnalogy: 'The reinforced concrete external scaffolding and exterior castle wall.',
    keyFacts: [
      'FOUND IN PLANTS ONLY (and fungi/algae, but never in animal cells)',
      'Composed of interwoven cellulose fibers, hemicellulose, and pectin',
      'Enables tall trees and flowers to stand straight without an internal skeleton'
    ],
    icon: 'ShieldCheck',
    soundFrequency: 587
  },
  {
    id: 'chloroplasts',
    name: 'Chloroplasts',
    tagline: 'Solar Energy Kitchen',
    function: 'Makes food using sunlight (photosynthesis)',
    plantsOnly: true,
    color: '#22c55e', // Green
    accentColor: '#4ade80',
    description:
      'Specialized double-membrane plastids packed with green chlorophyll pigments. They capture light energy and convert carbon dioxide and water into glucose and oxygen through the biochemical magic of photosynthesis.',
    realWorldAnalogy: 'High-efficiency solar panels connected to a zero-carbon food kitchen.',
    keyFacts: [
      'FOUND IN PLANTS ONLY (and photosynthetic algae)',
      'Contains disc-like thylakoids stacked into grana resembling stacks of coins',
      'Equation: Carbon Dioxide + Water + Sunlight ➔ Glucose + Oxygen'
    ],
    icon: 'Sun',
    soundFrequency: 784
  }
];

export interface RescueScenario {
  id: string;
  title: string;
  emergency: string;
  clue: string;
  targetOrganelleId: string;
  cellTypeNeeded: 'plant' | 'both';
  difficulty: 'easy' | 'medium' | 'hard';
}

export const RESCUE_SCENARIOS: RescueScenario[] = [
  {
    id: 's1',
    title: 'Code Red: Critical Power Outage!',
    emergency: 'The cell has depleted its ATP reserves! Cellular processes are grinding to a halt without chemical fuel.',
    clue: 'Locate the organelle that produces energy for the cell — the "powerhouse"!',
    targetOrganelleId: 'mitochondria',
    cellTypeNeeded: 'both',
    difficulty: 'easy'
  },
  {
    id: 's2',
    title: 'Command Signal Missing!',
    emergency: 'Enzymes are awaiting instruction on gene expression and DNA replication. Who runs this cell?',
    clue: 'Find the control centre that directs all cell activities and holds DNA!',
    targetOrganelleId: 'nucleus',
    cellTypeNeeded: 'both',
    difficulty: 'easy'
  },
  {
    id: 's3',
    title: 'Toxic Infiltration Threat!',
    emergency: 'Harmful extracellular solutes are attempting to breach the cell boundaries! We need barrier filtration.',
    clue: 'Target the structure that controls what enters and leaves the cell and protects it!',
    targetOrganelleId: 'cell_membrane',
    cellTypeNeeded: 'both',
    difficulty: 'easy'
  },
  {
    id: 's4',
    title: 'Severe Drought & Wilting Alert!',
    emergency: 'Internal fluid reserves are dropping fast! The cell needs to draw on stored water to prevent collapse.',
    clue: 'Find the reservoir that stores water, food, and waste (larger in plant cells)!',
    targetOrganelleId: 'vacuole',
    cellTypeNeeded: 'both',
    difficulty: 'easy'
  },
  {
    id: 's5',
    title: 'Photosynthesis Solar Activation!',
    emergency: 'Bright morning sunlight has struck the plant leaf, but glucose synthesis cannot begin without the solar machinery!',
    clue: 'Find the green organelle that makes food using sunlight (photosynthesis) [plants only]!',
    targetOrganelleId: 'chloroplasts',
    cellTypeNeeded: 'plant',
    difficulty: 'medium'
  },
  {
    id: 's6',
    title: 'Structural Integrity Failure!',
    emergency: 'High osmotic turgor pressure is swelling the plant cell! Without external reinforcement, it will burst!',
    clue: 'Find the rigid outer jacket that gives support, shape, and protection [plants only]!',
    targetOrganelleId: 'cell_wall',
    cellTypeNeeded: 'plant',
    difficulty: 'medium'
  },
  {
    id: 's7',
    title: 'Organelle Suspension Hazard!',
    emergency: 'Organelles are shifting out of place! We need the fluid matrix that cushions and suspends everything.',
    clue: 'Locate the jelly-like substance that holds all organelles in place!',
    targetOrganelleId: 'cytoplasm',
    cellTypeNeeded: 'both',
    difficulty: 'hard'
  }
];

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  targetOrganelleId: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Which cell part is known as the "powerhouse" because it produces energy for the cell?',
    options: ['Nucleus', 'Mitochondria', 'Vacuole', 'Cytoplasm'],
    correctAnswer: 'Mitochondria',
    explanation: 'Mitochondria produce energy (ATP) for the cell through cellular respiration.',
    targetOrganelleId: 'mitochondria'
  },
  {
    id: 'q2',
    question: 'What is the function of the Cell Membrane?',
    options: [
      'Controls what enters and leaves the cell; protects it',
      'Makes food using sunlight through photosynthesis',
      'Directs all cell activities and holds DNA',
      'Gives rigid support to plant cells only'
    ],
    correctAnswer: 'Controls what enters and leaves the cell; protects it',
    explanation: 'The cell membrane is a selective barrier controlling molecular transit in and out of the cell.',
    targetOrganelleId: 'cell_membrane'
  },
  {
    id: 'q3',
    question: 'Which cell part acts as the control centre, directs all cell activities, and holds DNA?',
    options: ['Chloroplasts', 'Cytoplasm', 'Nucleus', 'Cell Wall'],
    correctAnswer: 'Nucleus',
    explanation: 'The nucleus contains genetic material (DNA) and directs all cellular activities.',
    targetOrganelleId: 'nucleus'
  },
  {
    id: 'q4',
    question: 'Which of the following is found in PLANTS ONLY and makes food using sunlight?',
    options: ['Mitochondria', 'Vacuole', 'Chloroplasts', 'Cell Membrane'],
    correctAnswer: 'Chloroplasts',
    explanation: 'Chloroplasts contain chlorophyll to perform photosynthesis, converting sunlight into food (plants only).',
    targetOrganelleId: 'chloroplasts'
  },
  {
    id: 'q5',
    question: 'Which structure gives support, shape, and protection and is found in PLANTS ONLY?',
    options: ['Cell Wall', 'Cell Membrane', 'Cytoplasm', 'Nucleus'],
    correctAnswer: 'Cell Wall',
    explanation: 'The cell wall is a rigid cellulose structure found only in plant cells (not animal cells) for support and shape.',
    targetOrganelleId: 'cell_wall'
  },
  {
    id: 'q6',
    question: 'What is the jelly-like substance that holds all organelles in place?',
    options: ['Vacuole', 'Cytoplasm', 'Cell Membrane', 'Chloroplasts'],
    correctAnswer: 'Cytoplasm',
    explanation: 'The cytoplasm is the jelly-like cytosol filling the cell interior and holding organelles in position.',
    targetOrganelleId: 'cytoplasm'
  },
  {
    id: 'q7',
    question: 'Which organelle stores water, food, and waste, and is noticeably larger in plant cells?',
    options: ['Vacuole', 'Nucleus', 'Mitochondria', 'Cell Wall'],
    correctAnswer: 'Vacuole',
    explanation: 'The vacuole stores water, food, and waste. In plant cells, it forms a large central vacuole for turgor pressure.',
    targetOrganelleId: 'vacuole'
  }
];
