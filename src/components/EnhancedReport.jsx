import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * EnhancedReport
 * Generates a professional PDF report for a quiz/test.
 * @param {Object} props
 * @param {Object} props.testInfo - { title, date, duration }
 * @param {Array} props.questions - [{ question, answers: [], correctAnswer }]
 * @param {Array} props.results - [{ playerName, score }]
 * @param {string} props.logoUrl - URL or base64 of the logo image
 */
const EnhancedReport = ({ testInfo, questions, results, logoUrl }) => {
  const generatePDF = async () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;

    // 1. Header: Logo (left), Title (center), Date (right)
    let y = margin;
    if (logoUrl) {
      try {
        // If logoUrl is a URL, fetch and convert to base64
        let imgData = logoUrl;
        if (!logoUrl.startsWith('data:')) {
          const res = await fetch(logoUrl);
          const blob = await res.blob();
          imgData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
        
    doc.addImage(imgData, 'PNG', margin, y, 50, 50);
      } catch (e) {
        // Ignore logo errors
      }
    }
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(testInfo.title || 'Quiz Report', pageWidth / 2, y + 30, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date(testInfo.date || Date.now()).toLocaleString();
    doc.text(`Report Date: ${dateStr}`, pageWidth - margin, y + 15, { align: 'right' });
    y += 60;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;

    // 2. Quiz Information Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 160, 133);
    doc.text('Quiz Information:', margin, y);
    y += 18;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(`Title: ${testInfo.title || '-'}`, margin + 10, y);
    y += 16;
    doc.text(`Duration: ${testInfo.duration || '-'}`, margin + 10, y);
    y += 16;
    doc.text(`Date: ${dateStr}`, margin + 10, y);
    y += 20;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;

    // 3. Questions & Answers Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 160, 133);
    doc.text('Questions & Answers:', margin, y);
    y += 18;

    // Build questionRows with robust correct answer marking
    const questionRows = questions.map((q, i) => [
      i + 1,
      q.question,
      Array.isArray(q.answers)
        ? q.answers.map(ans => {
            const isCorrect =
              ans && q.correctAnswer &&
              ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
            return isCorrect ? `✔️ ${ans}` : ans;
          }).join('\n')
        : '-',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Question', 'Answers']],
      body: questionRows,
      styles: { fontSize: 10, cellPadding: 4, valign: 'top' },
      headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 220 },
        2: { cellWidth: 250 },
      },
      didParseCell: (data) => {
        // Strong highlight for correct answers: Abraj blue background, white bold text
        if (data.column.index === 2 && data.cell.raw && typeof data.cell.raw === 'string') {
          const q = questions[data.row.index];
          if (Array.isArray(q.answers)) {
            const correct = q.correctAnswer;
            // Split answers by line and check each
            const lines = data.cell.raw.split('\n');
            lines.forEach((line, idx) => {
              // Robust check: ignore case and trim
              if (
                correct &&
                (line.startsWith('✔️') || line.includes('✔️')) &&
                line.replace('✔️', '').trim().toLowerCase() === correct.trim().toLowerCase()
              ) {
                if (data.cell.text[idx]) {
                  data.cell.styles.textColor = [255, 255, 255]; // White text
                  data.cell.styles.fontStyle = 'bold';
                  data.cell.styles.fillColor = [4, 162, 201]; // Abraj blue background
                }
              }
            });
          }
        }
      }
    });

    // 4. Leaderboard Table
    let startY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 160, 133);
    doc.text('Leaderboard:', margin, startY);
    startY += 10;

    const resultRows = Array.isArray(results) && results.length > 0
      ? results.map((r, i) => [
          i + 1,
          r.playerName,
          r.score,
        ])
      : [["-", "-", "-"]];

    autoTable(doc, {
      startY,
      head: [['#', 'Player Name', 'Score']],
      body: resultRows,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 248, 255] },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 250 },
        2: { cellWidth: 60, halign: 'center' },
      },
    });

    // 5. Pagination and Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      doc.text('abrajquiz.com | info@abrajquiz.com', pageWidth / 2, doc.internal.pageSize.getHeight() - 25, { align: 'center' });
    }

    // 6. Save PDF
    doc.save(`Quiz_Report_${testInfo.title || 'Untitled'}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      style={{
        padding: '10px 20px',
        fontSize: 16,
        cursor: 'pointer',
        background: '#16a085',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        margin: 10,
      }}
    >
      Generate Enhanced PDF Report
    </button>
  );
};

export default EnhancedReport; 