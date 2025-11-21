import type { CodingQuestion } from '../types';

// Curated list of easy LeetCode problems
export const getEasyCodingQuestions = (): CodingQuestion[] => {
  return [
    {
      id: 'lc-1',
      title: 'Two Sum',
      description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
      difficulty: 'easy',
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
        },
        {
          input: 'nums = [3,2,4], target = 6',
          output: '[1,2]'
        },
        {
          input: 'nums = [3,3], target = 6',
          output: '[0,1]'
        }
      ],
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
        'Only one valid answer exists.'
      ],
      functionSignature: 'function twoSum(nums: number[], target: number): number[]',
      starterCode: `function twoSum(nums: number[], target: number): number[] {
    // Your code here
}`,
      leetcodeId: '1'
    },
    {
      id: 'lc-20',
      title: 'Valid Parentheses',
      description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
      difficulty: 'easy',
      examples: [
        {
          input: 's = "()"',
          output: 'true'
        },
        {
          input: 's = "()[]{}"',
          output: 'true'
        },
        {
          input: 's = "(]"',
          output: 'false'
        }
      ],
      constraints: [
        '1 <= s.length <= 10^4',
        's consists of parentheses only \'()[]{}\'.'
      ],
      functionSignature: 'function isValid(s: string): boolean',
      starterCode: `function isValid(s: string): boolean {
    // Your code here
}`,
      leetcodeId: '20'
    },
    {
      id: 'lc-121',
      title: 'Best Time to Buy and Sell Stock',
      description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
      difficulty: 'easy',
      examples: [
        {
          input: 'prices = [7,1,5,3,6,4]',
          output: '5',
          explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.'
        },
        {
          input: 'prices = [7,6,4,3,1]',
          output: '0',
          explanation: 'In this case, no transactions are done and the max profit = 0.'
        }
      ],
      constraints: [
        '1 <= prices.length <= 10^5',
        '0 <= prices[i] <= 10^4'
      ],
      functionSignature: 'function maxProfit(prices: number[]): number',
      starterCode: `function maxProfit(prices: number[]): number {
    // Your code here
}`,
      leetcodeId: '121'
    },
    {
      id: 'lc-217',
      title: 'Contains Duplicate',
      description: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.`,
      difficulty: 'easy',
      examples: [
        {
          input: 'nums = [1,2,3,1]',
          output: 'true'
        },
        {
          input: 'nums = [1,2,3,4]',
          output: 'false'
        },
        {
          input: 'nums = [1,1,1,3,3,4,3,2,4,2]',
          output: 'true'
        }
      ],
      constraints: [
        '1 <= nums.length <= 10^5',
        '-10^9 <= nums[i] <= 10^9'
      ],
      functionSignature: 'function containsDuplicate(nums: number[]): boolean',
      starterCode: `function containsDuplicate(nums: number[]): boolean {
    // Your code here
}`,
      leetcodeId: '217'
    },
    {
      id: 'lc-53',
      title: 'Maximum Subarray',
      description: `Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

A subarray is a contiguous part of an array.`,
      difficulty: 'easy',
      examples: [
        {
          input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
          output: '6',
          explanation: '[4,-1,2,1] has the largest sum = 6.'
        },
        {
          input: 'nums = [1]',
          output: '1'
        },
        {
          input: 'nums = [5,4,-1,7,8]',
          output: '23'
        }
      ],
      constraints: [
        '1 <= nums.length <= 10^5',
        '-10^4 <= nums[i] <= 10^4'
      ],
      functionSignature: 'function maxSubArray(nums: number[]): number',
      starterCode: `function maxSubArray(nums: number[]): number {
    // Your code here
}`,
      leetcodeId: '53'
    },
    {
      id: 'lc-242',
      title: 'Valid Anagram',
      description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
      difficulty: 'easy',
      examples: [
        {
          input: 's = "anagram", t = "nagaram"',
          output: 'true'
        },
        {
          input: 's = "rat", t = "car"',
          output: 'false'
        }
      ],
      constraints: [
        '1 <= s.length, t.length <= 5 * 10^4',
        's and t consist of lowercase English letters.'
      ],
      functionSignature: 'function isAnagram(s: string, t: string): boolean',
      starterCode: `function isAnagram(s: string, t: string): boolean {
    // Your code here
}`,
      leetcodeId: '242'
    }
  ];
};

// Get a random easy coding question
export const getRandomCodingQuestion = (): CodingQuestion => {
  const questions = getEasyCodingQuestions();
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};





