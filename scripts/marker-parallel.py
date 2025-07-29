#!/usr/bin/env python3
"""
Marker 병렬 PDF 변환 스크립트
- 여러 PDF를 동시에 처리
- 진행 상황 모니터링
- 에러 핸들링 및 재시도
"""

import os
import sys
import json
import time
import argparse
import multiprocessing as mp
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import traceback

# Marker 경로를 Python 경로에 추가
MARKER_PATH = "/Users/voidlight/MCP-Servers/marker"
sys.path.insert(0, MARKER_PATH)

try:
    from marker.converters.pdf import PdfConverter
    from marker.models import create_model_dict
    from marker.output import text_from_rendered
    from marker.config.parser import ConfigParser
    MARKER_AVAILABLE = True
except ImportError as e:
    MARKER_AVAILABLE = False
    IMPORT_ERROR = str(e)


class MarkerParallelProcessor:
    def __init__(self, 
                 num_workers: int = None,
                 output_format: str = "markdown",
                 use_llm: bool = False,
                 force_ocr: bool = False,
                 format_lines: bool = False):
        """
        병렬 Marker 프로세서 초기화
        
        Args:
            num_workers: 워커 프로세스 수 (None이면 CPU 코어 수 - 1)
            output_format: 출력 형식 (markdown, json, html, chunks)
            use_llm: LLM 사용 여부
            force_ocr: 강제 OCR 사용
            format_lines: 라인 포맷팅 (수식 등)
        """
        self.num_workers = num_workers or max(1, mp.cpu_count() - 1)
        self.output_format = output_format
        self.use_llm = use_llm
        self.force_ocr = force_ocr
        self.format_lines = format_lines
        
        # 통계
        self.stats = {
            'total': 0,
            'success': 0,
            'failed': 0,
            'skipped': 0,
            'start_time': None,
            'end_time': None
        }
    
    def check_environment(self) -> bool:
        """환경 확인"""
        print("🔍 환경 확인 중...")
        
        # Python 버전
        py_version = sys.version_info
        print(f"  Python 버전: {py_version.major}.{py_version.minor}.{py_version.micro}")
        
        if py_version < (3, 10):
            print("  ⚠️  Python 3.10+ 필요!")
            return False
        
        # Marker 가용성
        if not MARKER_AVAILABLE:
            print(f"  ❌ Marker import 실패: {IMPORT_ERROR}")
            return False
        
        print("  ✅ Marker 사용 가능")
        
        # CPU 정보
        cpu_count = mp.cpu_count()
        print(f"  CPU 코어: {cpu_count}")
        print(f"  사용할 워커: {self.num_workers}")
        
        return True
    
    def find_pdfs(self, input_path: Path) -> List[Path]:
        """PDF 파일 찾기"""
        pdfs = []
        
        if input_path.is_file() and input_path.suffix.lower() == '.pdf':
            pdfs.append(input_path)
        elif input_path.is_dir():
            pdfs = list(input_path.glob('**/*.pdf'))
        
        return sorted(pdfs)
    
    def process_single_pdf(self, args: Tuple[Path, Path, Dict]) -> Dict:
        """단일 PDF 처리 (워커 프로세스에서 실행)"""
        pdf_path, output_dir, config = args
        
        result = {
            'pdf': str(pdf_path),
            'status': 'failed',
            'output': None,
            'error': None,
            'processing_time': 0
        }
        
        start_time = time.time()
        
        try:
            # 출력 경로 생성
            relative_path = pdf_path.stem
            output_base = output_dir / relative_path
            
            # 이미 처리된 경우 스킵
            if self.output_format == "markdown":
                output_file = output_base.with_suffix('.md')
            elif self.output_format == "json":
                output_file = output_base.with_suffix('.json')
            elif self.output_format == "html":
                output_file = output_base.with_suffix('.html')
            else:
                output_file = output_base / "chunks.json"
            
            if output_file.exists() and not config.get('overwrite', False):
                result['status'] = 'skipped'
                result['output'] = str(output_file)
                return result
            
            # ConfigParser 설정
            marker_config = {
                "output_format": self.output_format,
                "use_llm": self.use_llm,
                "force_ocr": self.force_ocr,
                "format_lines": self.format_lines,
            }
            
            if config.get('page_range'):
                marker_config['page_range'] = config['page_range']
            
            config_parser = ConfigParser(marker_config)
            
            # Converter 생성
            converter = PdfConverter(
                config=config_parser.generate_config_dict(),
                artifact_dict=create_model_dict(),
                processor_list=config_parser.get_processors(),
                renderer=config_parser.get_renderer(),
                llm_service=config_parser.get_llm_service() if self.use_llm else None
            )
            
            # 변환 실행
            rendered = converter(str(pdf_path))
            
            # 출력 저장
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            if self.output_format == "markdown":
                text, _, images = text_from_rendered(rendered)
                output_file.write_text(text, encoding='utf-8')
                
                # 이미지 저장
                if images:
                    img_dir = output_file.parent / f"{output_file.stem}_images"
                    img_dir.mkdir(exist_ok=True)
                    for img_name, img_data in images.items():
                        img_path = img_dir / img_name
                        with open(img_path, 'wb') as f:
                            f.write(img_data)
            
            elif self.output_format == "json":
                json_data = rendered.model_dump() if hasattr(rendered, 'model_dump') else rendered
                output_file.write_text(json.dumps(json_data, ensure_ascii=False, indent=2), encoding='utf-8')
            
            elif self.output_format == "html":
                text, _, images = text_from_rendered(rendered)
                # 간단한 HTML 래핑
                html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{pdf_path.stem}</title>
</head>
<body>
    {text}
</body>
</html>"""
                output_file.write_text(html_content, encoding='utf-8')
            
            result['status'] = 'success'
            result['output'] = str(output_file)
            
        except Exception as e:
            result['error'] = f"{type(e).__name__}: {str(e)}"
            if config.get('debug', False):
                result['traceback'] = traceback.format_exc()
        
        result['processing_time'] = time.time() - start_time
        return result
    
    def process_pdfs(self, 
                    input_path: str,
                    output_dir: str,
                    page_range: Optional[str] = None,
                    overwrite: bool = False,
                    debug: bool = False) -> Dict:
        """여러 PDF 병렬 처리"""
        
        input_path = Path(input_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # PDF 파일 찾기
        pdfs = self.find_pdfs(input_path)
        if not pdfs:
            print(f"❌ PDF 파일을 찾을 수 없음: {input_path}")
            return self.stats
        
        print(f"\n📚 {len(pdfs)}개 PDF 파일 발견")
        self.stats['total'] = len(pdfs)
        self.stats['start_time'] = datetime.now()
        
        # 처리 인자 준비
        config = {
            'page_range': page_range,
            'overwrite': overwrite,
            'debug': debug
        }
        
        process_args = [(pdf, output_dir, config) for pdf in pdfs]
        
        # 진행 상황 표시를 위한 초기화
        print(f"\n🚀 {self.num_workers}개 워커로 처리 시작...")
        print("-" * 60)
        
        # 병렬 처리
        with mp.Pool(processes=self.num_workers) as pool:
            results = []
            
            # 비동기 처리 시작
            async_results = [
                pool.apply_async(self.process_single_pdf, (args,))
                for args in process_args
            ]
            
            # 결과 수집 및 진행 상황 표시
            for i, async_result in enumerate(async_results):
                try:
                    result = async_result.get(timeout=300)  # 5분 타임아웃
                    results.append(result)
                    
                    # 통계 업데이트
                    if result['status'] == 'success':
                        self.stats['success'] += 1
                        status_icon = "✅"
                    elif result['status'] == 'skipped':
                        self.stats['skipped'] += 1
                        status_icon = "⏭️"
                    else:
                        self.stats['failed'] += 1
                        status_icon = "❌"
                    
                    # 진행 상황 출력
                    progress = (i + 1) / len(pdfs) * 100
                    pdf_name = Path(result['pdf']).name
                    time_str = f"{result['processing_time']:.1f}s" if result['processing_time'] > 0 else "-"
                    
                    print(f"{status_icon} [{i+1}/{len(pdfs)}] {progress:5.1f}% | {pdf_name[:40]:40} | {time_str}")
                    
                    if result['error'] and debug:
                        print(f"   오류: {result['error']}")
                    
                except mp.TimeoutError:
                    self.stats['failed'] += 1
                    print(f"❌ [{i+1}/{len(pdfs)}] 타임아웃: {pdfs[i].name}")
                except Exception as e:
                    self.stats['failed'] += 1
                    print(f"❌ [{i+1}/{len(pdfs)}] 오류: {pdfs[i].name} - {e}")
        
        self.stats['end_time'] = datetime.now()
        
        # 결과 요약
        self.print_summary()
        
        # 실패한 파일 목록 저장
        if self.stats['failed'] > 0:
            failed_files = [r for r in results if r.get('status') == 'failed']
            failed_log = output_dir / "failed_files.json"
            failed_log.write_text(json.dumps(failed_files, ensure_ascii=False, indent=2))
            print(f"\n💾 실패 파일 로그: {failed_log}")
        
        return self.stats
    
    def print_summary(self):
        """처리 요약 출력"""
        print("\n" + "="*60)
        print("📊 처리 요약")
        print("="*60)
        
        duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
        
        print(f"총 파일 수: {self.stats['total']}")
        print(f"✅ 성공: {self.stats['success']}")
        print(f"⏭️  스킵: {self.stats['skipped']}")
        print(f"❌ 실패: {self.stats['failed']}")
        print(f"\n⏱️  전체 시간: {duration:.1f}초")
        
        if self.stats['success'] > 0:
            avg_time = duration / self.stats['success']
            print(f"📈 평균 처리 시간: {avg_time:.1f}초/파일")
        
        print(f"🔧 사용 워커 수: {self.num_workers}")


def main():
    """CLI 인터페이스"""
    parser = argparse.ArgumentParser(
        description="Marker를 사용한 병렬 PDF 변환",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예제:
  # 단일 PDF 변환
  python marker-parallel.py input.pdf output_dir/
  
  # 디렉토리 내 모든 PDF 변환
  python marker-parallel.py input_dir/ output_dir/
  
  # 4개 워커로 JSON 형식 변환
  python marker-parallel.py input_dir/ output_dir/ -w 4 -f json
  
  # LLM 사용 및 OCR 강제
  python marker-parallel.py input_dir/ output_dir/ --use-llm --force-ocr
"""
    )
    
    parser.add_argument('input', help='입력 PDF 파일 또는 디렉토리')
    parser.add_argument('output', help='출력 디렉토리')
    parser.add_argument('-w', '--workers', type=int, help='워커 프로세스 수')
    parser.add_argument('-f', '--format', 
                       choices=['markdown', 'json', 'html', 'chunks'],
                       default='markdown',
                       help='출력 형식 (기본: markdown)')
    parser.add_argument('--use-llm', action='store_true', help='LLM 사용하여 정확도 향상')
    parser.add_argument('--force-ocr', action='store_true', help='모든 페이지에 OCR 강제 적용')
    parser.add_argument('--format-lines', action='store_true', help='라인 포맷팅 (수식 등)')
    parser.add_argument('--page-range', help='페이지 범위 (예: "0,5-10,20")')
    parser.add_argument('--overwrite', action='store_true', help='기존 파일 덮어쓰기')
    parser.add_argument('--debug', action='store_true', help='디버그 모드')
    
    args = parser.parse_args()
    
    # 프로세서 생성
    processor = MarkerParallelProcessor(
        num_workers=args.workers,
        output_format=args.format,
        use_llm=args.use_llm,
        force_ocr=args.force_ocr,
        format_lines=args.format_lines
    )
    
    # 환경 확인
    if not processor.check_environment():
        print("\n❌ 환경 설정이 필요합니다.")
        print("   marker-setup.py를 먼저 실행하세요.")
        sys.exit(1)
    
    # PDF 처리
    try:
        processor.process_pdfs(
            args.input,
            args.output,
            page_range=args.page_range,
            overwrite=args.overwrite,
            debug=args.debug
        )
    except KeyboardInterrupt:
        print("\n\n⚠️  사용자에 의해 중단됨")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        if args.debug:
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    # macOS에서 fork 관련 문제 방지
    if sys.platform == 'darwin':
        mp.set_start_method('spawn', force=True)
    
    main()