#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import os

# voidlight_markitdown 경로 추가
sys.path.append('/Users/voidlight/voidlight_markitdown/src')

try:
    from voidlight_markitdown import MarkItDown
    print("✅ voidlight_markitdown 임포트 성공")
    
    # 테스트 PDF
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf"
    
    if os.path.exists(pdf_path):
        print(f"✅ PDF 파일 존재: {pdf_path}")
        
        # MarkItDown 초기화
        markitdown = MarkItDown()
        print("✅ MarkItDown 초기화 완료")
        
        # 변환 시도
        result = markitdown.convert(pdf_path)
        print("✅ 변환 완료")
        
        # 결과 확인
        if hasattr(result, 'text_content'):
            content = result.text_content
            print(f"✅ 텍스트 추출 성공: {len(content)}자")
            
            # 샘플 출력
            print("\n--- 처음 500자 ---")
            print(content[:500])
            print("\n--- 끝 500자 ---")
            print(content[-500:])
            
            # 파일로 저장
            with open("test_output.txt", "w", encoding="utf-8") as f:
                f.write(content)
            print("\n✅ test_output.txt 파일로 저장 완료")
        else:
            print("❌ text_content 속성이 없습니다")
            print(f"   result 타입: {type(result)}")
            print(f"   result 속성: {dir(result)}")
    else:
        print(f"❌ PDF 파일이 존재하지 않습니다: {pdf_path}")
        
except Exception as e:
    print(f"❌ 오류 발생: {e}")
    import traceback
    traceback.print_exc()