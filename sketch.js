let capture;

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  // 隱藏預設產生的 HTML video 元素，只在 canvas 內繪製
  capture.hide();
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');

  // 計算顯示寬高 (全螢幕的 50%)
  let w = windowWidth * 0.5;
  let h = windowHeight * 0.5;
  // 計算置中座標
  let x = (windowWidth - w) / 2;
  let y = (windowHeight - h) / 2;

  push();
  // 實作左右顛倒：平移到目標區域的右緣，並水平縮放 -1
  translate(x + w, y);
  scale(-1, 1);
  image(capture, 0, 0, w, h);
  pop();
}
