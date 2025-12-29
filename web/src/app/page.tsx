"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GenerationResult,
  MediaAsset,
  PlatformKey,
  ThumbnailAsset,
} from "@/lib/types";

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  youtube: "YouTube Shorts",
  tiktok: "TikTok",
  reels: "Instagram Reels",
  instagram: "Instagram Feed",
};

const FORMAT_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  mp4: "video/mp4",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
};

interface AssetUrls {
  voiceover: string | null;
  video: string | null;
  thumbnail: string | null;
}

const DEFAULT_SELECTED: Record<PlatformKey, boolean> = {
  youtube: true,
  tiktok: true,
  reels: true,
  instagram: false,
};

export default function Home() {
  const [form, setForm] = useState({
    topic: "",
    tone: "Bold & Energetic",
    durationPreference: "medium" as "short" | "medium" | "long",
    audience: "Creators and marketers",
    callToAction: "Follow for the full playbook",
  });
  const [platforms, setPlatforms] = useState<Record<PlatformKey, boolean>>(
    DEFAULT_SELECTED,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [assetUrls, setAssetUrls] = useState<AssetUrls>({
    voiceover: null,
    video: null,
    thumbnail: null,
  });
  const assetRef = useRef<AssetUrls>({
    voiceover: null,
    video: null,
    thumbnail: null,
  });

  useEffect(() => {
    const previous = assetRef.current;
    if (previous.voiceover) URL.revokeObjectURL(previous.voiceover);
    if (previous.video) URL.revokeObjectURL(previous.video);
    if (previous.thumbnail) URL.revokeObjectURL(previous.thumbnail);

    if (!result) {
      const empty: AssetUrls = { voiceover: null, video: null, thumbnail: null };
      assetRef.current = empty;
      setAssetUrls(empty);
      return () => undefined;
    }

    const next: AssetUrls = {
      voiceover: buildObjectUrl(result.voiceover),
      video: buildObjectUrl(result.video),
      thumbnail: buildObjectUrl(result.thumbnail),
    };

    assetRef.current = next;
    setAssetUrls(next);

    return () => {
      if (next.voiceover) URL.revokeObjectURL(next.voiceover);
      if (next.video) URL.revokeObjectURL(next.video);
      if (next.thumbnail) URL.revokeObjectURL(next.thumbnail);
    };
  }, [result]);

  const selectedPlatforms = useMemo(
    () =>
      (Object.keys(platforms) as PlatformKey[]).filter((key) => platforms[key]),
    [platforms],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.topic.trim()) {
      setError("Add a topic to generate your automation.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus("Generating your full content stack...");
    setResult(null);

    try {
      const targetPlatforms = selectedPlatforms.length
        ? selectedPlatforms
        : (Object.keys(PLATFORM_LABELS) as PlatformKey[]);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: form.topic,
          tone: form.tone,
          durationPreference: form.durationPreference,
          audience: form.audience || undefined,
          callToAction: form.callToAction || undefined,
          platforms: targetPlatforms,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Generation failed");
      }

      const payload = (await response.json()) as GenerationResult;
      setResult(payload);
      setStatus("Automation bundle ready");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error. Try again.";
      setError(message);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatform = (key: PlatformKey) => {
    setPlatforms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pt-16 sm:px-10 lg:px-12">
        <header className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
            Agentic Creator Suite
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
            One topic in. Viral-ready video, audio, script, captions, and
            thumbnail out.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Drop any idea and let the automation engine generate short-form
            content for YouTube, TikTok, Instagram, and Reels — complete with AI
            voiceover, share-ready video, titles, and optimized metadata.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="topic"
                  className="text-sm font-medium uppercase tracking-wide text-indigo-200"
                >
                  Content topic
                </label>
                <textarea
                  id="topic"
                  name="topic"
                  required
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-base text-slate-200 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="e.g. Market like MrBeast with a tiny budget"
                  value={form.topic}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, topic: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="tone"
                  label="Brand tone"
                  value={form.tone}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, tone: value }))
                  }
                  placeholder="Bold & Energetic"
                />
                <Field
                  id="audience"
                  label="Target audience"
                  value={form.audience}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, audience: value }))
                  }
                  placeholder="Creators and marketers"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="cta"
                    className="text-sm font-medium uppercase tracking-wide text-indigo-200"
                  >
                    Primary call to action
                  </label>
                  <input
                    id="cta"
                    name="cta"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-slate-200 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                    placeholder="Follow for the full playbook"
                    value={form.callToAction}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        callToAction: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium uppercase tracking-wide text-indigo-200">
                    Duration aim
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["short", "medium", "long"] as const).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            durationPreference: preset,
                          }))
                        }
                        className={`rounded-2xl border px-3 py-2 text-sm font-semibold capitalize transition ${form.durationPreference === preset ? "border-indigo-400 bg-indigo-500/20 text-indigo-100" : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/20"}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-medium uppercase tracking-wide text-indigo-200">
                  Platforms
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.keys(PLATFORM_LABELS) as PlatformKey[]).map((key) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => togglePlatform(key)}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${platforms[key] ? "border-indigo-500 bg-indigo-500/10 text-indigo-100" : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/20"}`}
                    >
                      <span className="text-sm font-semibold uppercase tracking-wide">
                        {PLATFORM_LABELS[key]}
                      </span>
                      <span
                        className={`h-3.5 w-3.5 rounded-full ${platforms[key] ? "bg-indigo-400 shadow shadow-indigo-400/40" : "bg-slate-700"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  {isLoading ? "Building..." : "Generate Package"}
                </button>
                {status && !isLoading && (
                  <span className="text-sm font-medium text-emerald-300">
                    {status}
                  </span>
                )}
                {error && (
                  <span className="text-sm font-medium text-rose-300">
                    {error}
                  </span>
                )}
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-6">
              <h2 className="text-base font-semibold uppercase tracking-[0.3em] text-indigo-200">
                What you get
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-indigo-100/90">
                <li>• Viral hook, scene-by-scene script & closing CTA</li>
                <li>• AI voiceover audio synced to a ready-to-post MP4</li>
                <li>• Thumbnail artwork + prompt for regeneration</li>
                <li>• Metadata + captions tuned per platform</li>
                <li>• Workflow notes to plug into your editor</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
              <p className="font-semibold text-slate-200">
                Pro tip
              </p>
              <p className="mt-2">
                The generated assets are ready for Vercel-edge workflows. Swap in
                your API keys to upgrade the fallback media with full-fidelity
                OpenAI outputs.
              </p>
            </div>
          </aside>
        </div>

        {isLoading && (
          <div className="grid gap-6 rounded-3xl border border-white/10 bg-slate-900/60 p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-indigo-200">
              Processing timeline
            </p>
            <ProgressSteps />
          </div>
        )}

        {result && (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/70 p-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
                Script Blueprint
              </h2>
              <div className="space-y-5 text-sm text-slate-200">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
                    Hook
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-50">
                    {result.script.hook}
                  </p>
                </div>
                <div className="grid gap-3">
                  {result.script.scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="rounded-2xl border border-white/5 bg-slate-950/40 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
                        {scene.title}
                      </p>
                      <p className="mt-2 text-sm text-slate-200">
                        {scene.narration}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Visual: {scene.visualIdea}
                      </p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
                    Closing CTA
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-50">
                    {result.script.closing}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
                  Voiceover & Video
                </h2>
                <div className="mt-4 space-y-4">
                  {assetUrls.voiceover && (
                    <div className="space-y-2">
                      <audio
                        controls
                        src={assetUrls.voiceover}
                        className="w-full"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(result.voiceover, "voiceover")
                        }
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200 hover:text-indigo-100"
                      >
                        Download voiceover
                      </button>
                    </div>
                  )}
                  {assetUrls.video && (
                    <div className="space-y-2">
                      <video
                        controls
                        src={assetUrls.video}
                        className="aspect-[9/16] w-full rounded-2xl border border-white/10 bg-black object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDownload(result.video, "video")}
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200 hover:text-indigo-100"
                      >
                        Download video
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
                  Thumbnail & Prompt
                </h2>
                <div className="mt-4 space-y-4">
                  {assetUrls.thumbnail && (
                    <div className="space-y-2">
                      {result.thumbnail.format === "svg" ? (
                        <Image
                          src={`data:image/svg+xml;base64,${result.thumbnail.base64}`}
                          alt="AI Thumbnail"
                          width={1024}
                          height={1024}
                          unoptimized
                          className="h-auto w-full rounded-2xl border border-white/10 bg-black/20"
                        />
                      ) : (
                        assetUrls.thumbnail && (
                          <Image
                            src={assetUrls.thumbnail}
                            alt="AI Thumbnail"
                            width={1024}
                            height={1024}
                            unoptimized
                            className="h-auto w-full rounded-2xl border border-white/10 bg-black/20"
                          />
                        )
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(result.thumbnail, "thumbnail")
                        }
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200 hover:text-indigo-100"
                      >
                        Download thumbnail
                      </button>
                    </div>
                  )}
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-xs text-slate-300">
                    <p className="font-semibold uppercase tracking-[0.3em] text-indigo-200">
                      Prompt
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-slate-200">
                      {result.thumbnail.prompt}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {result && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
                Platform Drops
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {result.socialPosts.map((post) => (
                  <div
                    key={post.platform}
                    className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
                      {PLATFORM_LABELS[post.platform] ?? post.platform}
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-50">
                      {post.headline}
                    </p>
                    <p className="mt-2 text-slate-300">{post.caption}</p>
                    <p className="mt-3 text-xs text-slate-400">
                      {post.hashtags.join(" ")}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-indigo-200">
                      {post.scheduleHint}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm">
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
                Workflow Notes
              </h2>
              <ul className="space-y-3 text-slate-300">
                {result.workflowNotes.map((note, index) => (
                  <li key={index}>• {note}</li>
                ))}
              </ul>
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs text-indigo-100">
                <p className="font-semibold uppercase tracking-[0.3em]">
                  Keywords
                </p>
                <p className="mt-2 text-indigo-100/90">
                  {result.script.keywords.join(", ")}
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function Field({ id, label, value, onChange, placeholder }: FieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium uppercase tracking-wide text-indigo-200"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-slate-200 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
      />
    </div>
  );
}

function buildObjectUrl(asset: MediaAsset | ThumbnailAsset | null): string | null {
  if (!asset?.base64) {
    return null;
  }
  const format = asset.format?.toLowerCase() ?? "bin";
  const mime = FORMAT_MIME[format] ?? "application/octet-stream";
  const binary = atob(asset.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

function handleDownload(asset: MediaAsset | ThumbnailAsset, name: string) {
  const url = buildObjectUrl(asset);
  if (!url) return;
  const format = asset.format?.toLowerCase() ?? "bin";
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function ProgressSteps() {
  const steps = [
    "Drafting script & shot list",
    "Synthesizing voiceover",
    "Rendering video composition",
    "Designing thumbnail",
    "Packaging platform metadata",
  ];
  return (
    <div className="grid gap-3">
      {steps.map((step, index) => (
        <div
          key={step}
          className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/40 p-3"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/10 text-xs font-semibold text-indigo-200">
            {index + 1}
          </span>
          <p className="text-sm text-slate-200">{step}</p>
          <span className="ml-auto h-1 w-16 rounded-full bg-indigo-500/40" />
        </div>
      ))}
    </div>
  );
}
