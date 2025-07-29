#!/usr/bin/env python3
"""
변환된 마크다운 파일을 MCP 시스템에 통합
"""

import os
import sys
sys.path.insert(0, '/Users/voidlight/tree-doctor-pdf-qa-mcp')

from pathlib import Path
from src.db_manager import DatabaseManager
from src.qa_engine import QAEngine

def integrate_markdown_files():
    """변환된 마크다운 파일을 데이터베이스에 저장"""
    
    # 초기화
    db_manager = DatabaseManager()
    qa_engine = QAEngine(db_manager)
    
    # 마크다운 파일 디렉토리
    marker_output = Path("/Users/voidlight/tree-doctor-pdf-qa-mcp/data/marker-output")
    
    if not marker_output.exists():
        print("❌ Marker 출력 디렉토리가 없습니다.")
        return
    
    # 성공/실패 카운트
    success_count = 0
    failed_count = 0
    
    print("🔄 마크다운 파일 통합 시작...")
    
    # 각 하위 디렉토리 탐색
    for exam_dir in marker_output.iterdir():
        if not exam_dir.is_dir():
            continue
            
        # 마크다운 파일 찾기
        md_files = list(exam_dir.glob("*.md"))
        
        for md_file in md_files:
            print(f"\n📄 처리 중: {md_file.name}")
            
            try:
                # 마크다운 내용 읽기
                content = md_file.read_text(encoding='utf-8')
                
                # 제목 추출
                title = md_file.stem  # 파일명에서 확장자 제거
                
                # 회차 추출 (예: "제5회" -> 5)
                exam_number = None
                if "제" in title and "회" in title:
                    try:
                        start = title.index("제") + 1
                        end = title.index("회")
                        exam_number = int(title[start:end])
                    except:
                        pass
                
                # 데이터베이스에 저장
                # 전체 내용을 하나의 큰 청크로 저장
                chunk_id = db_manager.add_content(
                    content=content,
                    metadata={
                        'source': str(md_file),
                        'title': title,
                        'exam_number': exam_number,
                        'type': 'full_exam',
                        'format': 'markdown',
                        'converted_by': 'marker'
                    }
                )
                
                print(f"  ✅ 저장 완료 (Chunk ID: {chunk_id})")
                
                # 섹션별로 분할 저장 (문제별 검색 가능)
                sections = split_into_questions(content)
                for idx, section in enumerate(sections, 1):
                    if section.strip():
                        db_manager.add_content(
                            content=section,
                            metadata={
                                'source': str(md_file),
                                'title': f"{title} - 문제 {idx}",
                                'exam_number': exam_number,
                                'question_number': idx,
                                'type': 'question',
                                'format': 'markdown',
                                'converted_by': 'marker'
                            }
                        )
                
                print(f"  ✅ {len(sections)}개 문제 섹션 저장")
                success_count += 1
                
            except Exception as e:
                print(f"  ❌ 실패: {str(e)}")
                failed_count += 1
    
    # 인덱스 재구축
    print("\n🔧 벡터 인덱스 재구축 중...")
    qa_engine.build_index()
    
    # 결과 요약
    print("\n" + "="*50)
    print("📊 통합 완료:")
    print(f"  성공: {success_count}개 파일")
    print(f"  실패: {failed_count}개 파일")
    print(f"  총 저장된 청크: {len(db_manager.get_all_content())}개")
    print("="*50)

def split_into_questions(content):
    """마크다운 내용을 문제별로 분할"""
    sections = []
    current_section = []
    
    lines = content.split('\n')
    
    for line in lines:
        # 문제 번호 패턴 찾기 (예: "1.", "문제 1", "1번" 등)
        if any(pattern in line for pattern in ['문제', '번.', '. ']) and \
           any(str(i) in line for i in range(1, 101)):
            # 이전 섹션 저장
            if current_section:
                sections.append('\n'.join(current_section))
                current_section = []
        
        current_section.append(line)
    
    # 마지막 섹션 저장
    if current_section:
        sections.append('\n'.join(current_section))
    
    return sections

def test_search():
    """검색 기능 테스트"""
    db_manager = DatabaseManager()
    qa_engine = QAEngine(db_manager)
    
    print("\n🔍 검색 테스트")
    test_queries = [
        "나무의사",
        "수목병",
        "진단",
        "버섯",
        "병해충"
    ]
    
    for query in test_queries:
        print(f"\n검색어: '{query}'")
        results = qa_engine.search(query, k=3)
        print(f"  결과: {len(results)}개 찾음")
        
        if results:
            for i, (content, score, metadata) in enumerate(results[:2], 1):
                print(f"\n  [{i}] 점수: {score:.3f}")
                print(f"      출처: {metadata.get('title', 'Unknown')}")
                print(f"      내용: {content[:100]}...")

if __name__ == "__main__":
    # 메인 통합 실행
    integrate_markdown_files()
    
    # 검색 테스트
    test_search()