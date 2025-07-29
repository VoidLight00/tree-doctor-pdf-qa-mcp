#!/usr/bin/env python3
"""
Marker 기능 테스트 스크립트
- 기본 변환 테스트
- 다양한 옵션 테스트
- 성능 측정
"""

import os
import sys
import time
import tempfile
from pathlib import Path
from urllib.request import urlretrieve

# Marker 경로 추가
sys.path.insert(0, "/Users/voidlight/MCP-Servers/marker")


def download_test_pdf():
    """테스트용 PDF 다운로드"""
    test_pdfs = {
        "simple": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        "arxiv": "https://arxiv.org/pdf/2101.03961.pdf",  # Switch Transformers 논문
    }
    
    test_dir = Path.home() / "marker-test-pdfs"
    test_dir.mkdir(exist_ok=True)
    
    downloaded = {}
    
    for name, url in test_pdfs.items():
        pdf_path = test_dir / f"{name}.pdf"
        if not pdf_path.exists():
            print(f"📥 {name} PDF 다운로드 중...")
            try:
                urlretrieve(url, pdf_path)
                print(f"  ✅ 다운로드 완료: {pdf_path}")
                downloaded[name] = pdf_path
            except Exception as e:
                print(f"  ❌ 다운로드 실패: {e}")
        else:
            print(f"  ✅ 이미 존재: {pdf_path}")
            downloaded[name] = pdf_path
    
    return downloaded


def test_basic_conversion():
    """기본 변환 테스트"""
    print("\n" + "="*60)
    print("📋 기본 변환 테스트")
    print("="*60)
    
    try:
        from marker.converters.pdf import PdfConverter
        from marker.models import create_model_dict
        from marker.output import text_from_rendered
        
        print("✅ Marker 모듈 import 성공")
        
        # 테스트 PDF 준비
        test_pdfs = download_test_pdf()
        if not test_pdfs:
            print("❌ 테스트 PDF가 없습니다")
            return False
        
        # 간단한 PDF로 테스트
        simple_pdf = test_pdfs.get("simple")
        if not simple_pdf:
            print("❌ 테스트용 simple PDF가 없습니다")
            return False
        
        print(f"\n🔧 변환 테스트: {simple_pdf}")
        
        start_time = time.time()
        
        # Converter 생성
        converter = PdfConverter(
            artifact_dict=create_model_dict(),
        )
        
        # 변환 실행
        rendered = converter(str(simple_pdf))
        
        # 텍스트 추출
        text, _, images = text_from_rendered(rendered)
        
        elapsed = time.time() - start_time
        
        print(f"  ✅ 변환 성공! (소요 시간: {elapsed:.2f}초)")
        print(f"  📄 텍스트 길이: {len(text)} 문자")
        print(f"  🖼️  이미지 수: {len(images)}")
        
        # 결과 일부 출력
        print("\n📝 변환 결과 (처음 200자):")
        print("-" * 40)
        print(text[:200] + "..." if len(text) > 200 else text)
        print("-" * 40)
        
        return True
        
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_advanced_features():
    """고급 기능 테스트"""
    print("\n" + "="*60)
    print("📋 고급 기능 테스트")
    print("="*60)
    
    try:
        from marker.converters.pdf import PdfConverter
        from marker.models import create_model_dict
        from marker.config.parser import ConfigParser
        
        test_pdfs = download_test_pdf()
        arxiv_pdf = test_pdfs.get("arxiv")
        
        if not arxiv_pdf:
            print("❌ ArXiv 테스트 PDF가 없습니다")
            return False
        
        # 다양한 설정으로 테스트
        test_configs = [
            {
                "name": "JSON 출력",
                "config": {"output_format": "json"}
            },
            {
                "name": "페이지 범위 지정",
                "config": {"output_format": "markdown", "page_range": "0-2"}
            },
            {
                "name": "수식 포맷팅",
                "config": {"output_format": "markdown", "format_lines": True}
            }
        ]
        
        for test_case in test_configs:
            print(f"\n🔧 {test_case['name']} 테스트")
            
            try:
                config_parser = ConfigParser(test_case['config'])
                
                converter = PdfConverter(
                    config=config_parser.generate_config_dict(),
                    artifact_dict=create_model_dict(),
                    processor_list=config_parser.get_processors(),
                    renderer=config_parser.get_renderer()
                )
                
                start_time = time.time()
                rendered = converter(str(arxiv_pdf))
                elapsed = time.time() - start_time
                
                print(f"  ✅ 성공! (소요 시간: {elapsed:.2f}초)")
                
                # 결과 타입 확인
                if test_case['config'].get('output_format') == 'json':
                    json_data = rendered.model_dump() if hasattr(rendered, 'model_dump') else rendered
                    print(f"  📊 JSON 키: {list(json_data.keys())[:5]}...")
                
            except Exception as e:
                print(f"  ❌ 실패: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ 고급 기능 테스트 실패: {e}")
        return False


def test_cli_commands():
    """CLI 명령어 테스트"""
    print("\n" + "="*60)
    print("📋 CLI 명령어 테스트")
    print("="*60)
    
    import subprocess
    
    commands = [
        ("marker_single --help", "단일 파일 변환 도움말"),
        ("marker --help", "배치 변환 도움말"),
        ("marker_gui --help", "GUI 도움말"),
    ]
    
    for cmd, desc in commands:
        print(f"\n🔧 {desc}: {cmd}")
        try:
            result = subprocess.run(
                cmd.split(), 
                capture_output=True, 
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                print("  ✅ 성공")
            else:
                print(f"  ❌ 실패 (코드: {result.returncode})")
                if result.stderr:
                    print(f"     {result.stderr[:100]}...")
        except subprocess.TimeoutExpired:
            print("  ⏱️  타임아웃")
        except FileNotFoundError:
            print("  ❌ 명령어를 찾을 수 없음")
        except Exception as e:
            print(f"  ❌ 오류: {e}")


def main():
    """메인 테스트 실행"""
    print("🚀 Marker 테스트 시작\n")
    
    # Python 버전 확인
    py_version = sys.version_info
    print(f"Python 버전: {py_version.major}.{py_version.minor}.{py_version.micro}")
    
    if py_version < (3, 10):
        print("⚠️  Python 3.10+ 권장!")
    
    # 테스트 실행
    tests = [
        ("기본 변환", test_basic_conversion),
        ("고급 기능", test_advanced_features),
        ("CLI 명령어", test_cli_commands),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n❌ {test_name} 테스트 중 오류: {e}")
            results[test_name] = False
    
    # 결과 요약
    print("\n" + "="*60)
    print("📊 테스트 결과 요약")
    print("="*60)
    
    for test_name, success in results.items():
        status = "✅ 성공" if success else "❌ 실패"
        print(f"{test_name}: {status}")
    
    # 사용 안내
    print("\n" + "="*60)
    print("💡 Marker 사용 방법")
    print("="*60)
    print("""
1. 가상환경 활성화:
   source ~/marker-env/bin/activate

2. 단일 PDF 변환:
   marker_single input.pdf --output_dir output/

3. 여러 PDF 변환:
   marker input_dir/ --workers 4

4. 병렬 처리 스크립트:
   python /Users/voidlight/tree-doctor-pdf-qa-mcp/scripts/marker-parallel.py \\
     input_dir/ output_dir/ --workers 4 --format markdown

5. LLM으로 정확도 향상:
   marker_single input.pdf --use_llm --gemini_api_key YOUR_KEY

6. 강제 OCR:
   marker_single input.pdf --force_ocr --format_lines
""")


if __name__ == "__main__":
    main()