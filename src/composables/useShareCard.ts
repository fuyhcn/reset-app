/**
 * 分享卡片：把「本周恢复指数」渲染成一张精美图片，可分享 / 保存到相册。
 *
 * 设计语言：高级 UI，底部绽放的绿色莲花作为最底层视觉，朦胧柔化、横向充分展开（占宽 ≥70%），
 * 所有内容浮于其上。布局保持：顶部品牌（小圆点）、超细大数字、蓝紫 LEVEL 胶囊、玻璃 2×2 指标卡、底部引号寄语。
 *
 * 主题自适应：自动跟随 App 当前深/浅色模式（读取 <html> 的 .dark 类）。
 *   - 深色：近黑底 + 左上绿光 + 右上紫光，呼应首页顶部深色渐变基调。
 *   - 浅色：浅灰白底 + 左上绿光 + 右上紫光，对齐首页浅色 hero 渐变。
 *
 * 完全离线、无第三方依赖。
 */
import type { RecoveryPart } from './useRecovery'

export interface ShareCardPayload {
  score: number
  parts: RecoveryPart[]
  band: string
  dateLabel: string
}

const FONT = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif'

const W = 1080
const H = 1500

type IconType = 'moon' | 'runner' | 'fork' | 'heart'

interface MetricStyle {
  color: string
  icon: IconType
  label: string
  fallbackStatus: string
}

const METRIC_STYLES: Record<string, MetricStyle> = {
  sleep: { color: '#7C83FF', icon: 'moon', label: '睡眠', fallbackStatus: '睡得不错' }, // 蓝紫
  exercise: { color: '#1FB8A6', icon: 'runner', label: '运动', fallbackStatus: '坚持运动' }, // 青绿（浅色下更清晰）
  smoke: { color: '#F5A623', icon: 'fork', label: '饮食', fallbackStatus: '饮食均衡' }, // 橙色
  control: { color: '#FF6B9D', icon: 'heart', label: '心情', fallbackStatus: '心情愉悦' }, // 粉色
}

/** 当前主题调色板（深 / 浅色自适应） */
interface Palette {
  isDark: boolean
  bg: string
  glowGreen: string
  glowPurple: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  starColor: string
  quoteColor: string
  cardFill0: string
  cardFill1: string
  cardBorder: string
  cardGlowAlpha: number
  cardTextStrong: string
  cardTextMid: string
  cardTextWeak: string
  lotusGlow: string
  lotusBlur: number
  levelFill0: string
  levelFill1: string
  logoRing: string
  logoDot: string
}

const DARK: Palette = {
  isDark: true,
  bg: '#060807',
  glowGreen: 'rgba(52,199,89,0.16)',
  glowPurple: 'rgba(88,86,214,0.12)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.62)',
  textTertiary: 'rgba(255,255,255,0.42)',
  starColor: 'rgba(255,255,255,0.40)',
  quoteColor: 'rgba(255,255,255,0.28)',
  cardFill0: 'rgba(255,255,255,0.07)',
  cardFill1: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardGlowAlpha: 1,
  cardTextStrong: '#FFFFFF',
  cardTextMid: 'rgba(255,255,255,0.82)',
  cardTextWeak: 'rgba(255,255,255,0.45)',
  lotusGlow: 'rgba(45,197,122,0.18)',
  lotusBlur: 7,
  levelFill0: 'rgba(108,140,255,0.10)',
  levelFill1: 'rgba(167,139,250,0.10)',
  logoRing: 'rgba(255,255,255,0.35)',
  logoDot: '#FFFFFF',
}

const LIGHT: Palette = {
  isDark: false,
  bg: '#F2F3F5',
  glowGreen: 'rgba(52,199,89,0.14)',
  glowPurple: 'rgba(88,86,214,0.10)',
  textPrimary: '#1C1C1E',
  textSecondary: 'rgba(28,28,30,0.58)',
  textTertiary: 'rgba(28,28,30,0.38)',
  starColor: 'rgba(28,28,30,0.30)',
  quoteColor: 'rgba(28,28,30,0.22)',
  cardFill0: 'rgba(255,255,255,0.74)',
  cardFill1: 'rgba(255,255,255,0.52)',
  cardBorder: 'rgba(0,0,0,0.06)',
  cardGlowAlpha: 0.42,
  cardTextStrong: '#1C1C1E',
  cardTextMid: 'rgba(28,28,30,0.72)',
  cardTextWeak: 'rgba(28,28,30,0.45)',
  lotusGlow: 'rgba(45,197,122,0.12)',
  lotusBlur: 6,
  levelFill0: 'rgba(108,140,255,0.14)',
  levelFill1: 'rgba(167,139,250,0.14)',
  logoRing: 'rgba(28,28,30,0.30)',
  logoDot: '#1C1C1E',
}

/** 自动获取当前主题：App 给 <html> 加 .dark / .light 类，跟随其即可（含 auto 跟随系统） */
function detectPalette(): Palette {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return DARK
  }
  return LIGHT
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.5, size * 0.18)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - size, y)
  ctx.lineTo(x + size, y)
  ctx.moveTo(x, y - size)
  ctx.lineTo(x, y + size)
  ctx.stroke()
  ctx.restore()
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  type: IconType,
  cx: number,
  cy: number,
  r: number,
  color: string,
) {
  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (type === 'moon') {
    ctx.beginPath()
    ctx.arc(cx - r * 0.18, cy, r, Math.PI * 0.25, Math.PI * 1.75)
    ctx.arc(cx + r * 0.35, cy, r * 0.82, Math.PI * 1.75, Math.PI * 0.25, true)
    ctx.closePath()
    ctx.fill()
  } else if (type === 'runner') {
    ctx.lineWidth = Math.max(3, r * 0.22)
    ctx.beginPath()
    ctx.arc(cx, cy - r * 0.75, r * 0.28, 0, Math.PI * 2)
    ctx.moveTo(cx, cy - r * 0.45)
    ctx.lineTo(cx, cy + r * 0.15)
    ctx.moveTo(cx, cy - r * 0.25)
    ctx.lineTo(cx - r * 0.55, cy - r * 0.05)
    ctx.moveTo(cx, cy - r * 0.25)
    ctx.lineTo(cx + r * 0.45, cy - r * 0.45)
    ctx.moveTo(cx, cy + r * 0.15)
    ctx.lineTo(cx - r * 0.45, cy + r * 0.75)
    ctx.moveTo(cx, cy + r * 0.15)
    ctx.lineTo(cx + r * 0.5, cy + r * 0.75)
    ctx.stroke()
  } else if (type === 'fork') {
    ctx.lineWidth = Math.max(3, r * 0.2)
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.35, cy - r * 0.6)
    ctx.lineTo(cx - r * 0.35, cy + r * 0.4)
    ctx.moveTo(cx - r * 0.55, cy - r * 0.35)
    ctx.lineTo(cx - r * 0.55, cy - r * 0.65)
    ctx.moveTo(cx - r * 0.35, cy - r * 0.35)
    ctx.lineTo(cx - r * 0.35, cy - r * 0.65)
    ctx.moveTo(cx - r * 0.15, cy - r * 0.35)
    ctx.lineTo(cx - r * 0.15, cy - r * 0.65)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + r * 0.25, cy + r * 0.4)
    ctx.lineTo(cx + r * 0.25, cy - r * 0.25)
    ctx.quadraticCurveTo(cx + r * 0.55, cy - r * 0.45, cx + r * 0.55, cy - r * 0.65)
    ctx.stroke()
  } else if (type === 'heart') {
    ctx.beginPath()
    ctx.moveTo(cx, cy + r * 0.55)
    ctx.bezierCurveTo(cx - r * 1.1, cy - r * 0.1, cx - r * 0.5, cy - r * 1.0, cx, cy - r * 0.2)
    ctx.bezierCurveTo(cx + r * 0.5, cy - r * 1.0, cx + r * 1.1, cy - r * 0.1, cx, cy + r * 0.55)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette) {
  ctx.save()
  // 简洁圆点 logo（呼应首页原点），不使用莲花图标
  ctx.strokeStyle = p.logoRing
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(x + 22, y, 22, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = p.logoDot
  ctx.beginPath()
  ctx.arc(x + 22, y, 8, 0, Math.PI * 2)
  ctx.fill()

  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = p.textPrimary
  ctx.font = `700 34px ${FONT}`
  ctx.fillText('正是修行时', x + 58, y - 8)

  ctx.fillStyle = p.textTertiary
  ctx.font = `500 17px ${FONT}`
  ctx.fillText('RESET · REBUILD · RISE', x + 58, y + 22)

  ctx.restore()
}

/**
 * 用图片作为底部莲花背景，并通过「离屏画布缩放 + 顶部蒙版渐变」实现 iOS 兼容的柔光模糊。
 *
 * 为什么不直接用 ctx.filter = 'blur()'？
 * Safari/WebKit（iOS 16+）的 Canvas 2D 完全不支持 ctx.filter，所以会导致莲花在 iPhone 上锐利显示。
 * 这里先把图片画到一张很小的离屏 canvas，再放大回目标尺寸 bilinear upsampling，等效于高斯模糊，
 * 再盖一层背景色渐变蒙版，让顶部渐渐融入卡片背景，避免一个生硬的矩形边界。
 */
const LOTUS_IMAGE_PATH = '/bgicon.png'
// 模糊强度：源图缩放到 12% 再 upsample 回主画布，得到柔和但不丢失轮廓的朦胧感
const BLUR_DOWN = 0.065

let lotusImage: HTMLImageElement | null = null
let blurredLotusCache: HTMLCanvasElement | null = null

function loadLotusImage(): Promise<HTMLImageElement> {
  if (lotusImage) return Promise.resolve(lotusImage)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { lotusImage = img; resolve(img) }
    img.onerror = () => reject(new Error(`Failed to load ${LOTUS_IMAGE_PATH}`))
    img.src = LOTUS_IMAGE_PATH
  })
}

function buildBlurredLotus(img: HTMLImageElement, targetWidth: number, targetHeight: number): HTMLCanvasElement {
  if (blurredLotusCache) return blurredLotusCache

  const offW = Math.max(1, Math.floor(targetWidth * BLUR_DOWN))
  const offH = Math.max(1, Math.floor(targetHeight * BLUR_DOWN))

  // 第一层：小尺寸离屏绘制（缩放产生模糊）
  const off = document.createElement('canvas')
  off.width = offW
  off.height = offH
  const octx = off.getContext('2d')
  if (!octx) throw new Error('Cannot get 2D context for offscreen canvas')
  octx.imageSmoothingEnabled = true
  octx.imageSmoothingQuality = 'high'
  octx.drawImage(img, 0, 0, offW, offH)

  // 第二层：放大回目标尺寸，上采样 ≈ 柔光模糊
  const out = document.createElement('canvas')
  out.width = Math.floor(targetWidth)
  out.height = Math.floor(targetHeight)
  const octx2 = out.getContext('2d')
  if (!octx2) throw new Error('Cannot get 2D context for blurred canvas')
  octx2.imageSmoothingEnabled = true
  octx2.imageSmoothingQuality = 'high'
  octx2.drawImage(off, 0, 0, out.width, out.height)

  blurredLotusCache = out
  return out
}

async function drawBottomLotus(ctx: CanvasRenderingContext2D, p: Palette) {
  const img = await loadLotusImage()
  const targetWidth = W * 0.95
  const targetHeight = targetWidth * (img.height / img.width)
  const drawX = (W - targetWidth) / 2
  const drawY = H - targetHeight + 50

  // 背景莲花层：使用品牌图片，经过离屏模糊处理（iOS 兼容）
  const blurred = buildBlurredLotus(img, targetWidth, targetHeight)

  ctx.save()
  ctx.globalAlpha = 0.78
  ctx.drawImage(blurred, drawX, drawY, targetWidth, targetHeight)
  ctx.restore()

  // 蒙版层：把莲花顶部渐渐融入卡片背景，避免一个生硬的矩形边界
  const maskTop = Math.max(0, drawY - 80)
  const mask = ctx.createLinearGradient(0, maskTop, 0, H)
  mask.addColorStop(0, hexToRgba(p.bg, 1))
  mask.addColorStop(0.15, hexToRgba(p.bg, 0.6))
  mask.addColorStop(0.45, hexToRgba(p.bg, 0.12))
  mask.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = mask
  ctx.fillRect(0, maskTop, W, H - maskTop)

  // 底部绿色柔光晕，增强品牌氛围
  const glow = ctx.createRadialGradient(
    W / 2, H, 20,
    W / 2, H - targetHeight * 0.5, targetWidth * 0.65
  )
  glow.addColorStop(0, p.lotusGlow)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
}
function drawLevelBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  p: Palette,
) {
  ctx.save()
  roundRect(ctx, x, y, width, height, height / 2)

  const fill = ctx.createLinearGradient(x, y, x + width, y)
  fill.addColorStop(0, p.levelFill0)
  fill.addColorStop(1, p.levelFill1)
  ctx.fillStyle = fill
  ctx.fill()

  const stroke = ctx.createLinearGradient(x, y, x + width, y)
  stroke.addColorStop(0, '#6C8CFF')
  stroke.addColorStop(1, '#A78BFA')
  ctx.strokeStyle = stroke
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = p.textPrimary
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 28px ${FONT}`
  ctx.fillText(text, x + width / 2, y + height / 2 + 1)

  // 右侧闪电（缩小一点并往右挪，避免短文字像被截断）
  const bx = x + width - 44
  const by = y + height / 2
  const sc = 0.8
  ctx.beginPath()
  ctx.moveTo(bx - 4 * sc, by - 12 * sc)
  ctx.lineTo(bx + 6 * sc, by - 2 * sc)
  ctx.lineTo(bx + 2 * sc, by - 2 * sc)
  ctx.lineTo(bx + 8 * sc, by + 12 * sc)
  ctx.lineTo(bx - 4 * sc, by + 2 * sc)
  ctx.lineTo(bx, by + 2 * sc)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

function drawMetricCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  part: RecoveryPart,
  p: Palette,
) {
  const s = METRIC_STYLES[part.key] || METRIC_STYLES.sleep

  ctx.save()
  roundRect(ctx, x, y, w, h, 24)
  ctx.clip()

  // 玻璃底：均匀半透明，微上亮下暗
  const bg = ctx.createLinearGradient(x, y, x, y + h)
  bg.addColorStop(0, p.cardFill0)
  bg.addColorStop(1, p.cardFill1)
  ctx.fillStyle = bg
  ctx.fillRect(x, y, w, h)

  // 右下角对应色渐变晕染（浅色模式下降低浓度）
  const glow = ctx.createRadialGradient(x + w, y + h, 8, x + w, y + h, w * 0.95)
  glow.addColorStop(0, hexToRgba(s.color, 0.32 * p.cardGlowAlpha))
  glow.addColorStop(0.45, hexToRgba(s.color, 0.09 * p.cardGlowAlpha))
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(x, y, w, h)

  ctx.restore()

  // 顶部极细高光边
  ctx.fillStyle = p.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)'
  ctx.fillRect(x + 24, y, w - 48, 1)

  // 干净边框
  roundRect(ctx, x, y, w, h, 24)
  ctx.strokeStyle = p.cardBorder
  ctx.lineWidth = 1
  ctx.stroke()

  // 图标 + 标签
  drawIcon(ctx, s.icon, x + 44, y + 60, 14, s.color)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = p.cardTextMid
  ctx.font = `600 26px ${FONT}`
  ctx.fillText(s.label, x + 70, y + 60)

  // 大百分比
  const pct = `${Math.round(part.ratio * 100)}`
  ctx.fillStyle = p.cardTextStrong
  ctx.textBaseline = 'alphabetic'
  ctx.font = `200 76px ${FONT}`
  const pw = ctx.measureText(pct).width
  ctx.fillText(pct, x + 34, y + 138)

  ctx.fillStyle = p.cardTextWeak
  ctx.font = `400 30px ${FONT}`
  ctx.fillText('%', x + 34 + pw + 8, y + 130)

  // 底部状态短句
  ctx.fillStyle = p.cardTextWeak
  ctx.font = `400 22px ${FONT}`
  ctx.fillText(part.detail || s.fallbackStatus, x + 34, y + 176)
}

function levelInfo(score: number): { level: number; title: string } {
  if (score >= 95) return { level: 7, title: '觉醒者' }
  if (score >= 85) return { level: 6, title: '掌控者' }
  if (score >= 75) return { level: 5, title: '重建者' }
  if (score >= 65) return { level: 4, title: '重启者' }
  if (score >= 50) return { level: 3, title: '修复者' }
  if (score >= 35) return { level: 2, title: '探索者' }
  return { level: 1, title: '启程者' }
}

function dateParts(): { md: string; y: string } {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return { md: `${m}.${d}`, y: String(now.getFullYear()) }
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

/** 把分享卡片绘制到给定 canvas（导出尺寸 1080×1500，按设备像素比 2x 渲染保证清晰） */
export async function renderShareCard(
  canvas: HTMLCanvasElement,
  data: ShareCardPayload,
) {
  const dpr = Math.min(
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    2,
  )

  canvas.width = W * dpr
  canvas.height = H * dpr

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, W, H)

  const p = detectPalette()

  // ===================================
  // 背景：跟随 App 主题（深/浅），呼应首页顶部渐变（左上绿光 + 右上紫光）
  // ===================================
  ctx.fillStyle = p.bg
  ctx.fillRect(0, 0, W, H)

  const gTop = ctx.createRadialGradient(120, 40, 20, 120, 40, 620)
  gTop.addColorStop(0, p.glowGreen)
  gTop.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gTop
  ctx.fillRect(0, 0, W, H)

  const gPurple = ctx.createRadialGradient(W - 120, 80, 20, W - 120, 80, 560)
  gPurple.addColorStop(0, p.glowPurple)
  gPurple.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gPurple
  ctx.fillRect(0, 0, W, H)

  // ===================================
  // 最底层：绽放莲花（朦胧、占宽≥70%）
  // ===================================
  await drawBottomLotus(ctx, p)

  // ===================================
  // 顶部品牌（小圆点）
  // ===================================
  drawLogo(ctx, 68, 92, p)

  const { md, y } = dateParts()
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = p.textPrimary
  ctx.font = `300 40px ${FONT}`
  ctx.fillText(md, W - 72, 92)
  ctx.fillStyle = p.textTertiary
  ctx.font = `400 24px ${FONT}`
  ctx.fillText(y, W - 72, 126)

  // ===================================
  // 标题：本周恢复指数
  // ===================================
  const titleY = 330
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = p.textSecondary
  ctx.font = `500 30px ${FONT}`
  const titleText = '本周恢复指数'
  const titleW = ctx.measureText(titleText).width
  ctx.fillText(titleText, W / 2, titleY)
  drawStar(ctx, W / 2 - titleW / 2 - 18, titleY, 7, p.starColor)
  drawStar(ctx, W / 2 + titleW / 2 + 18, titleY, 7, p.starColor)

  // ===================================
  // 大数字（无极光）
  // ===================================
  ctx.fillStyle = p.textPrimary
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `200 330px ${FONT}`
  ctx.fillText(String(data.score), W / 2, 600)

  ctx.fillStyle = p.textTertiary
  ctx.font = `300 42px ${FONT}`
  ctx.fillText('/100', W / 2, 665)

  // ===================================
  // LEVEL 胶囊
  // ===================================
  const { level, title } = levelInfo(data.score)
  const levelText = `LEVEL 0${level} · ${title}`
  ctx.font = `600 28px ${FONT}`
  const levelW = ctx.measureText(levelText).width + 130
  const levelX = (W - levelW) / 2
  const levelY = 715
  drawLevelBadge(ctx, levelText, levelX, levelY, levelW, 58, p)

  // 小标语
  const mottoY = 815
  ctx.font = `400 26px ${FONT}`
  ctx.fillStyle = p.textSecondary
  ctx.textBaseline = 'middle'
  const mottoText = '正在重新掌控生活'
  const mottoW = ctx.measureText(mottoText).width
  ctx.fillText(mottoText, W / 2, mottoY)
  drawStar(ctx, W / 2 - mottoW / 2 - 14, mottoY, 6, p.starColor)
  drawStar(ctx, W / 2 + mottoW / 2 + 14, mottoY, 6, p.starColor)

  // ===================================
  // 2×2 数据卡片
  // ===================================
  const cardW = 450
  const cardH = 188
  const gap = 32
  const startX = 72
  const startY = 865

  data.parts.slice(0, 4).forEach((part, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = startX + col * (cardW + gap)
    const yy = startY + row * (cardH + gap)
    drawMetricCard(ctx, x, yy, cardW, cardH, part, p)
  })

  // ===================================
  // 底部：引号寄语 + 品牌（浮于莲花之上）
  // ===================================
  const bottomText = '今天比昨天更接近自己'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.font = `600 38px ${FONT}`
  const tw = ctx.measureText(bottomText).width

  ctx.fillStyle = p.quoteColor
  ctx.font = `400 44px ${FONT}`
  ctx.fillText('「', W / 2 - tw / 2 - 36, 1392)
  ctx.fillText('」', W / 2 + tw / 2 + 36, 1392)

  ctx.fillStyle = p.textPrimary
  ctx.font = `600 38px ${FONT}`
  ctx.fillText(bottomText, W / 2, 1392)

  ctx.fillStyle = p.textTertiary
  ctx.font = `400 26px ${FONT}`
  ctx.fillText('正是修行时', W / 2, 1448)
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

/** 分享：优先 Web Share API 携带图片文件；不支持则降级下载 */
export async function shareCardAsImage(
  canvas: HTMLCanvasElement,
  filename: string,
  shareText: string,
): Promise<'shared' | 'saved' | 'failed'> {
  const blob = await canvasToBlob(canvas)
  if (!blob) return 'failed'
  const file = new File([blob], filename, { type: 'image/png' })
  const navAny = navigator as unknown as {
    canShare?: (data: { files: File[] }) => boolean
    share?: (data: { files: File[]; title: string; text: string }) => Promise<void>
  }
  if (typeof navAny.canShare === 'function' && navAny.canShare({ files: [file] }) && typeof navAny.share === 'function') {
    try {
      await navAny.share({ files: [file], title: '正是修行时', text: shareText })
      return 'shared'
    } catch {
      // 用户取消或其他原因 → 降级下载
    }
  }
  await saveCardImage(canvas, filename)
  return 'saved'
}

/** 保存：导出 PNG 并触发下载 */
export async function saveCardImage(canvas: HTMLCanvasElement, filename: string): Promise<boolean> {
  const blob = await canvasToBlob(canvas)
  if (!blob) return false
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
