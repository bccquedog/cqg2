// AI Username Generator Service
// Generates creative, gaming-themed usernames using AI patterns

export interface UsernameSuggestion {
  username: string;
  category: string;
  description: string;
  style: 'competitive' | 'creative' | 'minimal' | 'epic' | 'tech';
}

// Gaming-themed word lists for AI-like generation
const gamingPrefixes = [
  'Shadow', 'Neon', 'Cyber', 'Quantum', 'Nova', 'Phoenix', 'Storm', 'Blaze', 'Frost', 'Thunder',
  'Crystal', 'Mystic', 'Legend', 'Epic', 'Pro', 'Elite', 'Master', 'Apex', 'Prime', 'Ultra',
  'Velocity', 'Matrix', 'Vortex', 'Zenith', 'Titan', 'Dragon', 'Falcon', 'Wolf', 'Tiger', 'Eagle'
];

const gamingSuffixes = [
  'Slayer', 'Hunter', 'Warrior', 'Guardian', 'Assassin', 'Mage', 'Rogue', 'Knight', 'Paladin', 'Ranger',
  'Ninja', 'Samurai', 'Viking', 'Pirate', 'Commando', 'Sniper', 'Tank', 'Healer', 'Wizard', 'Berserker',
  'Strike', 'Blade', 'Fist', 'Claw', 'Fang', 'Storm', 'Fire', 'Ice', 'Lightning', 'Shadow',
  'Ghost', 'Phantom', 'Demon', 'Angel', 'Beast', 'Monster', 'Giant', 'Titan', 'Legend', 'Myth'
];

const techTerms = [
  'Byte', 'Code', 'Data', 'Pixel', 'Node', 'Link', 'Core', 'Edge', 'Cloud', 'Grid',
  'Matrix', 'Vector', 'Logic', 'Binary', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Sigma'
];

const creativeWords = [
  'Cosmic', 'Lunar', 'Solar', 'Stellar', 'Galactic', 'Atomic', 'Plasma', 'Energy', 'Force', 'Power',
  'Infinity', 'Zero', 'X', 'Z', 'Q', 'K', 'V', 'W', 'Y', 'Omega'
];

const numbers = ['7', '13', '21', '42', '99', '007', '1337', '2024', '3000', '777'];

// AI-like generation patterns
const generateUsername = (pattern: string): UsernameSuggestion => {
  let username = '';
  let category = '';
  let description = '';
  let style: UsernameSuggestion['style'] = 'competitive';

  switch (pattern) {
    case 'competitive':
      const prefix1 = gamingPrefixes[Math.floor(Math.random() * gamingPrefixes.length)];
      const suffix1 = gamingSuffixes[Math.floor(Math.random() * gamingSuffixes.length)];
      username = `${prefix1}${suffix1}`;
      category = 'Competitive Gaming';
      description = 'Powerful and intimidating';
      style = 'competitive';
      break;

    case 'creative':
      const prefix2 = creativeWords[Math.floor(Math.random() * creativeWords.length)];
      const suffix2 = techTerms[Math.floor(Math.random() * techTerms.length)];
      username = `${prefix2}${suffix2}`;
      category = 'Creative Tech';
      description = 'Unique and memorable';
      style = 'creative';
      break;

    case 'minimal':
      const prefix3 = gamingPrefixes[Math.floor(Math.random() * gamingPrefixes.length)];
      const num = numbers[Math.floor(Math.random() * numbers.length)];
      username = `${prefix3}${num}`;
      category = 'Minimal & Clean';
      description = 'Simple and effective';
      style = 'minimal';
      break;

    case 'epic':
      const prefix4 = gamingPrefixes[Math.floor(Math.random() * gamingPrefixes.length)];
      const suffix4 = gamingSuffixes[Math.floor(Math.random() * gamingSuffixes.length)];
      const num2 = numbers[Math.floor(Math.random() * numbers.length)];
      username = `${prefix4}${suffix4}${num2}`;
      category = 'Epic Gaming';
      description = 'Legendary and powerful';
      style = 'epic';
      break;

    case 'tech':
      const prefix5 = techTerms[Math.floor(Math.random() * techTerms.length)];
      const suffix5 = creativeWords[Math.floor(Math.random() * creativeWords.length)];
      username = `${prefix5}${suffix5}`;
      category = 'Tech Gaming';
      description = 'Modern and technical';
      style = 'tech';
      break;

    default:
      username = 'Player' + Math.floor(1000 + Math.random() * 9000);
      category = 'Default';
      description = 'Simple and available';
      style = 'minimal';
  }

  // Ensure username length is within limits
  if (username.length > 16) {
    username = username.substring(0, 16);
  }

  return { username, category, description, style };
};

// Generate multiple AI username suggestions
export const generateAIUsernameSuggestions = (count: number = 5): UsernameSuggestion[] => {
  const patterns = ['competitive', 'creative', 'minimal', 'epic', 'tech'];
  const suggestions: UsernameSuggestion[] = [];

  for (let i = 0; i < count; i++) {
    const pattern = patterns[i % patterns.length];
    suggestions.push(generateUsername(pattern));
  }

  return suggestions;
};

// Generate a single AI username with specific style
export const generateAIUsername = (style?: UsernameSuggestion['style']): UsernameSuggestion => {
  const styles: UsernameSuggestion['style'][] = ['competitive', 'creative', 'minimal', 'epic', 'tech'];
  const selectedStyle = style || styles[Math.floor(Math.random() * styles.length)];
  
  return generateUsername(selectedStyle);
};

// Validate AI-generated username
export const validateAIUsername = (username: string): { valid: boolean; error?: string } => {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 16) {
    return { valid: false, error: 'Username must be 16 characters or less' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Only letters, numbers, and underscores allowed' };
  }
  
  return { valid: true };
};

// Get style-specific descriptions
export const getStyleDescriptions = (): Record<UsernameSuggestion['style'], string> => ({
  competitive: 'Intimidating names that command respect in competitive gaming',
  creative: 'Unique combinations that stand out and are memorable',
  minimal: 'Clean, simple names that are easy to remember',
  epic: 'Legendary names that sound powerful and heroic',
  tech: 'Modern, technical names that appeal to tech-savvy gamers'
});

// Get category emoji
export const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    'Competitive Gaming': '⚔️',
    'Creative Tech': '🎨',
    'Minimal & Clean': '✨',
    'Epic Gaming': '🏆',
    'Tech Gaming': '💻',
    'Default': '🎮'
  };
  
  return emojiMap[category] || '🎮';
};
