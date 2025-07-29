#!/usr/bin/env python3
"""
Marker PDF 변환 환경 설정 스크립트
- Python 버전 확인
- 필요한 패키지 설치
- 환경 테스트
"""

import sys
import subprocess
import os
import platform
from pathlib import Path

class MarkerSetup:
    def __init__(self):
        self.marker_path = Path("/Users/voidlight/MCP-Servers/marker")
        self.min_python_version = (3, 10)
        self.setup_errors = []
        
    def check_python_version(self):
        """Python 버전 확인"""
        print("📌 Python 버전 확인 중...")
        current_version = sys.version_info[:2]
        print(f"  현재 버전: {current_version[0]}.{current_version[1]}")
        
        if current_version < self.min_python_version:
            msg = f"⚠️  Python {self.min_python_version[0]}.{self.min_python_version[1]}+ 필요 (현재: {current_version[0]}.{current_version[1]})"
            print(msg)
            self.setup_errors.append(msg)
            return False
        
        print("  ✅ Python 버전 OK")
        return True
    
    def check_homebrew(self):
        """Homebrew 설치 확인"""
        print("\n📌 Homebrew 확인 중...")
        try:
            result = subprocess.run(['brew', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                print("  ✅ Homebrew 설치됨")
                return True
        except:
            pass
        
        msg = "⚠️  Homebrew가 설치되지 않음"
        print(msg)
        self.setup_errors.append(msg)
        return False
    
    def install_python310(self):
        """Python 3.10+ 설치 시도"""
        print("\n📌 Python 3.10+ 설치 옵션:")
        
        if platform.system() == 'Darwin':  # macOS
            print("\n  1. Homebrew를 통한 설치 (권장):")
            print("     brew install python@3.11")
            print("\n  2. pyenv를 통한 설치:")
            print("     brew install pyenv")
            print("     pyenv install 3.11.9")
            print("     pyenv global 3.11.9")
            print("\n  3. Python 공식 웹사이트:")
            print("     https://www.python.org/downloads/")
        
        return False
    
    def create_venv(self):
        """가상환경 생성"""
        print("\n📌 가상환경 생성 시도...")
        venv_path = Path.home() / "marker-env"
        
        try:
            # Python 3.11 찾기
            python_paths = [
                "/opt/homebrew/bin/python3.11",
                "/usr/local/bin/python3.11",
                "/opt/homebrew/bin/python3.10",
                "/usr/local/bin/python3.10",
            ]
            
            python_exe = None
            for path in python_paths:
                if os.path.exists(path):
                    python_exe = path
                    break
            
            if python_exe:
                print(f"  찾은 Python: {python_exe}")
                subprocess.run([python_exe, "-m", "venv", str(venv_path)], check=True)
                print(f"  ✅ 가상환경 생성됨: {venv_path}")
                
                print("\n  활성화 명령:")
                print(f"  source {venv_path}/bin/activate")
                return True
            else:
                print("  ⚠️  Python 3.10+ 실행 파일을 찾을 수 없음")
                
        except Exception as e:
            print(f"  ❌ 가상환경 생성 실패: {e}")
        
        return False
    
    def check_marker_installation(self):
        """Marker 설치 상태 확인"""
        print("\n📌 Marker 설치 상태 확인...")
        
        if not self.marker_path.exists():
            print(f"  ❌ Marker 디렉토리가 없음: {self.marker_path}")
            return False
        
        # pyproject.toml 확인
        pyproject = self.marker_path / "pyproject.toml"
        if pyproject.exists():
            print("  ✅ pyproject.toml 확인됨")
        else:
            print("  ❌ pyproject.toml이 없음")
            return False
        
        # marker 패키지 확인
        marker_pkg = self.marker_path / "marker"
        if marker_pkg.exists() and marker_pkg.is_dir():
            print("  ✅ marker 패키지 디렉토리 확인됨")
        else:
            print("  ❌ marker 패키지 디렉토리가 없음")
            return False
        
        return True
    
    def test_import(self):
        """Marker import 테스트"""
        print("\n📌 Marker import 테스트...")
        
        test_script = '''
import sys
sys.path.insert(0, "/Users/voidlight/MCP-Servers/marker")

try:
    from marker.converters.pdf import PdfConverter
    from marker.models import create_model_dict
    print("✅ Marker 모듈 import 성공")
except ImportError as e:
    print(f"❌ Import 실패: {e}")
except Exception as e:
    print(f"❌ 기타 오류: {e}")
'''
        
        try:
            result = subprocess.run(
                [sys.executable, "-c", test_script],
                capture_output=True,
                text=True
            )
            print(result.stdout)
            if result.stderr:
                print(f"  표준 에러: {result.stderr}")
            
            return result.returncode == 0
        except Exception as e:
            print(f"  ❌ 테스트 실행 실패: {e}")
            return False
    
    def show_summary(self):
        """설정 요약 표시"""
        print("\n" + "="*60)
        print("📋 Marker 설정 요약")
        print("="*60)
        
        if self.setup_errors:
            print("\n❌ 발견된 문제:")
            for error in self.setup_errors:
                print(f"  - {error}")
        else:
            print("\n✅ 모든 검사 통과!")
        
        print("\n🔧 권장 설치 방법:")
        print("1. Python 3.11 설치:")
        print("   brew install python@3.11")
        
        print("\n2. 가상환경 생성 및 활성화:")
        print("   python3.11 -m venv ~/marker-env")
        print("   source ~/marker-env/bin/activate")
        
        print("\n3. Marker 설치:")
        print("   cd /Users/voidlight/MCP-Servers/marker")
        print("   pip install -e .")
        print("   # 또는 전체 기능 설치:")
        print("   pip install -e '.[full]'")
        
        print("\n4. 테스트:")
        print("   marker_single --help")
        
        print("\n📌 병렬 처리 스크립트:")
        print("   /Users/voidlight/tree-doctor-pdf-qa-mcp/scripts/marker-parallel.py")
    
    def run(self):
        """전체 설정 프로세스 실행"""
        print("🚀 Marker PDF 변환 환경 설정 시작\n")
        
        # 1. Python 버전 확인
        if not self.check_python_version():
            self.check_homebrew()
            self.install_python310()
            self.create_venv()
        
        # 2. Marker 설치 확인
        self.check_marker_installation()
        
        # 3. Import 테스트
        if sys.version_info[:2] >= self.min_python_version:
            self.test_import()
        
        # 4. 요약 표시
        self.show_summary()


if __name__ == "__main__":
    setup = MarkerSetup()
    setup.run()