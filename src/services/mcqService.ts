import type { MCQQuestion } from '../types';

// MCQ Question Service
// NOTE: Currently using a local question bank - NOT calling GeeksforGeeks API
// The function name fetchMCQsFromGeeksforGeeks is kept for backward compatibility
// but it actually returns questions from a local MCQ_BANK array

const MCQ_BANK: MCQQuestion[] = [
  // Aptitude (3 questions)
  {
    id: 'apt-1',
    category: 'aptitude',
    question: 'A train travels 180 km in 3 hours. What is its average speed?',
    options: ['30 km/h', '45 km/h', '60 km/h', '90 km/h'],
    correctOption: 2,
  },
  {
    id: 'apt-2',
    category: 'aptitude',
    question: 'What is the simple interest on $5,000 at 8% annual rate for 2 years?',
    options: ['$400', '$600', '$800', '$1,000'],
    correctOption: 2,
  },
  {
    id: 'apt-3',
    category: 'aptitude',
    question: 'If 3 workers can complete a task in 12 days, how many days will 6 workers take (same efficiency)?',
    options: ['2 days', '4 days', '6 days', '8 days'],
    correctOption: 2,
  },
  // Logical Reasoning (2 questions)
  {
    id: 'log-1',
    category: 'logical',
    question: 'Which number completes the series: 3, 9, 27, ?, 243?',
    options: ['54', '63', '81', '108'],
    correctOption: 2,
  },
  {
    id: 'log-2',
    category: 'logical',
    question: 'All roses are flowers. Some flowers fade quickly. Which statement must be true?',
    options: [
      'Some roses fade quickly',
      'All flowers are roses',
      'Some roses may fade quickly',
      'No roses fade quickly',
    ],
    correctOption: 2,
  },
  // English (2 questions)
  {
    id: 'eng-1',
    category: 'english',
    question: 'Choose the option that best completes the sentence: "Had I known about the traffic, I _____ earlier."',
    options: ['leave', 'would have left', 'left', 'will leave'],
    correctOption: 1,
  },
  {
    id: 'eng-2',
    category: 'english',
    question: 'Select the word that is closest in meaning to "ephemeral".',
    options: ['lasting', 'fleeting', 'stable', 'permanent'],
    correctOption: 1,
  },
  // Programming (3 questions)
  {
    id: 'prog-1',
    category: 'programming',
    question: 'What is the time complexity of searching an element in a balanced binary search tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctOption: 1,
  },
  {
    id: 'prog-2',
    category: 'programming',
    question: 'Which HTTP status code indicates that the client must authenticate itself to get the requested response?',
    options: ['200', '301', '401', '500'],
    correctOption: 2,
  },
  {
    id: 'prog-3',
    category: 'programming',
    question: 'In JavaScript, what is the output of typeof null?',
    options: ['"null"', '"object"', '"undefined"', '"number"'],
    correctOption: 1,
  },
  // Additional questions for variety
  {
    id: 'apt-4',
    category: 'aptitude',
    question: 'A shopkeeper sells an item at 20% profit. If the cost price is $100, what is the selling price?',
    options: ['$110', '$120', '$130', '$140'],
    correctOption: 1,
  },
  {
    id: 'log-3',
    category: 'logical',
    question: 'If all cats are animals and some animals are pets, which statement is necessarily true?',
    options: [
      'All cats are pets',
      'Some cats are pets',
      'No cats are pets',
      'All pets are cats',
    ],
    correctOption: 1,
  },
  {
    id: 'eng-3',
    category: 'english',
    question: 'Identify the grammatically correct sentence:',
    options: [
      'Neither of the students were present',
      'Neither of the students was present',
      'Neither of the student were present',
      'Neither of the student was present',
    ],
    correctOption: 1,
  },
  {
    id: 'prog-4',
    category: 'programming',
    question: 'What is the space complexity of merge sort algorithm?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctOption: 2,
  },
  {
    id: 'prog-5',
    category: 'programming',
    question: 'Which data structure follows LIFO (Last In First Out) principle?',
    options: ['Queue', 'Stack', 'Array', 'Linked List'],
    correctOption: 1,
  },
  // Additional Aptitude Questions
  {
    id: 'apt-5',
    category: 'aptitude',
    question: 'If a number is increased by 25% and then decreased by 20%, what is the net change?',
    options: ['5% increase', 'No change', '5% decrease', '10% decrease'],
    correctOption: 1,
  },
  {
    id: 'apt-6',
    category: 'aptitude',
    question: 'A rectangle has length 12 cm and width 8 cm. What is its area?',
    options: ['40 cm²', '80 cm²', '96 cm²', '100 cm²'],
    correctOption: 2,
  },
  {
    id: 'apt-7',
    category: 'aptitude',
    question: 'If 15% of a number is 45, what is 30% of that number?',
    options: ['60', '90', '120', '150'],
    correctOption: 1,
  },
  {
    id: 'apt-8',
    category: 'aptitude',
    question: 'A car travels 240 km in 4 hours. How long will it take to travel 360 km at the same speed?',
    options: ['5 hours', '6 hours', '7 hours', '8 hours'],
    correctOption: 1,
  },
  {
    id: 'apt-9',
    category: 'aptitude',
    question: 'What is the average of the numbers 12, 18, 24, and 30?',
    options: ['20', '21', '22', '24'],
    correctOption: 1,
  },
  {
    id: 'apt-10',
    category: 'aptitude',
    question: 'If the price of a product is reduced by 30%, by what percentage should it be increased to restore the original price?',
    options: ['30%', '42.86%', '50%', '70%'],
    correctOption: 1,
  },
  {
    id: 'apt-11',
    category: 'aptitude',
    question: 'A sum of money doubles itself in 8 years at simple interest. In how many years will it triple?',
    options: ['12 years', '16 years', '20 years', '24 years'],
    correctOption: 1,
  },
  {
    id: 'apt-12',
    category: 'aptitude',
    question: 'If 5 workers can build a wall in 10 days, how many days will 10 workers take?',
    options: ['3 days', '5 days', '7 days', '10 days'],
    correctOption: 1,
  },
  {
    id: 'apt-13',
    category: 'aptitude',
    question: 'What is 25% of 200?',
    options: ['40', '50', '60', '75'],
    correctOption: 1,
  },
  {
    id: 'apt-14',
    category: 'aptitude',
    question: 'A person walks 3 km north, then 4 km east. How far is he from the starting point?',
    options: ['5 km', '6 km', '7 km', '8 km'],
    correctOption: 0,
  },
  // Additional Logical Reasoning Questions
  {
    id: 'log-4',
    category: 'logical',
    question: 'Complete the series: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '48'],
    correctOption: 1,
  },
  {
    id: 'log-5',
    category: 'logical',
    question: 'If all birds can fly and penguins are birds, which statement is true?',
    options: [
      'All penguins can fly',
      'Some penguins cannot fly',
      'No penguins can fly',
      'Penguins are not birds',
    ],
    correctOption: 1,
  },
  {
    id: 'log-6',
    category: 'logical',
    question: 'Find the missing number: 5, 10, 20, 40, ?',
    options: ['60', '70', '80', '90'],
    correctOption: 2,
  },
  {
    id: 'log-7',
    category: 'logical',
    question: 'If Monday is the first day, what day is the 15th day?',
    options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    correctOption: 0,
  },
  {
    id: 'log-8',
    category: 'logical',
    question: 'Complete the pattern: A, C, E, G, ?',
    options: ['H', 'I', 'J', 'K'],
    correctOption: 1,
  },
  {
    id: 'log-9',
    category: 'logical',
    question: 'If all doctors are professionals and some professionals are teachers, which is necessarily true?',
    options: [
      'All doctors are teachers',
      'Some doctors are teachers',
      'Some teachers are doctors',
      'No doctors are teachers',
    ],
    correctOption: 2,
  },
  {
    id: 'log-10',
    category: 'logical',
    question: 'Find the odd one out: 2, 4, 8, 16, 32, 64, 128',
    options: ['2', '4', '8', 'None (all follow pattern)'],
    correctOption: 3,
  },
  {
    id: 'log-11',
    category: 'logical',
    question: 'If RED is coded as 18-5-4, how is BLUE coded?',
    options: ['2-12-21-5', '2-11-20-4', '2-12-20-5', '2-11-21-4'],
    correctOption: 0,
  },
  {
    id: 'log-12',
    category: 'logical',
    question: 'Complete the series: Z, Y, X, W, V, ?',
    options: ['U', 'T', 'S', 'R'],
    correctOption: 0,
  },
  // Additional English Questions
  {
    id: 'eng-4',
    category: 'english',
    question: 'Choose the correct form: "The team _____ working on the project."',
    options: ['is', 'are', 'were', 'have'],
    correctOption: 0,
  },
  {
    id: 'eng-5',
    category: 'english',
    question: 'What is the synonym of "benevolent"?',
    options: ['cruel', 'kind', 'angry', 'sad'],
    correctOption: 1,
  },
  {
    id: 'eng-6',
    category: 'english',
    question: 'Select the correctly spelled word:',
    options: ['accomodate', 'accommodate', 'acommodate', 'accomodat'],
    correctOption: 1,
  },
  {
    id: 'eng-7',
    category: 'english',
    question: 'Choose the correct preposition: "She is allergic _____ peanuts."',
    options: ['to', 'with', 'for', 'from'],
    correctOption: 0,
  },
  {
    id: 'eng-8',
    category: 'english',
    question: 'What is the antonym of "profound"?',
    options: ['deep', 'shallow', 'wide', 'narrow'],
    correctOption: 1,
  },
  {
    id: 'eng-9',
    category: 'english',
    question: 'Identify the grammatically correct sentence:',
    options: [
      'Each of the students have completed their assignment',
      'Each of the students has completed their assignment',
      'Each of the students have completed his assignment',
      'Each of the students has completed his assignment',
    ],
    correctOption: 1,
  },
  {
    id: 'eng-10',
    category: 'english',
    question: 'What is the meaning of "ubiquitous"?',
    options: ['rare', 'present everywhere', 'hidden', 'ancient'],
    correctOption: 1,
  },
  {
    id: 'eng-11',
    category: 'english',
    question: 'Choose the correct form: "Neither the manager nor the employees _____ satisfied."',
    options: ['is', 'are', 'was', 'were'],
    correctOption: 1,
  },
  {
    id: 'eng-12',
    category: 'english',
    question: 'What is the synonym of "meticulous"?',
    options: ['careless', 'careful', 'hasty', 'lazy'],
    correctOption: 1,
  },
  // Additional Programming Questions
  {
    id: 'prog-6',
    category: 'programming',
    question: 'What is the time complexity of bubble sort in the worst case?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'],
    correctOption: 2,
  },
  {
    id: 'prog-7',
    category: 'programming',
    question: 'Which of the following is NOT a valid variable name in JavaScript?',
    options: ['_variable', '2variable', 'variable2', '$variable'],
    correctOption: 1,
  },
  {
    id: 'prog-8',
    category: 'programming',
    question: 'What does SQL stand for?',
    options: [
      'Structured Query Language',
      'Simple Query Language',
      'Standard Query Language',
      'Sequential Query Language',
    ],
    correctOption: 0,
  },
  {
    id: 'prog-9',
    category: 'programming',
    question: 'In Python, which method is used to add an element to the end of a list?',
    options: ['append()', 'add()', 'insert()', 'push()'],
    correctOption: 0,
  },
  {
    id: 'prog-10',
    category: 'programming',
    question: 'What is the default HTTP method for HTML forms?',
    options: ['GET', 'POST', 'PUT', 'DELETE'],
    correctOption: 0,
  },
  {
    id: 'prog-11',
    category: 'programming',
    question: 'Which data structure is used for implementing recursion?',
    options: ['Queue', 'Stack', 'Array', 'Tree'],
    correctOption: 1,
  },
  {
    id: 'prog-12',
    category: 'programming',
    question: 'What is the output of: console.log(typeof undefined) in JavaScript?',
    options: ['"undefined"', '"object"', '"null"', '"string"'],
    correctOption: 0,
  },
  {
    id: 'prog-13',
    category: 'programming',
    question: 'Which HTTP status code means "Not Found"?',
    options: ['200', '301', '404', '500'],
    correctOption: 2,
  },
  {
    id: 'prog-14',
    category: 'programming',
    question: 'What is the time complexity of accessing an element in an array by index?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctOption: 0,
  },
];

/**
 * Get MCQ questions from local question bank
 * NOTE: This function does NOT call GeeksforGeeks API - it uses a local question bank
 * To implement actual GeeksforGeeks API integration, uncomment and implement the API call below
 */
export const fetchMCQsFromGeeksforGeeks = async (): Promise<MCQQuestion[]> => {
  // Currently using local question bank - no external API calls
  // TODO: If you want to integrate GeeksforGeeks API, implement it here:
  // try {
  //   const response = await fetch('https://api.geeksforgeeks.org/v1/questions/mcq');
  //   if (!response.ok) throw new Error('API request failed');
  //   const data = await response.json();
  //   return transformToMCQFormat(data);
  // } catch (error) {
  //   console.error('Error fetching MCQs from GeeksforGeeks API:', error);
  //   // Fallback to local question bank
  //   return getRandomizedMCQs();
  // }
  
  // Return randomized questions from local bank
  return getRandomizedMCQs();
};

/**
 * Get randomized MCQs ensuring proper distribution:
 * - 3 aptitude
 * - 2 logical reasoning
 * - 2 English
 * - 3 programming
 */
export const getRandomizedMCQs = (): MCQQuestion[] => {
  const aptitude = MCQ_BANK.filter(q => q.category === 'aptitude');
  const logical = MCQ_BANK.filter(q => q.category === 'logical');
  const english = MCQ_BANK.filter(q => q.category === 'english');
  const programming = MCQ_BANK.filter(q => q.category === 'programming');

  // Shuffle arrays
  const shuffle = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Select required number from each category
  const selected: MCQQuestion[] = [
    ...shuffle(aptitude).slice(0, 3),
    ...shuffle(logical).slice(0, 2),
    ...shuffle(english).slice(0, 2),
    ...shuffle(programming).slice(0, 3),
  ];

  // Shuffle the final array to randomize order
  return shuffle(selected).map((q, index) => ({
    ...q,
    id: `mcq-${Date.now()}-${index}`, // Ensure unique IDs
  }));
};

/**
 * Get default MCQs (for backward compatibility)
 */
export const getDefaultMCQQuestions = (): MCQQuestion[] => {
  return getRandomizedMCQs();
};


