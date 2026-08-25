import * as path from 'path';

const pdfMake = require('pdfmake');

const fontsDir = path.join(
  path.dirname(require.resolve('pdfmake/package.json')),
  'fonts',
  'Roboto',
);

pdfMake.addFonts({
  Roboto: {
    normal: path.join(fontsDir, 'Roboto-Regular.ttf'),
    bold: path.join(fontsDir, 'Roboto-Medium.ttf'),
    italics: path.join(fontsDir, 'Roboto-Italic.ttf'),
    bolditalics: path.join(fontsDir, 'Roboto-MediumItalic.ttf'),
  },
});

export interface TDocumentDefinitions {
  content: any[];
  defaultStyle?: Record<string, any>;
  styles?: Record<string, any>;
  pageMargins?: number | [number, number, number, number];
  header?: any;
  footer?: any;
}

export async function generatePdfBuffer(docDefinition: TDocumentDefinitions): Promise<Buffer> {
  const doc = pdfMake.createPdf(docDefinition);
  return doc.getBuffer();
}
