let video; // Renamed from 'capture' to 'video' for consistency with ml5 example
let faceMesh;
let faces = [];

function preload() {
  // Initialize FaceMesh model with a maximum of one face.
  // 'flipped: false' because the video input from createCapture will NOT be flipped initially.
  // The mirroring will be applied by p5.js's transformation matrix in draw().
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: false });
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  // Do NOT use { flipped: true } here, as we will apply mirroring via p5.js's transformation matrix.
  video = createCapture(VIDEO);
  // 隱藏預設產生的 HTML video 元素，只在 canvas 內繪製
  video.hide();

  // Start detecting faces
  // The 'gotFaces' callback will be called when faces are detected.
  faceMesh.detectStart(video, gotFaces);
}

// Callback function for when face data is received from ml5.js
function gotFaces(results) {
  faces = results;
}

// Function called when the mouse is pressed
function mousePressed() {
  // Log detected face data to the console
  console.log(faces);
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');

  // 計算顯示寬高 (全螢幕的 50%)
  let displayWidth = windowWidth * 0.5;
  let displayHeight = windowHeight * 0.5;
  // 計算置中座標
  let x = (windowWidth - displayWidth) / 2;
  let y = (windowHeight - displayHeight) / 2;

  push();
  // 實作左右顛倒：平移到目標區域的右緣，並水平縮放 -1。
  // 這裡的 translate(x + displayWidth, y) 是為了讓 scale(-1, 1) 作用後，
  // 影像的左上角 (0,0) 仍然對應到畫布上的 (x,y) 區域的左上角。
  // 也就是說，影像會從 (x,y) 繪製到 (x+displayWidth, y+displayHeight)，但內容是左右顛倒的。
  translate(x + displayWidth, y);
  scale(-1, 1);
  image(video, 0, 0, displayWidth, displayHeight);
  pop();

  // 確保至少偵測到一張臉
  if (faces.length > 0) {
    let face = faces[0];

    // --- 偵測嘴巴張開程度 ---
    // 選擇上唇中央 (13) 和下唇中央 (14) 的關鍵點
    let upperLip = face.keypoints[13];
    let lowerLip = face.keypoints[14];
    // 計算垂直距離作為嘴巴張開的程度
    let mouthOpenDist = dist(upperLip.x, upperLip.y, lowerLip.x, lowerLip.y);
    
    // 定義嘴巴張開距離的範圍 (這些值可能需要根據實際情況調整)
    let minMouthOpenDist = 5; // 嘴巴閉合時的最小距離
    let maxMouthOpenDist = 30; // 嘴巴張開時的最大距離

    // --- 繪製面具底層 (填充色 + 臉部外輪廓) ---
    // 這些索引對應 MediaPipe FaceMesh 的臉部外輪廓
    let faceOutlineIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
    
    push();
    fill(255, 255, 255); // 改為純白色底色
    stroke(255, 0, 0);         // 紅色邊框
    strokeWeight(2);
    beginShape();
    for (let i = 0; i < faceOutlineIndices.length; i++) {
      let p = face.keypoints[faceOutlineIndices[i]];
      let sx = x + displayWidth - (p.x * (displayWidth / video.width));
      let sy = y + p.y * (displayHeight / video.height);
      vertex(sx, sy);
    }
    endShape(CLOSE);
    pop();

    // --- 繪製額外的裝飾圖案 (例如額頭與兩頰的點) ---
    let patternIndices = [10, 234, 454]; // 額頭中心、左頰、右頰
    noStroke();
    fill(255, 0, 0, 200); // 裝飾點使用半透明紅色
    for (let index of patternIndices) {
      let p = face.keypoints[index];
      let sx = x + displayWidth - (p.x * (displayWidth / video.width));
      let sy = y + p.y * (displayHeight / video.height);
      ellipse(sx, sy, 20, 20); // 在關鍵點畫出裝飾圓點
    }

    // --- 繪製流淚效果 ---
    // 根據嘴巴張開程度調整眼淚大小和透明度
    let tearScale = map(mouthOpenDist, minMouthOpenDist, maxMouthOpenDist, 1, 2, true); // 嘴巴張開越大，眼淚越大 (1到2倍)
    let tearAlpha = map(mouthOpenDist, minMouthOpenDist, maxMouthOpenDist, 100, 255, true); // 嘴巴張開越大，眼淚越不透明 (100到255)

    let tearIndices = [101, 330]; // 左右眼下方的特徵點
    fill(0, 150, 255, tearAlpha); // 水藍色，透明度動態調整
    noStroke();
    for (let index of tearIndices) {
      let p = face.keypoints[index];
      let sx = x + displayWidth - (p.x * (displayWidth / video.width));
      let sy = y + p.y * (displayHeight / video.height);
      
      push();
      translate(sx, sy + 10 * tearScale); // 根據縮放調整位置
      ellipse(0, 15 * tearScale, 12 * tearScale, 20 * tearScale); // 水滴主體，大小動態調整
      triangle(-6 * tearScale, 15 * tearScale, 6 * tearScale, 15 * tearScale, 0, -5 * tearScale); // 水滴尖端，大小動態調整
      pop();
    }

    // 指定要串接的臉部特徵點索引 (嘴唇輪廓)
    let lipIndices = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];

    stroke(255, 0, 0); // 設定線條顏色為紅色
    strokeWeight(15);  // 設定粗細為 15
    strokeJoin(ROUND); // 讓線條轉折處較平滑
    noFill();

    // 使用 line 指令串接指定的特徵點
    for (let i = 0; i < lipIndices.length - 1; i++) {
      let p1 = face.keypoints[lipIndices[i]];
      let p2 = face.keypoints[lipIndices[i + 1]];

      // 計算對應到畫布中央 50% 影像且左右顛倒的座標
      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);

      line(x1, y1, x2, y2);
    }

    // --- 繪製新的特徵點連線 (細紅線) ---
    let upperFaceIndices = [76, 77, 90, 180, 85, 16, 315, 404, 320, 307, 306, 408, 304, 303, 302, 11, 72, 73, 74, 184];
    
    strokeWeight(1); // 設定細線粗細為 1
    
    for (let i = 0; i < upperFaceIndices.length - 1; i++) {
      let p1 = face.keypoints[upperFaceIndices[i]];
      let p2 = face.keypoints[upperFaceIndices[i + 1]];

      // 同樣計算對應到畫布中央影像的鏡像座標
      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);

      line(x1, y1, x2, y2);
    }

    // --- 繪製左眼 (畫面右側) ---
    // 1. 計算左眼張合距離 (使用關鍵點 159 與 145)
    let leftE1 = face.keypoints[159];
    let leftE2 = face.keypoints[145];
    let leftEyeDist = dist(leftE1.x, leftE1.y, leftE2.x, leftE2.y);
    
    // 2. 將距離映射到粗細 (距離愈小/閉眼，線條愈粗；距離愈大/睜眼，線條愈細)
    // 這裡設定：距離 2 像素時粗細為 10，距離 15 像素時粗細為 1
    let leftWeight = map(leftEyeDist, 2, 15, 10, 1, true);

    let leftEyeOuter = [130, 25, 110, 24, 23, 22, 26, 112, 243, 190, 56, 28, 27, 29, 30, 247, 130];
    let leftEyeInner = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];

    stroke(255, 0, 0);
    strokeWeight(leftWeight); // 套用動態粗細

    // 畫左眼外圈
    for (let i = 0; i < leftEyeOuter.length - 1; i++) {
      let p1 = face.keypoints[leftEyeOuter[i]];
      let p2 = face.keypoints[leftEyeOuter[i + 1]];
      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);
      line(x1, y1, x2, y2);
    }
    // 畫左眼內圈
    for (let i = 0; i < leftEyeInner.length - 1; i++) {
      let p1 = face.keypoints[leftEyeInner[i]];
      let p2 = face.keypoints[leftEyeInner[i + 1]];
      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);
      line(x1, y1, x2, y2);
    }

    // --- 繪製右眼 (畫面左側) ---
    // 1. 計算右眼張合距離 (使用關鍵點 386 與 374)
    let rightE1 = face.keypoints[386];
    let rightE2 = face.keypoints[374];
    let rightEyeDist = dist(rightE1.x, rightE1.y, rightE2.x, rightE2.y);
    
    // 2. 映射右眼粗細
    let rightWeight = map(rightEyeDist, 2, 15, 10, 1, true);

    let rightEyeOuter = [
      263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466, 263
    ];
    let rightEyeInner = [
      359, 467, 257, 256, 255, 254, 286, 414, 463, 341, 253, 252, 253, 254, 339, 253, 359
    ];

    strokeWeight(rightWeight); // 套用動態粗細

    for (let i = 0; i < rightEyeOuter.length - 1; i++) {
      let p1 = face.keypoints[rightEyeOuter[i]];
      let p2 = face.keypoints[rightEyeOuter[i + 1]];

      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);

      line(x1, y1, x2, y2);
    }

    for (let i = 0; i < rightEyeInner.length - 1; i++) {
      let p1 = face.keypoints[rightEyeInner[i]];
      let p2 = face.keypoints[rightEyeInner[i + 1]];

      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);

      line(x1, y1, x2, y2);
    }
  }
}
