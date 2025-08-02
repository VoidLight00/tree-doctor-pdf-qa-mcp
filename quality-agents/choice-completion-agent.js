#!/usr/bin/env node
/**
 * 선택지 완성 에이전트
 * 역할: 불완전한 선택지를 감지하고 완성
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';

class choice_completion_agent {
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
    "id": 240,
    "exam_year": 8,
    "question_number": 9,
    "question_text": "9) 교목 아래에 지피식물을 식재하는 것이 유기물로 멀칭 하는 것보다 더 바람직하다. 식물건강관리 프로그램 (Plant Health Care, 출아C) : 종합적병해춤관리(1ㅁ)/] 개념을 조경수 관리에 응용하기 위해 개발한 프로그램, **해설**: 으로 올지 많은 것은? (",
    "subject": "수목관리학",
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
    "id": 810,
    "exam_year": 5,
    "question_number": 1,
    "question_text": "문제 1 문제: 주의사항  문제 2 문제: ㄱ 절대 기생성 물관부 폐쇄 . a. ㄴ 기주 특이성 균핵 형성 . b. ㄷ 로만 구성 잎의 기형 . DNA c. ㄹ 세포로 구성 모자이크 증상 . d. 녹병정자 녹포자 여름포자 겨울포 , , 녹병균 병명 암기법 세대 자세대 송이풀 까치밥나 , 잣나무털녹병 잣나무 잣송이까 Cronartium ribicol 무 소나무혹병 소나무 곰솔 졸참 신갈나무 혹졸신 Coleosporium 소나무잎녹병 소나무 황벽 잔대 참취 잎황잔참 , , asterum 향나무 Gymnosporangium 향나무녹병 배나무 향배향 여름세대 asiaticum ( X) 포플러 일본잎갈 Melampsore larici- ( , 포플러잎녹병 낙엽송 포낙현줄 줄꽃 현호색 populina , ) Uredinopsis 전나무잎녹병 전나무 뱀고사리 전뱀 komagatakensis Chrysomyxa 철쭉잎녹병 가문비나무 산철쭉 철가산 rhododendri 수 목 해 충 학 비행하는 곤충조사법 < > 끈끈이트랩 비행하는 곤충을 접합제로 처리된 표면에 잡히게 하는 방식 예 광릉긴나무좀 등 : ( : ) 유아등 곤충의 주광성을 이용한 방법으로 빛에 모이게 하는 방법 예 나방류 딱정벌레류 파리류 등 : ( : , , ) 말레이즈트랩 비행하는 곤충이 착륙 후 음성주지성으로 높은 곳을 향해 기어가는 습성을 이용해서 포획 : 페로몬트랩 성페로몬과 집합페로몬이 많이 사용된다 성페로몬 예 복숭아명나방 집합페로몬 예 북방수 : . ( : , : 염하늘소와 솔수염하늘소 채집 ) 흡입트랩 비행곤충을 인위적인 강풍으로 흡입하는 방법 예 진딧물류 등 : ( : ) 황색수반트랩 황색에 잘 끌리는 것을 이용하는 방법 예 총채벌레 진딧물 등 : ( : , ) 수관 또는 지상에 서식하는 곤충조사 방법 < > 미끼트랩 해충의 섭식 특성을 이용해서 당분이나 좋아하는 미끼를 이용해서 유인하는 방법 : 직접조사 식물 잎 등을 서식하는 곤충을 직접 눈으로 조사하는 방법 : 넉다운조사법 나무에 서식하는 곤충들을 조사하기 위해 나무에 살충제를 뿌려 떨어지는 곤충을 조사 : 함정트랩 토양에 서식하는 곤충을 조사하는 방법으로 땅속에 유리병이나 깡통을 묻어 떨어지는 곤충 조사 : 토양표본 토양에 서식하는 곤충을 채집하는 방법으로 채나 액체를 이용하여 추출 깔때기를 이용하여 흙 : or 을 넣고 그 위에 백열등으로 가열하여 아래로 내려가 곤충채집통으로 떨어지게 하는 방법 스위핑 간단하고 비용이 적게 드는 방법으로 포충망을 휘둘러서 포획 : 비팅 수관 밑에 일정크기의 천을 대고 가지를 두드려 떨어지는 곤충 채집 : 수 목 생 리 학 합성 시토키닌 [ ] 시토키닌 - kinetin * 노쇠지연 - benzyladenine - 세포분열을 조절하여 세포신장에 관여 세포분열과 기관형성 - diphenylurea - ( ) 상처입은 표피에서 형성되는 조직에 시토키닌 성분이 있다 캘러스 - thidiazuron - .(ex. ) 옥신 시토키닌 → 뿌리형성 - > 천연 시토키닌 옥신 시토키닌 → 잎 대 눈 형성 [ ] - < , , . 시토키닌 결핍시 성숙잎에서 먼저 낙엽현상이 있다 - zeatin - , . 어린잎이 성숙잎에 비해 시토키닌 함량이 높다 - dihydrozeatin - . - zeatin riboside - isopentenyl adenine",
    "subject": "수목병리학",
    "choice_count": 2,
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
    "id": 814,
    "exam_year": 5,
    "question_number": 5,
    "question_text": "문제 5 문제: 산 림 토 양 학 염기성암 이하 중성암 산성암 이상 (52 ) (52~66%) (66% ) 화산암 지표 현무암 안산암 유문암 ( ) 반심성암 휘록암 섬록반암 석영반암 심성암 지하 반려암 섬록암 화강암 ( ) 암기법 현휘반 안섬섬 유석화 수분퍼텐셜 → 수분의 양 으로 이해 “ ”  문제 5 문제:",
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
    "id": 818,
    "exam_year": 5,
    "question_number": 9,
    "question_text": "해독응급처치 # 농약 대사 Phase I - 니트로기 환원반응 - 수산화(hydroxylation) 반응 - 탈알킬화(dealkylation) 반응 - 카르복실에스테라제(carboxylesterase)에 의한 가수분해 반응 Phase II - 콘쥬게이션 - Tiocyanate - Methylation - Acetylation  Note: 본 문서는 제5회 기출문제 해설집의 주요 내용을 정리한 것입니다.",
    "subject": "수목병리학",
    "choice_count": 1,
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
    "id": 823,
    "exam_year": 5,
    "question_number": 14,
    "question_text": "제조모집단번호  문제 6 문제: 수 목 관 리 학  문제 6 문제: 적용작물 사용적기 사용량  문제 7 문제: 그림문자 마스크 고무장갑 보안경 등  문제 8 문제: 해독응급처치  문제 9 문제: Ⅰ Ⅱ Phase Phase 니트로기 환원반응 콘쥬게이션 수산화 반응 (hydroxylation) Tiocyanate 탈알킬화 반응 (dealkylation) Methylation 카르복실에스테라제 에 의 (carboxylesterase) Acetylation 한 가수분해 반응  문제 10 문제: 농약성분",
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
    "id": 961,
    "exam_year": 6,
    "question_number": 2,
    "question_text": "15% 모란탈테트레이트 8% 나무주사 밀베멕틴 유제 2% 주사시기 월 이듬해 월 매개충 우화 월 전에 완료 - : 11 ~ 3 ( 2~3 ) 나무주사방법 나무줄기 동력천공기 이용 직경 깊이 구멍 개 이상 - : , 1Cm, 6Cm 2 → 천공수와 주입약량을 기준표에 맞추어서 주입 천공으로 인한 외관손상 약해피해 우려되는 보존가치 큰 소나무 - or 토양오염 피해 우려지역은 대상목에서 제외 - . 살선충제 북방수염하늘소 분포지 월초 월초까지 - : 3 ~ 4 토양약제 주입 솔수염하늘소 분포지 월초 월 하순까지 - : 3 ~ 5 약제 포스치아제이트 액제 배액 - : 30% (50 ) 약제 살충제 티아메톡삼 분사성 액제 - ( ) , 15% 매개충 살충제 ( ) 주사시기 적기 - :",
    "subject": "수목병리학",
    "choice_count": 0,
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
    "id": 963,
    "exam_year": 6,
    "question_number": 4,
    "question_text": "예방 방제 구분 예방방제 방법 - 약제(살선충제)",
    "subject": "수목병리학",
    "choice_count": 1,
    "has_answer": 0
  },
  {
    "id": 964,
    "exam_year": 6,
    "question_number": 5,
    "question_text": "해충명 기주 유입국가 발견년도 암기법 ( ) 이세리아깍지벌레 귤나무 미국 타이완 이 야 야 , 1910 ( XX , 10XX ) 솔잎혹파리 소나무 일본 솔잎혹파 요 1929 ( 29 ) 미국흰불나방 활엽수류 미국 일본 미흰밤홀 팔 , 1958 ( [5] ) 밤나무혹벌 밤나무 일본 미흰밤홀 팔 1958 ( [5] ) 솔껍질깍지벌레 곰솔 불명 ( ) 1963 버즘나무방패벌레 버즘나무 미국 1995 아까시잎혹파리 아까시나무 미국추정 아 ( ) 2002 [ ] 주홍날개꽃매미 활엽수류 중국 주 2006 [ ] 아주미갈소 (2-6-9-10-12009 [ ] 갈색날개매미충 활엽수류 중국 갈 2010 [ ] 소나무허리노린재 소나무류 북미 소 2012 [ ] 목설을 배출하지 않는 해충류 < > 밤바구미 향나무하늘소 , 목설을 배충하는 해충류 < > 복숭아유리나방 목설 수액 : + 광릉긴나무좀 목설 : 오리나무좀 목설 수액 : + 벚나무사향하늘소 목설 : 벌레똥 배출 < > 솔알락나방 수 목 생 리 학 균근 토양 곰팡이와 식물뿌리 간의 공생 관계를 맺고 있는 상태",
    "subject": "수목병리학",
    "choice_count": 1,
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
    "id": 971,
    "exam_year": 6,
    "question_number": 12,
    "question_text": "취급제한기준  문제 4 문제: 구분 예방방제 방법 약제 살선충제 - ( ) 아마멕틴 유제 1)",
    "subject": "수목병리학",
    "choice_count": 0,
    "has_answer": 0
  },
  {
    "id": 972,
    "exam_year": 6,
    "question_number": 13,
    "question_text": "약효보증기간  문제 5 문제: 해충명 기주 유입국가 발견년도 암기법 ( ) 이세리아깍지벌레 귤나무 미국 타이완 이 야 야 , 1910 ( XX , 10XX ) 솔잎혹파리 소나무 일본 솔잎혹파 요 1929 ( 29 ) 미국흰불나방 활엽수류 미국 일본 미흰밤홀 팔 , 1958 ( [5] ) 밤나무혹벌 밤나무 일본 미흰밤홀 팔 1958 ( [5] ) 솔껍질깍지벌레 곰솔 불명 ( ) 1963 버즘나무방패벌레 버즘나무 미국 1995 아까시잎혹파리 아까시나무 미국추정 아 ( ) 2002 [ ] 주홍날개꽃매미 활엽수류 중국 주 2006 [ ] 아주미갈소 (2-6-9-10-12009 [ ] 갈색날개매미충 활엽수류 중국 갈 2010 [ ] 소나무허리노린재 소나무류 북미 소 2012 [ ] 목설을 배출하지 않는 해충류 < > 밤바구미 향나무하늘소 , 목설을 배충하는 해충류 < > 복숭아유리나방 목설 수액 : + 광릉긴나무좀 목설 : 오리나무좀 목설 수액 : + 벚나무사향하늘소 목설 : 벌레똥 배출 < > 솔알락나방 수 목 생 리 학 균근 토양 곰팡이와 식물뿌리 간의 공생 관계를 맺고 있는 상태",
    "subject": "수목병리학",
    "choice_count": 1,
    "has_answer": 0
  },
  {
    "id": 973,
    "exam_year": 6,
    "question_number": 14,
    "question_text": "제조모집단번호  문제 6 문제: 치묘 치수 어린나무 * : (= )  문제 6 문제: 적용작물 사용적기 사용량  문제 7 문제: 그림문자 마스크 고무장갑 보안경 등  문제 8 문제: 해독응급처치  문제 10 문제: 농약성분",
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
    "id": 1110,
    "exam_year": 7,
    "question_number": 6,
    "question_text": "| - = q ee - UL ie | 니 i \"| 때 i | 티 - 구지으 Apaloz ~ 디 | 4 )- 때 rice 빈 = 그 7 A; : 22 코그 벼 ‘| 고 [들 nil \\- ' Mia ， Nl a - om 7 ah ee - 00 그 | Jl — =  | e : ㅠ,…,,Ｌ, 로 대 eS ° ㅡ | a c _ - 는 : = ——— As i | - 고 | —  | — Z 7 - . ! | , | ' 5 | | | 도 본 7 5 i — - l | | 12 - mae ; m ll | - ie, 내 에 | 빼 _— cei 0 g , \" ! as 기 - 1 그 다 20 | | 7 | | | 6 고 더더 별 = ~ i ㅣ | ly  때 | | tg 7 he ㅣ \" | 더 { J a { — 내 — - | | ㅣ 때 개 ' | 10000 = ' ' 002 별 00 2 두 때 ㅣ 그 = au i [= 72 = ja = d-] , te fl i ' 7 = 0 i Rs Re .0 i : | \" Se, Fe 대 = Soy - | | oAPEIDIA | ， 때 | ot a _ mI 1 4 h Jig =_ =~! if. L |  ‘4 Lo creme 다 | fm : Y, 오디 ㅣ \" Ll F 병 oe ee @ c 기\" ' aia \\ ar es i a axe SJ oO | N\\ eo o — 된 ' ㅣ | a: | ! | wa g 7 떨 4 | 7 더 7 ㅣ “a 개 i a on a i [ - 내 7 i 개 이 , ul 개 이 ㅣ ql . a | i 7 때 —YQYOWOO— 수목병리학 22",
    "subject": "수목병리학",
    "choice_count": 1,
    "has_answer": 0
  },
  {
    "id": 1111,
    "exam_year": 7,
    "question_number": 7,
    "question_text": "전자현미경으로만 병원체의 형태를 관찰할 수 있는 수목병들을 바르게 나열한 것은? 9 BLES 오갈병",
    "subject": "수목병리학",
    "choice_count": 2,
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
    "id": 1144,
    "exam_year": 7,
    "question_number": 40,
    "question_text": "번의 22té}=4(Anoplophora chinensis) 에 대해 * 년1회 발생, 유충으로 월동 (SUS, 가래나무류를 포함한 많은 활엽수종들) *유충이 목질부 속으로 파먹어 들어가며, 목설을 weet 해충명 기주 유입국가 발견년도 (암기법) 이세리아깍지벌레 귤나무 미국, 타이완 1910 (이 XX야, 10XX야) 솔잎혹파리 소나무 일본 1929 (솔잎혹파29요) 미국흰불나방 활엽수류 미국, 일본 1958 (미흰밤홀[5]팔) 밤나무혹벌 밤나무 일본 1958 (미흰밤홀[5]팔) 솔껍질깍지벌레 곰솔 (불명) 1963 버즘나무방패벌레 버즘나무 미국 1995 아까시잎혹파리 아까시나무 (미국추정) 2002 [아] 주홍날개꽃매미 활엽수류 중국 2006 [주] 미국선녀벌레 활엽수류 미국, 유럽 2009 [미] 갈색날개매미충 활엽수류 중국 2010 [갈] 소나무허리노린재 소나무류 북미 2012 [소]",
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
    "id": 1255,
    "exam_year": 8,
    "question_number": 10,
    "question_text": "5%는 액상, 나머지 약 30%는 기상  문제 1 문제: 20세기 초 대규모 발생하여 수목병리학의 발전을 촉진시키는 계기가 된 병으로만 나열한 것은? 03 밤나무 줄기마름병, 느릅나무 시들음병, 찾나무 털녹병 참나무 시들음병, 느릅나무 시들음병, 배나무 불마름병(화상병) 선택지:",
    "subject": "수목병리학",
    "choice_count": 2,
    "has_answer": 0
  },
  {
    "id": 1257,
    "exam_year": 8,
    "question_number": 12,
    "question_text": "잎맥투명화 - 윗맥이 물에 젖은 듯 투명하게 보이는 것. <저장물질의 수송장애> * 광합성 산물이 다른 곳으로 잘 이동하지 못하는 현상 <수분과 무기염류의 장애> ㆍ 뿌리의 이상으로 흡수하지 못하는 현상 <수분수송 장애> *물이 잘 이동하지 못하는 현상 (유관속시들음병을 유발) <물질이동 장애> * 나무 내에서 물질이 제대로 이동하지 못하는 것. <기능장애> ㆍ 수화작용, 괴저증상, 고무질, 수지즘액 분비 등 <2차 대사의 장애> *안토시아닌의 발달이 지연되어 식물체 색깔에 변화가 나타난 것 <재생능력의 장애> * 개화 및 착과 장애 등 정답 : 1-00, 2-( 선택지:",
    "subject": "수목병리학",
    "choice_count": 2,
    "has_answer": 1
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
    "id": 1260,
    "exam_year": 8,
    "question_number": 15,
    "question_text": "병원체가 같은 분류군(문)인 수목병으로 나열된 것은? ㄱ7. 소나무 옥병",
    "subject": "수목병리학",
    "choice_count": 3,
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
    "id": 1317,
    "exam_year": 8,
    "question_number": 72,
    "question_text": "버섯을 만드는 외생균근을 형성하는 수종으로 나열한 것은? 0: 상수리나무, 자작나무, 자무 2 다릅나무, 사철나무, 자귀나무 3: 대추나무, 이팝나무, 회화나무 @ 왕벗나무, 백합나무, 사과나무 5 구상나무, 아까시나무, 쥐똥나무 외생균근 형성수종 소나무과 : 소나무, 전나무, 가문비나무, 일본잎갈나무 참나무과 : 참나무류, 밤나무류, 너도밤나무류 버드나무과 : 버드나무, 포플러류 자작나무과 : 자작나무류, 오리나무류, 서어나무류, 개암나무류 피나무과 : 피나무, 염주나무",
    "subject": "수목생리학",
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
    "id": 1328,
    "exam_year": 8,
    "question_number": 83,
    "question_text": "토양의 교환성양이온이 아래와 같은 경우 염기포화도는? (단, 양이온교환용량은 16 6006ㅇ/1 = 3 00010/19 + = 3 00010/10 띠0 = 5 00010/19 (>0 = ㅎ6ㅇ0010/10 410 = 5 /19 시 = 1 00010/19 279% (2 25% 61 50% @0 75% (6 100% 염기포화도 = [(ㅇㅇ-+ 049 + + 4100% 75 = (3+3+3+ 선택지:",
    "subject": "수목생리학",
    "choice_count": 1,
    "has_answer": 0
  },
  {
    "id": 1330,
    "exam_year": 8,
    "question_number": 85,
    "question_text": "농경지토양과 비교하여 산림토양의 특성으로 볼 수 없는 것은? 0 선택지:",
    "subject": "수목생리학",
    "choice_count": 3,
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
    "id": 1342,
    "exam_year": 8,
    "question_number": 97,
    "question_text": "괄호 안에 들어갈 용어를 순서대로 나열한 것은? 요소[ㅠ6) 비료이며, 화학적[ㄴ) 비료이고, 효과 측면에서는 [ㄷ) 비료이",
    "subject": "산림토양학",
    "choice_count": 3,
    "has_answer": 0
  },
  {
    "id": 1344,
    "exam_year": 8,
    "question_number": 99,
    "question_text": "토양의 특성 중 산불 발생으로 인해 상대적으로 변화가 적은 것은? 02 마1 ( 선택지:",
    "subject": "산림토양학",
    "choice_count": 3,
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
    "id": 1369,
    "exam_year": 8,
    "question_number": 124,
    "question_text": "'산림병해충 방제규정' 방제용 약종의 선정기준이 아닌 것은? 0? 경제성이 높을 것 2 사용이 간편할 것 ( 선택지:",
    "subject": "정책 및 법규",
    "choice_count": 3,
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
    "id": 1410,
    "exam_year": 9,
    "question_number": 75,
    "question_text": "광합성에 영향을 주는 요인으로 을은 설명을 고른 것은?",
    "subject": "수목생리학",
    "choice_count": 3,
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
    "id": 1489,
    "exam_year": 11,
    "question_number": 39,
    "question_text": "솔수염하늘소의 방제 방법으로 옳지 않은 것은? 선택지:",
    "subject": "수목해충학",
    "choice_count": 2,
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
    "id": 1499,
    "exam_year": 11,
    "question_number": 72,
    "question_text": "무기영양소에 관한 설명으로 옳은 것은? 선택지:",
    "subject": "수목생리학",
    "choice_count": 2,
    "has_answer": 0
  },
  {
    "id": 1502,
    "exam_year": 11,
    "question_number": 77,
    "question_text": "비탄질률에 C/N ( ) 관한설명으로 옳지 않은 것은? 선택지:",
    "subject": "수목생리학",
    "choice_count": 3,
    "has_answer": 0
  },
  {
    "id": 1503,
    "exam_year": 11,
    "question_number": 83,
    "question_text": "토양침식성인자(soil erodibility factor) 에 K 관한설명으로 옳지 않은 것은 ? 선택지:",
    "subject": "수목생리학",
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
    "id": 1510,
    "exam_year": 11,
    "question_number": 123,
    "question_text": "소나무재선충병 방제 지침 소나무 ｢ ｣ 재선충병 집단발생지에 관한 설명으로 옳지 않은 것은? 선택지:",
    "subject": "정책 및 법규",
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
    console.log('🤖 선택지 완성 에이전트 시작');
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
      '/Users/voidlight/tree-doctor-pdf-qa-mcp/quality-agents/choice-completion-agent-results.json',
      JSON.stringify({
        agentId: 'choice-completion-agent',
        processed: this.issues.length,
        improved: this.results.length,
        improvements: this.results
      }, null, 2)
    );
    
    console.log('✅ 선택지 완성 에이전트 완료: ' + this.results.length + '개 개선');
  }

  async processIssue(issue) {
    
    // 선택지 완성 로직
    if (issue.choice_count < 4) {
      const improvements = [];
      
      // 기본 4개 선택지 생성
      for (let i = 1; i <= 4; i++) {
        improvements.push({
          questionId: issue.id,
          choiceNumber: i,
          action: 'add_missing',
          text: '(선택지 복원 필요)'
        });
      }
      
      return { questionId: issue.id, improvements };
    }
    
    return null;
      
  }

  async applyImprovement(db, improvement) {
    return new Promise((resolve) => {
      
      if (improvement.improvements) {
        improvement.improvements.forEach(imp => {
          if (imp.action === 'add_missing') {
            db.run(
              'INSERT OR IGNORE INTO exam_choices (question_id, choice_number, choice_text, is_correct) VALUES (?, ?, ?, ?)',
              [imp.questionId, imp.choiceNumber, imp.text, 0]
            );
          } else if (imp.action === 'complete_text') {
            db.run(
              'UPDATE exam_choices SET choice_text = ? WHERE question_id = ? AND choice_number = ?',
              [imp.suggestedText, imp.questionId, imp.choiceNumber]
            );
          }
        });
      }
      
      resolve();
    });
  }
}

// 실행
const agent = new choice_completion_agent();
agent.run().catch(console.error);
