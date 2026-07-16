import type { Pottery } from '../data/pottery'

/**
 * 카드/갤러리/플래시카드/퀴즈에 쓰는 도자기 썸네일.
 * public/thumbs/<id>.webp — 실제 3D를 렌더해 뽑은 이미지라 상세 화면과 형태가 일치한다.
 * (스캔 3점은 실물 스캔, 나머지는 무늬가 입혀진 프로시저럴 3D)
 * scripts는 verify/thumbs.mjs로 재생성한다.
 */
export function thumbUrl(pottery: Pottery | string): string {
  const id = typeof pottery === 'string' ? pottery : pottery.id
  return `${import.meta.env.BASE_URL}thumbs/${id}.webp`
}
