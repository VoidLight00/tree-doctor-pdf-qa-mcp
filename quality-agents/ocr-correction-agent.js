#!/usr/bin/env node
/**
 * OCR 오류 수정 에이전트
 * 역할: 문제 텍스트의 OCR 오류를 감지하고 수정
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';

class ocr_correction_agent {
  constructor() {
    this.dbPath = '/Users/voidlight/tree-doctor-pdf-qa-mcp/tree-doctor-pdf-qa.db';
    this.issues = [
  {
    "id": 4,
    "exam_year": 7,
    "question_number": 4,
    "question_text": "광합성 명반응의 최종 전자수용체는?",
    "subject": "수목생리학",
    "choice_count": 4,
    "has_answer": 1
  },
  {
    "id": 5,
    "exam_year": 7,
    "question_number": 5,
    "question_text": "수목의 이식 적기가 아닌 것은것은?",
    "subject": "수목관리학",
    "choice_count": 4,
    "has_answer": 1
  },
  {
    "id": 6,
    "exam_year": 8,
    "question_number": 1,
    "question_text": "소나무재선충병의 매개충은것은?",
    "subject": "수목병리학",
    "choice_count": 4,
    "has_answer": 1
  },
  {
    "id": 7,
    "exam_year": 8,
    "question_number": 2,
    "question_text": "완전변태를 하는 곤충은것은?",
    "subject": "수목해충학",
    "choice_count": 4,
    "has_answer": 1
  },
  {
    "id": 8,
    "exam_year": 8,
    "question_number": 3,
    "question_text": "C4 식물의 특징이 아닌 것은것은?",
    "subject": "수목생리학",
    "choice_count": 4,
    "has_answer": 1
  },
  {
    "id": 10,
    "exam_year": 8,
    "question_number": 5,
    "question_text": "천연갱신 방법이 아닌 것은것은?",
    "subject": "임업일반",
    "choice_count": 4,
    "has_answer": 1
  },
  {
    "id": 16,
    "exam_year": 10,
    "question_number": 1,
    "question_text": "진균병의 표징이 아닌 것은것은?",
    "subject": "수목병리학",
    "choice_count": 4,
    "has_answer": 1
  },
  {
    "id": 18,
    "exam_year": 10,
    "question_number": 3,
    "question_text": "수분퍼텐셜이 가장 낮은 곳은것은?",
    "subject": "수목생리학",
    "choice_count": 4,
    "has_answer": 1
  },
  {
    "id": 22,
    "exam_year": 11,
    "question_number": 2,
    "question_text": "월동 형태가 다른 해충은것은?",
    "subject": "수목해충학",
    "choice_count": 4,
    "has_answer": 1
  },
  {
    "id": 23,
    "exam_year": 11,
    "question_number": 3,
    "question_text": "기공 개폐에 관여하는 이온은것은?",
    "subject": "수목생리학",
    "choice_count": 4,
    "has_answer": 1
  },
  {
    "id": 48,
    "exam_year": 9,
    "question_number": 28,
    "question_text": "꼴벌에 대한 독성이 높음] |",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 50,
    "exam_year": 9,
    "question_number": 30,
    "question_text": "꼴벌에 대한 독성이 높음] |",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 55,
    "exam_year": 9,
    "question_number": 35,
    "question_text": "세계 3대 SSS 중 하나이다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 56,
    "exam_year": 9,
    "question_number": 36,
    "question_text": "세계 3대 SSS 중 하나이다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 63,
    "exam_year": 9,
    "question_number": 43,
    "question_text": "대벌레 - 연모[1096ᄒ )",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 66,
    "exam_year": 9,
    "question_number": 46,
    "question_text": "입자밀도가 높아진다,",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 69,
    "exam_year": 9,
    "question_number": 49,
    "question_text": "소나무좀 - 유인목트랩",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 77,
    "exam_year": 9,
    "question_number": 57,
    "question_text": "솔나방 - 기생성 천적을 보호",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 78,
    "exam_year": 9,
    "question_number": 58,
    "question_text": "잎의 7 |장자리 가 타들어간다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 79,
    "exam_year": 9,
    "question_number": 59,
    "question_text": "잎의 7 |장자리 가 타들어간다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 83,
    "exam_year": 10,
    "question_number": 9,
    "question_text": "표징을 관찰할 수 없는 것은 ?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 108,
    "exam_year": 10,
    "question_number": 34,
    "question_text": "곤중의 특징에 관한 설명으로 옮",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 119,
    "exam_year": 10,
    "question_number": 45,
    "question_text": "천공성 해 천공성 해",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 123,
    "exam_year": 10,
    "question_number": 49,
    "question_text": "해충별 과명, 가해 부위 및 연 빌",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 137,
    "exam_year": 10,
    "question_number": 63,
    "question_text": "곤충의 적응과 휴면[",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 159,
    "exam_year": 10,
    "question_number": 85,
    "question_text": "토양의 수분 침투 (",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 177,
    "exam_year": 10,
    "question_number": 103,
    "question_text": "제시된 식물 생육 반",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 230,
    "exam_year": 8,
    "question_number": 0,
    "question_text": "0), 51-",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 246,
    "exam_year": 8,
    "question_number": 6,
    "question_text": "6)에 유인된다. (",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 405,
    "exam_year": 8,
    "question_number": 8,
    "question_text": "8), 36 -",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 715,
    "exam_year": 11,
    "question_number": 8,
    "question_text": "병든 가지를 접수로 사용하였을 때",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 717,
    "exam_year": 11,
    "question_number": 10,
    "question_text": "식물병원체 중 세포벽을 가지고 있는",
    "subject": "수목병리학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 718,
    "exam_year": 11,
    "question_number": 11,
    "question_text": "다음 수목병 진단 결과에서 ( )",
    "subject": "수목관리학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 720,
    "exam_year": 11,
    "question_number": 13,
    "question_text": "다음 특징을 나타내는 뿌리병은것은?",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 721,
    "exam_year": 11,
    "question_number": 14,
    "question_text": "목재부후에 관한 설명으로 옳지 않은",
    "subject": "미분류",
    "choice_count": 4,
    "has_answer": 0
  },
  {
    "id": 722,
    "exam_year": 11,
    "question_number": 16,
    "question_text": "수목병의 방제법에 관한 설명으로",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 723,
    "exam_year": 11,
    "question_number": 17,
    "question_text": "수목병원체가 기주에 침입하는 방법에",
    "subject": "수목병리학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 724,
    "exam_year": 11,
    "question_number": 18,
    "question_text": "다음 특징을 지닌 병원체가 일으키는",
    "subject": "수목병리학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 726,
    "exam_year": 11,
    "question_number": 20,
    "question_text": "보기에서 같은 종류의 자낭과를",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 727,
    "exam_year": 11,
    "question_number": 21,
    "question_text": "적절한 풀베기로 병 발생 또는 피해",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 728,
    "exam_year": 11,
    "question_number": 22,
    "question_text": "뿌리혹선충에 관한",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 730,
    "exam_year": 11,
    "question_number": 24,
    "question_text": "소나무류 병명과 병원체 속",
    "subject": "수목병리학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 731,
    "exam_year": 11,
    "question_number": 25,
    "question_text": "삼나무 아랫가지의 잎이 회백색으로",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 732,
    "exam_year": 11,
    "question_number": 26,
    "question_text": "곤충 목",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 733,
    "exam_year": 11,
    "question_number": 27,
    "question_text": "곤충의 형태에 관한 설명으로 옳은",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 734,
    "exam_year": 11,
    "question_number": 28,
    "question_text": "곤충의 외표피에 관한 설명으로 옳지",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 735,
    "exam_year": 11,
    "question_number": 29,
    "question_text": "곤충의 날개에 관한 설명으로 옳은",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 736,
    "exam_year": 11,
    "question_number": 30,
    "question_text": "곤충 소화기관에 관한 설명으로 옳지",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 737,
    "exam_year": 11,
    "question_number": 31,
    "question_text": "곤충의 배설과정에 관한 설명으로",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 738,
    "exam_year": 11,
    "question_number": 32,
    "question_text": "곤충의 신경계에 관한 설명으로 옳은",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 739,
    "exam_year": 11,
    "question_number": 33,
    "question_text": "곤충의 감각기관에 관한 설명으로",
    "subject": "수목해충학",
    "choice_count": 4,
    "has_answer": 0
  },
  {
    "id": 740,
    "exam_year": 11,
    "question_number": 34,
    "question_text": "곤충의 호르몬에 관한 설명으로 옳지",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 741,
    "exam_year": 11,
    "question_number": 35,
    "question_text": "수목해충의 산란행동에 관한 설명으로",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 742,
    "exam_year": 11,
    "question_number": 36,
    "question_text": "곤충의 방어행동 관련 용어에 대한",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 743,
    "exam_year": 11,
    "question_number": 37,
    "question_text": "수목해충의 월동생태에 관한 설명으로",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 744,
    "exam_year": 11,
    "question_number": 38,
    "question_text": "감로와 분비물로 인해 발생되는",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 745,
    "exam_year": 11,
    "question_number": 41,
    "question_text": "농촌진흥청",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 746,
    "exam_year": 11,
    "question_number": 42,
    "question_text": "해충발생밀도 조사방법과 대상해충의",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 747,
    "exam_year": 11,
    "question_number": 43,
    "question_text": "수목해충의 친환경 방제 방법에 관한",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 748,
    "exam_year": 11,
    "question_number": 44,
    "question_text": "진딧물류 중 기주전환을 하지 않는",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 749,
    "exam_year": 11,
    "question_number": 45,
    "question_text": "천적의 기주 및 방사시기에 관한",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 752,
    "exam_year": 11,
    "question_number": 48,
    "question_text": "수목해충별 가해부위연간 발생횟수",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 754,
    "exam_year": 11,
    "question_number": 50,
    "question_text": "보기의 수목해충 중에서 광식성만을",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 756,
    "exam_year": 11,
    "question_number": 55,
    "question_text": "버드나무류의 꽃에 해당하는 것만을",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 757,
    "exam_year": 11,
    "question_number": 57,
    "question_text": "성숙한 체세포",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 758,
    "exam_year": 11,
    "question_number": 58,
    "question_text": "지름이 큰 도관이 춘재에 환상으로",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 760,
    "exam_year": 11,
    "question_number": 60,
    "question_text": "다음 중에서 수액상승 속도가 빠른",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 762,
    "exam_year": 11,
    "question_number": 64,
    "question_text": "광호흡에 관한 설명으로 옳지 않은",
    "subject": "수목생리학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 764,
    "exam_year": 11,
    "question_number": 67,
    "question_text": "안에 들어갈 용어로 적합한",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 765,
    "exam_year": 11,
    "question_number": 68,
    "question_text": "수목의 증산에 관한 설명으로 옳지",
    "subject": "수목생리학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 768,
    "exam_year": 11,
    "question_number": 73,
    "question_text": "수목의 균근에 관한설명으로 옳은",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 769,
    "exam_year": 11,
    "question_number": 74,
    "question_text": "안에 들어갈 용어로 알맞은 것은",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 770,
    "exam_year": 11,
    "question_number": 78,
    "question_text": "인",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 772,
    "exam_year": 11,
    "question_number": 80,
    "question_text": "도시공원 내 산성토양 개량용 석회",
    "subject": "토양학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 773,
    "exam_year": 11,
    "question_number": 81,
    "question_text": "토양의 점토광물에 관한",
    "subject": "토양학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 774,
    "exam_year": 11,
    "question_number": 82,
    "question_text": "토양용액에 존재하는 다음 이온 중",
    "subject": "토양학",
    "choice_count": 4,
    "has_answer": 0
  },
  {
    "id": 775,
    "exam_year": 11,
    "question_number": 84,
    "question_text": "토양미생물에 관한",
    "subject": "토양학",
    "choice_count": 4,
    "has_answer": 0
  },
  {
    "id": 777,
    "exam_year": 11,
    "question_number": 87,
    "question_text": "매립지의 알칼리성 토양을 개량하는",
    "subject": "토양학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 778,
    "exam_year": 11,
    "question_number": 88,
    "question_text": "수목 시비에 관한설명으로 옳은 것은",
    "subject": "수목관리학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 779,
    "exam_year": 11,
    "question_number": 89,
    "question_text": "다음 설명에 해당하는 필수원소가",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 780,
    "exam_year": 11,
    "question_number": 90,
    "question_text": "안에 들어갈 알맞은 용어는",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 781,
    "exam_year": 11,
    "question_number": 91,
    "question_text": "산불 피해지의 용적밀도가 미피해지에",
    "subject": "토양학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 782,
    "exam_year": 11,
    "question_number": 92,
    "question_text": "보기에서 토양 내",
    "subject": "토양학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 783,
    "exam_year": 11,
    "question_number": 93,
    "question_text": "탈질작용에 관여하는 미생물",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 784,
    "exam_year": 11,
    "question_number": 94,
    "question_text": "토양오염의 특징에 관한",
    "subject": "토양학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 785,
    "exam_year": 11,
    "question_number": 96,
    "question_text": "토양수분에 관한설명으로 옳지 않은",
    "subject": "토양학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 786,
    "exam_year": 11,
    "question_number": 97,
    "question_text": "음이온의 형태로 식물체에 흡수되는",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 787,
    "exam_year": 11,
    "question_number": 99,
    "question_text": "토성을 판별하기 위해 모래",
    "subject": "토양학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 788,
    "exam_year": 11,
    "question_number": 101,
    "question_text": "식재지 환경과 그에 적합한 수종의",
    "subject": "수목관리학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 790,
    "exam_year": 11,
    "question_number": 103,
    "question_text": "매립지 식재에 관한 설명으로 옳지",
    "subject": "수목관리학",
    "choice_count": 4,
    "has_answer": 0
  },
  {
    "id": 792,
    "exam_year": 11,
    "question_number": 105,
    "question_text": "안에 들어갈",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 793,
    "exam_year": 11,
    "question_number": 106,
    "question_text": "물리적 충격에 의해 손상된 수피의",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 794,
    "exam_year": 11,
    "question_number": 108,
    "question_text": "수목의 동해에 관한설명으로 옳은",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 796,
    "exam_year": 11,
    "question_number": 110,
    "question_text": "수목의 볕뎀볕데기",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 800,
    "exam_year": 11,
    "question_number": 115,
    "question_text": "나비목 유충의 중장에 작용하여",
    "subject": "수목해충학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 801,
    "exam_year": 11,
    "question_number": 116,
    "question_text": "아세타미프리드에 관한 설명으로 옳지",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 802,
    "exam_year": 11,
    "question_number": 117,
    "question_text": "포유동물과 해충 간 선택성이 높은",
    "subject": "수목해충학",
    "choice_count": 4,
    "has_answer": 0
  },
  {
    "id": 803,
    "exam_year": 11,
    "question_number": 118,
    "question_text": "아미노산 생합성 억제작용기작을 갖는",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 805,
    "exam_year": 11,
    "question_number": 120,
    "question_text": "약제 저항성 발달을 억제하기 위한",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 806,
    "exam_year": 11,
    "question_number": 121,
    "question_text": "버즘나무방패벌레를",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 807,
    "exam_year": 11,
    "question_number": 122,
    "question_text": "농약 안전사용기준을 설정하는 데",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 808,
    "exam_year": 11,
    "question_number": 124,
    "question_text": "년도 산림병해충 예찰ㆍ방제계획",
    "subject": "수목병리학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 809,
    "exam_year": 11,
    "question_number": 125,
    "question_text": "산림보호법 시행령",
    "subject": "임업일반",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 811,
    "exam_year": 5,
    "question_number": 2,
    "question_text": "문제 2 문제:",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 812,
    "exam_year": 5,
    "question_number": 3,
    "question_text": "문제 3 문제:",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 813,
    "exam_year": 5,
    "question_number": 4,
    "question_text": "문제 4 문제:",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 815,
    "exam_year": 5,
    "question_number": 6,
    "question_text": "수 목 관 리 학",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 816,
    "exam_year": 5,
    "question_number": 7,
    "question_text": "그림문자 마스크 고무장갑 보안경 등",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 817,
    "exam_year": 5,
    "question_number": 8,
    "question_text": "해독응급처치",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 819,
    "exam_year": 5,
    "question_number": 10,
    "question_text": "농약성분",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 820,
    "exam_year": 5,
    "question_number": 11,
    "question_text": "농약 안전사용기준",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 821,
    "exam_year": 5,
    "question_number": 12,
    "question_text": "취급제한기준  문제 4 문제:",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 822,
    "exam_year": 5,
    "question_number": 13,
    "question_text": "약효보증기간  문제 5 문제:",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 824,
    "exam_year": 5,
    "question_number": 15,
    "question_text": "[문제 15 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 825,
    "exam_year": 5,
    "question_number": 16,
    "question_text": ", ,",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 826,
    "exam_year": 5,
    "question_number": 17,
    "question_text": "( , , )",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 827,
    "exam_year": 5,
    "question_number": 18,
    "question_text": "[문제 18 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 828,
    "exam_year": 5,
    "question_number": 19,
    "question_text": "[문제 19 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 829,
    "exam_year": 5,
    "question_number": 20,
    "question_text": "[문제 20 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 830,
    "exam_year": 5,
    "question_number": 21,
    "question_text": "[문제 21 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 831,
    "exam_year": 5,
    "question_number": 22,
    "question_text": "[문제 22 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 832,
    "exam_year": 5,
    "question_number": 23,
    "question_text": "[문제 23 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 833,
    "exam_year": 5,
    "question_number": 24,
    "question_text": "[문제 24 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 834,
    "exam_year": 5,
    "question_number": 25,
    "question_text": "[문제 25 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 835,
    "exam_year": 5,
    "question_number": 26,
    "question_text": "[문제 26 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 836,
    "exam_year": 5,
    "question_number": 27,
    "question_text": "[문제 27 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 837,
    "exam_year": 5,
    "question_number": 28,
    "question_text": "[문제 28 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 838,
    "exam_year": 5,
    "question_number": 29,
    "question_text": "[문제 29 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 839,
    "exam_year": 5,
    "question_number": 30,
    "question_text": "[문제 30 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 840,
    "exam_year": 5,
    "question_number": 31,
    "question_text": "[문제 31 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 841,
    "exam_year": 5,
    "question_number": 32,
    "question_text": "[문제 32 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 842,
    "exam_year": 5,
    "question_number": 33,
    "question_text": "[문제 33 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 843,
    "exam_year": 5,
    "question_number": 34,
    "question_text": "[문제 34 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 844,
    "exam_year": 5,
    "question_number": 35,
    "question_text": "[문제 35 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 845,
    "exam_year": 5,
    "question_number": 36,
    "question_text": "[문제 36 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 846,
    "exam_year": 5,
    "question_number": 37,
    "question_text": "[문제 37 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 847,
    "exam_year": 5,
    "question_number": 38,
    "question_text": "[문제 38 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 848,
    "exam_year": 5,
    "question_number": 39,
    "question_text": "[문제 39 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 849,
    "exam_year": 5,
    "question_number": 40,
    "question_text": "[문제 40 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 850,
    "exam_year": 5,
    "question_number": 41,
    "question_text": "[문제 41 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 851,
    "exam_year": 5,
    "question_number": 42,
    "question_text": "[문제 42 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 852,
    "exam_year": 5,
    "question_number": 43,
    "question_text": "[문제 43 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 853,
    "exam_year": 5,
    "question_number": 44,
    "question_text": "[문제 44 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 854,
    "exam_year": 5,
    "question_number": 45,
    "question_text": "[문제 45 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 855,
    "exam_year": 5,
    "question_number": 46,
    "question_text": "[문제 46 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 856,
    "exam_year": 5,
    "question_number": 47,
    "question_text": "[문제 47 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 857,
    "exam_year": 5,
    "question_number": 48,
    "question_text": "[문제 48 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 858,
    "exam_year": 5,
    "question_number": 49,
    "question_text": "[문제 49 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 859,
    "exam_year": 5,
    "question_number": 50,
    "question_text": "[문제 50 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 860,
    "exam_year": 5,
    "question_number": 51,
    "question_text": "[문제 51 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 861,
    "exam_year": 5,
    "question_number": 52,
    "question_text": "[문제 52 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 862,
    "exam_year": 5,
    "question_number": 53,
    "question_text": "[문제 53 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 863,
    "exam_year": 5,
    "question_number": 54,
    "question_text": "[문제 54 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 864,
    "exam_year": 5,
    "question_number": 55,
    "question_text": "[문제 55 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 865,
    "exam_year": 5,
    "question_number": 56,
    "question_text": "[문제 56 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 866,
    "exam_year": 5,
    "question_number": 57,
    "question_text": "[문제 57 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 867,
    "exam_year": 5,
    "question_number": 58,
    "question_text": "[문제 58 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 868,
    "exam_year": 5,
    "question_number": 59,
    "question_text": "[문제 59 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 869,
    "exam_year": 5,
    "question_number": 60,
    "question_text": "[문제 60 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 870,
    "exam_year": 5,
    "question_number": 61,
    "question_text": "[문제 61 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 871,
    "exam_year": 5,
    "question_number": 62,
    "question_text": "[문제 62 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 872,
    "exam_year": 5,
    "question_number": 63,
    "question_text": "[문제 63 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 873,
    "exam_year": 5,
    "question_number": 64,
    "question_text": "[문제 64 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 874,
    "exam_year": 5,
    "question_number": 65,
    "question_text": "[문제 65 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 875,
    "exam_year": 5,
    "question_number": 66,
    "question_text": "[문제 66 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 876,
    "exam_year": 5,
    "question_number": 67,
    "question_text": "[문제 67 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 877,
    "exam_year": 5,
    "question_number": 68,
    "question_text": "[문제 68 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 878,
    "exam_year": 5,
    "question_number": 69,
    "question_text": "[문제 69 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 879,
    "exam_year": 5,
    "question_number": 70,
    "question_text": "[문제 70 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 880,
    "exam_year": 5,
    "question_number": 71,
    "question_text": "[문제 71 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 881,
    "exam_year": 5,
    "question_number": 72,
    "question_text": "[문제 72 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 882,
    "exam_year": 5,
    "question_number": 73,
    "question_text": "[문제 73 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 883,
    "exam_year": 5,
    "question_number": 74,
    "question_text": "[문제 74 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 884,
    "exam_year": 5,
    "question_number": 75,
    "question_text": "[문제 75 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 885,
    "exam_year": 5,
    "question_number": 76,
    "question_text": "[문제 76 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 886,
    "exam_year": 5,
    "question_number": 77,
    "question_text": "[문제 77 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 887,
    "exam_year": 5,
    "question_number": 78,
    "question_text": "[문제 78 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 888,
    "exam_year": 5,
    "question_number": 79,
    "question_text": "[문제 79 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 889,
    "exam_year": 5,
    "question_number": 80,
    "question_text": "[문제 80 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 890,
    "exam_year": 5,
    "question_number": 81,
    "question_text": "[문제 81 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 891,
    "exam_year": 5,
    "question_number": 82,
    "question_text": "[문제 82 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 892,
    "exam_year": 5,
    "question_number": 83,
    "question_text": "[문제 83 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 893,
    "exam_year": 5,
    "question_number": 84,
    "question_text": "[문제 84 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 894,
    "exam_year": 5,
    "question_number": 85,
    "question_text": "[문제 85 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 895,
    "exam_year": 5,
    "question_number": 86,
    "question_text": "[문제 86 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 896,
    "exam_year": 5,
    "question_number": 87,
    "question_text": "[문제 87 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 897,
    "exam_year": 5,
    "question_number": 88,
    "question_text": "[문제 88 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 898,
    "exam_year": 5,
    "question_number": 89,
    "question_text": "[문제 89 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 899,
    "exam_year": 5,
    "question_number": 90,
    "question_text": "[문제 90 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 900,
    "exam_year": 5,
    "question_number": 91,
    "question_text": "[문제 91 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 901,
    "exam_year": 5,
    "question_number": 92,
    "question_text": "[문제 92 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 902,
    "exam_year": 5,
    "question_number": 93,
    "question_text": "[문제 93 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 903,
    "exam_year": 5,
    "question_number": 94,
    "question_text": "[문제 94 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 904,
    "exam_year": 5,
    "question_number": 95,
    "question_text": "[문제 95 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 905,
    "exam_year": 5,
    "question_number": 96,
    "question_text": "[문제 96 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 906,
    "exam_year": 5,
    "question_number": 97,
    "question_text": "[문제 97 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 907,
    "exam_year": 5,
    "question_number": 98,
    "question_text": "[문제 98 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 908,
    "exam_year": 5,
    "question_number": 99,
    "question_text": "[문제 99 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 909,
    "exam_year": 5,
    "question_number": 100,
    "question_text": "[문제 100 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 910,
    "exam_year": 5,
    "question_number": 101,
    "question_text": "[문제 101 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 911,
    "exam_year": 5,
    "question_number": 102,
    "question_text": "[문제 102 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 912,
    "exam_year": 5,
    "question_number": 103,
    "question_text": "[문제 103 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 913,
    "exam_year": 5,
    "question_number": 104,
    "question_text": "[문제 104 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 914,
    "exam_year": 5,
    "question_number": 105,
    "question_text": "[문제 105 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 915,
    "exam_year": 5,
    "question_number": 106,
    "question_text": "[문제 106 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 916,
    "exam_year": 5,
    "question_number": 107,
    "question_text": "[문제 107 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 917,
    "exam_year": 5,
    "question_number": 108,
    "question_text": "[문제 108 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 918,
    "exam_year": 5,
    "question_number": 109,
    "question_text": "[문제 109 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 919,
    "exam_year": 5,
    "question_number": 110,
    "question_text": "[문제 110 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 920,
    "exam_year": 5,
    "question_number": 111,
    "question_text": "[문제 111 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 921,
    "exam_year": 5,
    "question_number": 112,
    "question_text": "[문제 112 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 922,
    "exam_year": 5,
    "question_number": 113,
    "question_text": "[문제 113 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 923,
    "exam_year": 5,
    "question_number": 114,
    "question_text": "[문제 114 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 924,
    "exam_year": 5,
    "question_number": 115,
    "question_text": "[문제 115 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 925,
    "exam_year": 5,
    "question_number": 116,
    "question_text": "[문제 116 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 926,
    "exam_year": 5,
    "question_number": 117,
    "question_text": "[문제 117 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 927,
    "exam_year": 5,
    "question_number": 118,
    "question_text": "[문제 118 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 928,
    "exam_year": 5,
    "question_number": 119,
    "question_text": "[문제 119 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 929,
    "exam_year": 5,
    "question_number": 120,
    "question_text": "[문제 120 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 930,
    "exam_year": 5,
    "question_number": 121,
    "question_text": "[문제 121 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 931,
    "exam_year": 5,
    "question_number": 122,
    "question_text": "[문제 122 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 932,
    "exam_year": 5,
    "question_number": 123,
    "question_text": "[문제 123 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 933,
    "exam_year": 5,
    "question_number": 124,
    "question_text": "[문제 124 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 934,
    "exam_year": 5,
    "question_number": 125,
    "question_text": "[문제 125 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 935,
    "exam_year": 5,
    "question_number": 126,
    "question_text": "[문제 126 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 936,
    "exam_year": 5,
    "question_number": 127,
    "question_text": "[문제 127 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 937,
    "exam_year": 5,
    "question_number": 128,
    "question_text": "[문제 128 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 938,
    "exam_year": 5,
    "question_number": 129,
    "question_text": "[문제 129 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 939,
    "exam_year": 5,
    "question_number": 130,
    "question_text": "[문제 130 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 940,
    "exam_year": 5,
    "question_number": 131,
    "question_text": "[문제 131 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 941,
    "exam_year": 5,
    "question_number": 132,
    "question_text": "[문제 132 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 942,
    "exam_year": 5,
    "question_number": 133,
    "question_text": "[문제 133 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 943,
    "exam_year": 5,
    "question_number": 134,
    "question_text": "[문제 134 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 944,
    "exam_year": 5,
    "question_number": 135,
    "question_text": "[문제 135 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 945,
    "exam_year": 5,
    "question_number": 136,
    "question_text": "[문제 136 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 946,
    "exam_year": 5,
    "question_number": 137,
    "question_text": "[문제 137 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 947,
    "exam_year": 5,
    "question_number": 138,
    "question_text": "[문제 138 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 948,
    "exam_year": 5,
    "question_number": 139,
    "question_text": "[문제 139 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 949,
    "exam_year": 5,
    "question_number": 140,
    "question_text": "[문제 140 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 950,
    "exam_year": 5,
    "question_number": 141,
    "question_text": "[문제 141 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 951,
    "exam_year": 5,
    "question_number": 142,
    "question_text": "[문제 142 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 952,
    "exam_year": 5,
    "question_number": 143,
    "question_text": "[문제 143 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 953,
    "exam_year": 5,
    "question_number": 144,
    "question_text": "[문제 144 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 954,
    "exam_year": 5,
    "question_number": 145,
    "question_text": "[문제 145 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 955,
    "exam_year": 5,
    "question_number": 146,
    "question_text": "[문제 146 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 956,
    "exam_year": 5,
    "question_number": 147,
    "question_text": "[문제 147 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 957,
    "exam_year": 5,
    "question_number": 148,
    "question_text": "[문제 148 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 958,
    "exam_year": 5,
    "question_number": 149,
    "question_text": "[문제 149 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 959,
    "exam_year": 5,
    "question_number": 150,
    "question_text": "[문제 150 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 960,
    "exam_year": 6,
    "question_number": 1,
    "question_text": "8% 에마멕틴 벤조에이트 유제 2)",
    "subject": "수목병리학",
    "choice_count": 1,
    "has_answer": 0
  },
  {
    "id": 962,
    "exam_year": 6,
    "question_number": 3,
    "question_text": "농약 안전사용기준",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 965,
    "exam_year": 6,
    "question_number": 6,
    "question_text": "치묘 치수 어린나무 * : (= )",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 966,
    "exam_year": 6,
    "question_number": 7,
    "question_text": "그림문자 마스크 고무장갑 보안경 등",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 967,
    "exam_year": 6,
    "question_number": 8,
    "question_text": "해독응급처치",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 968,
    "exam_year": 6,
    "question_number": 9,
    "question_text": "해독응급처치",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 969,
    "exam_year": 6,
    "question_number": 10,
    "question_text": "농약성분",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 970,
    "exam_year": 6,
    "question_number": 11,
    "question_text": "농약 안전사용기준",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 974,
    "exam_year": 6,
    "question_number": 15,
    "question_text": "[문제 15 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 975,
    "exam_year": 6,
    "question_number": 16,
    "question_text": ", ,",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 976,
    "exam_year": 6,
    "question_number": 17,
    "question_text": "( , , )",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 977,
    "exam_year": 6,
    "question_number": 18,
    "question_text": "[문제 18 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 978,
    "exam_year": 6,
    "question_number": 19,
    "question_text": "[문제 19 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 979,
    "exam_year": 6,
    "question_number": 20,
    "question_text": "[문제 20 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 980,
    "exam_year": 6,
    "question_number": 21,
    "question_text": "[문제 21 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 981,
    "exam_year": 6,
    "question_number": 22,
    "question_text": "[문제 22 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 982,
    "exam_year": 6,
    "question_number": 23,
    "question_text": "[문제 23 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 983,
    "exam_year": 6,
    "question_number": 24,
    "question_text": "[문제 24 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 984,
    "exam_year": 6,
    "question_number": 25,
    "question_text": "[문제 25 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 985,
    "exam_year": 6,
    "question_number": 26,
    "question_text": "[문제 26 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 986,
    "exam_year": 6,
    "question_number": 27,
    "question_text": "[문제 27 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 987,
    "exam_year": 6,
    "question_number": 28,
    "question_text": "[문제 28 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 988,
    "exam_year": 6,
    "question_number": 29,
    "question_text": "[문제 29 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 989,
    "exam_year": 6,
    "question_number": 30,
    "question_text": "[문제 30 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 990,
    "exam_year": 6,
    "question_number": 31,
    "question_text": "[문제 31 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 991,
    "exam_year": 6,
    "question_number": 32,
    "question_text": "[문제 32 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 992,
    "exam_year": 6,
    "question_number": 33,
    "question_text": "[문제 33 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 993,
    "exam_year": 6,
    "question_number": 34,
    "question_text": "[문제 34 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 994,
    "exam_year": 6,
    "question_number": 35,
    "question_text": "[문제 35 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 995,
    "exam_year": 6,
    "question_number": 36,
    "question_text": "[문제 36 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 996,
    "exam_year": 6,
    "question_number": 37,
    "question_text": "[문제 37 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 997,
    "exam_year": 6,
    "question_number": 38,
    "question_text": "[문제 38 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 998,
    "exam_year": 6,
    "question_number": 39,
    "question_text": "[문제 39 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 999,
    "exam_year": 6,
    "question_number": 40,
    "question_text": "[문제 40 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1000,
    "exam_year": 6,
    "question_number": 41,
    "question_text": "[문제 41 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1001,
    "exam_year": 6,
    "question_number": 42,
    "question_text": "[문제 42 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1002,
    "exam_year": 6,
    "question_number": 43,
    "question_text": "[문제 43 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1003,
    "exam_year": 6,
    "question_number": 44,
    "question_text": "[문제 44 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1004,
    "exam_year": 6,
    "question_number": 45,
    "question_text": "[문제 45 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1005,
    "exam_year": 6,
    "question_number": 46,
    "question_text": "[문제 46 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1006,
    "exam_year": 6,
    "question_number": 47,
    "question_text": "[문제 47 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1007,
    "exam_year": 6,
    "question_number": 48,
    "question_text": "[문제 48 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1008,
    "exam_year": 6,
    "question_number": 49,
    "question_text": "[문제 49 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1009,
    "exam_year": 6,
    "question_number": 50,
    "question_text": "[문제 50 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1010,
    "exam_year": 6,
    "question_number": 51,
    "question_text": "[문제 51 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1011,
    "exam_year": 6,
    "question_number": 52,
    "question_text": "[문제 52 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1012,
    "exam_year": 6,
    "question_number": 53,
    "question_text": "[문제 53 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1013,
    "exam_year": 6,
    "question_number": 54,
    "question_text": "[문제 54 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1014,
    "exam_year": 6,
    "question_number": 55,
    "question_text": "[문제 55 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1015,
    "exam_year": 6,
    "question_number": 56,
    "question_text": "[문제 56 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1016,
    "exam_year": 6,
    "question_number": 57,
    "question_text": "[문제 57 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1017,
    "exam_year": 6,
    "question_number": 58,
    "question_text": "[문제 58 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1018,
    "exam_year": 6,
    "question_number": 59,
    "question_text": "[문제 59 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1019,
    "exam_year": 6,
    "question_number": 60,
    "question_text": "[문제 60 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1020,
    "exam_year": 6,
    "question_number": 61,
    "question_text": "[문제 61 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1021,
    "exam_year": 6,
    "question_number": 62,
    "question_text": "[문제 62 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1022,
    "exam_year": 6,
    "question_number": 63,
    "question_text": "[문제 63 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1023,
    "exam_year": 6,
    "question_number": 64,
    "question_text": "[문제 64 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1024,
    "exam_year": 6,
    "question_number": 65,
    "question_text": "[문제 65 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1025,
    "exam_year": 6,
    "question_number": 66,
    "question_text": "[문제 66 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1026,
    "exam_year": 6,
    "question_number": 67,
    "question_text": "[문제 67 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1027,
    "exam_year": 6,
    "question_number": 68,
    "question_text": "[문제 68 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1028,
    "exam_year": 6,
    "question_number": 69,
    "question_text": "[문제 69 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1029,
    "exam_year": 6,
    "question_number": 70,
    "question_text": "[문제 70 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1030,
    "exam_year": 6,
    "question_number": 71,
    "question_text": "[문제 71 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1031,
    "exam_year": 6,
    "question_number": 72,
    "question_text": "[문제 72 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1032,
    "exam_year": 6,
    "question_number": 73,
    "question_text": "[문제 73 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1033,
    "exam_year": 6,
    "question_number": 74,
    "question_text": "[문제 74 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1034,
    "exam_year": 6,
    "question_number": 75,
    "question_text": "[문제 75 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1035,
    "exam_year": 6,
    "question_number": 76,
    "question_text": "[문제 76 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1036,
    "exam_year": 6,
    "question_number": 77,
    "question_text": "[문제 77 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1037,
    "exam_year": 6,
    "question_number": 78,
    "question_text": "[문제 78 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1038,
    "exam_year": 6,
    "question_number": 79,
    "question_text": "[문제 79 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1039,
    "exam_year": 6,
    "question_number": 80,
    "question_text": "[문제 80 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1040,
    "exam_year": 6,
    "question_number": 81,
    "question_text": "[문제 81 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1041,
    "exam_year": 6,
    "question_number": 82,
    "question_text": "[문제 82 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1042,
    "exam_year": 6,
    "question_number": 83,
    "question_text": "[문제 83 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1043,
    "exam_year": 6,
    "question_number": 84,
    "question_text": "[문제 84 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1044,
    "exam_year": 6,
    "question_number": 85,
    "question_text": "[문제 85 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1045,
    "exam_year": 6,
    "question_number": 86,
    "question_text": "[문제 86 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1046,
    "exam_year": 6,
    "question_number": 87,
    "question_text": "[문제 87 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1047,
    "exam_year": 6,
    "question_number": 88,
    "question_text": "[문제 88 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1048,
    "exam_year": 6,
    "question_number": 89,
    "question_text": "[문제 89 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1049,
    "exam_year": 6,
    "question_number": 90,
    "question_text": "[문제 90 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1050,
    "exam_year": 6,
    "question_number": 91,
    "question_text": "[문제 91 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1051,
    "exam_year": 6,
    "question_number": 92,
    "question_text": "[문제 92 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1052,
    "exam_year": 6,
    "question_number": 93,
    "question_text": "[문제 93 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1053,
    "exam_year": 6,
    "question_number": 94,
    "question_text": "[문제 94 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1054,
    "exam_year": 6,
    "question_number": 95,
    "question_text": "[문제 95 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1055,
    "exam_year": 6,
    "question_number": 96,
    "question_text": "[문제 96 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1056,
    "exam_year": 6,
    "question_number": 97,
    "question_text": "[문제 97 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1057,
    "exam_year": 6,
    "question_number": 98,
    "question_text": "[문제 98 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1058,
    "exam_year": 6,
    "question_number": 99,
    "question_text": "[문제 99 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1059,
    "exam_year": 6,
    "question_number": 100,
    "question_text": "[문제 100 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1060,
    "exam_year": 6,
    "question_number": 101,
    "question_text": "[문제 101 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1061,
    "exam_year": 6,
    "question_number": 102,
    "question_text": "[문제 102 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1062,
    "exam_year": 6,
    "question_number": 103,
    "question_text": "[문제 103 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1063,
    "exam_year": 6,
    "question_number": 104,
    "question_text": "[문제 104 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1064,
    "exam_year": 6,
    "question_number": 105,
    "question_text": "[문제 105 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1065,
    "exam_year": 6,
    "question_number": 106,
    "question_text": "[문제 106 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1066,
    "exam_year": 6,
    "question_number": 107,
    "question_text": "[문제 107 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1067,
    "exam_year": 6,
    "question_number": 108,
    "question_text": "[문제 108 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1068,
    "exam_year": 6,
    "question_number": 109,
    "question_text": "[문제 109 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1069,
    "exam_year": 6,
    "question_number": 110,
    "question_text": "[문제 110 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1070,
    "exam_year": 6,
    "question_number": 111,
    "question_text": "[문제 111 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1071,
    "exam_year": 6,
    "question_number": 112,
    "question_text": "[문제 112 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1072,
    "exam_year": 6,
    "question_number": 113,
    "question_text": "[문제 113 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1073,
    "exam_year": 6,
    "question_number": 114,
    "question_text": "[문제 114 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1074,
    "exam_year": 6,
    "question_number": 115,
    "question_text": "[문제 115 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1075,
    "exam_year": 6,
    "question_number": 116,
    "question_text": "[문제 116 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1076,
    "exam_year": 6,
    "question_number": 117,
    "question_text": "[문제 117 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1077,
    "exam_year": 6,
    "question_number": 118,
    "question_text": "[문제 118 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1078,
    "exam_year": 6,
    "question_number": 119,
    "question_text": "[문제 119 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1079,
    "exam_year": 6,
    "question_number": 120,
    "question_text": "[문제 120 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1080,
    "exam_year": 6,
    "question_number": 121,
    "question_text": "[문제 121 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1081,
    "exam_year": 6,
    "question_number": 122,
    "question_text": "[문제 122 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1082,
    "exam_year": 6,
    "question_number": 123,
    "question_text": "[문제 123 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1083,
    "exam_year": 6,
    "question_number": 124,
    "question_text": "[문제 124 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1084,
    "exam_year": 6,
    "question_number": 125,
    "question_text": "[문제 125 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1085,
    "exam_year": 6,
    "question_number": 126,
    "question_text": "[문제 126 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1086,
    "exam_year": 6,
    "question_number": 127,
    "question_text": "[문제 127 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1087,
    "exam_year": 6,
    "question_number": 128,
    "question_text": "[문제 128 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1088,
    "exam_year": 6,
    "question_number": 129,
    "question_text": "[문제 129 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1089,
    "exam_year": 6,
    "question_number": 130,
    "question_text": "[문제 130 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1090,
    "exam_year": 6,
    "question_number": 131,
    "question_text": "[문제 131 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1091,
    "exam_year": 6,
    "question_number": 132,
    "question_text": "[문제 132 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1092,
    "exam_year": 6,
    "question_number": 133,
    "question_text": "[문제 133 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1093,
    "exam_year": 6,
    "question_number": 134,
    "question_text": "[문제 134 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1094,
    "exam_year": 6,
    "question_number": 135,
    "question_text": "[문제 135 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1095,
    "exam_year": 6,
    "question_number": 136,
    "question_text": "[문제 136 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1096,
    "exam_year": 6,
    "question_number": 137,
    "question_text": "[문제 137 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1097,
    "exam_year": 6,
    "question_number": 138,
    "question_text": "[문제 138 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1098,
    "exam_year": 6,
    "question_number": 139,
    "question_text": "[문제 139 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1099,
    "exam_year": 6,
    "question_number": 140,
    "question_text": "[문제 140 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1100,
    "exam_year": 6,
    "question_number": 141,
    "question_text": "[문제 141 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1101,
    "exam_year": 6,
    "question_number": 142,
    "question_text": "[문제 142 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1102,
    "exam_year": 6,
    "question_number": 143,
    "question_text": "[문제 143 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1103,
    "exam_year": 6,
    "question_number": 144,
    "question_text": "[문제 144 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1104,
    "exam_year": 6,
    "question_number": 145,
    "question_text": "[문제 145 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1105,
    "exam_year": 6,
    "question_number": 146,
    "question_text": "[문제 146 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1106,
    "exam_year": 6,
    "question_number": 147,
    "question_text": "[문제 147 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1107,
    "exam_year": 6,
    "question_number": 148,
    "question_text": "[문제 148 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1108,
    "exam_year": 6,
    "question_number": 149,
    "question_text": "[문제 149 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1109,
    "exam_year": 6,
    "question_number": 150,
    "question_text": "[문제 150 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1114,
    "exam_year": 7,
    "question_number": 10,
    "question_text": "[문제 10 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1115,
    "exam_year": 7,
    "question_number": 11,
    "question_text": "[문제 11 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1116,
    "exam_year": 7,
    "question_number": 12,
    "question_text": "[문제 12 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1117,
    "exam_year": 7,
    "question_number": 13,
    "question_text": "[문제 13 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1118,
    "exam_year": 7,
    "question_number": 14,
    "question_text": "[문제 14 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1119,
    "exam_year": 7,
    "question_number": 15,
    "question_text": "[문제 15 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1120,
    "exam_year": 7,
    "question_number": 16,
    "question_text": "[문제 16 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1121,
    "exam_year": 7,
    "question_number": 17,
    "question_text": "[문제 17 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1122,
    "exam_year": 7,
    "question_number": 18,
    "question_text": "[문제 18 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1123,
    "exam_year": 7,
    "question_number": 19,
    "question_text": "[문제 19 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1124,
    "exam_year": 7,
    "question_number": 20,
    "question_text": "[문제 20 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1125,
    "exam_year": 7,
    "question_number": 21,
    "question_text": "[문제 21 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1126,
    "exam_year": 7,
    "question_number": 22,
    "question_text": "[문제 22 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1127,
    "exam_year": 7,
    "question_number": 23,
    "question_text": "[문제 23 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1128,
    "exam_year": 7,
    "question_number": 24,
    "question_text": "[문제 24 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1129,
    "exam_year": 7,
    "question_number": 25,
    "question_text": "[문제 25 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1130,
    "exam_year": 7,
    "question_number": 26,
    "question_text": "[문제 26 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1131,
    "exam_year": 7,
    "question_number": 27,
    "question_text": "[문제 27 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1132,
    "exam_year": 7,
    "question_number": 28,
    "question_text": "[문제 28 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1133,
    "exam_year": 7,
    "question_number": 29,
    "question_text": "[문제 29 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1134,
    "exam_year": 7,
    "question_number": 30,
    "question_text": "[문제 30 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1135,
    "exam_year": 7,
    "question_number": 31,
    "question_text": "[문제 31 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1136,
    "exam_year": 7,
    "question_number": 32,
    "question_text": "[문제 32 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1137,
    "exam_year": 7,
    "question_number": 33,
    "question_text": "[문제 33 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1138,
    "exam_year": 7,
    "question_number": 34,
    "question_text": "[문제 34 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1139,
    "exam_year": 7,
    "question_number": 35,
    "question_text": "[문제 35 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1140,
    "exam_year": 7,
    "question_number": 36,
    "question_text": "[문제 36 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1141,
    "exam_year": 7,
    "question_number": 37,
    "question_text": "[문제 37 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1142,
    "exam_year": 7,
    "question_number": 38,
    "question_text": "[문제 38 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1143,
    "exam_year": 7,
    "question_number": 39,
    "question_text": "[문제 39 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1145,
    "exam_year": 7,
    "question_number": 41,
    "question_text": "[문제 41 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1146,
    "exam_year": 7,
    "question_number": 42,
    "question_text": "[문제 42 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1147,
    "exam_year": 7,
    "question_number": 43,
    "question_text": "[문제 43 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1148,
    "exam_year": 7,
    "question_number": 44,
    "question_text": "[문제 44 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1149,
    "exam_year": 7,
    "question_number": 45,
    "question_text": "[문제 45 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1150,
    "exam_year": 7,
    "question_number": 46,
    "question_text": "[문제 46 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1151,
    "exam_year": 7,
    "question_number": 47,
    "question_text": "[문제 47 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1152,
    "exam_year": 7,
    "question_number": 48,
    "question_text": "[문제 48 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1153,
    "exam_year": 7,
    "question_number": 49,
    "question_text": "[문제 49 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1154,
    "exam_year": 7,
    "question_number": 50,
    "question_text": "[문제 50 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1155,
    "exam_year": 7,
    "question_number": 51,
    "question_text": "[문제 51 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1156,
    "exam_year": 7,
    "question_number": 52,
    "question_text": "[문제 52 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1157,
    "exam_year": 7,
    "question_number": 53,
    "question_text": "[문제 53 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1158,
    "exam_year": 7,
    "question_number": 54,
    "question_text": "[문제 54 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1159,
    "exam_year": 7,
    "question_number": 55,
    "question_text": "[문제 55 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1160,
    "exam_year": 7,
    "question_number": 56,
    "question_text": "[문제 56 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1161,
    "exam_year": 7,
    "question_number": 57,
    "question_text": "[문제 57 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1162,
    "exam_year": 7,
    "question_number": 58,
    "question_text": "[문제 58 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1163,
    "exam_year": 7,
    "question_number": 59,
    "question_text": "[문제 59 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1164,
    "exam_year": 7,
    "question_number": 60,
    "question_text": "[문제 60 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1165,
    "exam_year": 7,
    "question_number": 61,
    "question_text": "[문제 61 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1166,
    "exam_year": 7,
    "question_number": 62,
    "question_text": "[문제 62 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1167,
    "exam_year": 7,
    "question_number": 63,
    "question_text": "[문제 63 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1168,
    "exam_year": 7,
    "question_number": 64,
    "question_text": "[문제 64 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1169,
    "exam_year": 7,
    "question_number": 65,
    "question_text": "[문제 65 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1170,
    "exam_year": 7,
    "question_number": 66,
    "question_text": "[문제 66 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1171,
    "exam_year": 7,
    "question_number": 67,
    "question_text": "[문제 67 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1172,
    "exam_year": 7,
    "question_number": 68,
    "question_text": "[문제 68 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1173,
    "exam_year": 7,
    "question_number": 69,
    "question_text": "[문제 69 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1174,
    "exam_year": 7,
    "question_number": 70,
    "question_text": "[문제 70 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1175,
    "exam_year": 7,
    "question_number": 71,
    "question_text": "[문제 71 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1176,
    "exam_year": 7,
    "question_number": 72,
    "question_text": "[문제 72 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1177,
    "exam_year": 7,
    "question_number": 73,
    "question_text": "[문제 73 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1178,
    "exam_year": 7,
    "question_number": 74,
    "question_text": "[문제 74 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1179,
    "exam_year": 7,
    "question_number": 75,
    "question_text": "[문제 75 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1180,
    "exam_year": 7,
    "question_number": 76,
    "question_text": "[문제 76 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1181,
    "exam_year": 7,
    "question_number": 77,
    "question_text": "..",
    "subject": "수목생리학",
    "choice_count": 5,
    "has_answer": 1
  },
  {
    "id": 1182,
    "exam_year": 7,
    "question_number": 78,
    "question_text": "[문제 78 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1183,
    "exam_year": 7,
    "question_number": 79,
    "question_text": "[문제 79 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1184,
    "exam_year": 7,
    "question_number": 80,
    "question_text": "[문제 80 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1185,
    "exam_year": 7,
    "question_number": 81,
    "question_text": "[문제 81 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1186,
    "exam_year": 7,
    "question_number": 82,
    "question_text": "[문제 82 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1187,
    "exam_year": 7,
    "question_number": 83,
    "question_text": "[문제 83 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1188,
    "exam_year": 7,
    "question_number": 84,
    "question_text": "[문제 84 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1189,
    "exam_year": 7,
    "question_number": 85,
    "question_text": "[문제 85 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1190,
    "exam_year": 7,
    "question_number": 86,
    "question_text": "[문제 86 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1191,
    "exam_year": 7,
    "question_number": 87,
    "question_text": "[문제 87 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1192,
    "exam_year": 7,
    "question_number": 88,
    "question_text": "[문제 88 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1193,
    "exam_year": 7,
    "question_number": 89,
    "question_text": "[문제 89 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1194,
    "exam_year": 7,
    "question_number": 90,
    "question_text": "[문제 90 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1195,
    "exam_year": 7,
    "question_number": 91,
    "question_text": "[문제 91 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1196,
    "exam_year": 7,
    "question_number": 92,
    "question_text": "[문제 92 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1197,
    "exam_year": 7,
    "question_number": 93,
    "question_text": "[문제 93 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1198,
    "exam_year": 7,
    "question_number": 94,
    "question_text": "[문제 94 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1199,
    "exam_year": 7,
    "question_number": 95,
    "question_text": "[문제 95 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1200,
    "exam_year": 7,
    "question_number": 96,
    "question_text": "[문제 96 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1201,
    "exam_year": 7,
    "question_number": 97,
    "question_text": "[문제 97 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1202,
    "exam_year": 7,
    "question_number": 98,
    "question_text": "[문제 98 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1203,
    "exam_year": 7,
    "question_number": 99,
    "question_text": "[문제 99 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1204,
    "exam_year": 7,
    "question_number": 100,
    "question_text": "[문제 100 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1205,
    "exam_year": 7,
    "question_number": 101,
    "question_text": "[문제 101 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1206,
    "exam_year": 7,
    "question_number": 102,
    "question_text": "[문제 102 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1207,
    "exam_year": 7,
    "question_number": 103,
    "question_text": "[문제 103 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1208,
    "exam_year": 7,
    "question_number": 104,
    "question_text": "[문제 104 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1209,
    "exam_year": 7,
    "question_number": 105,
    "question_text": "[문제 105 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1210,
    "exam_year": 7,
    "question_number": 106,
    "question_text": "[문제 106 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1211,
    "exam_year": 7,
    "question_number": 107,
    "question_text": "[문제 107 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1212,
    "exam_year": 7,
    "question_number": 108,
    "question_text": "[문제 108 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1213,
    "exam_year": 7,
    "question_number": 109,
    "question_text": "[문제 109 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1214,
    "exam_year": 7,
    "question_number": 110,
    "question_text": "[문제 110 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1215,
    "exam_year": 7,
    "question_number": 111,
    "question_text": "[문제 111 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1216,
    "exam_year": 7,
    "question_number": 112,
    "question_text": "[문제 112 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1217,
    "exam_year": 7,
    "question_number": 113,
    "question_text": "[문제 113 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1218,
    "exam_year": 7,
    "question_number": 114,
    "question_text": "[문제 114 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1219,
    "exam_year": 7,
    "question_number": 115,
    "question_text": "[문제 115 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1220,
    "exam_year": 7,
    "question_number": 116,
    "question_text": "[문제 116 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1221,
    "exam_year": 7,
    "question_number": 117,
    "question_text": "[문제 117 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1222,
    "exam_year": 7,
    "question_number": 118,
    "question_text": "[문제 118 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1223,
    "exam_year": 7,
    "question_number": 119,
    "question_text": "[문제 119 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1224,
    "exam_year": 7,
    "question_number": 120,
    "question_text": "[문제 120 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1225,
    "exam_year": 7,
    "question_number": 121,
    "question_text": "[문제 121 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1226,
    "exam_year": 7,
    "question_number": 122,
    "question_text": "[문제 122 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1227,
    "exam_year": 7,
    "question_number": 123,
    "question_text": "[문제 123 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1228,
    "exam_year": 7,
    "question_number": 124,
    "question_text": "[문제 124 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1229,
    "exam_year": 7,
    "question_number": 125,
    "question_text": "[문제 125 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1230,
    "exam_year": 7,
    "question_number": 126,
    "question_text": "[문제 126 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1231,
    "exam_year": 7,
    "question_number": 127,
    "question_text": "[문제 127 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1232,
    "exam_year": 7,
    "question_number": 128,
    "question_text": "[문제 128 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1233,
    "exam_year": 7,
    "question_number": 129,
    "question_text": "[문제 129 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1234,
    "exam_year": 7,
    "question_number": 130,
    "question_text": "[문제 130 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1235,
    "exam_year": 7,
    "question_number": 131,
    "question_text": "[문제 131 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1236,
    "exam_year": 7,
    "question_number": 132,
    "question_text": "[문제 132 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1237,
    "exam_year": 7,
    "question_number": 133,
    "question_text": "[문제 133 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1238,
    "exam_year": 7,
    "question_number": 134,
    "question_text": "[문제 134 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1239,
    "exam_year": 7,
    "question_number": 135,
    "question_text": "[문제 135 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1240,
    "exam_year": 7,
    "question_number": 136,
    "question_text": "[문제 136 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1241,
    "exam_year": 7,
    "question_number": 137,
    "question_text": "[문제 137 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1242,
    "exam_year": 7,
    "question_number": 138,
    "question_text": "[문제 138 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1243,
    "exam_year": 7,
    "question_number": 139,
    "question_text": "[문제 139 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1244,
    "exam_year": 7,
    "question_number": 140,
    "question_text": "[문제 140 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1245,
    "exam_year": 7,
    "question_number": 141,
    "question_text": "[문제 141 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1246,
    "exam_year": 7,
    "question_number": 142,
    "question_text": "[문제 142 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1247,
    "exam_year": 7,
    "question_number": 143,
    "question_text": "[문제 143 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1248,
    "exam_year": 7,
    "question_number": 144,
    "question_text": "[문제 144 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1249,
    "exam_year": 7,
    "question_number": 145,
    "question_text": "[문제 145 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1250,
    "exam_year": 7,
    "question_number": 146,
    "question_text": "[문제 146 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1251,
    "exam_year": 7,
    "question_number": 147,
    "question_text": "[문제 147 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1252,
    "exam_year": 7,
    "question_number": 148,
    "question_text": "[문제 148 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1253,
    "exam_year": 7,
    "question_number": 149,
    "question_text": "[문제 149 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1254,
    "exam_year": 7,
    "question_number": 150,
    "question_text": "[문제 150 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1258,
    "exam_year": 8,
    "question_number": 13,
    "question_text": "[문제 13 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1264,
    "exam_year": 8,
    "question_number": 19,
    "question_text": "5 결과, 공극 50%에서",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1265,
    "exam_year": 8,
    "question_number": 20,
    "question_text": "[문제 20 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1274,
    "exam_year": 8,
    "question_number": 29,
    "question_text": "[문제 29 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1275,
    "exam_year": 8,
    "question_number": 30,
    "question_text": "[문제 30 데이터 누락]",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1276,
    "exam_year": 8,
    "question_number": 31,
    "question_text": "[문제 31 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1277,
    "exam_year": 8,
    "question_number": 32,
    "question_text": "[문제 32 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1278,
    "exam_year": 8,
    "question_number": 33,
    "question_text": "[문제 33 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1279,
    "exam_year": 8,
    "question_number": 34,
    "question_text": "[문제 34 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1280,
    "exam_year": 8,
    "question_number": 35,
    "question_text": "[문제 35 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1281,
    "exam_year": 8,
    "question_number": 36,
    "question_text": "[문제 36 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1282,
    "exam_year": 8,
    "question_number": 37,
    "question_text": "[문제 37 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1283,
    "exam_year": 8,
    "question_number": 38,
    "question_text": "[문제 38 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1284,
    "exam_year": 8,
    "question_number": 39,
    "question_text": "[문제 39 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1289,
    "exam_year": 8,
    "question_number": 44,
    "question_text": "[문제 44 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1290,
    "exam_year": 8,
    "question_number": 45,
    "question_text": "[문제 45 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1291,
    "exam_year": 8,
    "question_number": 46,
    "question_text": "[문제 46 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1292,
    "exam_year": 8,
    "question_number": 47,
    "question_text": "[문제 47 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1293,
    "exam_year": 8,
    "question_number": 48,
    "question_text": "[문제 48 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1294,
    "exam_year": 8,
    "question_number": 49,
    "question_text": "[문제 49 데이터 누락]",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1324,
    "exam_year": 8,
    "question_number": 79,
    "question_text": "[문제 79 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1334,
    "exam_year": 8,
    "question_number": 89,
    "question_text": "[문제 89 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1338,
    "exam_year": 8,
    "question_number": 93,
    "question_text": "[문제 93 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1340,
    "exam_year": 8,
    "question_number": 95,
    "question_text": "[문제 95 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1341,
    "exam_year": 8,
    "question_number": 96,
    "question_text": "[문제 96 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1354,
    "exam_year": 8,
    "question_number": 109,
    "question_text": "[문제 109 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1355,
    "exam_year": 8,
    "question_number": 110,
    "question_text": "[문제 110 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1358,
    "exam_year": 8,
    "question_number": 113,
    "question_text": "[문제 113 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1364,
    "exam_year": 8,
    "question_number": 119,
    "question_text": "[문제 119 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1371,
    "exam_year": 8,
    "question_number": 126,
    "question_text": "[문제 126 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1372,
    "exam_year": 8,
    "question_number": 127,
    "question_text": "[문제 127 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1373,
    "exam_year": 8,
    "question_number": 128,
    "question_text": "[문제 128 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1374,
    "exam_year": 8,
    "question_number": 129,
    "question_text": "[문제 129 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1375,
    "exam_year": 8,
    "question_number": 130,
    "question_text": "[문제 130 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1376,
    "exam_year": 8,
    "question_number": 131,
    "question_text": "[문제 131 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1377,
    "exam_year": 8,
    "question_number": 132,
    "question_text": "[문제 132 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1378,
    "exam_year": 8,
    "question_number": 133,
    "question_text": "[문제 133 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1379,
    "exam_year": 8,
    "question_number": 134,
    "question_text": "[문제 134 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1380,
    "exam_year": 8,
    "question_number": 135,
    "question_text": "[문제 135 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1381,
    "exam_year": 8,
    "question_number": 136,
    "question_text": "[문제 136 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1382,
    "exam_year": 8,
    "question_number": 137,
    "question_text": "[문제 137 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1383,
    "exam_year": 8,
    "question_number": 138,
    "question_text": "[문제 138 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1384,
    "exam_year": 8,
    "question_number": 139,
    "question_text": "[문제 139 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1385,
    "exam_year": 8,
    "question_number": 140,
    "question_text": "[문제 140 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1386,
    "exam_year": 8,
    "question_number": 141,
    "question_text": "[문제 141 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1387,
    "exam_year": 8,
    "question_number": 142,
    "question_text": "[문제 142 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1388,
    "exam_year": 8,
    "question_number": 143,
    "question_text": "[문제 143 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1389,
    "exam_year": 8,
    "question_number": 144,
    "question_text": "[문제 144 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1390,
    "exam_year": 8,
    "question_number": 145,
    "question_text": "[문제 145 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1391,
    "exam_year": 8,
    "question_number": 146,
    "question_text": "[문제 146 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1392,
    "exam_year": 8,
    "question_number": 147,
    "question_text": "[문제 147 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1393,
    "exam_year": 8,
    "question_number": 148,
    "question_text": "[문제 148 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1394,
    "exam_year": 8,
    "question_number": 149,
    "question_text": "[문제 149 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1395,
    "exam_year": 8,
    "question_number": 150,
    "question_text": "[문제 150 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1396,
    "exam_year": 9,
    "question_number": 60,
    "question_text": "6",
    "subject": "수목해충학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1411,
    "exam_year": 9,
    "question_number": 76,
    "question_text": "[문제 76 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1412,
    "exam_year": 9,
    "question_number": 77,
    "question_text": "[문제 77 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1415,
    "exam_year": 9,
    "question_number": 80,
    "question_text": "%%20 (",
    "subject": "수목생리학",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 1424,
    "exam_year": 9,
    "question_number": 89,
    "question_text": "[문제 89 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1425,
    "exam_year": 9,
    "question_number": 90,
    "question_text": "[문제 90 데이터 누락]",
    "subject": "수목생리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1431,
    "exam_year": 9,
    "question_number": 96,
    "question_text": "[문제 96 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1434,
    "exam_year": 9,
    "question_number": 99,
    "question_text": "[문제 99 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1448,
    "exam_year": 9,
    "question_number": 113,
    "question_text": "[문제 113 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1449,
    "exam_year": 9,
    "question_number": 114,
    "question_text": "[문제 114 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1450,
    "exam_year": 9,
    "question_number": 115,
    "question_text": "[문제 115 데이터 누락]",
    "subject": "산림토양학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1461,
    "exam_year": 9,
    "question_number": 126,
    "question_text": "[문제 126 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1462,
    "exam_year": 9,
    "question_number": 127,
    "question_text": "[문제 127 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1463,
    "exam_year": 9,
    "question_number": 128,
    "question_text": "[문제 128 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1464,
    "exam_year": 9,
    "question_number": 129,
    "question_text": "[문제 129 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1465,
    "exam_year": 9,
    "question_number": 130,
    "question_text": "[문제 130 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1466,
    "exam_year": 9,
    "question_number": 131,
    "question_text": "[문제 131 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1467,
    "exam_year": 9,
    "question_number": 132,
    "question_text": "[문제 132 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1468,
    "exam_year": 9,
    "question_number": 133,
    "question_text": "[문제 133 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1469,
    "exam_year": 9,
    "question_number": 134,
    "question_text": "[문제 134 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1470,
    "exam_year": 9,
    "question_number": 135,
    "question_text": "[문제 135 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1471,
    "exam_year": 9,
    "question_number": 136,
    "question_text": "[문제 136 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1472,
    "exam_year": 9,
    "question_number": 137,
    "question_text": "[문제 137 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1473,
    "exam_year": 9,
    "question_number": 138,
    "question_text": "[문제 138 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1474,
    "exam_year": 9,
    "question_number": 139,
    "question_text": "[문제 139 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1475,
    "exam_year": 9,
    "question_number": 140,
    "question_text": "[문제 140 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1476,
    "exam_year": 9,
    "question_number": 141,
    "question_text": "[문제 141 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1477,
    "exam_year": 9,
    "question_number": 142,
    "question_text": "[문제 142 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1478,
    "exam_year": 9,
    "question_number": 143,
    "question_text": "[문제 143 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1479,
    "exam_year": 9,
    "question_number": 144,
    "question_text": "[문제 144 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1480,
    "exam_year": 9,
    "question_number": 145,
    "question_text": "[문제 145 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1481,
    "exam_year": 9,
    "question_number": 146,
    "question_text": "[문제 146 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1482,
    "exam_year": 9,
    "question_number": 147,
    "question_text": "[문제 147 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1483,
    "exam_year": 9,
    "question_number": 148,
    "question_text": "[문제 148 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1484,
    "exam_year": 9,
    "question_number": 149,
    "question_text": "[문제 149 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1485,
    "exam_year": 9,
    "question_number": 150,
    "question_text": "[문제 150 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1494,
    "exam_year": 11,
    "question_number": 56,
    "question_text": "6℃에서 30분 이상 열처리한",
    "subject": "수목해충학",
    "choice_count": 2,
    "has_answer": 0
  },
  {
    "id": 1508,
    "exam_year": 11,
    "question_number": 107,
    "question_text": "가지 기부에서 선단부까지의 길이가",
    "subject": "산림토양학",
    "choice_count": 1,
    "has_answer": 0
  },
  {
    "id": 1511,
    "exam_year": 11,
    "question_number": 126,
    "question_text": "[문제 126 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1512,
    "exam_year": 11,
    "question_number": 127,
    "question_text": "[문제 127 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1513,
    "exam_year": 11,
    "question_number": 128,
    "question_text": "[문제 128 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1514,
    "exam_year": 11,
    "question_number": 129,
    "question_text": "[문제 129 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1515,
    "exam_year": 11,
    "question_number": 130,
    "question_text": "[문제 130 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1516,
    "exam_year": 11,
    "question_number": 131,
    "question_text": "[문제 131 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1517,
    "exam_year": 11,
    "question_number": 132,
    "question_text": "[문제 132 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1518,
    "exam_year": 11,
    "question_number": 133,
    "question_text": "[문제 133 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1519,
    "exam_year": 11,
    "question_number": 134,
    "question_text": "[문제 134 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1520,
    "exam_year": 11,
    "question_number": 135,
    "question_text": "[문제 135 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1521,
    "exam_year": 11,
    "question_number": 136,
    "question_text": "[문제 136 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1522,
    "exam_year": 11,
    "question_number": 137,
    "question_text": "[문제 137 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1523,
    "exam_year": 11,
    "question_number": 138,
    "question_text": "[문제 138 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1524,
    "exam_year": 11,
    "question_number": 139,
    "question_text": "[문제 139 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1525,
    "exam_year": 11,
    "question_number": 140,
    "question_text": "[문제 140 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1526,
    "exam_year": 11,
    "question_number": 141,
    "question_text": "[문제 141 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1527,
    "exam_year": 11,
    "question_number": 142,
    "question_text": "[문제 142 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1528,
    "exam_year": 11,
    "question_number": 143,
    "question_text": "[문제 143 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1529,
    "exam_year": 11,
    "question_number": 144,
    "question_text": "[문제 144 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1530,
    "exam_year": 11,
    "question_number": 145,
    "question_text": "[문제 145 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1531,
    "exam_year": 11,
    "question_number": 146,
    "question_text": "[문제 146 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1532,
    "exam_year": 11,
    "question_number": 147,
    "question_text": "[문제 147 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1533,
    "exam_year": 11,
    "question_number": 148,
    "question_text": "[문제 148 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1534,
    "exam_year": 11,
    "question_number": 149,
    "question_text": "[문제 149 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 1535,
    "exam_year": 11,
    "question_number": 150,
    "question_text": "[문제 150 데이터 누락]",
    "subject": "정책 및 법규",
    "choice_count": 0,
    "has_answer": 0
  }
];
    this.results = [];
  }

  async run() {
    console.log('🤖 OCR 오류 수정 에이전트 시작');
    console.log('처리할 문제: ' + this.issues.length + '개\n');
    
    const db = new sqlite3.Database(this.dbPath);
    
    for (const issue of this.issues) {
      const improvement = await this.processIssue(issue);
      if (improvement) {
        this.results.push(improvement);
        await this.applyImprovement(db, improvement);
      }
    }
    
    db.close();
    
    // 결과 저장
    await fs.writeFile(
      '/Users/voidlight/tree-doctor-pdf-qa-mcp/quality-agents/ocr-correction-agent-results.json',
      JSON.stringify({
        agentId: 'ocr-correction-agent',
        processed: this.issues.length,
        improved: this.results.length,
        improvements: this.results
      }, null, 2)
    );
    
    console.log('✅ OCR 오류 수정 에이전트 완료: ' + this.results.length + '개 개선');
  }

  async processIssue(issue) {
    
    // OCR 오류 수정 로직
    const corrections = {
      'AES': '것은', 'GALLS': '혹', 'HAMAS': 'DNA를',
      'SSes': '에서', 'Bay': '염색', 'BIOS S': '피어스병',
      '®': '②', '뮤효': '유효', '몬도': '온도'
    };
    
    let correctedText = issue.question_text;
    let changesMade = false;
    
    for (const [wrong, correct] of Object.entries(corrections)) {
      if (correctedText.includes(wrong)) {
        correctedText = correctedText.replace(new RegExp(wrong, 'g'), correct);
        changesMade = true;
      }
    }
    
    // 잘린 텍스트 패턴 감지
    if (correctedText.endsWith('으?') || correctedText.endsWith('은?')) {
      correctedText = correctedText.slice(0, -1) + '것은?';
      changesMade = true;
    }
    
    if (changesMade) {
      return {
        questionId: issue.id,
        originalText: issue.question_text,
        correctedText: correctedText,
        corrections: Object.keys(corrections).filter(k => issue.question_text.includes(k))
      };
    }
    
    return null;
      
  }

  async applyImprovement(db, improvement) {
    return new Promise((resolve) => {
      
      if (improvement.correctedText) {
        db.run(
          'UPDATE exam_questions SET question_text = ? WHERE id = ?',
          [improvement.correctedText, improvement.questionId]
        );
      }
      
      resolve();
    });
  }
}

// 실행
const agent = new ocr_correction_agent();
agent.run().catch(console.error);
