from PyPDF2 import PdfReader

def get_pdf_text(pdf_paths):
    text = ""
    for pdf in pdf_paths:
        pdf_reader = PdfReader(pdf)
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:  # Sometimes extract_text() can return None
                text += page_text
    return text