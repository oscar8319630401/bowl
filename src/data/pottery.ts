/**
 * 도자기 타임머신 - 콘텐츠 데이터
 *
 * profile: 물레 회전체(LatheGeometry)용 외곽 실루엣 제어점.
 *   r = 중심축에서의 반지름, y = 바닥에서의 높이. 단위는 실물 cm 기준.
 *   바닥 -> 아가리 순서로 정의하며, 벽 두께와 내부는 buildLatheProfile()이 생성한다.
 * hotspot: yFrac(전체 높이 대비 비율) + angleDeg(정면 기준 회전각)로 위치를 지정한다.
 *   실제 3D 좌표는 프로필에서 역산하므로 도자기 표면에 정확히 붙는다.
 */

export type EraId = 'prehistoric' | 'threeKingdoms' | 'unifiedSilla' | 'goryeo' | 'joseon'

export interface Era {
  id: EraId
  name: string
  period: string
  /** 시대 분위기 색 (배경 그라데이션) */
  bg: [string, string]
  accent: string
  tagline: string
}

export interface Hotspot {
  id: string
  /** 전체 높이 대비 위치 (0 = 바닥, 1 = 아가리) */
  yFrac: number
  /** 정면 기준 회전각(도). 0 = 화면 정면 */
  angleDeg: number
  title: string
  body: string
}

export type Glaze = 'earthenware' | 'grayware' | 'celadon' | 'buncheong' | 'porcelain'
export type Pattern =
  | 'comb'
  | 'plain'
  | 'cordon'
  | 'stamped'
  | 'inlayCrane'
  | 'incisedLotus'
  | 'melon'
  | 'buncheongStamped'
  | 'none'
  | 'blueAndWhite'
  | 'ironBrown'

/**
 * 국립중앙박물관이 공개한 실물 3D 스캔 모델.
 * 저작권은 박물관에 있고 출처표시가 필수 조건이므로 credit을 화면에 반드시 노출한다.
 */
export interface ScanModel {
  /** public/ 기준 상대경로. GitHub Pages는 /bowl/ 하위라 절대경로를 쓰면 깨진다. */
  url: string
  credit: string
  /**
   * 스캔 데이터는 Z축을 높이로 쓰는 경우가 많다(Z-up). 앱은 Y-up이라 세워 줘야 한다.
   * 달항아리처럼 높이와 지름이 비슷하면 축을 자동으로 판별할 수 없어 명시한다.
   */
  rotation?: [number, number, number]
}

export interface Pottery {
  id: string
  era: EraId
  name: string
  hanja?: string
  designation?: string
  date: string
  height: string
  museum: string
  /** 있으면 실물 스캔 3D를, 없으면 프로시저럴 회전체를 렌더한다 */
  model?: ScanModel
  /** 한 줄 요약 - 플래시카드 뒷면 */
  summary: string
  /** 3D 뷰어 하단 설명 */
  description: string
  glaze: Glaze
  pattern: Pattern
  /** 참외모양 병처럼 세로 굴곡이 있는 경우 */
  lobes?: number
  profile: { r: number; y: number }[]
  hotspots: Hotspot[]
  /** 퀴즈 오답 유도용 키워드 */
  keywords: string[]
}

export const ERAS: Era[] = [
  {
    id: 'prehistoric',
    name: '선사시대',
    period: '기원전 8000 ~ 기원전 300년',
    bg: ['#3a2a1c', '#6b4c2f'],
    accent: '#d9a066',
    tagline: '흙을 빚어 불에 굽다 — 토기의 시작',
  },
  {
    id: 'threeKingdoms',
    name: '삼국시대',
    period: '기원전 57 ~ 668년',
    bg: ['#2b2622', '#5c4b3d'],
    accent: '#c99a5b',
    tagline: '고구려·백제·신라·가야, 단단한 회청색 토기',
  },
  {
    id: 'unifiedSilla',
    name: '통일신라',
    period: '676 ~ 935년',
    bg: ['#25282a', '#4e5a52'],
    accent: '#9db89f',
    tagline: '도장을 찍어 무늬를 만들다 — 인화문',
  },
  {
    id: 'goryeo',
    name: '고려시대',
    period: '918 ~ 1392년',
    bg: ['#14312b', '#2f6f5c'],
    accent: '#7fd6b0',
    tagline: '비색(翡色) 청자, 세계가 감탄한 푸른 빛',
  },
  {
    id: 'joseon',
    name: '조선시대',
    period: '1392 ~ 1897년',
    bg: ['#2f3238', '#7d8592'],
    accent: '#e8e4d8',
    tagline: '분청사기의 자유분방함, 백자의 절제된 흰빛',
  },
]

export const POTTERY: Pottery[] = [
  // ─────────────────────────── 선사시대 ───────────────────────────
  {
    id: 'comb-pattern-jar',
    era: 'prehistoric',
    name: '빗살무늬토기',
    hanja: '櫛文土器',
    date: '신석기시대 (기원전 4000년경)',
    height: '약 38cm',
    museum: '국립중앙박물관 (서울 암사동 출토)',
    summary: '바닥이 뾰족한 신석기시대 대표 토기. 빗 같은 도구로 무늬를 새겼다.',
    description:
      '신석기시대 사람들이 강가 모래에 꽂아 세워 쓰던 토기다. 바닥이 뾰족한 이유는 땅에 박아 고정하기 위해서다. 표면의 사선 무늬는 빗처럼 생긴 도구로 눌러 그은 것으로, 무늬가 그릇을 더 단단하게 만들어 주는 효과도 있었다.',
    glaze: 'earthenware',
    pattern: 'comb',
    profile: [
      { r: 0, y: 0 },
      { r: 2.6, y: 3 },
      { r: 5.4, y: 8 },
      { r: 8.6, y: 16 },
      { r: 11.2, y: 25 },
      { r: 12.8, y: 33 },
      { r: 13.4, y: 38 },
    ],
    hotspots: [
      {
        id: 'point',
        yFrac: 0.06,
        angleDeg: 0,
        title: '뾰족밑 (첨저)',
        body: '바닥이 뾰족해서 혼자 서지 못한다. 강가나 바닷가 모래밭에 푹 꽂아서 세워 놓고 썼다. 신석기시대 사람들이 물가에 살았다는 증거!',
      },
      {
        id: 'comb',
        yFrac: 0.55,
        angleDeg: 25,
        title: '빗살무늬',
        body: '빗처럼 여러 갈래로 갈라진 도구로 눌러 그은 무늬다. 그냥 예쁘라고 그은 게 아니라, 무늬를 새기면 흙이 다져져서 구울 때 잘 깨지지 않았다.',
      },
      {
        id: 'mouth',
        yFrac: 0.96,
        angleDeg: -30,
        title: '넓은 아가리',
        body: '아가리가 넓어서 도토리나 물고기를 넣고 꺼내기 쉬웠다. 신석기시대의 저장 창고이자 냄비였던 셈.',
      },
    ],
    keywords: ['신석기', '뾰족밑', '암사동'],
  },
  {
    id: 'plain-pottery',
    era: 'prehistoric',
    name: '민무늬토기',
    hanja: '無文土器',
    date: '청동기시대 (기원전 1000년경)',
    height: '약 30cm',
    museum: '국립중앙박물관',
    summary: '무늬를 없애고 바닥을 평평하게 만든 청동기시대 토기.',
    description:
      '청동기시대가 되자 무늬가 사라지고 바닥이 납작해졌다. 농사를 지으며 한곳에 정착해 집 안 평평한 바닥에 놓고 쓰게 됐기 때문이다. 빗살무늬토기보다 두껍고 투박하지만 훨씬 튼튼하다.',
    glaze: 'earthenware',
    pattern: 'plain',
    profile: [
      { r: 6.5, y: 0 },
      { r: 8.2, y: 4 },
      { r: 10.5, y: 12 },
      { r: 11.4, y: 19 },
      { r: 10.8, y: 26 },
      { r: 11.6, y: 30 },
    ],
    hotspots: [
      {
        id: 'flat',
        yFrac: 0.03,
        angleDeg: 0,
        title: '납작한 바닥 (평저)',
        body: '빗살무늬토기와 결정적으로 다른 점! 바닥이 평평해서 혼자 선다. 농사를 짓고 집에 정착하면서 방바닥에 놓고 쓰게 된 것이다.',
      },
      {
        id: 'nopattern',
        yFrac: 0.5,
        angleDeg: 20,
        title: '무늬가 없다',
        body: '이름 그대로 민(=아무것도 없는)무늬. 무늬 새길 시간에 하나라도 더 만들자는 실용주의. 대신 벽이 두꺼워 훨씬 튼튼하다.',
      },
    ],
    keywords: ['청동기', '납작밑', '민무늬'],
  },

  // ─────────────────────────── 삼국시대 ───────────────────────────
  {
    id: 'silla-long-neck-jar',
    era: 'threeKingdoms',
    name: '신라 목 긴 항아리',
    hanja: '長頸壺',
    date: '5 ~ 6세기',
    height: '약 32cm',
    museum: '국립경주박물관',
    summary: '1200도 가마에서 구워낸 회청색 신라 토기. 목이 길고 어깨가 넓다.',
    description:
      '신라는 굴가마(등요)를 이용해 1200도가 넘는 높은 온도로 토기를 구웠다. 그래서 쇠처럼 단단하고 색이 회청색을 띤다. 두드리면 "탱" 하고 금속 소리가 난다. 목이 길어 장경호(長頸壺)라 부른다.',
    glaze: 'grayware',
    pattern: 'cordon',
    profile: [
      { r: 5.5, y: 0 },
      { r: 8.5, y: 2.5 },
      { r: 11.5, y: 7 },
      { r: 12.4, y: 12 },
      { r: 10.6, y: 16.5 },
      { r: 6.2, y: 19.5 },
      { r: 4.8, y: 24 },
      { r: 5.4, y: 28 },
      { r: 7.6, y: 32 },
    ],
    hotspots: [
      {
        id: 'neck',
        yFrac: 0.72,
        angleDeg: 0,
        title: '긴 목 (장경)',
        body: '목이 길어서 "장경호(長頸壺)"다. 목이 좁고 길면 안에 담은 술이나 물이 쉽게 쏟아지지 않고 증발도 덜 된다.',
      },
      {
        id: 'gray',
        yFrac: 0.35,
        angleDeg: 30,
        title: '회청색 경질토기',
        body: '1200도 넘는 굴가마에서 구웠다. 흙 속의 철분이 산소 없이 반응해 회청색이 되고, 돌처럼 단단해진다. 신라의 기술력!',
      },
      {
        id: 'cordon',
        yFrac: 0.52,
        angleDeg: -35,
        title: '어깨의 돌대',
        body: '어깨에 띠처럼 두른 선을 돌대라고 한다. 물레를 돌리며 도구를 대어 만든 자국으로, 장식이면서 그릇을 보강해 준다.',
      },
    ],
    keywords: ['신라', '경질토기', '굴가마'],
  },
  {
    id: 'gaya-mounted-dish',
    era: 'threeKingdoms',
    name: '가야 굽다리접시',
    hanja: '高杯',
    date: '5세기',
    height: '약 20cm',
    museum: '국립김해박물관',
    summary: '높은 굽에 네모난 구멍(투창)을 뚫은 가야의 제사 그릇.',
    description:
      '접시 아래에 높은 굽(다리)을 붙인 그릇으로 고배(高杯)라고도 한다. 굽에 뚫린 네모난 구멍을 투창이라 하는데, 가야는 구멍을 위아래 일직선으로, 신라는 엇갈리게 뚫는 경향이 있어 어느 나라 것인지 구별하는 단서가 된다.',
    glaze: 'grayware',
    pattern: 'stamped',
    profile: [
      { r: 9.6, y: 0 },
      { r: 8.4, y: 1.6 },
      { r: 5.2, y: 5 },
      { r: 3.6, y: 8.5 },
      { r: 3.4, y: 10.5 },
      { r: 5.5, y: 12 },
      { r: 9.2, y: 15.5 },
      { r: 11.4, y: 20 },
    ],
    hotspots: [
      {
        id: 'foot',
        yFrac: 0.2,
        angleDeg: 0,
        title: '높은 굽과 투창',
        body: '굽에 네모난 구멍을 뚫었다. 이걸 투창(透窓)이라고 한다. 구울 때 열이 고루 퍼지게 하고 무게도 줄여 준다. 가야는 구멍을 세로로 나란히, 신라는 엇갈리게 뚫었다.',
      },
      {
        id: 'bowl',
        yFrac: 0.85,
        angleDeg: 25,
        title: '접시 부분',
        body: '음식을 담는 부분. 굽다리접시는 주로 무덤에 넣는 제사용 그릇이었다. 죽은 사람에게 음식을 바치는 의미다.',
      },
    ],
    keywords: ['가야', '고배', '투창'],
  },

  // ─────────────────────────── 통일신라 ───────────────────────────
  {
    id: 'stamped-cinerary-urn',
    era: 'unifiedSilla',
    name: '인화문 뼈단지',
    hanja: '印花文 骨壺',
    date: '8세기',
    height: '약 16cm',
    museum: '국립중앙박물관',
    summary: '도장을 콕콕 찍어 무늬를 낸 통일신라의 화장 유골 항아리.',
    description:
      '불교가 널리 퍼지면서 통일신라에서는 시신을 화장한 뒤 뼈를 담는 그릇이 필요해졌다. 이것이 뼈단지(골호)다. 표면 무늬는 도장을 찍듯 눌러 만든 것으로, 인화문(印花文)이라 한다. 도장 하나로 같은 무늬를 빠르게 반복할 수 있었다.',
    glaze: 'grayware',
    pattern: 'stamped',
    profile: [
      { r: 4.2, y: 0 },
      { r: 6.8, y: 1.5 },
      { r: 8.4, y: 5 },
      { r: 8.2, y: 9 },
      { r: 6.4, y: 12.5 },
      { r: 5.8, y: 14 },
      { r: 6.6, y: 16 },
    ],
    hotspots: [
      {
        id: 'stamp',
        yFrac: 0.4,
        angleDeg: 0,
        title: '인화문 (도장무늬)',
        body: '무늬를 하나하나 그린 게 아니라 도장을 찍어서 만들었다. 작은 꽃·구슬 모양 도장을 촘촘히 눌러 찍으면 순식간에 화려한 무늬가 완성된다. 통일신라의 대량생산 기술!',
      },
      {
        id: 'urn',
        yFrac: 0.9,
        angleDeg: -25,
        title: '왜 뼈단지일까?',
        body: '불교가 국교가 되면서 화장(火葬)이 유행했다. 화장한 뼈를 이 항아리에 담아 묻었다. 거대한 무덤 대신 작은 항아리 하나 — 장례 문화가 완전히 바뀐 것이다.',
      },
    ],
    keywords: ['통일신라', '인화문', '골호'],
  },

  // ─────────────────────────── 고려시대 ───────────────────────────
  {
    id: 'celadon-inlaid-maebyeong',
    era: 'goryeo',
    name: '청자 상감포류수금문 매병',
    hanja: '靑磁 象嵌浦柳水禽文 梅甁',
    date: '고려 (12 ~ 13세기)',
    height: '28.5cm',
    museum: '국립중앙박물관 (덕수5382, 개성 부근 출토)',
    model: {
      url: 'models/celadon-maebyeong.glb',
      credit: '3D 스캔 데이터: 국립중앙박물관 (공공누리 출처표시)',
      rotation: [-Math.PI / 2, 0, 0],
    },
    summary: '물가 버드나무와 물새를 상감으로 새긴 고려 상감청자 매병.',
    description:
      '고려 상감청자를 대표하는 매병이다. 몸통에 물가의 버드나무와 갈대, 그 사이를 노니는 물새를 상감으로 새겼다. 이런 무늬를 포류수금문(浦柳水禽文)이라 한다. 어깨가 넓게 벌어졌다가 아래로 잘록해지는 매병 특유의 S라인이 살아 있다. 실물을 3D로 스캔한 모델이라 유약의 미세한 균열(빙렬)까지 그대로 보인다.',
    glaze: 'celadon',
    pattern: 'inlayCrane',
    profile: [
      { r: 5.0, y: 0 },
      { r: 5.8, y: 1.5 },
      { r: 8.0, y: 6 },
      { r: 9.8, y: 13 },
      { r: 10.2, y: 20 },
      { r: 8.4, y: 24.5 },
      { r: 4.2, y: 26.5 },
      { r: 4.6, y: 27.6 },
      { r: 5.6, y: 28.5 },
    ],
    hotspots: [
      {
        id: 'inlay',
        yFrac: 0.45,
        angleDeg: 0,
        title: '상감 기법 — 이게 바로 상감이야!',
        body: '흙 표면에 무늬를 파낸 뒤, 그 홈에 흰 흙과 붉은 흙을 채워 넣고 긁어낸 다음 청자유를 발라 굽는다. 그러면 유약 아래에 무늬가 박혀 선명하게 비친다. 고려가 도자기에 본격적으로 꽃피운 기법이다.',
      },
      {
        id: 'scene',
        yFrac: 0.55,
        angleDeg: 35,
        title: '포류수금문 (물가 풍경)',
        body: '버드나무(柳)가 늘어진 물가(浦)에 갈대가 자라고, 물새(水禽)가 헤엄친다. 도자기 한 점에 풍경화를 그린 셈이다. 고려 사람들이 좋아한 한가로운 물가 풍경이다.',
      },
      {
        id: 'shoulder',
        yFrac: 0.72,
        angleDeg: -40,
        title: '매병의 어깨',
        body: '어깨가 딱 벌어졌다가 아래로 잘록해지는 S라인이 매병의 핵심이다. 매병은 원래 술이나 꿀 같은 귀한 액체를 담던 병이다.',
      },
      {
        id: 'mouth',
        yFrac: 0.97,
        angleDeg: 0,
        title: '작은 아가리',
        body: '매병은 아가리가 아주 작고 낮다. 내용물이 증발하지 않게 막고 뚜껑을 덮기도 좋다. 아가리가 작으면 매병, 크면 항아리라고 보면 쉽다.',
      },
    ],
    keywords: ['고려', '상감', '매병', '비색'],
  },
  {
    id: 'celadon-melon-bottle',
    era: 'goryeo',
    name: '청자 참외모양 병',
    hanja: '靑磁 瓜形 甁',
    designation: '국보 제94호',
    date: '12세기',
    height: '22.8cm',
    museum: '국립중앙박물관',
    summary: '고려 인종의 무덤에서 나온, 참외를 닮은 순청자 병.',
    description:
      '고려 17대 임금 인종의 무덤(장릉)에서 나온 병이다. 몸통이 참외처럼 세로로 골이 파여 있고, 아가리는 활짝 핀 꽃잎 모양이다. 무늬를 넣지 않고 오로지 형태와 비색(翡色)만으로 승부한 순청자의 절정이다.',
    glaze: 'celadon',
    pattern: 'melon',
    lobes: 8,
    profile: [
      { r: 5.4, y: 0 },
      { r: 4.2, y: 1.6 },
      { r: 5.0, y: 3 },
      { r: 7.4, y: 7 },
      { r: 8.0, y: 11 },
      { r: 6.6, y: 14.5 },
      { r: 2.6, y: 17 },
      { r: 2.4, y: 20 },
      { r: 4.8, y: 22.8 },
    ],
    hotspots: [
      {
        id: 'lobe',
        yFrac: 0.42,
        angleDeg: 0,
        title: '참외 모양 몸통',
        body: '세로로 골을 8개 파서 참외처럼 만들었다. 물레로 둥글게 뽑은 뒤 손으로 눌러 골을 냈다. 빛이 골을 따라 흐르면서 비색이 더 깊어 보인다.',
      },
      {
        id: 'bisaek',
        yFrac: 0.2,
        angleDeg: 35,
        title: '비색(翡色)',
        body: '중국 사람도 "고려 비색이 천하제일"이라고 기록했다. 유약 속 아주 적은 철분이 산소 없는 가마에서 반응하며 이 푸른 옥빛이 난다. 무늬를 안 넣은 건 이 색에 자신이 있었기 때문.',
      },
      {
        id: 'rim',
        yFrac: 0.97,
        angleDeg: -30,
        title: '꽃잎 모양 아가리',
        body: '아가리가 활짝 핀 나팔꽃처럼 벌어져 있다. 좁고 긴 목과 만나 참외 덩굴 같은 느낌을 준다. 형태 자체가 장식인 셈이다.',
      },
    ],
    keywords: ['고려', '순청자', '인종', '비색'],
  },
  {
    id: 'celadon-lotus-maebyeong',
    era: 'goryeo',
    name: '청자 음각연화당초문 매병',
    hanja: '靑磁 陰刻蓮花唐草文 梅甁',
    designation: '국보 제97호',
    date: '12세기',
    height: '43.9cm',
    museum: '국립중앙박물관',
    summary: '유약 아래에 연꽃 넝쿨을 얕게 새겨 넣은 순청자 매병.',
    description:
      '상감이 유행하기 전, 고려는 무늬를 칼로 얕게 파는 음각 기법을 썼다. 연꽃과 넝쿨이 몸통을 감고 올라가는데, 워낙 얕게 새겨서 유약을 바르면 무늬가 물속에 잠긴 듯 은은하게 비친다. 청자의 색을 해치지 않으려는 절제다.',
    glaze: 'celadon',
    pattern: 'incisedLotus',
    profile: [
      { r: 7.6, y: 0 },
      { r: 9.0, y: 2 },
      { r: 12.6, y: 10 },
      { r: 15.0, y: 22 },
      { r: 15.4, y: 31 },
      { r: 12.0, y: 38.5 },
      { r: 6.2, y: 41.5 },
      { r: 6.8, y: 43 },
      { r: 8.6, y: 43.9 },
    ],
    hotspots: [
      {
        id: 'incise',
        yFrac: 0.45,
        angleDeg: 0,
        title: '음각 기법',
        body: '칼로 흙 표면을 얕게 "파내서" 무늬를 만든다. 상감처럼 다른 색 흙을 채우지 않기 때문에 무늬가 유약 아래에서 그림자처럼 은은하게만 보인다.',
      },
      {
        id: 'lotus',
        yFrac: 0.62,
        angleDeg: 35,
        title: '연화당초문',
        body: '연꽃(蓮花)과 넝쿨(唐草)이 이어진 무늬다. 불교에서 연꽃은 깨달음을, 끊기지 않는 넝쿨은 영원함을 뜻한다. 불교 국가 고려의 취향이 그대로 드러난다.',
      },
      {
        id: 'compare',
        yFrac: 0.85,
        angleDeg: -35,
        title: '상감과 뭐가 다를까?',
        body: '음각 = 파기만 함 → 무늬가 흐릿하게 비침. 상감 = 파고 나서 다른 색 흙을 채움 → 무늬가 또렷하게 보임. 국보 68호 매병과 비교해 보면 차이가 확 느껴진다.',
      },
    ],
    keywords: ['고려', '음각', '순청자', '연화당초'],
  },

  // ─────────────────────────── 조선시대 ───────────────────────────
  {
    id: 'buncheong-stamped-jar',
    era: 'joseon',
    name: '분청사기 인화문 항아리',
    hanja: '粉靑沙器 印花文 壺',
    date: '15세기',
    height: '약 28cm',
    museum: '국립중앙박물관',
    summary: '회색 흙에 흰 분을 발라 만든, 청자에서 백자로 가는 길목의 그릇.',
    description:
      '분청사기는 "분장회청사기"의 줄임말로, 회색 흙 위에 흰 흙(백토)을 분처럼 발라 장식한 그릇이다. 고려청자가 무너진 뒤 조선 초 백자로 넘어가는 과도기에 나타났다. 도장을 촘촘히 찍고 백토를 발라 닦아내면 무늬만 하얗게 남는다.',
    glaze: 'buncheong',
    pattern: 'buncheongStamped',
    profile: [
      { r: 6.8, y: 0 },
      { r: 8.6, y: 2 },
      { r: 12.4, y: 8 },
      { r: 13.6, y: 15 },
      { r: 12.2, y: 21 },
      { r: 9.4, y: 25 },
      { r: 9.8, y: 28 },
    ],
    hotspots: [
      {
        id: 'slip',
        yFrac: 0.45,
        angleDeg: 0,
        title: '백토 분장 — 화장한 그릇',
        body: '회색 흙 그릇에 흰 흙을 마치 분(파운데이션)처럼 발랐다. 그래서 이름이 "분장회청사기", 줄여서 분청사기다. 좋은 흙이 없어도 하얗게 보이게 만드는 지혜.',
      },
      {
        id: 'stamp',
        yFrac: 0.68,
        angleDeg: 30,
        title: '인화 기법',
        body: '도장을 빽빽하게 찍어 홈을 낸 뒤 백토를 문질러 바르고 표면을 닦아낸다. 그러면 파인 곳에만 흰 흙이 남아 무늬가 도드라진다. 상감의 대량생산 버전인 셈.',
      },
      {
        id: 'free',
        yFrac: 0.2,
        angleDeg: -35,
        title: '자유분방함',
        body: '청자처럼 완벽하지 않고 삐뚤빼뚤하다. 그런데 그 투박함이 매력이라 일본에서는 분청사기를 "미시마"라 부르며 최고의 찻그릇으로 쳤다.',
      },
    ],
    keywords: ['조선', '분청사기', '백토', '인화'],
  },
  {
    id: 'moon-jar',
    era: 'joseon',
    name: '백자 달항아리',
    hanja: '白磁 壺',
    designation: '국보 제310호',
    date: '18세기',
    height: '43.8cm',
    museum: '국립고궁박물관',
    model: {
      url: 'models/moon-jar.glb',
      credit: '3D 스캔 데이터: 국립중앙박물관 (공공누리 출처표시)',
      rotation: [-Math.PI / 2, 0, 0],
    },
    summary: '보름달을 닮은 순백의 항아리. 위아래를 따로 만들어 붙였다.',
    description:
      '높이가 40cm를 넘는 큰 항아리는 한 번에 물레로 뽑을 수 없다. 그래서 위 반쪽과 아래 반쪽을 따로 만들어 허리에서 이어 붙였다. 그 때문에 완벽한 구가 아니라 살짝 일그러졌는데, 바로 그 어긋남이 달항아리의 아름다움으로 꼽힌다.',
    glaze: 'porcelain',
    pattern: 'none',
    profile: [
      { r: 6.6, y: 0 },
      { r: 8.2, y: 1.5 },
      { r: 14.0, y: 8 },
      { r: 18.6, y: 17 },
      { r: 19.2, y: 22 },
      { r: 17.4, y: 28 },
      { r: 12.6, y: 37 },
      { r: 8.8, y: 42 },
      { r: 9.4, y: 43.8 },
    ],
    hotspots: [
      {
        id: 'seam',
        yFrac: 0.5,
        angleDeg: 0,
        title: '허리의 이음선',
        body: '너무 커서 한 번에 못 만들었다. 사발 두 개를 따로 빚어 허리에서 붙인 것이다. 자세히 보면 가운데에 이어 붙인 흔적이 남아 있다.',
      },
      {
        id: 'asym',
        yFrac: 0.72,
        angleDeg: 35,
        title: '완벽하지 않은 완벽함',
        body: '붙여서 만들었고 구울 때 무게로 살짝 처져서, 어느 쪽에서 봐도 모양이 조금씩 다르다. 이 일그러짐 때문에 "보름달 같다"는 말을 듣는다.',
      },
      {
        id: 'white',
        yFrac: 0.25,
        angleDeg: -35,
        title: '무늬 없는 흰빛',
        body: '그림도 무늬도 없다. 조선은 검소함을 중요하게 여긴 유교 국가였다. 아무것도 그리지 않는 것이 곧 자신감이었다.',
      },
    ],
    keywords: ['조선', '백자', '달항아리', '접합'],
  },
  {
    id: 'blue-plum-bamboo-jar',
    era: 'joseon',
    name: '백자 청화매죽문 항아리',
    hanja: '白磁 靑畵梅竹文 壺',
    designation: '국보 제219호',
    date: '15세기',
    height: '41cm',
    museum: '리움미술관',
    summary: '값비싼 회회청 안료로 매화와 대나무를 그린 조선 전기 청화백자.',
    description:
      '흰 바탕에 푸른 그림을 그린 것을 청화백자라 한다. 파란색을 내는 코발트 안료(회회청)는 페르시아에서 수입해 금값이었다. 그래서 초기 청화백자는 왕실만 쓸 수 있었고, 그림도 도화서 화원이 직접 그렸다.',
    glaze: 'porcelain',
    pattern: 'blueAndWhite',
    profile: [
      { r: 7.4, y: 0 },
      { r: 9.2, y: 2 },
      { r: 13.8, y: 9 },
      { r: 16.4, y: 18 },
      { r: 16.0, y: 24 },
      { r: 13.2, y: 31 },
      { r: 11.0, y: 37 },
      { r: 11.8, y: 41 },
    ],
    hotspots: [
      {
        id: 'cobalt',
        yFrac: 0.45,
        angleDeg: 0,
        title: '회회청 — 금보다 비싼 파랑',
        body: '이 파란색은 코발트 안료로, 페르시아(회회국)에서 수입해 "회회청"이라 불렸다. 같은 무게의 금값이었다고 한다. 그래서 조선은 나중에 국산 코발트를 찾아 헤맸다.',
      },
      {
        id: 'painting',
        yFrac: 0.6,
        angleDeg: 35,
        title: '매화와 대나무',
        body: '매화는 추위를 이기고 가장 먼저 피고, 대나무는 겨울에도 푸르다. 둘 다 선비의 지조를 뜻한다. 도화서 화원이 붓으로 직접 그려서 그림 실력이 남다르다.',
      },
      {
        id: 'underglaze',
        yFrac: 0.22,
        angleDeg: -35,
        title: '유약 아래 그림',
        body: '그림을 먼저 그리고 그 위에 투명한 유약을 덮어 굽는다. 그래서 아무리 만져도 그림이 지워지지 않는다. 이걸 "유하채(釉下彩)"라고 한다.',
      },
    ],
    keywords: ['조선', '청화백자', '회회청', '코발트'],
  },
  {
    id: 'iron-grape-jar',
    era: 'joseon',
    name: '백자 철화포도문 항아리',
    hanja: '白磁 鐵畵葡萄文 壺',
    designation: '국보 제107호',
    date: '18세기',
    height: '53.3cm',
    museum: '이화여자대학교박물관',
    summary: '값비싼 코발트 대신 철 안료로 포도 넝쿨을 그린 대형 항아리.',
    description:
      '전쟁으로 나라가 어려워지자 수입 코발트를 살 수 없게 됐다. 그래서 흔한 철 성분으로 그림을 그렸는데, 구우면 짙은 갈색이 된다. 이것이 철화백자다. 포도 넝쿨을 여백을 살려 시원하게 그린 솜씨가 뛰어나다.',
    glaze: 'porcelain',
    pattern: 'ironBrown',
    profile: [
      { r: 8.6, y: 0 },
      { r: 10.6, y: 2.5 },
      { r: 17.0, y: 12 },
      { r: 20.4, y: 24 },
      { r: 19.6, y: 31 },
      { r: 15.4, y: 41 },
      { r: 13.2, y: 49 },
      { r: 14.2, y: 53.3 },
    ],
    hotspots: [
      {
        id: 'iron',
        yFrac: 0.42,
        angleDeg: 0,
        title: '철화 — 가난이 만든 갈색',
        body: '임진왜란·병자호란 뒤 비싼 코발트를 수입할 수 없었다. 대신 어디에나 있는 철을 안료로 썼다. 구우면 이런 짙은 갈색이 된다. 부족함이 새로운 멋을 만든 것이다.',
      },
      {
        id: 'grape',
        yFrac: 0.62,
        angleDeg: 35,
        title: '포도 넝쿨',
        body: '포도는 알이 많아서 자손이 번성하라는 뜻이다. 여백을 시원하게 남기고 넝쿨만 툭 그린 솜씨가 웬만한 문인화보다 낫다는 평을 받는다.',
      },
      {
        id: 'size',
        yFrac: 0.15,
        angleDeg: -35,
        title: '53cm의 위엄',
        body: '달항아리보다도 크다. 이 정도 크기를 일그러지지 않게 굽는 건 대단한 기술이다. 조선 후기 분원 가마의 실력을 보여 준다.',
      },
    ],
    keywords: ['조선', '철화백자', '포도문'],
  },
]

export const POTTERY_BY_ERA = (era: EraId) => POTTERY.filter((p) => p.era === era)

export const potteryById = (id: string) => POTTERY.find((p) => p.id === id)
