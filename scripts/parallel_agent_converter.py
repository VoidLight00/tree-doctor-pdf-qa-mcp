#!/usr/bin/env python3
"""
6개 전문 병렬 에이전트를 사용한 PDF 변환
각 에이전트가 하나의 PDF를 전담하여 동시 처리
"""

import os
import sys
import time
import subprocess
import multiprocessing
from pathlib import Path
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor, as_completed
import signal

# 각 에이전트별 PDF 할당
AGENT_ASSIGNMENTS = {
    "Agent-5회": {
        "pdf": "/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf",
        "specialty": "제5회 기출문제 전문 변환 에이전트",
        "color": "\033[91m"  # Red
    },
    "Agent-6회": {
        "pdf": "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf",
        "specialty": "제6회 기출문제 전문 변환 에이전트",
        "color": "\033[92m"  # Green
    },
    "Agent-7회": {
        "pdf": "/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf",
        "specialty": "제7회 기출문제 전문 변환 에이전트",
        "color": "\033[93m"  # Yellow
    },
    "Agent-8회": {
        "pdf": "/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf",
        "specialty": "제8회 기출문제 전문 변환 에이전트",
        "color": "\033[94m"  # Blue
    },
    "Agent-9회": {
        "pdf": "/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf",
        "specialty": "제9회 기출문제 전문 변환 에이전트",
        "color": "\033[95m"  # Magenta
    },
    "Agent-10회": {
        "pdf": "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf",
        "specialty": "제10회 기출문제 전문 변환 에이전트",
        "color": "\033[96m"  # Cyan
    }
}

OUTPUT_DIR = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/marker-output"
LOG_DIR = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/agent-logs"
RESET_COLOR = "\033[0m"

def setup_directories():
    """필요한 디렉토리 생성"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)

def agent_log(agent_name, message, color=""):
    """에이전트별 로그 출력"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    log_msg = f"[{timestamp}] [{agent_name}] {message}"
    
    # 콘솔 출력 (색상 적용)
    print(f"{color}{log_msg}{RESET_COLOR}")
    
    # 파일 로그
    log_file = Path(LOG_DIR) / f"{agent_name}.log"
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(log_msg + '\n')

def convert_pdf_agent(agent_name, agent_info):
    """개별 에이전트의 PDF 변환 작업"""
    pdf_path = agent_info["pdf"]
    specialty = agent_info["specialty"]
    color = agent_info["color"]
    
    # 프로세스 시작
    agent_log(agent_name, f"🚀 {specialty} 시작", color)
    agent_log(agent_name, f"📄 파일: {Path(pdf_path).name}", color)
    
    # 파일 존재 확인
    if not os.path.exists(pdf_path):
        agent_log(agent_name, f"❌ 파일이 존재하지 않음", color)
        return (agent_name, False, "파일 없음")
    
    # 파일 크기 확인
    file_size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
    agent_log(agent_name, f"📊 파일 크기: {file_size_mb:.1f} MB", color)
    
    start_time = time.time()
    
    # Marker 명령어 구성
    cmd = [
        "marker_single",
        pdf_path,
        "--output_dir", OUTPUT_DIR,
        "--force_ocr",
        "--disable_multiprocessing"  # 각 에이전트 내부에서는 단일 프로세스
    ]
    
    try:
        # 환경 변수 설정
        env = os.environ.copy()
        env['PYTHONPATH'] = '/Users/voidlight/MCP-Servers/marker:' + env.get('PYTHONPATH', '')
        
        # 프로세스 실행
        agent_log(agent_name, "🔄 변환 시작...", color)
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env
        )
        
        # 진행 상황 모니터링
        while process.poll() is None:
            time.sleep(30)  # 30초마다 상태 체크
            elapsed = time.time() - start_time
            agent_log(agent_name, f"⏳ 진행 중... ({elapsed/60:.1f}분 경과)", color)
        
        # 결과 확인
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            elapsed = time.time() - start_time
            agent_log(agent_name, f"✅ 변환 완료! (총 {elapsed/60:.1f}분 소요)", color)
            
            # 출력 파일 확인
            output_name = Path(pdf_path).stem
            output_path = Path(OUTPUT_DIR) / output_name
            if output_path.exists():
                md_files = list(output_path.glob("*.md"))
                if md_files:
                    md_size_kb = os.path.getsize(md_files[0]) / 1024
                    agent_log(agent_name, f"📝 출력 크기: {md_size_kb:.1f} KB", color)
            
            return (agent_name, True, f"{elapsed/60:.1f}분")
        else:
            agent_log(agent_name, f"❌ 변환 실패", color)
            agent_log(agent_name, f"에러: {stderr[:200]}", color)
            return (agent_name, False, "변환 오류")
            
    except Exception as e:
        agent_log(agent_name, f"❌ 예외 발생: {str(e)}", color)
        return (agent_name, False, str(e))

def main():
    """메인 실행 함수"""
    print("="*60)
    print("🤖 6개 전문 병렬 에이전트 PDF 변환 시스템")
    print("="*60)
    
    # 디렉토리 설정
    setup_directories()
    
    # CPU 코어 수 확인
    cpu_count = multiprocessing.cpu_count()
    print(f"💻 시스템 CPU 코어: {cpu_count}개")
    print(f"🔧 사용할 워커 수: 6개 (각 PDF당 1개)")
    
    # 시작 시간
    total_start = time.time()
    
    # 병렬 처리 실행
    results = []
    
    print("\n🚀 모든 에이전트 동시 시작!\n")
    
    with ProcessPoolExecutor(max_workers=6) as executor:
        # 각 에이전트에 작업 할당
        future_to_agent = {
            executor.submit(convert_pdf_agent, agent_name, agent_info): agent_name
            for agent_name, agent_info in AGENT_ASSIGNMENTS.items()
        }
        
        # 완료된 작업 처리
        for future in as_completed(future_to_agent):
            agent_name = future_to_agent[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                results.append((agent_name, False, f"프로세스 오류: {str(e)}"))
    
    # 전체 소요 시간
    total_elapsed = time.time() - total_start
    
    # 결과 요약
    print("\n" + "="*60)
    print("📊 변환 결과 요약")
    print("="*60)
    
    success_count = sum(1 for _, success, _ in results if success)
    
    print(f"\n✅ 성공: {success_count}/6")
    print(f"⏱️  총 소요 시간: {total_elapsed/60:.1f}분")
    print(f"🚀 병렬 처리 효율: {(total_elapsed/60)/6:.1f}분/파일 (평균)")
    
    print("\n상세 결과:")
    for agent_name, success, detail in sorted(results):
        status = "✅" if success else "❌"
        print(f"  {status} {agent_name}: {detail}")
    
    # 변환된 파일 목록
    print("\n📁 출력 디렉토리 내용:")
    output_path = Path(OUTPUT_DIR)
    for item in sorted(output_path.iterdir()):
        if item.is_dir():
            md_files = list(item.glob("*.md"))
            if md_files:
                print(f"  📂 {item.name}/")
                for md in md_files:
                    size_kb = os.path.getsize(md) / 1024
                    print(f"     └─ {md.name} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    # Python 버전 확인
    if sys.version_info < (3, 10):
        print("❌ Python 3.10 이상이 필요합니다.")
        print("source ~/marker-env/bin/activate 를 실행하세요.")
        sys.exit(1)
    
    # 시그널 핸들러 설정 (Ctrl+C 처리)
    def signal_handler(sig, frame):
        print("\n\n⚠️  변환 중단됨")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # 메인 실행
    main()