import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import axios from 'axios';
import { astro } from 'iztro';
import type { IFunctionalPalace } from 'iztro/lib/astro/FunctionalPalace';
import ReactMarkdown, { type Components } from 'react-markdown';
import Toast from './Toast';
import type { AIInterpretProps, FormRawData, Settings, ToastState, ToastType } from '../types';

const SETTINGS_STORAGE_KEY = 'zwds-settings';

const DEFAULT_SETTINGS: Settings = {
  hideTransitStars: false,
  hideHoroscope: false,
  hideBirthTime: false,
  yearDivide: 'normal',
  horoscopeDivide: 'exact',
  ageDivide: 'normal',
  dayDivide: 'current',
  algorithm: 'default',
};

const PALACE_NAMES = [
  '命宫',
  '兄弟',
  '夫妻',
  '子女',
  '财帛',
  '疾厄',
  '迁移',
  '仆役',
  '官禄',
  '田宅',
  '福德',
  '父母',
] as const;

type PalaceName = typeof PALACE_NAMES[number];

const FIXED_TARGET_PALACES: PalaceName[] = ['命宫'];
const OPTIONAL_PALACES: PalaceName[] = PALACE_NAMES.filter(
  (name) => !FIXED_TARGET_PALACES.includes(name),
);

const AI_ENDPOINT = '/api/interpret';

const SYSTEM_PROMPT = [
  '你是紫微斗数解盘助手，输出中文 Markdown。',
  '不要写前言或开场说明，直接进入解读内容。',
  '避免绝对化断言，使用“倾向/可能/易于”等表述。',
  '严格按顺序输出以下章节（使用二级标题）：',
  '1) 找命宫',
  '2) 看主星',
  '3) 看三方四正',
  '4) 看福德宫',
  '5) 看生年四化',
  '6) 看宫干四化',
  '7) 性格推演',
  '8) 目标宫位（命宫固定+手动补充）',
  '9) 运限（大限/流年/流日）',
  '10) 总结建议',
  '若数据缺失，请明确说明缺失项，不要编造。',
].join('\n');

const markdownComponents: Components = {
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-lz-ink font-serif mt-6 mb-3 pb-1 border-b border-lz-ink/10 flex items-center gap-2" {...props}>
      <span className="inline-block w-1.5 h-6 bg-lz-red rounded-full"></span>
      {props.children}
    </h2>
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-semibold text-lz-ink/90 font-serif mt-5 mb-2 ml-1" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="mb-4 leading-relaxed text-lz-ink/90 tracking-wide font-light" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="space-y-2 mb-4 list-none pl-1" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1 text-lz-ink/90" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="relative pl-5 leading-relaxed text-lz-ink/90 before:content-['•'] before:absolute before:left-0 before:text-lz-red before:font-bold" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <strong className="text-lz-red font-semibold bg-lz-red/5 px-1 rounded mx-0.5" {...props} />
  ),
  pre: ({ node, ...props }) => (
    <pre className="bg-lz-paper-dark/50 border border-lz-ink/10 p-3 rounded-lg overflow-auto mb-4 text-sm font-mono" {...props} />
  ),
  code: ({ node, className, ...props }) => {
    const isInline = !className?.includes('language-');
    return (
      <code
        className={[
          isInline ? 'px-1.5 py-0.5 bg-lz-paper-dark/50 rounded text-lz-red-dark text-sm border border-lz-ink/5' : 'text-sm',
          className ?? '',
        ].join(' ')}
        {...props}
      />
    );
  },
};

const getChineseHourIndex = (hour: number) => {
  if (hour >= 23 || hour < 1) return 0;
  return Math.floor((hour + 1) / 2);
};

const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(savedSettings) as Settings) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
};

const formatStar = (star: { name: string; brightness?: string; mutagen?: string }) => {
  const tags: string[] = [];
  if (star.brightness) tags.push(star.brightness);
  if (star.mutagen) tags.push(`化${star.mutagen}`);
  return tags.length ? `${star.name}(${tags.join('·')})` : star.name;
};

const collectPalaceMutagens = (palace: IFunctionalPalace | undefined) => {
  const mutagens: Record<string, string[]> = { 禄: [], 权: [], 科: [], 忌: [] };
  if (!palace) return mutagens;

  const addStar = (star: { name: string; mutagen?: string }) => {
    if (!star.mutagen || !mutagens[star.mutagen]) return;
    const label = star.name;
    if (!mutagens[star.mutagen].includes(label)) {
      mutagens[star.mutagen].push(label);
    }
  };

  palace.majorStars.forEach(addStar);
  palace.minorStars.forEach(addStar);
  palace.adjectiveStars.forEach(addStar);
  return mutagens;
};

const formatDateStr = (raw: FormRawData) => {
  const year = parseInt(raw.year, 10);
  const month = parseInt(raw.month, 10);
  const day = parseInt(raw.day, 10);
  return `${year}-${month}-${day}`;
};

const summarizeMutagedPlaces = (palace: IFunctionalPalace | undefined) => {
  if (!palace) return null;
  const mutaged = palace.mutagedPlaces();
  const labels = ['禄', '权', '科', '忌'] as const;
  return labels.reduce<Record<string, string | null>>((acc, label, index) => {
    acc[label] = mutaged[index]?.name ?? null;
    return acc;
  }, {});
};

const summarizePalace = (palace: IFunctionalPalace | undefined) => {
  if (!palace) return null;
  return {
    name: palace.name,
    index: palace.index,
    heavenlyStem: palace.heavenlyStem,
    earthlyBranch: palace.earthlyBranch,
    isBodyPalace: palace.isBodyPalace,
    isOriginalPalace: palace.isOriginalPalace,
    isEmpty: palace.isEmpty(),
    majorStars: palace.majorStars.map((star) => formatStar(star)),
    minorStars: palace.minorStars.map((star) => formatStar(star)),
    adjectiveStars: palace.adjectiveStars.map((star) => formatStar(star)),
    mutagens: collectPalaceMutagens(palace),
  };
};

const buildUserPrompt = (payload: unknown) => (
  [
    '以下是紫微斗数命盘结构化数据，请据此解读：',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
  ].join('\n')
);

const MODAL_STYLE = {
  '--panel-bg': 'linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(255, 245, 235) 100%)',
  '--panel-border': 'rgba(65, 40, 24, 0.12)',
  '--panel-shadow': '0 28px 70px rgba(66, 36, 20, 0.22)',
  '--accent': 'rgba(196, 75, 45, 1)',
  '--accent-soft': 'rgba(196, 75, 45, 0.12)',
  '--ink': 'rgba(44, 30, 22, 0.95)',
  '--ink-soft': 'rgba(44, 30, 22, 0.62)',
  '--paper': 'rgb(255, 255, 255)',
  '--paper-strong': 'rgb(255, 255, 255)',
} as CSSProperties;

const MODAL_SHELL = 'relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-[28px] border border-[var(--panel-border)] bg-[var(--panel-bg)] overflow-hidden';
const HEADER_BAR = 'relative flex items-start justify-between px-6 sm:px-10 pt-6 pb-5 border-b border-[var(--panel-border)] bg-[var(--paper-strong)] backdrop-blur-xl';
const CONTENT_AREA = 'flex-1 overflow-y-auto px-6 sm:px-10 py-6 custom-scrollbar bg-[var(--paper-strong)]';
const SECTION_CARD = 'relative rounded-2xl border border-[var(--panel-border)] bg-[var(--paper)] p-5 sm:p-6 shadow-[0_12px_30px_rgba(65,40,24,0.08)]';
const CHIP_BASE = 'flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-sm font-serif transition-all duration-300 select-none';
const CHIP_ACTIVE = 'bg-[var(--accent)] text-white border-transparent shadow-[0_10px_20px_rgba(196,75,45,0.22)]';
const CHIP_INACTIVE = 'bg-white/70 text-[color:var(--ink-soft)] border-[var(--panel-border)] hover:text-[color:var(--ink)] hover:border-[var(--accent)]';
const CHIP_FIXED = 'bg-[var(--accent-soft)] text-[color:var(--ink)] border-transparent cursor-default';
const CTA_BUTTON = 'group relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-base sm:text-lg font-serif text-white transition-all duration-300 bg-[radial-gradient(circle_at_top,#f3c08a,transparent_55%),linear-gradient(120deg,#c44b2d,#8f2f18)] shadow-[0_18px_35px_rgba(154,54,30,0.35)] hover:shadow-[0_22px_45px_rgba(154,54,30,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95';


export default function AIInterpret({
  data,
  onClose,
  isModal = false,
  initialResult = null,
  onInterpretComplete,
}: AIInterpretProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ isVisible: false, message: '', type: 'success' });
  const [extraTargetPalaces, setExtraTargetPalaces] = useState<PalaceName[]>([]);
  const loadingRef = useRef(false);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ isVisible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  useEffect(() => {
    setResult(initialResult ?? null);
  }, [initialResult, data]);

  const targetPalaces = useMemo(
    () => Array.from(new Set([...FIXED_TARGET_PALACES, ...extraTargetPalaces])),
    [extraTargetPalaces],
  );

  const toggleExtraTarget = (palace: PalaceName) => {
    setExtraTargetPalaces((prev) => (
      prev.includes(palace) ? prev.filter((item) => item !== palace) : [...prev, palace]
    ));
  };

  const buildAnalysisPayload = useCallback(() => {
    const settings = loadSettings();
    const timeIndex = getChineseHourIndex(data.raw.hour);
    const astrolabe = astro.withOptions({
      type: data.raw.type,
      dateStr: formatDateStr(data.raw),
      timeIndex,
      gender: data.gender,
      isLeapMonth: false,
      fixLeap: data.raw.fixLeap,
      language: 'zh-CN',
      config: {
        yearDivide: settings.yearDivide,
        horoscopeDivide: settings.horoscopeDivide,
        ageDivide: settings.ageDivide,
        dayDivide: settings.dayDivide,
        algorithm: settings.algorithm,
      },
    });

    // ... (Use same logic as before for payload construction - abbreviated for brevity but keeping core)
    // Actually need to include it all for it to work
    const horoscope = astrolabe.horoscope(new Date());
    const soulPalace = astrolabe.palace('命宫');
    const bodyPalace = astrolabe.palaces.find((palace) => palace.isBodyPalace);
    const fortunePalace = astrolabe.palace('福德');
    const surfacePalace = astrolabe.palace('迁移');

    const collectMutagenMap = () => {
      const mutagenMap: Record<string, string[]> = { 禄: [], 权: [], 科: [], 忌: [] };
      astrolabe.palaces.forEach((palace) => {
        const addStar = (star: { name: string; mutagen?: string }) => {
          if (!star.mutagen || !mutagenMap[star.mutagen]) return;
          const label = `${palace.name}-${star.name}`;
          if (!mutagenMap[star.mutagen].includes(label)) {
            mutagenMap[star.mutagen].push(label);
          }
        };

        palace.majorStars.forEach(addStar);
        palace.minorStars.forEach(addStar);
        palace.adjectiveStars.forEach(addStar);
      });
      return mutagenMap;
    };

    const summarizeSurrounded = (palaceName: PalaceName | '命宫') => {
      const surrounded = astrolabe.surroundedPalaces(palaceName);
      return {
        target: summarizePalace(surrounded.target),
        opposite: summarizePalace(surrounded.opposite),
        wealth: summarizePalace(surrounded.wealth),
        career: summarizePalace(surrounded.career),
      };
    };

    const formatHoroscope = (item: {
      index: number;
      name: string;
      heavenlyStem: string;
      earthlyBranch: string;
      palaceNames: string[];
      mutagen: string[];
    }) => ({
      index: item.index,
      name: item.name,
      heavenlyStem: item.heavenlyStem,
      earthlyBranch: item.earthlyBranch,
      palaceNames: item.palaceNames,
      mutagen: item.mutagen,
    });

    const targetDetails = targetPalaces.reduce<Record<string, unknown>>((acc, palaceName) => {
      const palace = astrolabe.palace(palaceName);
      acc[palaceName] = {
        palace: summarizePalace(palace),
        palaceMutagens: summarizeMutagedPlaces(palace),
        surrounded: summarizeSurrounded(palaceName),
      };
      return acc;
    }, {});

    return {
      基础信息: {
        name: data.name,
        gender: data.gender === 'male' ? '男' : '女',
        solarDate: astrolabe.solarDate,
        lunarDate: astrolabe.lunarDate,
        chineseDate: astrolabe.chineseDate,
        time: astrolabe.time,
        timeRange: astrolabe.timeRange,
        zodiac: astrolabe.zodiac,
        sign: astrolabe.sign,
        soul: astrolabe.soul,
        body: astrolabe.body,
        soulPalaceEarthlyBranch: astrolabe.earthlyBranchOfSoulPalace,
        bodyPalaceEarthlyBranch: astrolabe.earthlyBranchOfBodyPalace,
      },
      命身与性格参考: {
        命宫: summarizePalace(soulPalace),
        身宫: summarizePalace(bodyPalace),
        福德宫: summarizePalace(fortunePalace),
        迁移宫: summarizePalace(surfacePalace),
      },
      命宫三方四正: summarizeSurrounded('命宫'),
      生年四化: collectMutagenMap(),
      宫干四化: targetPalaces.reduce<Record<string, unknown>>((acc, palaceName) => {
        acc[palaceName] = summarizeMutagedPlaces(astrolabe.palace(palaceName));
        return acc;
      }, {}),
      目标宫位: {
        固定: FIXED_TARGET_PALACES,
        补充: extraTargetPalaces,
        详情: targetDetails,
      },
      运限: {
        solarDate: horoscope.solarDate,
        lunarDate: horoscope.lunarDate,
        decadal: formatHoroscope(horoscope.decadal),
        yearly: formatHoroscope(horoscope.yearly),
        daily: formatHoroscope(horoscope.daily),
      },
      十二宫总览: astrolabe.palaces.map((palace) => summarizePalace(palace)),
    };
  }, [data, targetPalaces, extraTargetPalaces]);

  const handleAnalyze = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setResult(null);
    setLoading(true);
    try {
      const payload = buildAnalysisPayload();
      const response = await axios.post(AI_ENDPOINT, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(payload) },
        ],
        temperature: 0.7,
      });

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty AI response');
      }
      const trimmedContent = content.trim();
      setResult(trimmedContent);
      onInterpretComplete?.(trimmedContent);
    } catch (error) {
      console.error('AI interpret failed:', error);
      showToast('AI 解读失败，请稍后重试', 'error');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [buildAnalysisPayload, showToast]);

  return (
    <div
      className={`${MODAL_SHELL} ${isModal ? '' : 'mt-8'}`}
      style={{ ...MODAL_STYLE, boxShadow: 'var(--panel-shadow)' }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(196,75,45,0.16),transparent_55%)] opacity-70"></div>
        <div className="absolute top-28 -left-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_45%_45%,rgba(213,157,90,0.18),transparent_60%)] opacity-80"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.5),transparent_45%)] opacity-70"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[color:var(--accent)] to-transparent opacity-50"></div>
      </div>

      {/* Header */}
      <div className={HEADER_BAR}>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[color:var(--accent)] shadow-[0_8px_18px_rgba(196,75,45,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.39 4.84 5.34.78-3.86 3.77.91 5.32L12 14.9l-4.78 2.51.91-5.32L4.27 7.62l5.34-.78L12 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-serif tracking-wide text-[color:var(--ink)]">紫微斗数</h3>
              <p className="text-sm text-[color:var(--ink-soft)]">深度推演 · 命盘解读</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--ink-soft)]">
            <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[color:var(--ink)]">命宫为核心</span>
            <span>可手动补充其他宫位进行重点推演</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="relative z-10 h-10 w-10 flex items-center justify-center rounded-full border border-[var(--panel-border)] bg-white/70 text-[color:var(--ink-soft)] transition-all duration-300 hover:text-[color:var(--accent)] hover:border-[var(--accent)] hover:bg-white"
            aria-label="关闭解读"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--accent)] to-transparent opacity-40"></div>
      </div>

      {/* Content Area */}
      <div className={CONTENT_AREA}>
        {!result ? (
          <div className="animate-fadeIn space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:grid-rows-2">
              <div className={`${SECTION_CARD} lg:col-start-1 lg:row-start-1`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-base font-semibold tracking-wide text-[color:var(--ink)]">核心分析维度</h4>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">固定为命宫，作为解读的核心基准</p>
                  </div>
                  <span className="rounded-full border border-[var(--panel-border)] bg-white/90 px-2.5 py-1 text-xs text-[color:var(--ink-soft)]">固定</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {FIXED_TARGET_PALACES.map((palace) => (
                    <span
                      key={palace}
                      className={`${CHIP_BASE} ${CHIP_FIXED}`}
                    >
                      {palace}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`${SECTION_CARD} lg:col-start-1 lg:row-start-2`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold tracking-wide text-[color:var(--ink)]">其他宫位</h4>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">点击选择，可多选用于重点推演</p>
                  </div>
                  <span className="rounded-full border border-[var(--panel-border)] bg-white/90 px-2.5 py-1 text-xs text-[color:var(--ink-soft)]">已选 {extraTargetPalaces.length} 个</span>
                </div>
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {OPTIONAL_PALACES.map((palace) => {
                    const isActive = extraTargetPalaces.includes(palace);
                    return (
                      <div
                        key={palace}
                        role="button"
                        aria-pressed={isActive}
                        onClick={() => toggleExtraTarget(palace)}
                        className={`${CHIP_BASE} ${isActive ? CHIP_ACTIVE : CHIP_INACTIVE}`}
                      >
                        {palace}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`${SECTION_CARD} lg:col-start-2 lg:row-start-1`}>
                <h4 className="text-base font-semibold tracking-wide text-[color:var(--ink)]">推演提示</h4>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)] leading-relaxed">
                  命宫固定为核心，其他宫位可按需求补充。已选宫位将进入重点解读与宫干四化分析。
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-[color:var(--ink-soft)]">
                  {extraTargetPalaces.length === 0 ? (
                    <span className="rounded-full border border-[var(--panel-border)] bg-white/90 px-2.5 py-1">暂未补充其他宫位</span>
                  ) : (
                    <>
                      {extraTargetPalaces.slice(0, 6).map((palace) => (
                        <span key={palace} className="rounded-full border border-[var(--panel-border)] bg-white/90 px-2.5 py-1">
                          {palace}
                        </span>
                      ))}
                      {extraTargetPalaces.length > 6 && (
                        <span className="rounded-full border border-[var(--panel-border)] bg-white/90 px-2.5 py-1">
                          +{extraTargetPalaces.length - 6}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className={`${SECTION_CARD} flex flex-col items-center justify-center min-h-[200px] text-center lg:col-start-2 lg:row-start-2`}>
                {loading ? (
                  <div className="flex flex-col items-center gap-4 animate-fadeIn">
                    <div className="relative h-14 w-14">
                      <div className="absolute inset-0 rounded-full border-2 border-[var(--accent-soft)] border-t-[var(--accent)] animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse"></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[color:var(--ink)] font-serif text-base sm:text-lg tracking-widest animate-pulse">正在推演紫微命盘...</p>
                      <p className="mt-1 text-xs text-[color:var(--ink-soft)]">AI 正在整理命盘信息</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <button onClick={handleAnalyze} className={CTA_BUTTON}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      开始深度解读
                    </button>
                    <p className="mt-3 text-xs text-[color:var(--ink-soft)]">生成结构化解读，支持命宫为核心的完整推演</p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn max-w-none pb-10 space-y-6">
            <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--paper)] p-5 sm:p-8 shadow-[0_12px_30px_rgba(65,40,24,0.08)]">
              <ReactMarkdown className="prose prose-slate prose-lg max-w-none text-[color:var(--ink)] font-serif" components={markdownComponents}>
                {result}
              </ReactMarkdown>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/70 px-6 py-2.5 text-sm font-serif text-[color:var(--ink-soft)] transition-all hover:text-[color:var(--accent)] hover:border-[var(--accent)] hover:bg-white shadow-sm hover:shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新分析
              </button>
            </div>
          </div>
        )}
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
