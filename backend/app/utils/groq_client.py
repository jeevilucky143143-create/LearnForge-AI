import json
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert instructional designer and technical educator. Your goal is to analyze the provided text extracted from a PDF and convert it into a highly structured, comprehensive course.

You must return a single JSON object. The JSON object must strictly match the following schema:
{
  "title": "Course Title",
  "description": "A comprehensive overview of the course content.",
  "estimated_time_minutes": 120,
  "learning_objectives": ["Objective 1", "Objective 2"],
  "difficulty": "beginner",
  "chapters": [
    {
      "title": "Chapter 1 Title",
      "order_index": 1,
      "lessons": [
        {
          "title": "Lesson 1 Title",
          "order_index": 1,
          "content": "Comprehensive and detailed educational content for this lesson in rich Markdown format. Break down concepts, use subheadings, list definitions, and provide examples based on the PDF content. Ensure this is at least 300 words of actual, high-quality learning material.",
          "learning_outcome": "What the user will be able to do or understand after this lesson."
        }
      ]
    }
  ]
}

Constraints:
1. The "difficulty" field MUST be exactly one of: "beginner", "intermediate", "advanced".
2. Order indexes for chapters and lessons must start at 1 and increment sequentially.
3. Every lesson must have substantial markdown content. Do not output brief summaries or place-holders.
4. Output ONLY the raw JSON object. Do not prefix or suffix the JSON with explanations. Do not wrap the JSON in Markdown code blocks (e.g. do not use ```json ... ```).
"""

def validate_course_json(course: dict) -> bool:
    """Validate that the course JSON contains all required fields and correct structure."""
    required_keys = ["title", "description", "estimated_time_minutes", "learning_objectives", "difficulty", "chapters"]
    for key in required_keys:
        if key not in course:
            logger.error(f"Missing required course key: {key}")
            return False

    if not isinstance(course["chapters"], list) or len(course["chapters"]) == 0:
        logger.error("Chapters must be a non-empty list")
        return False

    for i, ch in enumerate(course["chapters"]):
        if not isinstance(ch, dict):
            return False
        if "title" not in ch or "order_index" not in ch or "lessons" not in ch:
            logger.error("Chapter missing title, order_index, or lessons")
            return False
        if not isinstance(ch["lessons"], list) or len(ch["lessons"]) == 0:
            logger.error(f"Chapter '{ch.get('title')}' lessons list is empty")
            return False

        for j, les in enumerate(ch["lessons"]):
            if not isinstance(les, dict):
                return False
            lesson_keys = ["title", "order_index", "content", "learning_outcome"]
            for lk in lesson_keys:
                if lk not in les:
                    logger.error(f"Lesson missing key: {lk}")
                    return False
    return True

def generate_course_json(title: str, difficulty: str, text_content: str, retry_error: str = None) -> dict:
    """Calls Groq Chat Completions API to generate a structured course in JSON format."""
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured in settings.")

    # Truncate text content to prevent context window / rate limit overflows
    max_chars = 100000
    truncated_text = text_content[:max_chars]

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    user_prompt = f"Generate a course on the topic: '{title}' with difficulty level '{difficulty}'.\n\nSource material extracted from PDF:\n{truncated_text}"
    if retry_error:
        user_prompt += f"\n\nIMPORTANT: Your previous attempt failed validation with error: '{retry_error}'. Please output valid JSON matching the schema precisely without syntax errors."

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ]

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": messages,
        "response_format": {"type": "json_object"},
        "temperature": 0.3,
    }

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            content_str = result["choices"][0]["message"]["content"]
            
            # Parse JSON
            course_data = json.loads(content_str)
            return course_data
    except Exception as e:
        logger.error(f"Groq API call or parsing failed: {e}")
        raise ValueError(f"Groq generation failed: {e}")
