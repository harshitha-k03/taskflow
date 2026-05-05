/**
 * AI API Key Rotator
 * 
 * Manages pools of API keys for multiple LLM providers (Groq, Gemini).
 * Implements round-robin selection with cooldown-on-failure and automatic
 * fallback from primary provider (Groq) to secondary (Gemini).
 */

class AIKeyRotator {
  constructor() {
    // Scan numbered env vars: GROQ_API_KEY_1, GROQ_API_KEY_2, ...
    this.providers = {
      groq: {
        keys: this._collectKeys('GROQ_API_KEY'),
        model: 'llama-3.3-70b-versatile',
        currentIndex: 0,
        cooldowns: {},       // key -> cooldown expiry timestamp
        lastUsed: {},        // key -> last usage timestamp
        baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      },
      gemini: {
        keys: this._collectKeys('GEMINI_API_KEY'),
        model: 'gemini-2.0-flash',
        currentIndex: 0,
        cooldowns: {},
        lastUsed: {},
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      },
    };

    // Priority order: Groq first, then Gemini fallback
    this.providerOrder = ['groq', 'gemini'];

    const groqCount = this.providers.groq.keys.length;
    const geminiCount = this.providers.gemini.keys.length;
    console.log(
      `🤖 AI Key Rotator initialized: ${groqCount} Groq key(s), ${geminiCount} Gemini key(s)`
    );

    if (groqCount === 0 && geminiCount === 0) {
      console.warn('⚠️  No AI API keys configured. Chatbot will be unavailable.');
    }
  }

  /**
   * Scan environment for numbered keys: PREFIX_1, PREFIX_2, ... up to PREFIX_10
   * @param {string} prefix - e.g. 'GROQ_API_KEY'
   * @returns {string[]}
   */
  _collectKeys(prefix) {
    const keys = [];
    for (let i = 1; i <= 10; i++) {
      const val = process.env[`${prefix}_${i}`];
      if (val && val.trim()) keys.push(val.trim());
    }
    return keys;
  }

  /**
   * Get the next available key, respecting cooldowns.
   * Falls back to secondary provider if all primary keys are on cooldown.
   * @returns {{ provider: string, key: string, model: string, baseUrl: string } | null}
   */
  getNextKey() {
    for (const providerName of this.providerOrder) {
      const provider = this.providers[providerName];
      if (provider.keys.length === 0) continue;

      const now = Date.now();
      // Try each key in the pool
      for (let i = 0; i < provider.keys.length; i++) {
        const idx = (provider.currentIndex + i) % provider.keys.length;
        const key = provider.keys[idx];
        const cooldownExpiry = provider.cooldowns[key] || 0;

        if (now >= cooldownExpiry) {
          // This key is available
          provider.currentIndex = (idx + 1) % provider.keys.length;
          provider.lastUsed[key] = now;
          return {
            provider: providerName,
            key,
            model: provider.model,
            baseUrl: provider.baseUrl,
          };
        }
      }
      // All keys for this provider are on cooldown — try next provider
    }

    return null; // All keys exhausted across all providers
  }

  /**
   * Mark a key as rate-limited (cooldown for specified seconds).
   * @param {string} providerName
   * @param {string} key
   * @param {number} cooldownSeconds - default 60s
   */
  markCooldown(providerName, key, cooldownSeconds = 60) {
    const provider = this.providers[providerName];
    if (!provider) return;
    provider.cooldowns[key] = Date.now() + cooldownSeconds * 1000;
    console.log(
      `⏳ Key ${key.slice(0, 8)}... (${providerName}) on cooldown for ${cooldownSeconds}s`
    );
  }

  /**
   * Get the current status of all key pools.
   * @returns {object}
   */
  getStatus() {
    const now = Date.now();
    const status = {};
    for (const [name, provider] of Object.entries(this.providers)) {
      status[name] = {
        totalKeys: provider.keys.length,
        availableKeys: provider.keys.filter(
          (k) => now >= (provider.cooldowns[k] || 0)
        ).length,
        model: provider.model,
      };
    }
    return status;
  }
}

// Singleton instance
const rotator = new AIKeyRotator();
module.exports = rotator;
