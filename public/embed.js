/**
 * Voice Agent Embed Widget
 * ✅ Production-ready (auto detects local vs live, HTTPS enforced)
 */

;(() => {
  const scripts = document.getElementsByTagName("script");
  const currentScript = scripts[scripts.length - 1];
  const scriptSrc = currentScript?.src || "";
  const scriptUrl = new URL(scriptSrc, window.location.origin);

  // ✅ Default base URL for production
  let baseUrl = "https://solvoxpoc.techpixel.co.in";
  const agentId = currentScript?.getAttribute("data-agent-id") || null;

  // ✅ Detect local environment automatically
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocal) {
    baseUrl = "http://localhost:3000";
  } else {
    // If current script not from solvoxpoc.techpixel.co.in, still force HTTPS
    const origin = scriptUrl.origin || "";
    if (!origin.includes("solvoxpoc.techpixel.co.in")) {
      baseUrl = "https://solvoxpoc.techpixel.co.in";
    }
  }

  // ✅ Normalize protocol to always HTTPS for production
  if (!isLocal && baseUrl.startsWith("http://")) {
    baseUrl = baseUrl.replace("http://", "https://");
  }

  const config = {
    baseUrl,
    agentId,
    widgetId: "voice-agent-widget",
    iframeId: "voice-agent-iframe",
    toggleButtonId: "voice-agent-toggle-button",
  };

  class VoiceAgentWidget {
    constructor() {
      this.container = null;
      this.iframe = null;
      this.videoOverlay = null;
      this.button = null;
      this.closeButton = null;
      this.toggleButton = null;
      this.init();
    }

    init() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.createWidget());
      } else {
        this.createWidget();
      }
    }

    createWidget() {
      this.injectStyles();
      this.createVideoWidget();
      this.createChatIframe();
      this.createFloatingButton();
      this.attachEvents();
    }

    injectStyles() {
      if (document.getElementById("voice-agent-style")) return;
      const style = document.createElement("style");
      style.id = "voice-agent-style";
      style.textContent = `
        #${config.widgetId} {
          position: fixed; bottom: 20px; right: 20px;
          width: 360px; height: 580px;
          border-radius: 20px; background: #000;
          overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.25);
          z-index: 999999; transform-origin: bottom right;
          transition: all 0.3s ease-in-out;
        }
        #${config.widgetId}.collapsed {
          transform: scale(0); opacity: 0; pointer-events: none;
        }
        #voice-agent-video {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%; object-fit: cover;
          border-radius: 20px;
        }
        #voice-agent-overlay {
          position: absolute; bottom: 0; width: 100%; height: 180px;
          background: linear-gradient(to top, rgba(255,255,255,0.95) 40%, rgba(255,255,255,0.3) 100%);
          display: flex; flex-direction: column; align-items: center;
          justify-content: flex-end; padding-bottom: 16px;
          border-radius: 0 0 20px 20px;
        }
        #voice-agent-button {
          margin-bottom: 50px;
          padding: 12px 28px; border-radius: 40px;
          background: #465fff; color: #fff;
          font-weight: 600; font-style: italic; font-size: 16px;
          border: none; cursor: pointer;
          box-shadow: 0 4px 12px rgba(70,95,255,0.35);
          transition: all 0.3s ease;
        }
        #voice-agent-button:hover {
          background: #3d52e6; transform: translateY(-2px);
        }
        #voice-agent-footer {
          margin-top: 10px; font-size: 11px; color: #777;
          font-style: italic; text-align: center;
        }
        #voice-agent-close {
          position: absolute; top: 10px; right: 14px;
          background: rgba(255,255,255,0.9);
          border: none; border-radius: 50%;
          width: 28px; height: 28px; cursor: pointer;
          font-size: 18px; font-weight: bold; color: #333;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease; z-index: 2;
        }
        #voice-agent-close:hover {
          background: rgba(255,255,255,1); transform: scale(1.1);
        }
        #${config.iframeId} {
          width: 100%; height: 100%; border: none;
          border-radius: 20px; display: none;
        }
        #${config.iframeId}.active {
          display: block; animation: fadeIn 0.3s ease-in-out forwards;
        }
        #${config.toggleButtonId} {
          position: fixed; bottom: 20px; right: 20px;
          padding: 14px 24px; border-radius: 50px;
          background: #465fff; border: none; cursor: pointer;
          box-shadow: 0 4px 12px rgba(70,95,255,0.3);
          z-index: 999998; color: white; font-family: 'Segoe UI', sans-serif;
          font-size: 16px; font-style: italic; font-weight: 600;
          transition: all 0.3s ease; display: none;
        }
        #${config.toggleButtonId}:hover {
          background: #3d52e6; transform: translateY(-2px);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `;
      document.head.appendChild(style);
    }

    createVideoWidget() {
      this.container = document.createElement("div");
      this.container.id = config.widgetId;

      const video = document.createElement("video");
      video.id = "voice-agent-video";
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.innerHTML = `<source src="/images/embed/4886443_Business_Woman_Young_3840x2160.mp4" type="video/mp4">`;

      const close = document.createElement("button");
      close.id = "voice-agent-close";
      close.innerHTML = "&times;";

      const overlay = document.createElement("div");
      overlay.id = "voice-agent-overlay";
      overlay.innerHTML = `
        <button id="voice-agent-button">Talk to Anamika</button>
        <div id="voice-agent-footer">Powered by Lumiverse Solutions</div>
      `;

      this.container.append(video, overlay, close);
      document.body.appendChild(this.container);

      this.videoOverlay = overlay;
      this.button = overlay.querySelector("#voice-agent-button");
      this.closeButton = close;
    }

    createChatIframe() {
      if (this.iframe && this.iframe.parentNode) {
        this.iframe.parentNode.removeChild(this.iframe);
      }
      this.iframe = document.createElement("iframe");
      this.iframe.id = config.iframeId;

      // ✅ Use environment-aware URL
      let iframeUrl = `${config.baseUrl}/widget/test/`;
      if (config.agentId)
        iframeUrl += `?agentId=${encodeURIComponent(config.agentId)}`;

      this.iframe.src = iframeUrl;
      this.iframe.allow = "microphone; camera; autoplay";
      this.iframe.allowFullscreen = true;
      this.iframe.style.display = "none";
      this.container.appendChild(this.iframe);
    }

    createFloatingButton() {
      if (document.getElementById(config.toggleButtonId)) return;
      this.toggleButton = document.createElement("button");
      this.toggleButton.id = config.toggleButtonId;
      this.toggleButton.innerText = "Chat with Anamika";
      document.body.appendChild(this.toggleButton);
    }

    attachEvents() {
      if (!this.button || !this.closeButton || !this.toggleButton) return;

      this.button.addEventListener("click", () => this.openChat());
      this.closeButton.addEventListener("click", () => this.collapse());
      this.toggleButton.addEventListener("click", () => this.expand());

      window.addEventListener("message", (event) => {
        if (event.data.type === "VOICE_AGENT_END_SESSION") this.collapse();
      });
    }

    openChat() {
      if (!this.videoOverlay || !this.iframe) return;

      this.videoOverlay.style.display = "flex";
      this.videoOverlay.innerHTML = `
        <div style="text-align:center; color:#555; font-family:Inter, sans-serif;">
          <div style="margin-bottom:8px">
            <div class="loader" style="
              width:24px;height:24px;margin:8px auto;
              border:3px solid #465fff;border-top-color:transparent;
              border-radius:50%;animation:spin 1s linear infinite;">
            </div>
          </div>
          <p style="font-size:13px;">Connecting to Anamika...</p>
        </div>
      `;

      this.iframe.classList.add("active");
      this.iframe.style.display = "block";
      this.iframe.contentWindow?.postMessage({ type: "VOICE_AGENT_OPENED" }, "*");

      setTimeout(() => {
        this.videoOverlay.style.display = "none";
        const video = this.container.querySelector("#voice-agent-video");
        if (video) video.style.display = "none";
      }, 1200);
    }

    collapse() {
      if (!this.container || !this.toggleButton) return;
      this.container.classList.add("collapsed");
      this.toggleButton.style.display = "flex";

      const video = this.container.querySelector("#voice-agent-video");
      if (video) video.style.display = "block";
      if (this.videoOverlay) this.videoOverlay.style.display = "flex";
    }

    expand() {
      if (!this.container) return;

      this.createChatIframe();
      const video = this.container.querySelector("#voice-agent-video");
      if (video) video.style.display = "block";

      this.videoOverlay.style.display = "flex";
      this.videoOverlay.innerHTML = `
        <button id="voice-agent-button">Talk to Anamika</button>
        <div id="voice-agent-footer">Powered by Lumiverse Solutions</div>
      `;

      this.button = this.videoOverlay.querySelector("#voice-agent-button");
      if (this.button) this.button.addEventListener("click", () => this.openChat());

      this.container.classList.remove("collapsed");
      this.toggleButton.style.display = "none";
    }
  }

  window.VoiceAgentWidget = new VoiceAgentWidget();
})();
