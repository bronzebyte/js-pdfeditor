      const editBtn = document.getElementById("edit-btn");
      const downloadBtn = document.getElementById("download-btn");
      const fileName=[]
      document
        .getElementById("file-input")
        .addEventListener("change", function (event) {
          const file = event.target.files[0];
          console.log(file,"file+++++++")
          fileName.push(file?.name)

          console.log(fileName[0],"fileNameee")
          if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
              const pdfData = new Uint8Array(e.target.result);

              pdfjsLib.getDocument(pdfData).promise.then(function (pdf) {
                const totalPages = pdf.numPages;

                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                  pdf.getPage(pageNum).then(function (page) {
                    const viewport = page.getViewport({ scale: 2 });
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
                      console.log(viewport.scale, "viewportviewport");
                      page.getTextContent().then(function (textContent) {
                        const textItems = textContent.items;

                        textItems.forEach((item) => {
                          console.log(item, "item+++=");
                          const { transform, str } = item;
                          const [fontScaleX, , , fontScaleY, x, y] = transform;

                          const adjustedX = x * viewport.scale;
                          const adjustedY = canvas.height - y * viewport.scale;

                          const div = document.createElement("div");
                          const span = document.createElement("span");

                          span.textContent = str;
                          span.style.fontSize = `${
                            fontScaleX * viewport.scale
                          }px`;
                          span.style.color = "black"; // Default color
                          span.style.whiteSpace = "nowrap";
                          span.style.position = "absolute";
                          span.style.lineHeight = "1";
                          span.style.background = "white";
                          span.style.fontFamily = item?.fontName;
                          div.appendChild(span);
                          div.style.position = "absolute";
                          div.className = "MainDiv";

                          div.style.width = `${item.width * viewport?.scale}px`;
                          div.style.height = `${
                            item.height * viewport?.scale
                          }px`;

                          span.style.width = `${
                            item.width * viewport?.scale
                          }px`;

                          span.style.height = `${
                            item.height * viewport?.scale
                          }px`;

                          span.style.left = `${adjustedX}px`;
                          span.style.top = `${
                            adjustedY - fontScaleY * viewport.scale
                          }px`;
                          const ctx = canvas.getContext("2d");
                          const imageData = ctx.getImageData(
                            adjustedX,
                            adjustedY - fontScaleY * viewport.scale,
                            fontScaleX * viewport.scale,
                            fontScaleY * viewport.scale
                          );

                          const textStyle = detectTextStyle(
                            canvas.getContext("2d"),
                            adjustedX,
                            adjustedY - fontScaleY * viewport.scale,
                            fontScaleX * viewport.scale,
                            fontScaleY * viewport.scale
                          );
                          applyTextDecoration(span, textStyle);

                          if (textStyle.includes("underlined")) {
                            span.style.textDecoration = "underline";
                          }
                          if (textStyle.includes("strikethrough")) {
                            span.style.textDecoration =
                              (span.style.textDecoration
                                ? span.style.textDecoration + " "
                                : "") + "line-through";
                          }
                          span.style.pointerEvents = "auto";
                          span.contentEditable = "true";
                          span.style.color = getAverageColor(imageData.data);

                          textLayer.appendChild(div);
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
          textLayer.style.display = "block"; // Show the text layer
          textLayer.style.pointerEvents = "auto"; // Enable editing

          textLayer.querySelectorAll("span").forEach((span) => {
            console.log(span?.style.fontFamily,"fromEditablee11")
            console.log(span?.style.fontSize,"fromEditablee22")

            downloadBtn.style.display = "block";
            span.className = "editSpan";
            span.contentEditable = "true"; // Make text editable
            span.style.cursor = "text";
            span.style.fontFamily = span.style.fontFamily
            span.style.fontSize = span.style.fontSize

          });
        });

        editBtn.style.display = "none"; // Hide the Edit button
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
        console.log(imageData,"imageData")
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
          if (brightness >= 128) {  // Focus on lighter areas (background color)
            r += imageData[i];
            g += imageData[i + 1];
            b += imageData[i + 2];
            count++;
          }
        }
      
        if (count === 0) return "rgb(255,255,255)";  // Default to white if no background found
        console.log(`rgb(${Math.round(r / count)}, ${Math.round(
          g / count
        )}, ${Math.round(b / count)})`)
        return `rgb(${Math.round(r / count)}, ${Math.round(
          g / count
        )}, ${Math.round(b / count)})`;
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
        console.log(canvases, "canvases123");
        canvases.forEach((canvas, index) => {
          console.log(canvas, "canvasFromResulttt");
          // Add the canvas as an image to the PDF
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

          // Add the editable text directly to the PDF
          const textLayer = canvas.parentNode.querySelector(".text-layer");
          console.log(textLayer, "textLayer123");
          if (textLayer) {
            const textElements = textLayer.getElementsByClassName("editSpan");
            const textElements1 = textLayer.getElementsByClassName("MainDiv");

            // Iterate over `textElements` (editSpan)
            [...textElements].forEach((span) => {
              console.log(span?.style, "style1111");
              const text = span.textContent;
              const left = parseFloat(span.style.left);
              const top = parseFloat(span.style.top);
              const width = parseFloat(span.style.width);
              const height = parseFloat(span.style.height);
              const fontFamily=span.style.fontFamily

              const fontSize = parseFloat(span.style.fontSize);
              const color = span.style.color;
              console.log(left, top, text, fontSize, color, "toShow");

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
                    width ,
                    height,
                    "F"
                  )
              }
            });

            // Iterate over `textElements1` (MainDiv)
            [...textElements1].forEach((div) => {
              console.log(div, "MainDiv Element");

              const spans = div.getElementsByClassName("editSpan"); 
              [...spans].forEach((span) => {
                console.log(span?.style, "Nested style1111");
                const text = span.textContent;
                const left = parseFloat(span.style.left);
                const top = parseFloat(span.style.top);
                const width = parseFloat(span.style.width);
                const height = parseFloat(span.style.height);

                const fontSize = parseFloat(span.style.fontSize);
                const backgroundColor = span.style.backgroundColor;
                const color = span.style.color;
                const fontFamily=span.style.fontFamily
                console.log(
                  fontFamily,
                  height,
                  backgroundColor,
                  "Nested toShow"
                );

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
                      width ,
                      height,
                      "F"
                    ); // 'F' for fill
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