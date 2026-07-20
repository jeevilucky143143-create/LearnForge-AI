import unittest
import sys
import os

# Add backend root to Python path so app.* imports work correctly in tests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if __name__ == "__main__":
    print("Discovering and running unit tests in backend/tests/...")
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=os.path.dirname(__file__), pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Return exit code 0 if successful, 1 if any tests failed
    sys.exit(0 if result.wasSuccessful() else 1)
