import unittest
from unittest.mock import MagicMock
from uuid import uuid4

class TestQuizzesFlow(unittest.TestCase):
    def test_grading_scoring_logic(self):
        """Test the grading calculation logic on submitted quiz answers."""
        # Setup questions list
        questions = [
            {"id": "q1", "correct_answer": "A"},
            {"id": "q2", "correct_answer": "B"},
            {"id": "q3", "correct_answer": "C"},
            {"id": "q4", "correct_answer": "D"},
        ]
        
        # User submitted answers
        submitted_answers = {
            "q1": "A", # Correct
            "q2": "A", # Incorrect
            "q3": "C", # Correct
            "q4": "D", # Correct
        }
        
        # Score calculation
        correct_count = 0
        total_questions = len(questions)
        
        for q in questions:
            user_ans = submitted_answers.get(q["id"])
            if user_ans == q["correct_answer"]:
                correct_count += 1
                
        score_percentage = (correct_count / total_questions) * 100
        
        self.assertEqual(correct_count, 3)
        self.assertEqual(score_percentage, 75.0)

if __name__ == "__main__":
    unittest.main()
