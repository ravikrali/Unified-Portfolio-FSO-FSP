from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUT = Path(__file__).with_name("CPMS Architecture and Design.pdf")


class ArchitectureDiagram(Flowable):
    def __init__(self):
        super().__init__()
        self.width = 7.2 * inch
        self.height = 4.4 * inch

    def draw_box(self, canvas, x, y, w, h, title, body, fill, stroke):
        canvas.setFillColor(fill)
        canvas.setStrokeColor(stroke)
        canvas.roundRect(x, y, w, h, 10, stroke=1, fill=1)
        canvas.setFillColor(colors.HexColor("#111827"))
        canvas.setFont("Helvetica-Bold", 10)
        canvas.drawString(x + 10, y + h - 18, title)
        canvas.setFillColor(colors.HexColor("#5b6472"))
        canvas.setFont("Helvetica", 7.5)
        text = canvas.beginText(x + 10, y + h - 34)
        for line in body.split("\n"):
            text.textLine(line)
        canvas.drawText(text)

    def arrow(self, canvas, x1, y1, x2, y2):
        canvas.setStrokeColor(colors.HexColor("#ff5a36"))
        canvas.setLineWidth(1.4)
        canvas.line(x1, y1, x2, y2)
        canvas.setFillColor(colors.HexColor("#ff5a36"))
        canvas.circle(x2, y2, 3, stroke=0, fill=1)

    def draw(self):
        c = self.canv
        box_w, box_h = 132, 68
        fill = colors.HexColor("#fff7f1")
        stroke = colors.HexColor("#eaded4")
        dark_fill = colors.HexColor("#f0f7ff")

        boxes = {
            "Browser / PWA": (18, 165, box_w, box_h, fill),
            "API Layer": (205, 165, box_w, box_h, colors.HexColor("#ffffff")),
            "SQLite DB": (392, 165, box_w, box_h, fill),
            "Portfolio Data": (205, 65, box_w, box_h, dark_fill),
            "AI Agent Layer": (205, 265, box_w, box_h, dark_fill),
            "Email Outbox": (392, 65, box_w, box_h, colors.HexColor("#ffffff")),
        }

        bodies = {
            "Browser / PWA": "Landing, Portfolio Health,\nProcess Zones, KPI dialog,\nGlobal AI Search",
            "API Layer": "Express routes for portfolio,\nKPI comments, export,\nmock agent responses",
            "SQLite DB": "Local file-backed data:\nportfolio, studies, FSP needs,\nKPIs, outbox",
            "Portfolio Data": "Mock FSO studies plus\nFSP projects and role\nrequirements",
            "AI Agent Layer": "Mock first; future provider\nabstraction for local or\nhosted LLMs",
            "Email Outbox": "Stores assignment email\nrequests until SMTP or\nemail provider is configured",
        }

        for title, (x, y, w, h, color) in boxes.items():
            self.draw_box(c, x, y, w, h, title, bodies[title], color, stroke)

        self.arrow(c, 150, 199, 205, 199)
        self.arrow(c, 337, 199, 392, 199)
        self.arrow(c, 271, 165, 271, 133)
        self.arrow(c, 271, 265, 271, 233)
        self.arrow(c, 337, 99, 392, 99)


def build():
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        rightMargin=0.6 * inch,
        leftMargin=0.6 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TitleCPMS", parent=styles["Title"], fontSize=24, leading=28, textColor=colors.HexColor("#111827")))
    styles.add(ParagraphStyle(name="H2CPMS", parent=styles["Heading2"], fontSize=15, leading=19, textColor=colors.HexColor("#ff5a36"), spaceBefore=10))
    styles.add(ParagraphStyle(name="BodyCPMS", parent=styles["BodyText"], fontSize=9.5, leading=13, textColor=colors.HexColor("#28323f")))
    styles.add(ParagraphStyle(name="SmallCPMS", parent=styles["BodyText"], fontSize=8, leading=11, textColor=colors.HexColor("#5b6472")))

    story = [
        Paragraph("Clinical Portfolio Management Solutions", styles["TitleCPMS"]),
        Paragraph("Architecture and Design Documentation", styles["H2CPMS"]),
        Paragraph(
            "This document separates architecture and design guidance from the application UI. "
            "The prototype is local-first and uses mock portfolio data: FSO clinical studies plus FSP projects and role requirements.",
            styles["BodyCPMS"],
        ),
        Spacer(1, 14),
        Paragraph("Architecture Diagram", styles["H2CPMS"]),
        ArchitectureDiagram(),
        Spacer(1, 10),
        Paragraph("Core Data Flows", styles["H2CPMS"]),
        Table(
            [
                ["Flow", "Description"],
                ["Portfolio open", "Browser loads portfolio, process-zone health, KPI metrics, FSO studies, and FSP requirements from the API."],
                ["Process-zone drill-down", "User selects a process zone and sees metrics plus detailed records relevant to that zone."],
                ["KPI comment", "User hovers over a KPI, opens the action dialog, and saves a comment against the metric."],
                ["Assign to", "User enters an assignee email; the local prototype writes an email request to the email outbox."],
                ["AI search", "Global search sends the user question to the API mock agent and returns a contextual answer."],
                ["Export", "Portfolio KPIs, FSO studies, FSP requirements, KPI comments, and agile items export to XLSX."],
            ],
            colWidths=[1.6 * inch, 5.4 * inch],
            style=[
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#eaded4")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fff7f1")]),
            ],
        ),
        PageBreak(),
        Paragraph("Design System Notes", styles["H2CPMS"]),
        Paragraph(
            "The application uses a separate modern SaaS identity rather than the strategy-deck visual system. "
            "The default theme is warm, minimal, grid-backed, and AI-forward, with dark mode support. "
            "The UI emphasizes dashboard density, process-zone drill-down, and action-oriented KPI interactions.",
            styles["BodyCPMS"],
        ),
        Spacer(1, 10),
        Paragraph("Data Model Summary", styles["H2CPMS"]),
        Table(
            [
                ["Entity", "Purpose"],
                ["Portfolio", "Top-level operating unit formerly described as Engagement."],
                ["Process Zone", "Scoping & Pricing, Contracts, Resource Management, Talent, People, Finance, Oversight."],
                ["KPI Metric", "Metric value, target, trend, status, and process-zone association."],
                ["FSO Study", "Mock clinical trial records currently in the portfolio."],
                ["FSP Requirement", "Smaller projects or role requirements such as CRA, medical writing, safety, or data management support."],
                ["KPI Comment", "User comment saved against a specific KPI metric."],
                ["Email Outbox", "Local record of assignment emails pending real SMTP/provider setup."],
            ],
            colWidths=[1.7 * inch, 5.3 * inch],
            style=[
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#eaded4")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fff7f1")]),
            ],
        ),
        Spacer(1, 10),
        Paragraph("Implementation Caveats", styles["H2CPMS"]),
        Paragraph(
            "The first cut is local-only. The database is a file-backed SQLite database through sql.js. "
            "Email assignment currently writes to an outbox table because no SMTP or email provider credentials are configured. "
            "When the app moves beyond local prototype mode, the recommended path is to replace the local database with PostgreSQL, "
            "add a production auth provider, configure object storage, and connect email through SMTP or a transactional email service.",
            styles["BodyCPMS"],
        ),
    ]
    doc.build(story)


if __name__ == "__main__":
    build()
