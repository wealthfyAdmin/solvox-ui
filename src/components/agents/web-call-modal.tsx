"use client";

import { useState, useEffect, useRef } from "react";
import { Room, RoomEvent, RemoteParticipant, Track, ConnectionState } from "livekit-client";

export default function WebCallModal({ open, onClose }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const [callSession, setCallSession] = useState({ room: null, token: null, participantIdentity: null, sipParticipantId: null, roomName: null });
  const [callSummary, setCallSummary] = useState(null);
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(true);
  const [liveTranscription, setLiveTranscription] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recentCalls, setRecentCalls] = useState([]);

  const audioElementRef = useRef(null);
  const callStartTimeRef = useRef(0);
  const intervalRef = useRef(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (callSession.room) {
        callSession.room.disconnect();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callSession.room]);

  // Duration effect
  useEffect(() => {
    if (callStatus === "connected") {
      intervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [callStatus]);

  const handleMakeCall = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setCallStatus("connecting");
    setError(null);

    try {
      const response = await fetch('/api/sip/create-outbound-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phoneNumber: `+91${cleanNumber}`,
          participantName: "Web Caller",
          enableTranscription: transcriptionEnabled
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate call');
      }

      const { roomName, token, participantIdentity, sipParticipantId, livekitUrl } = await response.json();

      const room = new Room({
        publishDefaults: { audioPreset: { maxBitrate: 64000 } },
        audioSettings: { autoGainControl: true, noiseSuppression: true, echoCancellation: true }
      });

      room.on(RoomEvent.Connected, () => {
        setCallStatus("dialing");
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        if (participant.identity.includes('sip')) {
          setTimeout(() => {
            setCallStatus("connected");
            callStartTimeRef.current = Date.now();
            if (transcriptionEnabled) {
              setIsRecording(true);
            }
          }, 2000);
        }
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        if (participant.identity.includes('sip')) {
          handleEndCall();
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio && audioElementRef.current) {
          track.attach(audioElementRef.current);
          audioElementRef.current.play().catch(err => console.warn('Audio autoplay blocked:', err));
        }
      });

      await room.connect(livekitUrl, token);
      await room.localParticipant.enableCameraAndMicrophone(false, true).catch(() => {
        setError("Microphone access denied");
      });

      setCallSession({ room, token, participantIdentity, sipParticipantId, roomName });

    } catch (error) {
      setError(error.message);
      setCallStatus("idle");
      setRecentCalls(prev => [{ number: phoneNumber, status: "failed", timestamp: new Date() }, ...prev.slice(0, 9)]);
    }
  };

  const handleEndCall = async () => {
    const endTime = new Date();
    const actualDuration = callDuration > 0 ? callDuration : Math.floor((Date.now() - callStartTimeRef.current) / 1000);

    const summary = {
      phoneNumber: phoneNumber,
      startTime: new Date(callStartTimeRef.current),
      endTime: endTime,
      duration: actualDuration,
      status: actualDuration > 5 ? "completed" : "ended",
      transcription: liveTranscription.length > 0 ? liveTranscription : undefined,
      cost: Math.round((actualDuration / 60) * 0.094 * 100) / 100
    };

    setCallSummary(summary);
    setCallStatus("summary");
    setIsRecording(false);

    if (callSession.room) {
      callSession.room.disconnect();
    }

    if (callSession.sipParticipantId) {
      try {
        await fetch('/api/sip/end-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sipParticipantId: callSession.sipParticipantId,
            roomName: callSession.roomName,
            duration: actualDuration,
            transcription: liveTranscription
          }),
        });
      } catch (cleanupError) {
        console.warn('SIP cleanup failed:', cleanupError);
      }
    }

    if (actualDuration > 5) {
      setRecentCalls(prev => [{ number: phoneNumber, status: "completed", timestamp: endTime, duration: actualDuration }, ...prev.slice(0, 9)]);
    }
  };

  const handleNewCall = () => {
    setCallStatus("idle");
    setCallDuration(0);
    setPhoneNumber("");
    setCallSummary(null);
    setLiveTranscription([]);
    setError(null);
    setCallSession({ room: null, token: null, participantIdentity: null, sipParticipantId: null, roomName: null });
  };

  const toggleMute = () => {
    if (callSession.room) {
      const audioTrack = callSession.room.localParticipant.getTrackBySource(Track.Source.Microphone);
      if (audioTrack) {
        if (audioTrack.isMuted) {
          audioTrack.unmute();
          setIsMuted(false);
        } else {
          audioTrack.mute();
          setIsMuted(true);
        }
      }
    }
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      const match = digits.match(/^(\d{0,5})(\d{0,5})$/);
      if (match) {
        return `${match[1]}${match[2] ? '-' + match[2] : ''}`;
      }
    }
    return value;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!open) return null;

  const renderSummaryView = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Call Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Phone Number:</span>
            <p className="font-medium text-gray-900 dark:text-white">+91 {callSummary.phoneNumber}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Duration:</span>
            <p className="font-medium text-gray-900 dark:text-white">{formatDuration(callSummary.duration)}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Start Time:</span>
            <p className="font-medium text-gray-900 dark:text-white">{callSummary.startTime.toLocaleTimeString()}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">End Time:</span>
            <p className="font-medium text-gray-900 dark:text-white">{callSummary.endTime?.toLocaleTimeString()}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Status:</span>
            <p className={`font-medium capitalize ${callSummary.status === "completed" ? "text-green-600" : "text-red-600"}`}>
              {callSummary.status}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Cost:</span>
            <p className="font-medium text-gray-900 dark:text-white">${callSummary.cost?.toFixed(2) || "0.00"}</p>
          </div>
        </div>
      </div>

      {callSummary.transcription && callSummary.transcription.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">📝</span>
            Call Transcription
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            {callSummary.transcription.map((line, index) => (
              <div key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed">{line}</div>
            ))}
          </div>
          <div className="mt-4 flex space-x-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(callSummary.transcription?.join('\n') || '');
                alert('Transcription copied to clipboard!');
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Copy Transcription
            </button>
            <button 
              onClick={() => {
                const blob = new Blob([callSummary.transcription?.join('\n') || ''], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `call-transcription-${callSummary.phoneNumber}-${new Date().toISOString().split('T')[0]}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleNewCall}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
        </svg>
        <span>Make Another Call</span>
      </button>
    </div>
  );

  const renderCallInterface = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">Phone Number</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <span className="text-sm font-medium">🇮🇳 +91</span>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
            placeholder="98765-43210"
            className="w-full pl-20 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono transition-colors"
            disabled={callStatus !== "idle"}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Enter the phone number to call with your AI agent</p>
      </div>

      {callStatus === "idle" && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Transcription</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Record and transcribe the conversation</p>
          </div>
          <button
            onClick={() => setTranscriptionEnabled(!transcriptionEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${transcriptionEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${transcriptionEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      )}

      {callStatus !== "idle" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-center space-x-4">
            {(callStatus === "connecting" || callStatus === "dialing") && (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {callStatus === "connecting" ? "Connecting..." : "Ringing..."}
                </span>
              </div>
            )}
            {callStatus === "connected" && (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"></div>
                </div>
                <div className="text-center">
                  <span className="text-green-600 dark:text-green-400 font-medium block">Call Connected</span>
                  <span className="text-sm text-gray-500">{formatDuration(callDuration)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {callStatus === "idle" && (
          <button
            onClick={handleMakeCall}
            disabled={!phoneNumber.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Make Call</span>
          </button>
        )}

        {(callStatus === "connecting" || callStatus === "dialing") && (
          <button
            onClick={handleEndCall}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
            <span>Cancel Call</span>
          </button>
        )}

        {callStatus === "connected" && (
          <div className="flex space-x-3">
            <button
              onClick={toggleMute}
              className={`flex-1 p-4 rounded-xl transition-colors flex items-center justify-center space-x-2 ${isMuted ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMuted ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"} />
              </svg>
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>
            <button
              onClick={handleEndCall}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span>End Call</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Calls</h3>
        <div className="space-y-2">
          {recentCalls.length > 0 ? recentCalls.map((call, index) => (
            <div key={index} className="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${call.status === "completed" ? 'bg-green-500' : call.status === "failed" ? 'bg-red-500' : call.status === "missed" ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">+91 {call.number}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${call.status === "completed" ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : call.status === "failed" ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : call.status === "missed" ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                  {call.status}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {call.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {call.duration && (
                  <div className="text-xs text-gray-400">{formatDuration(call.duration)}</div>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">No recent calls</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50" style={{ display: open ? 'block' : 'none' }}>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300" onClick={(callStatus === "idle" || callStatus === "summary") ? onClose : undefined} />
      
      <audio ref={audioElementRef} autoPlay playsInline style={{ display: 'none' }} />
      
      <div className={`fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl transform transition-all duration-300 ease-out ${open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="flex flex-col h-full">
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
            <button
              onClick={(callStatus === "idle" || callStatus === "summary") ? onClose : handleEndCall}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
              title={callStatus === "idle" ? "Close" : callStatus === "summary" ? "Close" : "End Call"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm">
                  {callStatus === "summary" ? "📋" : "📞"}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {callStatus === "summary" ? "Call Summary" : "Make a Call"}
                  </h2>
                  <p className="text-sm opacity-90">
                    {callStatus === "idle" && "Ready to call"}
                    {callStatus === "connecting" && "Setting up..."}
                    {callStatus === "dialing" && "Ringing..."}
                    {callStatus === "connected" && `Connected • ${formatDuration(callDuration)}`}
                    {callStatus === "ended" && "Call ended"}
                    {callStatus === "summary" && "Call completed"}
                  </p>
                </div>
              </div>
              
              {callStatus === "connected" && (
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isMuted ? 'bg-red-400' : 'bg-green-400'} animate-pulse`}></div>
                  <span className="text-sm">{isMuted ? 'Muted' : 'Live'}</span>
                  {isRecording && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs">REC</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {callStatus === "summary" && callSummary ? renderSummaryView() : renderCallInterface()}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-2">
                <span>🚀</span>
                <span>Powered by LiveKit SIP</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
