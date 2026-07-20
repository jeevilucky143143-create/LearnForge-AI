import pypdfium2 as pdfium
import logging

logger = logging.getLogger(__name__)

def extract_text(pdf_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using pypdfium2, and clean up the result."""
    if not pdf_bytes:
        raise ValueError("PDF file is empty")

    try:
        # Load PDF from bytes
        pdf = pdfium.PdfDocument(pdf_bytes)
        
        extracted_pages = []
        for i, page in enumerate(pdf):
            textpage = page.get_textpage()
            text = textpage.get_text_range()
            if text:
                extracted_pages.append(text)
            
        full_text = "\n".join(extracted_pages)
        
        # Preprocess text: normalize whitespace and merge broken line hyphenations
        lines = full_text.splitlines()
        cleaned_lines = []
        for line in lines:
            cleaned_line = line.strip()
            if cleaned_line:
                cleaned_lines.append(cleaned_line)
                
        final_text = "\n".join(cleaned_lines)
        
        if not final_text.strip():
            raise ValueError("PDF contains no extractable text")
            
        return final_text
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
        raise ValueError(f"Failed to parse PDF: {e}")
