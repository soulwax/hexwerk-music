"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { haptic } from "@/utils/haptics";

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { data: preferences } = api.music.getUserPreferences.useQuery();
  const { data: queueSettings } = api.music.getSmartQueueSettings.useQuery();
  const { data: userHash } = api.music.getCurrentUserHash.useQuery();
  const updatePreferences = api.music.updatePreferences.useMutation();
  const updateQueueSettings = api.music.updateSmartQueueSettings.useMutation();
  const updateProfile = api.music.updateProfile.useMutation();

  const [activeSection, setActiveSection] = useState<string>("profile");
  const [bio, setBio] = useState("");
  const [profilePublic, setProfilePublic] = useState(true);
  const [copied, setCopied] = useState(false);

  // Local state for settings
  const [volume, setVolume] = useState(preferences?.volume ?? 0.7);
  const [playbackRate, setPlaybackRate] = useState(preferences?.playbackRate ?? 1.0);
  const [equalizerEnabled, setEqualizerEnabled] = useState(preferences?.equalizerEnabled ?? false);
  const [equalizerPreset, setEqualizerPreset] = useState(preferences?.equalizerPreset ?? "Flat");
  const [equalizerBands, setEqualizerBands] = useState<number[]>(
    preferences?.equalizerBands ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  );
  const [visualizerEnabled, setVisualizerEnabled] = useState(preferences?.visualizerEnabled ?? true);
  const [visualizerType, setVisualizerType] = useState<"bars" | "wave" | "circular">(
    (preferences?.visualizerType as "bars" | "wave" | "circular") ?? "bars"
  );
  const [theme, setTheme] = useState<"dark" | "light">((preferences?.theme as "dark" | "light") ?? "dark");
  const [compactMode, setCompactMode] = useState(preferences?.compactMode ?? false);
  const [autoQueueEnabled, setAutoQueueEnabled] = useState(queueSettings?.autoQueueEnabled ?? false);
  const [autoQueueThreshold, setAutoQueueThreshold] = useState(queueSettings?.autoQueueThreshold ?? 3);
  const [autoQueueCount, setAutoQueueCount] = useState(queueSettings?.autoQueueCount ?? 5);
  const [smartMixEnabled, setSmartMixEnabled] = useState(queueSettings?.smartMixEnabled ?? true);
  const [similarityPreference, setSimilarityPreference] = useState<"strict" | "balanced" | "diverse">(
    queueSettings?.similarityPreference ?? "balanced"
  );

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setVolume(preferences.volume);
      setPlaybackRate(preferences.playbackRate);
      setEqualizerEnabled(preferences.equalizerEnabled);
      setEqualizerPreset(preferences.equalizerPreset);
      setEqualizerBands(preferences.equalizerBands!);
      setVisualizerEnabled(preferences.visualizerEnabled);
      setVisualizerType(preferences.visualizerType as "bars" | "wave" | "circular");
      setTheme(preferences.theme as "dark" | "light");
      setCompactMode(preferences.compactMode);
    }
  }, [preferences]);

  useEffect(() => {
    if (queueSettings) {
      setAutoQueueEnabled(queueSettings.autoQueueEnabled);
      setAutoQueueThreshold(queueSettings.autoQueueThreshold);
      setAutoQueueCount(queueSettings.autoQueueCount);
      setSmartMixEnabled(queueSettings.smartMixEnabled);
      setSimilarityPreference(queueSettings.similarityPreference);
    }
  }, [queueSettings]);

  const handleUpdatePreference = async (update: {
    volume?: number;
    playbackRate?: number;
    repeatMode?: "none" | "one" | "all";
    shuffleEnabled?: boolean;
    equalizerEnabled?: boolean;
    equalizerPreset?: string;
    equalizerBands?: number[];
    visualizerType?: "bars" | "wave" | "circular";
    visualizerEnabled?: boolean;
    compactMode?: boolean;
    theme?: "dark" | "light";
  }) => {
    haptic("light");
    await updatePreferences.mutateAsync(update);
  };

  const handleUpdateQueueSettings = async (update: {
    autoQueueEnabled?: boolean;
    autoQueueThreshold?: number;
    autoQueueCount?: number;
    smartMixEnabled?: boolean;
    similarityPreference?: "strict" | "balanced" | "diverse";
  }) => {
    haptic("light");
    await updateQueueSettings.mutateAsync(update);
  };

  const sections = [
    { id: "profile", name: "Profile", icon: "👤" },
    { id: "playback", name: "Playback", icon: "🎵" },
    { id: "equalizer", name: "Equalizer", icon: "🎚️" },
    { id: "queue", name: "Smart Queue", icon: "🔀" },
    { id: "appearance", name: "Appearance", icon: "🎨" },
    { id: "visualizer", name: "Visualizer", icon: "📊" },
  ];

  const copyProfileLink = async () => {
    if (userHash) {
      const profileUrl = `${window.location.origin}/${userHash}`;
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      haptic("success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateProfile = async () => {
    haptic("light");
    await updateProfile.mutateAsync({ bio, profilePublic });
  };

  const equalizerPresets = [
    { name: "Flat", bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "Bass Boost", bands: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0] },
    { name: "Treble Boost", bands: [0, 0, 0, 0, 0, 0, 2, 4, 6, 8] },
    { name: "Rock", bands: [6, 4, 2, 0, -2, -2, 0, 2, 4, 6] },
    { name: "Pop", bands: [2, 4, 6, 4, 2, 0, 2, 4, 6, 4] },
    { name: "Classical", bands: [4, 2, 0, 0, 0, 0, -2, -2, -2, -4] },
    { name: "Jazz", bands: [4, 2, 0, 2, 4, 4, 2, 0, 2, 4] },
    { name: "Vocal", bands: [-2, -2, 0, 2, 4, 4, 2, 0, -2, -2] },
  ];

  const handlePresetChange = (preset: typeof equalizerPresets[0]) => {
    setEqualizerPreset(preset.name);
    setEqualizerBands(preset.bands);
    void handleUpdatePreference({ equalizerPreset: preset.name, equalizerBands: preset.bands });
  };

  const handleBandChange = (index: number, value: number) => {
    const newBands = [...equalizerBands];
    newBands[index] = value;
    setEqualizerBands(newBands);
    setEqualizerPreset("Custom");
    void handleUpdatePreference({ equalizerPreset: "Custom", equalizerBands: newBands });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Settings Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md transform overflow-y-auto bg-gradient-to-b from-gray-900 to-black shadow-2xl transition-transform md:max-w-lg">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-800 bg-black/95 backdrop-blur-lg">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <button
              onClick={() => {
                haptic("light");
                onClose();
              }}
              className="touch-target rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  haptic("light");
                  setActiveSection(section.id);
                }}
                className={`touch-target whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          {activeSection === "profile" && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Your Profile Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userHash ? `${window.location.origin}/${userHash}` : "Loading..."}
                    readOnly
                    className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300"
                  />
                  <button
                    onClick={copyProfileLink}
                    disabled={!userHash}
                    className="touch-target rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Share this link with others to show them your music profile
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about your music taste..."
                  className="w-full resize-none rounded-lg bg-gray-800 px-4 py-2 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm font-medium text-gray-300">Public Profile</span>
                  <span className="text-xs text-gray-500">Allow others to view your profile</span>
                </div>
                <button
                  onClick={() => {
                    const newValue = !profilePublic;
                    setProfilePublic(newValue);
                    void handleUpdateProfile();
                  }}
                  className={`touch-target relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profilePublic ? "bg-indigo-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profilePublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleUpdateProfile}
                className="touch-target w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Save Profile Changes
              </button>

              {userHash && (
                <a
                  href={`/${userHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border-2 border-gray-700 px-4 py-3 text-center font-medium text-white transition-colors hover:border-indigo-500 hover:bg-gray-800"
                >
                  👁️ View Your Public Profile
                </a>
              )}
            </div>
          )}

          {/* Playback Section */}
          {activeSection === "playback" && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-300">
                  <span>Volume</span>
                  <span className="text-indigo-400">{Math.round(volume * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    void handleUpdatePreference({ volume: val });
                  }}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-indigo-600"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-300">
                  <span>Playback Speed</span>
                  <span className="text-indigo-400">{playbackRate}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={playbackRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPlaybackRate(val);
                    void handleUpdatePreference({ playbackRate: val });
                  }}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-indigo-600"
                />
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>
            </div>
          )}

          {/* Equalizer Section */}
          {activeSection === "equalizer" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Enable Equalizer</span>
                <button
                  onClick={() => {
                    const newValue = !equalizerEnabled;
                    setEqualizerEnabled(newValue);
                    void handleUpdatePreference({ equalizerEnabled: newValue });
                  }}
                  className={`touch-target relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    equalizerEnabled ? "bg-indigo-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      equalizerEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {equalizerEnabled && (
                <>
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-300">Preset</label>
                    <div className="grid grid-cols-2 gap-2">
                      {equalizerPresets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => handlePresetChange(preset)}
                          className={`touch-target rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                            equalizerPreset === preset.name
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-4 block text-sm font-medium text-gray-300">
                      Custom Bands {equalizerPreset === "Custom" && "(Custom)"}
                    </label>
                    <div className="space-y-3">
                      {[
                        { label: "32Hz", index: 0 },
                        { label: "64Hz", index: 1 },
                        { label: "125Hz", index: 2 },
                        { label: "250Hz", index: 3 },
                        { label: "500Hz", index: 4 },
                        { label: "1kHz", index: 5 },
                        { label: "2kHz", index: 6 },
                        { label: "4kHz", index: 7 },
                        { label: "8kHz", index: 8 },
                        { label: "16kHz", index: 9 },
                      ].map(({ label, index }) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="w-12 text-xs text-gray-400">{label}</span>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="1"
                            value={equalizerBands[index]}
                            onChange={(e) => handleBandChange(index, parseInt(e.target.value))}
                            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-700 accent-indigo-600"
                          />
                          <span className="w-10 text-right text-xs text-gray-500">
                            {equalizerBands[index]! > 0 ? `+${equalizerBands[index]}` : equalizerBands[index]}dB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Smart Queue Section */}
          {activeSection === "queue" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm font-medium text-gray-300">Auto Queue</span>
                  <span className="text-xs text-gray-500">Automatically add tracks when queue is low</span>
                </div>
                <button
                  onClick={() => {
                    const newValue = !autoQueueEnabled;
                    setAutoQueueEnabled(newValue);
                    void handleUpdateQueueSettings({ autoQueueEnabled: newValue });
                  }}
                  className={`touch-target relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoQueueEnabled ? "bg-indigo-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoQueueEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {autoQueueEnabled && (
                <>
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-300">
                      <span>Trigger Threshold</span>
                      <span className="text-indigo-400">{autoQueueThreshold} tracks</span>
                    </label>
                    <p className="mb-2 text-xs text-gray-500">Add tracks when queue has this many or fewer</p>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={autoQueueThreshold}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setAutoQueueThreshold(val);
                        void handleUpdateQueueSettings({ autoQueueThreshold: val });
                      }}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-300">
                      <span>Tracks to Add</span>
                      <span className="text-indigo-400">{autoQueueCount} tracks</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={autoQueueCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setAutoQueueCount(val);
                        void handleUpdateQueueSettings({ autoQueueCount: val });
                      }}
                      className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-indigo-600"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm font-medium text-gray-300">Smart Mix</span>
                  <span className="text-xs text-gray-500">Use AI recommendations</span>
                </div>
                <button
                  onClick={() => {
                    const newValue = !smartMixEnabled;
                    setSmartMixEnabled(newValue);
                    void handleUpdateQueueSettings({ smartMixEnabled: newValue });
                  }}
                  className={`touch-target relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    smartMixEnabled ? "bg-indigo-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      smartMixEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {smartMixEnabled && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-300">Similarity Preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["strict", "balanced", "diverse"] as const).map((pref) => (
                      <button
                        key={pref}
                        onClick={() => {
                          setSimilarityPreference(pref);
                          void handleUpdateQueueSettings({ similarityPreference: pref });
                        }}
                        className={`touch-target rounded-lg px-4 py-3 text-sm font-medium capitalize transition-all ${
                          similarityPreference === pref
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === "appearance" && (
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-300">Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["dark", "light"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTheme(t);
                        void handleUpdatePreference({ theme: t });
                      }}
                      className={`touch-target rounded-lg px-4 py-3 text-sm font-medium capitalize transition-all ${
                        theme === t
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {t === "dark" ? "🌙" : "☀️"} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm font-medium text-gray-300">Compact Mode</span>
                  <span className="text-xs text-gray-500">Smaller UI elements</span>
                </div>
                <button
                  onClick={() => {
                    const newValue = !compactMode;
                    setCompactMode(newValue);
                    void handleUpdatePreference({ compactMode: newValue });
                  }}
                  className={`touch-target relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    compactMode ? "bg-indigo-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      compactMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Visualizer Section */}
          {activeSection === "visualizer" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Enable Visualizer</span>
                <button
                  onClick={() => {
                    const newValue = !visualizerEnabled;
                    setVisualizerEnabled(newValue);
                    void handleUpdatePreference({ visualizerEnabled: newValue });
                  }}
                  className={`touch-target relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    visualizerEnabled ? "bg-indigo-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      visualizerEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {visualizerEnabled && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-300">Visualizer Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["bars", "wave", "circular"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setVisualizerType(type);
                          void handleUpdatePreference({ visualizerType: type });
                        }}
                        className={`touch-target rounded-lg px-4 py-3 text-sm font-medium capitalize transition-all ${
                          visualizerType === type
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
