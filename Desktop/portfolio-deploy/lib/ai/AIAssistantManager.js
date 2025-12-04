/**
 * AI ASSISTANT MANAGER
 * Advanced AI integration with multiple providers
 * Features: Chat, Vision, Voice, Content Generation, Recommendations
 */

class AIAssistantManager {
  constructor(config) {
    this.config = config.ai;
    this.conversationHistory = [];
    this.contextWindow = [];
    this.maxContextLength = 10;
    this.providers = {
      openai: null,
      anthropic: null,
      stability: null
    };
    this.currentProvider = 'openai';
    this.initialized = false;
  }

  /**
   * Initialize AI systems
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize OpenAI
      if (this.config.providers.openai.enabled) {
        const { Configuration, OpenAIApi } = await import('openai');
        const configuration = new Configuration({
          apiKey: this.config.providers.openai.apiKey
        });
        this.providers.openai = new OpenAIApi(configuration);
      }

      // Initialize other providers as needed
      this.initialized = true;
      console.log('✅ AI Assistant initialized');
    } catch (error) {
      console.error('AI initialization error:', error);
      throw error;
    }
  }

  /**
   * Chat with AI assistant
   */
  async chat(message, options = {}) {
    await this.initialize();

    const {
      systemPrompt = this.getDefaultSystemPrompt(),
      temperature = 0.7,
      maxTokens = 1000,
      stream = false,
      onChunk = null
    } = options;

    try {
      // Add message to history
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: Date.now()
      });

      // Build messages array
      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.getRecentContext(),
        { role: 'user', content: message }
      ];

      // Get response from AI
      let response;

      if (this.currentProvider === 'openai') {
        response = await this.providers.openai.createChatCompletion({
          model: this.config.providers.openai.models.chat,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream
        });

        const assistantMessage = response.data.choices[0].message.content;

        // Add to history
        this.conversationHistory.push({
          role: 'assistant',
          content: assistantMessage,
          timestamp: Date.now()
        });

        // Track analytics
        this.trackEvent('ai_chat', {
          messageLength: message.length,
          responseLength: assistantMessage.length,
          provider: this.currentProvider
        });

        return {
          content: assistantMessage,
          usage: response.data.usage,
          model: response.data.model
        };
      }

      throw new Error(`Provider ${this.currentProvider} not implemented`);

    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Analyze image with AI vision
   */
  async analyzeImage(imageUrl, prompt = 'Describe this image in detail') {
    await this.initialize();

    try {
      const response = await this.providers.openai.createChatCompletion({
        model: this.config.providers.openai.models.vision,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }],
        max_tokens: 1000
      });

      const analysis = response.data.choices[0].message.content;

      this.trackEvent('ai_vision', {
        imageUrl,
        promptLength: prompt.length
      });

      return {
        analysis,
        confidence: this.extractConfidence(analysis),
        tags: this.extractTags(analysis)
      };

    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate image with AI
   */
  async generateImage(prompt, options = {}) {
    await this.initialize();

    const {
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid',
      n = 1
    } = options;

    try {
      if (this.config.providers.openai.enabled) {
        const response = await this.providers.openai.createImage({
          prompt,
          n,
          size,
          quality,
          style
        });

        const images = response.data.data.map(img => ({
          url: img.url,
          revisedPrompt: img.revised_prompt
        }));

        this.trackEvent('ai_image_generation', {
          prompt: prompt.substring(0, 100),
          count: n,
          size
        });

        return images;
      }

      throw new Error('Image generation not available');

    } catch (error) {
      console.error('Image generation error:', error);
      throw error;
    }
  }

  /**
   * Text-to-Speech conversion
   */
  async textToSpeech(text, options = {}) {
    await this.initialize();

    const {
      voice = 'alloy',
      model = 'tts-1-hd',
      speed = 1.0
    } = options;

    try {
      const response = await this.providers.openai.createSpeech({
        model,
        voice,
        input: text,
        speed
      });

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      this.trackEvent('ai_tts', {
        textLength: text.length,
        voice,
        model
      });

      return {
        audioUrl,
        blob: audioBlob,
        duration: this.estimateAudioDuration(text, speed)
      };

    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  }

  /**
   * Speech-to-Text conversion
   */
  async speechToText(audioFile, options = {}) {
    await this.initialize();

    const {
      language = 'es',
      prompt = null
    } = options;

    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', this.config.providers.openai.models.stt);
      if (language) formData.append('language', language);
      if (prompt) formData.append('prompt', prompt);

      const response = await this.providers.openai.createTranscription(formData);

      this.trackEvent('ai_stt', {
        audioSize: audioFile.size,
        language
      });

      return {
        text: response.data.text,
        language: response.data.language,
        duration: response.data.duration
      };

    } catch (error) {
      console.error('STT error:', error);
      throw error;
    }
  }

  /**
   * Generate content recommendations
   */
  async generateRecommendations(userProfile, context = {}) {
    await this.initialize();

    const prompt = this.buildRecommendationPrompt(userProfile, context);

    try {
      const response = await this.chat(prompt, {
        temperature: 0.8,
        maxTokens: 1500
      });

      const recommendations = this.parseRecommendations(response.content);

      this.trackEvent('ai_recommendations', {
        count: recommendations.length,
        context: Object.keys(context)
      });

      return recommendations;

    } catch (error) {
      console.error('Recommendations error:', error);
      throw error;
    }
  }

  /**
   * Content generation (blog posts, descriptions, etc.)
   */
  async generateContent(type, params = {}) {
    await this.initialize();

    const prompt = this.buildContentPrompt(type, params);

    try {
      const response = await this.chat(prompt, {
        temperature: 0.7,
        maxTokens: 2000
      });

      this.trackEvent('ai_content_generation', {
        type,
        contentLength: response.content.length
      });

      return {
        content: response.content,
        metadata: {
          type,
          generatedAt: Date.now(),
          model: response.model
        }
      };

    } catch (error) {
      console.error('Content generation error:', error);
      throw error;
    }
  }

  /**
   * Smart product description generator
   */
  async generateProductDescription(product) {
    const prompt = `Generate a compelling product description for:
Product Name: ${product.name}
Category: ${product.category}
Features: ${product.features?.join(', ') || 'N/A'}
Price: ${product.price}

Create a professional, engaging description that highlights benefits and includes SEO keywords.
Format: 2-3 paragraphs, professional tone.`;

    const response = await this.chat(prompt, {
      temperature: 0.7,
      maxTokens: 500
    });

    return response.content;
  }

  /**
   * Sentiment analysis
   */
  async analyzeSentiment(text) {
    const prompt = `Analyze the sentiment of the following text and provide:
1. Overall sentiment (positive, negative, neutral)
2. Sentiment score (-1 to 1)
3. Key emotions detected
4. Confidence level (0-1)

Text: "${text}"

Respond in JSON format.`;

    const response = await this.chat(prompt, {
      temperature: 0.3,
      maxTokens: 300
    });

    try {
      const analysis = JSON.parse(response.content);
      return analysis;
    } catch {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0.5
      };
    }
  }

  /**
   * Smart email composer
   */
  async composeEmail(purpose, details) {
    const prompt = `Compose a professional email for: ${purpose}

Details:
${Object.entries(details).map(([key, value]) => `${key}: ${value}`).join('\n')}

Requirements:
- Professional tone
- Clear and concise
- Include appropriate greetings and sign-off
- Action-oriented when applicable`;

    const response = await this.chat(prompt, {
      temperature: 0.6,
      maxTokens: 800
    });

    return {
      subject: this.extractEmailSubject(response.content),
      body: response.content
    };
  }

  /**
   * Code explanation and help
   */
  async explainCode(code, language = 'javascript') {
    const prompt = `Explain the following ${language} code in detail:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Overall purpose
2. Step-by-step breakdown
3. Key concepts used
4. Potential improvements
5. Common use cases`;

    const response = await this.chat(prompt, {
      temperature: 0.5,
      maxTokens: 1500
    });

    return response.content;
  }

  /**
   * Translation service
   */
  async translate(text, targetLanguage, sourceLanguage = 'auto') {
    const prompt = `Translate the following text ${sourceLanguage !== 'auto' ? `from ${sourceLanguage}` : ''} to ${targetLanguage}:

"${text}"

Provide only the translation, maintaining the original tone and context.`;

    const response = await this.chat(prompt, {
      temperature: 0.3,
      maxTokens: Math.max(text.length * 2, 500)
    });

    return response.content;
  }

  /**
   * Get default system prompt for the assistant
   */
  getDefaultSystemPrompt() {
    return `You are an advanced AI assistant for Nacho's professional portfolio platform.
You help users with:
- Information about digital services (video editing, design, blockchain, AI, etc.)
- Web3 and cryptocurrency questions
- Technical support and guidance
- Service recommendations
- General inquiries

Be professional, helpful, and concise. Provide accurate information and ask clarifying questions when needed.
Always maintain a friendly and expert tone.`;
  }

  /**
   * Build recommendation prompt
   */
  buildRecommendationPrompt(userProfile, context) {
    return `Based on the following user profile and context, recommend suitable services:

User Profile:
- Interests: ${userProfile.interests?.join(', ') || 'General'}
- Previous Interactions: ${userProfile.previousServices?.join(', ') || 'None'}
- Budget Range: ${userProfile.budgetRange || 'Not specified'}

Context:
${Object.entries(context).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Provide 3-5 personalized recommendations with brief explanations.`;
  }

  /**
   * Build content generation prompt
   */
  buildContentPrompt(type, params) {
    const prompts = {
      blogPost: `Write a blog post about: ${params.topic}
Target audience: ${params.audience || 'General'}
Tone: ${params.tone || 'Professional'}
Length: ${params.length || 'Medium'} (500-800 words)
Include SEO keywords: ${params.keywords?.join(', ') || 'N/A'}`,

      productDescription: `Create a product description for:
${JSON.stringify(params.product, null, 2)}`,

      socialMedia: `Create ${params.platform || 'social media'} post about: ${params.topic}
Tone: ${params.tone || 'Engaging'}
Include hashtags: ${params.includeHashtags !== false}
Character limit: ${params.maxLength || 280}`,

      emailCampaign: `Create an email campaign for: ${params.campaign}
Target: ${params.target}
Goal: ${params.goal}
Tone: ${params.tone || 'Professional'}`
    };

    return prompts[type] || `Generate content for: ${type}\n${JSON.stringify(params)}`;
  }

  /**
   * Get recent conversation context
   */
  getRecentContext() {
    return this.conversationHistory.slice(-this.maxContextLength);
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    this.contextWindow = [];
  }

  /**
   * Extract confidence from response
   */
  extractConfidence(text) {
    // Simple confidence extraction (can be improved)
    const confidenceMatches = text.match(/confidence[:\s]+(\d+\.?\d*)%?/i);
    return confidenceMatches ? parseFloat(confidenceMatches[1]) / 100 : 0.8;
  }

  /**
   * Extract tags from response
   */
  extractTags(text) {
    // Extract potential tags (simple implementation)
    const words = text.toLowerCase().split(/\W+/);
    const commonWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but']);
    return words
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 5);
  }

  /**
   * Estimate audio duration
   */
  estimateAudioDuration(text, speed) {
    // Rough estimate: ~150 words per minute at normal speed
    const words = text.split(/\s+/).length;
    const minutes = (words / 150) / speed;
    return minutes * 60; // return in seconds
  }

  /**
   * Parse recommendations from AI response
   */
  parseRecommendations(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const recommendations = [];

    lines.forEach(line => {
      const match = line.match(/^\d+\.\s*(.+)/);
      if (match) {
        recommendations.push({
          title: match[1].split(':')[0].trim(),
          description: match[1].split(':')[1]?.trim() || '',
          confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0
        });
      }
    });

    return recommendations;
  }

  /**
   * Extract email subject from response
   */
  extractEmailSubject(content) {
    const subjectMatch = content.match(/Subject:\s*(.+)/i);
    return subjectMatch ? subjectMatch[1].trim() : 'Your Email Subject';
  }

  /**
   * Track AI events
   */
  trackEvent(eventName, properties) {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackEvent(`ai_${eventName}`, {
        ...properties,
        provider: this.currentProvider,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Set provider
   */
  setProvider(provider) {
    if (this.providers[provider]) {
      this.currentProvider = provider;
    } else {
      throw new Error(`Provider ${provider} not available`);
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return Object.keys(this.providers).filter(key => this.providers[key] !== null);
  }

  /**
   * Check if initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

// Singleton instance
let aiAssistantManager = null;

export const getAIAssistantManager = (config) => {
  if (!aiAssistantManager) {
    aiAssistantManager = new AIAssistantManager(config);
  }
  return aiAssistantManager;
};

export default AIAssistantManager;
