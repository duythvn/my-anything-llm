const { FallbackSystem } = require('../../../utils/vectorDbProviders/FallbackSystem');

describe('FallbackSystem', () => {
    let fallback;
    
    beforeEach(() => {
        fallback = new FallbackSystem();
    });
    
    describe('Component initialization', () => {
        it('should initialize with default configuration', () => {
            expect(fallback.config).toBeDefined();
            expect(fallback.config.confidenceThreshold).toBe(0.5);
            expect(fallback.config.escalationThreshold).toBe(0.3);
        });
        
        it('should initialize with custom configuration', () => {
            const customFallback = new FallbackSystem({
                confidenceThreshold: 0.7,
                escalationThreshold: 0.2
            });
            
            expect(customFallback.config.confidenceThreshold).toBe(0.7);
            expect(customFallback.config.escalationThreshold).toBe(0.2);
        });
    });
    
    describe('processFallback method', () => {
        it('should handle low confidence query results', async () => {
            const queryResult = {
                sources: [],
                confidence: 0.2,
                query: 'obscure technical query'
            };
            
            const response = await fallback.processFallback(queryResult, {});
            
            expect(response).toBeDefined();
            expect(typeof response).toBe('object');
        });
        
        it('should pass through high confidence results', async () => {
            const queryResult = {
                sources: [{ content: 'Good match', score: 0.9 }],
                confidence: 0.8,
                query: 'clear query'
            };
            
            const response = await fallback.processFallback(queryResult, {});
            
            expect(response).toBeDefined();
        });
    });
    
    describe('Strategy methods', () => {
        it('should have all expected strategy handlers', () => {
            expect(fallback.strategyHandlers.expandSearch).toBeDefined();
            expect(fallback.strategyHandlers.semanticAlternatives).toBeDefined();
            expect(fallback.strategyHandlers.categoryBroadening).toBeDefined();
            expect(fallback.strategyHandlers.generalKnowledge).toBeDefined();
            expect(fallback.strategyHandlers.humanEscalation).toBeDefined();
        });
    });
});