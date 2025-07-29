#!/usr/bin/env python3
"""
병렬 에이전트 모니터링 대시보드
실시간으로 6개 에이전트의 진행 상황을 모니터링
"""

import os
import time
import json
from pathlib import Path
from datetime import datetime
import threading

LOG_DIR = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/agent-logs"
OUTPUT_DIR = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/marker-output"

class AgentMonitor:
    def __init__(self):
        self.agents = {
            "Agent-5회": {"status": "대기", "progress": 0, "start_time": None},
            "Agent-6회": {"status": "대기", "progress": 0, "start_time": None},
            "Agent-7회": {"status": "대기", "progress": 0, "start_time": None},
            "Agent-8회": {"status": "대기", "progress": 0, "start_time": None},
            "Agent-9회": {"status": "대기", "progress": 0, "start_time": None},
            "Agent-10회": {"status": "대기", "progress": 0, "start_time": None},
        }
        self.running = True
        
    def read_agent_log(self, agent_name):
        """에이전트 로그 파일 읽기"""
        log_file = Path(LOG_DIR) / f"{agent_name}.log"
        if not log_file.exists():
            return []
        
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                return f.readlines()
        except:
            return []
    
    def parse_agent_status(self, agent_name, log_lines):
        """로그에서 에이전트 상태 파싱"""
        if not log_lines:
            return
        
        status = self.agents[agent_name]
        
        for line in log_lines:
            if "시작" in line and status["start_time"] is None:
                status["status"] = "시작됨"
                status["start_time"] = datetime.now()
            elif "변환 시작..." in line:
                status["status"] = "변환 중"
                status["progress"] = 10
            elif "진행 중..." in line:
                # 경과 시간에서 진행률 추정
                if "분 경과" in line:
                    try:
                        minutes = float(line.split("(")[1].split("분")[0])
                        # 평균 20분 기준으로 진행률 계산
                        status["progress"] = min(int((minutes / 20) * 100), 95)
                    except:
                        pass
            elif "변환 완료!" in line:
                status["status"] = "완료"
                status["progress"] = 100
            elif "변환 실패" in line or "예외 발생" in line:
                status["status"] = "실패"
    
    def check_output_files(self):
        """출력 파일 확인"""
        output_info = {}
        output_path = Path(OUTPUT_DIR)
        
        if output_path.exists():
            for item in output_path.iterdir():
                if item.is_dir():
                    md_files = list(item.glob("*.md"))
                    if md_files:
                        size_kb = sum(os.path.getsize(f) for f in md_files) / 1024
                        output_info[item.name] = {
                            "files": len(md_files),
                            "size_kb": size_kb
                        }
        
        return output_info
    
    def display_dashboard(self):
        """대시보드 표시"""
        os.system('clear' if os.name == 'posix' else 'cls')
        
        print("="*80)
        print("🤖 나무의사 PDF 변환 병렬 에이전트 모니터링 대시보드")
        print("="*80)
        print(f"⏰ 현재 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)
        
        # 에이전트 상태
        print("\n📊 에이전트 상태:")
        print("-"*80)
        print(f"{'에이전트':<15} {'상태':<10} {'진행률':<20} {'경과 시간':<15} {'비고':<20}")
        print("-"*80)
        
        completed_count = 0
        failed_count = 0
        
        for agent_name, status in self.agents.items():
            progress_bar = self.create_progress_bar(status["progress"])
            
            elapsed_time = ""
            if status["start_time"]:
                elapsed = (datetime.now() - status["start_time"]).total_seconds() / 60
                elapsed_time = f"{elapsed:.1f}분"
            
            # 상태별 색상
            status_color = ""
            if status["status"] == "완료":
                status_color = "\033[92m"  # Green
                completed_count += 1
            elif status["status"] == "실패":
                status_color = "\033[91m"  # Red
                failed_count += 1
            elif status["status"] == "변환 중":
                status_color = "\033[93m"  # Yellow
            else:
                status_color = "\033[90m"  # Gray
            
            print(f"{agent_name:<15} {status_color}{status['status']:<10}\033[0m {progress_bar:<20} {elapsed_time:<15}")
        
        # 전체 진행률
        total_progress = sum(s["progress"] for s in self.agents.values()) / len(self.agents)
        print("-"*80)
        print(f"전체 진행률: {self.create_progress_bar(total_progress)} {total_progress:.1f}%")
        print(f"완료: {completed_count}/6 | 실패: {failed_count}/6 | 진행 중: {6-completed_count-failed_count}/6")
        
        # 출력 파일 정보
        output_info = self.check_output_files()
        if output_info:
            print("\n📁 생성된 출력 파일:")
            print("-"*80)
            for name, info in output_info.items():
                print(f"  {name}: {info['files']}개 파일, {info['size_kb']:.1f} KB")
        
        print("\n[모니터링 중... Ctrl+C로 종료]")
    
    def create_progress_bar(self, percent):
        """진행률 바 생성"""
        filled = int(percent / 10)
        bar = "█" * filled + "░" * (10 - filled)
        return f"[{bar}] {percent:.0f}%"
    
    def update_status(self):
        """상태 업데이트"""
        while self.running:
            for agent_name in self.agents.keys():
                log_lines = self.read_agent_log(agent_name)
                self.parse_agent_status(agent_name, log_lines)
            
            self.display_dashboard()
            time.sleep(5)  # 5초마다 업데이트
    
    def run(self):
        """모니터링 실행"""
        try:
            self.update_status()
        except KeyboardInterrupt:
            print("\n\n모니터링 종료")

def main():
    """메인 함수"""
    # 로그 디렉토리 확인
    if not Path(LOG_DIR).exists():
        print(f"⚠️  로그 디렉토리가 없습니다: {LOG_DIR}")
        print("먼저 parallel_agent_converter.py를 실행하세요.")
        return
    
    monitor = AgentMonitor()
    monitor.run()

if __name__ == "__main__":
    main()