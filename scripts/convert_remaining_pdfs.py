#!/usr/bin/env python3
"""
나무의사 기출문제 PDF 변환 스크립트
Marker를 사용하여 나머지 6개 PDF를 순차적으로 변환
"""

import os
import sys
import time
import subprocess
from pathlib import Path
from datetime import datetime

# PDF 파일 목록 (이미 변환된 제11회 제외)
PDF_FILES = [
    "/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf"
]

OUTPUT_DIR = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/marker-output"
LOG_FILE = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/conversion_log.txt"

def log_message(message):
    """로그 메시지 출력 및 파일 저장"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_msg = f"[{timestamp}] {message}"
    print(log_msg)
    
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(log_msg + '\n')

def convert_pdf(pdf_path):
    """단일 PDF 파일 변환"""
    file_name = Path(pdf_path).name
    log_message(f"변환 시작: {file_name}")
    
    start_time = time.time()
    
    # Marker 명령어 실행
    cmd = [
        "marker_single",
        pdf_path,
        "--output_dir", OUTPUT_DIR,
        "--force_ocr",  # OCR 강제 실행
        "--disable_multiprocessing"  # 메모리 문제 방지
    ]
    
    try:
        # 프로세스 실행
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=1800  # 30분 타임아웃
        )
        
        if result.returncode == 0:
            elapsed = time.time() - start_time
            log_message(f"✅ 변환 성공: {file_name} ({elapsed:.1f}초)")
            return True
        else:
            log_message(f"❌ 변환 실패: {file_name}")
            log_message(f"   에러: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        log_message(f"⏰ 타임아웃: {file_name} (30분 초과)")
        return False
    except Exception as e:
        log_message(f"❌ 예외 발생: {file_name} - {str(e)}")
        return False

def main():
    """메인 함수"""
    log_message("=== 나무의사 기출문제 PDF 변환 시작 ===")
    log_message(f"총 {len(PDF_FILES)}개 파일 변환 예정")
    
    # 출력 디렉토리 생성
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 변환 통계
    success_count = 0
    failed_files = []
    
    # 각 PDF 순차 처리
    for idx, pdf_path in enumerate(PDF_FILES, 1):
        log_message(f"\n[{idx}/{len(PDF_FILES)}] 처리 중...")
        
        if not os.path.exists(pdf_path):
            log_message(f"⚠️  파일이 존재하지 않음: {pdf_path}")
            failed_files.append(pdf_path)
            continue
        
        # PDF 변환
        if convert_pdf(pdf_path):
            success_count += 1
        else:
            failed_files.append(pdf_path)
        
        # 다음 파일 처리 전 잠시 대기 (시스템 부하 감소)
        if idx < len(PDF_FILES):
            log_message("10초 대기 중...")
            time.sleep(10)
    
    # 결과 요약
    log_message("\n=== 변환 완료 ===")
    log_message(f"성공: {success_count}/{len(PDF_FILES)}")
    
    if failed_files:
        log_message("\n실패한 파일:")
        for f in failed_files:
            log_message(f"  - {Path(f).name}")
    
    # 변환된 파일 목록
    log_message("\n변환된 파일 위치:")
    for item in Path(OUTPUT_DIR).iterdir():
        if item.is_dir():
            md_files = list(item.glob("*.md"))
            if md_files:
                log_message(f"  - {item.name}/")
                for md in md_files:
                    log_message(f"    └─ {md.name}")

if __name__ == "__main__":
    # Python 환경 확인
    if sys.version_info < (3, 10):
        print("Python 3.10 이상이 필요합니다.")
        print("source ~/marker-env/bin/activate 를 실행하세요.")
        sys.exit(1)
    
    main()