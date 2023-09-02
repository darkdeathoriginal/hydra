const PDFDocument = require("pdfkit");
const fs = require("fs");

async function createPdf(arr, path) {
  const doc = new PDFDocument({ autoFirstPage: false });
  for (let i of arr) {
    const image = doc.openImage(i);
    doc.addPage({ size: [image.width, image.height] });
    doc.image(image, 0, 0);
  }
  return new Promise((resolve, reject) => {
    const pdfStream = doc.pipe(fs.createWriteStream(path));

    pdfStream.on("finish", () => {
      resolve();
    });

    pdfStream.on("error", (error) => {
      console.error("PDF write stream error:", error);
      reject(error);
    });

    doc.end();
  })
    .then(async () => {
      const buffer = await fs.promises.readFile(path);
      await fs.promises.unlink(path);
      return buffer;
    })
    .catch((error) => {
      console.error("Error creating PDF:", error);
      throw error;
    });
}

module.exports = {
  createPdf,
};
