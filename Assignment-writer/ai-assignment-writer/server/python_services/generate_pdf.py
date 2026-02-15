import sys
import json
import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

def generate_pdf(data):
    output_filename = f"generated_{data.get('id', 'temp')}.pdf"
    c = canvas.Canvas(output_filename, pagesize=letter)
    width, height = letter
    
    # Title
    title = data.get('topic', 'Assignment')
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2, height - 50, title)
    
    y = height - 80
    c.setFont("Helvetica", 12)
    
    # Metadata
    if 'subject' in data:
        c.drawString(50, y, f"Subject: {data['subject']}")
        y -= 20
    if 'level' in data:
        c.drawString(50, y, f"Level: {data['level']}")
        y -= 40
        
    # Content
    content = data.get('content', '')

    text_object = c.beginText(50, y)
    
    lines = content.split('\n')

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            text_object.textLine("")
            continue

        if re.match(r'^\[IMAGE:\s*(.*?)\]$', line):
            continue
            
        font_name = "Helvetica"
        font_size = 11
        is_heading = False

        if line.startswith('#### '):
            font_name = "Helvetica-Bold"
            font_size = 12
            line = line.replace('#### ', '')
            is_heading = True
        elif line.startswith('### '):
            font_name = "Helvetica-Bold"
            font_size = 14
            line = line.replace('### ', '')
            is_heading = True
        elif line.startswith('## '):
            font_name = "Helvetica-Bold"
            font_size = 16
            line = line.replace('## ', '')
            is_heading = True
        elif line.startswith('# '):
            font_name = "Helvetica-Bold"
            font_size = 18
            line = line.replace('# ', '')
            is_heading = True
        elif line.startswith('- '):
            line = "   • " + line.replace('- ', '')
        elif re.match(r'^\d+\.\s+', line):
            line = "   " + line
        else:
            if '**' in line:
                font_name = "Helvetica-Bold"
            elif re.search(r'(?<!\*)\*[^*]+\*(?!\*)', line):
                font_name = "Helvetica-Oblique"

        line = re.sub(r'\*\*(.*?)\*\*', r'\1', line)
        line = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'\1', line)

        text_object.setFont(font_name, font_size)

        wrapped_lines = simpleSplit(line, font_name, font_size, width - 100)
        
        for wrapped_line in wrapped_lines:
            text_object.textLine(wrapped_line)
            
            # Check for page break
            if text_object.getY() < 100: 
                c.drawText(text_object)
                c.showPage()
                text_object = c.beginText(50, height - 50)
                text_object.setFont("Helvetica", 11)
        
        if is_heading:
             text_object.setFont("Helvetica", 11)
             text_object.textLine("") # Spacer

    c.drawText(text_object)
    c.save()
    print(output_filename)

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        generate_pdf(data)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
