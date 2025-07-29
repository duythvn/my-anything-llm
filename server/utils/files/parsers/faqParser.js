/**
 * Phase 1.2: FAQ Pattern Detector
 * Identifies question-answer patterns in documents and extracts structured FAQ data
 * Supports multiple FAQ formats and provides confidence scoring
 */
class FAQParser {
  constructor(options = {}) {
    this.options = {
      // Question patterns to detect
      questionPatterns: [
        // Direct question formats
        /^(Q\s*\d*[:.])?\s*(.+\?)\s*$/gim,
        /^(Question\s*\d*[:.])?\s*(.+\?)\s*$/gim,
        /^(FAQ\s*\d*[:.])?\s*(.+\?)\s*$/gim,
        
        // Common question starters
        /^(Q\s*\d*[:.])?\s*(What|How|Why|When|Where|Who|Which|Can|Could|Should|Would|Will|Is|Are|Do|Does|Did)\s+.+\??\s*$/gim,
        
        // Numbered questions
        /^\d+\.\s*(.+\?)\s*$/gim,
        
        // Bulleted questions
        /^[•\-\*]\s*(.+\?)\s*$/gim
      ],

      // Answer patterns
      answerPatterns: [
        // Direct answer formats
        /^(A\s*\d*[:.])?\s*(.+)$/gim,
        /^(Answer\s*\d*[:.])?\s*(.+)$/gim,
        
        // Following paragraph after question
        /^(.+)$/gim
      ],

      // Section indicators that suggest FAQ content
      sectionIndicators: [
        'faq', 'frequently asked questions', 'questions and answers', 'q&a', 'q and a',
        'common questions', 'help', 'support', 'troubleshooting', 'problems',
        'issues', 'solutions', 'guide', 'manual', 'documentation'
      ],

      // Minimum confidence threshold for extraction
      minConfidence: 0.3,

      // Maximum distance between Q&A pairs (in lines)
      maxQADistance: 5,

      // Minimum question length
      minQuestionLength: 10,
      minAnswerLength: 5,

      // Maximum question/answer length (prevent extracting entire paragraphs)
      maxQuestionLength: 500,
      maxAnswerLength: 2000,

      ...options
    };

    this.results = {
      faqs: [],
      sections: [],
      errors: [],
      stats: {
        totalLines: 0,
        questionsFound: 0,
        answersFound: 0,
        pairsCreated: 0,
        sectionsFound: 0
      }
    };
  }

  /**
   * Parse FAQ content from text
   * @param {string} text - Document text content
   * @param {object} metadata - Document metadata
   * @returns {object} - Parsed FAQ results
   */
  parseFromText(text, metadata = {}) {
    console.log('FAQ Parser - Starting FAQ extraction...');
    
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for FAQ parsing');
    }

    // Split text into lines for processing
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    this.results.stats.totalLines = lines.length;

    // Detect FAQ sections
    const sections = this._detectFAQSections(lines);
    this.results.sections = sections;
    this.results.stats.sectionsFound = sections.length;

    // Extract Q&A pairs from each section
    for (const section of sections) {
      const sectionFAQs = this._extractQAPairs(
        lines.slice(section.startLine, section.endLine + 1),
        section.startLine,
        section
      );
      this.results.faqs.push(...sectionFAQs);
    }

    // If no clear sections found, try parsing entire document
    if (sections.length === 0) {
      console.log('FAQ Parser - No clear FAQ sections found, parsing entire document');
      const documentFAQs = this._extractQAPairs(lines, 0, {
        title: 'Document FAQ',
        confidence: 0.4,
        type: 'document_wide'
      });
      this.results.faqs.push(...documentFAQs);
    }

    // Add metadata to all FAQs
    this.results.faqs = this.results.faqs.map(faq => ({
      ...faq,
      sourceDocument: metadata.title || 'Unknown',
      sourceDocId: metadata.docId || null,
      extractedAt: new Date().toISOString()
    }));

    console.log(`FAQ Parser - Extracted ${this.results.faqs.length} FAQ pairs from ${sections.length} sections`);
    
    return this._formatResults();
  }

  /**
   * Detect FAQ sections in document
   * @private
   */
  _detectFAQSections(lines) {
    const sections = [];
    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Check if line indicates start of FAQ section
      const sectionMatch = this.options.sectionIndicators.find(indicator => 
        line.includes(indicator)
      );

      if (sectionMatch) {
        // End previous section if exists
        if (currentSection) {
          currentSection.endLine = i - 1;
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          title: lines[i],
          startLine: i,
          endLine: lines.length - 1, // Will be updated when next section found or at end
          indicator: sectionMatch,
          confidence: this._calculateSectionConfidence(line, sectionMatch),
          type: 'detected_section'
        };
      }
    }

    // Close last section
    if (currentSection) {
      sections.push(currentSection);
    }

    // If no sections found but document seems FAQ-like, create one big section
    if (sections.length === 0 && this._documentLooksFAQLike(lines)) {
      sections.push({
        title: 'Document FAQ',
        startLine: 0,
        endLine: lines.length - 1,
        indicator: 'document_analysis',
        confidence: 0.5,
        type: 'inferred_section'
      });
    }

    return sections;
  }

  /**
   * Extract Q&A pairs from lines
   * @private
   */
  _extractQAPairs(lines, baseLineNumber, section) {
    const faqs = [];
    const potentialQuestions = [];
    const potentialAnswers = [];

    // First pass: identify potential questions and answers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for question patterns
      for (const pattern of this.options.questionPatterns) {
        pattern.lastIndex = 0; // Reset regex
        const match = pattern.exec(line);
        if (match) {
          const questionText = match[match.length - 1] || match[0]; // Get the captured group or full match
          
          if (this._isValidQuestion(questionText)) {
            potentialQuestions.push({
              text: questionText.trim(),
              lineIndex: i,
              absoluteLineNumber: baseLineNumber + i,
              confidence: this._calculateQuestionConfidence(questionText, line),
              originalLine: line
            });
            break; // Don't match multiple patterns on same line
          }
        }
      }

      // Check for answer patterns (only if not already identified as question)
      if (!potentialQuestions.some(q => q.lineIndex === i)) {
        const answerCandidate = line.trim();
        if (this._isValidAnswer(answerCandidate)) {
          potentialAnswers.push({
            text: answerCandidate,
            lineIndex: i,
            absoluteLineNumber: baseLineNumber + i,
            confidence: this._calculateAnswerConfidence(answerCandidate),
            originalLine: line
          });
        }
      }
    }

    this.results.stats.questionsFound += potentialQuestions.length;
    this.results.stats.answersFound += potentialAnswers.length;

    // Second pass: pair questions with answers
    for (const question of potentialQuestions) {
      const answer = this._findBestAnswer(question, potentialAnswers);
      
      if (answer) {
        const faq = {
          id: `faq_${section.title?.replace(/\s+/g, '_') || 'unknown'}_${faqs.length}`,
          question: question.text,
          answer: answer.text,
          questionLine: question.absoluteLineNumber,
          answerLine: answer.absoluteLineNumber,
          section: section.title,
          confidence: (question.confidence + answer.confidence) / 2,
          metadata: {
            questionOriginal: question.originalLine,
            answerOriginal: answer.originalLine,
            sectionType: section.type,
            sectionConfidence: section.confidence,
            distance: Math.abs(answer.lineIndex - question.lineIndex)
          }
        };

        // Only include FAQs above minimum confidence
        if (faq.confidence >= this.options.minConfidence) {
          faqs.push(faq);
          this.results.stats.pairsCreated++;
        }
      }
    }

    return faqs;
  }

  /**
   * Find best answer for a question
   * @private
   */
  _findBestAnswer(question, potentialAnswers) {
    const candidates = potentialAnswers.filter(answer => {
      const distance = Math.abs(answer.lineIndex - question.lineIndex);
      return distance <= this.options.maxQADistance && distance > 0;
    });

    if (candidates.length === 0) return null;

    // Sort by proximity and confidence
    candidates.sort((a, b) => {
      const distanceA = Math.abs(a.lineIndex - question.lineIndex);
      const distanceB = Math.abs(b.lineIndex - question.lineIndex);
      
      // Prefer closer answers, but also consider confidence
      const scoreA = a.confidence - (distanceA * 0.1);
      const scoreB = b.confidence - (distanceB * 0.1);
      
      return scoreB - scoreA;
    });

    return candidates[0];
  }

  /**
   * Check if document looks FAQ-like
   * @private
   */
  _documentLooksFAQLike(lines) {
    let questionCount = 0;
    let questionWords = 0;

    for (const line of lines) {
      if (line.includes('?')) questionCount++;
      
      const words = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'should'];
      for (const word of words) {
        if (line.toLowerCase().includes(word)) questionWords++;
      }
    }

    const questionRatio = questionCount / lines.length;
    const questionWordRatio = questionWords / lines.length;

    return questionRatio > 0.1 || questionWordRatio > 0.2;
  }

  /**
   * Validate question text
   * @private
   */
  _isValidQuestion(text) {
    if (!text || text.length < this.options.minQuestionLength || text.length > this.options.maxQuestionLength) {
      return false;
    }

    // Should end with question mark or contain question words
    const hasQuestionMark = text.includes('?');
    const hasQuestionWords = /\b(what|how|why|when|where|who|which|can|could|should|would|will|is|are|do|does|did)\b/i.test(text);

    return hasQuestionMark || hasQuestionWords;
  }

  /**
   * Validate answer text
   * @private
   */
  _isValidAnswer(text) {
    return text && 
           text.length >= this.options.minAnswerLength && 
           text.length <= this.options.maxAnswerLength &&
           !text.endsWith('?'); // Answers shouldn't end with questions
  }

  /**
   * Calculate section confidence
   * @private
   */
  _calculateSectionConfidence(line, indicator) {
    let confidence = 0.5;

    // Boost for exact matches
    if (line.includes('frequently asked questions')) confidence += 0.3;
    else if (line.includes('faq')) confidence += 0.2;
    else if (line.includes('q&a')) confidence += 0.2;

    // Boost for section formatting
    if (/^#+\s/.test(line)) confidence += 0.1; // Markdown heading
    if (line.toUpperCase() === line) confidence += 0.1; // All caps

    return Math.min(1, confidence);
  }

  /**
   * Calculate question confidence
   * @private
   */
  _calculateQuestionConfidence(text, originalLine) {
    let confidence = 0.5;

    // Question mark boost
    if (text.includes('?')) confidence += 0.2;

    // Question word boost
    if (/^(what|how|why|when|where|who|which)/i.test(text)) confidence += 0.2;

    // Formatting boost
    if (/^(q\s*\d*[:.]|question\s*\d*[:.])/i.test(originalLine)) confidence += 0.2;

    // Length consideration
    if (text.length > 20 && text.length < 200) confidence += 0.1;

    return Math.min(1, confidence);
  }

  /**
   * Calculate answer confidence
   * @private
   */
  _calculateAnswerConfidence(text) {
    let confidence = 0.4;

    // Length consideration
    if (text.length > 15 && text.length < 500) confidence += 0.2;

    // Sentence structure
    if (text.includes('.') || text.includes(',')) confidence += 0.1;

    // Avoid questions as answers
    if (text.includes('?')) confidence -= 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Format final results
   * @private
   */
  _formatResults() {
    return {
      success: true,
      faqs: this.results.faqs,
      sections: this.results.sections,
      metadata: {
        totalLines: this.results.stats.totalLines,
        questionsFound: this.results.stats.questionsFound,
        answersFound: this.results.stats.answersFound,
        pairsCreated: this.results.stats.pairsCreated,
        sectionsFound: this.results.stats.sectionsFound,
        extractionDate: new Date().toISOString()
      },
      errors: this.results.errors,
      summary: `Extracted ${this.results.stats.pairsCreated} FAQ pairs from ${this.results.stats.sectionsFound} sections`
    };
  }

  /**
   * Static method to quickly parse FAQs from text
   * @param {string} text 
   * @param {object} metadata 
   * @param {object} options 
   * @returns {object}
   */
  static parseText(text, metadata = {}, options = {}) {
    const parser = new FAQParser(options);
    return parser.parseFromText(text, metadata);
  }

  /**
   * Create embeddings-ready FAQ data
   * @param {Array} faqs - Parsed FAQ array
   * @returns {Array} - FAQ data structured for vector embedding
   */
  static createEmbeddingData(faqs) {
    return faqs.map(faq => ({
      id: faq.id,
      content: `Q: ${faq.question}\nA: ${faq.answer}`,
      metadata: {
        type: 'faq',
        question: faq.question,
        answer: faq.answer,
        section: faq.section,
        confidence: faq.confidence,
        sourceDocument: faq.sourceDocument,
        sourceDocId: faq.sourceDocId,
        questionLine: faq.questionLine,
        answerLine: faq.answerLine,
        ...faq.metadata
      }
    }));
  }
}

module.exports = { FAQParser };