import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from uuid import UUID

from app.db import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.course import Course
from app.models.chapter import Chapter
from app.models.lesson import Lesson
from app.models.search_history import SearchHistory
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
import numpy as np

router = APIRouter(prefix="/search", tags=["search"])

class SearchResultOut(BaseModel):
    id: UUID
    type: str # "course", "chapter", "lesson"
    title: str
    course_title: str
    snippet: Optional[str] = None
    course_id: UUID

class RecentSearchOut(BaseModel):
    id: UUID
    query: str
    searched_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[SearchResultOut])
def global_search(
    q: str = Query(..., min_length=1),
    course_id: Optional[UUID] = None,
    type: Optional[str] = None, # "course", "chapter", "lesson"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Global keyword search across courses, chapters, and lessons."""
    # 1. Save or update query in search history
    existing_history = db.query(SearchHistory).filter(
        SearchHistory.user_id == current_user.id,
        SearchHistory.query == q.strip()
    ).first()
    
    if existing_history:
        existing_history.searched_at = datetime.utcnow()
    else:
        new_history = SearchHistory(
            id=uuid.uuid4(),
            user_id=current_user.id,
            query=q.strip()
        )
        db.add(new_history)
    db.commit()

    results = []
    search_term = f"%{q.strip().lower()}%"

    # Search Courses
    if not type or type == "course":
        course_query = db.query(Course).filter(
            Course.user_id == current_user.id,
            or_(
                func.lower(Course.title).like(search_term),
                func.lower(Course.description).like(search_term)
            )
        )
        if course_id:
            course_query = course_query.filter(Course.id == course_id)
        for c in course_query.all():
            results.append(SearchResultOut(
                id=c.id,
                type="course",
                title=c.title,
                course_title=c.title,
                snippet=c.description[:140] if c.description else "",
                course_id=c.id
            ))

    # Search Chapters
    if not type or type == "chapter":
        chapter_query = db.query(Chapter).join(Course).filter(
            Course.user_id == current_user.id,
            func.lower(Chapter.title).like(search_term)
        )
        if course_id:
            chapter_query = chapter_query.filter(Chapter.course_id == course_id)
        for ch in chapter_query.all():
            results.append(SearchResultOut(
                id=ch.id,
                type="chapter",
                title=ch.title,
                course_title=ch.course.title,
                snippet=f"Chapter {ch.order_index}",
                course_id=ch.course_id
            ))

    # Search Lessons
    if not type or type == "lesson":
        lesson_query = db.query(Lesson).join(Chapter).join(Course).filter(
            Course.user_id == current_user.id,
            or_(
                func.lower(Lesson.title).like(search_term),
                func.lower(Lesson.content).like(search_term)
            )
        )
        if course_id:
            lesson_query = lesson_query.filter(Chapter.course_id == course_id)
        for l in lesson_query.all():
            # Extract simple text snippet matching query
            content = l.content or ""
            snippet = ""
            idx = content.lower().find(q.strip().lower())
            if idx != -1:
                start = max(0, idx - 50)
                end = min(len(content), idx + 90)
                snippet = "..." + content[start:end].replace("\n", " ") + "..."
            else:
                snippet = content[:140].replace("\n", " ") + "..."

            results.append(SearchResultOut(
                id=l.id,
                type="lesson",
                title=l.title,
                course_title=l.chapter.course.title,
                snippet=snippet,
                course_id=l.chapter.course_id
            ))

    return results

@router.get("/semantic", response_model=List[SearchResultOut])
def semantic_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Similarity search using dense SVD embeddings (Latent Semantic Analysis)."""
    # Retrieve all lessons belonging to the current user
    lessons = db.query(Lesson).join(Chapter).join(Course).filter(
        Course.user_id == current_user.id
    ).all()

    if not lessons:
        return []

    # Extract texts
    lesson_texts = []
    for l in lessons:
        # Combine title and content to represent the document
        text = f"{l.title}\n{l.content or ''}"
        lesson_texts.append(text)

    # Create TF-IDF representation
    vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
    try:
        tfidf_matrix = vectorizer.fit_transform(lesson_texts)
    except Exception as e:
        return []

    # Apply TruncatedSVD to project into dense semantic space
    num_docs = len(lessons)
    n_components = min(num_docs, 50)
    
    n_features = tfidf_matrix.shape[1]
    n_components = min(n_components, n_features)
    
    scores = []
    if n_components > 0:
        svd = TruncatedSVD(n_components=n_components, random_state=42)
        dense_embeddings = svd.fit_transform(tfidf_matrix)
        
        # Transform query
        query_tfidf = vectorizer.transform([q.strip()])
        query_emb = svd.transform(query_tfidf)
        
        # Calculate Cosine Similarities manually
        dense_embeddings_norm = np.linalg.norm(dense_embeddings, axis=1)
        query_emb_norm = np.linalg.norm(query_emb[0])
        
        for idx, emb in enumerate(dense_embeddings):
            denom = dense_embeddings_norm[idx] * query_emb_norm
            if denom > 0:
                sim = np.dot(emb, query_emb[0]) / denom
            else:
                sim = 0.0
            scores.append((float(sim), idx))
    else:
        # Fallback to simple TF-IDF cosine similarity if SVD is not possible
        query_tfidf = vectorizer.transform([q.strip()])
        from sklearn.metrics.pairwise import cosine_similarity
        sims = cosine_similarity(query_tfidf, tfidf_matrix).flatten()
        scores = [(float(sim), idx) for idx, sim in enumerate(sims)]

    # Build results
    ranked_results = []
    for score, idx in scores:
        if score > 0.05:
            l = lessons[idx]
            content = l.content or ""
            snippet = ""
            q_idx = content.lower().find(q.strip().lower())
            if q_idx != -1:
                start = max(0, q_idx - 50)
                end = min(len(content), q_idx + 90)
                snippet = "..." + content[start:end].replace("\n", " ") + "..."
            else:
                snippet = content[:140].replace("\n", " ") + "..."

            ranked_results.append((score, SearchResultOut(
                id=l.id,
                type="lesson",
                title=l.title,
                course_title=l.chapter.course.title,
                snippet=snippet,
                course_id=l.chapter.course_id
            )))

    # Sort results
    ranked_results.sort(key=lambda x: x[0], reverse=True)
    return [r[1] for r in ranked_results[:10]]

@router.get("/recent", response_model=List[RecentSearchOut])
def get_recent_searches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve 10 recent searches of the user."""
    return db.query(SearchHistory).filter(
        SearchHistory.user_id == current_user.id
    ).order_by(SearchHistory.searched_at.desc()).limit(10).all()

@router.post("/recent/clear")
def clear_search_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear all search history for the user."""
    db.query(SearchHistory).filter(SearchHistory.user_id == current_user.id).delete()
    db.commit()
    return {"status": "success"}
