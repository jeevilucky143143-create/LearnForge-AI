import enum
from sqlalchemy import Enum

class DifficultyLevel(enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"

class QuizQuestionType(enum.Enum):
    mcq = "mcq"
    true_false = "true_false"
    short_answer = "short_answer"

class QuizStatus(enum.Enum):
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"

class ChatRole(enum.Enum):
    user = "user"
    assistant = "assistant"
