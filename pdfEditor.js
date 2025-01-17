const editBtn = document.getElementById("edit-btn");
const downloadBtn = document.getElementById("download-btn");
const fileName = []
const underlineBtn = document.getElementById("underline-btn")
const boldBtn=document.getElementById("bold-btn")
const italicBtn=document.getElementById("italic-btn")
document
  .getElementById("file-input")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    fileName.push(file?.name)
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const pdfData = new Uint8Array(e.target.result);

        pdfjsLib.getDocument(pdfData).promise.then(function (pdf) {
          const totalPages = pdf.numPages;

          for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            pdf.getPage(pageNum).then(function (page) {
              const viewport = page.getViewport({ scale: 1.8 });
              const canvas = document.createElement("canvas");
              const context = canvas.getContext("2d");
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              const renderTask = page.render({
                canvasContext: context,
                viewport: viewport,
              });

              renderTask.promise.then(function () {
                document.body.appendChild(canvas);
                editBtn.style.display = "block";

                const canvasContainer = document.createElement("div");
                canvasContainer.className = "canvas-container";
                canvasContainer.style.width = `${canvas.width}px`;
                canvasContainer.style.height = `${canvas.height}px`;

                canvas.parentNode.insertBefore(canvasContainer, canvas);
                canvasContainer.appendChild(canvas);

                const textLayer = document.createElement("div");
                textLayer.className = "text-layer";
                textLayer.style.pointerEvents = "none";
                canvasContainer.appendChild(textLayer);

                page.getTextContent().then(function (textContent) {
                  const textItems = textContent.items;
                  const tolerance = 20;

                  let paragraphs = [];
                  let currentParagraph = [];
                  let lastY = textItems[0]?.transform[5];

                  textItems.forEach((item, index) => {
                    const currentY = item.transform[5];

                    if (Math.abs(currentY - lastY) <= tolerance) {
                      currentParagraph.push(item);
                    } else {
                      if (currentParagraph.length > 0) {
                        paragraphs.push([...currentParagraph]);
                        currentParagraph = [];
                      }
                      currentParagraph.push(item);
                    }

                    lastY = currentY;

                    if (index === textItems.length - 1 && currentParagraph.length > 0) {
                      paragraphs.push([...currentParagraph]);
                    }
                  });

                  paragraphs.forEach((paragraph) => {
                    const paragraphDiv = document.createElement("div");
                    paragraphDiv.className = "paragraph";
                    paragraphDiv.contentEditable = "true";
                    paragraphDiv.style.position = "relative";
                    paragraphDiv.style.display = "inline-block";
                    paragraphDiv.style.cursor = "text";
                    paragraphDiv.style.backgroundColor = "transparent"
                    let minX = Infinity,
                      minY = Infinity,
                      maxX = -Infinity,
                      maxY = -Infinity;

                    paragraph.forEach((item) => {
                      const { transform, str } = item;
                      const [fontScaleX, , , fontScaleY, x, y] = transform;

                      const adjustedX = x * viewport.scale;
                      const adjustedY = viewport.height - y * viewport.scale;

                      minX = Math.min(minX, adjustedX);
                      minY = Math.min(minY, adjustedY);
                      maxX = Math.max(maxX, adjustedX);
                      maxY = Math.max(maxY, adjustedY);
                      const ctx = canvas.getContext("2d");
                      const imageData = ctx.getImageData(
                        adjustedX,
                        adjustedY - fontScaleY * viewport.scale,
                        fontScaleX * viewport.scale,
                        fontScaleY * viewport.scale
                      );
                      const span = document.createElement("span");
                      span.className="editSpan"
                      // span.textContent = str || "";
                      span.style.fontSize = `${Math.abs(fontScaleY) * viewport.scale}px`;
                      span.style.fontFamily = item?.fontName || "sans-serif";
                      span.style.color = getAverageColor(imageData.data);
                      span.style.position = "absolute";
                      // span.style.left = `${adjustedX - minX}px`;
                      // span.style.top = `${adjustedY - minY}px`;
                      span.style.lineHeight = "1";
                      span.style.pointerEvents = "auto";
                      span.style.background = "white";
                      span.style.pointerEvents = "auto";

                      span.style.width = `${item.width * viewport.scale}px`;
                      span.style.height = `${item.height * viewport.scale}px`;
                      span.style.left = `${adjustedX}px`;
                      span.style.top = `${adjustedY - fontScaleY * viewport.scale
                        }px`;
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const isUrl = urlRegex.test(str);

                      if (isUrl) {
                        // Create a clickable link if the text is a URL
                        const link = document.createElement("a");
                        link.href = str;
                        link.textContent = str;
                        link.target = "_blank"; // Opens the link in a new tab
                        link.style.textDecoration = "underline"; // Style for link
                        link.style.color = "blue"; // Style for link
                        link.addEventListener("click", (event) => {
                          link.href = str;
                          link.target = "_blank";
                          span.contentEditable = "false"; // Disable editing when link is clicked
                          event.stopPropagation(); // Prevent event bubbling
                        });
                        link.style.cursor = "pointer";
                        span.appendChild(link); // Append the link inside the span
                      } else {
                        // Otherwise, just set the text content of the span
                        span.textContent = str;
                      }

                      paragraphDiv.appendChild(span);
                    });

                    const paragraphWidth = maxX - minX;
                    const paragraphHeight = maxY - minY;

                    paragraphDiv.style.width = `${paragraphWidth}px`;
                    paragraphDiv.style.height = `${paragraphHeight}px`;
                    paragraphDiv.spellcheck = false
                    textLayer.appendChild(paragraphDiv);
                  });
                });
              });
            });
          }
        });
      };
      reader.readAsArrayBuffer(file);
    }
  });

editBtn.addEventListener("click", () => {
  document.querySelectorAll(".text-layer").forEach((textLayer) => {
    textLayer.style.display = "block";
    textLayer.style.pointerEvents = "auto";

    textLayer.querySelectorAll(".paragraph").forEach((paragraph) => {
      downloadBtn.style.display = "block";
      paragraph.className = "editParagraph";
      paragraph.contentEditable = "true";
      paragraph.style.cursor = "text";
      paragraph.style.backgroundColor = "white";
      paragraph.style.overflowWrap = "break-word";
      paragraph.style.width = "auto";
      paragraph.style.display = "inline-block";
    });
  });

  editBtn.style.display = "none";
});

function getAverageColor(imageData) {
  let r = 0,
    g = 0,
    b = 0,
    count = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    const alpha = imageData[i + 3];
    if (alpha === 0) continue;

    const brightness =
      0.2126 * imageData[i] +
      0.7152 * imageData[i + 1] +
      0.0722 * imageData[i + 2];
    if (brightness < 128) {
      r += imageData[i];
      g += imageData[i + 1];
      b += imageData[i + 2];
      count++;
    }
  }

  if (count === 0) return "rgb(0,0,0)";
  return `rgb(${Math.round(r / count)}, ${Math.round(
    g / count
  )}, ${Math.round(b / count)})`;
}


function getAverageBackgroundColor(imageData) {
  console.log(imageData, "imageData");
  let r = 0,
    g = 0,
    b = 0,
    count = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    const alpha = imageData[i + 3];
    if (alpha === 0) continue;

    const brightness =
      0.2126 * imageData[i] +
      0.7152 * imageData[i + 1] +
      0.0722 * imageData[i + 2];

    if (brightness > 128) {
      r += imageData[i];
      g += imageData[i + 1];
      b += imageData[i + 2];
      count++;
    }
  }


  if (count === 0) return "rgb(255,255,255)";

  const avgR = Math.round(r / count);
  const avgG = Math.round(g / count);
  const avgB = Math.round(b / count);

  return `rgb(${avgR}, ${avgG}, ${avgB})`;
}

function detectTextStyle(context, x, y, width, height) {
  const imageData = context.getImageData(x, y, width, height);
  const data = imageData.data;

  const bottomRegionHeight = Math.max(2, Math.floor(height * 0.1)); // Bottom 10%
  const underlineRegionStart = height - bottomRegionHeight;
  const underlineRegion = data.slice(
    underlineRegionStart * width * 4,
    height * width * 4
  );

  const middleY = Math.floor(height / 2);
  const middleRegionStart = middleY * width * 4;
  const middleRegion = data.slice(
    middleRegionStart,
    (middleY + 1) * width * 4
  );

  const isUnderlined = detectLine(underlineRegion);
  const isStrikethrough = detectLine(middleRegion);

  const styles = [];
  if (isUnderlined) styles.push("underlined");
  if (isStrikethrough) styles.push("strikethrough");
  return styles;
}

function detectLine(regionData) {
  let darkPixelCount = 0;
  const totalPixels = regionData.length / 4;
  const brightnessThreshold = 100;

  for (let i = 0; i < regionData.length; i += 4) {
    const [r, g, b] = [
      regionData[i],
      regionData[i + 1],
      regionData[i + 2],
    ];
    const brightness = (r + g + b) / 3;
    if (brightness < brightnessThreshold) darkPixelCount++;
  }

  const darkPixelRatio = darkPixelCount / totalPixels;
  return darkPixelRatio > 0.6;
}

function applyTextDecoration(span, textStyle) {
  span.style.textDecoration = "";
  if (textStyle.includes("underlined")) {
    span.style.textDecoration += "underline ";
  }
  if (textStyle.includes("strikethrough")) {
    span.style.textDecoration += "line-through ";
  }
  span.style.textDecoration = span.style.textDecoration.trim();
}

downloadBtn.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
  });

  const canvases = document.querySelectorAll("canvas");
  canvases.forEach((canvas, index) => {
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const canvasScale = Math.min(
      pageWidth / canvas.width,
      pageHeight / canvas.height
    );
    const imgWidth = canvas.width * canvasScale;
    const imgHeight = canvas.height * canvasScale;
    const xOffset = (pageWidth - imgWidth) / 2;
    const yOffset = (pageHeight - imgHeight) / 2;

    doc.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);
    const textLayer = canvas.parentNode.querySelector(".text-layer");
    if (textLayer) {
      const textElements = textLayer.getElementsByClassName("editSpan");
      const textElements1 = textLayer.getElementsByClassName("editParagraph");
      [...textElements].forEach((span) => {
        const text = span.textContent;
        const left = parseFloat(span.style.left);
        const top = parseFloat(span.style.top);
        const width = parseFloat(span.style.width);
        const height = parseFloat(span.style.height);
        const fontFamily = span.style.fontFamily
        const fontSize = parseFloat(span.style.fontSize);
        const color = span.style.color;
console.log(left,top,width,text,height,fontSize,color,"fromDwonloadddd")
        if (
          !isNaN(left) &&
          !isNaN(top) &&
          !isNaN(fontSize) &&
          text !== ""
        ) {
          const x = xOffset + left * canvasScale;
          const y = yOffset + top * canvasScale + fontSize * canvasScale; // Adjust for baseline
          const scaledFontSize = fontSize * canvasScale;

          doc.setFontSize(scaledFontSize);
          doc.setTextColor(color);
          doc.text(text, x, y);
          // doc.setFont(fontFamily)
          doc.rect(
            x,
            y - scaledFontSize,
            width,
            height,
            "F"
          )
        }
      });

      [...textElements1].forEach((div) => {
        const spans = div.getElementsByClassName("editSpan");
        [...spans].forEach((span) => {
          const text = span.textContent;
          const left = parseFloat(span.style.left);
          const top = parseFloat(span.style.top);
          const width = parseFloat(span.style.width);
          const height = parseFloat(span.style.height);

          const fontSize = parseFloat(span.style.fontSize);
          const backgroundColor = span.style.backgroundColor;
          const color = span.style.color;
          const fontFamily = span.style.fontFamily

          if (
            !isNaN(left) &&
            !isNaN(top) &&
            !isNaN(fontSize) &&
            text !== ""
          ) {
            const x = xOffset + left * canvasScale;
            const y =
              yOffset + top * canvasScale + fontSize * canvasScale;
            const scaledFontSize = fontSize * canvasScale;

            doc.setFontSize(scaledFontSize);
            doc.setTextColor(color);
            // doc.setFont(fontFamily)
            if (backgroundColor) {
              const [r, g, b] = parseBackgroundColor(backgroundColor);
              doc.setFillColor(r, g, b);
              // doc.setFont(fontFamily)
              doc.rect(
                x,
                y - scaledFontSize,
                width,
                height,
                "F"
              );
            }

            doc.text(text, x, y);
          }
        });

        function parseBackgroundColor(color) {
          const rgb = color.match(/\d+/g);
          return rgb ? rgb.map(Number) : [255, 255, 255];
        }
      });
    }

    if (index < canvases.length - 1) {
      doc.addPage();
    }
  });
  doc.save(fileName?.[0]);
});

function isColorCloseToWhite(color) {
  const [r, g, b] = color.match(/\d+/g).map(Number);
  return r > 230 && g > 230 && b > 230;
}

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  const selectedElement = selection?.anchorNode?.parentElement;

  if (selectedElement && selectedElement.isContentEditable) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const toolbar = document.getElementById("toolbar");
    toolbar.style.display = "block";
    toolbar.style.position = "absolute";
    toolbar.style.background = "white";

    toolbar.style.left = `${rect.left + window.scrollX}px`;
    toolbar.style.top = `${rect.top + window.scrollY - 40}px`;
  } else {
    document.getElementById("toolbar").style.display = "none";
  }
});

document.getElementById("underline-btn").addEventListener("click", () => {
  document.execCommand("underline");
});

document.getElementById("bold-btn").addEventListener("click", () => {
  document.execCommand("bold");
});

document.getElementById("italic-btn").addEventListener("click", () => {
  document.execCommand("italic");
});