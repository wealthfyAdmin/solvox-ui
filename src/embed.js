/**
 * Voice Agent Embed Widget
 * Embeddable voice support widget for websites
 */

;(() => {
  // Configuration
  // Get the base URL from the script tag that loaded this file
  const scripts = document.getElementsByTagName("script")
  const currentScript = scripts[scripts.length - 1]
  const scriptSrc = currentScript.src
  let baseUrl = "https://solvoxpoc.techpixel.co.in" // Default fallback
  let agentId = null

  if (scriptSrc) {
    // Extract base URL from script source
    const url = new URL(scriptSrc)
    baseUrl = url.origin
  }

  // Get agent ID from data attribute
  if (currentScript) {
    agentId = currentScript.getAttribute("data-agent-id")
  }

  const config = {
    baseUrl: baseUrl,
    agentId: agentId,
    widgetId: "voice-agent-widget",
    buttonId: "voice-agent-button",
    iframeId: "voice-agent-iframe",
  }

  console.log("Voice Agent Widget - Configuration:", config)

  // Prevent multiple initialization
  if (window.VoiceAgentWidget) {
    console.warn("Voice Agent Widget already initialized")
    return
  }

  // Widget class
  class VoiceAgentWidget {
    constructor() {
      this.isOpen = false
      this.button = null
      this.container = null
      this.iframe = null

      this.init()
    }

    init() {
      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.createWidget())
      } else {
        this.createWidget()
      }
    }

    createWidget() {
      console.log("Voice Agent Widget - Creating widget elements")
      this.injectStyles()
      this.createButton()
      this.createContainer()
      this.attachEventListeners()
      console.log("Voice Agent Widget - Widget created successfully")
    }

    injectStyles() {
      const style = document.createElement("style")
      style.textContent = `
        /* Voice Agent Widget Styles */
        #${config.buttonId} {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(37, 99, 235, 0.4);
          z-index: 999998;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          animation: pulse 2s infinite;
        }

        #${config.buttonId}:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        #${config.buttonId}.active {
          background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(37, 99, 235, 0.4);
          }
          70% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 10px rgba(37, 99, 235, 0);
          }
          100% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(37, 99, 235, 0);
          }
        }

        #${config.buttonId} svg {
          width: 30px;
          height: 30px;
          fill: white;
          transition: transform 0.3s ease;
        }

        #${config.buttonId}.active svg {
          transform: rotate(180deg);
        }

        #${config.widgetId} {
          position: fixed;
          bottom: 100px;
          right: 20px;
          width: 400px;
          height: 600px;
          max-height: calc(100vh - 140px);
          background: white;
          border-radius: 16px;
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25);
          z-index: 999999;
          overflow: hidden;
          transform: translateX(450px);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        #${config.widgetId}.open {
          transform: translateX(0);
          opacity: 1;
        }

        #${config.iframeId} {
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 16px;
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          #${config.widgetId} {
            width: calc(100vw - 20px);
            height: calc(100vh - 120px);
            right: 10px;
            bottom: 90px;
          }

          #${config.buttonId} {
            right: 10px;
            bottom: 10px;
          }
        }
      `
      document.head.appendChild(style)
    }

    createButton() {
      this.button = document.createElement("button")
      this.button.id = config.buttonId
      this.button.setAttribute("aria-label", "Open Voice Support")
      this.button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      `
      document.body.appendChild(this.button)
    }

    createContainer() {
      this.container = document.createElement("div")
      this.container.id = config.widgetId

      // Create iframe
      this.iframe = document.createElement("iframe")
      this.iframe.id = config.iframeId

      let iframeUrl = `${config.baseUrl}/embed/widget`
      if (config.agentId) {
        iframeUrl += `?agentId=${encodeURIComponent(config.agentId)}`
      }

      this.iframe.src = iframeUrl
      this.iframe.setAttribute("allow", "microphone; camera; autoplay")
      this.iframe.setAttribute("allowfullscreen", "true")

      this.container.appendChild(this.iframe)
      document.body.appendChild(this.container)
    }

    attachEventListeners() {
      this.button.addEventListener("click", () => this.toggle())

      // Listen for messages from iframe
      window.addEventListener("message", (event) => {
        if (event.origin !== config.baseUrl) return

        if (event.data.type === "VOICE_AGENT_CLOSE") {
          this.close()
        }
      })

      // Close on escape key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen) {
          this.close()
        }
      })
    }

    toggle() {
      if (this.isOpen) {
        this.close()
      } else {
        this.open()
      }
    }

    open() {
      this.isOpen = true
      this.container.classList.add("open")
      this.button.classList.add("active")

      // Send message to iframe that widget is open
      this.iframe.contentWindow.postMessage({ type: "VOICE_AGENT_OPENED" }, config.baseUrl)
    }

    close() {
      this.isOpen = false
      this.container.classList.remove("open")
      this.button.classList.remove("active")

      // Send message to iframe that widget is closed
      this.iframe.contentWindow.postMessage({ type: "VOICE_AGENT_CLOSED" }, config.baseUrl)
    }
  }

  // Initialize widget
  window.VoiceAgentWidget = new VoiceAgentWidget()

  // Expose API
  window.VoiceAgent = {
    open: () => window.VoiceAgentWidget.open(),
    close: () => window.VoiceAgentWidget.close(),
    toggle: () => window.VoiceAgentWidget.toggle(),
  }

  console.log("Voice Agent Widget loaded successfully")
})()
