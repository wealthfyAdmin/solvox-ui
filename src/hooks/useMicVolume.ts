import { useEffect, useState } from "react";

export function useMicVolume(room) {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!room) return;

    const participant = room.localParticipant;
    let interval: any;

    interval = setInterval(() => {
      const audioTrack = [...participant.audioTracks.values()][0];
      if (!audioTrack || !audioTrack.track) return;

      const analyzer = audioTrack.track.processor.analyser;
      if (!analyzer) return;

      const array = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(array);

      const avg = array.reduce((a, b) => a + b, 0) / array.length;
      setVolume(avg);
    }, 50);

    return () => clearInterval(interval);
  }, [room]);

  return volume;
}
