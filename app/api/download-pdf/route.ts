import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

interface GenderDataRequest {
  type: 'gender' | 'ageBand' | 'streetWise';
  data: any;
  timestamp: string;
}

const getFormattedDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
};

const generateGenderDataPDF = (data: any): Buffer => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 15;

  // Add title
  pdf.setFontSize(16);
  pdf.text('Gender Wise Data', 15, yPosition);
  yPosition += 10;

  // Table headers
  const headers = ['Paguthi', 'Ward', 'Booth', 'Male Count', 'Male %', 'Female Count', 'Female %', 'Total'];
  const columnWidths = [25, 20, 20, 22, 18, 25, 18, 22];

  // Add headers
  pdf.setFontSize(10);
  pdf.setFont('', 'bold');
  let xPosition = 15;
  headers.forEach((header, idx) => {
    pdf.text(header, xPosition, yPosition);
    xPosition += columnWidths[idx];
  });
  yPosition += 7;
  pdf.setFont('', 'normal');

  // Add data rows
  data.forEach((row: any) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 15;
    }

    const malePercent = row.total_count > 0 ? ((row.male_count / row.total_count) * 100).toFixed(2) : '0.00';
    const femalePercent = row.total_count > 0 ? ((row.female_count / row.total_count) * 100).toFixed(2) : '0.00';

    const rowData = [
      row.pagudhi || 'N/A',
      row.ward || 'N/A',
      row.booth || 'N/A',
      row.male_count.toString(),
      malePercent + '%',
      row.female_count.toString(),
      femalePercent + '%',
      row.total_count.toString(),
    ];

    xPosition = 15;
    rowData.forEach((cell, idx) => {
      pdf.text(cell, xPosition, yPosition);
      xPosition += columnWidths[idx];
    });
    yPosition += 7;
  });

  // Add summary row
  if (data.length > 0) {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 15;
    }

    pdf.setFont('', 'bold');
    const totalMale = data.reduce((sum: number, row: any) => sum + row.male_count, 0);
    const totalFemale = data.reduce((sum: number, row: any) => sum + row.female_count, 0);
    const totalThird = data.reduce((sum: number, row: any) => sum + row.third_count, 0);
    const grandTotal = data.reduce((sum: number, row: any) => sum + row.total_count, 0);

    const malePercentOverall = grandTotal > 0 ? ((totalMale / grandTotal) * 100).toFixed(2) : '0.00';
    const femalePercentOverall = grandTotal > 0 ? ((totalFemale / grandTotal) * 100).toFixed(2) : '0.00';

    const summaryData = ['TOTAL', '', '', totalMale.toString(), malePercentOverall + '%', totalFemale.toString(), femalePercentOverall + '%', grandTotal.toString()];

    xPosition = 15;
    summaryData.forEach((cell, idx) => {
      pdf.text(cell, xPosition, yPosition);
      xPosition += columnWidths[idx];
    });
  }

  return Buffer.from(pdf.output('arraybuffer'));
};

const generateAgeBandDataPDF = (data: any): Buffer => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 15;

  // Add title
  pdf.setFontSize(16);
  pdf.text('Age Band Distribution', 15, yPosition);
  yPosition += 10;

  // Table headers
  const headers = ['Age Band', 'Male Count', 'Female Count', 'Total', 'Percentage'];
  const columnWidths = [40, 35, 35, 35, 35];

  // Add headers
  pdf.setFontSize(10);
  pdf.setFont('', 'bold');
  let xPosition = 15;
  headers.forEach((header, idx) => {
    pdf.text(header, xPosition, yPosition);
    xPosition += columnWidths[idx];
  });
  yPosition += 7;
  pdf.setFont('', 'normal');

  // Calculate grand total for percentage
  const grandTotal = data.reduce((sum: number, row: any) => sum + Number(row.total_count), 0);

  // Add data rows
  data.forEach((row: any) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 15;
    }

    const percentage = grandTotal > 0 ? ((Number(row.total_count) / grandTotal) * 100).toFixed(2) : '0.00';

    const rowData = [
      row.age_band,
      Number(row.male_count).toString(),
      Number(row.female_count).toString(),
      Number(row.total_count).toString(),
      percentage + '%',
    ];

    xPosition = 15;
    rowData.forEach((cell, idx) => {
      pdf.text(cell, xPosition, yPosition);
      xPosition += columnWidths[idx];
    });
    yPosition += 7;
  });

  // Add summary row
  if (data.length > 0) {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 15;
    }

    pdf.setFont('', 'bold');
    const totalMale = data.reduce((sum: number, row: any) => sum + Number(row.male_count), 0);
    const totalFemale = data.reduce((sum: number, row: any) => sum + Number(row.female_count), 0);

    const summaryData = ['TOTAL', totalMale.toString(), totalFemale.toString(), grandTotal.toString(), '100%'];

    xPosition = 15;
    summaryData.forEach((cell, idx) => {
      pdf.text(cell, xPosition, yPosition);
      xPosition += columnWidths[idx];
    });
  }

  return Buffer.from(pdf.output('arraybuffer'));
};

const generateStreetWiseDataPDF = (data: any): Buffer => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 15;

  // Add title
  pdf.setFontSize(16);
  pdf.text('Street Wise Voter Count', 15, yPosition);
  yPosition += 10;

  // Table headers
  const headers = ['S. No', 'Paguthi', 'Ward', 'Booth', 'Polling Station', 'Street / Section', 'Total Electors'];
  const columnWidths = [15, 25, 20, 20, 35, 40, 25];

  // Add headers
  pdf.setFontSize(9);
  pdf.setFont('', 'bold');
  let xPosition = 12;
  headers.forEach((header, idx) => {
    pdf.text(header, xPosition, yPosition);
    xPosition += columnWidths[idx];
  });
  yPosition += 7;
  pdf.setFont('', 'normal');
  pdf.setFontSize(8);

  // Add data rows
  data.forEach((row: any, idx: number) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 15;
    }

    const rowData = [
      (idx + 1).toString(),
      row.pagudhi || 'N/A',
      row.ward || 'N/A',
      row.booth || 'N/A',
      row.polling_station,
      row.section_name || 'N/A',
      row.total_electors.toString(),
    ];

    xPosition = 12;
    rowData.forEach((cell, idx) => {
      pdf.text(cell, xPosition, yPosition);
      xPosition += columnWidths[idx];
    });
    yPosition += 6;
  });

  // Add summary row
  if (data.length > 0) {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 15;
    }

    pdf.setFont('', 'bold');
    const grandTotal = data.reduce((sum: number, row: any) => sum + row.total_electors, 0);

    xPosition = 12;
    pdf.text('', xPosition, yPosition);
    xPosition += columnWidths[0];
    pdf.text('', xPosition, yPosition);
    xPosition += columnWidths[1];
    pdf.text('', xPosition, yPosition);
    xPosition += columnWidths[2];
    pdf.text('', xPosition, yPosition);
    xPosition += columnWidths[3];
    pdf.text('', xPosition, yPosition);
    xPosition += columnWidths[4];
    pdf.text('TOTAL', xPosition, yPosition);
    xPosition += columnWidths[5];
    pdf.text(grandTotal.toString(), xPosition, yPosition);
  }

  return Buffer.from(pdf.output('arraybuffer'));
};

export async function POST(request: NextRequest) {
  try {
    const body: GenderDataRequest = await request.json();

    let pdfBuffer: Buffer;
    let filename: string;
    const timestamp = getFormattedDateTime();

    switch (body.type) {
      case 'gender':
        pdfBuffer = generateGenderDataPDF(body.data);
        filename = `gender_wise_data_${timestamp}.pdf`;
        break;
      case 'ageBand':
        pdfBuffer = generateAgeBandDataPDF(body.data);
        filename = `age_band_table_${timestamp}.pdf`;
        break;
      case 'streetWise':
        pdfBuffer = generateStreetWiseDataPDF(body.data);
        filename = `street_wise_voter_count_${timestamp}.pdf`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid PDF type' }, { status: 400 });
    }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
