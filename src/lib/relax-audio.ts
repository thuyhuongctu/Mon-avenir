import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Nhạc thư giãn không lời, tạo trực tiếp bằng Web Audio (không dùng file nhạc):
 * - nền "pad" êm dựa trên tần số chủ đạo của bài (528, 432, 396, 174 Hz…);
 * - chuông ngũ cung rải ngẫu nhiên, có vang;
 * - nhịp binaural (tai trái/phải lệch vài Hz — cần tai nghe);
 * - tùy chọn tiếng mưa hoặc sóng biển.
 * Bài "Dịu đau răng" chỉ giúp thư giãn, phân tán chú ý khi đau — không chữa được nguyên nhân.
 */

export type Preset = {
  id: string;
  name: string;
  hz: number;
  /** Độ lệch binaural (Hz). */
  beat: number;
  wave: string;
  hint: string;
  /** Bài êm hơn: chuông thưa, nền trầm, gợi ý sẵn âm thanh nền. */
  calm?: boolean;
  ambience?: Ambience;
};

export const PRESETS: Preset[] = [
  {
    id: "dau-rang",
    name: "Dịu đau răng",
    hz: 174,
    beat: 4,
    wave: "Theta 4 Hz",
    hint: "Nền trầm, chuông thưa, sóng biển — thở chậm để bớt căng cơ hàm.",
    calm: true,
    ambience: "ocean",
  },
  {
    id: "528",
    name: "Bình yên",
    hz: 528,
    beat: 10,
    wave: "Alpha 10 Hz",
    hint: "Thả lỏng, nhẹ nhõm sau giờ làm.",
  },
  {
    id: "432",
    name: "Thư thái",
    hz: 432,
    beat: 8,
    wave: "Alpha 8 Hz",
    hint: "Nghỉ ngơi, đọc sách, uống trà.",
  },
  {
    id: "396",
    name: "Giải tỏa lo âu",
    hz: 396,
    beat: 6,
    wave: "Theta 6 Hz",
    hint: "Hít thở sâu, buông bớt căng thẳng.",
  },
  {
    id: "174",
    name: "Ngủ ngon",
    hz: 174,
    beat: 3,
    wave: "Delta 3 Hz",
    hint: "Trước khi ngủ — nên hẹn giờ tắt.",
  },
];

export type Ambience = "none" | "rain" | "ocean";

export const AMBIENCE: Record<Ambience, string> = {
  none: "Không",
  rain: "Mưa",
  ocean: "Sóng biển",
};

const PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];

type Voice = { stop: (at: number) => void };

class Engine {
  ctx?: AudioContext;
  master?: GainNode;
  reverb?: ConvolverNode;
  voices: Voice[] = [];
  bellTimer?: ReturnType<typeof setTimeout>;
  preset?: Preset;

  private ensure() {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const comp = ctx.createDynamicsCompressor();
      comp.connect(ctx.destination);
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(comp);
      const reverb = ctx.createConvolver();
      reverb.buffer = impulse(ctx, 4.5);
      const wet = ctx.createGain();
      wet.gain.value = 0.55;
      reverb.connect(wet).connect(master);
      Object.assign(this, { ctx, master, reverb });
    }
    return this.ctx!;
  }

  async start(preset: Preset, ambience: Ambience, volume: number) {
    const ctx = this.ensure();
    if (ctx.state === "suspended") await ctx.resume();
    this.teardown(1.5);
    this.preset = preset;
    const t = ctx.currentTime;
    this.master!.gain.cancelScheduledValues(t);
    this.master!.gain.setValueAtTime(this.master!.gain.value, t);
    this.master!.gain.linearRampToValueAtTime(volume, t + 3);

    this.voices.push(this.pad(preset.hz, preset.calm));
    this.voices.push(this.binaural(preset.hz, preset.beat));
    if (ambience !== "none") this.voices.push(this.noise(ambience));
    this.scheduleBell();
  }

  setVolume(v: number) {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.2);
  }

  stop(fade = 2) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + fade);
    this.teardown(fade);
    const ctx = this.ctx;
    setTimeout(
      () => {
        if (!this.voices.length) void ctx.suspend();
      },
      fade * 1000 + 200,
    );
  }

  private teardown(fade: number) {
    clearTimeout(this.bellTimer);
    const at = this.ctx!.currentTime + fade;
    this.voices.forEach((v) => v.stop(at));
    this.voices = [];
  }

  /** Hợp âm nền: tần số gốc hạ quãng tám + quãng năm, mỗi nốt hai dao động lệch nhẹ, âm lượng "thở" chậm. */
  private pad(hz: number, calm = false): Voice {
    const ctx = this.ctx!;
    const base = hz > 300 ? hz / 2 : hz;
    const out = ctx.createGain();
    rampIn(out, 0.16, 4);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = calm ? 800 : 1400;
    lp.connect(out);
    out.connect(this.master!);
    out.connect(this.reverb!);
    const nodes: OscillatorNode[] = [];
    [0.5, 0.75, 1, 1.5].forEach((r, i) => {
      const g = ctx.createGain();
      g.gain.value = [0.5, 0.35, 0.3, 0.12][i];
      // LFO cho mỗi nốt — mỗi nốt "thở" một nhịp khác nhau.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.023;
      const depth = ctx.createGain();
      depth.gain.value = g.gain.value * 0.45;
      lfo.connect(depth).connect(g.gain);
      lfo.start();
      nodes.push(lfo);
      for (const cents of [-4, 4]) {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "sine" : "triangle";
        o.frequency.value = base * r;
        o.detune.value = cents;
        o.connect(g);
        o.start();
        nodes.push(o);
      }
      g.connect(lp);
    });
    return fadeVoice(out, nodes);
  }

  private binaural(hz: number, beat: number): Voice {
    const ctx = this.ctx!;
    const carrier = hz > 300 ? hz / 2 : hz;
    const out = ctx.createGain();
    rampIn(out, 0.05, 5);
    out.connect(this.master!);
    const nodes: OscillatorNode[] = [];
    for (const [pan, f] of [
      [-1, carrier],
      [1, carrier + beat],
    ] as const) {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      o.connect(p).connect(out);
      o.start();
      nodes.push(o);
    }
    return fadeVoice(out, nodes);
  }

  private noise(kind: Exclude<Ambience, "none">): Voice {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = kind === "rain" ? pinkNoise(ctx, 6) : brownNoise(ctx, 6);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    const out = ctx.createGain();
    out.gain.value = 0;
    const nodes: (OscillatorNode | AudioBufferSourceNode)[] = [src];
    if (kind === "rain") {
      f.type = "bandpass";
      f.frequency.value = 2200;
      f.Q.value = 0.4;
      rampIn(out, 0.22, 4);
    } else {
      f.type = "lowpass";
      f.frequency.value = 700;
      rampIn(out, 0.5, 4);
      // Sóng: âm lượng dâng lên rút xuống ~ mỗi 9 giây.
      const swell = ctx.createGain();
      swell.gain.value = 0.6;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.11;
      const depth = ctx.createGain();
      depth.gain.value = 0.4;
      lfo.connect(depth).connect(swell.gain);
      lfo.start();
      nodes.push(lfo);
      src.connect(f).connect(swell).connect(out);
      out.connect(this.master!);
      src.start();
      return fadeVoice(out, nodes);
    }
    src.connect(f).connect(out);
    out.connect(this.master!);
    src.start();
    return fadeVoice(out, nodes);
  }

  /** Chuông ngũ cung, mỗi 2,5–7 giây một nốt. */
  private scheduleBell() {
    const p = this.preset;
    const ctx = this.ctx;
    if (!p || !ctx) return;
    const root = p.hz < 300 ? p.hz * 2 : p.hz;
    const f =
      root *
      PENTA[Math.floor(Math.random() * PENTA.length)] *
      (Math.random() < 0.3 ? 0.5 : 1);
    const t = ctx.currentTime + 0.05;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    // Bài êm: chuông nhỏ hơn, vào chậm hơn (không "đánh" vào tai).
    g.gain.linearRampToValueAtTime(
      (p.calm ? 0.035 : 0.06) + Math.random() * 0.03,
      t + (p.calm ? 0.25 : 0.02),
    );
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
    g.connect(this.reverb!);
    g.connect(this.master!);
    for (const [mul, amp] of [
      [1, 1],
      [2.76, 0.18],
    ]) {
      const o = ctx.createOscillator();
      o.frequency.value = f * mul;
      const a = ctx.createGain();
      a.gain.value = amp;
      o.connect(a).connect(g);
      o.start(t);
      o.stop(t + 4.2);
    }
    this.bellTimer = setTimeout(
      () => this.scheduleBell(),
      p.calm ? 5000 + Math.random() * 6000 : 2500 + Math.random() * 4500,
    );
  }
}

function rampIn(g: GainNode, to: number, seconds: number) {
  const t = g.context.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(to, t + seconds);
}

function fadeVoice(
  out: GainNode,
  nodes: (OscillatorNode | AudioBufferSourceNode)[],
): Voice {
  return {
    stop(at) {
      const ctx = out.context;
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
      out.gain.linearRampToValueAtTime(0, at);
      nodes.forEach((n) => n.stop(at + 0.1));
      setTimeout(() => out.disconnect(), (at - ctx.currentTime) * 1000 + 300);
    },
  };
}

function impulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  return buf;
}

function pinkNoise(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buf;
}

function brownNoise(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
  }
  return buf;
}

const engine = new Engine();

type RelaxState = {
  playing: boolean;
  presetId: string;
  ambience: Ambience;
  volume: number;
  /** Thời điểm tự tắt (ms), nếu có hẹn giờ. */
  endsAt?: number;
  /** Số phút đã chọn cho hẹn giờ đang chạy. */
  timerMin?: number;
  play: () => Promise<void>;
  stop: () => void;
  setPreset: (id: string) => void;
  setAmbience: (a: Ambience) => void;
  setVolume: (v: number) => void;
  setTimer: (minutes: number) => void;
};

let sleepTimer: ReturnType<typeof setTimeout> | undefined;

export const presetOf = (id: string) =>
  PRESETS.find((p) => p.id === id) ?? PRESETS[0];

export const useRelax = create<RelaxState>()(
  persist(
    (set, get) => ({
      playing: false,
      presetId: PRESETS[0].id,
      ambience: "rain",
      volume: 0.7,
      play: async () => {
        const s = get();
        await engine.start(presetOf(s.presetId), s.ambience, s.volume);
        set({ playing: true });
        updateMediaSession(presetOf(s.presetId), true);
      },
      stop: () => {
        engine.stop();
        clearTimeout(sleepTimer);
        set({ playing: false, endsAt: undefined, timerMin: undefined });
        updateMediaSession(presetOf(get().presetId), false);
      },
      setPreset: (presetId) => {
        const suggested = presetOf(presetId).ambience;
        set(suggested ? { presetId, ambience: suggested } : { presetId });
        if (get().playing) void get().play();
      },
      setAmbience: (ambience) => {
        set({ ambience });
        if (get().playing) void get().play();
      },
      setVolume: (volume) => {
        set({ volume });
        engine.setVolume(volume);
      },
      setTimer: (minutes) => {
        clearTimeout(sleepTimer);
        if (!minutes) {
          set({ endsAt: undefined, timerMin: undefined });
          return;
        }
        const endsAt = Date.now() + minutes * 60_000;
        set({ endsAt, timerMin: minutes });
        sleepTimer = setTimeout(() => {
          engine.stop(12);
          set({ playing: false, endsAt: undefined, timerMin: undefined });
        }, minutes * 60_000);
      },
    }),
    {
      name: "mon-avenir-relax-v1",
      partialize: (s) => ({
        presetId: s.presetId,
        ambience: s.ambience,
        volume: s.volume,
      }),
    },
  ),
);

function updateMediaSession(p: Preset, playing: boolean) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: `${p.name} · ${p.hz} Hz`,
    artist: "Mon Avenir",
    album: "Nhạc thư giãn",
  });
  navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  navigator.mediaSession.setActionHandler(
    "play",
    () => void useRelax.getState().play(),
  );
  navigator.mediaSession.setActionHandler("pause", () =>
    useRelax.getState().stop(),
  );
  navigator.mediaSession.setActionHandler("stop", () =>
    useRelax.getState().stop(),
  );
}
