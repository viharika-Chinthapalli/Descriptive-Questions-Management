/**
 * Quick test script for similarity checking
 * Run with: node test-similarity.js
 */

const similarity = require('./services/similarity');
const storage = require('./services/storage');

async function testSimilarity() {
  try {
    // Get all questions
    const questions = await storage.getAllQuestions();
    console.log('Total questions:', questions.length);
    
    if (questions.length === 0) {
      console.log('No questions in database. Add a question first.');
      return;
    }
    
    // Test with the first question
    const testQuestion = questions[0].question_text;
    console.log('\nTesting with question:', testQuestion);
    
    const result = similarity.checkSimilarity(questions, testQuestion);
    
    console.log('\nResults:');
    console.log('Is Duplicate:', result.isDuplicate);
    console.log('Exact Match:', result.exactMatch);
    console.log('Similar Questions Count:', result.similarQuestions.length);
    
    if (result.similarQuestions.length > 0) {
      console.log('\nSimilar Questions:');
      result.similarQuestions.forEach(([q, score], index) => {
        console.log(`${index + 1}. ID: ${q.id}, Score: ${score.toFixed(3)}`);
        console.log(`   Text: ${q.question_text.substring(0, 50)}...`);
      });
    }
    
    // Test with a different question
    console.log('\n\nTesting with a different question:');
    const differentQuestion = 'What is JavaScript?';
    const result2 = similarity.checkSimilarity(questions, differentQuestion);
    console.log('Is Duplicate:', result2.isDuplicate);
    console.log('Exact Match:', result2.exactMatch);
    console.log('Similar Questions Count:', result2.similarQuestions.length);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

testSimilarity();


