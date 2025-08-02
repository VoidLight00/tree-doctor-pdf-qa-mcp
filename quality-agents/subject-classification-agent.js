#!/usr/bin/env node
/**
 * 과목 분류 정확도 개선 에이전트
 * 역할: 과목 분류를 재검토하고 정확도 향상
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';

class subject_classification_agent {
  constructor() {
    this.dbPath = '/Users/voidlight/tree-doctor-pdf-qa-mcp/tree-doctor-pdf-qa.db';
    this.issues = [
  {
    "id": 26,
    "exam_year": 9,
    "question_number": 6,
    "question_text": "뿌리 생장이 위축된다. [큰나무를 대상으로 실시하면 절단부위의 부후 및 수세쇠약, 그에 따른 뿌리 생장",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 27,
    "exam_year": 9,
    "question_number": 7,
    "question_text": "감나무 열매의 떨은맛은 타닌 때문이다. [타닌은 폴리페놀의 중합체로 We 맛을 내어 초식동물들이 싫어하도",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 28,
    "exam_year": 9,
    "question_number": 8,
    "question_text": "페놀화합물은 토양에서 타감작용을 한다. |페놀화합물은 분해가 잘 안되므로 수목의 조직이 땅에서 분해가 될",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 29,
    "exam_year": 9,
    "question_number": 9,
    "question_text": "감나무 열매의 떨은맛은 타닌 때문이다. [타닌은 폴리페놀의 중합체로 We 맛을 내어 초식동물들이 싫어하도",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 30,
    "exam_year": 9,
    "question_number": 10,
    "question_text": "페놀화합물은 토양에서 타감작용을 한다. |페놀화합물은 분해가 잘 안되므로 수목의 조직이 땅에서 분해가 될",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 31,
    "exam_year": 9,
    "question_number": 11,
    "question_text": "병원균은 Uromyces \\ᅲ40010010이다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 32,
    "exam_year": 9,
    "question_number": 12,
    "question_text": "병원균은 Uromyces \\ᅲ40010010이다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 33,
    "exam_year": 9,
    "question_number": 13,
    "question_text": "유관속형성층이 안쪽으로 생산한 2차 목부조직에 의해 주로 이루어진다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 34,
    "exam_year": 9,
    "question_number": 14,
    "question_text": "유관속형성층이 안쪽으로 생산한 2차 목부조직에 의해 주로 이루어진다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 35,
    "exam_year": 9,
    "question_number": 15,
    "question_text": "BOE SOP WSOP 사족된다, [지하부의 생장은 잎이 나기 전부터 이루어짐]",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 36,
    "exam_year": 9,
    "question_number": 16,
    "question_text": "BOE SOP WSOP 사족된다, [지하부의 생장은 잎이 나기 전부터 이루어짐]",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 37,
    "exam_year": 9,
    "question_number": 17,
    "question_text": "버드나무는 2가화이다. [버드나무나 포플러는 암꽃과 수꽃이 다른 그루에 달리는 이가화]",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 38,
    "exam_year": 9,
    "question_number": 18,
    "question_text": "버드나무는 2가화이다. [버드나무나 포플러는 암꽃과 수꽃이 다른 그루에 달리는 이가화]",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 39,
    "exam_year": 9,
    "question_number": 19,
    "question_text": "Cronartium ribicola ( 3tL}F 258 ) : Tuberculina maxima",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 40,
    "exam_year": 9,
    "question_number": 20,
    "question_text": "Rhizoctonia 501001[모잘록병]: Trichoderma lignorum [트리코더마: 중복기생균 )",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 41,
    "exam_year": 9,
    "question_number": 21,
    "question_text": "Cryphonectria 60『051100 ( 밤나무줄기마름병 ) : dsRNA 감염균주 ( 저병원성 균주 )",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 42,
    "exam_year": 9,
    "question_number": 22,
    "question_text": "목재부후균: Trichoderma harzianum",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 43,
    "exam_year": 9,
    "question_number": 23,
    "question_text": "Helicobasidium 00005401 ( 침엽수뿌리썩음병, 그루터기 썩음병]: Phleviopsis gigantea",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 44,
    "exam_year": 9,
    "question_number": 24,
    "question_text": "Agrobacterium tumefuciens ( #2|34 ) : Aradiobactor | |",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 45,
    "exam_year": 9,
    "question_number": 25,
    "question_text": "Cronartium ribicola ( 3tL}F 258 ) : Tuberculina maxima",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 46,
    "exam_year": 9,
    "question_number": 26,
    "question_text": "HA많은 방제 - 따뜻하고 습도가 높은 날, 병든 가지메서 세균점맥이 흘러나와 파리, ANS 등 곤충을 유인,",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 47,
    "exam_year": 9,
    "question_number": 27,
    "question_text": "꼴벌에 대한 독성이 강하여 사용에 주의하여야 한다. [40의 아세타미프리드와 마찬가지로 아바멕틴 ( 작용기작",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
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
    "id": 49,
    "exam_year": 9,
    "question_number": 29,
    "question_text": "꼴벌에 대한 독성이 강하여 사용에 주의하여야 한다. [40의 아세타미프리드와 마찬가지로 아바멕틴 ( 작용기작",
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
    "id": 51,
    "exam_year": 9,
    "question_number": 31,
    "question_text": "매미충류, 나무이, 꿀벌 등이 매개중으로 알려져 있다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 52,
    "exam_year": 9,
    "question_number": 32,
    "question_text": "FSB Sota HA많은] 의해 천반된다. |주로 SSAILSS| 매개전염이 이루어짐]",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 53,
    "exam_year": 9,
    "question_number": 33,
    "question_text": "매미충류, 나무이, 꿀벌 등이 매개중으로 알려져 있다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 54,
    "exam_year": 9,
    "question_number": 34,
    "question_text": "FSB Sota HA많은] 의해 천반된다. |주로 SSAILSS| 매개전염이 이루어짐]",
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
    "id": 57,
    "exam_year": 9,
    "question_number": 37,
    "question_text": "리그닌과 같은 난분해성 물질은 유기물 분해의 제한요인으로 작용할 수 있다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 58,
    "exam_year": 9,
    "question_number": 38,
    "question_text": "뿌리의 SHO] 중단되도라도 무귀아온와 흠수는 계속된다. |무기이온의 S45 중단]",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 59,
    "exam_year": 9,
    "question_number": 39,
    "question_text": "뿌리의 SHO] 중단되도라도 무귀아온와 흠수는 계속된다. |무기이온의 S45 중단]",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 60,
    "exam_year": 9,
    "question_number": 40,
    "question_text": "SB 등이 작은 가지 가해 상처침입, Sol] 감염 ( 인접나무와 Mays = ( root 0「0+\\ ) 에 의해 전파가능 )",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 61,
    "exam_year": 9,
    "question_number": 41,
    "question_text": "H많은, 물관 침입 후 아래로 균사확산 ( 진전속도 매우 빠름 )",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 62,
    "exam_year": 9,
    "question_number": 42,
    "question_text": "살균제, 살충제 살포, 매개충 서식처 제거",
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
    "id": 64,
    "exam_year": 9,
    "question_number": 44,
    "question_text": "대벌레 - 연모[ᅲ1096 ) [APE 총채벌레목의 날개 또는 곤충의 앞, /'뒷날개의 가장자리에 있는 S]",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 65,
    "exam_year": 9,
    "question_number": 45,
    "question_text": "밤나무 잉크병 - 물이 고이지 않게 배수관리",
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
    "id": 67,
    "exam_year": 9,
    "question_number": 47,
    "question_text": "입자밀도가 높아진다. |입자밀도는 토망공극을 제외한 단위용적의 토양 고체가 차지하는 질량이므로 답압으로",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 68,
    "exam_year": 9,
    "question_number": 48,
    "question_text": "붉나무 월동 S - 경계가 명확하게 모무늬|각진무늬 가 나타나게 됨",
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
    "id": 70,
    "exam_year": 9,
    "question_number": 50,
    "question_text": "엽소가 발생하는 환경 [수분 스트레스성 ) |",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 71,
    "exam_year": 9,
    "question_number": 51,
    "question_text": "사철나무 탄저병 ( 3 ) 포플러 갈색무늬병 ( 3 ) 느티나무 갈색무늬병 ( 4 ) 쥐똥나무 둥근무늬",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 72,
    "exam_year": 9,
    "question_number": 52,
    "question_text": "ᄀ, ᄂ2 ) 7ᄀ, ᄃ 3 ) ᄂ, ᄃ 0 ) ᄂ, 2 ᄃ, 2",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 73,
    "exam_year": 9,
    "question_number": 53,
    "question_text": "규소 ( 3 ) 나트륨 ( 3 ) 셀레늄 ( 4 ) 코발트 ( 5 ) 알루미늄",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 74,
    "exam_year": 9,
    "question_number": 54,
    "question_text": "Ch [균근은 산성토양에서 암모늄태질소 ( 12 ) 를 흡수하도록 도와줍니다,",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 75,
    "exam_year": 9,
    "question_number": 55,
    "question_text": "『ᄆ미중합효소연쇄반응법 ) 이용한 염기서열 분석",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 76,
    "exam_year": 9,
    "question_number": 56,
    "question_text": "바람에 자주 노출된 수목은 뿌라생장아-감소한다. [바람에 견디기 위해 직경생장과 뿌리생장이 증가]",
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
    "id": 80,
    "exam_year": 10,
    "question_number": 6,
    "question_text": "전염원이 바람에 의해 직접적으로 전반되는 수목병으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 81,
    "exam_year": 10,
    "question_number": 7,
    "question_text": "봄에 향나무 잎과 줄기에 형성된 노란색 또는 오렌지색 구조체에 생성되는 것은? (",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 82,
    "exam_year": 10,
    "question_number": 8,
    "question_text": "말초신경계 --- 페이지 25 --- 54. 곤충의 내분비계에 관한 설명으로 옮지 않은 것은?",
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
    "id": 84,
    "exam_year": 10,
    "question_number": 10,
    "question_text": "제시된 설명에 모두 해당하는 오염토양 복원 방법은 ? - 비용이 많이 소요된다. - 현장 및 현장 외에 모두 적용할 수 있다. - 전기적으로 용용하여 오염물질 용줄이 최 ! - 유기물, 무기물, 방사성 폐기물 등에 모두 적용할 수 있다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 85,
    "exam_year": 10,
    "question_number": 11,
    "question_text": "간척지 염류토양 개량방법으로 옮은 것 . 내염성 식물을 재배한다. 유기물을 시용한다. . 양질의 관개수를 이용하여 과잉염을 제거한다. . 요과적인 토양배수체계를 갖준다. . 석고를 시용한다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 86,
    "exam_year": 10,
    "question_number": 12,
    "question_text": "수목 병원성 곰팡이에 관한 설명으로 옮지 않은 것은",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 87,
    "exam_year": 10,
    "question_number": 13,
    "question_text": "연무법 : -미스트보다 미립자로 연무질로 해서 처리하는 방법 -고체나 액체의 미립자를 공기 중에 부유시킨다. -분무법이나 살분법보다 잘 부착하나 비산성이 커서 주로 하우수 내에서 적합 - 밀폐된 공간이나 토양 속에 넣어 기체를 발생시켜 해충을 죽이는 방법.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 88,
    "exam_year": 10,
    "question_number": 14,
    "question_text": "수목병에 중요한 환경요인에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 89,
    "exam_year": 10,
    "question_number": 15,
    "question_text": "포플러 잎녹병에 관한 설명으로 옮 ! 중간기주로 일본잎갈나무 (낙엽송) 등이 알려져 있다. (",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 90,
    "exam_year": 10,
    "question_number": 16,
    "question_text": "병원체에 관한 설명으로 옮은 것은것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 91,
    "exam_year": 10,
    "question_number": 17,
    "question_text": "바이러스에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 92,
    "exam_year": 10,
    "question_number": 18,
    "question_text": "파이토플라스마에 관한 설명으 뜨브 2253- 로",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 93,
    "exam_year": 10,
    "question_number": 19,
    "question_text": "수목병의 표징에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 94,
    "exam_year": 10,
    "question_number": 20,
    "question_text": "수목병 진단기법에 관한 설명으로 옮은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 95,
    "exam_year": 10,
    "question_number": 21,
    "question_text": "수목병을 관리하는 방법에 관한 설명으로 옮지 않은 것은 ?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 96,
    "exam_year": 10,
    "question_number": 22,
    "question_text": "비기생성 원인에 의한 수목병의 일반적인 특성으로 옮은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 97,
    "exam_year": 10,
    "question_number": 23,
    "question_text": "제시된 특징을 모두 갖는 병원균에 의한 수목병은? 분생포자를 생성한다. 세포벽에 키틴을 함유한다. 균사 격벽에 단순격벽공이 있다. (1) 철쪽 떡병 (2) 동백나무 흰말병 (3) 오리나무 잎녹병 (4) 사과나무 흰날개무늬병 (9) 느티나무 줄기밑둥썩음병 *자낭균류는 균사 격벽이 단순격벽공, 담자균류는 균사 격벽이 유연공격벽이다. * 난균강의 세포벽은 글루칸, 유주포자아문/접합균아문/자낭균문/담자균문 /불환전균문의 세포벽은 키틴을 함 ㄴㄴ \"자낭균류는 무성세대를 이루는 분생포자, 유성세대를 이루는 자낭포자를 형성한다. 는 무성세대를 ",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 98,
    "exam_year": 10,
    "question_number": 24,
    "question_text": "Ceratocystis 속 곰팡이에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 99,
    "exam_year": 10,
    "question_number": 25,
    "question_text": "수목 뿌리에 발생하는 병에 관한 설명으로 옮은 것은",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 100,
    "exam_year": 10,
    "question_number": 26,
    "question_text": "소나무 가지끝마름병에 관한 설명으로 옮지 않은 것은? 소나무 가지끝마름병 * 수목병 : 소나무류 디플로디아 가지끝마름병(순마름병) * 병원균 : 50110ㅁ6「0ㅁ515 506ㅁ61060 [=미ㅁ10910 ㅁ01060) 불완전균류 - 분생포자각 - 분생포자 형성 * 기주 : 소나무, 해송, 찾나무, 스트로브나무, 백송, 리기 (특히, 조경수 및 정원수, 반송의 수형을 망가트림) * 병환 : 가을에 잎이나 가지에 분생포자각을 만들어 겨울을 나고, 봄에 분생포자각 안에 분생포자가 는 바람에 의해 새순이나 어린잎에 옮겨가 병을 일으킨다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 101,
    "exam_year": 10,
    "question_number": 27,
    "question_text": "한국에서 발생하는 참나무 시들음병에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 102,
    "exam_year": 10,
    "question_number": 28,
    "question_text": "수목에 기생하는 겨우살이에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 103,
    "exam_year": 10,
    "question_number": 29,
    "question_text": "벗나무 번개무늬병에 관한 설명으로 옮지 않",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 104,
    "exam_year": 10,
    "question_number": 30,
    "question_text": "버즘나무 탄저병에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 105,
    "exam_year": 10,
    "question_number": 31,
    "question_text": "수목 줄기에 궤양(canker)을 일으키는 수목병으로만 나열한 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 106,
    "exam_year": 10,
    "question_number": 32,
    "question_text": "곤충의 기원과 진화에 관한 설명으로 옮은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 107,
    "exam_year": 10,
    "question_number": 33,
    "question_text": "곤충 성충의 외부형태적 특징에 관한 설명으로 옮지 않은 것은?",
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
    "id": 109,
    "exam_year": 10,
    "question_number": 35,
    "question_text": "곤충분류학 용어에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 110,
    "exam_year": 10,
    "question_number": 36,
    "question_text": "곤충의 탈피에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 111,
    "exam_year": 10,
    "question_number": 37,
    "question_text": "곤충의 주화성에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 112,
    "exam_year": 10,
    "question_number": 38,
    "question_text": "곤충의 신경계에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 113,
    "exam_year": 10,
    "question_number": 39,
    "question_text": "곤충의 호르몬과 페로몬에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 114,
    "exam_year": 10,
    "question_number": 40,
    "question_text": "곤충의 생식에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 115,
    "exam_year": 10,
    "question_number": 41,
    "question_text": "곤충과 미생물의 관계에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 116,
    "exam_year": 10,
    "question_number": 42,
    "question_text": "곤충의 주성에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 117,
    "exam_year": 10,
    "question_number": 43,
    "question_text": "진사회성 곤충에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 118,
    "exam_year": 10,
    "question_number": 44,
    "question_text": "생물적 방제의 천적곤충에 관한 설명으로 옳지 않은 것은?",
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
    "id": 120,
    "exam_year": 10,
    "question_number": 46,
    "question_text": "제시된 생태적 특징을 지닌 해충으로 옮은 것은? -장미과 수목의 잎을 가해한다. -연 1회 발생하며 유충으로 월동한다. -유충의 몸에는 검고 가는 털이 있다. -유충의 몸은 연노란색이고 검은 세로줄이 여러 개 있다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 121,
    "exam_year": 10,
    "question_number": 47,
    "question_text": "해충의 외래종 여부 및 원산지의 연결이 옮은 것은? 해충명 외래종 여부(2, ×) 원산지 (017 매미나방 × (2) 솔잎혹파리 × (3) 밤나무록벌 0 유럽",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 122,
    "exam_year": 10,
    "question_number": 48,
    "question_text": "소나무를 가해하는 나무좀과(Scolytidae) 해충에 관한 설명으로 옳지 않은 것은?",
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
    "id": 124,
    "exam_year": 10,
    "question_number": 50,
    "question_text": "제시된 해충의 생태에 관한 설명으로 옮지 않은 것은? -소나무류를 가해한다. -학명은 1001045 6101ㅁ6「『00이다. (017 성충으로 지제부 부근에서 월동한다. (2) 연 1회 발생하며 월동한 성충이 봄에 산란한다. (3) 신성충은 여름에 새 가지에 구멍을 고 들어가 가ㅇ (4) 쇠약한 나무에서 내는 물질이 가이모든 역할을 하여 (5) 봄에 수컷 성충이 먼저 줄기에 구멍을 고 들어가면 암 다. | 1 한 성충이 유인된다. 이 따라 들어가 교미한다. 돋 = [컷0 (5) 봄에 수컷-성충이-면져-졸가여-구멍을-뚜 들여가면-암컷",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 125,
    "exam_year": 10,
    "question_number": 51,
    "question_text": "해중의 가해 및 월동 생태에 관한 설명으로 옮은 것은 『 (",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 126,
    "exam_year": 10,
    "question_number": 52,
    "question_text": "종합적 해충방제 이론에서 약제방제를 해야 하는 시기로 옮은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 127,
    "exam_year": 10,
    "question_number": 53,
    "question_text": "곤충의 밀도조사법에 관한 설명으로 옮지 않은 것은? 1: 함정트랩 : 지표면을 배회하는 곤충을 포획한다. (2) 황색수반트랩 : 꽃으로 오인하게 하여 유인한 후 끈끈이에 포획한다. (3) 털어잡기 : 지면에 천을 놓고 수목을 쳐서 아래로 떨어지는 곤충을 포획한다. (4 우화상 : 목재나 토양에서 월동하는 곤중류가 우화, 탈줄할 때 포획한다. (9) 깔때기트랩 :수관부에 설치하고 비행성 곤충이 깔때기 아래 수집통으로 들어가게 하여 포획한다. 2 황색수반트랩 : 꽂으로 우인하과 하여-유원환 후 끈끈이애-포획한다. (황색빚깔에 유인되는 ",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 128,
    "exam_year": 10,
    "question_number": 54,
    "question_text": "해충과 천적의 연결이 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 129,
    "exam_year": 10,
    "question_number": 55,
    "question_text": "해충의 예찰과 방제에 관한 설명으로 옮은 것은 ?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 130,
    "exam_year": 10,
    "question_number": 56,
    "question_text": "줄기 정단분열조직에 의해서 만들어진 1차 분열조직으로 옮은 것만을 나열한 것은 ?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 131,
    "exam_year": 10,
    "question_number": 57,
    "question_text": "해충 개체군의 특징에 관한 설명으로 옮은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 132,
    "exam_year": 10,
    "question_number": 58,
    "question_text": "65식물의 광호흡이 일어나는 세포소기관으로 을은 것만을 나열한 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 133,
    "exam_year": 10,
    "question_number": 59,
    "question_text": "곤충의 내분비계에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 134,
    "exam_year": 10,
    "question_number": 60,
    "question_text": "곤충과 온도의 관계에 관한 설명으로 옮은 것은",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 135,
    "exam_year": 10,
    "question_number": 61,
    "question_text": "딱정벌레목과 벌목의 특징에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 136,
    "exam_year": 10,
    "question_number": 62,
    "question_text": "수목의 줄기생장에 관한 설명으로 옮지 않은 것은?",
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
    "id": 138,
    "exam_year": 10,
    "question_number": 64,
    "question_text": "곤충의 소화계에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 139,
    "exam_year": 10,
    "question_number": 65,
    "question_text": "수목 내의 탄수화물에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 140,
    "exam_year": 10,
    "question_number": 66,
    "question_text": "수목 내 질소의 계절적 변화에 관한 설명으로 옮 목부를 통하여 회수된다. 은 사부보다 목부에서 크다. 목부와 사부의 방사유조직에 저장된다. 되어 암모늄태 질소로 사부를 통해 이동한다. 9 봄에 저장단백질이 5 저장조직의 연중 질소함량은 봄철 줄기 생장이 왕성하게 이루어질 때 가장 높다. 으",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 141,
    "exam_year": 10,
    "question_number": 67,
    "question_text": "페놀화합물에 관한 설명으로 옮지 않은 것은 ?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 142,
    "exam_year": 10,
    "question_number": 68,
    "question_text": "수목의 지질대사에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 143,
    "exam_year": 10,
    "question_number": 69,
    "question_text": "수목의 질소화합물에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 144,
    "exam_year": 10,
    "question_number": 70,
    "question_text": "수목의 호흠에 관한 설명으로 옮지 않은 것은? 1 형성층 조직에서는 혐기성 호흡이 일어날 수 있다. 21 은 온도가 10“ 상승함에 따라 나타나는 호흡량 증가을이다 3 균근이 형성된 뿌리는 균근이 미형성된 뿌리보다 호흡량이 증가한다. 4) 종자를 낮은 온도에서 보관하는 것은 호흡을 줄이는 효과가 있다. 눈비늘(아린)은 산소를 차단하여 호흡 을 억제하므로 눈의 호흡은 계절적 변동이 없다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 145,
    "exam_year": 10,
    "question_number": 71,
    "question_text": "나자식물의 질산환원 과정이다. (ㄱ), (ㄴ), (ㄷ)에 들어갈 내용을 순서대로 옮게 나열한 것은? ㄱㄱ Ｌ 도",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 146,
    "exam_year": 10,
    "question_number": 72,
    "question_text": "무기양분에 관한 설명으로 옮은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 147,
    "exam_year": 10,
    "question_number": 73,
    "question_text": "수목의 균근 또는 균근균에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 148,
    "exam_year": 10,
    "question_number": 74,
    "question_text": "수목의 광합성에 관한 설명으로 옳은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 149,
    "exam_year": 10,
    "question_number": 75,
    "question_text": "생식과 번식에 관한 설명으로 옮지 않은 것은 ?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 150,
    "exam_year": 10,
    "question_number": 76,
    "question_text": "꽃눈원기 형성부터 종자가 성숙할 때까지 5년이 걸리 느 수종은? ㄴㄴ <25>ㄴ",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 151,
    "exam_year": 10,
    "question_number": 77,
    "question_text": "수목의 수분퍼텐셜에 관한 설명으로 옮은 것은 ?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 152,
    "exam_year": 10,
    "question_number": 78,
    "question_text": "식물호르몬에 관한 설명으로 옮은 것은 ?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 153,
    "exam_year": 10,
    "question_number": 79,
    "question_text": "종자에 관한 설명으로 옮은 것을 모두 고른 것은 ? 7ㄱ. 배는 자엽, 유아, 하배축, 유근으로 구성되어 있다. ㄴ. 두릅나무와 솔송나무는 배유종자를 생산한다. ㄷ. 배휴면은 배 혹은 배 주변의 조직이 생장억제제를 분비하여 발아를 억제하는 것이다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 154,
    "exam_year": 10,
    "question_number": 80,
    "question_text": "제시된 설명의 특성을 모두 가진 식물호르몬은 ? - 사이클로펜타논[0/여066ㅇㅁ0100ㅇ06) 구조를 가진 화합물로, 불포화지방산의 일종인 리놀렌산에서 생 합성된다. - 잎의 노쇠와 엽록소 파괴를 촉진하고, 루비스코 효소 억제를 통한 광합성 감소를 유발한다. - 완경 스트레스, 곤충과 병원균에 대한 저항성을 높인다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 155,
    "exam_year": 10,
    "question_number": 81,
    "question_text": "제시된 특성을 모두 가지는 점토광물로 옮 - 비팽창성 광물이다. - 층 사이에 6ㅁ0016 라는 팔면체층이 있다. - 기저면 간격(|/+6ㅁ06『 5ㄷㅇㅇ01090 은 약 1.400이다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 156,
    "exam_year": 10,
    "question_number": 82,
    "question_text": "산림토양과 농경지토양의 차이점을 비교한 내용으로 옮은 것만을 고른 것은? 비교사항          산림토양      동경지토양 ㄱ. 토양몬도의변화 크다           작다 ㄴ. 낙엽 공급량         적다         많다 ㄷ. 토양 동물의 종류 많다         적다",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 157,
    "exam_year": 10,
    "question_number": 83,
    "question_text": "식물호르몬에 관한 설명으로 옮은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 158,
    "exam_year": 10,
    "question_number": 84,
    "question_text": "면적 110 깊이 1007인 토양의 탄소 저장량(\\49=『ㅇㅁ)은?(단, 이 토양의 용적밀도, 탄소농도, 석력 함량은 각각 10 0/00*, 3%, 0%로 한다.)",
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
    "id": 160,
    "exam_year": 10,
    "question_number": 86,
    "question_text": "01) 0 보브 편 65 토양수분 공급과 식물의 수분흡수에 따라 토양의 젖음-마름 상태가 반복되면 입단 형성이 족진된다. 응집현상을 유발하는 대표적인 양이온은 바@*이다. (이나트륨]은 수화반지름이 커서 부착 및 응집에 약하다. 그래서 입단화를 방해하고 분산됨.) 입단생성과 발달 * 점토 사이의 양이온에 의한 응집현상 : 음으로 하전된 점토 사이에 다가 양이온이 위치하여 정전기적인 힘에 의해 점토가 서로 끌리는 현상 * 점토 표면의 양전하와 점토에 의한 응집현상 : 양으 * 점토 표면의 양전하와 유기물에 의한 입단화 : 물이 * 점",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 161,
    "exam_year": 10,
    "question_number": 87,
    "question_text": "토성이 식토, 식양토, 사양토, 사토 순으로 점점 거칠어질 때 토양특성의 변화가 옮게 연결된 것은? 보수력 비표면적 용적밀도 통기성",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 162,
    "exam_year": 10,
    "question_number": 88,
    "question_text": "토양의 양이온 교환능력(CEC)에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 163,
    "exam_year": 10,
    "question_number": 89,
    "question_text": "토양의 화학적 특성에 관한 설명으로 옮지 많은 것은? (",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 164,
    "exam_year": 10,
    "question_number": 90,
    "question_text": "'농촌진흥청고시' 2023-24 제5조 (비료의 성분)에 따른 비료(20-10-1",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 165,
    "exam_year": 10,
    "question_number": 91,
    "question_text": "산림토양 산성화의 원인으로 옮은 것을 모두 고른 것은? ㄱ. 황화철 산화 ㄴ. 질산화작용 ㄷ. 토양유기물 분해로 인한 유기산 생성",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 166,
    "exam_year": 10,
    "question_number": 92,
    "question_text": "제시된 설명과 ]차 광물의 연결로 옮은 것은 ? ㄱ. 가장 간단한 구조의 규산염광물이며, 결정구조가 단순하기 때문에 풍화되기 쉽다. ㄴ. 전기적으로 안정하고 표면의 노출이 적어 풍화가 매우 느리며, 토양 중 모래 입자의 주성분이다. ㄱ      ㄴ (017 각섬석 휘석 (2) 감람석 석영 (3) 휘석” 장석",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 167,
    "exam_year": 10,
    "question_number": 93,
    "question_text": "화산회로부터 유래한 토양에 많이 함유되어 있으며 인산의 고정력이 강한 점토광물은 ?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 168,
    "exam_year": 10,
    "question_number": 94,
    "question_text": "토양 입단의 형성과 안정성에 관한 설명으로 옳은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 169,
    "exam_year": 10,
    "question_number": 95,
    "question_text": "토양유기물 분해에 영향을 미치는 설명으로 옮은 것을 모두 고른 것은? ㄱ. 유기물 분해속도는 토양 와 관계없이 일정하다. ㄴ. 페놀화합물이 유기물 건물량의 3~4% 포함되어 있으면 분해속도가 빨라진다. ㄷ. 탄질비가 200을 초과하는 유기물도 외부로부터 질소를 공급하면 분해속도가 빨라진다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 170,
    "exam_year": 10,
    "question_number": 96,
    "question_text": "4, 6 두 토양의 소성지수[610541ㅇ1006×)가 15%로 같다 두 토양의 액성한계[10410 1101\\)에서의 수분함량이 각각 40%, 35%라면 두 토양의 소성한계[6105!16 1101)에서의 수분함량[%)]은? 6 68 (1)15 15 (2) 25 20 3) 40 35 4) 50 55 (5) 55 50",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 171,
    "exam_year": 10,
    "question_number": 97,
    "question_text": "산림토양의 층위에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 172,
    "exam_year": 10,
    "question_number": 98,
    "question_text": "유기물질을 퇴비로 만들 때 유익한 점만을 모두 고른 것은? ㄱ. 퇴비화 과정 중 발생하는 높은 열로 병원성 미생물이 사멸된다. ㄴ. 유기물이 분해되는 동안 ㅇ;가 방줄됨으로써 부피가 감소되어 쥐급이 편하다. ㄷ. 질소 외 양분의 용탈 없이 유기물을 좁은 공간에서 안전하게 보관할 수 있다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 173,
    "exam_year": 10,
    "question_number": 99,
    "question_text": "필수양분과 주요 기능의 연결로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 174,
    "exam_year": 10,
    "question_number": 100,
    "question_text": "제시된 설명에 모두 해당하는 오염토양 복원 방법은 ? - 비용이 많이 소요된다. - 현장 및 현장 외에 모두 적용할 수 있다. - 전기적으로 용융하여 오염물질 용출이 죄소화된다. - 유기물, 무기물, 방사성 폐기물 등에 모두 적용할 수 있다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 175,
    "exam_year": 10,
    "question_number": 101,
    "question_text": "간척지 염류토양 개량방법으로 옮은 것을 모두 고른 것은? ㄱ. 내염성 식물을 재배한다. ㄴ. 유기물을 시용한다. ㄷ. 양질의 관개수를 이용하여 과잉염을 제거한다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 176,
    "exam_year": 10,
    "question_number": 102,
    "question_text": "산불발생지 토양에서 일어나는 변화로 옮지 않은 것은?",
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
    "id": 178,
    "exam_year": 10,
    "question_number": 104,
    "question_text": "수목의 양분 순환에 관한 설명으로 옳은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 179,
    "exam_year": 10,
    "question_number": 105,
    "question_text": "현장에서 임지생산능력을 판정하기 위한 간이산림토양조사 항목이 아닌 것은 ?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 180,
    "exam_year": 10,
    "question_number": 106,
    "question_text": "수목의 상처 치유 및 치료에 관한 설명으로 올은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 181,
    "exam_year": 10,
    "question_number": 107,
    "question_text": "토목공사장에서 수목을 보전하는 방법에 관한 설명으로 옮지 않은 것은",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 182,
    "exam_year": 10,
    "question_number": 108,
    "question_text": "수목의 상태에 따른 피해 발생에 관한 설명으로 옮은 것은",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 183,
    "exam_year": 10,
    "question_number": 109,
    "question_text": "제시된 수종 중 양수 2종을 고른 것은? ㄱ. 낙우송 ㄴ. 녹나무 ㄷ. 회양목 2. 느티나무 ㅁ. 비자나무 브. 사철나무 (1) 7, 2 (20 ㄴ, ㄷ (3) ㄷ, ㅁ (4) 2, ㅁ (5) ㅁ, 버 분류             극음수             음수             중성수              양수             극양수 가죽나무, 개잎갈나 무, 과수류, 낙우송, 느티나무, 등, 메타세 개나리, 느릅나무, 동 쿼이아, 모감주나무, 백나무, 때죽나무, 마         :",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 184,
    "exam_year": 10,
    "question_number": 110,
    "question_text": "느티나무 가지를 길게 남겨 전정하였는데 남은 가지에서 시작되어 원출기까지 부후 되고 있다 이 현상의 원인에 관한 설명으로 옮은 것은 (",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 185,
    "exam_year": 10,
    "question_number": 111,
    "question_text": "수목의 다듬기 전정 시기에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 186,
    "exam_year": 10,
    "question_number": 112,
    "question_text": "제시된 내용 중 수목의 이식성공률을 높이는 방법을 모두 고른 것은 ? ㄱ. 어린나무를 이식한다. ㄴ. 지주목을 5년 이상 유지한다. ㄷ. 생장이 활발한 시기에 이식한다.",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 187,
    "exam_year": 10,
    "question_number": 113,
    "question_text": "과습에 대한 저항성이 큰 수종으로만 나열한 것은? 우송, 벗나무, 사시나무 (",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 188,
    "exam_year": 10,
    "question_number": 114,
    "question_text": "수목에 필요한 무기양분 중 철에 관한 설명으로 옮지 않은 것은? 어 고 (1) 엽록소 생성과 호흡과정 (2) 토양에 과잉되면 수목에 인산이 결펌될 수 있다. (3) 겹 현상은 알칼리성 토양에서 자라는 수목에서 흔히 나타난다. (4) 결되면 침엽수와 활엽수 모두 잎에 황화 현상이 나타난다. (5) 체내 이동성이 낮아 성숙한 잎에서 먼저 결 증상이 나타난다. (9) 체내 이동성이 낮아 성숙환위애사면져결팝-증상이 나타난다. (유엽의 엽맥사이가 황화, 성숙엽은 질 을 유지) [암기법 : 카페베네(ㅇ, 『6, 8)는 젊은 친구들이 많이 이용",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 189,
    "exam_year": 10,
    "question_number": 115,
    "question_text": "대기오염물질인 오존(。)과 『4&4에 관한 설명으로 옮은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 190,
    "exam_year": 10,
    "question_number": 116,
    "question_text": "제설염 피해에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 191,
    "exam_year": 10,
    "question_number": 117,
    "question_text": "산불에 관한 설명으로 옮은 것은것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 192,
    "exam_year": 10,
    "question_number": 118,
    "question_text": "토양경화(답압) 에 의해 발생하는 현상이 아닌 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 193,
    "exam_year": 10,
    "question_number": 119,
    "question_text": "수목 생장에 필수인 미량원소만 나열한 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 194,
    "exam_year": 10,
    "question_number": 120,
    "question_text": "다음 () 안에 들어갈 명칭이 옮게 연결된 것은? 그 Ｌㄴ ㅁ 로 이",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 195,
    "exam_year": 10,
    "question_number": 121,
    "question_text": "농약 사용 방법에 관한 설명으로 옮지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 196,
    "exam_year": 10,
    "question_number": 122,
    "question_text": "제제의 형태가 액상이 아닌 것은것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 197,
    "exam_year": 10,
    "question_number": 123,
    "question_text": "농약 안전사용기준 설정 과정의 모식도이다. ( ) 안에 들어갈 용어로 옮게 연결된 것은? [단, 40!: 1일 섭취허용량, \\/!.: 농약잔류 허용기준, ㄷＬ: 최대무독성용량이다.) 그     Ｌㄴ       ㅁ",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 198,
    "exam_year": 10,
    "question_number": 124,
    "question_text": "에르고스테롤 생합성저해 작용기작을 지닌 살균제가 아닌 것은",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 199,
    "exam_year": 10,
    "question_number": 125,
    "question_text": "살충제 설폭사플로르[5.110×아10「)의 작용기작은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 200,
    "exam_year": 10,
    "question_number": 126,
    "question_text": "글루포시네이트암모늄 + 티아페나실 액상수화제의 유효성분별 작용기작을 옮게 나열한 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 201,
    "exam_year": 10,
    "question_number": 127,
    "question_text": "농약의 대사과정 중 복합기능 산화효 넌 에 터 소[071×60 +4001100 0×10056)가 관여하는 반응이 아닌 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 202,
    "exam_year": 10,
    "question_number": 128,
    "question_text": "'소나무재선충병 방제지침' 소나무류 보존 가치가 큰 산림 중 '소나무 보호' 육성을 위한 법적 관리지 역에 포함되지 않는 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 203,
    "exam_year": 10,
    "question_number": 129,
    "question_text": "'산림보호법 시행령' 제12조의10에 따른 나무병원 등록의 취소 또는 영업정지의 세부기준에 관한 설 명으로 올지 하으 것으? 6 ㄴ ㄴㄴ",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 204,
    "exam_year": 10,
    "question_number": 130,
    "question_text": "'산림보호법 시행규칙' 제19조의? (진료부, 처방전등의 서식 등)에 따라 나무의사가 작성하는 진료부 에 명시되지 않은 항목은",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 205,
    "exam_year": 10,
    "question_number": 131,
    "question_text": "수목 병해 방제법 중 생물적 방제에 해당하는 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 206,
    "exam_year": 10,
    "question_number": 132,
    "question_text": "곤충의 휴면에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 207,
    "exam_year": 10,
    "question_number": 133,
    "question_text": "'소나무재선중병 방제지침' 소나무류 보존 가치가 큰 산림 중 '소나무 보호' 육성을 위한 법적 관리지 역에 포함되지 않는 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 208,
    "exam_year": 10,
    "question_number": 134,
    "question_text": "산림 생태계의 천이에 관한 설명으로 옳은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 209,
    "exam_year": 10,
    "question_number": 135,
    "question_text": "수목의 증산작용에 영향을 미치는 요인으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 210,
    "exam_year": 10,
    "question_number": 136,
    "question_text": "수목의 내한성 기작에 관한 설명으로 옳은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 211,
    "exam_year": 10,
    "question_number": 137,
    "question_text": "산림토양의 질소 순환에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 212,
    "exam_year": 10,
    "question_number": 138,
    "question_text": "수목의 수분 스트레스 증상으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 213,
    "exam_year": 10,
    "question_number": 139,
    "question_text": "균근의 종류와 특성에 관한 설명으로 옳은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 214,
    "exam_year": 10,
    "question_number": 140,
    "question_text": "수목 해충의 천적 이용에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 215,
    "exam_year": 10,
    "question_number": 141,
    "question_text": "산림의 탄소 저장에 관한 설명으로 옳은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 216,
    "exam_year": 10,
    "question_number": 142,
    "question_text": "수목의 영양 진단법에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 217,
    "exam_year": 10,
    "question_number": 143,
    "question_text": "산림 병해충의 종합적 방제(IPM)에 관한 설명으로 옳은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 218,
    "exam_year": 10,
    "question_number": 144,
    "question_text": "수목의 공기정화 기능에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 219,
    "exam_year": 10,
    "question_number": 145,
    "question_text": "산림토양의 산성화 원인으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 220,
    "exam_year": 10,
    "question_number": 146,
    "question_text": "수목의 도시 환경 스트레스에 관한 설명으로 옳은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 221,
    "exam_year": 10,
    "question_number": 147,
    "question_text": "산림의 수원함양 기능에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 222,
    "exam_year": 10,
    "question_number": 148,
    "question_text": "수목 생장에 필요한 필수원소에 관한 설명으로 옳은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 223,
    "exam_year": 10,
    "question_number": 149,
    "question_text": "산림 생태계의 먹이사슬에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 224,
    "exam_year": 10,
    "question_number": 150,
    "question_text": "수목의 상처 치유 과정에 관한 설명으로 옳은 것은?",
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
    "id": 471,
    "exam_year": 8,
    "question_number": 7,
    "question_text": "7)를 흡수하는 옳은te! DT 옳은l Pl (tlavoprotein)2| * 식물의 굴광성과 굴지성을 조절하는 광수용체 © 잎에 많이 존재하며 햇빛을 감지하여 줄기의 굴광성과 뿌리의 굴지성을 조절함 * 잎의 확장, 줄기생장을 유도, 감지하여 기공개폐 관여 크립토크롬 * 포토트로핀과 함께 청색광과 자외선[520~",
    "subject": "미분류",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 714,
    "exam_year": 9,
    "question_number": 69,
    "question_text": " 69 ) 리그닌과 같은 난분해성 물질은 유기물 분해의 제한요인으로 작용할 수 있다. 69 리그닌과 같은 난분해성 물질은 유기물 분해의 제한요인으로 작용할 수 있다. ( 17 SSO] 산성화 또는 알칼리화되면 유기물 분해속도는 느려진다. ( 3 ) 발효형 미생물은 리그닌의 분해를 SU많은 키폭효과를 가지고. . .  **해설**: 으로 옮지 않은 것은?  **키워드**: 토양  *품질점수: 74/100*",
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
    "id": 729,
    "exam_year": 11,
    "question_number": 23,
    "question_text": "Cercospora속 또는 Pseudocercospora속이",
    "subject": "미분류",
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
    "id": 755,
    "exam_year": 11,
    "question_number": 53,
    "question_text": "다음 중 잎의 자연적 수명이 가장 긴",
    "subject": "미분류",
    "choice_count": 4,
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
    "id": 759,
    "exam_year": 11,
    "question_number": 59,
    "question_text": "줄기의 차 분열조직과 이로부터 발생한",
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
    "id": 764,
    "exam_year": 11,
    "question_number": 67,
    "question_text": "안에 들어갈 용어로 적합한",
    "subject": "미분류",
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
    "id": 771,
    "exam_year": 11,
    "question_number": 79,
    "question_text": "다음 표에서 ㉡, ㉣, ㉥에 알맞은 특성을",
    "subject": "미분류",
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
    "id": 783,
    "exam_year": 11,
    "question_number": 93,
    "question_text": "탈질작용에 관여하는 미생물",
    "subject": "미분류",
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
    "id": 789,
    "exam_year": 11,
    "question_number": 102,
    "question_text": "도시의 수목 생육 환경에 관한 설명으로",
    "subject": "미분류",
    "choice_count": 5,
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
    "id": 795,
    "exam_year": 11,
    "question_number": 109,
    "question_text": "수목의 침수 후 나타나는 변화에 관한",
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
    "id": 797,
    "exam_year": 11,
    "question_number": 111,
    "question_text": "복토 또는 심식 피해에 관한 설명으로",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 798,
    "exam_year": 11,
    "question_number": 112,
    "question_text": "백로류의 집단 서식으로 수목이 피해를",
    "subject": "미분류",
    "choice_count": 5,
    "has_answer": 0
  },
  {
    "id": 799,
    "exam_year": 11,
    "question_number": 114,
    "question_text": "디캄바에 관한 설명으로 옳지 않은 것은?",
    "subject": "미분류",
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
  }
];
    this.results = [];
  }

  async run() {
    console.log('🤖 과목 분류 정확도 개선 에이전트 시작');
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
      '/Users/voidlight/tree-doctor-pdf-qa-mcp/quality-agents/subject-classification-agent-results.json',
      JSON.stringify({
        agentId: 'subject-classification-agent',
        processed: this.issues.length,
        improved: this.results.length,
        improvements: this.results
      }, null, 2)
    );
    
    console.log('✅ 과목 분류 정확도 개선 에이전트 완료: ' + this.results.length + '개 개선');
  }

  async processIssue(issue) {
    
    // 과목 재분류 로직
    const text = issue.question_text;
    const keywords = {
      '수목병리학': {
        words: ['병원체', '병원균', '감염', '세균', '바이러스', '진균', '곰팡이', '병해', '살균제', '병징', '병반'],
        weight: 0
      },
      '수목해충학': {
        words: ['해충', '곤충', '천적', '유충', '번데기', '성충', '살충제', '천공', '가해', '나방'],
        weight: 0
      },
      '수목생리학': {
        words: ['광합성', '호흡', '증산', '영양', '생장', '식물호르몬', '굴광성', '굴지성', '옥신'],
        weight: 0
      },
      '수목관리학': {
        words: ['전정', '시비', '관리', '진단', '식재', '이식', '멀칭', '전지', '가지치기'],
        weight: 0
      },
      '토양학': {
        words: ['토양', 'pH', '양분', '비료', '유기물', '배수', '통기성', '양이온교환'],
        weight: 0
      },
      '임업일반': {
        words: ['산림', '조림', '벌채', '갱신', '임분', '임목', '천연갱신'],
        weight: 0
      }
    };
    
    // 키워드 가중치 계산
    for (const [subject, data] of Object.entries(keywords)) {
      data.words.forEach(word => {
        if (text.includes(word)) {
          data.weight += 1;
        }
      });
    }
    
    // 가장 높은 가중치의 과목 선택
    const subjects = Object.entries(keywords)
      .filter(([_, data]) => data.weight > 0)
      .sort((a, b) => b[1].weight - a[1].weight);
    
    if (subjects.length > 0 && subjects[0][0] !== issue.subject) {
      return {
        questionId: issue.id,
        originalSubject: issue.subject,
        newSubject: subjects[0][0],
        confidence: subjects[0][1].weight / 10,
        keywords: subjects[0][1].words.filter(w => text.includes(w))
      };
    }
    
    return null;
      
  }

  async applyImprovement(db, improvement) {
    return new Promise((resolve) => {
      
      if (improvement.newSubject && improvement.confidence > 0.5) {
        db.run(
          'UPDATE exam_questions SET subject = ? WHERE id = ?',
          [improvement.newSubject, improvement.questionId]
        );
      }
      
      resolve();
    });
  }
}

// 실행
const agent = new subject_classification_agent();
agent.run().catch(console.error);
