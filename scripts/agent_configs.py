"""
전문 병렬 에이전트 설정
각 에이전트는 특정 회차의 PDF 변환에 최적화됨
"""

# 에이전트 전문성 정의
AGENT_SPECIALIZATIONS = {
    "Agent-5회": {
        "name": "제5회 기출문제 전문가",
        "description": "제5회 나무의사 자격시험 문제 변환 전문",
        "optimization": {
            "ocr_confidence": 0.8,  # OCR 신뢰도 임계값
            "page_timeout": 60,     # 페이지당 최대 처리 시간(초)
            "memory_limit": "3GB",  # 메모리 제한
        },
        "expertise": [
            "수목병리학 문제 인식",
            "수목생리학 다이어그램 처리",
            "복잡한 표 구조 해석"
        ]
    },
    
    "Agent-6회": {
        "name": "제6회 기출문제 전문가",
        "description": "제6회 나무의사 자격시험 문제 변환 전문",
        "optimization": {
            "ocr_confidence": 0.8,
            "page_timeout": 60,
            "memory_limit": "3GB",
        },
        "expertise": [
            "병해충 이미지 처리",
            "수목관리학 도표 인식",
            "객관식 문제 구조화"
        ]
    },
    
    "Agent-7회": {
        "name": "제7회 기출문제 전문가",
        "description": "제7회 나무의사 자격시험 문제 변환 전문 (대용량)",
        "optimization": {
            "ocr_confidence": 0.75,  # 대용량 파일을 위해 약간 낮춤
            "page_timeout": 90,      # 더 긴 타임아웃
            "memory_limit": "4GB",   # 더 많은 메모리
        },
        "expertise": [
            "대용량 PDF 처리",
            "복잡한 레이아웃 해석",
            "다중 컬럼 텍스트 처리"
        ]
    },
    
    "Agent-8회": {
        "name": "제8회 기출문제 전문가",
        "description": "제8회 나무의사 자격시험 문제 변환 전문",
        "optimization": {
            "ocr_confidence": 0.8,
            "page_timeout": 60,
            "memory_limit": "3GB",
        },
        "expertise": [
            "수목진단 차트 인식",
            "화학식 및 수식 처리",
            "보기 번호 정확도 향상"
        ]
    },
    
    "Agent-9회": {
        "name": "제9회 기출문제 전문가",
        "description": "제9회 나무의사 자격시험 문제 변환 전문",
        "optimization": {
            "ocr_confidence": 0.8,
            "page_timeout": 60,
            "memory_limit": "3GB",
        },
        "expertise": [
            "수목 해부학 그림 처리",
            "라틴어 학명 인식",
            "참고문헌 포맷 보존"
        ]
    },
    
    "Agent-10회": {
        "name": "제10회 기출문제 전문가",
        "description": "제10회 나무의사 자격시험 문제 변환 전문",
        "optimization": {
            "ocr_confidence": 0.8,
            "page_timeout": 60,
            "memory_limit": "3GB",
        },
        "expertise": [
            "최신 출제 경향 반영",
            "고해상도 이미지 처리",
            "문제 해설 구조 보존"
        ]
    }
}

# 병렬 처리 최적화 설정
PARALLEL_CONFIG = {
    "max_workers": 6,
    "chunk_size": 10,  # 페이지 단위 처리
    "retry_attempts": 2,
    "progress_update_interval": 30,  # 초
}

# 품질 검증 기준
QUALITY_CRITERIA = {
    "min_text_length": 1000,  # 최소 텍스트 길이
    "korean_char_ratio": 0.3,  # 한글 문자 비율
    "question_pattern": r'(문제|번\.|제\d+문)',  # 문제 패턴
    "min_questions": 10,  # 최소 문제 수
}