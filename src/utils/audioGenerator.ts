/**
 * 音频生成器 - 用于生成测试音频
 */

export interface GeneratedAudioOptions {
  frequency: number;
  duration: number;
  volume: number;
  waveType: 'sine' | 'square' | 'triangle' | 'sawtooth';
}

/**
 * 使用 Web Audio API 生成测试音频
 */
export const generateTestAudio = (options: Partial<GeneratedAudioOptions> = {}): string => {
  const {
    frequency = 440, // A4 音符
    duration = 3, // 3秒
    volume = 0.3,
    waveType = 'sine'
  } = options;

  try {
    // 创建音频上下文
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const numSamples = sampleRate * duration;

    // 创建音频缓冲区
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    // 生成音频数据
    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      let sample = 0;

      switch (waveType) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * time);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * time));
          break;
        case 'triangle':
          sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * time));
          break;
        case 'sawtooth':
          sample = 2 * (time * frequency - Math.floor(0.5 + time * frequency));
          break;
      }

      // 应用音量和渐变效果
      const fadeTime = 0.1; // 100ms 淡入淡出
      let envelope = 1;
      
      if (time < fadeTime) {
        envelope = time / fadeTime;
      } else if (time > duration - fadeTime) {
        envelope = (duration - time) / fadeTime;
      }

      channelData[i] = sample * volume * envelope;
    }

    // 将音频缓冲区转换为 Blob URL
    return bufferToWavBlob(buffer);
  } catch (error) {
    console.error('生成测试音频失败:', error);
    return '';
  }
};

/**
 * 将 AudioBuffer 转换为 WAV Blob URL
 */
function bufferToWavBlob(buffer: AudioBuffer): string {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * bytesPerSample);
  const view = new DataView(arrayBuffer);

  // WAV 文件头
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * bytesPerSample, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
  view.setUint16(32, numberOfChannels * bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * bytesPerSample, true);

  // 音频数据
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * 生成不同类型的测试音频
 */
export const generateTestSounds = () => {
  return {
    piano: generateTestAudio({ frequency: 440, waveType: 'sine', duration: 2 }),
    bass: generateTestAudio({ frequency: 220, waveType: 'sine', duration: 3 }),
    beep: generateTestAudio({ frequency: 800, waveType: 'square', duration: 1 }),
    sweep: generateFrequencySweep(200, 2000, 2)
  };
};

/**
 * 生成频率扫描音频
 */
export const generateFrequencySweep = (startFreq: number, endFreq: number, duration: number): string => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const numSamples = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      const progress = time / duration;
      const frequency = startFreq + (endFreq - startFreq) * progress;
      
      const sample = Math.sin(2 * Math.PI * frequency * time) * 0.3;
      
      // 添加淡入淡出
      const fadeTime = 0.1;
      let envelope = 1;
      if (time < fadeTime) {
        envelope = time / fadeTime;
      } else if (time > duration - fadeTime) {
        envelope = (duration - time) / fadeTime;
      }
      
      channelData[i] = sample * envelope;
    }

    return bufferToWavBlob(buffer);
  } catch (error) {
    console.error('生成扫频音频失败:', error);
    return '';
  }
};

/**
 * 检查浏览器音频支持
 */
export const checkAudioSupport = () => {
  const audio = document.createElement('audio');
  return {
    mp3: audio.canPlayType('audio/mpeg') !== '',
    wav: audio.canPlayType('audio/wav') !== '',
    ogg: audio.canPlayType('audio/ogg') !== '',
    aac: audio.canPlayType('audio/aac') !== '',
    webAudioAPI: !!(window.AudioContext || (window as any).webkitAudioContext)
  };
};