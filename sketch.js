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

    // --- 繪製臉部底層面具 (依照臉型外框) ---
    // 這些索引對應 MediaPipe FaceMesh 的臉部外輪廓
    let faceOutlineIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
    
    push();
    fill(255, 255, 255, 120); // 設定面具為半透明白色
    noStroke();
    beginShape();
    for (let i = 0; i < faceOutlineIndices.length; i++) {
      let p = face.keypoints[faceOutlineIndices[i]];
      let sx = x + displayWidth - (p.x * (displayWidth / video.width));
      let sy = y + p.y * (displayHeight / video.height);
      vertex(sx, sy);
    }
    endShape(CLOSE);
    pop();

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

    // --- 繪製左眼外圈 (包含編號 247) ---
    let leftEyeOuter = [130, 247, 30, 29, 27, 28, 56, 190, 243, 112, 26, 22, 23, 24, 110, 25, 130];
    stroke(255, 0, 0); 
    strokeWeight(2);
    for (let i = 0; i < leftEyeOuter.length - 1; i++) {
      let p1 = face.keypoints[leftEyeOuter[i]];
      let p2 = face.keypoints[leftEyeOuter[i + 1]];

      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);

      line(x1, y1, x2, y2);
    }

    // --- 繪製左眼內圈 (包含編號 246) ---
    let leftEyeInner = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33];
    for (let i = 0; i < leftEyeInner.length - 1; i++) {
      let p1 = face.keypoints[leftEyeInner[i]];
      let p2 = face.keypoints[leftEyeInner[i + 1]];

      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);

      line(x1, y1, x2, y2);
    }

    // --- 繪製左眼外圈 (包含編號 247) ---
    // 這些點位是根據 MediaPipe Face Mesh 的標準點位，對應到左眼的外輪廓
    let leftEyeOuter = [130, 25, 110, 24, 23, 22, 26, 112, 243, 190, 56, 28, 27, 29, 30, 247, 130];
    
    stroke(255, 0, 0); // 設定線條顏色為紅色
    strokeWeight(2);   // 設定粗細為 2
    strokeJoin(ROUND);
    noFill();

    for (let i = 0; i < leftEyeOuter.length - 1; i++) {
      let p1 = face.keypoints[leftEyeOuter[i]];
      let p2 = face.keypoints[leftEyeOuter[i + 1]];

      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);

      line(x1, y1, x2, y2);
    }

    // --- 繪製左眼內圈 (包含編號 246) ---
    // 這些點位是根據 MediaPipe Face Mesh 的標準點位，對應到左眼的內輪廓
    let leftEyeInner = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
    
    for (let i = 0; i < leftEyeInner.length - 1; i++) {
      let p1 = face.keypoints[leftEyeInner[i]];
      let p2 = face.keypoints[leftEyeInner[i + 1]];

      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);

      line(x1, y1, x2, y2);
    }

    // --- 繪製右眼外圈 (對應使用者提供的左眼內圈) ---
    // 這些點位是根據 MediaPipe Face Mesh 的標準點位，對應到右眼的外輪廓
    let rightEyeOuter = [
      263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466, 263
    ];
    
    stroke(255, 0, 0); // 設定線條顏色為紅色
    strokeWeight(2);   // 設定粗細為 2
    strokeJoin(ROUND);
    noFill();

    for (let i = 0; i < rightEyeOuter.length - 1; i++) {
      let p1 = face.keypoints[rightEyeOuter[i]];
      let p2 = face.keypoints[rightEyeOuter[i + 1]];

      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);

      line(x1, y1, x2, y2);
    }

    // --- 繪製右眼內圈 (對應使用者提供的左眼外圈) ---
    // 這些點位是根據 MediaPipe Face Mesh 的標準點位，對應到右眼的內輪廓
    let rightEyeInner = [
      359, 467, 257, 256, 255, 254, 286, 414, 463, 341, 253, 252, 253, 254, 339, 253, 359
    ];
    
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
