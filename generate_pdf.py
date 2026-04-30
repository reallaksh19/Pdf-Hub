from reportlab.pdfgen import canvas
c = canvas.Canvas("test.pdf")
c.drawString(100, 750, "Hello World from OCR Region Test!")
c.save()
