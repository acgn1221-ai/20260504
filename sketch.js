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

  // 在畫布左上角顯示文字
  push();
  fill(255); // 白色文字
  textSize(24);
  text("414730506 張怡婕", 20, 40); // 放置在左上角 (20, 40) 座標
  pop();

  // 確保至少偵測到一張臉
  if (faces.length > 0) {
    let face = faces[0];

    // --- 繪製彩色的爆炸頭效果 ---
    drawExplosionEffect(face, x, y, displayWidth, displayHeight);

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

    // --- 繪製小丑裝飾 ---
    noStroke();
    
    // 1. 鼻子大紅點 (小丑的核心特徵，使用鼻尖關鍵點 4)
    let nosePoint = face.keypoints[4];
    let nsx = x + displayWidth - (nosePoint.x * (displayWidth / video.width));
    let nsy = y + nosePoint.y * (displayHeight / video.height);
    fill(255, 0, 0); 
    ellipse(nsx, nsy, 40, 40); 

    // 2. 繪製星星 (在額頭與兩頰)
    fill(255, 204, 0); // 金色星星
    let starIndices = [10, 234, 454]; 
    for (let index of starIndices) {
      let p = face.keypoints[index];
      let sx = x + displayWidth - (p.x * (displayWidth / video.width));
      let sy = y + p.y * (displayHeight / video.height);
      drawStar(sx, sy, 10, 25, 5); 
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

    push(); // 隔離左眼樣式設定
    stroke(0, 0, 255); // 藍色
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
    pop(); // 恢復樣式設定

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

    push(); // 隔離右眼樣式設定

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

// 繪製星星的輔助函式
function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// 繪製爆炸頭效果的輔助函式
function drawExplosionEffect(face, x, y, displayWidth, displayHeight) {
  push();
  colorMode(HSB, 360, 100, 100, 1); // 使用HSB顏色模式
  noStroke();

  let hueOffset = frameCount * 5 % 360; // 讓顏色隨時間變化

  let faceOutlineIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

  // 計算臉部輪廓的中心點 (用於確定向外延伸的方向)
  let centroidX = 0;
  let centroidY = 0;
  for (let i = 0; i < faceOutlineIndices.length; i++) {
    let p = face.keypoints[faceOutlineIndices[i]];
    centroidX += p.x;
    centroidY += p.y;
  }
  centroidX /= faceOutlineIndices.length;
  centroidY /= faceOutlineIndices.length;

  // 將中心點轉換到畫布的鏡像座標
  let scaledCentroidX = x + displayWidth - (centroidX * (displayWidth / video.width));
  let scaledCentroidY = y + centroidY * (displayHeight / video.height);

  for (let i = 0; i < faceOutlineIndices.length; i++) {
    let p1 = face.keypoints[faceOutlineIndices[i]];
    let p2 = face.keypoints[faceOutlineIndices[(i + 1) % faceOutlineIndices.length]]; // 確保最後一個點連回第一個

    // 將特徵點轉換到畫布的鏡像座標
    let sx1 = x + displayWidth - (p1.x * (displayWidth / video.width));
    let sy1 = y + p1.y * (displayHeight / video.height);
    let sx2 = x + displayWidth - (p2.x * (displayWidth / video.width));
    let sy2 = y + p2.y * (displayHeight / video.height);

    // 臉部輪廓線段的中點
    let midX = (sx1 + sx2) / 2;
    let midY = (sy1 + sy2) / 2;

    // 從臉部中心到線段中點的向量，用於確定向外延伸的方向
    let vecX = midX - scaledCentroidX;
    let vecY = midY - scaledCentroidY;
    let len = dist(0, 0, vecX, vecY);

    // 歸一化向量，並加入一些隨機性
    if (len > 0) {
      vecX /= len;
      vecY /= len;
    } else { // 如果點在中心，給一個預設方向
      vecX = 0;
      vecY = -1;
    }

    let explosionLength = map(noise(i * 0.1, frameCount * 0.05), 0, 1, 30, 60); // 爆炸尖刺的長度 (30到60像素)
    let apexX = midX + vecX * explosionLength;
    let apexY = midY + vecY * explosionLength;

    // 顏色變化：根據時間和點的索引來循環色相
    let currentHue = (hueOffset + i * 5) % 360;
    fill(currentHue, 90, 95, 0.7); // 高飽和度、高亮度、半透明

    // 繪製三角形作為爆炸尖刺
    beginShape();
    vertex(sx1, sy1);
    vertex(sx2, sy2);
    vertex(apexX, apexY);
    endShape(CLOSE);
  }
  pop();
}
