#!/bin/bash
# OCR 도구 설치 스크립트

echo "🔧 고품질 OCR 도구 설치 시작..."

# 1. Python 패키지 설치
echo "📦 Python OCR 패키지 설치..."
source ~/marker-env/bin/activate

pip install --upgrade pip
pip install pytesseract
pip install easyocr
pip install opencv-python
pip install pillow
pip install google-cloud-vision
pip install azure-cognitiveservices-vision-computervision
pip install pdf2image
pip install PyMuPDF

# 2. Tesseract 설치 (Homebrew 사용)
echo "📦 Tesseract OCR 설치..."
if ! command -v tesseract &> /dev/null; then
    brew install tesseract
    brew install tesseract-lang  # 추가 언어 팩
fi

# 3. Poppler 설치 (PDF 처리용)
echo "📦 Poppler 설치..."
if ! command -v pdftotext &> /dev/null; then
    brew install poppler
fi

# 4. ImageMagick 설치 (이미지 처리용)
echo "📦 ImageMagick 설치..."
if ! command -v convert &> /dev/null; then
    brew install imagemagick
fi

# 5. 한국어 폰트 설치
echo "📦 한국어 폰트 설치..."
brew tap homebrew/cask-fonts
brew install --cask font-nanum-gothic
brew install --cask font-nanum-gothic-coding

echo "✅ OCR 도구 설치 완료!"

# 설치 확인
echo "
🔍 설치 확인:
"
echo -n "Tesseract: "
tesseract --version | head -n 1
echo -n "Python pytesseract: "
python -c "import pytesseract; print('✓ 설치됨')"
echo -n "EasyOCR: "
python -c "import easyocr; print('✓ 설치됨')"
echo -n "OpenCV: "
python -c "import cv2; print('✓ 설치됨')"

echo "
📝 다음 단계:
1. Google Vision API 키 설정: export GOOGLE_APPLICATION_CREDENTIALS='path/to/key.json'
2. Azure CV API 키 설정: export AZURE_CV_KEY='your-key'
"