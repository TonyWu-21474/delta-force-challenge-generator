const form = document.querySelector("#generatorForm");
const canvas = document.querySelector("#poster");
const ctx = canvas.getContext("2d");

const fields = {
  challenger: document.querySelector("#challenger"),
  defender: document.querySelector("#defender"),
  venue: document.querySelector("#venue"),
  matchTime: document.querySelector("#matchTime"),
  score: document.querySelector("#score"),
  issueDate: document.querySelector("#issueDate"),
  watermark: document.querySelector("#watermark"),
  sealToggle: document.querySelector("#sealToggle"),
};

const defaults = {
  challenger: "飞天狙想要努力变胖",
  defender: "",
  venue: "自建房 1V1",
  matchTime: "",
  score: "10",
  issueDate: "",
  watermark: "飞天狙想要努力变胖",
};

const CANVAS_W = 1240;
const CANVAS_H = 1754;
const SERIF = '"FangSong", "仿宋", "STFangsong", "SimSun", serif';
const TITLE_FONT = '"STZhongsong", "方正小标宋简体", "SimSun", serif';
const SEAL_FONT = '"STKaiti", "KaiTi", "SimSun", serif';
const SANS = '"Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif';

function setTodayDefaults() {
  if (!fields.matchTime.value) {
    const date = new Date(Date.now() + 86400000);
    const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    fields.matchTime.value = iso;
  }

  if (!fields.issueDate.value) {
    const date = new Date();
    fields.issueDate.value = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 10);
  }
}

function formatDateTime(raw) {
  if (!raw) return "____年__月__日 __点";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${hour}:${minute}`;
}

function formatDate(raw) {
  if (!raw) return "________";
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function valueOrBlank(id) {
  return (fields[id].value || "").trim() || "________";
}

function wrapText(text, x, y, maxWidth, lineHeight, maxLines = 2, font = `34px ${SERIF}`) {
  ctx.save();
  ctx.font = font;

  const chars = [...text];
  const lines = [];
  let line = "";

  for (const char of chars) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  }

  if (line) lines.push(line);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = kept[kept.length - 1];
    while (
      kept[kept.length - 1].length > 1 &&
      ctx.measureText(`${kept[kept.length - 1]}…`).width > maxWidth
    ) {
      kept[kept.length - 1] = kept[kept.length - 1].slice(0, -1);
    }
    kept[kept.length - 1] = `${last.slice(0, -1)}…`;
    ctx.restore();
    return kept.map((text, index) => ({ text, y: y + index * lineHeight }));
  }

  ctx.restore();
  return lines.map((text, index) => ({ text, y: y + index * lineHeight }));
}

function drawText(text, x, y, options = {}) {
  ctx.save();
  ctx.font = options.font || `34px ${SERIF}`;
  ctx.fillStyle = options.color || "#241b15";
  ctx.textAlign = options.align || "left";
  ctx.textBaseline = options.baseline || "alphabetic";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawSpacedTitle(text, centerX, y, spacing = 6, font = `56px ${SERIF}`) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = "#1d1713";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const chars = [...text];
  const widths = chars.map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, width) => sum + width, 0) +
    spacing * Math.max(0, chars.length - 1);
  let x = centerX - total / 2;

  chars.forEach((char, index) => {
    ctx.fillText(char, x + widths[index] / 2, y);
    x += widths[index] + spacing;
  });

  ctx.restore();
}

function drawWatermark(text) {
  if (!text) return;

  ctx.save();
  ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
  ctx.rotate(-0.46);
  ctx.fillStyle = "rgba(122, 42, 28, 0.06)";
  ctx.font = `500 48px ${SANS}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const step = 220;
  const startX = -Math.ceil((CANVAS_W / 2) / step) * step;
  const startY = -Math.ceil((CANVAS_H / 2) / step) * step;

  for (let y = startY; y < CANVAS_H * 1.2; y += step) {
    for (let x = startX; x < CANVAS_W * 1.2; x += step) {
      ctx.fillText(text, x, y);
    }
  }

  ctx.restore();
}

function drawPaper() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawSeal(x, y) {
  const size = 104;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.12);
  ctx.fillStyle = "#b32b21";
  ctx.shadowColor = "rgba(120, 20, 15, 0.25)";
  ctx.shadowBlur = 8;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#f8e8d2";
  ctx.lineWidth = 3;
  ctx.strokeRect(-size / 2 + 7, -size / 2 + 7, size - 14, size - 14);
  ctx.fillStyle = "#f8e8d2";
  ctx.font = `700 64px ${SEAL_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("战", 0, 4);
  ctx.restore();
}

function draw() {
  const data = {
    challenger: valueOrBlank("challenger"),
    defender: valueOrBlank("defender"),
    venue: valueOrBlank("venue"),
    matchTime: formatDateTime(fields.matchTime.value),
    score: fields.score.value.trim() || "__",
    issueDate: formatDate(fields.issueDate.value),
    watermark: fields.watermark.value.trim(),
    showSeal: fields.sealToggle.checked,
  };

  drawPaper();
  drawWatermark(data.watermark);

  const centerX = CANVAS_W / 2;
  const bodyLeft = 170;
  const bodyWidth = CANVAS_W - 340;
  const rightX = bodyLeft + bodyWidth;
  const indentX = bodyLeft + 60;

  drawText("三角洲行动", centerX, 205, {
    font: "700 56px SimHei",
    color: "#c00000",
    align: "center",
  });
  drawSpacedTitle("单挑挑战书", centerX, 285, 8, `700 46px ${TITLE_FONT}`);

  ctx.save();
  ctx.strokeStyle = "#c00000";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(bodyLeft, 340);
  ctx.lineTo(rightX, 340);
  ctx.stroke();
  ctx.restore();

  let y = 410;
  const paragraphHeight = 50;
  const paragraph = `本人${data.challenger}（挑战者 ID），正式向${data.defender}（应战人 ID）发起三角洲行动 1v1 单挑约战。`;
  const paragraphLines = wrapText(
    paragraph,
    indentX,
    y,
    bodyWidth - 60,
    paragraphHeight,
    2,
    `30px ${SERIF}`,
  );
  paragraphLines.forEach((line) => {
    drawText(line.text, indentX, line.y, {
      font: `30px ${SERIF}`,
      color: "#1a1a1a",
    });
  });
  y = paragraphLines[paragraphLines.length - 1].y + paragraphHeight + 24;

  const details = [
    { label: "一、对战场地", value: data.venue },
    { label: "二、对战时间", value: data.matchTime },
    { label: "三、胜负定分", value: `先拿到 ${data.score} 分者获胜` },
  ];

  details.forEach((item) => {
    const line = `${item.label}：${item.value}`;
    const lines = wrapText(
      line,
      indentX,
      y,
      bodyWidth - 60,
      50,
      2,
      `30px ${SERIF}`,
    );
    lines.forEach((text) => {
      drawText(text.text, indentX, text.y, {
        font: `30px ${SERIF}`,
        color: "#1a1a1a",
      });
    });
    y = lines[lines.length - 1].y + 48;
  });

  y += 18;

  const rules = [
    "1. 纯 1v1，无外援、无队友、不卡 bug、不搞偷袭，只拼枪法身法意识。",
    "2. 武器双方协商，禁止阴人道具耍赖，跑图躲苟算输。",
    "3. 中途鸽局、退游戏直接判负。",
    "4. 愿赌服输，输方自愿签下《三角洲认怂书》，不许甩锅延迟、鼠标、网络、游戏问题，输就是技术不行。",
  ];

  rules.forEach((rule) => {
    const lines = wrapText(
      rule,
      indentX,
      y,
      bodyWidth - 60,
      52,
      2,
      `30px ${SERIF}`,
    );
    lines.forEach((text) => {
      drawText(text.text, indentX, text.y, {
        font: `30px ${SERIF}`,
        color: "#1a1a1a",
      });
    });
    y = lines[lines.length - 1].y + 44;
  });

  y += 32;
  const sloganLines = wrapText(
    "胜者扬眉，败者认罚，敢接就来，谁怂谁先溜！",
    indentX,
    y,
    bodyWidth - 60,
    56,
    2,
    `700 34px ${SERIF}`,
  );
  sloganLines.forEach((text) => {
    drawText(text.text, indentX, text.y, {
      font: `700 34px ${SERIF}`,
      color: "#1a1a1a",
    });
  });
  y = sloganLines[sloganLines.length - 1].y + 130;

  drawText(`挑战者：${data.challenger}`, rightX, y, {
    font: `30px ${SERIF}`,
    color: "#1a1a1a",
    align: "right",
  });
  y += 70;
  drawText(`应战人：${data.defender}`, rightX, y, {
    font: `30px ${SERIF}`,
    color: "#1a1a1a",
    align: "right",
  });
  y += 70;
  drawText(`日期：${data.issueDate}`, rightX, y, {
    font: `30px ${SERIF}`,
    color: "#1a1a1a",
    align: "right",
  });

  if (data.showSeal) {
    drawSeal(rightX - 150, y + 42);
  }
}

function exportPNG() {
  const link = document.createElement("a");
  link.download = "三角洲单挑挑战书.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    0,
    0,
    210,
    297,
    undefined,
    "FAST",
  );
  pdf.save("三角洲单挑挑战书.pdf");
}

function resetForm() {
  Object.entries(defaults).forEach(([key, value]) => {
    fields[key].value = value;
  });
  setTodayDefaults();
  draw();
}

function init() {
  setTodayDefaults();
  form.addEventListener("input", draw);
  document.querySelector("#pngBtn").addEventListener("click", exportPNG);
  document.querySelector("#pdfBtn").addEventListener("click", exportPDF);
  document.querySelector("#resetBtn").addEventListener("click", resetForm);

  if (window.lucide) {
    window.lucide.createIcons();
  }

  draw();
}

init();
