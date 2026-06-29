import jsPDF from "jspdf";

export function exportEmergencyReport(
  result: any,
  answers: Record<string, string>
) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 16;
  const maxWidth = pageWidth - margin * 2;

  let y = 20;

  const addText = (
    text: string,
    size = 11,
    bold = false
  ) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");

    const lines = doc.splitTextToSize(text, maxWidth);

    lines.forEach((line: string) => {
      if (y > pageHeight - 18) {
        doc.addPage();
        y = 20;
      }

      doc.text(line, margin, y);
      y += 6;
    });
  };

  const addHeaderBox = (
    title: string,
    color: [number, number, number]
  ) => {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(...color);
    doc.rect(margin, y - 5, maxWidth, 10, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, margin + 3, y + 2);

    doc.setTextColor(0, 0, 0);

    y += 14;
  };

  // ==========================
  // TITLE
  // ==========================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("NextMove", margin, y);

  y += 8;

  doc.setFontSize(15);
  doc.text("Emergency Response Report", margin, y);

  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    margin,
    y
  );

  y += 12;

  // ==========================
  // PLAN OVERVIEW
  // ==========================

  addHeaderBox("PLAN OVERVIEW", [40, 40, 40]);

  addText(`Scenario: ${result.scenario}`);
  addText(`Severity: ${result.severity}`);
  addText(`Confidence: ${result.confidence}%`);

  if (result.confidence_reason) {
    addText(`Reason: ${result.confidence_reason}`);
  }

  addText(
    `Estimated Resolution: ${result.estimated_resolution_time}`
  );

  y += 4;

  // ==========================
  // CRITICAL ACTION
  // ==========================

  if (result.critical_action) {
    addHeaderBox("CRITICAL ACTION", [220, 53, 69]);

    addText(
      result.critical_action.title,
      13,
      true
    );

    if (result.critical_action.estimated_time) {
      addText(
        `Estimated Time: ${result.critical_action.estimated_time}`
      );
    }

    y += 2;
  }

  // ==========================
  // SUMMARY
  // ==========================

  addHeaderBox("SUMMARY", [0, 123, 255]);

  addText(result.summary);

  // ==========================
  // RISKS
  // ==========================

  addHeaderBox("RISK ASSESSMENT", [255, 140, 0]);

  [...(result.risks ?? [])]
    .sort((a: any, b: any) => b.level - a.level)
    .forEach((risk: any) => {
      addText(`• ${risk.type} (${risk.level}%)`);
    });

  // ==========================
  // TIMELINE
  // ==========================

  addHeaderBox("ACTION TIMELINE", [0, 153, 76]);

  const sections = [
    {
      title: "RIGHT NOW",
      items: result.timeline?.now ?? [],
    },
    {
      title: "NEXT 10 MINUTES",
      items: result.timeline?.next_10_minutes ?? [],
    },
    {
      title: "NEXT HOUR",
      items: result.timeline?.next_hour ?? [],
    },
    {
      title: "TODAY",
      items: result.timeline?.today ?? [],
    },
  ];

  sections.forEach((section) => {
    addText(section.title, 12, true);

    section.items.forEach((item: string) => {
      addText(`• ${item}`);
    });

    y += 2;
  });

  // ==========================
  // CHECKLIST
  // ==========================

  addHeaderBox("ACTION CHECKLIST", [90, 90, 255]);

  result.checklist?.forEach((item: string) => {
    addText(`[ ] ${item}`);
  });

  // ==========================
  // CONTACTS
  // ==========================

  addHeaderBox("IMPORTANT CONTACTS", [34, 139, 34]);

  result.important_contacts?.forEach((contact: string) => {
    addText(`• ${contact}`);
  });

  // ==========================
  // USER ANSWERS
  // ==========================

  if (Object.keys(answers).length > 0) {
    addHeaderBox("USER RESPONSES", [80, 80, 80]);

    Object.entries(answers).forEach(([question, answer]) => {
      addText(question, 11, true);
      addText(answer);
      y += 2;
    });
  }

  // ==========================
  // DISCLAIMER
  // ==========================

  addHeaderBox("IMPORTANT", [180, 0, 0]);

  addText(
    "This report is AI-generated to help you respond quickly during urgent situations. Always verify critical information and contact official emergency services or relevant authorities when necessary."
  );

  // ==========================
  // FOOTER
  // ==========================

  if (y > pageHeight - 25) {
    doc.addPage();
    y = 20;
  }

  y += 8;

  doc.setDrawColor(200);

  doc.line(
    margin,
    y,
    pageWidth - margin,
    y
  );

  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);

  doc.text(
    "Generated by NextMove AI • Emergency Decision Support System",
    margin,
    y
  );

  doc.save(
    `NextMove-${result.scenario.replace(/\s+/g, "-")}-Report.pdf`
  );
}