import unittest
from unittest.mock import MagicMock
from uuid import uuid4
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
import numpy as np

# A lightweight mock class representing DB model lessons
class MockLesson:
    def __init__(self, id, title, content, course_title, course_id):
        self.id = id
        self.title = title
        self.content = content
        # Mock relationships
        self.chapter = MagicMock()
        self.chapter.course_id = course_id
        self.chapter.course = MagicMock()
        self.chapter.course.title = course_title

class TestLSASemanticSearch(unittest.TestCase):
    def test_semantic_search_ranking(self):
        """Test LSA (TFIDF + SVD) cosine similarities on mocked lesson records."""
        course_id = uuid4()
        lessons = [
            MockLesson(uuid4(), "Introduction to Neural Networks", "Neural networks are models inspired by the brain. They consist of input layer, hidden layers, and output layer.", "Machine Learning", course_id),
            MockLesson(uuid4(), "Database Indexing Guidelines", "Database indexes improve search speed by creating structured lookup trees. B-Trees and Hash indexes are common.", "SQL Databases", course_id),
            MockLesson(uuid4(), "Supervised Learning Algorithms", "Supervised learning involves training models on labeled datasets. Examples include Linear Regression and SVMs.", "Machine Learning", course_id),
        ]

        # Extract texts
        texts = [f"{l.title}\n{l.content}" for l in lessons]
        vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
        tfidf_matrix = vectorizer.fit_transform(texts)
        
        # SVD projection
        svd = TruncatedSVD(n_components=2, random_state=42)
        dense_embeddings = svd.fit_transform(tfidf_matrix)
        
        # Query: "How to speed up sql queries"
        query_tfidf = vectorizer.transform(["How to speed up sql queries"])
        query_emb = svd.transform(query_tfidf)
        
        # Calculate Cosine Similarity
        dense_embeddings_norm = np.linalg.norm(dense_embeddings, axis=1)
        query_emb_norm = np.linalg.norm(query_emb[0])
        
        scores = []
        for idx, emb in enumerate(dense_embeddings):
            denom = dense_embeddings_norm[idx] * query_emb_norm
            sim = np.dot(emb, query_emb[0]) / denom if denom > 0 else 0.0
            scores.append((sim, idx))
            
        scores.sort(key=lambda x: x[0], reverse=True)
        
        # The query is about SQL/Database index speed-up, so the "Database Indexing" lesson (idx = 1) should rank first!
        self.assertEqual(scores[0][1], 1)
        self.assertTrue(scores[0][0] > scores[1][0])

if __name__ == "__main__":
    unittest.main()
